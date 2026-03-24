// ============================================================
// SCOUT PAGE — Mobile-first live scouting interface
// Route: /live/:token
// Dark theme, large buttons, field-ready UX
// ============================================================
import { useState, useEffect, useCallback, useMemo, Component, type ReactNode } from 'react';
import { useParams } from 'react-router';
import {
  validateScoutToken, getMatchPlayers, saveLineup, getSavedLineup,
  postEvent, getEvents, getMatchState, editEvent, deleteEvent,
  type TokenValidation, type PlayerInfo, type LiveEvent, type MatchInfo,
} from '../lib/scout-api';
import { photoUrl } from '../lib/image-utils';
import {
  AlertCircle, CheckCircle, ChevronDown, ChevronLeft, Clock, Edit3,
  Loader2, Minus, Play, Plus, Search, Shield, Trash2, X, Zap,
} from 'lucide-react';

// ============================
// ERROR BOUNDARY — catches React render errors so page doesn't go white
// ============================
class ScoutErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; error: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error?.message || String(error) };
  }
  componentDidCatch(error: Error, info: any) {
    console.error('[Scout] RENDER CRASH:', error, info?.componentStack);
    try {
      console.error('[Scout] CRASH DETAILS — error.message:', error?.message);
      console.error('[Scout] CRASH DETAILS — stack:', error?.stack?.slice(0, 500));
    } catch {}
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-6">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold mb-2">Erro no Scout</h1>
          <p className="text-white/50 text-sm text-center mb-2">
            Ocorreu um erro inesperado. Tente recarregar.
          </p>
          <p className="text-red-400/60 text-xs text-center mb-6 max-w-xs font-mono break-all">
            {this.state.error}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: '' }); window.location.reload(); }}
            className="bg-green-500 text-black font-bold px-6 py-3 rounded-2xl"
          >
            RECARREGAR
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================
// SAFE STRING — guarantees a value is safely renderable (never an object)
// ============================
function safeStr(val: any): string {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  // Objects/arrays must NOT be rendered — extract name/short_name if possible
  if (typeof val === 'object') {
    if (val.name) return String(val.name);
    if (val.short_name) return String(val.short_name);
    return '';
  }
  return String(val);
}

/** Safely get player name from event (handles object, string, null) */
function safePlayerName(player: any): string {
  if (!player) return '';
  if (typeof player === 'string') return player;
  if (typeof player === 'object' && player.name) return String(player.name);
  return '';
}

/** Safely get team short_name from event */
function safeTeamName(team: any): string {
  if (!team) return '';
  if (typeof team === 'string') return team;
  if (typeof team === 'object' && team.short_name) return String(team.short_name);
  return '';
}

// ============================
// HELPERS
// ============================
function vibrate(ms = 50) {
  try { navigator.vibrate?.(ms); } catch {}
}

function formatMinute(min: number): string {
  const m = Math.max(0, min);
  const secs = m % 1;
  return `${Math.floor(m)}'`;
}

function formatTimer(startIso: string, halfEndIso?: string): string {
  const start = new Date(startIso).getTime();
  const end = halfEndIso ? new Date(halfEndIso).getTime() : Date.now();
  const diffSec = Math.max(0, Math.floor((end - start) / 1000));
  const mm = String(Math.floor(diffSec / 60)).padStart(2, '0');
  const ss = String(diffSec % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

const EVENT_ICONS: Record<string, string> = {
  goal: '⚽', goal_penalty: '🎯', penalty_kick: '🎯', own_goal: '↩',
  yellow_card: '🟡', red_card: '🟥', substitution: '🔄',
  match_start: '▶', half1_end: '⏸', half2_start: '▶', match_end: '🏁',
  note: '📋', added_time: '⏱',
};

const EVENT_LABELS: Record<string, string> = {
  goal: 'Gol', goal_penalty: 'Gol (Pênalti)', penalty_kick: 'Pênalti',
  yellow_card: 'Amarelo', red_card: 'Vermelho', substitution: 'Substituição',
  match_start: 'Início', half1_end: 'Intervalo', half2_start: '2º Tempo',
  match_end: 'Fim de Jogo', note: 'Ocorrência', added_time: 'Acréscimos',
};

// ============================
// TEAM LOGO MINI
// ============================
function TeamLogo({ url, name, size = 24 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  const safeName = safeStr(name) || '?';
  if (url && !err) {
    return <img src={photoUrl(url, size * 2)} alt={safeName} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} onError={() => setErr(true)} />;
  }
  return (
    <div className="rounded-full bg-white/10 flex items-center justify-center" style={{ width: size, height: size }}>
      <span className="font-bold text-white/60" style={{ fontSize: size * 0.4 }}>{safeName[0]}</span>
    </div>
  );
}

// ============================
// TOAST
// ============================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'warning'; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-amber-600';
  return (
    <div className={`fixed top-4 left-4 right-4 z-[100] ${bg} text-white rounded-2xl px-4 py-3 text-sm font-bold shadow-xl flex items-center gap-2 animate-in slide-in-from-top-2`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
      {safeStr(message)}
    </div>
  );
}

// ============================
// PLAYER SELECTOR BOTTOM SHEET
// ============================
function PlayerSelector({
  players,
  title,
  teamFilter,
  onSelect,
  onClose,
  excludeIds,
}: {
  players: PlayerInfo[];
  title: string;
  teamFilter?: string;
  onSelect: (p: PlayerInfo) => void;
  onClose: () => void;
  excludeIds?: string[];
}) {
  const [search, setSearch] = useState('');
  const filtered = useMemo(() => {
    let list = players;
    if (teamFilter) list = list.filter(p => p.team_id === teamFilter);
    if (excludeIds?.length) list = list.filter(p => !excludeIds.includes(p.id));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.number && p.number.includes(q))
      );
    }
    return list.sort((a, b) => {
      const na = parseInt(a.number || '999');
      const nb = parseInt(b.number || '999');
      return na - nb;
    });
  }, [players, teamFilter, search, excludeIds]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a0a0a]">
      {/* Handle + header */}
      <div className="pt-3 px-4 pb-2">
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-3" />
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-bold text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar jogador..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
            autoFocus
          />
        </div>
      </div>

      {/* Player list */}
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {filtered.length === 0 && (
          <p className="text-white/30 text-sm text-center mt-8">Nenhum jogador encontrado</p>
        )}
        {filtered.map(p => (
          <button
            key={p.id}
            onClick={() => { vibrate(); onSelect(p); }}
            className="w-full flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5"
          >
            <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-white/80 text-sm font-mono shrink-0">
              {p.number || '?'}
            </span>
            <div className="text-left flex-1 min-w-0">
              <p className="text-white font-semibold text-sm truncate">{p.name}</p>
              <p className="text-white/40 text-xs">{p.position || 'Jogador'}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================
// MAIN SCOUT PAGE COMPONENT
// ============================
// Wrapper export with error boundary
export function ScoutPage() {
  return (
    <ScoutErrorBoundary>
      <ScoutPageInner />
    </ScoutErrorBoundary>
  );
}

function ScoutPageInner() {
  const { token: urlToken } = useParams<{ token: string }>();

  // Auth state
  const [validating, setValidating] = useState(true);
  const [tokenData, setTokenData] = useState<TokenValidation | null>(null);

  // Match state
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [scoutStatus, setScoutStatus] = useState<string>('idle');
  const [scoreHome, setScoreHome] = useState(0);
  const [scoreAway, setScoreAway] = useState(0);

  // Players & lineup
  const [allPlayers, setAllPlayers] = useState<PlayerInfo[]>([]);
  const [lineupState, setLineupState] = useState<Record<string, 'starter' | 'bench'>>({});
  const [lineupConfirmed, setLineupConfirmed] = useState(false);

  // Events
  const [events, setEvents] = useState<LiveEvent[]>([]);

  // UI state
  const [activeSheet, setActiveSheet] = useState<string | null>(null);
  const [sheetStep, setSheetStep] = useState(0);
  const [sheetData, setSheetData] = useState<Record<string, any>>({});
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPlayerSelect, setShowPlayerSelect] = useState<{ title: string; teamFilter?: string; field: string; excludeIds?: string[] } | null>(null);
  const [timerTick, setTimerTick] = useState(0);
  const [lateStartMinutes, setLateStartMinutes] = useState(0);
  const [showLateStart, setShowLateStart] = useState(false);

  // Inline edit state
  const [editingEvent, setEditingEvent] = useState<LiveEvent | null>(null);
  const [editMinute, setEditMinute] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Timer update
  useEffect(() => {
    if (scoutStatus === 'live_half1' || scoutStatus === 'live_half2') {
      const interval = setInterval(() => setTimerTick(t => t + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [scoutStatus]);

  // Poll match state every 12s during live (increased from 10s to reduce race conditions)
  // Also debounced to avoid overlapping polls when multiple scouts are working
  useEffect(() => {
    if (!tokenData?.match_id || !urlToken) return;
    if (!['live_half1', 'live_half2', 'halftime', 'pre_game'].includes(scoutStatus)) return;

    let isPolling = false;

    const poll = async () => {
      if (isPolling) {
        console.log('[Scout] Poll skipped — already in progress');
        return;
      }
      isPolling = true;
      try {
        const state = await getMatchState(tokenData.match_id!, urlToken);
        if (state?.match) {
          setScoutStatus(state.match.scout_status || 'idle');
          setScoreHome(typeof state.match.score_home === 'number' ? state.match.score_home : 0);
          setScoreAway(typeof state.match.score_away === 'number' ? state.match.score_away : 0);
          setMatchInfo(prev => prev ? {
            ...prev,
            scout_status: state.match.scout_status || prev.scout_status,
            scout_started_at: state.match.scout_started_at || prev.scout_started_at,
            scout_half1_end: state.match.scout_half1_end || prev.scout_half1_end,
            scout_half2_start: state.match.scout_half2_start || prev.scout_half2_start,
            scout_ended_at: state.match.scout_ended_at || prev.scout_ended_at,
            score_home: typeof state.match.score_home === 'number' ? state.match.score_home : prev.score_home,
            score_away: typeof state.match.score_away === 'number' ? state.match.score_away : prev.score_away,
          } : prev);
        }
      } catch (e) {
        console.error('[Scout] poll error:', e);
      } finally {
        isPolling = false;
      }
    };

    const interval = setInterval(poll, 12000); // 12s interval to reduce race conditions
    return () => clearInterval(interval);
  }, [tokenData?.match_id, urlToken, scoutStatus]);

  // ---- VALIDATE TOKEN ----
  useEffect(() => {
    if (!urlToken) return;
    (async () => {
      setValidating(true);
      try {
        const result = await validateScoutToken(urlToken);
        console.log('[Scout] validateToken result:', JSON.stringify(result).slice(0, 500));
        setTokenData(result);
        if (result.valid && result.match_info) {
          // Sanitize match_info to ensure home_team/away_team are objects (not arrays)
          const mi = result.match_info;
          // NUCLEAR sanitization — do NOT spread ...mi (could contain unexpected object fields)
          const sanitizedInfo: MatchInfo = {
            id: String(mi.id || ''),
            match_date: String(mi.match_date || ''),
            status: String(mi.status || ''),
            competition_id: String(mi.competition_id || ''),
            score_home: typeof mi.score_home === 'number' ? mi.score_home : undefined,
            score_away: typeof mi.score_away === 'number' ? mi.score_away : undefined,
            scout_started_at: mi.scout_started_at ? String(mi.scout_started_at) : undefined,
            scout_half1_end: mi.scout_half1_end ? String(mi.scout_half1_end) : undefined,
            scout_half2_start: mi.scout_half2_start ? String(mi.scout_half2_start) : undefined,
            scout_ended_at: mi.scout_ended_at ? String(mi.scout_ended_at) : undefined,
            round: typeof mi.round === 'number' ? mi.round : (Number(mi.round) || 0),
            venue: typeof mi.venue === 'string' ? mi.venue : '',
            scout_status: typeof mi.scout_status === 'string' ? mi.scout_status : 'idle',
            home_team: (() => {
              const t = Array.isArray(mi.home_team) ? mi.home_team[0] : mi.home_team;
              if (!t || typeof t !== 'object') return { id: '', name: 'Casa', short_name: 'Casa' };
              return { id: String(t.id || ''), name: String(t.name || ''), short_name: String(t.short_name || ''), color: t.color ? String(t.color) : undefined, text_color: t.text_color ? String(t.text_color) : undefined, logo_url: t.logo_url ? String(t.logo_url) : undefined };
            })(),
            away_team: (() => {
              const t = Array.isArray(mi.away_team) ? mi.away_team[0] : mi.away_team;
              if (!t || typeof t !== 'object') return { id: '', name: 'Fora', short_name: 'Fora' };
              return { id: String(t.id || ''), name: String(t.name || ''), short_name: String(t.short_name || ''), color: t.color ? String(t.color) : undefined, text_color: t.text_color ? String(t.text_color) : undefined, logo_url: t.logo_url ? String(t.logo_url) : undefined };
            })(),
          };
          console.log('[Scout] sanitizedInfo teams:', sanitizedInfo.home_team?.short_name, 'vs', sanitizedInfo.away_team?.short_name);
          setMatchInfo(sanitizedInfo);
          setScoutStatus(sanitizedInfo.scout_status || 'idle');
          setScoreHome(typeof mi.score_home === 'number' ? mi.score_home : 0);
          setScoreAway(typeof mi.score_away === 'number' ? mi.score_away : 0);
        }
      } catch (e) {
        console.error('[Scout] validateToken catch:', e);
        setTokenData({ valid: false, error: 'Erro ao validar token' });
      }
      setValidating(false);
    })();
  }, [urlToken]);

  // ---- LOAD PLAYERS ----
  useEffect(() => {
    if (!tokenData?.valid || !tokenData.match_id || !urlToken) return;
    (async () => {
      try {
        const res = await getMatchPlayers(tokenData.match_id!, urlToken);
        setAllPlayers(res.players || []);

        // Load saved lineup
        const saved = await getSavedLineup(tokenData.match_id!, urlToken);
        if (saved.lineup && saved.lineup.length > 0) {
          const state: Record<string, 'starter' | 'bench'> = {};
          for (const l of saved.lineup) {
            state[l.player_id] = l.started ? 'starter' : 'bench';
          }
          setLineupState(state);
          setLineupConfirmed(true);
        }
      } catch (e) {
        console.error('[Scout] Load players error:', e);
      }
    })();
  }, [tokenData?.valid, tokenData?.match_id, urlToken]);

  // ---- LOAD EVENTS ----
  const loadEvents = useCallback(async () => {
    if (!tokenData?.match_id || !urlToken) return;
    try {
      const res = await getEvents(tokenData.match_id!, urlToken);
      // Server now returns explicit columns (no SELECT *), so data is clean.
      // Lightweight guard: ensure JOINs are objects (not arrays from edge-case FKs)
      const sanitized = (res.events || []).map((evt: any) => {
        const clean: any = { ...evt };
        if (Array.isArray(clean.player)) clean.player = clean.player[0] || null;
        if (Array.isArray(clean.player_out)) clean.player_out = clean.player_out[0] || null;
        if (Array.isArray(clean.player_in)) clean.player_in = clean.player_in[0] || null;
        if (Array.isArray(clean.team)) clean.team = clean.team[0] || null;
        return clean;
      }) as LiveEvent[];
      setEvents(sanitized);
    } catch (e) {
      console.error('[Scout] loadEvents error:', e);
    }
  }, [tokenData?.match_id, urlToken]);

  useEffect(() => {
    if (['live_half1', 'live_half2', 'halftime', 'ended'].includes(scoutStatus)) {
      loadEvents();
      // Auto-reload events every 15s during live/halftime/ended to sync between scouts
      const interval = setInterval(() => {
        if (['live_half1', 'live_half2', 'halftime', 'ended'].includes(scoutStatus)) {
          loadEvents();
        }
      }, 15000); // 15s to balance freshness vs server load
      return () => clearInterval(interval);
    }
  }, [scoutStatus, loadEvents]);

  // ---- HELPERS ----
  const homeTeam = matchInfo?.home_team;
  const awayTeam = matchInfo?.away_team;
  const myTeamId = tokenData?.team_id;
  const myTeamName = safeStr(tokenData?.label) || 'Olheiro';

  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    setToast({ message, type });
  };

  const getCurrentTimer = (): string => {
    if (!matchInfo?.scout_started_at) return '00:00';
    if (scoutStatus === 'live_half1') return formatTimer(matchInfo.scout_started_at);
    if (scoutStatus === 'halftime') return formatTimer(matchInfo.scout_started_at, matchInfo.scout_half1_end);
    if (scoutStatus === 'live_half2' && matchInfo.scout_half2_start) return formatTimer(matchInfo.scout_half2_start);
    if (scoutStatus === 'ended' && matchInfo.scout_half2_start) return formatTimer(matchInfo.scout_half2_start, matchInfo.scout_ended_at);
    return '00:00';
  };

  const getHalfLabel = (): string => {
    if (scoutStatus === 'live_half1') return '1º TEMPO';
    if (scoutStatus === 'halftime') return 'INTERVALO';
    if (scoutStatus === 'live_half2') return '2º TEMPO';
    if (scoutStatus === 'ended') return 'FIM DE JOGO';
    return 'PRÉ-JOGO';
  };

  // ---- EVENT HANDLERS ----
  const handlePostEvent = async (data: Record<string, any>) => {
    if (!urlToken) return;
    setSaving(true);
    try {
      console.log('[Scout] postEvent:', data.type, data);
      const res = await postEvent(urlToken, data as any);
      console.log('[Scout] postEvent response:', JSON.stringify(res));
      if (res.success) {
        vibrate(100);
        const label = EVENT_LABELS[data.type] || data.type;
        const playerName = data._playerName || '';
        showToast(`✓ ${label}${playerName ? ` — ${playerName}` : ''} registrado`, 'success');

        if (res.second_yellow) {
          setTimeout(() => showToast('⚠️ Segundo amarelo — expulsão automática', 'warning'), 1500);
        }

        // Refresh events and match state
        try { loadEvents(); } catch (le) { console.error('[Scout] loadEvents error after postEvent:', le); }
        if (tokenData?.match_id) {
          try {
            const state = await getMatchState(tokenData.match_id!, urlToken);
            if (state?.match) {
              setScoutStatus(state.match.scout_status || scoutStatus);
              setScoreHome(typeof state.match.score_home === 'number' ? state.match.score_home : scoreHome);
              setScoreAway(typeof state.match.score_away === 'number' ? state.match.score_away : scoreAway);
              setMatchInfo(prev => prev ? {
                ...prev,
                scout_status: state.match.scout_status || prev.scout_status,
                scout_started_at: state.match.scout_started_at || prev.scout_started_at,
                scout_half1_end: state.match.scout_half1_end || prev.scout_half1_end,
                scout_half2_start: state.match.scout_half2_start || prev.scout_half2_start,
                scout_ended_at: state.match.scout_ended_at || prev.scout_ended_at,
              } : prev);
            }
          } catch (stateErr) {
            console.error('[Scout] getMatchState error after postEvent:', stateErr);
          }
        }
      } else {
        showToast(safeStr(res.error) || 'Erro ao salvar', 'error');
      }
    } catch (e: any) {
      console.error('[Scout] postEvent catch:', e);
      showToast('Erro de conexão', 'error');
    }
    setSaving(false);
    setActiveSheet(null);
    setSheetStep(0);
    setSheetData({});
  };

  const handleSaveLineup = async () => {
    if (!urlToken) return;
    setSaving(true);
    try {
      const players = Object.entries(lineupState).map(([playerId, status]) => {
        const p = allPlayers.find(pl => pl.id === playerId);
        return { player_id: playerId, team_id: p?.team_id || '', started: status === 'starter' };
      });
      const res = await saveLineup(urlToken, players);
      if (res.success) {
        vibrate(100);
        showToast('✓ Escalação confirmada', 'success');
        setLineupConfirmed(true);
      } else {
        showToast(safeStr(res.error) || 'Erro ao salvar escalação', 'error');
      }
    } catch {
      showToast('Erro de conexão', 'error');
    }
    setSaving(false);
  };

  const handleMatchControl = async (type: string) => {
    if (!urlToken) return;
    setSaving(true);
    try {
      const payload: any = { type };
      // Support late arrival with time offset
      if (type === 'match_start' && lateStartMinutes > 0) {
        payload.started_minutes_ago = lateStartMinutes;
      }
      console.log('[Scout] matchControl:', type, payload);
      const res = await postEvent(urlToken, payload);
      console.log('[Scout] matchControl response:', JSON.stringify(res));
      if (res.success) {
        vibrate(200);
        showToast(`✓ ${EVENT_LABELS[type] || type}`, 'success');

        if (tokenData?.match_id) {
          try {
            const state = await getMatchState(tokenData.match_id!, urlToken);
            console.log('[Scout] matchState after control:', JSON.stringify(state));
            if (state?.match) {
              const newStatus = state.match.scout_status || scoutStatus;
              setScoutStatus(newStatus);
              setMatchInfo(prev => prev ? {
                ...prev,
                scout_status: newStatus,
                scout_started_at: state.match.scout_started_at || prev.scout_started_at,
                scout_half1_end: state.match.scout_half1_end || prev.scout_half1_end,
                scout_half2_start: state.match.scout_half2_start || prev.scout_half2_start,
                scout_ended_at: state.match.scout_ended_at || prev.scout_ended_at,
                score_home: typeof state.match.score_home === 'number' ? state.match.score_home : prev.score_home,
                score_away: typeof state.match.score_away === 'number' ? state.match.score_away : prev.score_away,
              } : prev);
            }
          } catch (stateErr) {
            console.error('[Scout] getMatchState error after matchControl:', stateErr);
            // Still update status optimistically based on control type
            const optimisticStatus: Record<string, string> = {
              match_start: 'live_half1',
              half1_end: 'halftime',
              half2_start: 'live_half2',
              match_end: 'ended',
            };
            if (optimisticStatus[type]) {
              setScoutStatus(optimisticStatus[type]);
            }
          }
        }
        try { loadEvents(); } catch (le) { console.error('[Scout] loadEvents error after matchControl:', le); }
      } else {
        showToast(safeStr(res.error) || 'Erro', 'error');
      }
    } catch (e: any) {
      console.error('[Scout] matchControl catch:', e);
      showToast('Erro de conexão', 'error');
    }
    setSaving(false);
  };

  // ===============================================
  // RENDER — VALIDATING
  // ===============================================
  if (validating) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-6">
        <Loader2 className="w-8 h-8 animate-spin text-green-500 mb-4" />
        <p className="text-white/50 text-sm">Validando acesso...</p>
      </div>
    );
  }

  // ===============================================
  // RENDER — INVALID TOKEN
  // ===============================================
  if (!tokenData?.valid) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <X className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-xl font-bold mb-2">Link inválido ou expirado</h1>
        <p className="text-white/50 text-sm text-center">
          Entre em contato com o organizador para obter um novo link de acesso.
        </p>
      </div>
    );
  }

  // ===============================================
  // RENDER — WELCOME / ENTRY
  // ===============================================
  if (scoutStatus === 'idle' && !lineupConfirmed) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-6">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
          <Shield className="w-7 h-7 text-green-500" />
        </div>

        <h1 className="text-2xl font-bold text-center mb-2" style={{ fontFamily: 'system-ui' }}>
          {safeStr(homeTeam?.short_name)} × {safeStr(awayTeam?.short_name)}
        </h1>

        <p className="text-white/50 text-sm mb-1">
          Rodada {safeStr(matchInfo?.round)} · {matchInfo?.match_date ? new Date(matchInfo.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : ''}
        </p>
        {matchInfo?.venue && (
          <p className="text-white/40 text-xs mb-6">{safeStr(matchInfo.venue)}</p>
        )}

        <div className="bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 mb-8">
          <span className="text-green-400 text-sm font-bold">Olheiro — {safeStr(myTeamName)}</span>
        </div>

        <p className="text-white/30 text-xs text-center mb-8 max-w-xs">
          Se lançar algo errado, pode editar depois. Sem stress.
        </p>

        <button
          onClick={() => { setScoutStatus('pre_game'); setLineupConfirmed(true); }}
          className="w-full max-w-xs bg-green-500 text-black font-bold text-lg py-4 rounded-2xl active:scale-95 transition-transform"
        >
          ENTRAR
        </button>

        {allPlayers.length > 0 && (
          <button
            onClick={() => setScoutStatus('pre_game')}
            className="mt-4 text-white/40 text-xs underline"
          >
            Montar escalação antes
          </button>
        )}
      </div>
    );
  }

  // ===============================================
  // RENDER — PRE-GAME (Lineup — optional, accessed from welcome)
  // ===============================================
  if ((scoutStatus === 'idle' || scoutStatus === 'pre_game') && !lineupConfirmed) {
    const homePlayers = allPlayers.filter(p => p.team_id === homeTeam?.id);
    const awayPlayers = allPlayers.filter(p => p.team_id === awayTeam?.id);

    const homeStarters = homePlayers.filter(p => lineupState[p.id] === 'starter').length;
    const awayStarters = awayPlayers.filter(p => lineupState[p.id] === 'starter').length;

    const togglePlayer = (playerId: string) => {
      setLineupState(prev => {
        const current = prev[playerId];
        if (!current || current === 'bench') return { ...prev, [playerId]: 'starter' };
        return { ...prev, [playerId]: 'bench' };
      });
    };

    const renderTeamSection = (teamPlayers: PlayerInfo[], team: any, starterCount: number) => (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <TeamLogo url={team?.logo_url} name={safeStr(team?.short_name) || '?'} size={28} />
          <div>
            <h3 className="text-white font-bold text-sm">{safeStr(team?.name) || 'Time'}</h3>
            <p className={`text-xs font-bold ${starterCount === 7 ? 'text-green-400' : starterCount > 7 ? 'text-red-400' : 'text-amber-400'}`}>
              {starterCount} titulares
            </p>
          </div>
        </div>

        {teamPlayers.map(p => {
          const isStarter = lineupState[p.id] === 'starter';
          return (
            <button
              key={p.id}
              onClick={() => togglePlayer(p.id)}
              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl mb-1 transition-colors ${
                isStarter ? 'bg-green-500/15 border border-green-500/30' : 'bg-white/3 border border-white/5'
              }`}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm font-mono shrink-0 ${
                isStarter ? 'bg-green-500 text-black' : 'bg-white/10 text-white/60'
              }`}>
                {p.number || '?'}
              </span>
              <div className="text-left flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                <p className="text-white/40 text-xs">{p.position || 'Jogador'}</p>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                isStarter ? 'bg-green-500 text-black' : 'bg-white/10 text-white/40'
              }`}>
                {isStarter ? 'T' : 'R'}
              </span>
            </button>
          );
        })}
      </div>
    );

    return (
      <div className="min-h-dvh bg-[#0a0a0a] text-white flex flex-col">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        {/* Header */}
        <div className="sticky top-0 bg-[#0a0a0a]/95 backdrop-blur border-b border-white/5 px-4 py-3 z-20">
          <div className="flex items-center gap-2">
            <button onClick={() => setScoutStatus('idle')} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex-1 text-center">
              <p className="text-white font-bold text-sm">{safeStr(homeTeam?.short_name)} × {safeStr(awayTeam?.short_name)}</p>
              <p className="text-white/40 text-xs">Pré-jogo · Escalação</p>
            </div>
            <div className="w-8" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="bg-white/5 rounded-2xl p-4 mb-4">
            <p className="text-white/60 text-xs mb-1">INSTRUÇÕES</p>
            <p className="text-white/80 text-sm">
              Toque nos jogadores para marcar como <span className="text-green-400 font-bold">Titular</span> ou Reserva.
              Society = 7 titulares.
            </p>
          </div>

          {renderTeamSection(homePlayers, homeTeam, homeStarters)}
          {renderTeamSection(awayPlayers, awayTeam, awayStarters)}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-[#0a0a0a] border-t border-white/5 px-4 py-4 space-y-2">
          <button
            onClick={handleSaveLineup}
            disabled={saving}
            className="w-full bg-green-500 text-black font-bold text-base py-4 rounded-2xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
            CONFIRMAR ESCALAÇÃO →
          </button>
          <button
            onClick={() => setLineupConfirmed(true)}
            className="w-full text-white/30 text-xs py-2 underline"
          >
            Pular — lançar sem escalação
          </button>
        </div>
      </div>
    );
  }

  // ===============================================
  // RENDER — WAITING FOR KICKOFF
  // ===============================================
  if ((scoutStatus === 'pre_game' || scoutStatus === 'idle') && lineupConfirmed) {
    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center text-white px-6">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Aguardando apito inicial</p>

        <h1 className="text-2xl font-bold text-center mb-1">
          {safeStr(homeTeam?.short_name)} × {safeStr(awayTeam?.short_name)}
        </h1>
        <p className="text-white/40 text-sm mb-8">Rodada {safeStr(matchInfo?.round)}</p>

        <div className="text-5xl font-bold font-mono text-white/30 mb-8">
          {showLateStart && lateStartMinutes > 0
            ? `${String(lateStartMinutes).padStart(2, '0')}:00`
            : '00:00'
          }
        </div>

        {!showLateStart && (
          <button
            onClick={() => handleMatchControl('match_start')}
            disabled={saving}
            className="w-full max-w-xs bg-green-500 text-black font-bold text-lg py-5 rounded-2xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
            INICIAR PARTIDA
          </button>
        )}

        <p className="text-white/30 text-xs mt-4 text-center">
          Toque quando o árbitro apitar o início
        </p>

        {/* Late arrival option */}
        {!showLateStart ? (
          <button
            onClick={() => setShowLateStart(true)}
            className="mt-6 text-amber-400/70 text-xs font-bold underline"
          >
            ⏱ Cheguei atrasado — setar tempo
          </button>
        ) : (
          <div className="mt-6 w-full max-w-xs bg-white/5 border border-amber-500/30 rounded-2xl p-4">
            <p className="text-amber-400 text-xs font-bold mb-3 text-center">Quantos minutos já passaram?</p>
            <div className="flex items-center justify-center gap-4 mb-3">
              <button
                onClick={() => setLateStartMinutes(Math.max(0, lateStartMinutes - 5))}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
              >
                <Minus className="w-5 h-5 text-white" />
              </button>
              <span className="text-3xl font-bold font-mono text-amber-400 w-16 text-center">{lateStartMinutes}</span>
              <button
                onClick={() => setLateStartMinutes(lateStartMinutes + 5)}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
            <p className="text-white/30 text-[10px] text-center mb-3">
              O relógio vai iniciar como se a partida tivesse começado há {lateStartMinutes} min
            </p>
            <button
              onClick={() => handleMatchControl('match_start')}
              disabled={saving || lateStartMinutes <= 0}
              className="w-full bg-amber-500 text-black font-bold text-sm py-3 rounded-xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              INICIAR EM {lateStartMinutes}'
            </button>
            <button
              onClick={() => { setShowLateStart(false); setLateStartMinutes(0); }}
              className="w-full mt-2 text-white/30 text-xs underline text-center"
            >
              Cancelar
            </button>
          </div>
        )}

        <button
          onClick={() => { setLineupConfirmed(false); setScoutStatus('pre_game'); }}
          className="mt-4 text-white/30 text-xs underline"
        >
          Editar escalação
        </button>
      </div>
    );
  }

  // ===============================================
  // RENDER — HALFTIME
  // ===============================================
  if (scoutStatus === 'halftime') {
    const half1Events = events.filter(e => (e.half || 1) === 1 && !['match_start', 'half1_end'].includes(e.type));

    return (
      <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center text-white px-6 py-8">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <p className="text-amber-400 text-xs uppercase tracking-widest font-bold mb-4">Intervalo</p>
        <p className="text-white/40 text-xs mb-4">1º Tempo encerrado</p>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex flex-col items-center">
            <TeamLogo url={homeTeam?.logo_url} name={safeStr(homeTeam?.short_name) || '?'} size={40} />
            <span className="text-xs text-white/60 mt-1">{safeStr(homeTeam?.short_name)}</span>
          </div>
          <div className="text-4xl font-bold font-mono">
            <span>{String(scoreHome ?? 0)}</span>
            <span className="text-white/30 mx-2">×</span>
            <span>{String(scoreAway ?? 0)}</span>
          </div>
          <div className="flex flex-col items-center">
            <TeamLogo url={awayTeam?.logo_url} name={safeStr(awayTeam?.short_name) || '?'} size={40} />
            <span className="text-xs text-white/60 mt-1">{safeStr(awayTeam?.short_name)}</span>
          </div>
        </div>

        {/* 1st half summary */}
        {half1Events.length > 0 && (
          <div className="w-full max-w-sm bg-white/5 rounded-2xl p-4 mb-6">
            <p className="text-white/40 text-xs uppercase mb-2">Resumo do 1º tempo</p>
            {half1Events.map(evt => (
              <div key={evt.id} className="flex items-center gap-2 py-1.5 text-sm">
                <span className="text-white/30 font-mono text-xs w-6">{String(evt.match_minute || 0)}'</span>
                <span>{safeStr(EVENT_ICONS[evt.type]) || '•'}</span>
                <span className="text-white/80">
                  {safeStr(EVENT_LABELS[evt.type] || evt.type)}
                  {safePlayerName(evt.player) ? ` — ${safePlayerName(evt.player)}` : ''}
                </span>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => handleMatchControl('half2_start')}
          disabled={saving}
          className="w-full max-w-xs bg-green-500 text-black font-bold text-lg py-5 rounded-2xl active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
          INICIAR 2º TEMPO
        </button>
      </div>
    );
  }

  // ===============================================
  // RENDER — ENDED
  // ===============================================
  if (scoutStatus === 'ended' || scoutStatus === 'published') {
    const allEvents = events.filter(e => !['match_start', 'half1_end', 'half2_start', 'match_end'].includes(e.type));

    return (
      <div className="min-h-dvh bg-[#0a0a0a] text-white flex flex-col">
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}

        <div className="flex flex-col items-center pt-8 px-6">
          <p className={`text-xs uppercase tracking-widest font-bold mb-4 ${scoutStatus === 'published' ? 'text-green-400' : 'text-white/40'}`}>
            {scoutStatus === 'published' ? '✓ Publicado' : 'Fim de Jogo'}
          </p>

          <div className="flex items-center gap-4 mb-4">
            <div className="flex flex-col items-center">
              <TeamLogo url={homeTeam?.logo_url} name={safeStr(homeTeam?.short_name) || '?'} size={40} />
              <span className="text-xs text-white/60 mt-1">{safeStr(homeTeam?.short_name)}</span>
            </div>
            <div className="text-4xl font-bold font-mono">
              <span>{String(scoreHome ?? 0)}</span>
              <span className="text-white/30 mx-2">×</span>
              <span>{String(scoreAway ?? 0)}</span>
            </div>
            <div className="flex flex-col items-center">
              <TeamLogo url={awayTeam?.logo_url} name={safeStr(awayTeam?.short_name) || '?'} size={40} />
              <span className="text-xs text-white/60 mt-1">{safeStr(awayTeam?.short_name)}</span>
            </div>
          </div>

          <p className="text-white/30 text-xs mb-4">
            {String(events.length)} eventos lançados
          </p>
        </div>

        {/* Events list — tap to edit */}
        <div className="flex-1 overflow-y-auto px-4 pb-8">
          <div className="bg-white/5 rounded-2xl divide-y divide-white/5">
            {allEvents.map(evt => (
              <button
                key={evt.id}
                onClick={() => { setEditingEvent(evt); setEditMinute(String(evt.match_minute || 0)); }}
                className="w-full flex items-center gap-3 px-4 py-3 text-left active:bg-white/5 transition-colors"
              >
                <span className="text-white/30 font-mono text-xs w-8 text-right">{String(evt.match_minute || 0)}'{(evt.half || 1) === 2 ? ' 2T' : ''}</span>
                <span className="text-lg">{safeStr(EVENT_ICONS[evt.type]) || '•'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm truncate">
                    {safeStr(EVENT_LABELS[evt.type] || evt.type)}
                    {safePlayerName(evt.player) ? ` — ${safePlayerName(evt.player)}` : ''}
                    {safeTeamName(evt.team) ? ` (${safeTeamName(evt.team)})` : ''}
                  </p>
                  {evt.note && <p className="text-white/40 text-xs truncate">{safeStr(evt.note)}</p>}
                </div>
                <Edit3 className="w-3.5 h-3.5 text-white/20 shrink-0" />
              </button>
            ))}
          </div>

          <p className="text-white/20 text-[10px] text-center mt-2">Toque em um evento para editar ou excluir</p>

          {scoutStatus !== 'published' && (
            <div className="mt-6 text-center">
              <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-green-400 font-bold text-sm mb-1">Relatório enviado!</p>
                <p className="text-white/40 text-xs">
                  Os dados serão revisados pelo organizador. Você pode continuar editando por 24 horas.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Inline Edit Modal */}
        {editingEvent && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => setEditingEvent(null)}>
            <div className="w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-white font-bold text-sm">Editar Evento</h3>
                <button onClick={() => setEditingEvent(null)} className="text-white/40"><X className="w-5 h-5" /></button>
              </div>

              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/70 text-sm">
                  {safeStr(EVENT_ICONS[editingEvent.type])} {safeStr(EVENT_LABELS[editingEvent.type] || editingEvent.type)}
                  {safePlayerName(editingEvent.player) ? ` — ${safePlayerName(editingEvent.player)}` : ''}
                </p>
                <p className="text-white/40 text-xs mt-1">
                  {safeTeamName(editingEvent.team) || ''} · {(editingEvent.half || 1) === 2 ? '2º tempo' : '1º tempo'}
                </p>
              </div>

              {/* Edit minute */}
              <div>
                <label className="text-white/50 text-xs mb-1 block">Minuto</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={editMinute}
                  onChange={e => setEditMinute(e.target.value)}
                  className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-lg font-mono text-center border border-white/10 focus:border-green-500 outline-none"
                />
              </div>

              {/* Save / Delete buttons */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!urlToken) return;
                    setEditSaving(true);
                    try {
                      const newMin = parseInt(editMinute);
                      if (!isNaN(newMin) && newMin !== editingEvent.match_minute) {
                        await editEvent(editingEvent.id, urlToken, { match_minute: newMin }, 'Correção de minuto pelo olheiro');
                        setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, match_minute: newMin } : e));
                        showToast('Minuto atualizado', 'success');
                      }
                      setEditingEvent(null);
                    } catch (e: any) {
                      showToast('Erro: ' + e.message, 'error');
                    }
                    setEditSaving(false);
                  }}
                  disabled={editSaving}
                  className="flex-1 bg-green-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  SALVAR
                </button>
                <button
                  onClick={async () => {
                    if (!urlToken) return;
                    if (!confirm('Excluir este evento?')) return;
                    setEditSaving(true);
                    try {
                      await deleteEvent(editingEvent.id, urlToken, 'Excluído pelo olheiro');
                      setEvents(prev => prev.filter(e => e.id !== editingEvent.id));
                      showToast('Evento excluído', 'warning');
                      setEditingEvent(null);
                    } catch (e: any) {
                      showToast('Erro: ' + e.message, 'error');
                    }
                    setEditSaving(false);
                  }}
                  disabled={editSaving}
                  className="bg-red-500/20 text-red-400 font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===============================================
  // RENDER — LIVE MATCH (main screen)
  // ===============================================
  const currentTimer = getCurrentTimer();
  const halfLabel = getHalfLabel();

  // Bottom sheet rendering
  const renderBottomSheet = () => {
    if (!activeSheet) return null;

    const closeSheet = () => {
      setActiveSheet(null);
      setSheetStep(0);
      setSheetData({});
      setShowPlayerSelect(null);
    };

    // ---- GOL SHEET ----
    if (activeSheet === 'goal') {
      if (sheetStep === 0) {
        // Step 1: Which team scored?
        return (
          <SheetWrapper title="⚽ GOL — Qual time marcou?" onClose={closeSheet}>
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              {[homeTeam, awayTeam].map(team => team && (
                <button
                  key={team.id}
                  onClick={() => { setSheetData({ ...sheetData, team_id: team.id, teamName: team.short_name }); setSheetStep(1); }}
                  className="flex flex-col items-center gap-2 py-6 rounded-2xl bg-white/5 active:bg-white/10 border border-white/10"
                >
                  <TeamLogo url={team.logo_url} name={team.short_name} size={40} />
                  <span className="text-white font-bold text-sm">{team.short_name}</span>
                </button>
              ))}
            </div>
          </SheetWrapper>
        );
      }
      if (sheetStep === 1) {
        // Step 2: Who scored? -> player selector
        return (
          <PlayerSelector
            players={allPlayers}
            title={`Quem marcou? (${sheetData.teamName})`}
            teamFilter={sheetData.team_id}
            onSelect={p => { setSheetData({ ...sheetData, player_id: p.id, _playerName: p.name }); setSheetStep(2); setShowPlayerSelect(null); }}
            onClose={() => setSheetStep(0)}
          />
        );
      }
      if (sheetStep === 2) {
        // Step 3: Goal type
        return (
          <SheetWrapper title="Tipo de gol" onClose={closeSheet}>
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              {[
                { label: '⚽ Normal', detail: 'normal' },
                { label: '🎯 Falta direta', detail: 'free_kick' },
                { label: '↩ Gol contra', detail: 'own_goal' },
              ].map(opt => (
                <button
                  key={opt.detail}
                  onClick={() => {
                    const finalTeamId = opt.detail === 'own_goal'
                      ? (sheetData.team_id === homeTeam?.id ? awayTeam?.id : homeTeam?.id)
                      : sheetData.team_id;
                    handlePostEvent({
                      type: 'goal',
                      team_id: finalTeamId,
                      player_id: sheetData.player_id,
                      detail: opt.detail,
                      _playerName: sheetData._playerName,
                    });
                  }}
                  className="py-5 rounded-2xl bg-white/5 active:bg-white/10 border border-white/10 text-white font-bold text-sm"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SheetWrapper>
        );
      }
    }

    // ---- PENALTY SHEET ----
    if (activeSheet === 'penalty') {
      if (sheetStep === 0) {
        return (
          <SheetWrapper title="🎯 PÊNALTI — Qual time cobra?" onClose={closeSheet}>
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              {[homeTeam, awayTeam].map(team => team && (
                <button
                  key={team.id}
                  onClick={() => { setSheetData({ ...sheetData, team_id: team.id, teamName: team.short_name }); setSheetStep(1); }}
                  className="flex flex-col items-center gap-2 py-6 rounded-2xl bg-white/5 active:bg-white/10 border border-white/10"
                >
                  <TeamLogo url={team.logo_url} name={team.short_name} size={40} />
                  <span className="text-white font-bold text-sm">{team.short_name}</span>
                </button>
              ))}
            </div>
          </SheetWrapper>
        );
      }
      if (sheetStep === 1) {
        return (
          <PlayerSelector
            players={allPlayers}
            title={`Quem vai bater? (${sheetData.teamName})`}
            teamFilter={sheetData.team_id}
            onSelect={p => { setSheetData({ ...sheetData, player_id: p.id, _playerName: p.name }); setSheetStep(2); }}
            onClose={() => setSheetStep(0)}
          />
        );
      }
      if (sheetStep === 2) {
        return (
          <SheetWrapper title="Resultado do pênalti" onClose={closeSheet}>
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              {[
                { label: '✅ Convertido', detail: 'scored' },
                { label: '🧤 Defendido', detail: 'saved' },
                { label: '❌ Fora', detail: 'missed' },
                { label: '🏳️ Na trave', detail: 'post' },
              ].map(opt => (
                <button
                  key={opt.detail}
                  onClick={() => {
                    handlePostEvent({
                      type: 'penalty_kick',
                      team_id: sheetData.team_id,
                      player_id: sheetData.player_id,
                      detail: opt.detail,
                      _playerName: sheetData._playerName,
                    });
                  }}
                  className="py-5 rounded-2xl bg-white/5 active:bg-white/10 border border-white/10 text-white font-bold text-sm"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </SheetWrapper>
        );
      }
    }

    // ---- YELLOW CARD SHEET ----
    if (activeSheet === 'yellow') {
      if (sheetStep === 0) {
        return (
          <SheetWrapper title="🟡 AMARELO — Qual time?" onClose={closeSheet}>
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              {[homeTeam, awayTeam].map(team => team && (
                <button
                  key={team.id}
                  onClick={() => { setSheetData({ ...sheetData, team_id: team.id, teamName: team.short_name }); setSheetStep(1); }}
                  className="flex flex-col items-center gap-2 py-6 rounded-2xl bg-white/5 active:bg-white/10 border border-white/10"
                >
                  <TeamLogo url={team.logo_url} name={team.short_name} size={40} />
                  <span className="text-white font-bold text-sm">{team.short_name}</span>
                </button>
              ))}
            </div>
          </SheetWrapper>
        );
      }
      if (sheetStep === 1) {
        return (
          <PlayerSelector
            players={allPlayers}
            title={`Quem levou? (${sheetData.teamName})`}
            teamFilter={sheetData.team_id}
            onSelect={p => {
              // Check if player already has a yellow in this match
              const hasYellow = events.some(e => e.player_id === p.id && e.type === 'yellow_card');
              if (hasYellow) {
                setSheetData({ ...sheetData, player_id: p.id, _playerName: p.name, secondYellow: true });
                setSheetStep(2);
              } else {
                handlePostEvent({
                  type: 'yellow_card',
                  team_id: sheetData.team_id,
                  player_id: p.id,
                  _playerName: p.name,
                });
              }
            }}
            onClose={() => setSheetStep(0)}
          />
        );
      }
      if (sheetStep === 2 && sheetData.secondYellow) {
        return (
          <SheetWrapper title="⚠️ SEGUNDO AMARELO" onClose={closeSheet}>
            <div className="px-4 pb-8">
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
                <p className="text-amber-400 font-bold text-sm mb-1">
                  {sheetData._playerName} já recebeu um amarelo nesta partida.
                </p>
                <p className="text-white/50 text-xs">
                  Confirmar gera expulsão automática (2º amarelo + vermelho).
                </p>
              </div>
              <button
                onClick={() => {
                  handlePostEvent({
                    type: 'yellow_card',
                    team_id: sheetData.team_id,
                    player_id: sheetData.player_id,
                    detail: 'second_yellow',
                    _playerName: sheetData._playerName,
                  });
                }}
                className="w-full bg-red-500 text-white font-bold text-base py-4 rounded-2xl active:scale-95 transition-transform"
              >
                CONFIRMAR — 2º AMARELO + VERMELHO
              </button>
            </div>
          </SheetWrapper>
        );
      }
    }

    // ---- RED CARD SHEET ----
    if (activeSheet === 'red') {
      if (sheetStep === 0) {
        return (
          <SheetWrapper title="🟥 VERMELHO — Qual time?" onClose={closeSheet}>
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              {[homeTeam, awayTeam].map(team => team && (
                <button
                  key={team.id}
                  onClick={() => { setSheetData({ ...sheetData, team_id: team.id, teamName: team.short_name }); setSheetStep(1); }}
                  className="flex flex-col items-center gap-2 py-6 rounded-2xl bg-white/5 active:bg-white/10 border border-white/10"
                >
                  <TeamLogo url={team.logo_url} name={team.short_name} size={40} />
                  <span className="text-white font-bold text-sm">{team.short_name}</span>
                </button>
              ))}
            </div>
          </SheetWrapper>
        );
      }
      if (sheetStep === 1) {
        return (
          <PlayerSelector
            players={allPlayers}
            title={`Quem foi expulso? (${sheetData.teamName})`}
            teamFilter={sheetData.team_id}
            onSelect={p => {
              handlePostEvent({
                type: 'red_card',
                team_id: sheetData.team_id,
                player_id: p.id,
                detail: 'direct',
                _playerName: p.name,
              });
            }}
            onClose={() => setSheetStep(0)}
          />
        );
      }
    }

    // ---- SUBSTITUTION SHEET ----
    if (activeSheet === 'sub') {
      if (sheetStep === 0) {
        return (
          <SheetWrapper title="🔄 SUBSTITUIÇÃO — Qual time?" onClose={closeSheet}>
            <div className="grid grid-cols-2 gap-3 px-4 pb-8">
              {[homeTeam, awayTeam].map(team => team && (
                <button
                  key={team.id}
                  onClick={() => {
                    setSheetData({ ...sheetData, team_id: team.id, teamName: team.short_name });
                    setSheetStep(1);
                  }}
                  className="flex flex-col items-center gap-2 py-6 rounded-2xl bg-white/5 active:bg-white/10 border border-white/10"
                >
                  <TeamLogo url={team.logo_url} name={team.short_name} size={40} />
                  <span className="text-white font-bold text-sm">{team.short_name}</span>
                </button>
              ))}
            </div>
          </SheetWrapper>
        );
      }
      if (sheetStep === 1) {
        return (
          <PlayerSelector
            players={allPlayers}
            title={`Quem SAI? (${sheetData.teamName})`}
            teamFilter={sheetData.team_id}
            onSelect={p => { setSheetData({ ...sheetData, player_out_id: p.id, _playerOutName: p.name }); setSheetStep(2); }}
            onClose={() => setSheetStep(0)}
          />
        );
      }
      if (sheetStep === 2) {
        return (
          <PlayerSelector
            players={allPlayers}
            title={`Quem ENTRA? (${sheetData.teamName})`}
            teamFilter={sheetData.team_id}
            excludeIds={[sheetData.player_out_id]}
            onSelect={p => {
              handlePostEvent({
                type: 'substitution',
                team_id: sheetData.team_id,
                player_id: sheetData.player_out_id,
                player_out_id: sheetData.player_out_id,
                player_in_id: p.id,
                _playerName: `${sheetData._playerOutName} ↔ ${p.name}`,
              });
            }}
            onClose={() => setSheetStep(1)}
          />
        );
      }
    }

    // ---- NOTE SHEET ----
    if (activeSheet === 'note') {
      return (
        <SheetWrapper title="📋 OCORRÊNCIA" onClose={closeSheet}>
          <div className="px-4 pb-8">
            <textarea
              value={sheetData.note || ''}
              onChange={e => setSheetData({ ...sheetData, note: e.target.value })}
              placeholder="Descreva brevemente... (lesão, briga, invasão, etc.)"
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm placeholder:text-white/30 min-h-[100px] focus:outline-none focus:border-green-500/50 resize-none"
              autoFocus
            />
            <button
              onClick={() => {
                if (sheetData.note?.trim()) {
                  handlePostEvent({ type: 'note', note: sheetData.note.trim() });
                }
              }}
              disabled={!sheetData.note?.trim()}
              className="w-full mt-3 bg-green-500 text-black font-bold text-base py-4 rounded-2xl active:scale-95 transition-transform disabled:opacity-30"
            >
              CONFIRMAR
            </button>
          </div>
        </SheetWrapper>
      );
    }

    // ---- ADDED TIME SHEET ----
    if (activeSheet === 'added_time') {
      const mins = sheetData.added_minutes ?? 3;
      return (
        <SheetWrapper title="⏱ ACRÉSCIMOS" onClose={closeSheet}>
          <div className="px-4 pb-8">
            <p className="text-white/50 text-sm text-center mb-4">{halfLabel}</p>
            <div className="flex items-center justify-center gap-6 mb-6">
              <button
                onClick={() => setSheetData({ ...sheetData, added_minutes: Math.max(0, mins - 1) })}
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
              >
                <Minus className="w-6 h-6 text-white" />
              </button>
              <span className="text-5xl font-bold font-mono text-white">{mins}</span>
              <button
                onClick={() => setSheetData({ ...sheetData, added_minutes: mins + 1 })}
                className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center active:bg-white/20"
              >
                <Plus className="w-6 h-6 text-white" />
              </button>
            </div>
            <button
              onClick={() => handlePostEvent({ type: 'added_time', added_minutes: mins })}
              className="w-full bg-green-500 text-black font-bold text-base py-4 rounded-2xl active:scale-95 transition-transform"
            >
              CONFIRMAR
            </button>
          </div>
        </SheetWrapper>
      );
    }

    // ---- INTERVAL / END MATCH CONFIRMATION ----
    if (activeSheet === 'interval_confirm') {
      const isEnd = sheetData.controlType === 'match_end';
      return (
        <SheetWrapper title={isEnd ? '🏁 ENCERRAR PARTIDA?' : '⏸ INTERVALO?'} onClose={closeSheet}>
          <div className="px-4 pb-8">
            <p className="text-white/50 text-sm text-center mb-6">
              {isEnd
                ? 'Confirme que o árbitro apitou o fim do jogo.'
                : 'Confirme que o árbitro apitou o fim do 1º tempo.'}
            </p>
            <button
              onClick={() => {
                handleMatchControl(sheetData.controlType);
                closeSheet();
              }}
              disabled={saving}
              className={`w-full ${isEnd ? 'bg-red-500' : 'bg-amber-500'} text-black font-bold text-base py-4 rounded-2xl active:scale-95 transition-transform disabled:opacity-50`}
            >
              {isEnd ? 'ENCERRAR PARTIDA' : 'CONFIRMAR INTERVALO'}
            </button>
          </div>
        </SheetWrapper>
      );
    }

    return null;
  };

  // Last event for footer
  const lastEvent = [...events].reverse().find(e => !['match_start', 'half1_end', 'half2_start', 'match_end'].includes(e.type));

  return (
    <div className="h-dvh bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Header — always visible */}
      <div className="bg-[#111] border-b border-white/5 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-green-400 uppercase">{safeStr(halfLabel)}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          </div>
          <div className="text-center">
            <span className="text-xl font-bold font-mono">{safeStr(currentTimer)}</span>
          </div>
          <div className="text-right">
            <span className="text-xs text-white/50">{safeStr(homeTeam?.short_name)} × {safeStr(awayTeam?.short_name)}</span>
          </div>
        </div>
        {/* Score */}
        <div className="flex items-center justify-center gap-3 mt-1">
          <TeamLogo url={homeTeam?.logo_url} name={safeStr(homeTeam?.short_name) || '?'} size={20} />
          <span className="text-2xl font-bold font-mono">
            {String(scoreHome ?? 0)} <span className="text-white/30">×</span> {String(scoreAway ?? 0)}
          </span>
          <TeamLogo url={awayTeam?.logo_url} name={safeStr(awayTeam?.short_name) || '?'} size={20} />
        </div>

      </div>

      {/* Main action buttons — 2x2 grid */}
      <div className="flex-1 flex flex-col justify-center px-4 py-4 gap-3">
        <div className="grid grid-cols-2 gap-3 flex-1">
          <button
            onClick={() => { setActiveSheet('goal'); setSheetStep(0); setSheetData({}); }}
            className="rounded-2xl bg-gradient-to-br from-green-600 to-green-700 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform min-h-[100px]"
          >
            <span className="text-3xl">⚽</span>
            <span className="text-white font-bold text-base">GOL</span>
          </button>

          <button
            onClick={() => { setActiveSheet('yellow'); setSheetStep(0); setSheetData({}); }}
            className="rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform min-h-[100px]"
          >
            <span className="text-3xl">🟡</span>
            <span className="text-white font-bold text-base">AMARELO</span>
          </button>

          <button
            onClick={() => { setActiveSheet('red'); setSheetStep(0); setSheetData({}); }}
            className="rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform min-h-[100px]"
          >
            <span className="text-3xl">🟥</span>
            <span className="text-white font-bold text-base">VERMELHO</span>
          </button>

          <button
            onClick={() => { setActiveSheet('sub'); setSheetStep(0); setSheetData({}); }}
            className="rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform min-h-[100px]"
          >
            <span className="text-3xl">🔄</span>
            <span className="text-white font-bold text-base">SUBSTITUIÇÃO</span>
          </button>
        </div>

        {/* Secondary buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { setActiveSheet('penalty'); setSheetStep(0); setSheetData({}); }}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-white/10"
          >
            🎯 PÊNALTI
          </button>
          <button
            onClick={() => { setActiveSheet('note'); setSheetStep(0); setSheetData({ note: '' }); }}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-white/10"
          >
            📋 OCORRÊNCIA
          </button>
          <button
            onClick={() => { setActiveSheet('added_time'); setSheetStep(0); setSheetData({ added_minutes: 3 }); }}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-white/10"
          >
            ⏱ ACRÉSC.
          </button>
        </div>

        {/* Interval / End match */}
        <button
          onClick={() => {
            const controlType = scoutStatus === 'live_half1' ? 'half1_end' : 'match_end';
            setActiveSheet('interval_confirm');
            setSheetData({ controlType });
          }}
          className={`w-full py-3 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform ${
            scoutStatus === 'live_half1'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {scoutStatus === 'live_half1' ? '⏸ INTERVALO' : '🏁 ENCERRAR PARTIDA'}
        </button>
      </div>

      {/* Footer — last event (tap to edit) */}
      <div className="bg-[#111] border-t border-white/5 px-4 py-2.5">
        {lastEvent ? (
          <button
            onClick={() => { setEditingEvent(lastEvent); setEditMinute(String(lastEvent.match_minute || 0)); }}
            className="w-full flex items-center gap-2 text-left"
          >
            <p className="text-white/40 text-xs truncate flex-1">
              Último: {safeStr(EVENT_ICONS[lastEvent.type])} {safeStr(EVENT_LABELS[lastEvent.type] || lastEvent.type)}
              {safePlayerName(lastEvent.player) ? ` — ${safePlayerName(lastEvent.player)}` : ''} ({String(lastEvent.match_minute || 0)}')
            </p>
            <Edit3 className="w-3 h-3 text-white/20 shrink-0" />
          </button>
        ) : (
          <p className="text-white/20 text-xs">Nenhum evento registrado</p>
        )}
      </div>

      {/* Inline Edit Modal (live screen) */}
      {editingEvent && !activeSheet && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70" onClick={() => setEditingEvent(null)}>
          <div className="w-full max-w-md bg-[#1a1a1a] rounded-t-3xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm">Editar Evento</h3>
              <button onClick={() => setEditingEvent(null)} className="text-white/40"><X className="w-5 h-5" /></button>
            </div>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-white/70 text-sm">
                {safeStr(EVENT_ICONS[editingEvent.type])} {safeStr(EVENT_LABELS[editingEvent.type] || editingEvent.type)}
                {safePlayerName(editingEvent.player) ? ` — ${safePlayerName(editingEvent.player)}` : ''}
              </p>
            </div>
            <div>
              <label className="text-white/50 text-xs mb-1 block">Minuto</label>
              <input type="number" min="0" max="90" value={editMinute} onChange={e => setEditMinute(e.target.value)}
                className="w-full bg-white/10 text-white rounded-xl px-4 py-3 text-lg font-mono text-center border border-white/10 focus:border-green-500 outline-none" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!urlToken) return;
                  setEditSaving(true);
                  try {
                    const newMin = parseInt(editMinute);
                    if (!isNaN(newMin) && newMin !== editingEvent.match_minute) {
                      await editEvent(editingEvent.id, urlToken, { match_minute: newMin }, 'Correção de minuto');
                      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...e, match_minute: newMin } : e));
                      showToast('Minuto atualizado', 'success');
                    }
                    setEditingEvent(null);
                  } catch (e: any) { showToast('Erro: ' + e.message, 'error'); }
                  setEditSaving(false);
                }}
                disabled={editSaving}
                className="flex-1 bg-green-500 text-black font-bold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {editSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                SALVAR
              </button>
              <button
                onClick={async () => {
                  if (!urlToken) return;
                  if (!confirm('Excluir este evento?')) return;
                  setEditSaving(true);
                  try {
                    await deleteEvent(editingEvent.id, urlToken, 'Excluído pelo olheiro');
                    setEvents(prev => prev.filter(e => e.id !== editingEvent.id));
                    showToast('Evento excluído', 'warning');
                    setEditingEvent(null);
                  } catch (e: any) { showToast('Erro: ' + e.message, 'error'); }
                  setEditSaving(false);
                }}
                disabled={editSaving}
                className="bg-red-500/20 text-red-400 font-bold py-3 px-5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom sheet overlay */}
      {activeSheet ? renderBottomSheet() : null}

      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 z-[90] bg-black/40 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        </div>
      )}
    </div>
  );
}

// ============================
// SHEET WRAPPER
// ============================
function SheetWrapper({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      {/* Sheet */}
      <div className="bg-[#111] rounded-t-3xl pt-4 max-h-[80vh] overflow-y-auto">
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
        <div className="flex items-center justify-between px-4 mb-4">
          <h3 className="text-white font-bold text-base">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}