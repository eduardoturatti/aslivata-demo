import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchMatchLineups } from '../lib/supabase';
import { photoUrl, logoUrl } from '../lib/image-utils';
import { getFormation } from '../lib/formations';
import type { SQLMatch, SQLMatchEvent, SQLTeam, SQLPlayer, SQLMatchLineup, TournamentData } from '../lib/supabase';

// ============================
// MATCH REPLAY — Cinematic animated timeline
// Runs smooth & fast through empty minutes, pauses at events
// ============================

interface Props {
  matchId: string | null;
  sqlMatches: SQLMatch[];
  sqlEvents: SQLMatchEvent[];
  sqlTeams: SQLTeam[];
  sqlPlayers: SQLPlayer[];
  data: TournamentData;
}

const MATCH_DURATION = 50; // 2×25 min society

function normalizeHalf(half: string | null | undefined, minute: number): number {
  if (!half) return minute > 25 ? 2 : 1;
  const h = String(half).toLowerCase().replace(/[^0-9]/g, '');
  return h === '2' ? 2 : 1;
}

const PHASE_INTRO = 4;
const PHASE_FORMATIONS = 5;
const PHASE_FINAL = 5;

// Speed config
const FAST_SPEED = 8;     // minutes per second when no events nearby
const EVENT_PAUSE = 3.5;  // seconds to hold at each event

interface TimelineEvent {
  id: string;
  minute: number;
  half: string;
  type: string;
  playerId: string;
  playerName: string;
  playerPhoto: string | null;
  playerNumber: string;
  teamId: string;
  isHome: boolean;
  detail?: any;
  secondPlayerName?: string;
  secondPlayerPhoto?: string | null;
  vMin: number;
  sameMinOffset: number; // horizontal offset index for same-minute events
  sameMinCount: number;  // how many events share this minute
}

const EVENT_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  goal:             { icon: '⚽', label: 'GOL',           color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  penalty_scored:   { icon: '⚽', label: 'GOL (PEN)',     color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  own_goal:         { icon: '⚽', label: 'GOL CONTRA',    color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  yellow_card:      { icon: '🟨', label: 'AMARELO',       color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  red_card:         { icon: '🟥', label: 'VERMELHO',      color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  second_yellow:    { icon: '🟨🟥', label: '2º AMARELO', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  substitution:     { icon: '🔄', label: 'SUBSTITUIÇÃO',  color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  penalty_missed:   { icon: '❌', label: 'PÊNALTI PERDIDO', color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' },
  assist:           { icon: '👟', label: 'ASSISTÊNCIA',    color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
};

function getEventConfig(type: string) {
  return EVENT_CONFIG[type] || { icon: '•', label: type.toUpperCase(), color: '#94a3b8', bg: 'rgba(148,163,184,0.15)' };
}

function isGoalEvent(type: string) {
  return type === 'goal' || type === 'penalty_scored' || type === 'own_goal';
}

function getVirtualMinute(half: any, minute: number): number {
  const h = normalizeHalf(half, minute);
  if (h === 2) return 25 + minute;
  return minute;
}

function formatClock(minute: number): string {
  const m = Math.max(0, Math.min(minute, MATCH_DURATION));
  const mm = String(Math.floor(m)).padStart(2, '0');
  const frac = m % 1;
  const ss = String(Math.floor(frac * 60)).padStart(2, '0');
  return `${mm}:${ss}`;
}

export function StudioMatchReplay({ matchId, sqlMatches, sqlEvents, sqlTeams, sqlPlayers, data }: Props) {
  const match = matchId ? sqlMatches.find(m => m.id === matchId) : null;
  const [lineups, setLineups] = useState<SQLMatchLineup[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMatchMinute, setCurrentMatchMinute] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number>(0);
  const loopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load lineups
  useEffect(() => {
    if (!matchId) { setLineups([]); return; }
    fetchMatchLineups(matchId).then(setLineups).catch(() => setLineups([]));
  }, [matchId]);

  // Build timeline events
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!match) return [];
    return sqlEvents
      .filter(e => e.match_id === match.id)
      .map(e => ({
        ...e,
        vMin: getVirtualMinute(e.half, e.minute)
      }))
      .sort((a, b) => a.vMin - b.vMin)
      .map(e => {
        let player = e.player || sqlPlayers.find(p => p.id === e.player_id);
        const isHome = e.team_id === match.home_team_id;
        let secondPlayerName: string | undefined;
        let secondPlayerPhoto: string | null | undefined;
        if (e.event_type === 'substitution') {
          // Convention: player_id = who ENTERS, detail.player_out_id = who LEAVES
          // Also handle alternative: detail.player_in_id exists → player_id is the one going OUT
          if (e.detail?.player_out_id) {
            const playerOut = sqlPlayers.find(p => p.id === e.detail.player_out_id);
            secondPlayerName = playerOut?.name;
            secondPlayerPhoto = playerOut?.photo_url || null;
          } else if (e.detail?.player_in_id) {
            // player_id = player OUT, detail.player_in_id = player IN → swap display
            const playerIn = sqlPlayers.find(p => p.id === e.detail.player_in_id);
            secondPlayerName = player?.name; // the "main" is actually going out
            secondPlayerPhoto = player?.photo_url || null;
            // Override main player to be the one coming IN
            player = playerIn || player;
          }
        }
        return {
          id: e.id,
          minute: e.minute,
          half: e.half || (e.minute <= 25 ? '1' : '2'),
          type: e.event_type,
          playerId: e.player_id,
          playerName: player?.name || '?',
          playerPhoto: player?.photo_url || null,
          playerNumber: player?.number || '',
          teamId: e.team_id,
          isHome,
          detail: e.detail,
          secondPlayerName,
          secondPlayerPhoto,
          vMin: e.vMin,
          sameMinOffset: 0,
          sameMinCount: 1
        };
      })
      .map((e, i, arr) => {
        // Calculate same-minute offsets
        const sameMinEvents = arr.filter(ev => ev.vMin === e.vMin);
        e.sameMinCount = sameMinEvents.length;
        e.sameMinOffset = sameMinEvents.indexOf(e);
        return e;
      });
  }, [match, sqlEvents, sqlPlayers]);

  // Build a smart timeline: calculates total animation duration
  // Fast through empty stretches, pauses at events
  const timelineMap = useMemo(() => {
    if (timelineEvents.length === 0) {
      // No events: just run through at fast speed
      const totalAnimTime = MATCH_DURATION / FAST_SPEED;
      return { totalAnimTime, getMinuteAtTime: (t: number) => Math.min(t * FAST_SPEED, MATCH_DURATION) };
    }

    // Build segments: [0..ev1, pause, ev1..ev2, pause, ..., evN..END]
    type Segment = { startMin: number; endMin: number; type: 'run' | 'pause'; duration: number; eventIdx?: number };
    const segments: Segment[] = [];
    let prevMin = 0;

    for (let i = 0; i < timelineEvents.length; i++) {
      const evMin = timelineEvents[i].vMin;
      // Run segment from prev to this event
      const gap = Math.max(0, evMin - prevMin);
      if (gap > 0) {
        segments.push({ startMin: prevMin, endMin: evMin, type: 'run', duration: gap / FAST_SPEED });
      }
      // Pause at event
      segments.push({ startMin: evMin, endMin: evMin, type: 'pause', duration: EVENT_PAUSE, eventIdx: i });
      prevMin = evMin;
    }
    // Final run to end
    const lastEvMin = timelineEvents[timelineEvents.length - 1].vMin;
    const remaining = Math.max(0, MATCH_DURATION - lastEvMin);
    if (remaining > 0) {
      segments.push({ startMin: lastEvMin, endMin: MATCH_DURATION, type: 'run', duration: remaining / FAST_SPEED });
    }

    const totalAnimTime = segments.reduce((sum, s) => sum + s.duration, 0);

    const getMinuteAtTime = (t: number): number => {
      let accum = 0;
      for (const seg of segments) {
        if (t <= accum + seg.duration) {
          const localT = t - accum;
          if (seg.type === 'pause') return seg.startMin;
          // Linear interpolation within run segment
          const pct = localT / seg.duration;
          return seg.startMin + (seg.endMin - seg.startMin) * pct;
        }
        accum += seg.duration;
      }
      return MATCH_DURATION;
    };

    return { totalAnimTime, getMinuteAtTime };
  }, [timelineEvents]);

  const TOTAL_DURATION = PHASE_INTRO + PHASE_FORMATIONS + timelineMap.totalAnimTime + PHASE_FINAL;

  // Teams
  const homeTeam = match ? (match.home_team || sqlTeams.find(t => t.id === match.home_team_id)) : null;
  const awayTeam = match ? (match.away_team || sqlTeams.find(t => t.id === match.away_team_id)) : null;

  // Auto-start animation when match changes
  useEffect(() => {
    if (!match || match.score_home === null) return;
    setElapsed(0);
    setCurrentMatchMinute(0);
    setIsPlaying(true);
    startTimeRef.current = null;
  }, [matchId]);

  // Animation loop
  useEffect(() => {
    if (!isPlaying) return;

    const tick = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now;
      const s = (now - startTimeRef.current) / 1000;
      const clamped = Math.min(s, TOTAL_DURATION);
      setElapsed(clamped);

      // Calculate match minute
      if (clamped < PHASE_INTRO + PHASE_FORMATIONS) {
        setCurrentMatchMinute(0);
      } else if (clamped >= PHASE_INTRO + PHASE_FORMATIONS + timelineMap.totalAnimTime) {
        setCurrentMatchMinute(MATCH_DURATION);
      } else {
        const timelineElapsed = clamped - PHASE_INTRO - PHASE_FORMATIONS;
        setCurrentMatchMinute(timelineMap.getMinuteAtTime(timelineElapsed));
      }

      if (s < TOTAL_DURATION) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setIsPlaying(false);
        loopTimeoutRef.current = setTimeout(() => {
          setElapsed(0);
          setCurrentMatchMinute(0);
          setIsPlaying(true);
          startTimeRef.current = null;
        }, 3000);
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animFrameRef.current);
      if (loopTimeoutRef.current) clearTimeout(loopTimeoutRef.current);
    };
  }, [isPlaying, TOTAL_DURATION, timelineMap]);

  // Visible events
  const visibleEvents = useMemo(() => {
    return timelineEvents.filter(e => e.vMin <= currentMatchMinute);
  }, [timelineEvents, currentMatchMinute]);

  // Active event (most recently appeared, shown for ~EVENT_PAUSE seconds)
  const activeEvent = useMemo(() => {
    if (visibleEvents.length === 0) return null;
    const latest = visibleEvents[visibleEvents.length - 1];
    // Check if we're within the pause window for this event
    if (Math.abs(currentMatchMinute - latest.vMin) < 0.5) return latest;
    return null;
  }, [visibleEvents, currentMatchMinute]);

  // Running score
  const runningScore = useMemo(() => {
    let home = 0, away = 0;
    for (const e of visibleEvents) {
      if (e.type === 'goal' || e.type === 'penalty_scored') {
        if (e.isHome) home++; else away++;
      } else if (e.type === 'own_goal') {
        if (e.isHome) away++; else home++;
      }
    }
    return { home, away };
  }, [visibleEvents]);

  // Phase detection
  const phase = useMemo(() => {
    if (elapsed < PHASE_INTRO) return 'intro';
    if (elapsed < PHASE_INTRO + PHASE_FORMATIONS) return 'formations';
    if (elapsed < PHASE_INTRO + PHASE_FORMATIONS + timelineMap.totalAnimTime) return 'timeline';
    return 'final';
  }, [elapsed, timelineMap.totalAnimTime]);

  const currentHalf = currentMatchMinute <= 25 ? 1 : 2;
  const progressPct = Math.min(100, (currentMatchMinute / MATCH_DURATION) * 100);

  const homeFormationId = match?.extra_data?.formations?.[match?.home_team_id]?.formationId;
  const awayFormationId = match?.extra_data?.formations?.[match?.away_team_id]?.formationId;

  const homeStarters = lineups.filter(l => l.team_id === match?.home_team_id && l.is_starter);
  const awayStarters = lineups.filter(l => l.team_id === match?.away_team_id && l.is_starter);

  if (!match) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }}>
          Selecione uma partida para o Replay
        </span>
      </div>
    );
  }

  if (match.score_home === null) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }}>
          Partida ainda não possui resultado
        </span>
      </div>
    );
  }

  const hc = homeTeam?.color || '#3B82F6';
  const ac = awayTeam?.color || '#ef4444';

  return (
    <div className="h-full w-full overflow-hidden relative" style={{
      background: 'radial-gradient(ellipse at 50% 0%, #1a1f35 0%, #0a0e1a 70%)',
    }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-1/2 h-full" style={{
          background: `radial-gradient(ellipse at 20% 30%, ${hc}15 0%, transparent 60%)`,
        }} />
        <div className="absolute top-0 right-0 w-1/2 h-full" style={{
          background: `radial-gradient(ellipse at 80% 30%, ${ac}15 0%, transparent 60%)`,
        }} />
      </div>

      {/* Scanline */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.01) 2px, rgba(255,255,255,0.01) 4px)',
      }} />

      {/* ═══ INTRO PHASE ═══ */}
      <AnimatePresence>
        {phase === 'intro' && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
              className="flex items-center gap-3 mb-8"
            >
              <div style={{
                padding: '8px 32px',
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                borderRadius: 8,
                boxShadow: '0 0 40px rgba(34,197,94,0.3)',
              }}>
                <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '0.15em', fontFamily: 'Plus Jakarta Sans' }}>
                  ▶ REPLAY
                </span>
              </div>
            </motion.div>

            <div className="flex items-center gap-16">
              <motion.div
                initial={{ x: -200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                {homeTeam?.logo_url && (
                  <img src={logoUrl(homeTeam.logo_url, 140)} alt="" style={{ width: 140, height: 140, objectFit: 'contain', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.15))' }} />
                )}
                <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginTop: 12, fontFamily: 'Plus Jakarta Sans' }}>
                  {homeTeam?.short_name}
                </span>
              </motion.div>

              <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut", delay: 0.8 }}
                style={{ fontSize: 52, fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}
              >
                VS
              </motion.span>

              <motion.div
                initial={{ x: 200, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                className="flex flex-col items-center"
              >
                {awayTeam?.logo_url && (
                  <img src={logoUrl(awayTeam.logo_url, 140)} alt="" style={{ width: 140, height: 140, objectFit: 'contain', filter: 'drop-shadow(0 0 30px rgba(255,255,255,0.15))' }} />
                )}
                <span style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginTop: 12, fontFamily: 'Plus Jakarta Sans' }}>
                  {awayTeam?.short_name}
                </span>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, duration: 0.4 }}
              className="mt-6 text-center"
            >
              <span style={{ fontSize: 20, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                {match.round_name || `Rodada ${match.round_number}`}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ FORMATIONS PHASE ═══ */}
      <AnimatePresence>
        {phase === 'formations' && homeStarters.length > 0 && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex gap-8" style={{ width: '90%', height: '85%' }}>
              <MiniFormation team={homeTeam!} starters={homeStarters} players={sqlPlayers.filter(p => p.team_id === match.home_team_id)} formationId={homeFormationId} side="home" delay={0} />
              <MiniFormation team={awayTeam!} starters={awayStarters} players={sqlPlayers.filter(p => p.team_id === match.away_team_id)} formationId={awayFormationId} side="away" delay={0.2} />
            </div>
          </motion.div>
        )}
        {phase === 'formations' && homeStarters.length === 0 && (
          <motion.div
            className="absolute inset-0 z-20 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex items-center gap-16">
              <TeamIntroCard team={homeTeam!} color={hc} />
              <div style={{ width: 2, height: 200, background: 'rgba(255,255,255,0.1)' }} />
              <TeamIntroCard team={awayTeam!} color={ac} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ TIMELINE + FINAL PHASES ═══ */}
      {(phase === 'timeline' || phase === 'final') && (
        <div className="absolute inset-0 z-10 flex flex-col">

          {/* Score header */}
          <motion.div
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="flex items-center justify-center flex-shrink-0 relative"
            style={{ height: 180 }}
          >
            <div className="flex items-center gap-5 flex-1 justify-end pr-6">
              <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: 'Plus Jakarta Sans' }}>
                {homeTeam?.short_name}
              </span>
              {homeTeam?.logo_url && (
                <img src={logoUrl(homeTeam.logo_url, 80)} alt="" style={{ width: 80, height: 80, objectFit: 'contain' }} />
              )}
            </div>

            <div className="flex items-center gap-3 flex-shrink-0" style={{ minWidth: 240, justifyContent: 'center' }}>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`h-${runningScore.home}`}
                  initial={{ scale: 1.5, color: '#22c55e' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ fontSize: 84, fontWeight: 900, fontFamily: 'JetBrains Mono', lineHeight: 1 }}
                >
                  {runningScore.home}
                </motion.span>
              </AnimatePresence>
              <span style={{ fontSize: 36, fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>×</span>
              <AnimatePresence mode="wait">
                <motion.span
                  key={`a-${runningScore.away}`}
                  initial={{ scale: 1.5, color: '#22c55e' }}
                  animate={{ scale: 1, color: '#ffffff' }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{ fontSize: 84, fontWeight: 900, fontFamily: 'JetBrains Mono', lineHeight: 1 }}
                >
                  {runningScore.away}
                </motion.span>
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-5 flex-1 pl-6">
              {awayTeam?.logo_url && (
                <img src={logoUrl(awayTeam.logo_url, 80)} alt="" style={{ width: 80, height: 80, objectFit: 'contain' }} />
              )}
              <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', fontFamily: 'Plus Jakarta Sans' }}>
                {awayTeam?.short_name}
              </span>
            </div>
          </motion.div>

          {/* Clock + Progress bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex-shrink-0 px-12"
          >
            <div className="flex items-center gap-4 mb-1">
              <div className="flex items-center gap-2">
                <div style={{
                  padding: '3px 10px',
                  background: currentHalf === 1 ? 'rgba(34,197,94,0.2)' : 'rgba(59,130,246,0.2)',
                  borderRadius: 6,
                  border: `1px solid ${currentHalf === 1 ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
                }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: currentHalf === 1 ? '#22c55e' : '#3b82f6', fontFamily: 'JetBrains Mono' }}>
                    {phase === 'final' ? 'FIM' : `${currentHalf}º TEMPO`}
                  </span>
                </div>
              </div>

              {/* MM:SS Clock */}
              <div className="flex items-center gap-1.5">
                <span style={{
                  fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono',
                  color: phase === 'final' ? '#22c55e' : '#fff',
                  textShadow: '0 0 20px rgba(34,197,94,0.3)',
                }}>
                  {phase === 'final' ? formatClock(MATCH_DURATION) : formatClock(currentMatchMinute)}
                </span>
              </div>

              <div className="flex-1" />

              <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                {visibleEvents.length} / {timelineEvents.length} eventos
              </span>
            </div>

            {/* Progress bar */}
            <div style={{
              height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2,
                background: 'rgba(255,255,255,0.15)', zIndex: 2,
              }} />
              {timelineEvents.map(e => (
                <div key={e.id} style={{
                  position: 'absolute',
                  left: `${(e.vMin / MATCH_DURATION) * 100}%`,
                  top: '50%', transform: 'translate(-50%, -50%)',
                  width: isGoalEvent(e.type) ? 10 : 6,
                  height: isGoalEvent(e.type) ? 10 : 6,
                  borderRadius: '50%',
                  background: e.vMin <= currentMatchMinute
                    ? getEventConfig(e.type).color
                    : 'rgba(255,255,255,0.15)',
                  zIndex: 3,
                  transition: 'background 0.3s',
                }} />
              ))}
              <div
                style={{
                  height: '100%', borderRadius: 3,
                  width: `${progressPct}%`,
                  transition: 'width 0.15s linear',
                }}
                className="relative"
              >
                <div className="absolute inset-0" style={{
                  background: 'linear-gradient(90deg, #22c55e, #4ade80)',
                  borderRadius: 3,
                }} />
                <div className="absolute right-0 top-1/2 -translate-y-1/2" style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: '#22c55e',
                  boxShadow: '0 0 15px #22c55e, 0 0 30px rgba(34,197,94,0.5)',
                }} />
              </div>
            </div>
          </motion.div>

          {/* Events timeline */}
          <div className="flex-1 relative mt-6 overflow-hidden">
            {/* Center line */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1" style={{
              background: 'rgba(255,255,255,0.06)',
            }} />

            {/* Scrolling container — uses explicit width + centering offset */}
            <div
              className="h-full relative"
              style={{
                width: (MATCH_DURATION + 1) * 120 + 1920,
                transform: `translateX(${960 - currentMatchMinute * 120}px)`,
                transition: 'transform 0.15s linear',
              }}
            >
              {/* Minute markers */}
              {Array.from({ length: MATCH_DURATION + 1 }).map((_, i) => (
                <div key={`min-${i}`} className="absolute" style={{ left: i * 120, top: '50%', transform: 'translateY(-50%)', opacity: 0.2 }}>
                  <div style={{ width: 2, height: 10, background: 'white' }} />
                </div>
              ))}

              {/* Event cards */}
              {timelineEvents.map((ev) => {
                const cfg = getEventConfig(ev.type);
                const isActive = activeEvent?.id === ev.id;
                const isGoal = isGoalEvent(ev.type);
                const isVisible = ev.vMin <= currentMatchMinute;

                // Spread same-minute events horizontally (center them around the minute)
                const SPREAD_PX = 280; // horizontal spread per extra event
                const groupOffset = ev.sameMinCount > 1
                  ? (ev.sameMinOffset - (ev.sameMinCount - 1) / 2) * SPREAD_PX
                  : 0;
                const leftPos = ev.vMin * 120 + groupOffset;

                return (
                  <div
                    key={ev.id}
                    className="absolute flex flex-col items-center"
                    style={{
                      left: leftPos,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      opacity: isVisible ? 1 : 0,
                      transition: 'opacity 0.3s ease-out',
                      zIndex: isActive ? 15 : 10,
                    }}
                  >
                    {/* Event card positioned above or below center line */}
                    <div style={{
                      transform: `translateY(${ev.isHome ? -90 : 90}px) scale(${isActive ? 1.08 : 1})`,
                      transition: 'transform 0.3s ease-out',
                    }}>
                      <EventCard ev={ev} cfg={cfg} isActive={isActive} isGoal={isGoal} side={ev.isHome ? 'home' : 'away'} teamColor={ev.isHome ? hc : ac} />
                    </div>

                    {/* Connector line */}
                    <div style={{
                      width: 2,
                      height: 30,
                      background: `linear-gradient(${ev.isHome ? 'to bottom' : 'to top'}, ${cfg.color}, transparent)`,
                      opacity: 0.4,
                      position: 'absolute',
                      top: '50%',
                      transform: `translateY(${ev.isHome ? -60 : 0}px)`,
                    }} />

                    {/* Minute badge at center line */}
                    <div style={{
                      width: 44, height: 28,
                      background: isActive ? cfg.bg : 'rgba(255,255,255,0.05)',
                      border: `2px solid ${isActive ? cfg.color : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      position: 'absolute',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      zIndex: 20,
                      transition: 'all 0.3s',
                    }}>
                      <span style={{ fontSize: 16, fontWeight: 900, color: isActive ? cfg.color : '#fff', fontFamily: 'JetBrains Mono' }}>
                        {ev.minute}'
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active event spotlight */}
          <AnimatePresence>
            {activeEvent && isGoalEvent(activeEvent.type) && (
              <motion.div
                key={`spotlight-${activeEvent.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2"
                style={{
                  padding: '16px 40px',
                  background: 'rgba(34,197,94,0.1)',
                  border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 16,
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex items-center gap-5">
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: `linear-gradient(135deg, ${activeEvent.isHome ? hc : ac}40, ${activeEvent.isHome ? hc : ac}15)`,
                    border: `2px solid ${activeEvent.isHome ? hc : ac}60`,
                    overflow: 'hidden',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {activeEvent.playerPhoto ? (
                      <img src={photoUrl(activeEvent.playerPhoto, 64)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 24, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>
                        {activeEvent.playerNumber || '?'}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#22c55e', letterSpacing: '0.1em' }}>
                      ⚽ GOOOOL!
                    </span>
                    <span style={{ fontSize: 28, fontWeight: 900, color: '#fff', fontFamily: 'Plus Jakarta Sans' }}>
                      {activeEvent.playerName}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                      {activeEvent.minute}' • {activeEvent.isHome ? homeTeam?.short_name : awayTeam?.short_name}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Final whistle overlay */}
          <AnimatePresence>
            {phase === 'final' && (
              <motion.div
                className="absolute inset-0 z-30 flex flex-col items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{ background: 'rgba(10,14,26,0.85)', backdropFilter: 'blur(10px)' }}
              >
                <motion.div
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                  style={{
                    padding: '6px 28px', background: 'rgba(255,255,255,0.1)',
                    borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
                    marginBottom: 20,
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.15em' }}>
                    RESULTADO FINAL
                  </span>
                </motion.div>

                <div className="flex items-center gap-10">
                  <motion.div
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center"
                  >
                    {homeTeam?.logo_url && <img src={logoUrl(homeTeam.logo_url, 100)} alt="" style={{ width: 100, height: 100, objectFit: 'contain' }} />}
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 8 }}>{homeTeam?.short_name}</span>
                  </motion.div>

                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
                    className="flex items-center gap-4"
                  >
                    <span style={{ fontSize: 96, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#fff' }}>{match.score_home}</span>
                    <span style={{ fontSize: 48, fontWeight: 700, color: 'rgba(255,255,255,0.2)' }}>×</span>
                    <span style={{ fontSize: 96, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#fff' }}>{match.score_away}</span>
                  </motion.div>

                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
                    className="flex flex-col items-center"
                  >
                    {awayTeam?.logo_url && <img src={logoUrl(awayTeam.logo_url, 100)} alt="" style={{ width: 100, height: 100, objectFit: 'contain' }} />}
                    <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', marginTop: 8 }}>{awayTeam?.short_name}</span>
                  </motion.div>
                </div>

                {timelineEvents.filter(e => isGoalEvent(e.type)).length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1, duration: 0.4 }}
                    className="mt-6 flex gap-16"
                  >
                    <div className="flex flex-col items-end gap-1">
                      {timelineEvents.filter(e => isGoalEvent(e.type) && e.isHome).map(e => (
                        <span key={e.id} style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                          {e.playerName} {e.minute}' {e.type === 'own_goal' ? '(GC)' : e.type === 'penalty_scored' ? '(P)' : ''}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      {timelineEvents.filter(e => isGoalEvent(e.type) && !e.isHome).map(e => (
                        <span key={e.id} style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
                          {e.playerName} {e.minute}' {e.type === 'own_goal' ? '(GC)' : e.type === 'penalty_scored' ? '(P)' : ''}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ============================
// EVENT CARD
// ============================
function EventCard({ ev, cfg, isActive, isGoal, side, teamColor }: {
  ev: TimelineEvent;
  cfg: { icon: string; label: string; color: string; bg: string };
  isActive: boolean;
  isGoal: boolean;
  side: 'home' | 'away';
  teamColor: string;
}) {
  const isHome = side === 'home';

  return (
    <div
      className="flex items-center gap-3"
      style={{
        flexDirection: isHome ? 'row' : 'row-reverse',
        filter: isActive ? 'brightness(1.1)' : 'brightness(0.85)',
        transition: 'filter 0.3s, transform 0.3s',
      }}
    >
      <div style={{
        width: isActive && isGoal ? 52 : 42,
        height: isActive && isGoal ? 52 : 42,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${teamColor}50, ${teamColor}20)`,
        border: `2px solid ${isActive ? cfg.color : teamColor}40`,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.3s',
        boxShadow: isActive ? `0 0 20px ${cfg.color}30` : 'none',
      }}>
        {ev.playerPhoto ? (
          <img src={photoUrl(ev.playerPhoto, 52)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 16, fontWeight: 900, color: 'rgba(255,255,255,0.6)' }}>
            {ev.playerNumber || '?'}
          </span>
        )}
      </div>

      <div className="flex flex-col" style={{ alignItems: isHome ? 'flex-end' : 'flex-start' }}>
        <div className="flex items-center gap-1.5" style={{ flexDirection: isHome ? 'row' : 'row-reverse' }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#fff', fontFamily: 'Plus Jakarta Sans', whiteSpace: 'nowrap' }}>
            {ev.playerName}
          </span>
          <span style={{ fontSize: 24 }}>{cfg.icon}</span>
        </div>
        {ev.type === 'substitution' && ev.secondPlayerName && (
          <span style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>
            ↓ {ev.secondPlayerName}
          </span>
        )}
      </div>
    </div>
  );
}

// ============================
// MINI FORMATION
// ============================
function MiniFormation({ team, starters, players, formationId, side, delay }: {
  team: SQLTeam;
  starters: SQLMatchLineup[];
  players: SQLPlayer[];
  formationId?: string;
  side: 'home' | 'away';
  delay: number;
}) {
  const formation = getFormation(formationId || '1-3-2-1');
  const tc = team.color || '#3B82F6';

  return (
    <motion.div
      className="flex-1 flex flex-col items-center"
      initial={{ opacity: 0, x: side === 'home' ? -60 : 60 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
    >
      <div className="flex items-center gap-4 mb-4">
        {team.logo_url && <img src={logoUrl(team.logo_url, 52)} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />}
        <span style={{ fontSize: 30, fontWeight: 900, color: '#fff', fontFamily: 'Plus Jakarta Sans' }}>{team.short_name}</span>
        {formationId && (
          <span style={{ fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.6)', fontFamily: 'JetBrains Mono' }}>
            {formationId}
          </span>
        )}
      </div>

      <div className="flex-1 w-full relative" style={{
        background: 'linear-gradient(180deg, rgba(34,197,94,0.08) 0%, rgba(34,197,94,0.03) 100%)',
        border: '1px solid rgba(34,197,94,0.15)',
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <div className="absolute inset-0">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2" style={{ height: 1, background: 'rgba(34,197,94,0.12)' }} />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" style={{
            width: 80, height: 80, borderRadius: '50%', border: '1px solid rgba(34,197,94,0.12)',
          }} />
        </div>

        {formation && formation.slots && formation.slots.map((slot, i) => {
          const starterEntry = starters[i];
          const player = starterEntry
            ? (starterEntry.player || players.find(p => p.id === starterEntry.player_id))
            : null;

          const x = side === 'home' ? slot.x : (100 - slot.x);
          const y = side === 'home' ? (100 - slot.y) : slot.y;

          return (
            <motion.div
              key={`slot-${i}`}
              className="absolute flex flex-col items-center"
              style={{
                left: `${x}%`, top: `${y}%`,
                x: '-50%',
                y: '-50%',
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: delay + 0.3 + i * 0.05, duration: 0.3, ease: "easeOut" }}
            >
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: `linear-gradient(135deg, ${tc}, ${tc}aa)`,
                border: '3px solid rgba(255,255,255,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden',
                boxShadow: `0 0 20px ${tc}50`,
              }}>
                {player?.photo_url ? (
                  <img src={photoUrl(player.photo_url, 64)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: 22, fontWeight: 900, color: team.text_color || '#fff' }}>
                    {player?.number || ''}
                  </span>
                )}
              </div>
              <span style={{
                fontSize: 16, fontWeight: 800, color: 'rgba(255,255,255,0.95)',
                marginTop: 4, whiteSpace: 'nowrap',
                textShadow: '0 2px 6px rgba(0,0,0,0.9)',
              }}>
                {player?.name?.split(' ').slice(-1)[0] || ''}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ============================
// TEAM INTRO CARD
// ============================
function TeamIntroCard({ team, color }: { team: SQLTeam; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      {team.logo_url && (
        <img src={logoUrl(team.logo_url, 120)} alt="" style={{
          width: 120, height: 120, objectFit: 'contain',
          filter: 'drop-shadow(0 0 25px rgba(255,255,255,0.1))',
        }} />
      )}
      <span style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginTop: 12, fontFamily: 'Plus Jakarta Sans' }}>
        {team.name}
      </span>
      <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
        {team.short_name}
      </span>
    </motion.div>
  );
}