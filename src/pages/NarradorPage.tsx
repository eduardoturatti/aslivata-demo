// ============================================================
// NARRADOR PAGE — Real-time dashboard for ALL live matches
// Admin-only: /admin/narrador
// Shows goals, penalties, red cards with sound + vibration alerts
// ============================================================
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase-client';
import { logoUrl } from '../lib/image-utils';
import { Radio, Volume2, VolumeX, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';

// ============================
// TYPES
// ============================
interface MatchData {
  id: string;
  round_number: number;
  match_date: string;
  scout_status: string;
  scout_started_at?: string;
  scout_half1_end?: string;
  scout_half2_start?: string;
  scout_ended_at?: string;
  home_team_id: string;
  away_team_id: string;
  home_team?: { id: string; short_name: string; name: string; logo_url?: string; color?: string };
  away_team?: { id: string; short_name: string; name: string; logo_url?: string; color?: string };
}

interface NarrEvent {
  id: string;
  match_id: string;
  type: string;
  team_id?: string;
  player_id?: string;
  detail?: string;
  match_minute: number;
  half: number;
  real_timestamp: string;
  status: string;
  player?: { id: string; name: string; number?: string } | null;
  team?: { id: string; short_name: string; color?: string; logo_url?: string } | null;
}

// ============================
// SOUND + VIBRATION
// ============================
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

function playNarrSound(type: 'goal' | 'red' | 'penalty') {
  try {
    const ctx = getAudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'goal') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(660, ctx.currentTime + 0.1);
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.2);
      osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.6);
    } else if (type === 'red') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      // Penalty — triple beep
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + 0.24);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.4);
    }
  } catch { /* audio not supported */ }
}

function vibrate(pattern: number[]) {
  try { navigator.vibrate?.(pattern); } catch { }
}

function safeMinute(val: any): number {
  if (typeof val === 'number' && !isNaN(val)) return val;
  return 0;
}

// Highlight event types for narrador
const NARR_TYPES = ['goal', 'goal_penalty', 'penalty_kick', 'red_card'];

const EVENT_ICONS: Record<string, string> = {
  goal: '\u26bd', goal_penalty: '\u26bd\ufe0f', penalty_kick: '\ud83c\udfaf',
  red_card: '\ud83d\udfe5',
};

const EVENT_LABELS: Record<string, string> = {
  goal: 'GOL', goal_penalty: 'GOL DE PENALTI', penalty_kick: 'PENALTI',
  red_card: 'EXPULSAO',
};

const STATUS_LABELS: Record<string, { text: string; color: string }> = {
  pre_game: { text: 'Pre-jogo', color: 'bg-blue-500' },
  live_half1: { text: '1o Tempo', color: 'bg-red-500' },
  halftime: { text: 'Intervalo', color: 'bg-amber-500' },
  live_half2: { text: '2o Tempo', color: 'bg-red-500' },
  ended: { text: 'Encerrado', color: 'bg-slate-600' },
};

// ============================
// MAIN COMPONENT
// ============================
export function NarradorPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [events, setEvents] = useState<NarrEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [flashEvent, setFlashEvent] = useState<NarrEvent | null>(null);
  const initialLoadDone = useRef(false);
  const seenIds = useRef(new Set<string>());
  const soundOnRef = useRef(true);

  // Keep ref in sync
  useEffect(() => { soundOnRef.current = soundOn; }, [soundOn]);

  // Load active matches
  useEffect(() => {
    async function loadMatches() {
      const { data } = await supabase
        .from('matches')
        .select(`
          id, round_number, match_date, scout_status,
          scout_started_at, scout_half1_end, scout_half2_start, scout_ended_at,
          home_team_id, away_team_id,
          home_team:home_team_id ( id, short_name, name, logo_url, color ),
          away_team:away_team_id ( id, short_name, name, logo_url, color )
        `)
        .in('scout_status', ['pre_game', 'live_half1', 'halftime', 'live_half2', 'ended']);

      if (data) {
        const sanitized = data.map((m: any) => ({
          ...m,
          home_team: m.home_team && typeof m.home_team === 'object' && !Array.isArray(m.home_team) ? m.home_team : null,
          away_team: m.away_team && typeof m.away_team === 'object' && !Array.isArray(m.away_team) ? m.away_team : null,
        }));
        setMatches(sanitized);
      }
    }
    loadMatches();
    const interval = setInterval(loadMatches, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load events for all active matches
  useEffect(() => {
    if (matches.length === 0) { setLoading(false); return; }

    async function loadEvents() {
      const matchIds = matches.map(m => m.id);
      const { data } = await supabase
        .from('live_events')
        .select(`
          id, match_id, type, team_id, player_id, detail,
          match_minute, half, real_timestamp, status,
          player:player_id ( id, name, number ),
          team:team_id ( id, short_name, color, logo_url )
        `)
        .in('match_id', matchIds)
        .in('type', NARR_TYPES)
        .neq('status', 'rejected')
        .order('real_timestamp', { ascending: false })
        .limit(200);

      if (data) {
        const sanitized = data.map((e: any) => ({
          ...e,
          match_minute: safeMinute(e.match_minute),
          half: typeof e.half === 'number' ? e.half : 1,
          player: e.player && typeof e.player === 'object' && !Array.isArray(e.player) ? e.player : null,
          team: e.team && typeof e.team === 'object' && !Array.isArray(e.team) ? e.team : null,
        }));
        sanitized.forEach((e: NarrEvent) => seenIds.current.add(e.id));
        setEvents(sanitized);
      }
      setLoading(false);
      setTimeout(() => { initialLoadDone.current = true; }, 2000);
    }
    loadEvents();
  }, [matches]);

  // Realtime subscription — all live_events (INSERT + UPDATE + DELETE)
  useEffect(() => {
    const narrSelect = `
      id, match_id, type, team_id, player_id, detail,
      match_minute, half, real_timestamp, status,
      player:player_id ( id, name, number ),
      team:team_id ( id, short_name, color, logo_url )
    `;

    const sanitizeNarrEvt = (raw: any, full: any): NarrEvent => ({
      ...(full || raw),
      match_minute: safeMinute(full?.match_minute || raw.match_minute),
      half: typeof (full?.half || raw.half) === 'number' ? (full?.half || raw.half) : 1,
      player: full?.player && typeof full.player === 'object' ? full.player : null,
      team: full?.team && typeof full.team === 'object' ? full.team : null,
    });

    const channel = supabase
      .channel('narrador_all_events')
      // --- INSERT ---
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_events',
      }, async (payload: any) => {
        const raw = payload.new;
        if (raw.status === 'rejected') return;
        if (!NARR_TYPES.includes(raw.type)) return;
        if (seenIds.current.has(raw.id)) return;
        seenIds.current.add(raw.id);

        const { data: fullEvt } = await supabase
          .from('live_events')
          .select(narrSelect)
          .eq('id', raw.id)
          .maybeSingle();

        const evt = sanitizeNarrEvt(raw, fullEvt);
        setEvents(prev => [evt, ...prev]);

        // Alerts
        if (initialLoadDone.current && soundOnRef.current) {
          if (evt.type === 'goal' || evt.type === 'goal_penalty') {
            playNarrSound('goal');
            vibrate([200, 100, 200, 100, 400]);
          } else if (evt.type === 'red_card') {
            playNarrSound('red');
            vibrate([400, 200, 400]);
          } else if (evt.type === 'penalty_kick') {
            playNarrSound('penalty');
            vibrate([200, 100, 200]);
          }
        }

        // Flash animation
        setFlashEvent(evt);
        setTimeout(() => setFlashEvent(null), 4000);
      })
      // --- UPDATE: scout edited event (minute correction, status change) ---
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_events',
      }, async (payload: any) => {
        const raw = payload.new;
        // Remove if rejected/deleted or no longer a narr type
        if (raw.status === 'rejected' || raw.status === 'deleted' || !NARR_TYPES.includes(raw.type)) {
          setEvents(prev => prev.filter(e => e.id !== raw.id));
          return;
        }

        const { data: fullEvt } = await supabase
          .from('live_events')
          .select(narrSelect)
          .eq('id', raw.id)
          .maybeSingle();

        if (!fullEvt) return;
        const updated = sanitizeNarrEvt(raw, fullEvt);
        setEvents(prev => {
          const idx = prev.findIndex(e => e.id === updated.id);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = updated;
          return next;
        });
      })
      // --- DELETE ---
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'live_events',
      }, (payload: any) => {
        const oldId = payload.old?.id;
        if (oldId) {
          setEvents(prev => prev.filter(e => e.id !== oldId));
          seenIds.current.delete(oldId);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Compute scores per match
  const matchScores = useMemo(() => {
    const scores: Record<string, { home: number; away: number }> = {};
    for (const m of matches) {
      scores[m.id] = { home: 0, away: 0 };
    }
    // Use all events (not just narr_types) — but we only have narr_types loaded
    // Goals are enough for score
    for (const evt of events) {
      const match = matches.find(m => m.id === evt.match_id);
      if (!match) continue;
      if (evt.type !== 'goal' && evt.type !== 'goal_penalty') continue;
      if (!scores[evt.match_id]) scores[evt.match_id] = { home: 0, away: 0 };
      if (evt.detail === 'own_goal') {
        if (evt.team_id === match.home_team_id) scores[evt.match_id].away++;
        else scores[evt.match_id].home++;
      } else {
        if (evt.team_id === match.home_team_id) scores[evt.match_id].home++;
        else scores[evt.match_id].away++;
      }
    }
    return scores;
  }, [events, matches]);

  const getMatchLabel = useCallback((matchId: string) => {
    const m = matches.find(x => x.id === matchId);
    if (!m) return 'Jogo desconhecido';
    return `${m.home_team?.short_name || '?'} x ${m.away_team?.short_name || '?'}`;
  }, [matches]);

  const getMatchInfo = useCallback((matchId: string) => matches.find(x => x.id === matchId), [matches]);

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white">
      {/* Flash overlay for new events */}
      {flashEvent && (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center animate-pulse">
          <div className={`
            absolute inset-0 
            ${flashEvent.type === 'goal' || flashEvent.type === 'goal_penalty' ? 'bg-green-500/10' :
              flashEvent.type === 'red_card' ? 'bg-red-500/10' : 'bg-amber-500/10'}
          `} />
          <div className="relative bg-black/90 border border-white/20 rounded-3xl px-8 py-6 max-w-sm text-center space-y-2 shadow-2xl">
            <p className="text-4xl">{EVENT_ICONS[flashEvent.type] || ''}</p>
            <p className="text-xl font-black uppercase tracking-wider">
              {EVENT_LABELS[flashEvent.type] || flashEvent.type}
            </p>
            <p className="text-lg font-bold text-white/80">
              {flashEvent.player?.name || 'Jogador'}
            </p>
            <div className="flex items-center justify-center gap-2">
              {flashEvent.team?.logo_url && (
                <img src={logoUrl(flashEvent.team.logo_url, 24)} alt="" className="w-6 h-6 object-contain" />
              )}
              <span className="text-sm text-white/60">{flashEvent.team?.short_name || ''}</span>
              <span className="text-sm text-white/40 font-mono">{flashEvent.match_minute}'</span>
            </div>
            <p className="text-xs text-white/30">{getMatchLabel(flashEvent.match_id)}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="text-white/40 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h1 className="text-lg font-black tracking-tight" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                NARRADOR
              </h1>
            </div>
            <span className="text-white/30 text-xs font-mono">{matches.length} jogos</span>
          </div>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2 rounded-xl transition-colors ${soundOn ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/30'}`}
          >
            {soundOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-4 space-y-6">
        {/* Match scorecards */}
        {matches.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {matches.map(m => {
              const score = matchScores[m.id] || { home: 0, away: 0 };
              const status = STATUS_LABELS[m.scout_status] || { text: m.scout_status, color: 'bg-slate-500' };
              const isLive = m.scout_status === 'live_half1' || m.scout_status === 'live_half2';

              return (
                <div key={m.id} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-white/30 text-[10px] font-mono">R{m.round_number}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${status.color}`}>
                      {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                      {status.text}
                    </span>
                  </div>

                  {/* Teams + Score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {m.home_team?.logo_url && (
                        <img src={logoUrl(m.home_team.logo_url, 32)} alt="" className="w-8 h-8 object-contain shrink-0" />
                      )}
                      <span className="text-sm font-bold text-white truncate">{m.home_team?.short_name || '?'}</span>
                    </div>

                    <div className="px-4 text-center shrink-0">
                      <span className="text-2xl font-black font-mono text-white">
                        {score.home} <span className="text-white/30 text-lg">x</span> {score.away}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <span className="text-sm font-bold text-white truncate">{m.away_team?.short_name || '?'}</span>
                      {m.away_team?.logo_url && (
                        <img src={logoUrl(m.away_team.logo_url, 32)} alt="" className="w-8 h-8 object-contain shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Event feed */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Radio className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">Feed de Eventos</h2>
            <div className="flex-1 h-px bg-white/5" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-white/30 text-sm">Nenhum evento relevante registrado ainda</p>
              <p className="text-white/15 text-xs mt-1">Gols, penaltis e expulsoes aparecerao aqui em tempo real</p>
            </div>
          ) : (
            <div className="space-y-2">
              {events.map(evt => {
                const matchInfo = getMatchInfo(evt.match_id);
                const isGoal = evt.type === 'goal' || evt.type === 'goal_penalty';
                const isRed = evt.type === 'red_card';
                const isPen = evt.type === 'penalty_kick';
                const borderColor = isGoal ? 'border-green-500/30' : isRed ? 'border-red-500/30' : 'border-amber-500/30';
                const bgColor = isGoal ? 'bg-green-500/5' : isRed ? 'bg-red-500/5' : 'bg-amber-500/5';

                return (
                  <div key={evt.id} className={`${bgColor} ${borderColor} border rounded-xl p-3 flex items-center gap-3`}>
                    {/* Icon */}
                    <span className="text-2xl shrink-0">{EVENT_ICONS[evt.type] || ''}</span>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white uppercase">
                          {EVENT_LABELS[evt.type]}
                        </span>
                        <span className="text-white/30 text-xs font-mono">{evt.match_minute}'</span>
                        <span className="text-white/20 text-[10px]">{evt.half === 2 ? '2T' : '1T'}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-sm text-white/70 truncate">
                          {evt.player?.number ? `#${evt.player.number} ` : ''}
                          {evt.player?.name || 'Jogador'}
                        </span>
                        {evt.detail === 'own_goal' && (
                          <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-bold">CONTRA</span>
                        )}
                        {isPen && evt.detail && evt.detail !== 'scored' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                            {evt.detail === 'saved' ? 'DEFENDIDO' : evt.detail === 'missed' ? 'FORA' : evt.detail === 'post' ? 'TRAVE' : evt.detail.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        {evt.team?.logo_url && (
                          <img src={logoUrl(evt.team.logo_url, 14)} alt="" className="w-3.5 h-3.5 object-contain" />
                        )}
                        <span className="text-[10px] text-white/30">{evt.team?.short_name || ''}</span>
                        <span className="text-white/10 mx-1">&middot;</span>
                        <span className="text-[10px] text-white/20">
                          {matchInfo?.home_team?.short_name || '?'} x {matchInfo?.away_team?.short_name || '?'}
                        </span>
                      </div>
                    </div>

                    {/* Match score */}
                    {isGoal && matchInfo && (
                      <div className="shrink-0 text-right">
                        <span className="text-lg font-black font-mono text-green-400">
                          {(matchScores[evt.match_id]?.home || 0)}-{(matchScores[evt.match_id]?.away || 0)}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Empty state */}
        {!loading && matches.length === 0 && (
          <div className="text-center py-20">
            <Radio className="w-12 h-12 text-white/10 mx-auto mb-4" />
            <p className="text-white/30 text-lg font-bold">Nenhum jogo ao vivo</p>
            <p className="text-white/15 text-sm mt-1">Quando os olheiros iniciarem, os jogos aparecerao aqui</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default NarradorPage;