import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft, ChevronRight, MapPin, Trophy, BarChart3,
  Zap, Radio, Calendar, Users, ArrowRight, ChevronDown, Flame, Vote, Target,
  AlertTriangle, Swords, Newspaper, Ban, Shield,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
// CSS animation helper — avoids loading Motion for simple entry animations
const fadeUp = (delay = 0): React.CSSProperties => ({
  animation: `fadeUp 0.35s ease-out ${delay}s both`,
});
const fadeIn = (delay = 0): React.CSSProperties => ({
  animation: `fadeIn 0.3s ease-out ${delay}s both`,
});

import {
  fetchMatches, fetchTeams, buildStandingsFromTeams, fetchAllPlayers,
  type Match, type Team, type StandingRow, type Player, COMPETITION_ID,
} from '../lib/public-supabase';
import { redact, useIsPremium, UnlockBanner } from '../components/public/PremiumGate';
import { getTrendingPlayers, getBolaoStats, getSelecaoBatch } from '../lib/galera-api';
import { logoUrl, newsImageUrl, photoUrl } from '../lib/image-utils';
import { format, isToday, isTomorrow, isYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { SectionHeader } from '../components/public/SectionHeader';
import { HomeSkeleton } from '../components/public/Skeletons';
import { PageTransition } from '../components/public/PageTransition';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { fetchDisciplineOverview, type DisciplineOverview } from '../lib/discipline-api';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  link: string;
  image: string | null;
  author: string;
  categories: string[];
}

// ── HELPER COMPONENTS ──────────────────────────────────────

function TeamLogo({ url, name, size = 40, onClick }: { url?: string; name: string; size?: number; onClick?: (e: React.MouseEvent) => void }) {
  const [error, setError] = useState(false);
  if (!url || error) {
    return (
      <div
        onClick={onClick}
        className={`rounded-full bg-muted flex items-center justify-center text-foreground font-bold ${onClick ? 'cursor-pointer' : ''}`}
        style={{ width: size, height: size, fontFamily: 'var(--font-heading)', fontSize: size * 0.35 }}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return (
    <img
      src={logoUrl(url, size * 2)}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onClick={onClick}
      onError={() => setError(true)}
      className={`object-contain ${onClick ? 'cursor-pointer' : ''}`}
    />
  );
}

function BroadcastBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[9px] font-semibold">
      <Radio className="w-2.5 h-2.5 text-red-500" />
      <span className="tracking-wide uppercase text-muted-foreground">F7 ESPORTES</span>
    </span>
  );
}

function isPlayoffRound(match: Match): boolean {
  if (match.round_number > 7) return true;
  const rn = (match.round_name || '').toLowerCase();
  return /semi|final|terceiro|3[°º]|disput/.test(rn);
}

function getPlayoffLabels(match: Match): { home: string; away: string } | null {
  if (!isPlayoffRound(match)) return null;
  if (match.status === 'finished') return null;
  const rn = (match.round_name || '').toLowerCase();
  const title = (match.title || '').toLowerCase();
  const combined = `${rn} ${title}`;
  if (/semi/i.test(combined)) {
    if (/1|primeira/i.test(title) || /1/i.test(rn.replace('semi', '')))
      return { home: '1º Grupo', away: '4º Grupo' };
    if (/2|segunda/i.test(title) || /2/i.test(rn.replace('semi', '')))
      return { home: '2º Grupo', away: '3º Grupo' };
    return { home: 'A definir', away: 'A definir' };
  }
  if (/terceiro|3[°º]|disput/i.test(combined)) {
    return { home: 'Perd. Semi 1', away: 'Perd. Semi 2' };
  }
  if (/final/i.test(combined)) {
    return { home: 'Venc. Semi 1', away: 'Venc. Semi 2' };
  }
  return { home: 'A definir', away: 'A definir' };
}

// ── COMPETITION SELECTOR ───────────────────────────────────

function CompetitionSelector() {
  const [open, setOpen] = useState(false);
  const competitions = [{ id: '00000000-0000-0000-0001-000000000001', name: '26ª Regional Certel/Sicredi 2025', active: true }];
  const selected = competitions[0];
  return (
    <div className="relative flex items-center justify-center">
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 shadow-sm hover:border-primary/20 transition-all active:scale-[0.98]">
        <Trophy className="w-3.5 h-3.5 text-primary shrink-0" />
        <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{selected.name}</span>
        <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 z-40 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-3 py-2 border-b border-border"><span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>Selecionar campeonato</span></div>
            <div className="py-1">
              {competitions.map(comp => (
                <button key={comp.id} onClick={() => setOpen(false)} className="w-full flex items-center gap-3 px-4 py-3 text-left bg-accent text-accent-foreground">
                  <Trophy className="w-4 h-4 shrink-0 text-primary" />
                  <p className="text-sm font-bold truncate" style={{ fontFamily: 'var(--font-heading)' }}>{comp.name}</p>
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                </button>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-border"><p className="text-[10px] text-muted-foreground text-center">Mais campeonatos em breve</p></div>
          </div>
        </>
      )}
    </div>
  );
}

// ── HERO SECTION ────────────────────────────────────────────

function HeroSection({ teams, navigate }: { teams: Team[]; navigate: (path: string) => void }) {
  return (
    <div className="text-center space-y-4">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-black text-foreground uppercase tracking-tight leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          26ª REGIONAL
        </h1>
        <h1 className="text-3xl font-black uppercase tracking-tight leading-tight" style={{ fontFamily: 'var(--font-heading)', color: '#006633' }}>
          CERTEL / SICREDI
        </h1>
        <p className="text-xs text-muted-foreground mt-1">ASLIVATA · Vale do Taquari/RS · Série A 2025</p>
      </div>

      {/* Team logos row */}
      {teams.length > 0 && (
        <div className="flex items-center justify-center gap-3 py-2">
          {teams.map(team => (
            <button
              key={team.id}
              onClick={() => navigate(`/time/${team.slug || team.id}`)}
              className="transition-transform active:scale-90 hover:scale-110"
            >
              <TeamLogo url={team.logo_url} name={team.short_name} size={40} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── GALERA CARDS ────────────────────────────────────────────

interface InsightItem {
  text: string;
  logo?: string;
  icon: 'flame' | 'star' | 'trending' | 'trophy' | 'target' | 'zap';
}

// ── Seleção: stat-based insights from voting data ──
function buildSelecaoInsights(trending: any[], players: Record<string, any>, teams: Record<string, any>, eligible?: { voting_open?: boolean; players?: any[]; teams?: any[] }): InsightItem[] {
  const items: InsightItem[] = [];

  // If we have trending data, use it
  trending.slice(0, 8).forEach((t: any, i: number) => {
    const p = players[t.player_id];
    const tm = teams[t.team_id];
    const firstName = p?.name?.split(' ')[0] || 'Jogador';

    let text: string;
    let icon: InsightItem['icon'];

    if (i === 0) {
      text = `${firstName} · #1 na votação`;
      icon = 'star';
    } else if (i <= 2) {
      text = `${firstName} · #${i + 1} na votação`;
      icon = 'trending';
    } else {
      text = `${firstName} · Top ${Math.min(i + 1, 5)} da rodada`;
      icon = 'zap';
    }

    items.push({ text, logo: tm?.logo_url, icon });
  });

  // Fallback: if no trending votes yet, generate CTA/stat insights from eligible data
  if (items.length === 0) {
    if (eligible?.voting_open) {
      items.push({ text: 'Votação aberta! Escolha os melhores', icon: 'star' });
      items.push({ text: 'Todos os times representados', icon: 'trophy' });
      items.push({ text: 'Seja o primeiro a votar!', icon: 'flame' });
    } else {
      items.push({ text: 'Votação em breve!', icon: 'star' });
      items.push({ text: 'Quem será o destaque da rodada?', icon: 'zap' });
    }
  }

  return items;
}

// ── Bolão: stat-based insights from prediction data ──
function buildBolaoInsights(stats: Record<string, any>, matchMap: Record<string, Match>): InsightItem[] {
  const items: InsightItem[] = [];
  let idx = 0;

  for (const [matchId, s] of Object.entries(stats) as [string, any][]) {
    const m = matchMap[matchId];
    if (!m || !m.home_team || !m.away_team || s.total < 2) continue;

    const homeName = m.home_team.short_name || m.home_team.name;
    const awayName = m.away_team.short_name || m.away_team.name;
    const dominant = s.home_pct >= s.away_pct ? homeName : awayName;
    const domPct = Math.round(Math.max(s.home_pct, s.away_pct));
    const domLogo = s.home_pct >= s.away_pct ? m.home_team.logo_url : m.away_team.logo_url;
    const topScore = s.top_score || '0-0';
    const topScorePct = Math.round(s.top_score_pct || 0);
    const drawPct = Math.round(s.draw_pct);

    // Rotate between stat formats
    const variant = idx % 4;
    let text: string;
    let icon: InsightItem['icon'];
    let logo = domLogo;

    if (variant === 0) {
      text = `${dominant} · em ${domPct}% dos palpites`;
      icon = 'trophy';
    } else if (variant === 1) {
      text = `${homeName} × ${awayName} · placar ${topScore} (${topScorePct}%)`;
      icon = 'target';
      logo = m.home_team.logo_url;
    } else if (variant === 2) {
      const minorPct = 100 - domPct - drawPct;
      const minor = s.home_pct >= s.away_pct ? awayName : homeName;
      if (minorPct >= 10) {
        text = `${minor} · em ${minorPct}% dos palpites`;
        logo = s.home_pct >= s.away_pct ? m.away_team.logo_url : m.home_team.logo_url;
      } else {
        text = `${dominant} · com ${domPct}% dos palpites`;
      }
      icon = 'zap';
    } else {
      if (drawPct > 25) {
        text = `${homeName} × ${awayName} · empate em ${drawPct}%`;
        icon = 'trending';
      } else {
        text = `${dominant} · ${domPct}% contra ${100 - domPct - drawPct}%`;
        icon = 'flame';
      }
      logo = m.home_team.logo_url;
    }

    items.push({ text, logo, icon });
    idx++;
  }
  // Prioritize live/upcoming matches, then shuffle within same priority
  items.sort((a, b) => {
    const findMatch = (item: InsightItem) => Object.values(matchMap).find(m =>
      m.home_team?.logo_url === item.logo || m.away_team?.logo_url === item.logo
    );
    const ma = findMatch(a);
    const mb = findMatch(b);
    const order = (s?: string) => s === 'live' || s === 'in_progress' ? 0 : s === 'scheduled' || s === 'upcoming' ? 1 : 2;
    return order(ma?.status) - order(mb?.status);
  });
  return items.slice(0, 6);
}

const INSIGHT_ICONS = {
  flame: Flame,
  star: Trophy,
  trending: Zap,
  trophy: Trophy,
  target: Target,
  zap: Zap,
};
const INSIGHT_COLORS = {
  flame: 'text-orange-400',
  star: 'text-amber-400',
  trending: 'text-green-400',
  trophy: 'text-amber-400',
  target: 'text-primary',
  zap: 'text-sky-400',
};

function GaleraCards({ navigate, matches }: { navigate: (path: string) => void; matches: Match[] }) {
  const [selInsights, setSelInsights] = useState<InsightItem[]>([]);
  const [bolInsights, setBolInsights] = useState<InsightItem[]>([]);
  const [selIdx, setSelIdx] = useState(0);
  const [bolIdx, setBolIdx] = useState(0);

  // Detect candidate rounds for seleção (descending: live → finished → first)
  const candidateRounds = useMemo(() => {
    const roundNums = [...new Set(matches.map(m => m.round_number))].sort((a, b) => a - b);
    const live = roundNums.find(r => matches.some(m => m.round_number === r && (m.status === 'live' || m.status === 'in_progress')));
    const finished = roundNums.filter(r => matches.some(m => m.round_number === r && m.status === 'finished'));
    const ordered: number[] = [];
    if (live) ordered.push(live);
    for (let i = finished.length - 1; i >= 0; i--) {
      if (finished[i] !== live) ordered.push(finished[i]);
    }
    if (ordered.length === 0 && roundNums.length > 0) ordered.push(roundNums[0]);
    return ordered;
  }, [matches]);

  // Build match lookup
  const matchMap = useMemo(() => {
    const map: Record<string, Match> = {};
    matches.forEach(m => { map[m.id] = m; });
    return map;
  }, [matches]);

  // Fetch real preview data
  useEffect(() => {
    if (candidateRounds.length === 0) return;
    let cancelled = false;

    // Seleção: try rounds in priority order until we find one with votes
    const trySelecaoRound = async (roundIdx: number) => {
      if (cancelled || roundIdx >= candidateRounds.length) {
        // No round with votes — use fallback from first candidate
        if (!cancelled && candidateRounds.length > 0) {
          const data = await getSelecaoBatch(COMPETITION_ID, candidateRounds[0]).catch(() => null);
          if (!cancelled && data) {
            setSelInsights(buildSelecaoInsights([], {}, {}, data.eligible));
          }
        }
        return;
      }
      const round = candidateRounds[roundIdx];
      try {
        const data = await getSelecaoBatch(COMPETITION_ID, round);
        if (cancelled) return;
        const trending = data.trending || [];
        if (trending.length > 0) {
          const players: Record<string, any> = {};
          (data.eligible?.players || []).forEach((p: any) => { players[p.id] = p; });
          const teams: Record<string, any> = {};
          (data.eligible?.teams || []).forEach((t: any) => { teams[t.id] = t; });
          setSelInsights(buildSelecaoInsights(trending, players, teams, data.eligible));
        } else {
          await trySelecaoRound(roundIdx + 1);
        }
      } catch {
        await trySelecaoRound(roundIdx + 1);
      }
    };
    trySelecaoRound(0);

    // Bolão: stats → insights
    getBolaoStats(COMPETITION_ID).then(data => {
      if (cancelled) return;
      setBolInsights(buildBolaoInsights(data.stats || {}, matchMap));
    }).catch(() => {});

    return () => { cancelled = true; };
  }, [candidateRounds, matchMap]);

  // Cycle seleção
  useEffect(() => {
    if (selInsights.length <= 1) return;
    const t = setInterval(() => setSelIdx(i => (i + 1) % selInsights.length), 3500);
    return () => clearInterval(t);
  }, [selInsights.length]);

  // Cycle bolão
  useEffect(() => {
    if (bolInsights.length <= 1) return;
    const t = setInterval(() => setBolIdx(i => (i + 1) % bolInsights.length), 4200);
    return () => clearInterval(t);
  }, [bolInsights.length]);

  const renderInsight = (item: InsightItem | undefined) => {
    if (!item) return null;
    const Icon = INSIGHT_ICONS[item.icon];
    const color = INSIGHT_COLORS[item.icon];
    return (
      <div className="flex items-center gap-1.5 min-w-0">
        <Icon className={`w-3 h-3 ${color} shrink-0`} />
        {item.logo && (
          <img src={logoUrl(item.logo, 32)} alt="" className="w-4 h-4 object-contain shrink-0" />
        )}
        <span className="text-[10px] font-semibold text-foreground truncate">
          {item.text}
        </span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Seleção da Galera */}
      <button
        onClick={() => navigate('/galera')}
        className="bg-card rounded-xl border border-border p-4 text-left hover:border-primary/20 transition-all active:scale-[0.97]"
      >
        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-3">
          <Vote className="w-4 h-4 text-green-600" />
        </div>
        <h3 className="text-sm font-bold text-foreground leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Seleção da<br />Galera
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">Vote nos melhores!</p>

        {selInsights.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-border min-h-[24px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={selIdx}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {renderInsight(selInsights[selIdx])}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </button>

      {/* Bolão da Galera */}
      <button
        onClick={() => navigate('/galera/bolao')}
        className="bg-card rounded-xl border border-border p-4 text-left hover:border-primary/20 transition-all active:scale-[0.97]"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center mb-3">
          <Target className="w-4 h-4 text-amber-500" />
        </div>
        <h3 className="text-sm font-bold text-foreground leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
          Bolão da<br />Galera
        </h3>
        <p className="text-[10px] text-muted-foreground mt-1">Dê seu palpite!</p>

        {bolInsights.length > 0 && (
          <div className="mt-2.5 pt-2.5 border-t border-border min-h-[24px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={bolIdx}
                initial={{ y: 14, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -14, opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {renderInsight(bolInsights[bolIdx])}
              </motion.div>
            </AnimatePresence>
          </div>
        )}
      </button>
    </div>
  );
}

// ── PREMIUM TASTING ─────────────────────────────────────────

const HOME_FREE_ROWS = 3;
const HOME_REDACTED_ROWS = 3;

interface MiniRankingRow {
  playerId: string;
  name: string;
  teamShort: string;
  teamLogo: string;
  value: number;
}

function MiniRankings({ navigate }: { navigate: (path: string) => void }) {
  const [scorers, setScorers] = useState<MiniRankingRow[]>([]);
  const [assists, setAssists] = useState<MiniRankingRow[]>([]);
  const isPremium = useIsPremium();

  useEffect(() => {
    fetchAllPlayers().then(players => {
      const toRow = (p: Player, val: number): MiniRankingRow => ({
        playerId: p.id,
        name: p.name,
        teamShort: (p.team as any)?.short_name || '',
        teamLogo: (p.team as any)?.logo_url || '',
        value: val,
      });
      setScorers(
        players
          .filter(p => (p.total_goals ?? 0) > 0)
          .map(p => toRow(p, p.total_goals ?? 0))
          .sort((a, b) => b.value - a.value),
      );
      setAssists(
        players
          .filter(p => (p.total_assists ?? 0) > 0)
          .map(p => toRow(p, p.total_assists ?? 0))
          .sort((a, b) => b.value - a.value),
      );
    }).catch(() => {});
  }, []);

  if (scorers.length === 0 && assists.length === 0) return null;

  const renderRanking = (
    title: string,
    icon: React.ComponentType<{ className?: string }>,
    data: MiniRankingRow[],
    valueColor: string,
    route: string,
    valueLabel: string,
  ) => {
    if (data.length === 0) return null;
    const showRedacted = !isPremium && data.length > HOME_FREE_ROWS;
    const visibleRows = data.slice(0, HOME_FREE_ROWS);
    const redactedRows = showRedacted
      ? data.slice(HOME_FREE_ROWS, HOME_FREE_ROWS + HOME_REDACTED_ROWS)
      : [];
    const hiddenCount = Math.max(0, data.length - HOME_FREE_ROWS);

    return (
      <section>
        <SectionHeader
          title={title}
          icon={icon}
          trailing={
            <button onClick={() => navigate(route)} className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:text-primary/80 transition-colors">
              Ver tudo <ArrowRight className="w-3 h-3" />
            </button>
          }
        />
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Real rows */}
          {visibleRows.map((row, idx) => {
            const pos = idx + 1;
            const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
            return (
              <button
                key={row.playerId}
                onClick={() => navigate(`/jogador/${row.playerId}`)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors ${idx < visibleRows.length - 1 || redactedRows.length > 0 ? 'border-b border-border' : ''}`}
              >
                <span
                  className={`w-5 text-center text-xs font-bold ${pos <= 3 ? medalColors[pos - 1] : 'text-subtle'}`}
                  style={{ fontFamily: 'var(--font-mono)' }}
                >
                  {pos}
                </span>
                <TeamLogo url={row.teamLogo} name={row.teamShort} size={20} />
                <span className="text-xs font-semibold text-foreground truncate flex-1 text-left">
                  {row.name}
                </span>
                <span className="text-[10px] text-muted-foreground">{row.teamShort}</span>
                <span className={`text-sm font-bold ${valueColor}`} style={{ fontFamily: 'var(--font-mono)' }}>
                  {row.value}
                </span>
              </button>
            );
          })}

          {/* Redacted rows — show structure, hide data */}
          {redactedRows.map((row, idx) => {
            const pos = HOME_FREE_ROWS + idx + 1;
            return (
              <div
                key={`redacted-${idx}`}
                className={`flex items-center gap-2.5 px-3 py-2.5 ${idx < redactedRows.length - 1 ? 'border-b border-border' : ''}`}
              >
                <span className="w-5 text-center text-xs font-bold text-subtle" style={{ fontFamily: 'var(--font-mono)' }}>
                  {pos}
                </span>
                <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                <span className="text-xs text-muted-foreground truncate flex-1 text-left">
                  {redact(row.name, 'name')}
                </span>
                <span className="text-[10px] text-muted-foreground">{redact(row.teamShort, 'name')}</span>
                <span className="text-sm font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  {redact(row.value, 'number')}
                </span>
              </div>
            );
          })}
        </div>

        {/* Unlock CTA */}
        {showRedacted && (
          <UnlockBanner
            label={`Revelar ${valueLabel} completa`}
            hiddenCount={hiddenCount}
          />
        )}
      </section>
    );
  };

  return (
    <>
      {renderRanking('Artilharia', Trophy, scorers, 'text-green-600', '/artilharia', 'artilharia')}
      {renderRanking('Assistências', Target, assists, 'text-purple-600', '/assistencias', 'assistências')}
    </>
  );
}

// ── STATS CARDS ─────────────────────────────────────────────

// ── DISCIPLINE SUMMARY (Home) ───────────────────────────────

function DisciplineSummary({ navigate }: { navigate: (path: string) => void }) {
  const [data, setData] = useState<DisciplineOverview | null>(null);
  const userIsPremium = useIsPremium();

  useEffect(() => {
    fetchDisciplineOverview(COMPETITION_ID).then(setData).catch(() => {});
  }, []);

  if (!data || (data.stats.suspended === 0 && data.stats.pendurados === 0 && data.stats.totalYellows === 0)) return null;

  const suspended = data.entries.filter(e => e.is_suspended).slice(0, 3);
  const pendurados = data.entries.filter(e => e.is_pendurado).slice(0, 3);
  const yellows = data.stats.totalYellows;
  const reds = data.stats.totalReds;

  return (
    <section>
      <SectionHeader
        title="Disciplina"
        icon={AlertTriangle}
        trailing={
          <button onClick={() => navigate('/cartoes')} className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:text-primary/80 transition-colors">
            Ver tudo <ArrowRight className="w-3 h-3" />
          </button>
        }
      />

      {/* Summary stats row */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        <div className="bg-card rounded-xl border border-border p-2 text-center">
          <p className="text-base font-black text-yellow-600" style={{ fontFamily: 'var(--font-mono)' }}>{yellows}</p>
          <p className="text-[7px] font-semibold text-muted-foreground uppercase tracking-wider">Amarelos</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-2 text-center">
          <p className="text-base font-black text-red-500" style={{ fontFamily: 'var(--font-mono)' }}>{reds}</p>
          <p className="text-[7px] font-semibold text-muted-foreground uppercase tracking-wider">Vermelhos</p>
        </div>
        <div className="bg-card rounded-xl border border-red-500/20 p-2 text-center">
          <p className="text-base font-black text-red-600" style={{ fontFamily: 'var(--font-mono)' }}>{data.stats.suspended}</p>
          <p className="text-[7px] font-semibold text-muted-foreground uppercase tracking-wider">Suspensos</p>
        </div>
        <div className="bg-card rounded-xl border border-yellow-500/20 p-2 text-center">
          <p className="text-base font-black text-amber-600" style={{ fontFamily: 'var(--font-mono)' }}>{data.stats.pendurados}</p>
          <p className="text-[7px] font-semibold text-muted-foreground uppercase tracking-wider">Pendurados</p>
        </div>
      </div>

      {/* Suspended players (visible) */}
      {suspended.length > 0 && (
        <div className="bg-card rounded-xl border border-red-500/20 overflow-hidden mb-2">
          <div className="px-3 py-2 border-b border-border flex items-center gap-1.5">
            <Ban className="w-3 h-3 text-red-500" />
            <span className="text-[10px] font-bold text-red-600 uppercase" style={{ fontFamily: 'var(--font-heading)' }}>Suspensos</span>
          </div>
          {suspended.map((e, i) => (
            <button
              key={e.player_id}
              onClick={() => navigate(`/jogador/${e.player_id}`)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors ${i < suspended.length - 1 ? 'border-b border-border' : ''}`}
            >
              {e.team_logo ? (
                <img src={logoUrl(e.team_logo, 32)} alt="" className="w-5 h-5 object-contain shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
              )}
              <div className="flex-1 min-w-0 text-left">
                <span className="text-xs font-semibold text-foreground truncate block">{e.player_name}</span>
                <span className="text-[9px] text-muted-foreground">{e.team_short_name}</span>
              </div>
              {e.suspension_reason && (
                <span className="text-[8px] text-red-500 truncate max-w-[90px] hidden sm:block">{e.suspension_reason}</span>
              )}
              {e.next_eligible_round && (
                <span className="text-[8px] text-muted-foreground shrink-0">Rod. {e.next_eligible_round}</span>
              )}
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
            </button>
          ))}
          {data.stats.suspended > 3 && (
            <button onClick={() => navigate('/cartoes')} className="w-full text-center py-2 text-[10px] text-primary font-semibold border-t border-border hover:bg-muted">
              +{data.stats.suspended - 3} suspensos → ver todos
            </button>
          )}
        </div>
      )}

      {/* Pendurados — FREE (this is high-value info that hooks people) */}
      {pendurados.length > 0 && (
        <div className="bg-card rounded-xl border border-yellow-500/20 overflow-hidden">
          <div className="px-3 py-2 border-b border-border flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3 text-yellow-500" />
            <span className="text-[10px] font-bold text-amber-600 uppercase" style={{ fontFamily: 'var(--font-heading)' }}>Pendurados</span>
            <span className="text-[8px] text-muted-foreground ml-auto">{data.stats.pendurados} jogadores</span>
          </div>
          {pendurados.map((e, i) => (
            <button
              key={e.player_id}
              onClick={() => navigate(`/jogador/${e.player_id}`)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted transition-colors ${i < pendurados.length - 1 ? 'border-b border-border' : ''}`}
            >
              {e.team_logo ? (
                <img src={logoUrl(e.team_logo, 32)} alt="" className="w-5 h-5 object-contain shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
              )}
              <span className="text-xs font-semibold text-foreground truncate flex-1">{e.player_name}</span>
              <span className="text-[9px] text-muted-foreground">{e.team_short_name}</span>
              <div className="flex items-center gap-0.5 shrink-0">
                {Array.from({ length: e.yellow_accumulator }).map((_, j) => (
                  <div key={j} className="w-1.5 h-2.5 rounded-[1px] bg-yellow-400" />
                ))}
                <div className="w-1.5 h-2.5 rounded-[1px] border border-dashed border-yellow-400/50" />
              </div>
              <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
            </button>
          ))}
          {data.stats.pendurados > 3 && (
            <button onClick={() => navigate('/cartoes')} className="w-full text-center py-2 text-[10px] text-primary font-semibold border-t border-border hover:bg-muted">
              +{data.stats.pendurados - 3} pendurados → ver todos
            </button>
          )}
        </div>
      )}

      {/* Rules footnote */}
      {data.rules && (
        <p className="text-[8px] text-subtle text-center mt-2">
          {data.rules.yellows_for_suspension} CA acumulados = {data.rules.suspension_games} jogo(s) de suspensão
          {data.rules.red_card_fine > 0 && ` · Vermelho = R$ ${data.rules.red_card_fine.toFixed(0)} multa`}
        </p>
      )}
    </section>
  );
}

function StatsCards({ matches, teams }: { matches: Match[]; teams: Team[] }) {
  const finished = matches.filter(m => m.status === 'finished');
  const totalMatches = matches.length;
  const totalGoals = finished.reduce((sum, m) => sum + (m.score_home || 0) + (m.score_away || 0), 0);
  const avg = finished.length > 0 ? (totalGoals / finished.length).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-primary rounded-2xl p-3 text-center text-white">
        <Calendar className="w-4 h-4 mx-auto mb-1 opacity-80" />
        <p className="text-lg font-black" style={{ fontFamily: 'var(--font-mono)' }}>{finished.length}/{totalMatches}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">JOGOS</p>
      </div>
      <div className="bg-primary rounded-2xl p-3 text-center text-white">
        <Flame className="w-4 h-4 mx-auto mb-1 opacity-80" />
        <p className="text-lg font-black" style={{ fontFamily: 'var(--font-mono)' }}>{totalGoals}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">GOLS</p>
      </div>
      <div className="bg-primary rounded-2xl p-3 text-center text-white">
        <Zap className="w-4 h-4 mx-auto mb-1 opacity-80" />
        <p className="text-lg font-black" style={{ fontFamily: 'var(--font-mono)' }}>{avg}</p>
        <p className="text-[9px] font-bold uppercase tracking-wider opacity-80">MÉDIA</p>
      </div>
    </div>
  );
}

// ── MATCH CARD (Horizontal Layout) ──────────────────────────

function MatchCard({ match, onClick, navigate }: { match: Match; onClick: () => void; navigate: (path: string) => void }) {
  const hasScore = match.score_home !== null && match.score_away !== null;
  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live' || match.status === 'in_progress' || (match as any).scout_status === 'live_half1' || (match as any).scout_status === 'live_half2';
  const playoffLabels = getPlayoffLabels(match);

  const goTeam = (e: React.MouseEvent, team?: { slug?: string; id?: string }) => {
    if (!team) return;
    e.stopPropagation();
    navigate(`/time/${team.slug || team.id}`);
  };

  const date = new Date(match.match_date);
  const dateLabel = format(date, "dd MMM", { locale: ptBR }).toUpperCase();
  const timeLabel = format(date, "HH:mm");

  return (
    <button
      onClick={onClick}
      className="w-full bg-card rounded-xl border border-border hover:border-primary/20 px-4 py-3.5 transition-all active:scale-[0.98]"
    >
      <div className="flex items-center">
        {/* Home team */}
        <div className="flex-1 flex items-center gap-2.5 min-w-0">
          <div className="shrink-0" onClick={(e) => goTeam(e, match.home_team)}>
            {playoffLabels ? (
              <div className="w-10 h-10 rounded-full bg-muted/60 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-[9px] font-bold" style={{ fontFamily: 'var(--font-mono)' }}>?</div>
            ) : (
              <TeamLogo url={match.home_team?.logo_url} name={match.home_team?.short_name || '?'} size={40} />
            )}
          </div>
          <span
            className="text-xs font-bold text-foreground truncate uppercase"
            style={{ fontFamily: 'var(--font-heading)' }}
            onClick={(e) => goTeam(e, match.home_team)}
          >
            {playoffLabels ? playoffLabels.home : (match.home_team?.short_name || match.home_team?.name || '?')}
          </span>
        </div>

        {/* Center: score or date/time */}
        <div className="shrink-0 px-3 text-center min-w-[80px]">
          {hasScore ? (
            <div className="flex items-center justify-center gap-1.5">
              <span className={`text-xl font-black ${isFinished ? 'text-foreground' : 'text-primary'}`} style={{ fontFamily: 'var(--font-mono)' }}>{match.score_home}</span>
              <span className="text-xs text-muted-foreground font-light">&ndash;</span>
              <span className={`text-xl font-black ${isFinished ? 'text-foreground' : 'text-primary'}`} style={{ fontFamily: 'var(--font-mono)' }}>{match.score_away}</span>
            </div>
          ) : (
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase" style={{ fontFamily: 'var(--font-heading)' }}>{dateLabel}</p>
              <p className="text-base font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{timeLabel}</p>
            </div>
          )}
          {isLive && (
            <span className="inline-flex items-center gap-1 text-red-500 text-[8px] font-bold mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              AO VIVO
            </span>
          )}
          {isFinished && (
            <p className="text-[9px] text-muted-foreground font-medium uppercase mt-0.5">Encerrado</p>
          )}
          {match.broadcast && !isLive && !isFinished && (
            <div className="mt-1"><BroadcastBadge /></div>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex items-center justify-end gap-2.5 min-w-0">
          <span
            className="text-xs font-bold text-foreground truncate uppercase text-right"
            style={{ fontFamily: 'var(--font-heading)' }}
            onClick={(e) => goTeam(e, match.away_team)}
          >
            {playoffLabels ? playoffLabels.away : (match.away_team?.short_name || match.away_team?.name || '?')}
          </span>
          <div className="shrink-0" onClick={(e) => goTeam(e, match.away_team)}>
            {playoffLabels ? (
              <div className="w-10 h-10 rounded-full bg-muted/60 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground text-[9px] font-bold" style={{ fontFamily: 'var(--font-mono)' }}>?</div>
            ) : (
              <TeamLogo url={match.away_team?.logo_url} name={match.away_team?.short_name || '?'} size={40} />
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ── MINI STANDINGS ──────────────────────────────────────────

function MiniStandings({ standings, onViewAll, navigate }: { standings: StandingRow[]; onViewAll: () => void; navigate: (path: string) => void }) {
  if (standings.length === 0) return null;
  return (
    <section>
      <SectionHeader
        title="Classificação"
        icon={BarChart3}
        trailing={
          <button onClick={onViewAll} className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:text-primary/80 transition-colors">
            Ver completa <ArrowRight className="w-3 h-3" />
          </button>
        }
      />
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-[20px_1fr_28px_24px_28px] gap-0 px-3 py-2 border-b border-border text-[10px] text-muted-foreground font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
          <span className="text-center">#</span><span>Time</span><span className="text-center">P</span><span className="text-center">J</span><span className="text-center">SG</span>
        </div>
        {standings.map((row, idx) => {
          const pos = idx + 1;
          return (
            <div key={row.team.id} onClick={() => navigate(`/time/${row.team.slug || row.team.id}`)} className={`grid grid-cols-[20px_1fr_28px_24px_28px] gap-0 px-3 py-2.5 items-center cursor-pointer hover:bg-muted/50 transition-colors ${idx < standings.length - 1 ? 'border-b border-border' : ''}`}>
              <span className={`text-center text-[11px] font-bold ${pos <= 4 ? 'text-primary' : 'text-destructive'}`} style={{ fontFamily: 'var(--font-mono)' }}>{pos}</span>
              <div className="flex items-center gap-2 min-w-0">
                <TeamLogo url={row.team.logo_url} name={row.team.short_name} size={24} />
                <span className="text-[12px] font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>{row.team.short_name}</span>
              </div>
              <span className="text-center text-[12px] font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{row.points}</span>
              <span className="text-center text-[11px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{row.played}</span>
              <span className={`text-center text-[11px] font-semibold ${row.goalDifference > 0 ? 'text-green-600' : row.goalDifference < 0 ? 'text-red-500' : 'text-muted-foreground'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-3 mt-2 px-1">
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500" /><span className="text-[9px] text-muted-foreground">Semifinal</span></div>
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500" /><span className="text-[9px] text-muted-foreground">Eliminado</span></div>
      </div>
    </section>
  );
}

// ── NEWS SECTION ────────────────────────────────────────────

function NewsSection({ articles, onSeeAll }: { articles: Article[]; onSeeAll: () => void }) {
  if (articles.length === 0) return null;
  return (
    <section>
      <SectionHeader
        title="Notícias"
        icon={Newspaper}
        trailing={
          <button onClick={onSeeAll} className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:text-primary/80 transition-colors">
            Ver todas <ArrowRight className="w-3 h-3" />
          </button>
        }
      />
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 scrollbar-hide">
        {articles.slice(0, 5).map(article => (
          <a
            key={article.id}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 w-64 bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all active:scale-[0.98]"
          >
            {article.image && (
              <div className="h-32 overflow-hidden relative">
                <img
                  src={newsImageUrl(article.image, 512)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-2 left-3 right-3">
                  <span className="text-[8px] font-bold text-white bg-primary px-1.5 py-0.5 rounded-full uppercase">
                    {article.categories[0] || 'Esporte'}
                  </span>
                </div>
              </div>
            )}
            <div className="p-3">
              <h3
                className="text-[11px] font-bold text-foreground leading-snug line-clamp-2"
                style={{ fontFamily: 'var(--font-heading)' }}
                dangerouslySetInnerHTML={{ __html: article.title }}
              />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════

export function HomePage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState<number>(1);
  const [rounds, setRounds] = useState<number[]>([]);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');

  const loadData = useCallback(async () => {
    try {
      const [matchesData, teamsData] = await Promise.all([fetchMatches(), fetchTeams()]);

      // Fetch news separately to not block main data
      fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a98fb753/news?per_page=5`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      ).then(r => r.json()).then(d => {
        if (d.articles) setArticles(d.articles);
      }).catch(e => console.error('News fetch error:', e));

      // Filtrar partidas inválidas (placeholders onde time joga contra ele mesmo)
      const validMatches = matchesData.filter(m => !(m.home_team_id && m.away_team_id && m.home_team_id === m.away_team_id));
      setMatches(validMatches);
      setTeams(teamsData);
      const calc = buildStandingsFromTeams(teamsData, validMatches);
      setStandings(calc);
      const roundSet = new Set<number>();
      validMatches.forEach(m => { if (m.round_number) roundSet.add(m.round_number); });
      const sortedRounds = Array.from(roundSet).sort((a, b) => a - b);
      setRounds(sortedRounds);
      const now = new Date();
      const liveRound = sortedRounds.find(r => validMatches.some(m => m.round_number === r && (m.status === 'live' || m.status === 'in_progress')));
      if (liveRound) {
        setSelectedRound(liveRound);
      } else {
        let bestRound = sortedRounds[0];
        let bestScore = Infinity;
        for (const r of sortedRounds) {
          const roundMatchesList = validMatches.filter(m => m.round_number === r);
          if (roundMatchesList.length === 0) continue;
          const hasUpcoming = roundMatchesList.some(m => m.status === 'scheduled' || m.status === 'upcoming');
          const closestDate = roundMatchesList.reduce((closest, m) => {
            const diff = Math.abs(new Date(m.match_date).getTime() - now.getTime());
            return diff < closest ? diff : closest;
          }, Infinity);
          const score = hasUpcoming ? closestDate * 0.5 : closestDate;
          if (score < bestScore) { bestScore = score; bestRound = r; }
        }
        setSelectedRound(bestRound);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh matches: 45s when live, 120s otherwise (detects when a game goes live)
  useEffect(() => {
    const hasLive = matches.some(m =>
      m.scout_status === 'live_half1' || m.scout_status === 'live_half2' ||
      m.status === 'live' || m.status === 'in_progress'
    );
    const interval = setInterval(() => {
      fetchMatches(true).then(data => {
        if (data?.length) {
          const valid = data.filter(m => !(m.home_team_id && m.away_team_id && m.home_team_id === m.away_team_id));
          setMatches(valid);
        }
      }).catch(() => {});
    }, hasLive ? 45000 : 120000);
    return () => clearInterval(interval);
  }, [matches]);

  // ============================
  // DERIVED DATA
  // ============================
  const roundMatches = useMemo(() =>
    matches.filter(m => m.round_number === selectedRound),
    [matches, selectedRound]
  );

  // Round status label for the carousel
  const roundStatusLabel = useMemo(() => {
    const rm = matches.filter(m => m.round_number === selectedRound);
    if (rm.length === 0) return '';
    const allFinished = rm.every(m => m.status === 'finished');
    const anyLive = rm.some(m => m.status === 'live' || m.status === 'in_progress');
    if (anyLive) return 'Em andamento';
    if (allFinished) return 'Encerrada';
    const scheduled = rm.filter(m => m.status !== 'finished').sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    if (scheduled.length > 0) {
      const d = new Date(scheduled[0].match_date);
      if (isToday(d)) return 'Hoje';
      if (isTomorrow(d)) return 'Amanhã';
      return format(d, "dd MMM", { locale: ptBR });
    }
    return '';
  }, [matches, selectedRound]);

  // Top standings for mini table
  const topStandings = useMemo(() => standings.slice(0, 6), [standings]);

  const handlePrevRound = () => {
    const idx = rounds.indexOf(selectedRound);
    if (idx > 0) {
      setSlideDirection('left');
      setSelectedRound(rounds[idx - 1]);
    }
  };
  const handleNextRound = () => {
    const idx = rounds.indexOf(selectedRound);
    if (idx < rounds.length - 1) {
      setSlideDirection('right');
      setSelectedRound(rounds[idx + 1]);
    }
  };

  if (loading) return <HomeSkeleton />;

  return (
    <PageTransition>
      <div className="px-4 py-4 pb-8 space-y-5">

        {/* ── Competition selector ── */}
        <div style={fadeIn(0)} className="relative z-50">
          <CompetitionSelector />
        </div>

        {/* ── Hero: Title + Team logos ── */}
        <div style={fadeUp(0.03)}>
          <HeroSection teams={teams} navigate={navigate} />
        </div>

        {/* ── Galera: Seleção + Bolão cards ── */}
        <div style={fadeUp(0.06)}>
          <GaleraCards navigate={navigate} matches={matches} />
        </div>

        {/* ── Stats cards ── */}
        <div style={fadeUp(0.09)}>
          <StatsCards matches={matches} teams={teams} />
        </div>

        {/* ── Jogos — SofaScore-style: single round carousel ── */}
        <section style={fadeUp(0.12)}>
          <SectionHeader title="Jogos" icon={Calendar} />
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handlePrevRound}
              disabled={rounds.indexOf(selectedRound) <= 0}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-20"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Rodada {selectedRound}
              </span>
              {roundStatusLabel && (
                <p className="text-[10px] text-muted-foreground font-medium">{roundStatusLabel}</p>
              )}
            </div>
            <button
              onClick={handleNextRound}
              disabled={rounds.indexOf(selectedRound) >= rounds.length - 1}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground disabled:opacity-20"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {/* Round pills for quick jump */}
          <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1 justify-center">
            {rounds.map(r => {
              const isActive = r === selectedRound;
              const rm = matches.filter(m => m.round_number === r);
              const allDone = rm.every(m => m.status === 'finished');
              const anyLive = rm.some(m => m.status === 'live' || m.status === 'in_progress');
              return (
                <button
                  key={r}
                  onClick={() => {
                    setSlideDirection(r > selectedRound ? 'right' : 'left');
                    setSelectedRound(r);
                  }}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                    isActive
                      ? 'bg-primary text-white'
                      : anyLive
                        ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                        : allDone
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-card border border-border text-foreground'
                  }`}
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={selectedRound}
              initial={{ x: slideDirection === 'right' ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: slideDirection === 'right' ? -60 : 60, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="space-y-2.5"
            >
              {roundMatches.length > 0 ? (
                roundMatches.map(m => (
                  <MatchCard key={m.id} match={m} onClick={() => navigate(`/jogo/${m.id}`)} navigate={navigate} />
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Nenhuma partida nesta rodada
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* ── Mini classificação ── */}
        <div style={fadeUp(0.21)}>
          <MiniStandings standings={topStandings} onViewAll={() => navigate('/classificacao')} navigate={navigate} />
        </div>

        {/* ── Mini rankings (artilharia + assistências com dados redigidos) ── */}
        <div style={fadeUp(0.24)}>
          <MiniRankings navigate={navigate} />
        </div>

        {/* ── Discipline summary ── */}
        <div style={fadeUp(0.27)}>
          <DisciplineSummary navigate={navigate} />
        </div>

        {/* ── Notícias ── */}
        <div style={fadeUp(0.30)}>
          <NewsSection articles={articles} onSeeAll={() => window.open('https://www.poder7.com.br', '_blank')} />
        </div>

      </div>
    </PageTransition>
  );
}