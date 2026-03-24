import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft, Vote, Trophy, Target, ChevronLeft, ChevronRight, TrendingUp, Flame,
  User, Users, Share2, Award, Medal, Crown, Clock, Lock, LogIn, Mic, Mail, Eye, Check, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  fetchMatches,
  type Match, type Team, type Player, COMPETITION_ID,
} from '../lib/public-supabase';
import { useAuth } from '../lib/auth-context';
import { logoUrl, photoUrl } from '../lib/image-utils';
import { type UserProfile } from '../lib/auth';
import { LoginGate } from '../components/public/LoginGate';
import { SectionHeader } from '../components/public/SectionHeader';
import {
  getVoteResults, submitVote,
  submitPrediction, submitPredictionsBatch,
  FORMATION, mapPlayerToVotingPosition, getPositionLabel,
  shareContent, generateSelectionShareText,
  generateStoryImage, shareStoryImage,
  getCachedDisplayName, getProfile,
  getSelecaoBatch, getBolaoBatch, getBolaoStats,
  getRoundControl,
} from '../lib/galera-api';
import { LivePct } from '../components/public/LiveOdds';
import { AuthModal } from '../components/public/AuthModal';
import { PageTransition } from '../components/public/PageTransition';
import { GaleraSkeleton } from '../components/public/Skeletons';
import { getCachedSelecaoBatch, clearGaleraPrefetch } from '../lib/galera-prefetch';
import { toast } from 'sonner@2.0.3';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';

// ============================
// LOCAL CACHE for predictions (survives token failures + page reloads)
// Keyed by userId to avoid cross-user cache pollution
// ============================
// CACHE TTL: 7 dias (palpites não expiram rápido — usuário pode voltar após dias)
const PREDS_CACHE_TTL = 7 * 24 * 60 * 60 * 1000;
const PREDS_KEY_PREFIX = 'power_bolao_preds_';

function getPredsCacheKey(userId: string | null) {
  return `${PREDS_KEY_PREFIX}${userId || 'anon'}`;
}
function cachePredictions(preds: Record<string, any>, userId: string | null) {
  if (!userId) return; // nunca cacheia como anon se não tiver userId
  try {
    if (Object.keys(preds).length > 0) {
      localStorage.setItem(getPredsCacheKey(userId), JSON.stringify({ preds, ts: Date.now() }));
    }
  } catch { /* ignore */ }
}
function getCachedPredictions(userId: string | null): Record<string, any> | null {
  if (!userId) return null; // não lê cache anon
  try {
    const raw = localStorage.getItem(getPredsCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > PREDS_CACHE_TTL) {
      localStorage.removeItem(getPredsCacheKey(userId)); // limpa expirado
      return null;
    }
    return parsed.preds || null;
  } catch { return null; }
}
// Remove chaves antigas e de outros usuários do localStorage
// Chamado uma vez na montagem do componente, com o userId atual
function cleanOldPredsCaches(currentUserId: string | null) {
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      // Chave legada sem prefixo userId (versão antiga)
      if (key === 'power_bolao_preds') { toRemove.push(key); continue; }
      // Chave de outro usuário (ou anon)
      if (key.startsWith(PREDS_KEY_PREFIX)) {
        const keyUserId = key.slice(PREDS_KEY_PREFIX.length);
        if (keyUserId !== (currentUserId || 'anon')) {
          toRemove.push(key);
        }
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    if (toRemove.length > 0) console.log('[Bolao] Cache cleanup — removidas chaves antigas:', toRemove);
  } catch { /* ignore */ }
}

// ============================
// TAB DEFINITIONS
// ============================
const TABS = [
  { id: 'selecao', label: 'Seleção', icon: Award },
  { id: 'bolao', label: 'Bolão', icon: Target },
];

// ============================
// VALID MATCH FILTER
// Filtra partidas inválidas (ex: time contra ele mesmo, placeholders)
// ============================
function isValidMatch(m: Match): boolean {
  // Filtrar partidas onde o time joga contra ele mesmo (placeholders de semifinal/final)
  if (m.home_team_id && m.away_team_id && m.home_team_id === m.away_team_id) return false;
  return true;
}

// ============================
// ACTIVE ROUND DETECTION
// mode='selecao': Prioriza 1. Ao vivo, 2. Última finalizada, 3. Próxima agendada
// mode='bolao':   Prioriza 1. Ao vivo, 2. Próxima agendada, 3. Última finalizada
// ============================
function detectActiveRound(matches: Match[], mode: 'selecao' | 'bolao' = 'bolao'): number | null {
  // Filtrar apenas partidas válidas
  const validMatches = matches.filter(isValidMatch);
  if (validMatches.length === 0) return null;
  
  const now = new Date();
  
  // 1. Rodada em andamento (status = 'in_progress') — prioridade máxima em ambos os modos
  const liveMatches = validMatches.filter(m => m.status === 'in_progress');
  if (liveMatches.length > 0) {
    return Math.min(...liveMatches.map(m => m.round_number));
  }
  
  // 2a. SELEÇÃO: prioriza a última rodada finalizada (para votação pós-jogo)
  if (mode === 'selecao') {
    const finishedRounds = [...new Set(
      validMatches
        .filter(m => m.status === 'finished')
        .map(m => m.round_number)
    )].sort((a, b) => b - a);
    
    if (finishedRounds.length > 0) {
      return finishedRounds[0]; // última rodada concluída
    }
    
    // Fallback: próxima agendada (campeonato ainda não começou)
    const upcoming = validMatches
      .filter(m => (m.status === 'scheduled' || m.status === 'upcoming') && new Date(m.match_date).getTime() > now.getTime())
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    return upcoming.length > 0 ? upcoming[0].round_number : 1;
  }
  
  // 2b. BOLÃO: prioriza a próxima rodada agendada (para palpites pré-jogo)
  const upcomingMatches = validMatches
    .filter(m => (m.status === 'scheduled' || m.status === 'upcoming') && new Date(m.match_date).getTime() > now.getTime())
    .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
  
  if (upcomingMatches.length > 0) {
    return upcomingMatches[0].round_number;
  }
  
  // 3. Fallback: última rodada finalizada
  const finishedRounds = [...new Set(
    validMatches
      .filter(m => m.status === 'finished')
      .map(m => m.round_number)
  )].sort((a, b) => b - a);
  
  return finishedRounds.length > 0 ? finishedRounds[0] : 1;
}

// ============================
// EMBARGO DATE CALCULATION
// Result of Seleção is embargoed until Monday 20:00 (when the TV program airs).
// Given a round's matches, find the last match date, then compute the
// next Monday at 20:00 local time after that date.
// If that Monday has already passed, the embargo is lifted (return null).
// ============================
function getEmbargoDate(matches: Match[], roundNumber: number): Date | null {
  const roundMatches = matches
    .filter(m => m.round_number === roundNumber && isValidMatch(m))
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  if (roundMatches.length === 0) return null;

  const lastMatchDate = new Date(roundMatches[0].match_date);
  const now = new Date();
  
  // Find the next Monday at 20:00 after (or on) the last match
  const d = new Date(lastMatchDate);
  
  // If the last match is already on a Monday before 20:00, use that same Monday
  if (d.getDay() === 1 && d.getHours() < 20) {
    d.setHours(20, 0, 0, 0);
    // Check if this date hasn't passed yet
    if (d > now) return d;
  }
  
  // Otherwise, find the next Monday
  // Move to next day to start searching
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  
  // Find next Monday (day 1)
  while (d.getDay() !== 1) {
    d.setDate(d.getDate() + 1);
  }
  d.setHours(20, 0, 0, 0);
  
  // If the calculated embargo date has already passed, return null (embargo lifted)
  if (d <= now) return null;
  
  return d;
}

// ============================
// TEAM LOGO
// ============================
function TeamLogo({ url, name, size = 28 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.3 }}>
        {name.slice(0, 2)}
      </div>
    );
  }
  return <img src={logoUrl(url, size)} alt={name} width={size} height={size} loading="lazy" decoding="async" onError={() => setErr(true)} className="object-contain shrink-0" />;
}

// ============================
// CAMPINHO (Soccer Field Visual) — Premium Design
// ============================
function Campinho({
  winners,
  playerMap,
  teamMap,
  source,
  onSlotClick,
  myVotes,
  votingOpen,
  label,
  showVotePct = false,
  tallies,
}: {
  winners: Record<string, any>;
  playerMap: Record<string, any>;
  teamMap: Record<string, any>;
  source: 'galera' | 'arena';
  onSlotClick?: (position: string, slot: number) => void;
  myVotes?: Record<string, any>;
  votingOpen?: boolean;
  label?: string;
  showVotePct?: boolean;
  tallies?: Record<string, Record<string, { count: number }>>;
}) {
  // Grass stripe colors for alternating bands
  const SD = '#1b5e2e', SL = '#237a3b';
  return (
    <div className="relative w-full rounded-2xl overflow-hidden border-2 border-green-900/60 shadow-xl shadow-green-950/40"
      style={{ aspectRatio: '3/4.2' }}>
      {/* Grass stripes */}
      <div className="absolute inset-0" style={{
        background: `repeating-linear-gradient(180deg, ${SD} 0%, ${SD} 7.7%, ${SL} 7.7%, ${SL} 15.4%)`
      }} />
      {/* Ambient glow */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 30% at 50% 0%, rgba(34,197,94,0.15) 0%, transparent 70%)'
      }} />
      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%)'
      }} />

      {/* Field lines */}
      <div className="absolute inset-0">
        <div className="absolute inset-[3%] border-2 border-white/20 rounded-sm" />
        <div className="absolute top-[46%] left-[3%] right-[3%] h-[2px] bg-white/20" />
        <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28%] aspect-square rounded-full border-2 border-white/20" />
        <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white/30" />
        <div className="absolute top-[3%] left-1/2 -translate-x-1/2 w-[52%] h-[14%] border-b-2 border-l-2 border-r-2 border-white/15" />
        <div className="absolute top-[3%] left-1/2 -translate-x-1/2 w-[24%] h-[6%] border-b-2 border-l-2 border-r-2 border-white/15" />
        <div className="absolute top-[14.5%] left-1/2 -translate-x-1/2 w-[18%] h-[6%] rounded-b-full border-b-2 border-white/10" />
        <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 w-[52%] h-[12%] border-t-2 border-l-2 border-r-2 border-white/15" />
        <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 w-[24%] h-[5%] border-t-2 border-l-2 border-r-2 border-white/15" />
        <div className="absolute bottom-[12.5%] left-1/2 -translate-x-1/2 w-[18%] h-[5%] rounded-t-full border-t-2 border-white/10" />
        <div className="absolute top-[3%] left-[3%] w-3 h-3 border-b-2 border-r-2 border-white/15 rounded-br-full" />
        <div className="absolute top-[3%] right-[3%] w-3 h-3 border-b-2 border-l-2 border-white/15 rounded-bl-full" />
        <div className="absolute bottom-[3%] left-[3%] w-3 h-3 border-t-2 border-r-2 border-white/15 rounded-tr-full" />
        <div className="absolute bottom-[3%] right-[3%] w-3 h-3 border-t-2 border-l-2 border-white/15 rounded-tl-full" />
      </div>

      {/* Position slots */}
      {FORMATION.map(slot =>
        slot.coords.map((coord, idx) => {
          const key = `${slot.position}:${idx}`;
          const winner = winners[key];
          const voted = myVotes?.[key];
          const player = winner?.player_id ? playerMap[winner.player_id] : null;
          const team = winner?.team_id ? teamMap[winner.team_id] : null;
          const isCoach = slot.position === 'treinador';
          const name = isCoach ? (winner?.coach_name || '') : (player?.name || '');
          const isEmpty = !winner;
          const hasMyVote = !!voted;
          const sz = isEmpty ? 44 : isCoach ? 48 : 56;

          return (
            <button
              key={key}
              onClick={() => onSlotClick?.(slot.position, idx)}
              disabled={!onSlotClick}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all hover:scale-110 active:scale-95 group z-10"
              style={{ top: coord.top, left: coord.left }}
            >
              {/* Glow */}
              {!isEmpty && (
                <div className="absolute rounded-full blur-lg transition-all"
                  style={{ width: sz + 12, height: sz + 12, top: -(6), left: '50%', transform: 'translateX(-50%)',
                    background: hasMyVote ? 'rgba(74,222,128,0.25)' : 'rgba(255,255,255,0.08)' }} />
              )}
              {/* Avatar ring */}
              <div className="relative rounded-full flex items-center justify-center transition-all"
                style={{
                  width: sz, height: sz,
                  boxShadow: isEmpty ? 'none' : hasMyVote ? '0 0 20px rgba(74,222,128,0.3), inset 0 0 12px rgba(74,222,128,0.1)' : '0 4px 16px rgba(0,0,0,0.4)',
                  border: isEmpty ? '2px dashed rgba(255,255,255,0.25)' : hasMyVote ? '3px solid rgba(74,222,128,0.8)' : '3px solid rgba(255,255,255,0.5)',
                  background: isEmpty ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.3)',
                }}>
                {player?.photo_url ? (
                  <img src={photoUrl(player.photo_url, sz)} alt={name} width={sz - 6} height={sz - 6} loading="lazy" decoding="async" className="rounded-full object-cover" />
                ) : isEmpty ? (
                  <span className="text-white/30 text-xl font-light">+</span>
                ) : isCoach ? (
                  <span className="text-green-400 text-xs font-black tracking-wider">TC</span>
                ) : (
                  <User className="w-5 h-5 text-white/50" />
                )}
                {/* Team logo badge */}
                {team && (
                  <div className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-black/80 border-2 border-green-800 overflow-hidden shadow-md flex items-center justify-center">
                    <TeamLogo url={team.logo_url} name={team.short_name || ''} size={22} />
                  </div>
                )}
              </div>
              {/* Name tag */}
              <div className={`mt-0.5 px-2 py-0.5 rounded-md max-w-[84px] ${isEmpty ? '' : 'bg-black/60 backdrop-blur-sm'}`}>
                <span className={`text-[10px] font-bold text-center block truncate leading-tight ${isEmpty ? 'text-white/30' : 'text-white drop-shadow-sm'}`}
                  style={{ fontFamily: 'var(--font-heading)' }}>
                  {name || slot.label}
                </span>
              </div>
              {/* Vote percentage */}
              {showVotePct && winner?.count != null && winner.count > 0 && (() => {
                const posTotal = tallies?.[key]
                  ? Object.values(tallies[key]).reduce((s, c) => s + c.count, 0)
                  : winner.count;
                const pct = posTotal > 0 ? Math.round((winner.count / posTotal) * 100) : 0;
                return (
                  <div className="px-1.5 rounded-full bg-green-500/25 border border-green-400/40">
                    <span className="text-[8px] text-green-300 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                      {pct}%
                    </span>
                  </div>
                );
              })()}
            </button>
          );
        })
      )}

      {/* Source badge */}
      <div className="absolute top-3 left-3 z-20 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-1.5 border border-white/10">
        {source === 'galera' ? <Vote className="w-3 h-3 text-green-400" /> : <Mic className="w-3 h-3 text-green-400" />}
        <span className="text-[10px] text-white font-bold uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
          {label || (source === 'galera' ? 'Seleção da Galera' : 'Seleção do Arena')}
        </span>
      </div>

      {/* Status badge */}
      {votingOpen !== undefined && (
        <div className={`absolute top-3 right-3 z-20 px-3 py-1.5 rounded-lg backdrop-blur-md border ${
          votingOpen ? 'bg-green-500/20 border-green-400/30' : 'bg-red-500/20 border-red-400/30'
        }`}>
          <span className={`text-[10px] font-bold flex items-center gap-1 ${votingOpen ? 'text-green-300' : 'text-red-300'}`}>
            {votingOpen ? <><Vote className="w-3 h-3" /> Aberta</> : <><Lock className="w-3 h-3" /> Encerrada</>}
          </span>
        </div>
      )}
    </div>
  );
}

// ============================
// PLAYER SELECTION MODAL
// ============================
function PlayerSelectionModal({
  isOpen,
  onClose,
  position,
  slot,
  players,
  coaches,
  teamMap,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  position: string;
  slot: number;
  players: any[];
  coaches: any[];
  teamMap: Record<string, any>;
  onSelect: (data: { player_id?: string; team_id: string; coach_name?: string }) => void;
}) {
  const [search, setSearch] = useState('');
  const searchRef = React.useRef<HTMLInputElement>(null);

  // Lock background scroll when modal is open
  React.useEffect(() => {
    if (!isOpen) return;
    setSearch('');
    setTimeout(() => searchRef.current?.focus(), 300);
    // Block scroll on <main> and <body>
    const mainEl = document.querySelector('main');
    const prevMainOverflow = mainEl?.style.overflow || '';
    const prevBodyOverflow = document.body.style.overflow;
    if (mainEl) mainEl.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    return () => {
      if (mainEl) mainEl.style.overflow = prevMainOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const isCoach = position === 'treinador';
  const eligible = isCoach
    ? coaches
    : players.filter(p => mapPlayerToVotingPosition(p.position) === position);

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = normalize(search);

  const filtered = q
    ? eligible.filter((item: any) => {
        if (isCoach) {
          return normalize(item.coach_name || '').includes(q) || normalize(item.team_name || '').includes(q);
        }
        const team = teamMap[item.team_id];
        return normalize(item.name || '').includes(q) || normalize(team?.short_name || '').includes(q) || normalize(team?.name || '').includes(q);
      })
    : eligible;

  return (
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="absolute top-[52px] bottom-[72px] left-0 right-0 bg-background flex flex-col sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg sm:w-full border-border overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {getPositionLabel(position)}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-sm">Fechar</button>
        </div>

        {/* Search */}
        {eligible.length > 5 && (
          <div className="px-3 py-2 border-b border-border">
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar jogador ou time..."
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder-muted-foreground outline-none focus:border-primary"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-8">
              {q ? 'Nenhum resultado para a busca' : 'Nenhum jogador elegível'}
            </p>
          ) : isCoach ? (
            filtered.map((coach: any) => (
              <button
                key={coach.team_id}
                onClick={() => { onSelect({ team_id: coach.team_id, coach_name: coach.coach_name }); onClose(); }}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted transition-colors"
              >
                <TeamLogo url={coach.team_logo} name={coach.team_name} size={36} />
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{coach.coach_name}</p>
                  <p className="text-[10px] text-muted-foreground">{coach.team_name}</p>
                </div>
              </button>
            ))
          ) : (
            filtered.map((p: any) => {
              const team = teamMap[p.team_id];
              return (
                <button
                  key={p.id}
                  onClick={() => { onSelect({ player_id: p.id, team_id: p.team_id }); onClose(); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors"
                >
                  {p.photo_url ? (
                    <img src={photoUrl(p.photo_url, 36)} alt={p.name} width={36} height={36} loading="lazy" decoding="async" className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <div className="flex items-center gap-1.5">
                      {team && <TeamLogo url={team.logo_url} name={team.short_name} size={14} />}
                      <span className="text-[10px] text-muted-foreground">{team?.short_name} · {getPositionLabel(p.position)} · #{p.number || '?'}</span>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ============================
// SELECAO TAB
// ============================
function SelecaoTab({ compId, matches, user, onLoginRequest, initialRound, onRoundChange }: { compId: string; matches: Match[]; user: UserProfile | null; onLoginRequest: () => void; initialRound?: number; onRoundChange?: (r: number) => void }) {
  const [round, setRoundState] = useState<number | null>(initialRound ?? null);
  const setRound = useCallback((r: number | null) => {
    setRoundState(r);
    if (r != null && onRoundChange) onRoundChange(r);
  }, [onRoundChange]);
  const [eligible, setEligible] = useState<any>({ players: [], coaches: [], teams: [], voting_open: false, closes_at: '' });
  const [results, setResults] = useState<any>({ winners: {}, total_voters: 0 });
  const [myVotes, setMyVotes] = useState<Record<string, any>>({});
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPos, setModalPos] = useState({ position: '', slot: 0 });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'mine' | 'results'>('mine');
  const [trending, setTrending] = useState<{ rank: number; player_id: string; team_id: string; pct: number }[]>([]);
  const [voting, setVoting] = useState(false); // prevent double-submit
  const [selecaoRoundControl, setSelecaoRoundControl] = useState<Record<string, boolean>>({});

  // Use stable userId instead of user object reference
  const userId = user?.id || null;

  // Detect active round (in_progress > upcoming > last finished)
  const detectedRound = detectActiveRound(matches, 'selecao');

  // Build list of available rounds (finished + active) for navigation
  const availableRounds = [...new Set([
    ...matches.filter(m => m.status === 'finished').map(m => m.round_number),
    ...(detectedRound ? [detectedRound] : []),
  ])].sort((a, b) => b - a); // newest first

  // Auto-select detected round if user hasn't manually selected one (and no URL round)
  useEffect(() => {
    if (detectedRound && round === null) {
      setRoundState(detectedRound); // don't push to URL for auto-detect
    }
  }, [detectedRound, round]);

  const activeRound = round ?? detectedRound ?? 1;

  // Compute embargo date for the result view (next Monday 22:00 after last match of this round)
  const embargoDate = useMemo(() => getEmbargoDate(matches, activeRound), [matches, activeRound]);

  const [resultsReleased, setResultsReleased] = useState(false);
  // Results are EMBARGOED when:
  // 1. Voting is still open (NEVER show results while people are voting), OR
  // 2. Embargo date hasn't passed yet (Monday 22:00 reveal on TV program), OR
  // 3. No embargo date could be computed (no match data — hide by default)
  // UNLESS: admin manually released the results
  const isEmbargoed = !resultsReleased && (eligible.voting_open || !embargoDate || new Date() < embargoDate);

  const loadRoundData = useCallback(async () => {
    setLoading(true);
    try {
      // Try prefetch cache first (warmed by HomePage idle prefetch)
      const cached = getCachedSelecaoBatch(activeRound);
      const batch = cached || await getSelecaoBatch(compId, activeRound);
      // Fetch round control + release status
      const [rc, relStatus] = await Promise.all([
        getRoundControl(compId).catch(() => ({ selecao: {} })),
        import('../lib/galera-api').then(m => m.getReleaseStatus(compId)).catch(() => ({ releases: {} })),
      ]);
      setSelecaoRoundControl(rc?.selecao || {});
      setResultsReleased(relStatus?.releases?.[String(activeRound)] === true);
      const adminSelecaoOverride = rc?.selecao?.[String(activeRound)];
      const eligibleData = batch.eligible || { players: [], coaches: [], teams: [], voting_open: false };
      // Override voting_open based on admin control:
      // - admin explicitly true → force open (even before time window)
      // - admin explicitly false → force closed
      if (adminSelecaoOverride === true) {
        eligibleData.voting_open = true;
      } else if (adminSelecaoOverride === false) {
        eligibleData.voting_open = false;
      }
      setEligible(eligibleData);
      setMyVotes(batch.myVotes || {});
      setTrending(batch.trending || []);

      // Only fetch public results if voting is CLOSED and embargo has PASSED (or admin released)
      const votingStillOpen = batch.eligible?.voting_open;
      const currentEmbargo = getEmbargoDate(matches, activeRound);
      const embargoStillActive = !currentEmbargo || new Date() < currentEmbargo;
      const adminReleased = relStatus?.releases?.[String(activeRound)] === true;
      if (!votingStillOpen && (!embargoStillActive || adminReleased)) {
        const res = await getVoteResults(compId, activeRound);
        setResults(res);
      } else {
        setResults({ winners: {}, total_voters: 0 });
      }
    } catch (e) {
      console.error('Error loading round data:', e);
    }
    setLoading(false);
  }, [compId, activeRound, userId, matches]);

  useEffect(() => { loadRoundData(); }, [loadRoundData]);

  // Force viewMode back to 'mine' while embargoed
  useEffect(() => {
    if (isEmbargoed && viewMode === 'results') {
      setViewMode('mine');
    }
  }, [isEmbargoed, viewMode]);

  const playerMap: Record<string, any> = {};
  (eligible.players || []).forEach((p: any) => { playerMap[p.id] = p; });
  const teamMap: Record<string, any> = {};
  (eligible.teams || []).forEach((t: any) => { teamMap[t.id] = t; });

  const handleSlotClick = (position: string, slot: number) => {
    if (!user) {
      onLoginRequest();
      return;
    }
    if (!eligible.voting_open) {
      toast.error('Votacao encerrada para esta rodada');
      return;
    }
    setModalPos({ position, slot });
    setModalOpen(true);
  };

  const handleVote = async (data: { player_id?: string; team_id: string; coach_name?: string }) => {
    if (voting) return; // prevent double-submit
    setVoting(true);
    try {
      // Optimistic update — show vote immediately in campinho
      const key = `${modalPos.position}:${modalPos.slot}`;
      const prevVotes = { ...myVotes };
      setMyVotes(prev => ({
        ...prev,
        [key]: {
          ...data,
          _position: modalPos.position,
          _slot: modalPos.slot,
          voted_at: new Date().toISOString(),
        },
      }));

      const res = await submitVote({
        competition_id: compId,
        round_number: activeRound,
        position: modalPos.position,
        slot: modalPos.slot,
        ...data,
      });
      if (res.error) {
        toast.error(res.error);
        // Revert optimistic update on error
        setMyVotes(prevVotes);
      } else {
        toast.success('Voto registrado!');
        // Clear prefetch cache so next load gets fresh data
        clearGaleraPrefetch();
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setVoting(false);
  };

  // Determine what to display on the campinho
  const hasMyVotes = user && Object.keys(myVotes).length > 0;
  const canShowResults = !isEmbargoed && viewMode === 'results';
  const displayWinners = canShowResults ? results.winners : (hasMyVotes ? myVotes : {});
  const isMyView = !canShowResults;

  const handleShare = async () => {
    if (!hasMyVotes && isEmbargoed) return;
    const shareData = isMyView ? myVotes : results.winners;
    const text = generateSelectionShareText(activeRound, shareData, playerMap, teamMap, 'galera');
    await shareContent(text, isMyView ? `Minha Seleção -- Rodada ${activeRound}` : `Seleção da Rodada ${activeRound}`);
    toast.success('Copiado!');
  };

  return (
    <div className="space-y-4">
      {/* Round selector */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => { const idx = availableRounds.indexOf(activeRound); if (idx < availableRounds.length - 1) setRound(availableRounds[idx + 1]); }}
          disabled={availableRounds.indexOf(activeRound) >= availableRounds.length - 1}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-20"
        ><ChevronLeft className="w-4 h-4" /></button>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Rodada {activeRound}
          </span>
          {detectedRound === activeRound && (
            <span className="px-1.5 py-0.5 rounded-full bg-green-500/15 text-green-600 text-[9px] font-bold uppercase tracking-wide">
              Ativa
            </span>
          )}
        </div>
        <button
          onClick={() => { const idx = availableRounds.indexOf(activeRound); if (idx > 0) setRound(availableRounds[idx - 1]); }}
          disabled={availableRounds.indexOf(activeRound) <= 0}
          className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-20"
        ><ChevronRight className="w-4 h-4" /></button>
      </div>

      {loading ? (
        <GaleraSkeleton />
      ) : availableRounds.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Nenhuma rodada finalizada ainda</p>
        </div>
      ) : (
        <>
          {/* View mode toggle — "Resultado" only available after embargo lifts */}
          {user && hasMyVotes && (
            <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('mine')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-bold transition-colors ${
                  viewMode === 'mine' || isEmbargoed ? 'bg-green-600 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <User className="w-3 h-3" /> Minha Seleção
              </button>
              <button
                onClick={() => !isEmbargoed && setViewMode('results')}
                disabled={isEmbargoed}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[11px] font-bold transition-colors ${
                  isEmbargoed
                    ? 'text-muted-foreground/40 cursor-not-allowed'
                    : viewMode === 'results' ? 'bg-green-600 text-white' : 'text-muted-foreground hover:text-foreground'
                }`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {isEmbargoed ? <Lock className="w-3 h-3" /> : <Users className="w-3 h-3" />}
                Resultado
                {isEmbargoed && <span className="text-[8px] ml-0.5">seg</span>}
              </button>
            </div>
          )}

          {/* Embargo notice */}
          {isEmbargoed && (
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="text-[10px] leading-snug text-[#000000] font-[Plus_Jakarta_Sans]">
                Confira o resultado no Arena Força do Vale de segunda-feira
                {embargoDate ? `, ${format(embargoDate, "dd/MM 'às' 20:00", { locale: ptBR })}` : ''}.
                {eligible.voting_open ? ' Vote agora!' : ' Aguarde!'}
              </span>
            </div>
          )}

          {/* Campinho — shows only "Minha Seleção" while embargoed, never public results */}
          <Campinho
            winners={displayWinners}
            playerMap={playerMap}
            teamMap={teamMap}
            source={'galera'}
            onSlotClick={eligible.voting_open ? handleSlotClick : undefined}
            myVotes={undefined}
            votingOpen={eligible.voting_open}
            label={isMyView ? (hasMyVotes ? 'Minha Seleção' : 'Vote nos jogadores') : undefined}
            showVotePct={canShowResults}
            tallies={canShowResults ? results.tallies : undefined}
          />

          {/* Top 5 Mais Votados — percentual, sem contagem absoluta */}
          {trending.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden mx-[0px] mt-[19px] mb-[16px]">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-secondary/50">
                <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <span className="text-[11px] font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Top 5 Mais Votados
                </span>
                <TrendingUp className="w-3 h-3 text-muted-foreground ml-auto" />
              </div>
              <div className="divide-y divide-border">
                {(() => {
                  const maxPct = Math.max(...trending.map(t => t.pct), 1);
                  return trending.map((t, idx) => {
                    const player = playerMap[t.player_id];
                    const team = teamMap[t.team_id];
                    if (!player) return null;
                    // Show percentage relative to the most-voted player (bar fill)
                    const barPct = maxPct > 0 ? (t.pct / maxPct) * 100 : 0;
                    const pctColor = t.pct >= 60 ? 'text-green-400' : t.pct >= 40 ? 'text-emerald-400' : t.pct >= 20 ? 'text-yellow-400' : 'text-orange-400';
                    const barGradient = t.pct >= 60 ? 'bg-gradient-to-r from-green-500 to-emerald-400' : t.pct >= 40 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : t.pct >= 20 ? 'bg-gradient-to-r from-yellow-500 to-amber-400' : 'bg-gradient-to-r from-orange-500 to-red-400';
                    return (
                      <div key={t.player_id} className="flex items-center gap-2.5 px-3 py-2">
                        {/* Rank badge */}
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                          idx === 0 ? 'bg-amber-500/20 text-amber-400' :
                          idx === 1 ? 'bg-slate-400/20 text-slate-300' :
                          idx === 2 ? 'bg-orange-700/20 text-orange-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {t.rank}
                        </div>
                        {/* Player photo */}
                        {player.photo_url ? (
                          <img src={photoUrl(player.photo_url, 32)} alt={player.name} width={32} height={32} loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover border border-border shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                        {/* Name + team */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">{player.name}</p>
                          <div className="flex items-center gap-1">
                            {team && <TeamLogo url={team.logo_url} name={team.short_name} size={12} />}
                            <span className="text-[9px] text-muted-foreground">{team?.short_name}</span>
                          </div>
                        </div>
                        {/* Vote percentage */}
                        <div className="flex items-center gap-1.5">
                          <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div
                              className={`h-full rounded-full ${barGradient}`}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                          <span className={`text-[11px] font-extrabold w-10 text-right tabular-nums ${pctColor}`} style={{ fontFamily: 'var(--font-mono)' }}>
                            {t.pct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}

          {/* Voting info */}
          {eligible.voting_open && eligible.closes_at && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/20">
              <Clock className="w-3.5 h-3.5 text-green-500 shrink-0" />
              <span className="text-[10px] text-green-400">
                Votação aberta até {format(new Date(eligible.closes_at), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}

          {/* Context text */}
          {isEmbargoed ? (
            <p className="text-[10px] text-muted-foreground text-center">
              {eligible.voting_open
                ? 'Toque nos jogadores do campinho para montar sua seleção'
                : 'Votação encerrada! Resultado na segunda, no Arena FV!'}
            </p>
          ) : (
            <p className="text-[10px] text-muted-foreground text-center">
              Resultado da votacao da Galera
            </p>
          )}

          {/* Share — only available when user has votes */}
          {hasMyVotes && (
            <button
              onClick={async () => {
                toast.loading('Gerando imagem...');
                const blob = await generateStoryImage('selection', {
                  round: activeRound, source: 'galera',
                  winners: isMyView ? myVotes : results.winners,
                  playerMap, teamMap,
                  isPersonal: isMyView,
                  userName: getCachedDisplayName() || user?.name || 'Torcedor',
                });
                toast.dismiss();
                if (blob) {
                  await shareStoryImage(blob, `selecao-rodada-${activeRound}`);
                  toast.success('Imagem gerada!');
                } else {
                  toast.error('Erro ao gerar imagem');
                }
              }}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-cyan-500/15 border border-primary/25 text-sm font-bold text-primary hover:from-primary/20 hover:to-cyan-500/20 active:scale-[0.98] transition-all"
            >
              <Share2 className="w-4 h-4" />
              Compartilhar minha Seleção
            </button>
          )}
        </>
      )}

      <AnimatePresence>
        {modalOpen && (
          <PlayerSelectionModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            position={modalPos.position}
            slot={modalPos.slot}
            players={eligible.players || []}
            coaches={eligible.coaches || []}
            teamMap={teamMap}
            onSelect={handleVote}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================
// BOLÃO TAB
// ============================
function BolaoTab({ compId, matches, user, onLoginRequest, initialRound, onRoundChange }: { compId: string; matches: Match[]; user: UserProfile | null; onLoginRequest: () => void; initialRound?: number; onRoundChange?: (r: number) => void }) {
  const navigate = useNavigate();
  const [myPreds, setMyPreds] = useState<Record<string, any>>({});
  const [ranking, setRanking] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPreds, setEditPreds] = useState<Record<string, { home: string; away: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [savingBatch, setSavingBatch] = useState(false);
  const [justSaved, setJustSaved] = useState<Record<string, boolean>>({});
  const [loadError, setLoadError] = useState(false);
  const [matchStats, setMatchStats] = useState<Record<string, any>>({});
  const [totalPredictors, setTotalPredictors] = useState(0);
  const [roundControl, setRoundControl] = useState<Record<string, boolean>>({});

  // Use user?.id as dependency to avoid re-fetches from object reference changes
  const userId = user?.id || null;

  // Track previous userId with a ref to detect user-switch without an extra render
  const prevUserIdRef = React.useRef<string | null>(userId);

  // Limpa chaves antigas de outros usuários do localStorage uma vez quando userId resolve
  const cleanedRef = React.useRef(false);
  React.useEffect(() => {
    if (!cleanedRef.current) {
      cleanedRef.current = true;
      cleanOldPredsCaches(userId);
    }
  }, [userId]);

  useEffect(() => {
    const userSwitched = prevUserIdRef.current !== userId;
    prevUserIdRef.current = userId;

    async function load() {
      setLoadError(false);

      // ── Passo 1: usuário trocou → limpa estado para evitar palpites do usuário anterior
      //            ficarem visíveis enquanto a requisição do servidor está in-flight.
      if (userSwitched) {
        console.log('[Bolao] Usuário trocou — resetando palpites');
        cleanOldPredsCaches(userId); // limpa chaves do usuário anterior também
        setMyPreds({});
        setRanking([]);
      }

      // ── Passo 2: preenche instantaneamente do localStorage enquanto o servidor carrega,
      //            para o usuário ver seus palpites sem delay perceptível.
      if (userId) {
        const cached = getCachedPredictions(userId);
        if (cached && Object.keys(cached).length > 0) {
          console.log('[Bolao] Pré-carregando palpites do localStorage enquanto servidor responde');
          setMyPreds(cached);
        }
      }

      try {
        // Sempre busca dados frescos — consistência entre dispositivos via KV no servidor
        clearGaleraPrefetch();
        const [batchResult, statsResult, rcResult] = await Promise.all([
          getBolaoBatch(compId),
          getBolaoStats(compId),
          getRoundControl(compId),
        ]);
        const batch = batchResult;
        const fetchedPreds = batch.predictions || {};
        setRanking(batch.ranking || []);
        setMatchStats(statsResult.stats || {});
        setTotalPredictors(statsResult.total_predictors || 0);
        setRoundControl(rcResult?.bolao || {});

        const gotData = Object.keys(fetchedPreds).length > 0;

        if (gotData) {
          // Servidor retornou dados reais → usa e atualiza cache localStorage
          cachePredictions(fetchedPreds, userId);
          setMyPreds(fetchedPreds);
        } else if (userId) {
          // Servidor retornou vazio para usuário logado.
          // Pode ser: (a) usuário genuinamente não tem palpites, ou (b) falha de auth.
          // Usa o cache para distinguir:
          const cached = getCachedPredictions(userId);
          if (cached && Object.keys(cached).length > 0) {
            console.warn('[Bolao] Servidor retornou vazio mas cache existe — possível problema de auth, mantendo cache');
            setLoadError(true);
            // O cache já foi pré-carregado no Passo 2 — não sobrescreve
          } else {
            // Usuário realmente não tem palpites ainda
            setMyPreds({});
          }
        } else {
          // Usuário anônimo, sem palpites
          setMyPreds({});
        }
      } catch (e) {
        console.error('[Bolao] Erro ao carregar bolão:', e);
        setLoadError(true);
        // Em erro de rede, o cache do Passo 2 já está exibindo — apenas garante estado vazio
        // se não havia cache
        if (userId) {
          const cached = getCachedPredictions(userId);
          if (!cached) setMyPreds({});
        }
      }
      setLoading(false);
    }
    load();
  }, [compId, userId]);

  // Use the SAME logic as HomePage "Próximos Jogos":
  // 1. Find the first future non-finished match → get its round_number
  // 2. Show ALL non-finished matches from that round (no isValidMatch filter here,
  //    to match exactly what the Home shows)
  const now = new Date();
  const nextUpcomingRound = (() => {
    const futureMatches = matches
      .filter(m => m.status !== 'finished' && new Date(m.match_date).getTime() > now.getTime())
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    return futureMatches.length > 0 ? futureMatches[0].round_number : null;
  })();

  const upcomingMatches = nextUpcomingRound
    ? matches
        .filter(m => m.round_number === nextUpcomingRound && m.status !== 'finished')
        .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
    : [];

  const finishedMatches = matches
    .filter(m => m.status === 'finished' && isValidMatch(m))
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  // Check if ALL matches in the round have predictions (existing or editing)
  const roundHasAllPreds = (matchList: typeof upcomingMatches) => {
    return matchList.every(m => {
      const existing = myPreds[m.id];
      const editing = editPreds[m.id];
      const homeVal = editing?.home ?? existing?.home_score?.toString() ?? '';
      const awayVal = editing?.away ?? existing?.away_score?.toString() ?? '';
      return homeVal !== '' && awayVal !== '';
    });
  };

  // Check if user already submitted predictions for this round
  const roundAlreadySaved = (matchList: typeof upcomingMatches) => {
    return matchList.length > 0 && matchList.every(m => !!myPreds[m.id]);
  };

  const handleSaveBatch = async () => {
    if (!user) { onLoginRequest(); return; }
    if (!nextUpcomingRound) return;

    // Build predictions array
    const predictions: Array<{ match_id: string; home_score: number; away_score: number }> = [];
    for (const m of upcomingMatches) {
      const existing = myPreds[m.id];
      const editing = editPreds[m.id];
      const homeStr = editing?.home ?? existing?.home_score?.toString() ?? '';
      const awayStr = editing?.away ?? existing?.away_score?.toString() ?? '';
      if (homeStr === '' || awayStr === '') {
        toast.error('Preencha o placar de todos os jogos');
        return;
      }
      const homeScore = parseInt(homeStr);
      const awayScore = parseInt(awayStr);
      if (isNaN(homeScore) || isNaN(awayScore)) {
        toast.error('Placar inválido');
        return;
      }
      predictions.push({ match_id: m.id, home_score: homeScore, away_score: awayScore });
    }

    setSavingBatch(true);
    try {
      const res = await submitPredictionsBatch(compId, nextUpcomingRound, predictions);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Palpites da rodada confirmados!');
        setMyPreds(prev => {
          const updated = { ...prev };
          for (const p of predictions) {
            updated[p.match_id] = { home_score: p.home_score, away_score: p.away_score, points_earned: 0 };
          }
          cachePredictions(updated, userId);
          return updated;
        });
        setEditPreds({});
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setSavingBatch(false);
  };

  // Legacy single save (kept for backwards compatibility, but not used in new UI)
  const handleSavePred = async (matchId: string) => {
    const existing = myPreds[matchId];
    const pred = editPreds[matchId];
    const homeStr = pred?.home ?? existing?.home_score?.toString() ?? '';
    const awayStr = pred?.away ?? existing?.away_score?.toString() ?? '';
    if (homeStr === '' || awayStr === '') {
      toast.error('Preencha o placar completo');
      return;
    }
    const homeScore = parseInt(homeStr);
    const awayScore = parseInt(awayStr);
    if (isNaN(homeScore) || isNaN(awayScore)) {
      toast.error('Placar invalido');
      return;
    }
    setSaving(matchId);
    try {
      const res = await submitPrediction(matchId, homeScore, awayScore);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Palpite salvo!');
        setMyPreds(prev => {
          const updated = {
            ...prev,
            [matchId]: { home_score: homeScore, away_score: awayScore, points_earned: 0 },
          };
          cachePredictions(updated, userId);
          return updated;
        });
        setEditPreds(prev => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
        setJustSaved(prev => ({ ...prev, [matchId]: true }));
        setTimeout(() => setJustSaved(prev => ({ ...prev, [matchId]: false })), 2500);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(null);
  };

  if (loading) {
    return (<GaleraSkeleton />);
  }

  return (
    <div className="space-y-5">
      {/* Stats overview */}
      {(() => {
        const statsMatches = upcomingMatches.filter(m => matchStats[m.id]?.total >= 2);
        if (!statsMatches.length) return null;
        return (
          <div className="bg-card border border-border rounded-xl overflow-hidden relative">
            {(() => {
              const anyVoted = statsMatches.slice(0, 3).some(m => !!myPreds[m.id]);
              return (
                <>
                  <div className={`${!anyVoted ? 'blur-[7px] select-none pointer-events-none' : ''} transition-all duration-500`}>
                    <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-foreground uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
                        O que a galera acha
                      </span>
                    </div>
                    <div className="divide-y divide-border">
                      {statsMatches.slice(0, 3).map(m => {
                        const st = matchStats[m.id];
                        const homePct = st.home_pct;
                        const drawPct = st.draw_pct;
                        const awayPct = st.away_pct;
                        const homeColor = m.home_team?.color || '#6366f1';
                        const awayColor = m.away_team?.color || '#ef4444';
                        const homeTextColor = m.home_team?.text_color || '#ffffff';
                        const awayTextColor = m.away_team?.text_color || '#ffffff';
                        return (
                          <div key={m.id} className="px-2.5 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <div className="flex items-center gap-1 shrink-0 w-[52px]">
                                <TeamLogo url={m.home_team?.logo_url} name={m.home_team?.short_name || '?'} size={16} />
                                <span className="text-[9px] font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                                  {m.home_team?.short_name}
                                </span>
                              </div>
                              <div className="relative flex-1">
                                <div className="flex h-[22px] rounded-md overflow-hidden bg-secondary/50 transition-all duration-500">
                                  {homePct > 0 && (
                                    <div
                                      className="flex items-center justify-center transition-all duration-700 ease-out min-w-[24px]"
                                      style={{ width: `${homePct}%`, backgroundColor: homeColor }}
                                    >
                                      <span className="text-[9px] font-extrabold tabular-nums drop-shadow-sm" style={{ fontFamily: 'var(--font-mono)', color: homeTextColor }}>
                                        <LivePct value={homePct} />
                                      </span>
                                    </div>
                                  )}
                                  {drawPct > 0 && (
                                    <div
                                      className="flex items-center justify-center transition-all duration-700 ease-out min-w-[20px]"
                                      style={{ width: `${drawPct}%`, backgroundColor: '#6b7280' }}
                                    >
                                      <span className="text-[9px] font-extrabold tabular-nums text-white drop-shadow-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                                        <LivePct value={drawPct} />
                                      </span>
                                    </div>
                                  )}
                                  {awayPct > 0 && (
                                    <div
                                      className="flex items-center justify-center transition-all duration-700 ease-out min-w-[24px]"
                                      style={{ width: `${awayPct}%`, backgroundColor: awayColor }}
                                    >
                                      <span className="text-[9px] font-extrabold tabular-nums drop-shadow-sm" style={{ fontFamily: 'var(--font-mono)', color: awayTextColor }}>
                                        <LivePct value={awayPct} />
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 w-[52px] justify-end">
                                <span className="text-[9px] font-bold text-foreground truncate text-right" style={{ fontFamily: 'var(--font-heading)' }}>
                                  {m.away_team?.short_name}
                                </span>
                                <TeamLogo url={m.away_team?.logo_url} name={m.away_team?.short_name || '?'} size={16} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  {!anyVoted && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <p
                        className="text-sm font-extrabold text-white text-center px-6 leading-snug"
                        style={{
                          fontFamily: 'var(--font-heading)',
                          textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)',
                        }}
                      >
                        Registre seu palpite para ver as odds em tempo real
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        );
      })()}

      {/* Ranking */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-yellow-500" />
          <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Ranking do Bolão
          </h3>
        </div>
        {ranking.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-6 text-center">
            <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nenhum palpite registrado ainda</p>
            <p className="text-[10px] text-subtle mt-1">Seja o primeiro a dar seu palpite!</p>
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="grid grid-cols-[24px_1fr_40px_40px_40px] gap-0 px-3 py-2 border-b border-border text-[9px] text-muted-foreground font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
              <span className="text-center">#</span>
              <span>Torcedor</span>
              <span className="text-center">PTS</span>
              <span className="text-center">EX</span>
              <span className="text-center">AC</span>
            </div>
            {(() => {
              const TOP_N = 5;
              const userId = user?.id;
              const topEntries = ranking.slice(0, TOP_N);
              const myIdx = userId ? ranking.findIndex(r => r.user_id === userId) : -1;
              const myEntry = myIdx >= TOP_N ? ranking[myIdx] : null;
              const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];

              const renderRow = (r: any, pos: number, highlight: boolean) => (
                <div key={r.user_id} className={`grid grid-cols-[24px_1fr_40px_40px_40px] gap-0 px-3 py-2.5 items-center border-b border-border last:border-b-0 ${highlight ? 'bg-primary/5' : ''}`}>
                  <span className={`text-center text-xs font-bold ${pos <= 3 ? medalColors[pos - 1] : 'text-muted-foreground'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                    {pos}º
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    {r.avatar_url ? (
                      <img src={r.avatar_url} alt={r.display_name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${highlight ? 'text-primary' : 'text-foreground'}`}>
                        {highlight ? (getCachedDisplayName() || user?.name || r.display_name) : r.display_name} {highlight && <span className="text-[9px] text-primary/60">(você)</span>}
                      </p>
                      {r.city && <p className="text-[9px] text-muted-foreground truncate">{r.city}</p>}
                    </div>
                  </div>
                  <span className="text-center text-sm font-extrabold text-primary" style={{ fontFamily: 'var(--font-mono)' }}>{r.points}</span>
                  <span className="text-center text-[11px] text-green-500 font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{r.exact}</span>
                  <span className="text-center text-[11px] text-blue-500 font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>{r.result}</span>
                </div>
              );

              return (
                <>
                  {topEntries.map((r, idx) => renderRow(r, idx + 1, !!userId && r.user_id === userId))}
                  {myEntry && (
                    <>
                      <div className="flex items-center justify-center py-1 text-[10px] text-muted-foreground">•••</div>
                      {renderRow(myEntry, myIdx + 1, true)}
                    </>
                  )}
                </>
              );
            })()}
          </div>
        )}
        {ranking.length > 5 && !user && (
          <p className="text-[10px] text-muted-foreground text-center mt-2">Faça login para ver sua posição</p>
        )}

        {/* Share ranking */}
        {ranking.length > 0 && user && (
          <button
            onClick={async () => {
              toast.loading('Gerando imagem...');
              // Build predictions for the best available round (finished first, then upcoming)
              const allMatchesForPreds = [...finishedMatches, ...upcomingMatches];
              const predsForStory = allMatchesForPreds
                .filter(m => myPreds[m.id])
                .map(m => {
                  const pred = myPreds[m.id];
                  const pts = pred?.points_earned || 0;
                  const isFinished = m.status === 'finished';
                  const isExact = isFinished && pred.home_score === m.score_home && pred.away_score === m.score_away;
                  const predW = pred.home_score > pred.away_score ? 'home' : pred.home_score < pred.away_score ? 'away' : 'draw';
                  const realW = isFinished ? ((m.score_home ?? 0) > (m.score_away ?? 0) ? 'home' : (m.score_home ?? 0) < (m.score_away ?? 0) ? 'away' : 'draw') : null;
                  const status = !isFinished ? 'pending' : isExact ? 'exact' : predW === realW ? 'result' : 'miss';
                  return {
                    home_team: m.home_team?.short_name || '?',
                    away_team: m.away_team?.short_name || '?',
                    home_logo: m.home_team?.logo_url || '',
                    away_logo: m.away_team?.logo_url || '',
                    pred_home: pred.home_score,
                    pred_away: pred.away_score,
                    real_home: isFinished ? m.score_home : null,
                    real_away: isFinished ? m.score_away : null,
                    points: pts,
                    status,
                    round: m.round_number,
                  };
                });
              // Pick the most relevant round
              const roundCounts: Record<number, number> = {};
              predsForStory.forEach(p => { roundCounts[p.round] = (roundCounts[p.round] || 0) + 1; });
              const bestRoundEntry = Object.entries(roundCounts).sort((a, b) => Number(b[0]) - Number(a[0]))[0];
              const storyRound = bestRoundEntry ? Number(bestRoundEntry[0]) : nextUpcomingRound || 1;
              const storyPreds = predsForStory.filter(p => p.round === storyRound);
              // Ranking info
              const myRankIdx = ranking.findIndex((r: any) => r.user_id === user?.id);
              const myRankData = myRankIdx >= 0 ? ranking[myRankIdx] : null;
              const blob = await generateStoryImage('predictions', {
                userName: getCachedDisplayName() || user?.name || 'Torcedor',
                round: storyRound,
                predictions: storyPreds,
                myPosition: myRankIdx >= 0 ? myRankIdx + 1 : null,
                myPoints: myRankData?.points ?? 0,
                myExact: myRankData?.exact ?? 0,
              });
              toast.dismiss();
              if (blob) {
                await shareStoryImage(blob, 'ranking-bolao');
                toast.success('Imagem gerada!');
              } else {
                toast.error('Erro ao gerar imagem');
              }
            }}
            className="w-full mt-3 flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-cyan-500/15 border border-primary/25 text-xs font-bold text-primary hover:from-primary/20 hover:to-cyan-500/20 active:scale-[0.98] transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar meus palpites
          </button>
        )}
      </section>

      {/* My predictions for upcoming matches — ALL must be filled, submit once */}
      {user && upcomingMatches.length > 0 && (() => {
        const alreadyLocked = roundAlreadySaved(upcomingMatches);
        const allFilled = roundHasAllPreds(upcomingMatches);
        const filledCount = upcomingMatches.filter(m => {
          const existing = myPreds[m.id];
          const editing = editPreds[m.id];
          const h = editing?.home ?? existing?.home_score?.toString() ?? '';
          const a = editing?.away ?? existing?.away_score?.toString() ?? '';
          return h !== '' && a !== '';
        }).length;
        const anyClosed = upcomingMatches.some(m => {
          const cutoff = new Date(m.match_date);
          cutoff.setMinutes(cutoff.getMinutes() - 1);
          return new Date() >= cutoff;
        });
        // Check if admin closed this round via round control
        const adminClosed = nextUpcomingRound ? roundControl[String(nextUpcomingRound)] === false : false;

        return (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {alreadyLocked ? 'Seus Palpites' : 'Dê seu Palpite'} — Rodada {nextUpcomingRound}
                </h3>
              </div>
              {alreadyLocked && (
                <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                  <Lock className="w-3 h-3" /> Confirmado
                </span>
              )}
            </div>

            {/* Admin closed banner */}
            {adminClosed && !alreadyLocked && (
              <div className="flex items-start gap-2 px-3 py-2 mb-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <Lock className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-red-700 dark:text-red-300 leading-snug font-semibold">
                  Palpites fechados para esta rodada.
                </p>
              </div>
            )}

            {/* Info banner */}
            {!alreadyLocked && !adminClosed && (
              <div className="flex items-start gap-2 px-3 py-2 mb-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <Info className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-snug">
                  Preencha <strong>todos os {upcomingMatches.length} jogos</strong> antes de confirmar. Após enviar, não será possível alterar.
                </p>
              </div>
            )}

            <div className="space-y-2">
              {upcomingMatches.map(m => {
                const existing = myPreds[m.id];
                const editing = editPreds[m.id];
                const homeVal = editing?.home ?? (existing?.home_score?.toString() || '');
                const awayVal = editing?.away ?? (existing?.away_score?.toString() || '');
                const thisFilled = homeVal !== '' && awayVal !== '';

                // Cutoff: 1 min before match_date
                const cutoff = new Date(m.match_date);
                cutoff.setMinutes(cutoff.getMinutes() - 1);
                const isClosed = new Date() >= cutoff;

                return (
                  <div key={m.id} className={`bg-card rounded-xl border p-3 transition-colors ${
                    isClosed ? 'border-border/50 opacity-60'
                    : alreadyLocked ? 'border-green-500/30 bg-green-500/[0.03]'
                    : thisFilled ? 'border-primary/30 bg-primary/[0.02]'
                    : 'border-border'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">{m.round_name || `Rodada ${m.round_number}`}</span>
                        {alreadyLocked && (
                          <span className="flex items-center gap-0.5 text-[9px] text-green-500 font-semibold">
                            <Check className="w-2.5 h-2.5" /> Registrado
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isClosed ? (
                          <span className="flex items-center gap-1 text-[9px] text-red-400 font-semibold">
                            <Lock className="w-2.5 h-2.5" /> Encerrado
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] text-green-500 font-semibold">
                            <Clock className="w-2.5 h-2.5" /> Até {format(cutoff, "dd/MM HH:mm")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                        <span className="text-[11px] font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                          {m.home_team?.short_name}
                        </span>
                        <TeamLogo url={m.home_team?.logo_url} name={m.home_team?.short_name || '?'} size={24} />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          inputMode="numeric"
                          value={homeVal}
                          disabled={isClosed || alreadyLocked || adminClosed}
                          onChange={e => setEditPreds(prev => ({ ...prev, [m.id]: { home: e.target.value, away: prev[m.id]?.away || awayVal } }))}
                          className={`w-10 h-10 rounded-lg text-center text-lg font-bold border outline-none disabled:opacity-50 ${
                            alreadyLocked ? 'bg-green-500/10 border-green-500/30 text-foreground' : 'bg-secondary border-border focus:border-primary text-foreground'
                          }`}
                          style={{ fontFamily: 'var(--font-mono)' }}
                          placeholder="-"
                        />
                        <span className="text-muted-foreground text-sm">×</span>
                        <input
                          type="number"
                          min="0"
                          max="99"
                          inputMode="numeric"
                          value={awayVal}
                          disabled={isClosed || alreadyLocked || adminClosed}
                          onChange={e => setEditPreds(prev => ({ ...prev, [m.id]: { home: prev[m.id]?.home || homeVal, away: e.target.value } }))}
                          className={`w-10 h-10 rounded-lg text-center text-lg font-bold border outline-none disabled:opacity-50 ${
                            alreadyLocked ? 'bg-green-500/10 border-green-500/30 text-foreground' : 'bg-secondary border-border focus:border-primary text-foreground'
                          }`}
                          style={{ fontFamily: 'var(--font-mono)' }}
                          placeholder="-"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <TeamLogo url={m.away_team?.logo_url} name={m.away_team?.short_name || '?'} size={24} />
                        <span className="text-[11px] font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                          {m.away_team?.short_name}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Batch submit button — only if not already locked and not admin-closed */}
            {!alreadyLocked && !anyClosed && !adminClosed && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] text-muted-foreground font-semibold">
                    {filledCount}/{upcomingMatches.length} jogos preenchidos
                  </span>
                  {!allFilled && (
                    <span className="text-[10px] text-amber-500 font-semibold">
                      Faltam {upcomingMatches.length - filledCount}
                    </span>
                  )}
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-secondary mb-3 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(filledCount / upcomingMatches.length) * 100}%`,
                      background: allFilled ? '#22c55e' : 'var(--color-primary)',
                    }}
                  />
                </div>
                <button
                  onClick={handleSaveBatch}
                  disabled={!allFilled || savingBatch}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 ${
                    allFilled
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/25'
                      : 'bg-secondary text-muted-foreground border border-border'
                  }`}
                >
                  {savingBatch ? 'Confirmando...'
                    : allFilled ? 'Confirmar todos os palpites da rodada'
                    : `Preencha todos os ${upcomingMatches.length} jogos para confirmar`}
                </button>
              </div>
            )}

            {/* Already confirmed badge */}
            {alreadyLocked && (
              <div className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <Check className="w-4 h-4 text-green-500" />
                <span className="text-xs font-bold text-green-600 dark:text-green-400">
                  Palpites confirmados — boa sorte!
                </span>
              </div>
            )}
          </section>
        );
      })()}

      {/* Previous predictions */}
      {user && finishedMatches.some(m => myPreds[m.id]) && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Medal className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Meus Resultados
            </h3>
          </div>
          <div className="space-y-1.5">
            {finishedMatches.filter(m => myPreds[m.id]).map(m => {
              const pred = myPreds[m.id];
              const pts = pred?.points_earned || 0;
              return (
                <div key={m.id} className="flex items-center gap-2 bg-card rounded-lg border border-border px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 text-[11px]">
                      <span className="text-foreground font-semibold">{m.home_team?.short_name}</span>
                      <span className="text-muted-foreground">{m.score_home}-{m.score_away}</span>
                      <span className="text-foreground font-semibold">{m.away_team?.short_name}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground">
                      Palpite: {pred.home_score}-{pred.away_score}
                    </p>
                  </div>
                  <span className={`text-sm font-bold ${pts === 3 ? 'text-green-500' : pts === 1 ? 'text-blue-500' : 'text-red-500'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                    +{pts}
                  </span>
                </div>
              );
            })}
          </div>
          {/* Share predictions as story */}
          <button
            onClick={async () => {
              toast.loading('Gerando imagem...');
              const predsWithResults = finishedMatches
                .filter(m => myPreds[m.id])
                .map(m => {
                  const pred = myPreds[m.id];
                  const pts = pred?.points_earned || 0;
                  const isExact = pred.home_score === m.score_home && pred.away_score === m.score_away;
                  const predWinner = pred.home_score > pred.away_score ? 'home' : pred.home_score < pred.away_score ? 'away' : 'draw';
                  const realWinner = (m.score_home ?? 0) > (m.score_away ?? 0) ? 'home' : (m.score_home ?? 0) < (m.score_away ?? 0) ? 'away' : 'draw';
                  const status = isExact ? 'exact' : predWinner === realWinner ? 'result' : 'miss';
                  return {
                    home_team: m.home_team?.short_name || '?',
                    away_team: m.away_team?.short_name || '?',
                    home_logo: m.home_team?.logo_url || '',
                    away_logo: m.away_team?.logo_url || '',
                    pred_home: pred.home_score,
                    pred_away: pred.away_score,
                    real_home: m.score_home,
                    real_away: m.score_away,
                    points: pts,
                    status: status as 'exact' | 'result' | 'miss' | 'pending',
                    round: m.round_number,
                  };
                });
              const roundCounts: Record<number, number> = {};
              predsWithResults.forEach(p => { roundCounts[p.round] = (roundCounts[p.round] || 0) + 1; });
              const bestRound = Object.entries(roundCounts).sort((a, b) => Number(b[0]) - Number(a[0]))[0];
              const targetRound = bestRound ? Number(bestRound[0]) : 1;
              const roundPreds = predsWithResults.filter(p => p.round === targetRound);
              const myRIdx = ranking.findIndex((r: any) => r.user_id === user?.id);
              const myRData = myRIdx >= 0 ? ranking[myRIdx] : null;

              const blob = await generateStoryImage('predictions', {
                userName: getCachedDisplayName() || user?.name || 'Torcedor',
                round: targetRound,
                predictions: roundPreds,
                myPosition: myRIdx >= 0 ? myRIdx + 1 : null,
                myPoints: myRData?.points ?? 0,
                myExact: myRData?.exact ?? 0,
              });
              toast.dismiss();
              if (blob) {
                await shareStoryImage(blob, `palpites-rodada-${targetRound}`);
                toast.success('Imagem gerada!');
              } else {
                toast.error('Erro ao gerar imagem');
              }
            }}
            className="mt-3 w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/10 to-cyan-500/15 border border-primary/25 text-xs font-bold text-primary hover:from-primary/20 hover:to-cyan-500/20 active:scale-[0.98] transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            Compartilhar meus Palpites
          </button>
        </section>
      )}

      {!user && (
        <div className="bg-primary/10 border border-primary/20 rounded-xl px-4 py-4 text-center">
          <LogIn className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Participe do Bolão!</p>
          <p className="text-xs text-muted-foreground mt-1">Faça login para dar seus palpites e concorrer no ranking</p>
          <button
            onClick={onLoginRequest}
            className="mt-3 px-6 py-2 rounded-full bg-primary text-primary-foreground text-sm font-bold"
          >
            Criar conta / Entrar
          </button>
        </div>
      )}

      {/* Scoring rules */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-secondary/50">
          <Info className="w-3.5 h-3.5 text-primary" />
          <span className="text-[10px] font-bold text-foreground uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
            Como funciona
          </span>
        </div>
        <div className="grid grid-cols-3 divide-x divide-border">
          <div className="flex flex-col items-center gap-1.5 py-3 px-2">
            <span className="w-8 h-8 rounded-xl bg-green-500/15 text-green-500 font-extrabold text-sm flex items-center justify-center" style={{ fontFamily: 'var(--font-mono)' }}>3</span>
            <span className="text-[10px] font-semibold text-green-500" style={{ fontFamily: 'var(--font-heading)' }}>Exato</span>
            <span className="text-[9px] text-muted-foreground text-center leading-tight">Placar cravado</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-3 px-2">
            <span className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-500 font-extrabold text-sm flex items-center justify-center" style={{ fontFamily: 'var(--font-mono)' }}>1</span>
            <span className="text-[10px] font-semibold text-blue-500" style={{ fontFamily: 'var(--font-heading)' }}>Resultado</span>
            <span className="text-[9px] text-muted-foreground text-center leading-tight">Vencedor ou empate</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 py-3 px-2">
            <span className="w-8 h-8 rounded-xl bg-red-500/15 text-red-500 font-extrabold text-sm flex items-center justify-center" style={{ fontFamily: 'var(--font-mono)' }}>0</span>
            <span className="text-[10px] font-semibold text-red-500" style={{ fontFamily: 'var(--font-heading)' }}>Errou</span>
            <span className="text-[9px] text-muted-foreground text-center leading-tight">Não acertou nada</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================
// MAIN GALERA PAGE
// ============================
export function GaleraPage() {
  const navigate = useNavigate();
  const params = useParams<{ tab?: string; round?: string }>();
  const { user } = useAuth();

  // Read tab from URL, default to 'selecao'
  const urlTab = params.tab === 'bolao' ? 'bolao' : 'selecao';
  const urlRound = params.round ? parseInt(params.round) : undefined;
  const [tab, setTabState] = useState(urlTab);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  // Sync tab from URL on mount / param change
  useEffect(() => {
    setTabState(urlTab);
  }, [urlTab]);

  // Update URL when tab changes (replace, not push)
  const setTab = useCallback((newTab: string) => {
    setTabState(newTab);
    navigate(`/galera/${newTab}`, { replace: true });
  }, [navigate]);

  // Callback for sub-tabs to update URL with round
  const setUrlRound = useCallback((round: number) => {
    navigate(`/galera/${tab}/${round}`, { replace: true });
  }, [navigate, tab]);

  useEffect(() => {
    fetchMatches().then((m) => {
      setMatches(m);
      setLoading(false);
    });
    // Refresh cached display_name in background (for story generation)
    if (user) getProfile().catch(() => {});
  }, [user?.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <GaleraSkeleton />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="px-4 py-4 pb-6">
        <SectionHeader title="Galera" icon={Vote} variant="page" />

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-5">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold transition-colors ${
                  tab === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                }`}
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* LoginGate wraps all interactive content — blurs for non-logged users */}
        <LoginGate
          title="Faca login para participar"
          subtitle="Crie sua conta gratuita para votar na Seleção e participar do Bolão"
          icon={Vote}
          authTitle="Entrar na Galera"
          authSubtitle="Vote e de palpites — conta gratuita"
          onLogin={() => {}}
        >
          {tab === 'selecao' && <SelecaoTab compId={COMPETITION_ID} matches={matches} user={user} onLoginRequest={() => setShowAuth(true)} initialRound={urlRound} onRoundChange={setUrlRound} />}
          {tab === 'bolao' && <BolaoTab compId={COMPETITION_ID} matches={matches} user={user} onLoginRequest={() => setShowAuth(true)} initialRound={urlRound} onRoundChange={setUrlRound} />}
        </LoginGate>
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={() => {
          setShowAuth(false);
          toast.success('Conta conectada! Agora voce pode participar.');
        }}
        title="Entrar na Galera"
        subtitle="Vote e de palpites — conta gratuita"
      />
    </PageTransition>
  );
}