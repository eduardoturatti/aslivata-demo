// ============================================================
// SCOUT MONITOR — Real-time dashboard for all active scouts
// Shows scout status, last activity, live event feed
// Also shows events from F7/broadcast panel as "Painel Admin"
// ============================================================
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase-client';
import { logoUrl } from '../lib/image-utils';
import { listTokens } from '../lib/scout-api';
import {
  Radio, Volume2, VolumeX, Eye, EyeOff, ChevronDown, ChevronUp,
  Wifi, WifiOff, Clock, Activity, Users, AlertTriangle, Loader2,
  RefreshCw,
} from 'lucide-react';

// ============================
// TYPES
// ============================
interface TokenStatus {
  id: string;
  token: string;
  label?: string;
  match_id: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  team?: { id: string; short_name: string; logo_url?: string } | null;
}

interface MatchInfo {
  id: string;
  round_number?: number;
  match_date?: string;
  scout_status?: string;
  home_team?: { id: string; short_name: string; logo_url?: string; color?: string };
  away_team?: { id: string; short_name: string; logo_url?: string; color?: string };
}

interface MonitorEvent {
  id: string;
  match_id: string;
  source_token_id?: string;
  type: string;
  team_id?: string;
  player_id?: string;
  player_out_id?: string;
  player_in_id?: string;
  detail?: string;
  note?: string;
  match_minute?: number;
  half?: number;
  real_timestamp: string;
  status: string;
  player?: { id: string; name: string; number?: string } | null;
  player_out?: { id: string; name: string; number?: string } | null;
  player_in?: { id: string; name: string; number?: string } | null;
  team?: { id: string; short_name: string; color?: string; logo_url?: string } | null;
  source_token?: { id: string; label?: string } | null;
}

// ============================
// CONSTANTS
// ============================
const EVENT_SELECT = `
  id, match_id, source_token_id, type, team_id, player_id,
  player_out_id, player_in_id, detail, note, match_minute, half,
  real_timestamp, status, created_at,
  player:player_id ( id, name, number ),
  player_out:player_out_id ( id, name, number ),
  player_in:player_in_id ( id, name, number ),
  team:team_id ( id, short_name, color, logo_url )
`;

const EVENT_ICONS: Record<string, string> = {
  goal: '\u26bd', goal_penalty: '\u26bd', penalty_kick: '\ud83c\udfaf',
  yellow_card: '\ud83d\udfe8', red_card: '\ud83d\udfe5',
  substitution: '\ud83d\udd04', foul: '\u274c',
  corner: '\ud83d\udea9', offside: '\ud83d\udea9',
  shot_on_target: '\ud83c\udfaf', shot_off_target: '\ud83d\udca8',
  free_kick: '\ud83e\uddb6', throw_in: '\ud83e\udd3e',
  match_start: '\u25b6\ufe0f', half1_end: '\u23f8\ufe0f',
  half2_start: '\u25b6\ufe0f', match_end: '\u23f9\ufe0f',
  added_time: '\u23f1\ufe0f', note: '\ud83d\udcdd',
  goalkeeper_save: '\ud83e\udde4', injury: '\ud83e\ude79',
};

const EVENT_LABELS: Record<string, string> = {
  goal: 'Gol', goal_penalty: 'Gol de P\u00eanalti', penalty_kick: 'P\u00eanalti',
  yellow_card: 'Cart\u00e3o Amarelo', red_card: 'Cart\u00e3o Vermelho',
  substitution: 'Substitui\u00e7\u00e3o', foul: 'Falta',
  corner: 'Escanteio', offside: 'Impedimento',
  shot_on_target: 'Chute no Gol', shot_off_target: 'Chute para Fora',
  free_kick: 'Falta/Tiro Livre', throw_in: 'Lateral',
  match_start: 'In\u00edcio do Jogo', half1_end: 'Fim do 1\u00ba Tempo',
  half2_start: 'In\u00edcio do 2\u00ba Tempo', match_end: 'Fim do Jogo',
  added_time: 'Acr\u00e9scimos', note: 'Anota\u00e7\u00e3o',
  goalkeeper_save: 'Defesa', injury: 'Les\u00e3o',
};

const HIGHLIGHT_TYPES = ['goal', 'goal_penalty', 'red_card', 'penalty_kick', 'match_start', 'match_end'];

// Online threshold: 5 minutes
const ONLINE_THRESHOLD = 5 * 60 * 1000;

// ============================
// SOUND
// ============================
let audioCtx: AudioContext | null = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return audioCtx;
}

function playSound(type: 'goal' | 'red' | 'event') {
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
      osc.frequency.linearRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.5);
    } else if (type === 'red') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(200, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.45);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.45);
    } else {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.15);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.15);
    }
  } catch { /* audio not supported */ }
}

function sanitizeObj(obj: any) {
  return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null;
}

// ============================
// COMPONENT
// ============================
interface ScoutMonitorProps {
  matchIds: string[];
  matches: MatchInfo[];
}

export function ScoutMonitor({ matchIds, matches }: ScoutMonitorProps) {
  const [tokens, setTokens] = useState<TokenStatus[]>([]);
  const [events, setEvents] = useState<MonitorEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundOn, setSoundOn] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false); // show all event types or just highlights
  const [now, setNow] = useState(Date.now());
  const seenIds = useRef(new Set<string>());
  const initialDone = useRef(false);
  const soundRef = useRef(false);

  useEffect(() => { soundRef.current = soundOn; }, [soundOn]);

  // Tick every 30s to update "online" status
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(iv);
  }, []);

  // Load tokens for all matches
  const loadTokens = useCallback(async () => {
    if (matchIds.length === 0) return;
    const allTokens: TokenStatus[] = [];
    for (const mid of matchIds) {
      try {
        const res = await listTokens(mid);
        if (res.tokens) allTokens.push(...res.tokens);
      } catch { /* ignore */ }
    }
    setTokens(allTokens);
  }, [matchIds]);

  useEffect(() => {
    loadTokens();
    const iv = setInterval(loadTokens, 60000); // refresh tokens every minute
    return () => clearInterval(iv);
  }, [loadTokens]);

  // Load events for all active matches
  useEffect(() => {
    if (matchIds.length === 0) { setLoading(false); return; }

    async function loadEvents() {
      const { data } = await supabase
        .from('live_events')
        .select(EVENT_SELECT)
        .in('match_id', matchIds)
        .neq('status', 'rejected')
        .order('real_timestamp', { ascending: false })
        .limit(300);

      if (data) {
        const sanitized = data.map((e: any) => ({
          ...e,
          match_minute: typeof e.match_minute === 'number' ? e.match_minute : 0,
          half: typeof e.half === 'number' ? e.half : 1,
          player: sanitizeObj(e.player),
          player_out: sanitizeObj(e.player_out),
          player_in: sanitizeObj(e.player_in),
          team: sanitizeObj(e.team),
          source_token: sanitizeObj(e.source_token),
        }));
        sanitized.forEach((e: MonitorEvent) => seenIds.current.add(e.id));
        setEvents(sanitized);
      }
      setLoading(false);
      setTimeout(() => { initialDone.current = true; }, 2000);
    }
    loadEvents();
  }, [matchIds]);

  // Realtime subscription
  useEffect(() => {
    if (matchIds.length === 0) return;

    const channel = supabase
      .channel('scout_monitor_events')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'live_events',
      }, async (payload: any) => {
        const raw = payload.new;
        if (raw.status === 'rejected') return;
        if (!matchIds.includes(raw.match_id)) return;
        if (seenIds.current.has(raw.id)) return;
        seenIds.current.add(raw.id);

        // Re-fetch with joins
        const { data: full } = await supabase
          .from('live_events')
          .select(EVENT_SELECT)
          .eq('id', raw.id)
          .maybeSingle();

        const evt: MonitorEvent = {
          ...(full || raw),
          match_minute: typeof (full?.match_minute ?? raw.match_minute) === 'number' ? (full?.match_minute ?? raw.match_minute) : 0,
          half: typeof (full?.half ?? raw.half) === 'number' ? (full?.half ?? raw.half) : 1,
          player: sanitizeObj(full?.player),
          player_out: sanitizeObj(full?.player_out),
          player_in: sanitizeObj(full?.player_in),
          team: sanitizeObj(full?.team),
          source_token: sanitizeObj(full?.source_token),
        };

        setEvents(prev => [evt, ...prev]);

        // Sound alerts
        if (initialDone.current && soundRef.current) {
          if (evt.type === 'goal' || evt.type === 'goal_penalty') playSound('goal');
          else if (evt.type === 'red_card') playSound('red');
          else playSound('event');
        }

        // Refresh tokens to update last_used
        loadTokens();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_events',
      }, async (payload: any) => {
        const raw = payload.new;
        if (!matchIds.includes(raw.match_id)) return;
        if (raw.status === 'rejected' || raw.status === 'deleted') {
          setEvents(prev => prev.filter(e => e.id !== raw.id));
          return;
        }
        const { data: full } = await supabase
          .from('live_events')
          .select(EVENT_SELECT)
          .eq('id', raw.id)
          .maybeSingle();
        if (!full) return;
        const updated: MonitorEvent = {
          ...full,
          match_minute: typeof full.match_minute === 'number' ? full.match_minute : 0,
          half: typeof full.half === 'number' ? full.half : 1,
          player: sanitizeObj(full.player),
          player_out: sanitizeObj(full.player_out),
          player_in: sanitizeObj(full.player_in),
          team: sanitizeObj(full.team),
          source_token: sanitizeObj(full.source_token),
        };
        setEvents(prev => {
          const idx = prev.findIndex(e => e.id === updated.id);
          if (idx === -1) return prev;
          const next = [...prev];
          next[idx] = updated;
          return next;
        });
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'live_events',
      }, (payload: any) => {
        if (payload.old?.id) {
          setEvents(prev => prev.filter(e => e.id !== payload.old.id));
          seenIds.current.delete(payload.old.id);
        }
      })
      .subscribe();

    // Also subscribe to match_access_tokens updates for online status
    const tokenChannel = supabase
      .channel('scout_monitor_tokens')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'match_access_tokens',
      }, () => {
        loadTokens();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(tokenChannel);
    };
  }, [matchIds, loadTokens]);

  // Active tokens with online status
  const activeTokens = useMemo(() => {
    return tokens.filter(t => t.is_active).map(t => {
      const lastUsed = t.last_used_at ? new Date(t.last_used_at).getTime() : 0;
      const isOnline = lastUsed > 0 && (now - lastUsed) < ONLINE_THRESHOLD;
      const match = matches.find(m => m.id === t.match_id);
      return { ...t, isOnline, match, lastUsed };
    });
  }, [tokens, now, matches]);

  // Events to display
  const displayEvents = useMemo(() => {
    if (showAll) return events;
    return events.filter(e => HIGHLIGHT_TYPES.includes(e.type) ||
      ['yellow_card', 'substitution', 'half1_end', 'half2_start'].includes(e.type));
  }, [events, showAll]);

  // Event count by source
  const eventsBySource = useMemo(() => {
    const map: Record<string, number> = {};
    events.forEach(e => {
      const key = e.source_token_id || '__admin__';
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [events]);

  const getMatchLabel = useCallback((matchId: string) => {
    const m = matches.find(x => x.id === matchId);
    if (!m) return '???';
    return `${m.home_team?.short_name || '?'} x ${m.away_team?.short_name || '?'}`;
  }, [matches]);

  const getSourceLabel = useCallback((evt: MonitorEvent) => {
    if (!evt.source_token_id) return 'Painel Admin';
    // Look up from loaded tokens
    const tok = tokens.find(t => t.id === evt.source_token_id);
    if (tok?.label) return tok.label;
    if (evt.source_token?.label) return evt.source_token.label;
    return 'Olheiro';
  }, [tokens]);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Nunca';
    const diff = now - new Date(dateStr).getTime();
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}min`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`;
    return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  };

  if (matchIds.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Activity className="w-4.5 h-4.5 text-emerald-600" />
            {activeTokens.some(t => t.isOnline) && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}
          </div>
          <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Monitor dos Olheiros
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {activeTokens.filter(t => t.isOnline).length}/{activeTokens.length} online
          </span>
        </div>
        <div className="flex items-center gap-2">
          {events.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
              {events.length} eventos
            </span>
          )}
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-slate-100">
          {/* Controls bar */}
          <div className="flex items-center gap-2 pt-3">
            <button
              onClick={() => setSoundOn(!soundOn)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                soundOn ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
              }`}
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              Som
            </button>
            <button
              onClick={() => setShowAll(!showAll)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                showAll ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-50 text-slate-400 border border-slate-200'
              }`}
            >
              {showAll ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {showAll ? 'Todos' : 'Principais'}
            </button>
            <div className="flex-1" />
            <button
              onClick={() => { loadTokens(); }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-xs hover:bg-slate-100 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {/* Scout status cards */}
          {activeTokens.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3 h-3" /> Olheiros ({activeTokens.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeTokens.map(t => {
                  const evtCount = eventsBySource[t.id] || 0;
                  return (
                    <div
                      key={t.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        t.isOnline
                          ? 'border-green-200 bg-green-50/50'
                          : 'border-slate-200 bg-slate-50/50'
                      }`}
                    >
                      {/* Online indicator */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        t.isOnline ? 'bg-green-100' : 'bg-slate-100'
                      }`}>
                        {t.isOnline
                          ? <Wifi className="w-4 h-4 text-green-600" />
                          : <WifiOff className="w-4 h-4 text-slate-400" />
                        }
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-700 truncate">
                            {t.label || 'Olheiro'}
                          </span>
                          {t.isOnline && (
                            <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                              ONLINE
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {/* Match info */}
                          {t.match && (
                            <div className="flex items-center gap-1">
                              {t.match.home_team?.logo_url && (
                                <img src={logoUrl(t.match.home_team.logo_url, 14)} alt="" className="w-3.5 h-3.5 object-contain" />
                              )}
                              <span className="text-[10px] text-slate-500">
                                {t.match.home_team?.short_name || '?'} x {t.match.away_team?.short_name || '?'}
                              </span>
                              {t.match.away_team?.logo_url && (
                                <img src={logoUrl(t.match.away_team.logo_url, 14)} alt="" className="w-3.5 h-3.5 object-contain" />
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTimeAgo(t.last_used_at)}
                          </span>
                          {evtCount > 0 && (
                            <span className="text-[9px] text-blue-500 font-bold">
                              {evtCount} eventos
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Token code */}
                      <code className="text-[9px] font-mono bg-white px-1.5 py-0.5 rounded text-slate-400 border border-slate-200 shrink-0">
                        {t.token}
                      </code>
                    </div>
                  );
                })}

                {/* Admin/F7 panel card */}
                {eventsBySource['__admin__'] > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-200 bg-indigo-50/50">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-100">
                      <Radio className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold text-indigo-700">Painel Admin / F7</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-indigo-400">Eventos do singular.live</span>
                      </div>
                      <span className="text-[9px] text-blue-500 font-bold mt-1 block">
                        {eventsBySource['__admin__']} eventos
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No scouts warning */}
          {activeTokens.length === 0 && !loading && (
            <div className="text-center py-4 rounded-xl bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-6 h-6 text-amber-400 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-amber-700">Nenhum olheiro ativo</p>
              <p className="text-[10px] text-amber-500 mt-0.5">Gere tokens nas partidas acima para ativar o monitoramento</p>
            </div>
          )}

          {/* Event feed */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Radio className="w-3.5 h-3.5 text-red-500" />
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Feed em Tempo Real
              </h4>
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] text-slate-300 font-mono">{displayEvents.length}</span>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
              </div>
            ) : displayEvents.length === 0 ? (
              <div className="text-center py-6 rounded-xl bg-slate-50">
                <p className="text-xs text-slate-400">Nenhum evento registrado ainda</p>
                <p className="text-[10px] text-slate-300 mt-0.5">Eventos dos olheiros e do painel F7 aparecem aqui</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-[400px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
                {displayEvents.map(evt => {
                  const isHighlight = HIGHLIGHT_TYPES.includes(evt.type);
                  const isGoal = evt.type === 'goal' || evt.type === 'goal_penalty';
                  const isRed = evt.type === 'red_card';
                  const isControl = ['match_start', 'half1_end', 'half2_start', 'match_end'].includes(evt.type);

                  let bgClass = 'bg-white border-slate-100';
                  if (isGoal) bgClass = 'bg-green-50 border-green-200';
                  else if (isRed) bgClass = 'bg-red-50 border-red-200';
                  else if (isControl) bgClass = 'bg-blue-50 border-blue-200';
                  else if (isHighlight) bgClass = 'bg-amber-50 border-amber-200';

                  const sourceLabel = getSourceLabel(evt);
                  const matchLabel = getMatchLabel(evt.match_id);
                  const time = new Date(evt.real_timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  return (
                    <div
                      key={evt.id}
                      className={`flex items-start gap-2 p-2.5 rounded-xl border ${bgClass} transition-all`}
                    >
                      {/* Icon */}
                      <span className="text-base shrink-0 mt-0.5">{EVENT_ICONS[evt.type] || '\ud83d\udfe2'}</span>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[11px] font-bold ${isHighlight ? 'text-slate-800' : 'text-slate-600'}`}>
                            {EVENT_LABELS[evt.type] || evt.type}
                          </span>
                          {evt.match_minute != null && (
                            <span className="text-[10px] text-slate-400 font-mono">{evt.match_minute}'</span>
                          )}
                          {evt.half && (
                            <span className="text-[9px] text-slate-300">{evt.half === 2 ? '2T' : '1T'}</span>
                          )}
                          {evt.detail && evt.detail !== 'normal' && (
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1 py-0.5 rounded font-medium">
                              {evt.detail === 'own_goal' ? 'CONTRA' :
                               evt.detail === 'saved' ? 'DEFENDIDO' :
                               evt.detail === 'missed' ? 'FORA' :
                               evt.detail === 'post' ? 'TRAVE' :
                               evt.detail === 'scored' ? 'CONVERTIDO' :
                               evt.detail === 'free_kick' ? 'FALTA' :
                               evt.detail === 'second_yellow' ? '2\u00ba AMARELO' :
                               evt.detail}
                            </span>
                          )}
                        </div>

                        {/* Player info */}
                        {(evt.player || evt.player_out || evt.player_in) && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {evt.player && (
                              <span className="text-[10px] text-slate-600">
                                {evt.player.number ? `#${evt.player.number} ` : ''}{evt.player.name}
                              </span>
                            )}
                            {evt.type === 'substitution' && evt.player_out && evt.player_in && (
                              <span className="text-[10px] text-slate-500">
                                <span className="text-red-400">{evt.player_out.name}</span>
                                {' \u2192 '}
                                <span className="text-green-500">{evt.player_in.name}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {/* Note */}
                        {evt.note && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5 truncate">{evt.note}</p>
                        )}

                        {/* Meta row: team, match, source, time */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {evt.team && (
                            <div className="flex items-center gap-0.5">
                              {evt.team.logo_url && (
                                <img src={logoUrl(evt.team.logo_url, 12)} alt="" className="w-3 h-3 object-contain" />
                              )}
                              <span className="text-[9px] text-slate-400">{evt.team.short_name}</span>
                            </div>
                          )}
                          <span className="text-[9px] text-slate-300">{matchLabel}</span>
                          <span className="text-[9px] text-slate-300">&middot;</span>
                          <span className={`text-[9px] font-bold ${
                            sourceLabel === 'Painel Admin' ? 'text-indigo-500' : 'text-emerald-500'
                          }`}>
                            {sourceLabel}
                          </span>
                          <span className="text-[9px] text-slate-300 font-mono ml-auto shrink-0">{time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}