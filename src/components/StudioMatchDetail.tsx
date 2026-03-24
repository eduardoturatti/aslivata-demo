import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { BroadcastText, getTeamColor } from './BroadcastText';
import { fetchMatchLineups, fetchMatchTeamStats } from '../lib/supabase';
import type { SQLMatch, SQLMatchEvent, SQLTeam, SQLPlayer, SQLMatchLineup, SQLMatchTeamStats, TournamentData } from '../lib/supabase';
import { MatchFormationView } from './MatchFormationView';

interface Props {
  matchId: string | null;
  sqlMatches: SQLMatch[];
  sqlEvents: SQLMatchEvent[];
  sqlTeams: SQLTeam[];
  sqlPlayers: SQLPlayer[];
  data: TournamentData;
}

// Normalize half field — primary sort by half, secondary by minute
function normalizeHalf(half: string | null | undefined, minute: number): number {
  if (!half) return minute > 25 ? 2 : 1;
  const h = String(half).toLowerCase().replace(/[^0-9]/g, '');
  return h === '2' ? 2 : 1;
}

function halfLabel(half: string | null | undefined, minute: number): string {
  return normalizeHalf(half, minute) === 1 ? '1T' : '2T';
}

export function StudioMatchDetail({ matchId, sqlMatches, sqlEvents, sqlTeams, sqlPlayers, data }: Props) {
  const match = matchId ? sqlMatches.find(m => m.id === matchId) : null;
  const [lineups, setLineups] = useState<SQLMatchLineup[]>([]);
  const [teamStats, setTeamStats] = useState<SQLMatchTeamStats[]>([]);

  useEffect(() => {
    if (!matchId) { setLineups([]); setTeamStats([]); return; }
    fetchMatchLineups(matchId).then(setLineups).catch(() => setLineups([]));
    fetchMatchTeamStats(matchId).then(setTeamStats).catch(() => setTeamStats([]));
  }, [matchId]);

  if (!match) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }}>
          Selecione uma partida
        </span>
      </div>
    );
  }

  const homeTeam = match.home_team || sqlTeams.find(t => t.id === match.home_team_id);
  const awayTeam = match.away_team || sqlTeams.find(t => t.id === match.away_team_id);
  const hc = homeTeam ? getTeamColor(homeTeam.name, homeTeam.color) : '#3B82F6';
  const ac = awayTeam ? getTeamColor(awayTeam.name, awayTeam.color) : '#ef4444';

  // Sort events: primary by half, secondary by minute
  const events = sqlEvents
    .filter(e => e.match_id === match.id)
    .sort((a, b) => {
      const halfA = normalizeHalf(a.half, a.minute);
      const halfB = normalizeHalf(b.half, b.minute);
      if (halfA !== halfB) return halfA - halfB;
      return a.minute - b.minute;
    });

  const played = match.score_home !== null;

  const homeStats = teamStats.find(s => s.team_id === match.home_team_id);
  const awayStats = teamStats.find(s => s.team_id === match.away_team_id);
  const hasStats = !!(homeStats || awayStats);
  const hasLineups = lineups.length > 0;

  // Layout: formations+stats side-by-side, stats-only, or timeline-only
  const layoutMode = hasLineups && hasStats ? 'full' : hasLineups ? 'formations' : hasStats ? 'stats-timeline' : 'timeline';

  const eventIcon = (type: string) => {
    switch (type) {
      case 'goal': case 'penalty_scored': return '\u26bd';
      case 'own_goal': return '\u26bd\u274c';
      case 'yellow_card': return '\ud83d\udfe8';
      case 'red_card': return '\ud83d\udfe5';
      case 'substitution': return '\ud83d\udd04';
      default: return '\u2022';
    }
  };

  // ============ STAT COMPARISON BARS ============
  const statRows = useMemo(() => {
    if (!homeStats && !awayStats) return [];
    const h = homeStats || {} as any;
    const a = awayStats || {} as any;
    const rows: { label: string; home: number; away: number; suffix?: string; pct?: boolean }[] = [];
    if (h.possession_pct != null || a.possession_pct != null)
      rows.push({ label: 'Posse de Bola', home: h.possession_pct ?? 0, away: a.possession_pct ?? 0, suffix: '%', pct: true });
    if (h.shots_total != null || a.shots_total != null)
      rows.push({ label: 'Finalizações', home: h.shots_total ?? 0, away: a.shots_total ?? 0 });
    if (h.shots_on_target != null || a.shots_on_target != null)
      rows.push({ label: 'No Gol', home: h.shots_on_target ?? 0, away: a.shots_on_target ?? 0 });
    if (h.passes_completed != null || a.passes_completed != null)
      rows.push({ label: 'Passes Certos', home: h.passes_completed ?? 0, away: a.passes_completed ?? 0 });
    if (h.fouls_committed != null || a.fouls_committed != null)
      rows.push({ label: 'Faltas', home: h.fouls_committed ?? 0, away: a.fouls_committed ?? 0 });
    if (h.corners != null || a.corners != null)
      rows.push({ label: 'Escanteios', home: h.corners ?? 0, away: a.corners ?? 0 });
    if (h.offsides != null || a.offsides != null)
      rows.push({ label: 'Impedimentos', home: h.offsides ?? 0, away: a.offsides ?? 0 });
    if (h.saves != null || a.saves != null)
      rows.push({ label: 'Defesas', home: h.saves ?? 0, away: a.saves ?? 0 });
    if (h.yellow_cards != null || a.yellow_cards != null)
      rows.push({ label: 'C. Amarelos', home: h.yellow_cards ?? 0, away: a.yellow_cards ?? 0 });
    if (h.red_cards != null || a.red_cards != null)
      rows.push({ label: 'C. Vermelhos', home: h.red_cards ?? 0, away: a.red_cards ?? 0 });
    return rows;
  }, [homeStats, awayStats]);

  const maxTimelineEvents = layoutMode === 'full' ? 6 : layoutMode === 'stats-timeline' ? 14 : 16;

  return (
    <div className="h-full w-full overflow-hidden flex flex-col">
      {/* ── LAYOUT: Campos full-height nas laterais + Centro com times/placar/stats/eventos/reservas ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Campo Esquerdo (Home) — FULL-Y sem banco ── */}
        {hasLineups && lineups.some(l => l.team_id === match.home_team_id && l.is_starter) && homeTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="h-full flex-shrink-0"
            style={{ width: '36%' }}
          >
            <MatchFormationView
              matchId={match.id}
              teamId={match.home_team_id}
              team={homeTeam}
              players={sqlPlayers.filter(p => p.team_id === match.home_team_id)}
              lineups={lineups}
              events={sqlEvents}
              side="home"
              variant="broadcast"
              showBench={false}
              formationId={match.extra_data?.formations?.[match.home_team_id]?.formationId}
              slotAssignments={match.extra_data?.formations?.[match.home_team_id]?.slots}
            />
          </motion.div>
        )}

        {/* ── CENTRO: Times, Placar, Stats, Eventos, Reservas ── */}
        <div className="flex-1 flex flex-col px-6 py-4 overflow-hidden">
          {/* Header: Teams + Score */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center gap-0 flex-shrink-0"
            style={{ height: 160 }}
          >
            {/* Home */}
            <div className="flex flex-col items-center flex-1">
              {homeTeam?.logo_url && (
                <img src={homeTeam.logo_url} alt="" style={{ width: 90, height: 90, objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.08))' }} />
              )}
              <span style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 6, fontFamily: 'Plus Jakarta Sans' }}>{homeTeam?.short_name || '?'}</span>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center flex-shrink-0" style={{ width: 240 }}>
              {played ? (
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: 64, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#0f172a' }}>{match.score_home}</span>
                  <span style={{ fontSize: 32, fontWeight: 700, color: '#e2e8f0' }}>×</span>
                  <span style={{ fontSize: 64, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#0f172a' }}>{match.score_away}</span>
                </div>
              ) : (
                <span style={{ fontSize: 48, fontWeight: 900, color: '#e2e8f0' }}>VS</span>
              )}
              <span style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8', marginTop: 4 }}>
                {match.round_name || `Rodada ${match.round_number}`}
              </span>
              {match.location && (
                <span style={{ fontSize: 14, fontWeight: 500, color: '#b0b8c4', marginTop: 2 }}>{match.location}</span>
              )}
            </div>

            {/* Away */}
            <div className="flex flex-col items-center flex-1">
              {awayTeam?.logo_url && (
                <img src={awayTeam.logo_url} alt="" style={{ width: 90, height: 90, objectFit: 'contain', filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.08))' }} />
              )}
              <span style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', marginTop: 6, fontFamily: 'Plus Jakarta Sans' }}>{awayTeam?.short_name || '?'}</span>
            </div>
          </motion.div>

          {/* Lista: Stats, Eventos, Reservas */}
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 gap-3">
            {/* Estatísticas */}
            {hasStats && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex-shrink-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ width: 4, height: 18, background: '#6366f1', borderRadius: 3 }} />
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>ESTATÍSTICAS</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {statRows.slice(0, 8).map((row, idx) => {
                    const total = row.home + row.away;
                    const homePct = row.pct ? row.home : (total > 0 ? (row.home / total) * 100 : 50);
                    const awayPct = row.pct ? row.away : (total > 0 ? (row.away / total) * 100 : 50);
                    const homeWins = row.home > row.away;
                    const awayWins = row.away > row.home;
                    return (
                      <motion.div
                        key={row.label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.25, delay: 0.25 + idx * 0.04 }}
                        className="flex items-center"
                        style={{ height: 38 }}
                      >
                        <div style={{ width: 48, textAlign: 'right', flexShrink: 0 }}>
                          <span style={{
                            fontSize: 20, fontWeight: 900, fontFamily: 'JetBrains Mono',
                            color: homeWins ? hc : '#94a3b8',
                          }}>{row.home}{row.suffix || ''}</span>
                        </div>
                        <div className="flex-1 flex flex-col mx-2" style={{ gap: 2 }}>
                          <div className="text-center">
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.02em' }}>
                              {row.label}
                            </span>
                          </div>
                          <div className="flex" style={{ height: 6, gap: 2 }}>
                            <div className="flex-1 flex justify-end" style={{ background: '#e2e8f0', borderRadius: 3 }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(4, homePct)}%` }}
                                transition={{ duration: 0.6, delay: 0.3 + idx * 0.04 }}
                                style={{ height: '100%', background: homeWins ? hc : `${hc}55`, borderRadius: 3 }}
                              />
                            </div>
                            <div className="flex-1" style={{ background: '#e2e8f0', borderRadius: 3 }}>
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.max(4, awayPct)}%` }}
                                transition={{ duration: 0.6, delay: 0.3 + idx * 0.04 }}
                                style={{ height: '100%', background: awayWins ? ac : `${ac}55`, borderRadius: 3 }}
                              />
                            </div>
                          </div>
                        </div>
                        <div style={{ width: 48, textAlign: 'left', flexShrink: 0 }}>
                          <span style={{
                            fontSize: 20, fontWeight: 900, fontFamily: 'JetBrains Mono',
                            color: awayWins ? ac : '#94a3b8',
                          }}>{row.away}{row.suffix || ''}</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Eventos */}
            {events.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="flex-shrink-0"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div style={{ width: 4, height: 18, background: '#22c55e', borderRadius: 3 }} />
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>EVENTOS</span>
                </div>
                <div className="flex flex-col gap-1">
                  {events.slice(0, 10).map((ev, idx) => {
                    const isHome = ev.team_id === match.home_team_id;
                    const player = ev.player || sqlPlayers.find(p => p.id === ev.player_id);
                    const icon = eventIcon(ev.event_type);
                    const hl = halfLabel(ev.half, ev.minute);
                    return (
                      <motion.div
                        key={ev.id}
                        initial={{ opacity: 0, x: isHome ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25, delay: 0.35 + idx * 0.03 }}
                        className="flex items-center"
                        style={{ height: 36 }}
                      >
                        <div className="flex-1 flex items-center justify-end gap-2 pr-3">
                          {isHome && (
                            <>
                              <span style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>{player?.name || '?'}</span>
                              <span style={{ fontSize: 16 }}>{icon}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 60, height: 28, background: '#f1f5f9', borderRadius: 6 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', marginRight: 3 }}>{hl}</span>
                          <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#22c55e' }}>{ev.minute}'</span>
                        </div>
                        <div className="flex-1 flex items-center gap-2 pl-3">
                          {!isHome && (
                            <>
                              <span style={{ fontSize: 16 }}>{icon}</span>
                              <span style={{ fontSize: 16, fontWeight: 700, color: '#334155' }}>{player?.name || '?'}</span>
                            </>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Reservas */}
            {hasLineups && (() => {
              const homeBench = lineups.filter(l => l.team_id === match.home_team_id && !l.is_starter);
              const awayBench = lineups.filter(l => l.team_id === match.away_team_id && !l.is_starter);
              return (homeBench.length > 0 || awayBench.length > 0) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="flex-shrink-0"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div style={{ width: 4, height: 18, background: '#f59e0b', borderRadius: 3 }} />
                    <span style={{ fontSize: 18, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>RESERVAS</span>
                  </div>
                  <div className="flex gap-6">
                    {/* Home bench */}
                    {homeBench.length > 0 && (
                      <div className="flex-1">
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'block' }}>
                          {homeTeam?.short_name}
                        </span>
                        <div className="flex flex-col gap-1">
                          {homeBench.map(l => {
                            const player = l.player || sqlPlayers.find(p => p.id === l.player_id);
                            return (
                              <div key={l.id} className="flex items-center gap-2">
                                <span style={{ fontSize: 16, fontWeight: 900, fontFamily: 'JetBrains Mono', color: hc, minWidth: 28 }}>
                                  {player?.number || '?'}
                                </span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                                  {player?.name || '?'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* Away bench */}
                    {awayBench.length > 0 && (
                      <div className="flex-1">
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'block' }}>
                          {awayTeam?.short_name}
                        </span>
                        <div className="flex flex-col gap-1">
                          {awayBench.map(l => {
                            const player = l.player || sqlPlayers.find(p => p.id === l.player_id);
                            return (
                              <div key={l.id} className="flex items-center gap-2">
                                <span style={{ fontSize: 16, fontWeight: 900, fontFamily: 'JetBrains Mono', color: ac, minWidth: 28 }}>
                                  {player?.number || '?'}
                                </span>
                                <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>
                                  {player?.name || '?'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })()}
          </div>
        </div>

        {/* ── Campo Direito (Away) — FULL-Y sem banco ── */}
        {hasLineups && lineups.some(l => l.team_id === match.away_team_id && l.is_starter) && awayTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="h-full flex-shrink-0"
            style={{ width: '36%' }}
          >
            <MatchFormationView
              matchId={match.id}
              teamId={match.away_team_id}
              team={awayTeam}
              players={sqlPlayers.filter(p => p.team_id === match.away_team_id)}
              lineups={lineups}
              events={sqlEvents}
              side="away"
              variant="broadcast"
              showBench={false}
              formationId={match.extra_data?.formations?.[match.away_team_id]?.formationId}
              slotAssignments={match.extra_data?.formations?.[match.away_team_id]?.slots}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}