import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, User, AlertTriangle, Clock, Footprints, Ruler, Weight, Flag, Share2, Star, Trophy, TrendingUp, Zap, Target, BarChart3, Calendar, ChevronRight, Shield, Award } from 'lucide-react';
import { fetchPlayerById, fetchAllEvents, fetchMatches, fetchPlayerLineups, fetchAllPlayers, type Player, type MatchEvent, type Match, type MatchLineup, formatEventTime, COMPETITION_ID } from '../lib/public-supabase';
import { PremiumPageGate, FreemiumCutoff } from '../components/public/PremiumGate';
import { format, differenceInYears } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { PageTransition } from '../components/public/PageTransition';
import { SectionHeader } from '../components/public/SectionHeader';
import { PlayerSkeleton } from '../components/public/Skeletons';
import { shareContent, getPositionLabel, getVoteResults } from '../lib/galera-api';
import { logoUrl, photoUrl } from '../lib/image-utils';
import { motion } from 'motion/react';

function TeamLogo({ url, name, size = 32 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0"
        style={{ width: size, height: size, fontFamily: 'var(--font-heading)', fontSize: size * 0.3 }}>
        {name.slice(0, 2)}
      </div>
    );
  }
  return <img src={logoUrl(url, size)} alt={name} width={size} height={size} loading="lazy" decoding="async" onError={() => setErr(true)} className="object-contain shrink-0" />;
}

const EVENT_ICONS: Record<string, { label: string; color: string; isCard?: boolean }> = {
  goal: { label: 'G', color: 'bg-green-500 text-white' },
  own_goal: { label: 'GC', color: 'bg-red-500 text-white' },
  yellow_card: { label: '', color: 'bg-yellow-400 text-black', isCard: true },
  red_card: { label: '', color: 'bg-red-600 text-white', isCard: true },
  substitution: { label: 'S', color: 'bg-blue-500 text-white' },
  penalty_scored: { label: 'P', color: 'bg-green-500 text-white' },
  penalty_missed: { label: 'X', color: 'bg-red-500 text-white' },
};

const FOOT_LABELS: Record<string, string> = {
  right: 'Destro', left: 'Canhoto', both: 'Ambidestro',
};

// Rating color helper
function ratingColor(r: number): string {
  if (r >= 8) return 'text-green-500';
  if (r >= 7) return 'text-green-600';
  if (r >= 6) return 'text-amber-500';
  return 'text-red-500';
}
function ratingBg(r: number): string {
  if (r >= 8) return 'bg-green-500';
  if (r >= 7) return 'bg-green-600';
  if (r >= 6) return 'bg-amber-500';
  return 'bg-red-500';
}

export function PlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<Player | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [playerLineups, setPlayerLineups] = useState<MatchLineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selecaoData, setSelecaoData] = useState<any>(null);
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);

  useEffect(() => {
    async function load() {
      if (!id) return;
      const [p, allEvents, allMatches, lineups, playersData] = await Promise.all([
        fetchPlayerById(id), fetchAllEvents(), fetchMatches(), fetchPlayerLineups(id), fetchAllPlayers(),
      ]);
      setPlayer(p);
      setAllPlayers(playersData);
      const playerEvts = allEvents.filter(e => e.player_id === id);
      const assistEvents = allEvents.filter(e =>
        (e.detail as any)?.assist_player_id === id && e.event_type === 'goal'
      );
      const ids = new Set(playerEvts.map(e => e.id));
      const combined = [...playerEvts];
      assistEvents.forEach(ae => { if (!ids.has(ae.id)) combined.push(ae); });
      setEvents(combined);
      setMatches(allMatches);
      setPlayerLineups(lineups);
      setLoading(false);

      // Fetch seleção data for player's rounds
      const finishedRounds = [...new Set(allMatches.filter(m => m.status === 'finished').map(m => m.round_number))].sort((a, b) => a - b);
      if (finishedRounds.length > 0) {
        // Try most recent finished round
        const lastRound = finishedRounds[finishedRounds.length - 1];
        getVoteResults(COMPETITION_ID, lastRound).then(data => {
          if (data && !data.embargoed) {
            setSelecaoData({ round: lastRound, ...data });
          }
        }).catch(() => {});
      }
    }
    load();
  }, [id]);

  if (loading) return (<PlayerSkeleton />);
  if (!player) return (<div className="px-4 py-8 text-center"><p className="text-muted-foreground">Jogador não encontrado</p><button onClick={() => navigate(-1)} className="text-primary text-sm mt-3">Voltar</button></div>);

  const team = player.team;
  const playerEvents = events.filter(e => e.player_id === id);
  const computedGoals = playerEvents.filter(e => ['goal', 'penalty_scored'].includes(e.event_type)).length;
  const computedAssists = events.filter(e => (e.detail as any)?.assist_player_id === id && e.event_type === 'goal').length;
  const computedYellows = playerEvents.filter(e => e.event_type === 'yellow_card').length;
  const computedReds = playerEvents.filter(e => e.event_type === 'red_card').length;

  const goals = player.total_goals ?? computedGoals;
  const assists = player.total_assists ?? computedAssists;
  const yellows = player.total_yellow_cards ?? computedYellows;
  const reds = player.total_red_cards ?? computedReds;
  const totalGames = player.total_games;
  const totalMinutes = player.total_minutes;

  // Build complete match history from events + lineups
  const eventMatchIds = new Set(playerEvents.map(e => e.match_id));
  const lineupMatchIds = new Set(playerLineups.map(l => l.match_id));
  const allMatchIds = new Set([...eventMatchIds, ...lineupMatchIds]);

  const playerMatches = matches
    .filter(m => allMatchIds.has(m.id))
    .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

  // Compute minutes per match for display
  const lineupByMatch = new Map<string, MatchLineup>();
  playerLineups.forEach(l => lineupByMatch.set(l.match_id, l));

  const age = player.birth_date ? differenceInYears(new Date(), new Date(player.birth_date)) : null;
  const hasBio = player.height_cm || player.weight_kg || player.dominant_foot || player.nationality || player.birth_date;

  // Compute minutes per match using same logic as recalculateAllStats
  function computeMatchMinutes(m: Match): number | null {
    const lineup = lineupByMatch.get(m.id);
    if (!lineup) return null;
    const matchLength = 90 + (m.stoppage_time_1st || 0) + (m.stoppage_time_2nd || 0);
    const matchEvents = events.filter(e => e.match_id === m.id);
    const subEvents = matchEvents.filter(e => e.event_type === 'substitution');
    const redEvents = matchEvents.filter(e => e.event_type === 'red_card');
    const subbedOutAt: Record<string, number> = {};
    const subbedInAt: Record<string, number> = {};
    for (const sub of subEvents) {
      subbedOutAt[sub.player_id] = sub.minute || matchLength;
      const subInId = (sub.detail as any)?.substitute_player_id || (sub.detail as any)?.sub_player_id;
      if (subInId) subbedInAt[subInId] = sub.minute || 0;
    }
    const sentOffAt: Record<string, number> = {};
    for (const red of redEvents) {
      sentOffAt[red.player_id] = red.minute || matchLength;
    }
    if (lineup.is_starter) {
      const endMinute = subbedOutAt[lineup.player_id] ?? sentOffAt[lineup.player_id] ?? matchLength;
      return Math.max(0, endMinute);
    } else {
      const startMinute = subbedInAt[lineup.player_id];
      if (startMinute != null) {
        const endMinute = subbedOutAt[lineup.player_id] ?? sentOffAt[lineup.player_id] ?? matchLength;
        return Math.max(0, endMinute - startMinute);
      }
      return 0;
    }
  }

  // Seleção: check if this player was in the seleção results
  const selecaoPlayerTally = selecaoData?.tallies?.[id!];
  const selecaoWinner = selecaoData?.winners ? Object.values(selecaoData.winners).includes(id!) : false;

  // Per-game contributions
  const goalsPerGame = totalGames && totalGames > 0 ? (goals / totalGames) : 0;
  const assistsPerGame = totalGames && totalGames > 0 ? (assists / totalGames) : 0;
  const contributionsPerGame = goalsPerGame + assistsPerGame;

  // Rankings among all players
  const positionPlayers = allPlayers.filter(p => p.position === player.position);
  const goalRank = allPlayers.filter(p => (p.total_goals || 0) > goals).length + 1;
  const assistRank = allPlayers.filter(p => (p.total_assists || 0) > assists).length + 1;

  // Starter percentage
  const starterCount = playerLineups.filter(l => l.is_starter).length;
  const starterPct = playerMatches.length > 0 ? Math.round((starterCount / playerMatches.length) * 100) : 0;

  const teamColor = (team as any)?.color || '#3B82F6';

  return (
    <PremiumPageGate>
      <PageTransition>
      <div className="pb-6">
        <div className="px-4 pt-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
        </div>

        {/* ═══ Player Hero Header ═══ */}
        <div className="relative overflow-hidden">
          {/* Gradient background with team color */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${teamColor}25 0%, ${teamColor}08 50%, transparent 100%)`,
            }}
          />
          <div
            className="absolute top-0 right-0 w-32 h-32 opacity-[0.06]"
            style={{
              background: `radial-gradient(circle, ${teamColor} 0%, transparent 70%)`,
            }}
          />

          <div className="relative px-4 py-6">
            <div className="flex items-start gap-4">
              {/* Photo with number badge */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative shrink-0"
              >
                {player.photo_url ? (
                  <img src={photoUrl(player.photo_url, 96)} alt={player.name} className="w-24 h-24 rounded-2xl object-cover border-2 shadow-lg" style={{ borderColor: teamColor + '40' }} />
                ) : (
                  <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${teamColor}20, ${teamColor}40)` }}>
                    <User className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <span
                  className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md"
                  style={{ background: teamColor, fontFamily: 'var(--font-mono)' }}
                >
                  {player.number}
                </span>
                {/* Seleção badge */}
                {selecaoWinner && (
                  <span className="absolute -top-1.5 -left-1.5 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                    <Star className="w-3.5 h-3.5 text-white fill-white" />
                  </span>
                )}
              </motion.div>

              <div className="flex-1 min-w-0 pt-1">
                <h1 className="text-xl font-extrabold text-foreground leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>{player.name}</h1>
                <button onClick={() => navigate(`/time/${(team as any)?.slug || (team as any)?.id}`)} className="flex items-center gap-2 mt-1.5 hover:opacity-80 transition-opacity">
                  {team && <TeamLogo url={(team as any).logo_url} name={(team as any).short_name} size={20} />}
                  <span className="text-sm text-muted-foreground font-semibold">{(team as any)?.short_name || ''}</span>
                </button>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className="text-[10px] text-muted-foreground inline-block px-2 py-0.5 rounded-full bg-secondary font-semibold">{getPositionLabel(player.position) || 'Posição indefinida'}</span>
                  {player.is_suspended && (<span className="text-[9px] font-bold text-red-500 bg-red-500/15 px-2 py-0.5 rounded-full uppercase">Suspenso</span>)}
                  {!player.is_suspended && player.yellow_card_accumulator != null && player.yellow_card_accumulator >= 2 && (
                    <span className="text-[9px] font-bold text-yellow-600 bg-yellow-500/15 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <AlertTriangle className="w-2.5 h-2.5" /> Pendurado
                    </span>
                  )}
                  {selecaoWinner && (
                    <span className="text-[9px] font-bold text-amber-600 bg-amber-500/15 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                      <Star className="w-2.5 h-2.5" /> Seleção
                    </span>
                  )}
                </div>
              </div>

              {/* Share button */}
              <button
                onClick={async () => {
                  const statsText = [
                    goals > 0 ? `${goals} gols` : '',
                    assists > 0 ? `${assists} assist.` : '',
                    yellows > 0 ? `${yellows} CA` : '',
                    reds > 0 ? `${reds} CV` : '',
                  ].filter(Boolean).join(' \u00B7 ');
                  const text = `Confira ${player.name} (${(team as any)?.short_name || (team as any)?.name || ''}) no Power Sports!${statsText ? `\n${statsText}` : ''}\n26ª Regional Certel/Sicredi 2025`;
                  const url = `https://power.jornalfv.com.br/jogador/${id}`;
                  if (navigator.share) {
                    try { await navigator.share({ title: player.name, text, url }); return; } catch { /* */ }
                  }
                  await shareContent(`${text}\n${url}`, player.name);
                }}
                className="w-9 h-9 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-primary transition-colors shrink-0"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="px-4 mt-2">

          {/* ═══ Key Stats — Hero Numbers ═══ */}
          <section>
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Gols', value: goals, color: 'text-green-600', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/20', icon: null as string | null },
                { label: 'Assist.', value: assists, color: 'text-blue-600', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', icon: null },
                { label: '', value: yellows, color: 'text-yellow-600', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/20', icon: 'yellow_card' },
                { label: '', value: reds, color: 'text-red-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/20', icon: 'red_card' },
              ].map((s, i) => (
                <motion.div
                  key={s.label || `card-${i}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}
                  className={`${s.bgColor} rounded-xl border ${s.borderColor} p-3 text-center`}
                >
                  <p className={`text-2xl font-black ${s.color}`} style={{ fontFamily: 'var(--font-mono)' }}>{s.value}</p>
                  {s.icon ? (
                    <div className="flex justify-center mt-1.5">
                      <div className={`w-3 h-4 rounded-[2px] ${s.icon === 'yellow_card' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                    </div>
                  ) : (
                    <p className="text-[10px] text-muted-foreground font-semibold mt-1">{s.label}</p>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Games / Minutes / Rating row */}
            {(totalGames != null || totalMinutes != null || player.avg_rating != null) && (
              <div className="grid grid-cols-3 gap-2 mt-2">
                {totalGames != null && (
                  <div className="bg-card rounded-xl border border-border p-3 text-center">
                    <p className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{totalGames}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Jogos</p>
                    {totalGames > 0 && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">{starterCount} titular · {starterPct}%</p>
                    )}
                  </div>
                )}
                {totalMinutes != null && totalMinutes > 0 && (
                  <div className="bg-card rounded-xl border border-border p-3 text-center">
                    <p className="text-xl font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{totalMinutes}'</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Minutos</p>
                    {totalGames && totalGames > 0 && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">{Math.round(totalMinutes / totalGames)}'/jogo</p>
                    )}
                  </div>
                )}
                {player.avg_rating != null && (
                  <div className="bg-card rounded-xl border border-border p-3 text-center">
                    <p className={`text-xl font-black ${ratingColor(player.avg_rating)}`} style={{ fontFamily: 'var(--font-mono)' }}>{player.avg_rating.toFixed(1)}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">Nota média</p>
                    <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${ratingBg(player.avg_rating)}`} style={{ width: `${Math.min((player.avg_rating / 10) * 100, 100)}%` }} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Contributions per game bar */}
            {totalGames != null && totalGames > 0 && (goals + assists > 0) && (
              <div className="mt-2 bg-card rounded-xl border border-border p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-xs text-foreground font-semibold">Participação em gols</span>
                  </div>
                  <span className="text-sm font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                    {(contributionsPerGame).toFixed(2)}/jogo
                  </span>
                </div>
                <div className="flex h-2 rounded-full bg-secondary overflow-hidden">
                  {goalsPerGame > 0 && (
                    <div className="bg-green-500 h-full" style={{ width: `${(goalsPerGame / Math.max(contributionsPerGame, 1)) * 100}%` }} />
                  )}
                  {assistsPerGame > 0 && (
                    <div className="bg-blue-500 h-full" style={{ width: `${(assistsPerGame / Math.max(contributionsPerGame, 1)) * 100}%` }} />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[9px] text-muted-foreground">{goals} gols</span></div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500" /><span className="text-[9px] text-muted-foreground">{assists} assist.</span></div>
                </div>
              </div>
            )}

            {/* Rankings */}
            {(goals > 0 || assists > 0) && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {goals > 0 && (
                  <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <Trophy className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{goalRank}º</p>
                      <p className="text-[9px] text-muted-foreground">Artilharia geral</p>
                    </div>
                  </div>
                )}
                {assists > 0 && (
                  <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{assistRank}º</p>
                      <p className="text-[9px] text-muted-foreground">Assistências geral</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Average minutes per game */}
            {totalMinutes != null && totalMinutes > 0 && totalGames != null && totalGames > 0 && (
              <div className="mt-2 bg-card rounded-xl border border-border p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground font-semibold">Média por jogo</span>
                  </div>
                  <span className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                    {Math.round(totalMinutes / totalGames)} min
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min((totalMinutes / totalGames / 90) * 100, 100)}%` }} />
                </div>
              </div>
            )}
          </section>

          {/* ═══ Seleção da Galera ═══ */}
          {selecaoPlayerTally && (
            <section>
              <SectionHeader title="Seleção da Galera" icon={Star} />
              <div className="bg-card rounded-xl border border-amber-500/20 p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04]">
                  <Star className="w-full h-full" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-amber-600 font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
                        Rodada {selecaoData.round}
                      </p>
                      <p className="text-2xl font-black text-foreground mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
                        {selecaoPlayerTally.avg?.toFixed(1) || '-'}
                      </p>
                      <p className="text-[10px] text-muted-foreground">nota média dos torcedores</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                        {selecaoPlayerTally.votes || 0}
                      </p>
                      <p className="text-[9px] text-muted-foreground">votos</p>
                      {selecaoWinner && (
                        <div className="mt-2 flex items-center gap-1 text-amber-600">
                          <Award className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-bold uppercase">Eleito</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {selecaoPlayerTally.avg && (
                    <div className="mt-3 h-2 rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full ${ratingBg(selecaoPlayerTally.avg)}`} style={{ width: `${(selecaoPlayerTally.avg / 10) * 100}%` }} />
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ═══ Discipline Status ═══ */}
          {(player.is_suspended || (player.yellow_card_accumulator != null && player.yellow_card_accumulator > 0)) && (
            <section>
              <SectionHeader title="Situação Disciplinar" icon={AlertTriangle} />
              {player.is_suspended && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-red-500 font-bold">Suspenso</p>
                    <p className="text-[10px] text-muted-foreground">
                      {player.suspension_until?.startsWith('round:')
                        ? `Volta na rodada ${player.suspension_until.replace('round:', '')}`
                        : player.suspension_until
                          ? `Até ${format(new Date(player.suspension_until), "dd/MM/yyyy")}`
                          : 'Cumprindo suspensão'
                      }
                    </p>
                  </div>
                </div>
              )}
              {!player.is_suspended && player.yellow_card_accumulator != null && player.yellow_card_accumulator > 0 && (
                <div className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${
                  player.yellow_card_accumulator >= 2
                    ? 'bg-yellow-500/10 border-yellow-500/20'
                    : 'bg-card border-border'
                }`}>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {Array.from({ length: player.yellow_card_accumulator }).map((_, i) => (
                      <div key={i} className="w-3 h-4 rounded-[2px] bg-yellow-400" />
                    ))}
                    {player.yellow_card_accumulator < 3 && (
                      <div className="w-3 h-4 rounded-[2px] border border-dashed border-yellow-400/40" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-xs font-bold ${player.yellow_card_accumulator >= 2 ? 'text-yellow-600' : 'text-foreground'}`}>
                      {player.yellow_card_accumulator >= 2 ? 'Pendurado' : `${player.yellow_card_accumulator} cartão acumulado`}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {player.yellow_card_accumulator >= 2
                        ? 'Próximo amarelo gera suspensão automática'
                        : `Faltam ${3 - player.yellow_card_accumulator} para suspensão`
                      }
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {/* ═══ Bio Info ═══ */}
          {hasBio && (
            <section>
              <SectionHeader title="Perfil" icon={User} />
              <div className="grid grid-cols-2 gap-2">
                {player.birth_date && age !== null && (
                  <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{age} anos</p>
                      <p className="text-[9px] text-muted-foreground">{format(new Date(player.birth_date), "dd/MM/yyyy")}</p>
                    </div>
                  </div>
                )}
                {player.height_cm && (
                  <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Ruler className="w-4 h-4 text-blue-500" />
                    </div>
                    <div><p className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{player.height_cm} cm</p><p className="text-[9px] text-muted-foreground">Altura</p></div>
                  </div>
                )}
                {player.weight_kg && (
                  <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Weight className="w-4 h-4 text-purple-500" />
                    </div>
                    <div><p className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{player.weight_kg} kg</p><p className="text-[9px] text-muted-foreground">Peso</p></div>
                  </div>
                )}
                {player.dominant_foot && (
                  <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                      <Footprints className="w-4 h-4 text-green-500" />
                    </div>
                    <div><p className="text-xs font-bold text-foreground">{FOOT_LABELS[player.dominant_foot] || player.dominant_foot}</p><p className="text-[9px] text-muted-foreground">Pé dominante</p></div>
                  </div>
                )}
                {player.nationality && (
                  <div className="bg-card rounded-xl border border-border p-3 flex items-center gap-2.5 col-span-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Flag className="w-4 h-4 text-amber-500" />
                    </div>
                    <div><p className="text-xs font-bold text-foreground">{player.nationality}</p><p className="text-[9px] text-muted-foreground">Nacionalidade</p></div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ═══ No Data Placeholder ═══ */}
          {!hasBio && !totalGames && goals === 0 && assists === 0 && playerMatches.length === 0 && (
            <section>
              <div className="bg-card rounded-xl border border-border p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Estatísticas em breve
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Os dados deste jogador serão atualizados conforme as partidas acontecem
                </p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {['Jogos', 'Gols', 'Assistências'].map(label => (
                    <div key={label} className="bg-secondary rounded-lg p-2.5 text-center">
                      <p className="text-lg font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>-</p>
                      <p className="text-[9px] text-muted-foreground">{label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ═══ Match History ═══ */}
          {playerMatches.length > 0 && (
            <FreemiumCutoff
              label={`Ver todas as ${playerMatches.length} partidas`}
              premiumContent={
                playerMatches.length > 2 ? (
                  <div className="space-y-2">
                    {playerMatches.slice(2, 4).map(m => {
                      const matchEvents = playerEvents.filter(e => e.match_id === m.id);
                      return (
                        <div key={m.id} className="bg-card rounded-xl border border-border px-3.5 py-3">
                          <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                            {m.home_team?.short_name} {m.score_home} - {m.score_away} {m.away_team?.short_name}
                          </span>
                          <div className="flex gap-1 mt-1">
                            {matchEvents.map(ev => (
                              <span key={ev.id} className="text-[10px] text-muted-foreground">{ev.event_type === 'goal' ? '\u26bd' : '\ud83d\udfe8'}</span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : undefined
              }
            >
            <section>
              <SectionHeader title="Histórico de Partidas" icon={Calendar} />
              <div className="space-y-2">
                {playerMatches.slice(0, 2).map(m => {
                  const matchEvents = playerEvents.filter(e => e.match_id === m.id);
                  const lineup = lineupByMatch.get(m.id);
                  const mins = computeMatchMinutes(m);
                  const isHome = m.home_team_id === player.team_id;
                  const teamWon = isHome
                    ? (m.score_home || 0) > (m.score_away || 0)
                    : (m.score_away || 0) > (m.score_home || 0);
                  const isDraw = (m.score_home || 0) === (m.score_away || 0);

                  return (
                    <button key={m.id} onClick={() => navigate(`/jogo/${m.id}`)}
                      className="w-full bg-card rounded-xl border border-border px-3.5 py-3 text-left hover:bg-muted transition-colors">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          {m.status === 'finished' && (
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${teamWon ? 'bg-green-500' : isDraw ? 'bg-yellow-500' : 'bg-red-500'}`} />
                          )}
                          <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                            {m.home_team?.short_name} {m.score_home} - {m.score_away} {m.away_team?.short_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {lineup && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                              lineup.is_starter
                                ? 'bg-primary/15 text-primary'
                                : 'bg-amber-500/15 text-amber-600'
                            }`}>
                              {lineup.is_starter ? 'Titular' : 'Reserva'}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground">{format(new Date(m.match_date), "dd/MM", { locale: ptBR })}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                          {matchEvents.length > 0 ? matchEvents.map(ev => {
                            const evIcon = EVENT_ICONS[ev.event_type] || { label: 'G', color: 'bg-green-500 text-white' };
                            return (
                              <span key={ev.id} className="flex items-center gap-0.5">
                                {evIcon.isCard ? (
                                  <span className={`w-2.5 h-3.5 rounded-[1.5px] ${ev.event_type === 'yellow_card' ? 'bg-yellow-400' : 'bg-red-500'}`} />
                                ) : (
                                  <span className={`text-[7px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold ${evIcon.color}`}>
                                    {evIcon.label}
                                  </span>
                                )}
                                {ev.minute != null && ev.minute > 0 && <span className="text-[10px] text-muted-foreground">{formatEventTime(ev.minute, ev.half)}</span>}
                              </span>
                            );
                          }) : (
                            <span className="text-[10px] text-muted-foreground/50">Sem eventos</span>
                          )}
                        </div>
                        {mins != null && mins > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0 ml-2">
                            <Clock className="w-2.5 h-2.5" /> {mins}'
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
            </FreemiumCutoff>
          )}

          {/* ═══ Team Link ═══ */}
          {team && (
            <button
              onClick={() => navigate(`/time/${(team as any)?.slug || (team as any)?.id}`)}
              className="w-full mt-4 bg-card rounded-xl border border-border px-4 py-3.5 flex items-center gap-3 hover:bg-muted transition-colors"
            >
              <TeamLogo url={(team as any).logo_url} name={(team as any).short_name} size={28} />
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Ver elenco do {(team as any)?.short_name}
                </p>
                <p className="text-[10px] text-muted-foreground">Elenco, jogos e estatísticas</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
      </PageTransition>
    </PremiumPageGate>
  );
}
