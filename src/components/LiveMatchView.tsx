// ============================================================
// LIVE MATCH VIEW — Real-time event feed for fans
// Shows live events from scout system during a match
// Embedded in MatchDetailPage when scout_status !== 'idle'
// Follows the EXACT same visual pattern as the official Timeline
// ============================================================
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase-client';
import { Radio, AlertTriangle, Clock, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import svgPaths from '../imports/svg-gs19ap0rlg';
import { logoUrl } from '../lib/image-utils';

interface LiveEvent {
  id: string;
  match_id: string;
  type: string;
  team_id?: string;
  player_id?: string;
  player_out_id?: string;
  player_in_id?: string;
  detail?: string;
  note?: string;
  added_minutes?: number;
  match_minute: number | null;
  half: number | null;
  real_timestamp: string;
  status: string;
  player?: { id: string; name: string; number?: string } | null;
  player_out?: { id: string; name: string; number?: string } | null;
  player_in?: { id: string; name: string; number?: string } | null;
  team?: { id: string; short_name: string; color?: string; logo_url?: string } | null;
}

/** Safely get number from potentially null match_minute */
function safeMinute(val: any): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  if (val != null) { const n = Number(val); if (!isNaN(n)) return n; }
  return 0;
}

/** Sanitize a raw event from Supabase to prevent React #310 */
function sanitizeEvent(evt: any): LiveEvent {
  return {
    ...evt,
    match_minute: safeMinute(evt.match_minute),
    half: typeof evt.half === 'number' ? evt.half : (evt.half != null ? Number(evt.half) || 1 : 1),
    player: (evt.player && typeof evt.player === 'object' && !Array.isArray(evt.player)) ? evt.player : null,
    player_out: (evt.player_out && typeof evt.player_out === 'object' && !Array.isArray(evt.player_out)) ? evt.player_out : null,
    player_in: (evt.player_in && typeof evt.player_in === 'object' && !Array.isArray(evt.player_in)) ? evt.player_in : null,
    team: (evt.team && typeof evt.team === 'object' && !Array.isArray(evt.team)) ? evt.team : null,
  };
}

interface Props {
  matchId: string;
  scoutStatus: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: { short_name: string; logo_url?: string };
  awayTeam?: { short_name: string; logo_url?: string };
  scoutStartedAt?: string;
  scoutHalf1End?: string;
  scoutHalf2Start?: string;
  scoutEndedAt?: string;
  onLiveScore?: (home: number, away: number) => void;
}

// ============================
// SOUND + VIBRATION UTILS
// ============================
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

function playAlertSound(type: 'goal' | 'card' | 'penalty') {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'goal') {
      // Exciting rising tone
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.15);
      osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'card') {
      // Sharp whistle tone
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.3);
    } else {
      // Penalty — double beep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(660, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + 0.15);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) { /* audio not supported */ }
}

function triggerVibration(pattern: number[]) {
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch { /* vibration not supported */ }
}

// ============================
// ICONS — same as MatchDetailPage
// ============================
function BallIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={className}>
      <path d={svgPaths.p3f399800} fill="currentColor" />
    </svg>
  );
}

function SubIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

function SecondYellowIcon({ size = 16 }: { size?: number }) {
  const w = size * 0.42;
  const h = size * 0.65;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <rect x="2" y="3" width={w} height={h} rx="1.2" fill="#facc15" />
      <rect x="9.5" y="5" width={w} height={h} rx="1.2" fill="#ef4444" />
    </svg>
  );
}

const EVENT_LABELS: Record<string, string> = {
  goal: 'Gol', goal_penalty: 'Gol (Pênalti)', penalty_kick: 'Pênalti',
  yellow_card: 'Cartão Amarelo', red_card: 'Cartão Vermelho', substitution: 'Substituição',
  note: 'Ocorrência', added_time: 'Acréscimos',
};

const CONTROL_TYPES = ['match_start', 'half1_end', 'half2_start', 'match_end'];

// ============================
// HELPERS
// ============================
function formatTimer(startIso: string, endIso?: string): string {
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const mm = String(Math.floor(diffSec / 60)).padStart(2, '0');
  const ss = String(diffSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'live_half1':
      return { label: '1º TEMPO · AO VIVO', color: 'bg-red-500', pulse: true };
    case 'halftime':
      return { label: 'INTERVALO', color: 'bg-amber-500', pulse: false };
    case 'live_half2':
      return { label: '2º TEMPO · AO VIVO', color: 'bg-red-500', pulse: true };
    case 'ended':
      return { label: 'ENCERRADO · DADOS PROVISÓRIOS', color: 'bg-white/20', pulse: false };
    case 'pre_game':
      return { label: 'ESCALAÇÕES SENDO CONFIRMADAS', color: 'bg-blue-500', pulse: true };
    case 'published':
      return { label: 'DADOS OFICIAIS', color: 'bg-green-600', pulse: false };
    default:
      return null;
  }
}

// ============================
// MAIN COMPONENT
// ============================
export function LiveMatchView({ matchId, scoutStatus, homeTeamId, awayTeamId, homeTeam, awayTeam, scoutStartedAt, scoutHalf1End, scoutHalf2Start, scoutEndedAt, onLiveScore }: Props) {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [timerTick, setTimerTick] = useState(0);
  const prevEventCountRef = useRef(0);
  const initialLoadDoneRef = useRef(false);

  // Timer
  useEffect(() => {
    if (scoutStatus === 'live_half1' || scoutStatus === 'live_half2') {
      const interval = setInterval(() => setTimerTick(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [scoutStatus]);

  // Fetch initial events
  useEffect(() => {
    async function load() {
      setLoading(true);
      // CRITICAL: Explicit columns only — SELECT * leaks unknown JSONB columns that crash React
      const { data, error } = await supabase
        .from('live_events')
        .select(`
          id, match_id, source_token_id, type, team_id, player_id,
          player_out_id, player_in_id, target_team_id, related_event_id,
          detail, note, added_minutes, match_minute, half,
          real_timestamp, status, created_at,
          player:player_id ( id, name, number ),
          player_out:player_out_id ( id, name, number ),
          player_in:player_in_id ( id, name, number ),
          team:team_id ( id, short_name, color, logo_url )
        `)
        .eq('match_id', matchId)
        .neq('status', 'rejected')
        .order('match_minute', { ascending: false });

      if (!error && data) {
        setEvents(data.map(sanitizeEvent));
      }
      setLoading(false);
    }
    load();
  }, [matchId]);

  // Subscribe to realtime changes — INSERT, UPDATE, DELETE
  useEffect(() => {
    const selectColumns = `
      id, match_id, source_token_id, type, team_id, player_id,
      player_out_id, player_in_id, target_team_id, related_event_id,
      detail, note, added_minutes, match_minute, half,
      real_timestamp, status, created_at,
      player:player_id ( id, name, number ),
      player_out:player_out_id ( id, name, number ),
      player_in:player_in_id ( id, name, number ),
      team:team_id ( id, short_name, color, logo_url )
    `;

    const channel = supabase
      .channel(`live_match_${matchId}`)
      // --- INSERT: new event ---
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_events',
        filter: `match_id=eq.${matchId}`,
      }, async (payload: any) => {
        const raw = payload.new;
        if (raw.status === 'rejected') return;

        // Re-fetch the event with JOINs for player/team names
        const { data: fullEvent } = await supabase
          .from('live_events')
          .select(selectColumns)
          .eq('id', raw.id)
          .maybeSingle();

        const newEvt = sanitizeEvent(fullEvent || raw);

        // Sound + vibration alerts for important events
        const isGoal = newEvt.type === 'goal' || newEvt.type === 'goal_penalty';
        const isRed = newEvt.type === 'red_card';
        const isPenaltyKick = newEvt.type === 'penalty_kick';

        if (initialLoadDoneRef.current) {
          if (isGoal) {
            playAlertSound('goal');
            triggerVibration([200, 100, 200, 100, 300]);
          } else if (isRed) {
            playAlertSound('card');
            triggerVibration([300, 100, 300]);
          } else if (isPenaltyKick) {
            playAlertSound('penalty');
            triggerVibration([200, 100, 200]);
          }
        }

        setEvents(prev => {
          const isDupe = prev.some(e =>
            e.type === newEvt.type && e.player_id === newEvt.player_id &&
            e.team_id === newEvt.team_id &&
            Math.abs(safeMinute(e.match_minute) - safeMinute(newEvt.match_minute)) <= 3
          );
          if (isDupe) return prev;

          if (CONTROL_TYPES.includes(newEvt.type)) {
            const filtered = prev.filter(e => e.type !== newEvt.type);
            return [newEvt, ...filtered].sort((a, b) => safeMinute(b.match_minute) - safeMinute(a.match_minute));
          }

          return [newEvt, ...prev];
        });
      })
      // --- UPDATE: scout edited an event (minute, player, status) ---
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_events',
        filter: `match_id=eq.${matchId}`,
      }, async (payload: any) => {
        const raw = payload.new;

        // If rejected/deleted, remove from list
        if (raw.status === 'rejected' || raw.status === 'deleted') {
          setEvents(prev => prev.filter(e => e.id !== raw.id));
          return;
        }

        // Re-fetch with JOINs for updated data
        const { data: fullEvent } = await supabase
          .from('live_events')
          .select(selectColumns)
          .eq('id', raw.id)
          .maybeSingle();

        if (!fullEvent) return;
        const updated = sanitizeEvent(fullEvent);

        setEvents(prev => {
          const idx = prev.findIndex(e => e.id === updated.id);
          if (idx === -1) return prev; // Not in our list
          const next = [...prev];
          next[idx] = updated;
          return next.sort((a, b) => safeMinute(b.match_minute) - safeMinute(a.match_minute));
        });
      })
      // --- DELETE: scout removed an event ---
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'live_events',
        filter: `match_id=eq.${matchId}`,
      }, (payload: any) => {
        const oldId = payload.old?.id;
        if (oldId) {
          setEvents(prev => prev.filter(e => e.id !== oldId));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [matchId]);

  // Mark initial load done after first fetch
  useEffect(() => {
    if (!loading && events.length >= 0) {
      // Small delay to avoid alerting on initial load events
      const timer = setTimeout(() => { initialLoadDoneRef.current = true; }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Compute live score from events
  const liveScore = useMemo(() => {
    let home = 0, away = 0;
    for (const evt of events) {
      if (evt.type === 'goal' || evt.type === 'goal_penalty') {
        if (evt.detail === 'own_goal') {
          if (evt.team_id === homeTeamId) away++;
          else home++;
        } else {
          if (evt.team_id === homeTeamId) home++;
          else away++;
        }
      }
    }
    return { home, away };
  }, [events, homeTeamId, awayTeamId]);

  // Notify parent of score changes
  useEffect(() => {
    onLiveScore?.(liveScore.home, liveScore.away);
  }, [liveScore.home, liveScore.away, onLiveScore]);

  const badge = getStatusBadge(scoutStatus);
  const currentTimer = useMemo(() => {
    if (!scoutStartedAt) return '00:00';
    if (scoutStatus === 'live_half1') return formatTimer(scoutStartedAt);
    if (scoutStatus === 'halftime') return formatTimer(scoutStartedAt, scoutHalf1End);
    if (scoutStatus === 'live_half2' && scoutHalf2Start) return formatTimer(scoutHalf2Start);
    if (scoutStatus === 'ended' && scoutHalf2Start) return formatTimer(scoutHalf2Start, scoutEndedAt);
    return '00:00';
  }, [scoutStatus, scoutStartedAt, scoutHalf1End, scoutHalf2Start, scoutEndedAt, timerTick]);

  // Filter display events (skip control events)
  const displayEvents = useMemo(() =>
    events.filter(e => !CONTROL_TYPES.includes(e.type) && e.type !== 'added_time'),
    [events]
  );

  // Split by half, sorted chronologically (filtered after duplicate detection below)
  const rawFirstHalf = useMemo(() =>
    [...displayEvents].filter(e => (e.half || 1) === 1).sort((a, b) => safeMinute(a.match_minute) - safeMinute(b.match_minute)),
    [displayEvents]
  );
  const rawSecondHalf = useMemo(() =>
    [...displayEvents].filter(e => (e.half || 1) === 2).sort((a, b) => safeMinute(a.match_minute) - safeMinute(b.match_minute)),
    [displayEvents]
  );

  // Second yellow detection
  const { secondYellowIds, duplicateRedIds } = useMemo(() => {
    const allSorted = [...displayEvents].sort((a, b) => {
      const halfA = a.half || 1;
      const halfB = b.half || 1;
      if (halfA !== halfB) return halfA - halfB;
      return safeMinute(a.match_minute) - safeMinute(b.match_minute);
    });
    const ids = new Set<string>();
    const dupReds = new Set<string>();
    const yellowSeen = new Set<string>();
    for (const ev of allSorted) {
      const pid = ev.player_id;
      if (!pid) continue;
      if (ev.type === 'yellow_card') {
        if (yellowSeen.has(pid)) ids.add(ev.id);
        yellowSeen.add(pid);
      }
      if (ev.type === 'red_card' && yellowSeen.has(pid)) {
        // Hide duplicate — 2nd yellow already covers it
        dupReds.add(ev.id);
      }
    }
    return { secondYellowIds: ids, duplicateRedIds: dupReds };
  }, [displayEvents]);

  // Filter out duplicate red_card events from display
  const firstHalf = useMemo(() => rawFirstHalf.filter(e => !duplicateRedIds.has(e.id)), [rawFirstHalf, duplicateRedIds]);
  const secondHalf = useMemo(() => rawSecondHalf.filter(e => !duplicateRedIds.has(e.id)), [rawSecondHalf, duplicateRedIds]);

  // Running score map
  const runningScoreMap = useMemo(() => {
    const allSorted = [...displayEvents].sort((a, b) => {
      const halfA = a.half || 1;
      const halfB = b.half || 1;
      if (halfA !== halfB) return halfA - halfB;
      return safeMinute(a.match_minute) - safeMinute(b.match_minute);
    });
    const map = new Map<string, { home: number; away: number }>();
    let rH = 0, rA = 0;
    for (const ev of allSorted) {
      const isGoal = ev.type === 'goal' || ev.type === 'goal_penalty';
      if (isGoal) {
        if (ev.detail === 'own_goal') {
          if (ev.team_id === homeTeamId) rA++; else rH++;
        } else {
          if (ev.team_id === homeTeamId) rH++; else rA++;
        }
        map.set(ev.id, { home: rH, away: rA });
      }
    }
    return map;
  }, [displayEvents, homeTeamId]);

  // Get team info — from event join or from parent props
  const getTeamLogo = (teamId?: string): string | undefined => {
    if (!teamId) return undefined;
    if (teamId === homeTeamId) return homeTeam?.logo_url;
    if (teamId === awayTeamId) return awayTeam?.logo_url;
    return undefined;
  };
  const getTeamName = (evt: LiveEvent): string => {
    if (evt.team?.short_name) return evt.team.short_name;
    if (evt.team_id === homeTeamId) return homeTeam?.short_name || '';
    if (evt.team_id === awayTeamId) return awayTeam?.short_name || '';
    return '';
  };

  // ============================
  // RENDER EVENT — matches official timeline pattern exactly
  // ============================
  const renderEvent = (evt: LiveEvent) => {
    const isGoal = evt.type === 'goal' || evt.type === 'goal_penalty';
    const isOwnGoal = evt.detail === 'own_goal';
    const isCard = evt.type === 'yellow_card' || evt.type === 'red_card';
    const isSub = evt.type === 'substitution';
    const isPenalty = evt.type === 'penalty_kick';
    const isNote = evt.type === 'note';
    const isSecondYellow = secondYellowIds.has(evt.id);
    const runningScore = runningScoreMap.get(evt.id);
    const teamName = getTeamName(evt);
    const teamLogo = evt.team?.logo_url || getTeamLogo(evt.team_id);

    return (
      <motion.div
        key={evt.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <div className="relative flex items-start gap-3 pl-1">
          {/* Minute */}
          <div className="w-11 shrink-0 text-right pr-1">
            <span className="text-[11px] font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
              {safeMinute(evt.match_minute) > 0 ? `${safeMinute(evt.match_minute)}'` : '-'}
            </span>
          </div>

          {/* Icon */}
          <div className="w-5 h-5 flex items-center justify-center z-10 shrink-0 mt-0.5">
            {isSecondYellow ? (
              <SecondYellowIcon size={16} />
            ) : isCard ? (
              <div className="w-3 h-4 rounded-[1.5px]" style={{ backgroundColor: evt.type === 'yellow_card' ? '#facc15' : '#ef4444' }} />
            ) : isGoal ? (
              <BallIcon size={16} className={isOwnGoal ? 'text-red-400' : 'text-green-400'} />
            ) : isSub ? (
              <SubIcon size={16} className="text-blue-400" />
            ) : isPenalty ? (
              <BallIcon size={16} className="text-amber-400" />
            ) : isNote ? (
              <div className="w-4 h-4 rounded-full flex items-center justify-center bg-white/10">
                <span className="text-[7px] font-bold text-muted-foreground">i</span>
              </div>
            ) : (
              <div className="w-4 h-4 rounded-full bg-white/10" />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 pb-3">
            {isSub ? (
              <div className="space-y-0.5">
                {/* Player IN */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  {evt.player_in?.number && <span className="text-[10px] text-muted-foreground font-bold" style={{ fontFamily: 'var(--font-mono)' }}>#{evt.player_in.number}</span>}
                  <span className="text-xs text-foreground font-medium">{evt.player_in?.name || '?'}</span>
                </div>
                {/* Player OUT */}
                <div className="flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  {(evt.player_out?.number || evt.player?.number) && (
                    <span className="text-[10px] text-muted-foreground/50 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                      #{evt.player_out?.number || evt.player?.number}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{evt.player_out?.name || evt.player?.name || '?'}</span>
                </div>
                {/* Team */}
                <div className="flex items-center gap-1 mt-0.5">
                  {teamLogo && (
                    <img src={logoUrl(teamLogo, 14)} alt="" width={14} height={14} loading="lazy" decoding="async" className="w-3.5 h-3.5 object-contain" />
                  )}
                  <span className="text-[10px] text-muted-foreground/60">{teamName}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-foreground font-medium flex items-center gap-1.5 min-w-0">
                    {evt.player?.number && <span className="text-[10px] text-muted-foreground font-bold" style={{ fontFamily: 'var(--font-mono)' }}>#{evt.player.number}</span>}
                    <span className="truncate">{evt.player?.name || (isNote ? (evt.note || 'Ocorrência') : 'Jogador')}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                  {teamLogo && (
                    <img src={logoUrl(teamLogo, 14)} alt="" width={14} height={14} loading="lazy" decoding="async" className="w-3.5 h-3.5 object-contain" />
                  )}
                  <span className="text-[10px] text-muted-foreground">{teamName}</span>
                  <span className="text-[10px] text-muted-foreground/60 ml-1">
                    {isSecondYellow ? '2º Amarelo / Expulsão' :
                     isOwnGoal ? 'Gol Contra' :
                     (EVENT_LABELS[evt.type] || evt.type)}
                  </span>
                  {/* Running score inline after goal label */}
                  {isGoal && runningScore && (
                    <span className="text-[10px] font-extrabold text-primary ml-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
                      ({runningScore.home}-{runningScore.away})
                    </span>
                  )}
                  {/* Penalty detail */}
                  {isPenalty && evt.detail && evt.detail !== 'scored' && (
                    <span className="text-[10px] text-muted-foreground/60 ml-1">
                      ({evt.detail === 'saved' ? 'Defendido' : evt.detail === 'missed' ? 'Fora' : evt.detail === 'post' ? 'Na trave' : evt.detail})
                    </span>
                  )}
                </div>
                {/* Note text below */}
                {isNote && evt.note && evt.player?.name && (
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">{evt.note}</p>
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  // Half header separator
  const renderHalfHeader = (label: string) => (
    <div className="flex items-center gap-2 py-2 pl-1">
      <div className="w-11 shrink-0" />
      <div className="flex-1 flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-heading)' }}>{label}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );

  if (!badge) return null;

  return (
    <div className="mt-4">
      {/* Status badge */}
      <div className="flex items-center justify-center gap-2 mb-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${badge.color}`}>
          {badge.pulse && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          {(scoutStatus === 'live_half1' || scoutStatus === 'live_half2') && (
            <Radio className="w-3 h-3" />
          )}
          {scoutStatus === 'halftime' && <Pause className="w-3 h-3" />}
          {badge.label}
        </span>
      </div>

      {/* Timer */}
      {(scoutStatus === 'live_half1' || scoutStatus === 'live_half2') && (
        <div className="text-center mb-3">
          <span className="text-2xl font-bold font-mono text-foreground">{currentTimer}</span>
        </div>
      )}

      {/* Pre-game state */}
      {scoutStatus === 'pre_game' && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-center">
          <Clock className="w-6 h-6 text-blue-400 mx-auto mb-2" />
          <p className="text-sm text-blue-300 font-semibold">Escalações sendo confirmadas</p>
          <p className="text-xs text-muted-foreground mt-1">Os olheiros estão preparando a cobertura ao vivo</p>
        </div>
      )}

      {/* Event timeline — same layout as official timeline */}
      {displayEvents.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Linha do Tempo
            </h3>
            <div className="flex-1 h-px bg-border" />
          </div>

          {firstHalf.length > 0 && (
            <>
              {renderHalfHeader('1º Tempo')}
              <div className="relative">
                <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-1">
                  {firstHalf.map(renderEvent)}
                </div>
              </div>
            </>
          )}

          {secondHalf.length > 0 && (
            <>
              {renderHalfHeader('Intervalo')}
              {renderHalfHeader('2º Tempo')}
              <div className="relative">
                <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" />
                <div className="space-y-1">
                  {secondHalf.map(renderEvent)}
                </div>
              </div>
            </>
          )}

          {/* If no halves detected but events exist (edge case) */}
          {firstHalf.length === 0 && secondHalf.length === 0 && displayEvents.length > 0 && (
            <div className="relative">
              <div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" />
              <div className="space-y-1">
                {displayEvents.map(renderEvent)}
              </div>
            </div>
          )}

          {(scoutStatus === 'ended' || scoutStatus === 'published') && (firstHalf.length > 0 || secondHalf.length > 0) && renderHalfHeader('Fim de Jogo')}
        </div>
      )}

      {/* No events yet */}
      {!loading && displayEvents.length === 0 && scoutStatus !== 'pre_game' && (
        <p className="text-center text-muted-foreground text-xs py-4">
          0 × 0 — Nenhum evento registrado ainda
        </p>
      )}

      {/* Disclaimer */}
      {scoutStatus !== 'published' && displayEvents.length > 0 && (
        <div className="flex items-start gap-2 mt-3 px-2">
          <AlertTriangle className="w-3 h-3 text-amber-500/60 shrink-0 mt-0.5" />
          <p className="text-[10px] text-muted-foreground/60 leading-tight">
            Dados sujeitos a revisão e atualização oficial.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}