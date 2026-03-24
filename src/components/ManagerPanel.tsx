import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTournament } from '../hooks/useTournament';
import { useBroadcastState } from '../hooks/useBroadcastState';
import {
  updateMatch, upsertTeam, upsertPlayer, deletePlayer,
  insertMatchEvent, deleteMatchEvent, updateMatchEvent, upsertMatchTeamStats, fetchMatchTeamStats,
  insertMatch, deleteMatch, COMPETITION_ID, fetchMatchById,
  insertTeam, deleteTeam, insertCompetition, updateCompetition, deleteCompetition,
  addTeamToCompetition, removeTeamFromCompetition, fetchAllTeams, fetchCompetitions,
  updateTeam, recalculateAllStats,
  fetchMatchLineups, upsertMatchLineups, clearMatchLineups,
} from '../lib/supabase';
import type { SQLMatch, SQLPlayer, SQLMatchEvent, SQLTeam, SQLMatchTeamStats, SQLCompetition, SQLMatchLineup } from '../lib/supabase';
import {
  Trophy, Users, UserPlus, ClipboardList, Plus, Trash2, Save, RefreshCw,
  Wifi, WifiOff, AlertCircle, Settings, ChevronLeft, ChevronRight,
  Home, LayoutList, Swords, Tv, Shield, Radio, Target, LayoutDashboard, Calendar,
  CreditCard, FileText, User, GitBranch, AlertTriangle,
  HandHelping, Zap, Edit2, X, Clock, MapPin, Play, Square,
  BarChart3, Award, Check, Newspaper, ArrowRight, ArrowLeft, ChevronDown, FileJson2, ClipboardCopy,
  Clapperboard, RotateCcw, Download, Lock, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { format } from 'date-fns';
import { ImageUpload } from './ImageUpload';
import { MatchJsonImporter } from './MatchJsonImporter';
import { supabase as supabaseStorage } from '../lib/public-supabase';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { DisciplinePanel } from './DisciplinePanel';
import { CompetitionRulesPanel } from './CompetitionRulesPanel';
import { ScoutTokensPanel } from './ScoutTokensPanel';
import { ScoutMonitor } from './ScoutMonitor';
import { resetScout } from '../lib/scout-api';
import { NewsExportPanel } from './NewsExportPanel';


// ============================
// LOGO MIGRATION — Migrate logos from external hosts to Supabase Storage
// ============================
async function migrateTeamLogos(
  teams: SQLTeam[],
  onProgress: (msg: string) => void,
  onComplete: () => void
) {
  const BUCKET = 'team-logos';
  const { data: buckets } = await supabaseStorage.storage.listBuckets();
  const exists = buckets?.some(b => b.name === BUCKET);
  if (!exists) {
    const { error } = await supabaseStorage.storage.createBucket(BUCKET, { public: true });
    if (error) { onProgress(`Erro ao criar bucket: ${error.message}`); return; }
  }

  let migrated = 0;
  for (const team of teams) {
    if (!team.logo_url) continue;
    if (team.logo_url.includes(`${projectId}.supabase.co`)) continue;

    onProgress(`Migrando ${team.short_name || team.name}...`);
    try {
      const resp = await fetch(team.logo_url);
      if (!resp.ok) { onProgress(`  Falha ao baixar logo de ${team.short_name}`); continue; }
      const blob = await resp.blob();
      const ext = team.logo_url.includes('.webp') ? 'webp' : 'png';
      const filePath = `${team.id}.${ext}`;
      const { error: upErr } = await supabaseStorage.storage
        .from(BUCKET)
        .upload(filePath, blob, { contentType: blob.type || 'image/png', upsert: true });
      if (upErr) { onProgress(`  Erro upload ${team.short_name}: ${upErr.message}`); continue; }
      const { data: pubData } = supabaseStorage.storage.from(BUCKET).getPublicUrl(filePath);
      if (pubData?.publicUrl) {
        await updateTeam(team.id, { logo_url: pubData.publicUrl });
        migrated++;
        onProgress(`  OK: ${team.short_name}`);
      }
    } catch (err: any) {
      onProgress(`  Erro ${team.short_name}: ${err.message}`);
    }
  }
  onProgress(`Concluído: ${migrated} logo(s) migrado(s).`);
  onComplete();
}

// ============================
// SCENES CONFIG
// ============================
const SCENES = [
  { id: 'home', label: 'Home', icon: Home, color: '#22c55e' },
  { id: 'rounds', label: 'Rodadas', icon: LayoutList, color: '#3b82f6' },
  { id: 'standings', label: 'Classificação', icon: Trophy, color: '#eab308' },
  { id: 'team', label: 'Perfil Time', icon: Users, color: '#8b5cf6' },
  { id: 'mano-a-mano', label: 'Mano a Mano', icon: Swords, color: '#ec4899' },
  { id: 'bracket', label: 'Playoffs', icon: GitBranch, color: '#f59e0b' },
  { id: 'schedule', label: 'Agenda', icon: Radio, color: '#ef4444' },
  { id: 'scorers', label: 'Artilharia', icon: Target, color: '#eab308' },
  { id: 'assists', label: 'Assistências', icon: HandHelping, color: '#3b82f6' },
  { id: 'cards', label: 'Cartões', icon: CreditCard, color: '#ef4444' },
  { id: 'match-detail', label: 'Detalhe Jogo', icon: FileText, color: '#10b981' },
  { id: 'player', label: 'Perfil Jogador', icon: User, color: '#8b5cf6' },
  { id: 'suspensions', label: 'Pendurados', icon: AlertTriangle, color: '#f59e0b' },
  { id: 'arena-selection', label: 'Seleção Arena', icon: Award, color: '#8b5cf6' },
  { id: 'selecao-galera', label: 'Seleção Galera', icon: Users, color: '#22c55e' },
  { id: 'bolao-ranking', label: 'Bolão', icon: Trophy, color: '#eab308' },
  { id: 'voting-live', label: 'Votação Live', icon: BarChart3, color: '#06b6d4' },
  { id: 'zebra', label: 'Zebra', icon: Zap, color: '#f59e0b' },
  { id: 'match-replay', label: 'Replay', icon: Clapperboard, color: '#f97316' },
] as const;

const SIDEBAR_TABS = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#6366f1' },
  { value: 'championships', label: 'Campeonatos', icon: Trophy, color: '#f59e0b' },
  { value: 'matches', label: 'Partidas', icon: ClipboardList, color: '#3b82f6' },
  { value: 'teams', label: 'Times', icon: Shield, color: '#8b5cf6' },
  { value: 'players', label: 'Jogadores', icon: UserPlus, color: '#ec4899' },
  { value: 'regulations', label: 'Regulamento', icon: AlertTriangle, color: '#f59e0b' },
  { value: 'broadcast', label: 'Broadcast', icon: Tv, color: '#22c55e' },
  { value: 'scout', label: 'Olheiros', icon: Radio, color: '#10b981' },
  { value: 'fans', label: 'Torcedores', icon: Users, color: '#6366f1' },
  { value: 'admin', label: 'Admin', icon: Settings, color: '#ef4444' },
];

// ============================
// GLASS CARD HELPER
// ============================
const glassCard = 'rounded-2xl';
const glassBg = { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const glassInput = 'w-full text-xs rounded-lg bg-white border border-slate-200 text-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/30 placeholder-slate-400';

// ============================
// ARENA SELECTION PANEL — Admin inserts "Seleção do Arena"
// ============================
function ArenaSelectionPanel({ competitionId, teams, players, matches }: {
  competitionId: string;
  teams: SQLTeam[];
  players: SQLPlayer[];
  matches: SQLMatch[];
}) {
  const [round, setRound] = useState(1);
  const [selections, setSelections] = useState<Record<string, { player_id?: string; team_id: string; coach_name?: string }>>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const FORMATION_SLOTS = [
    { position: 'goleiro', label: 'Goleiro', slots: 1 },
    { position: 'lateral', label: 'Lateral', slots: 2 },
    { position: 'zagueiro', label: 'Zagueiro', slots: 2 },
    { position: 'meia', label: 'Meio-campista', slots: 3 },
    { position: 'atacante', label: 'Atacante', slots: 3 },
    { position: 'treinador', label: 'Treinador', slots: 1 },
  ];

  const finishedRounds = [...new Set(
    matches.filter(m => m.status === 'finished').map(m => m.round_number)
  )].sort((a, b) => b - a);

  useEffect(() => {
    if (finishedRounds.length > 0 && !loaded) {
      setRound(finishedRounds[0]);
    }
  }, [finishedRounds.length]);

  useEffect(() => {
    async function load() {
      try {
        const { getArenaSelection } = await import('../lib/galera-api');
        const data = await getArenaSelection(competitionId, round);
        setSelections(data.selections || {});
        setLoaded(true);
      } catch (e) {
        console.error('Error loading arena selection:', e);
      }
    }
    load();
  }, [competitionId, round]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { saveArenaSelection } = await import('../lib/galera-api');
      await saveArenaSelection(competitionId, round, selections);
      toast.success('Seleção do Arena salva!');
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const handleSelect = (key: string, playerId: string) => {
    const player = players.find(p => p.id === playerId);
    if (player) {
      const newSelections = { ...selections, [key]: { player_id: playerId, team_id: player.team_id } };
      setSelections(newSelections);
      // Auto-save immediately so broadcast updates in real-time (~3s polling)
      import('../lib/galera-api').then(({ saveArenaSelection }) => {
        saveArenaSelection(competitionId, round, newSelections).catch(console.error);
      });
    }
  };

  const handleSelectCoach = (key: string, teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      const newSelections = { ...selections, [key]: { team_id: teamId, coach_name: team.coach || 'Sem técnico' } };
      setSelections(newSelections);
      // Auto-save immediately so broadcast updates in real-time (~3s polling)
      import('../lib/galera-api').then(({ saveArenaSelection }) => {
        saveArenaSelection(competitionId, round, newSelections).catch(console.error);
      });
    }
  };

  const roundTeamIds = new Set(
    matches.filter(m => m.round_number === round).flatMap(m => [m.home_team_id, m.away_team_id])
  );
  const roundPlayers = players.filter(p => roundTeamIds.has(p.team_id));
  const roundTeams = teams.filter(t => roundTeamIds.has(t.id));

  return (
    <div className="space-y-4">
      <div className={`p-4 ${glassCard}`} style={{ ...glassBg, background: 'linear-gradient(135deg, #f3e8ff 0%, #ede9fe 100%)', borderColor: '#8b5cf630' }}>
        <div className="flex items-center gap-2 mb-3">
          <Award className="w-5 h-5 text-purple-600" />
          <h3 className="text-sm font-bold text-slate-800">Seleção do Arena</h3>
        </div>
        <p className="text-[10px] text-slate-500 mb-4">Escalação definida ao vivo no Arena FV (segundas 20h)</p>

        <div className="flex items-center gap-2 mb-4">
          <label className="text-xs text-slate-600 font-semibold">Rodada:</label>
          <select
            value={round}
            onChange={e => setRound(parseInt(e.target.value))}
            className={glassInput + ' !w-24'}
          >
            {finishedRounds.map(r => (
              <option key={r} value={r}>Rodada {r}</option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {FORMATION_SLOTS.map(slot => (
            <div key={slot.position}>
              <p className="text-[10px] font-bold text-slate-600 mb-1">{slot.label} ({slot.slots})</p>
              <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(slot.slots, 3)}, 1fr)` }}>
                {Array.from({ length: slot.slots }).map((_, idx) => {
                  const key = `${slot.position}:${idx}`;
                  const sel = selections[key];
                  const isCoach = slot.position === 'treinador';
                  return (
                    <div key={key}>
                      {isCoach ? (
                        <select
                          value={sel?.team_id || ''}
                          onChange={e => handleSelectCoach(key, e.target.value)}
                          className={glassInput}
                        >
                          <option value="">Selecionar...</option>
                          {roundTeams.map(t => (
                            <option key={t.id} value={t.id}>{t.coach || 'Sem técnico'} ({t.short_name})</option>
                          ))}
                        </select>
                      ) : (
                        <select
                          value={sel?.player_id || ''}
                          onChange={e => handleSelect(key, e.target.value)}
                          className={glassInput}
                        >
                          <option value="">Selecionar...</option>
                          {roundPlayers
                            .filter(p => {
                              const pos = (p.position || '').toLowerCase();
                              if (slot.position === 'goleiro') return /goleiro|gk/i.test(pos);
                              if (slot.position === 'lateral') return /lateral|lb|rb/i.test(pos);
                              if (slot.position === 'zagueiro') return /zagueiro|cb|defens/i.test(pos);
                              if (slot.position === 'meia') return /meia|meio|mid|volante/i.test(pos);
                              if (slot.position === 'atacante') return /atacante|forward|striker|ponta/i.test(pos);
                              return true;
                            })
                            .map(p => {
                              const t = teams.find(t => t.id === p.team_id);
                              return (
                                <option key={p.id} value={p.id}>{p.name} ({t?.short_name})</option>
                              );
                            })
                          }
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-4 py-2.5 rounded-xl bg-purple-600 text-white text-xs font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-3.5 h-3.5" />
          {saving ? 'Salvando...' : 'Salvar Seleção do Arena'}
        </button>
      </div>
    </div>
  );
}

// ============================
// ROUND CONTROL PANEL — Admin opens/closes rounds, releases results, shows stats
// ============================
function RoundControlPanel({ competitionId, matches }: { competitionId: string; matches: SQLMatch[] }) {
  const [control, setControl] = useState<{ bolao: Record<string, boolean>; selecao: Record<string, boolean> }>({ bolao: {}, selecao: {} });
  const [releases, setReleases] = useState<Record<string, boolean>>({});
  const [adminStats, setAdminStats] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [roundsOpen, setRoundsOpen] = useState(true);
  const [statsOpen, setStatsOpen] = useState(false);
  const [automating, setAutomating] = useState(false);
  const allRounds = [...new Set(matches.map(m => m.round_number))].sort((a, b) => a - b);

  // === Automation: Arena Força do Vale (Seg 20h30) ===
  const finishedRounds = allRounds.filter(r => matches.filter(m => m.round_number === r).every(m => m.status === 'finished'));
  const lastPlayedRound = finishedRounds.length > 0 ? Math.max(...finishedRounds) : null;
  const penultimateRound = lastPlayedRound && finishedRounds.length >= 2 ? finishedRounds.sort((a, b) => a - b)[finishedRounds.length - 2] : null;
  const nextRound = allRounds.find(r => matches.filter(m => m.round_number === r).some(m => m.status !== 'finished')) || null;

  const getNextMonday2030 = () => {
    const now = new Date();
    const day = now.getDay();
    const daysUntilMon = day === 0 ? 1 : day === 1 ? 0 : 8 - day;
    const next = new Date(now);
    next.setDate(now.getDate() + daysUntilMon);
    next.setHours(20, 30, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 7);
    return next;
  };
  const nextArena = getNextMonday2030();
  const isArenaDay = new Date().getDay() === 1;

  const runAutomation = async () => {
    if (!lastPlayedRound) { toast.error('Nenhuma rodada finalizada encontrada'); return; }
    setAutomating(true);
    try {
      const { setRoundControl, releaseResults } = await import('../lib/galera-api');
      const actions: string[] = [];
      if (penultimateRound) {
        await setRoundControl(competitionId, { selecao: { [String(penultimateRound)]: false } });
        setControl(prev => ({ ...prev, selecao: { ...prev.selecao, [String(penultimateRound)]: false } }));
        actions.push(`Seleção R${penultimateRound} FECHADA`);
      }
      await setRoundControl(competitionId, { selecao: { [String(lastPlayedRound)]: true } });
      setControl(prev => ({ ...prev, selecao: { ...prev.selecao, [String(lastPlayedRound)]: true } }));
      actions.push(`Seleção R${lastPlayedRound} ABERTA`);
      await releaseResults(competitionId, lastPlayedRound, true);
      setReleases(prev => ({ ...prev, [String(lastPlayedRound)]: true }));
      actions.push(`Resultados R${lastPlayedRound} LIBERADOS`);
      if (nextRound) {
        await setRoundControl(competitionId, { bolao: { [String(nextRound)]: true } });
        setControl(prev => ({ ...prev, bolao: { ...prev.bolao, [String(nextRound)]: true } }));
        actions.push(`Bolão R${nextRound} ABERTO`);
      }
      toast.success(`Arena executada! ${actions.join(' • ')}`);
    } catch (e: any) { toast.error(`Erro na automação: ${e.message}`); }
    setAutomating(false);
  };

  const loadAll = useCallback(async () => {
    try {
      const { getRoundControl, getReleaseStatus, getAdminStats } = await import('../lib/galera-api');
      const [rcData, relData, statsData] = await Promise.all([getRoundControl(competitionId), getReleaseStatus(competitionId), getAdminStats(competitionId)]);
      setControl({ bolao: rcData.bolao || {}, selecao: rcData.selecao || {} });
      setReleases(relData.releases || {});
      setAdminStats(statsData);
      setLoaded(true);
    } catch (e) { console.error('Error loading round control:', e); setLoaded(true); }
  }, [competitionId]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const toggle = async (type: 'bolao' | 'selecao', round: number) => {
    const key = String(round);
    const current = control[type][key];
    // undefined = "auto" (follows time window) → first click EXPLICITLY opens (true)
    // true  → false (close)
    // false → true (open again)
    const newVal = current === true ? false : true;
    setControl(prev => ({ ...prev, [type]: { ...prev[type], [key]: newVal } }));
    setSaving(true);
    try { const { setRoundControl } = await import('../lib/galera-api'); await setRoundControl(competitionId, { [type]: { [key]: newVal } }); toast.success(`R${round} ${type === 'bolao' ? 'Bolão' : 'Seleção'}: ${newVal ? 'ABERTA ✓' : 'FECHADA'}`); }
    catch (e: any) { toast.error(e.message); setControl(prev => ({ ...prev, [type]: { ...prev[type], [key]: current } })); }
    setSaving(false);
  };

  const toggleRelease = async (round: number) => {
    const key = String(round); const current = releases[key] || false; const newVal = !current;
    setReleases(prev => ({ ...prev, [key]: newVal }));
    setSaving(true);
    try { const { releaseResults } = await import('../lib/galera-api'); await releaseResults(competitionId, round, newVal); toast.success(`R${round} Resultado: ${newVal ? 'LIBERADO' : 'RE-EMBARGADO'}`); }
    catch (e: any) { toast.error(e.message); setReleases(prev => ({ ...prev, [key]: current })); }
    setSaving(false);
  };

  const refreshStats = async () => {
    setLoadingStats(true);
    try { const { getAdminStats } = await import('../lib/galera-api'); setAdminStats(await getAdminStats(competitionId)); toast.success('Stats atualizadas'); }
    catch { toast.error('Erro ao carregar stats'); }
    setLoadingStats(false);
  };

  const isAuto = (type: 'bolao' | 'selecao', round: number) => control[type][String(round)] === undefined;
  const isOpen = (type: 'bolao' | 'selecao', round: number) => { const v = control[type][String(round)]; return v === undefined || v === true; };

  if (!loaded) return <div className="text-xs text-slate-400 text-center py-4">Carregando...</div>;

  return (
    <div className="space-y-3">
      {/* Automation Card */}
      <div className={`p-3 ${glassCard}`} style={{ ...glassBg, background: 'linear-gradient(135deg, #fef3c7 0%, #fef9c3 100%)', borderColor: '#f59e0b30' }}>
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-amber-600" />
          <span className="text-xs font-bold text-slate-800">Automação Arena Força do Vale</span>
          {isArenaDay && <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold animate-pulse">HOJE É SEGUNDA!</span>}
        </div>
        <p className="text-[9px] text-slate-500 mb-2">
          Seg 20h30: fecha seleção da penúltima rod., abre seleção da última jogada, libera resultados, abre bolão da próxima.
        </p>
        <div className="grid grid-cols-2 gap-1.5 mb-2">
          <div className="text-[9px] p-1.5 rounded bg-white/60 border border-slate-200">
            <span className="text-slate-400">Penúltima:</span>{' '}
            <strong className="text-slate-700">{penultimateRound ? `R${penultimateRound}` : '—'}</strong>
            <span className="text-slate-400 ml-1">→ fechar sel.</span>
          </div>
          <div className="text-[9px] p-1.5 rounded bg-white/60 border border-slate-200">
            <span className="text-slate-400">Última jogada:</span>{' '}
            <strong className="text-slate-700">{lastPlayedRound ? `R${lastPlayedRound}` : '—'}</strong>
            <span className="text-slate-400 ml-1">→ abrir + liberar</span>
          </div>
          <div className="text-[9px] p-1.5 rounded bg-white/60 border border-slate-200">
            <span className="text-slate-400">Próxima:</span>{' '}
            <strong className="text-slate-700">{nextRound ? `R${nextRound}` : '—'}</strong>
            <span className="text-slate-400 ml-1">→ abrir bolão</span>
          </div>
          <div className="text-[9px] p-1.5 rounded bg-white/60 border border-slate-200">
            <span className="text-slate-400">Próx. Arena:</span>{' '}
            <strong className="text-slate-700">{format(nextArena, 'dd/MM HH:mm')}</strong>
          </div>
        </div>
        <button
          onClick={runAutomation}
          disabled={automating || !lastPlayedRound}
          className="w-full py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold flex items-center justify-center gap-2 hover:from-amber-600 hover:to-orange-600 transition-all disabled:opacity-50 shadow-sm"
        >
          <Zap className="w-3.5 h-3.5" />
          {automating ? 'Executando...' : 'Executar Automação Arena 20h30'}
        </button>
      </div>

      {/* Controle de Rodadas — collapsible */}
      <div className={`${glassCard} overflow-hidden`} style={{ ...glassBg, background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)', borderColor: '#22c55e30' }}>
        <button
          onClick={() => setRoundsOpen(!roundsOpen)}
          className="w-full flex items-center justify-between p-3 hover:bg-emerald-50/30 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-slate-800">Controle de Rodadas</span>
            <span className="text-[8px] text-slate-400">({allRounds.length} rodadas)</span>
          </div>
          <div className="flex items-center gap-2">
            <span role="button" onClick={(e) => { e.stopPropagation(); refreshStats(); }} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200">
              <RefreshCw className={`w-3 h-3 ${loadingStats ? 'animate-spin' : ''}`} />
            </span>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${roundsOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>
        {roundsOpen && (
          <div className="px-3 pb-3">
            <div className="flex flex-wrap gap-1.5 mb-2">
              <span className="text-[8px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">◐ Auto</span>
              <span className="text-[8px] font-bold text-green-700 bg-green-100 border border-green-200 px-1.5 py-0.5 rounded">✓ Aberto</span>
              <span className="text-[8px] font-bold text-red-600 bg-red-100 border border-red-200 px-1.5 py-0.5 rounded">✗ Fechado</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-1.5 px-1 font-bold text-slate-600 text-[10px]">Rod.</th>
                    <th className="text-center py-1.5 px-1 font-bold text-slate-600 text-[10px]"><span className="flex items-center justify-center gap-1"><Target className="w-3 h-3 text-yellow-500" /> Bolão</span></th>
                    <th className="text-center py-1.5 px-1 font-bold text-slate-600 text-[10px]"><span className="flex items-center justify-center gap-1"><Award className="w-3 h-3 text-green-500" /> Seleção</span></th>
                    <th className="text-center py-1.5 px-1 font-bold text-slate-600 text-[10px]"><span className="flex items-center justify-center gap-1"><Eye className="w-3 h-3 text-blue-500" /> Result.</span></th>
                  </tr>
                </thead>
                <tbody>
                  {allRounds.map(round => {
                    const rm = matches.filter(m => m.round_number === round);
                    const allFin = rm.every(m => m.status === 'finished');
                    const hasUp = rm.some(m => m.status !== 'finished');
                    const bO = isOpen('bolao', round), sO = isOpen('selecao', round), rel = releases[String(round)] || false;
                    const bAuto = isAuto('bolao', round), sAuto = isAuto('selecao', round);
                    const vs = adminStats?.voting?.[round], ps = adminStats?.predictions?.[round];
                    const isHL = round === lastPlayedRound || round === penultimateRound || round === nextRound;
                    return (
                      <tr key={round} className={`border-b border-slate-100 ${isHL ? 'bg-amber-50/40' : 'hover:bg-slate-50/50'}`}>
                        <td className="py-1.5 px-1">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-slate-700">R{round}</span>
                              {allFin && <span className="text-[7px] px-1 py-0.5 rounded-full bg-slate-100 text-slate-500 font-semibold">FIM</span>}
                              {hasUp && <span className="text-[7px] px-1 py-0.5 rounded-full bg-blue-100 text-blue-600 font-semibold">PROX</span>}
                            </div>
                            {vs && <span className="text-[8px] text-slate-400">{vs.unique_voters}vot {vs.total_votes}v</span>}
                            {ps && <span className="text-[8px] text-slate-400">{ps.unique_predictors}palp {ps.total_predictions}p</span>}
                          </div>
                        </td>
                        <td className="py-1.5 px-1 text-center"><button onClick={() => toggle('bolao', round)} disabled={saving} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold ${bAuto ? 'bg-amber-50 text-amber-700 border border-amber-200' : bO ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>{bAuto ? <>◐</> : bO ? <><Check className="w-2.5 h-2.5" /></> : <><Lock className="w-2.5 h-2.5" /></>}</button></td>
                        <td className="py-1.5 px-1 text-center"><button onClick={() => toggle('selecao', round)} disabled={saving} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold ${sAuto ? 'bg-amber-50 text-amber-700 border border-amber-200' : sO ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>{sAuto ? <>◐</> : sO ? <><Check className="w-2.5 h-2.5" /></> : <><Lock className="w-2.5 h-2.5" /></>}</button></td>
                        <td className="py-1.5 px-1 text-center"><button onClick={() => toggleRelease(round)} disabled={saving} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold ${rel ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-amber-100 text-amber-700 border border-amber-200'}`}>{rel ? <><Eye className="w-2.5 h-2.5" /></> : <><Lock className="w-2.5 h-2.5" /></>}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Estatísticas — collapsible */}
      {adminStats && (
        <div className={`${glassCard} overflow-hidden`} style={glassBg}>
          <button
            onClick={() => setStatsOpen(!statsOpen)}
            className="w-full flex items-center justify-between p-3 hover:bg-slate-50/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <span className="text-xs font-bold text-slate-800">Estatísticas por Rodada</span>
              <span className="text-[8px] text-slate-400">{adminStats.total_predictions || 0} palpites</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${statsOpen ? 'rotate-180' : ''}`} />
          </button>
          {statsOpen && (
            <div className="px-3 pb-3">
              <div className="grid grid-cols-2 gap-2">
                {allRounds.map(round => {
                  const v = adminStats.voting?.[round], p = adminStats.predictions?.[round];
                  if (!v && !p) return null;
                  return (
                    <div key={round} className="p-2 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-700 mb-1">Rodada {round}</div>
                      {v && <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><Award className="w-3 h-3 text-green-500 shrink-0" /><span><strong>{v.unique_voters}</strong> votantes, <strong>{v.total_votes}</strong> votos</span></div>}
                      {p && <div className="flex items-center gap-1.5 text-[9px] text-slate-500"><Target className="w-3 h-3 text-yellow-500 shrink-0" /><span><strong>{p.unique_predictors}</strong> palpiteiros, <strong>{p.total_predictions}</strong> palpites</span></div>}
                      {v && Object.keys(v.position_counts || {}).length > 0 && (
                        <div className="mt-1 flex flex-wrap gap-0.5">{Object.entries(v.position_counts).map(([pos, count]) => <span key={pos} className="text-[7px] px-1 py-0.5 rounded bg-green-50 text-green-700 border border-green-100">{pos}: {count as number}</span>)}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================
// LINEUP EDITOR — Three-step flow: Formation -> Fill Slots -> Confirm Bench
// ============================
import { FORMATIONS, DEFAULT_FORMATION, getFormation, normalizePositionForSlot } from '../lib/formations';
import type { Formation, FormationSlot } from '../lib/formations';

const POSITION_ORDER_LINEUP: Record<string, number> = {
  'Goleiro': 0, 'GOL': 0, 'GK': 0,
  'Zagueiro': 1, 'ZAG': 1,
  'Lateral': 2, 'LAT': 2,
  'Volante': 3, 'VOL': 3,
  'Meio-Campo': 4, 'Meia': 4, 'MEI': 4,
  'Atacante': 5, 'ATA': 5, 'Ponta': 5,
};

function getPositionGroup(pos: string): string {
  const p = (pos || '').toLowerCase();
  if (/goleiro|gk|gol/i.test(p)) return 'Goleiros';
  if (/zagueiro|zag|cb|defens/i.test(p)) return 'Zagueiros';
  if (/lateral|lat|lb|rb|ala/i.test(p)) return 'Laterais';
  if (/volante|vol|meio|meia|mei|mid|cm|mc/i.test(p)) return 'Meias';
  if (/atacante|ata|forward|striker|ponta|st|fw/i.test(p)) return 'Atacantes';
  return 'Outros';
}

const POS_GROUP_ORDER: Record<string, number> = {
  'Goleiros': 0, 'Zagueiros': 1, 'Laterais': 2, 'Meias': 3, 'Atacantes': 4, 'Outros': 5,
};

// Mini pitch preview for formation selector
function FormationMiniPitch({ formation, isSelected }: { formation: Formation; isSelected: boolean }) {
  return (
    <svg viewBox="0 0 100 140" className="w-full" style={{ maxHeight: 80 }}>
      <rect x="2" y="2" width="96" height="136" rx="4" fill={isSelected ? '#0e4429' : '#1a3a2a'} stroke={isSelected ? '#22d3ee' : '#334155'} strokeWidth="1.5" />
      <line x1="2" y1="70" x2="98" y2="70" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
      <circle cx="50" cy="70" r="10" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
      {formation.slots.map(s => {
        const dy = 130 - (s.y / 100) * 126;
        const dx = 2 + (s.x / 100) * 96;
        return <circle key={s.id} cx={dx} cy={dy} r={4} fill={isSelected ? '#22d3ee' : '#94a3b8'} opacity={isSelected ? 1 : 0.7} />;
      })}
    </svg>
  );
}

// Slot picker modal for assigning a player to a formation slot
function SlotPlayerPicker({ slot, players, assignedMap, onSelect, onClose }: {
  slot: FormationSlot;
  players: SQLPlayer[];
  assignedMap: Record<string, string>;
  onSelect: (playerId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const assignedPlayerIds = new Set(Object.values(assignedMap));
  const available = players.filter(p => !assignedPlayerIds.has(p.id));
  const matching = available.filter(p => normalizePositionForSlot(p.position) === slot.position);
  const others = available.filter(p => normalizePositionForSlot(p.position) !== slot.position);
  const filterBySearch = (list: SQLPlayer[]) =>
    search ? list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || (p.number || '').includes(search)) : list;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[70vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-3 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded">{slot.label}</span>
              <span className="text-xs text-slate-500">{slot.position}</span>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <input type="text" placeholder="Buscar jogador..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-cyan-400" autoFocus />
        </div>
        <div className="overflow-y-auto flex-1 p-2">
          {filterBySearch(matching).length > 0 && (
            <><p className="text-[9px] text-slate-400 font-bold uppercase px-1 mb-1">Posição compatível</p>
            {filterBySearch(matching).map(p => (
              <button key={p.id} onClick={() => onSelect(p.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cyan-50 text-left transition-colors">
                <span className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center text-[9px] font-bold text-cyan-700 shrink-0">{p.number || '?'}</span>
                <span className="text-xs text-slate-700 font-medium truncate">{p.name}</span>
                <span className="text-[9px] text-slate-400 ml-auto shrink-0">{p.position}</span>
              </button>
            ))}</>
          )}
          {filterBySearch(others).length > 0 && (
            <><p className="text-[9px] text-slate-400 font-bold uppercase px-1 mb-1 mt-2">Outras posicoes</p>
            {filterBySearch(others).map(p => (
              <button key={p.id} onClick={() => onSelect(p.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-left transition-colors">
                <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500 shrink-0">{p.number || '?'}</span>
                <span className="text-xs text-slate-600 truncate">{p.name}</span>
                <span className="text-[9px] text-slate-400 ml-auto shrink-0">{p.position}</span>
              </button>
            ))}</>
          )}
          {filterBySearch(matching).length === 0 && filterBySearch(others).length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">Nenhum jogador disponivel</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================
// ADMIN USERS DASHBOARD
// ============================
function AdminUsersDashboard() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(true);
  const [filterPremium, setFilterPremium] = useState<'all' | 'premium' | 'free'>('all');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { adminListUsers } = await import('../lib/admin-api');
      const result = await adminListUsers(1, 200);
      setUsers(result.users || []);
      setLoaded(true);
    } catch (err: any) {
      setError(err.message);
      console.error('[AdminUsers] Error:', err);
    }
    setLoading(false);
  }, []);

  // Auto-load on first expand
  useEffect(() => {
    if (expanded && !loaded && !loading) {
      loadUsers();
    }
  }, [expanded, loaded, loading, loadUsers]);

  const normalize = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const q = normalize(search);
  const filtered = users.filter(u => {
    if (q && !normalize(u.email || '').includes(q) && !normalize(u.display_name || '').includes(q) && !normalize(u.city || '').includes(q)) return false;
    if (filterPremium === 'premium' && !u.is_premium) return false;
    if (filterPremium === 'free' && u.is_premium) return false;
    return true;
  });

  const totalWithName = users.filter(u => u.display_name).length;
  const totalPremium = users.filter(u => u.is_premium).length;

  return (
    <div className="rounded-2xl" style={{ background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <Users className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-slate-800 block" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Torcedores Cadastrados
            </span>
            {loaded && (
              <span className="text-[10px] text-slate-500">
                {users.length} usuários · {totalWithName} com nome
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3" style={{ borderTop: '1px solid #f1f5f9' }}>
          {/* Stats row */}
          {loaded && (
            <div className="grid grid-cols-4 gap-2 pt-3">
              <div className="p-2 rounded-xl text-center" style={{ background: '#f8fafc' }}>
                <div className="text-lg font-bold text-indigo-600" style={{ fontFamily: 'JetBrains Mono' }}>{users.length}</div>
                <div className="text-[9px] text-slate-500 font-semibold">TOTAL</div>
              </div>
              <div className="p-2 rounded-xl text-center" style={{ background: '#f8fafc' }}>
                <div className="text-lg font-bold text-emerald-600" style={{ fontFamily: 'JetBrains Mono' }}>{totalWithName}</div>
                <div className="text-[9px] text-slate-500 font-semibold">COM NOME</div>
              </div>
              <div className="p-2 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, #fef9c3 0%, #fef08a 100%)', border: '1px solid #fde04740' }}>
                <div className="text-lg font-bold text-amber-700" style={{ fontFamily: 'JetBrains Mono' }}>{totalPremium}</div>
                <div className="text-[9px] text-amber-600 font-semibold">PREMIUM</div>
              </div>
              <div className="p-2 rounded-xl text-center" style={{ background: '#f8fafc' }}>
                <div className="text-lg font-bold text-sky-600" style={{ fontFamily: 'JetBrains Mono' }}>
                  {users.filter(u => {
                    if (!u.last_sign_in_at) return false;
                    const diff = Date.now() - new Date(u.last_sign_in_at).getTime();
                    return diff < 7 * 24 * 60 * 60 * 1000;
                  }).length}
                </div>
                <div className="text-[9px] text-slate-500 font-semibold">ATIVOS 7D</div>
              </div>
            </div>
          )}

          {/* Search + reload */}
          <div className="flex gap-2 pt-1">
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome, e-mail ou cidade..."
              className="flex-1 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500/40 focus:border-indigo-500/30 placeholder-slate-400"
            />
            <button
              onClick={loadUsers}
              disabled={loading}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold hover:bg-indigo-100 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {/* Premium filter */}
          <div className="flex gap-1.5">
            {(['all', 'premium', 'free'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilterPremium(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  filterPremium === f
                    ? f === 'premium'
                      ? 'bg-amber-100 text-amber-700 border border-amber-300'
                      : f === 'free'
                      ? 'bg-slate-200 text-slate-700 border border-slate-300'
                      : 'bg-indigo-100 text-indigo-700 border border-indigo-300'
                    : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'premium' ? 'Premium' : 'Free'}
              </button>
            ))}
            <span className="text-[10px] text-slate-400 self-center ml-1">{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading && !loaded && (
            <div className="text-center py-6 text-slate-400 text-xs">Carregando usuários...</div>
          )}

          {loaded && (
            <div className="max-h-[400px] overflow-y-auto space-y-1">
              {filtered.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  {q ? 'Nenhum resultado' : 'Nenhum usuário cadastrado'}
                </div>
              ) : (
                filtered.map(u => {
                  const hasName = !!u.display_name;
                  const lastLogin = u.last_sign_in_at
                    ? new Date(u.last_sign_in_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                    : 'Nunca';
                  const createdAt = new Date(u.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
                  
                  return (
                    <div
                      key={u.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-50 transition-colors"
                      style={{ background: '#f8fafc', border: '1px solid #f1f5f9' }}
                    >
                      {/* Avatar */}
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-indigo-400" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-800 truncate">
                            {hasName ? u.display_name : u.email}
                          </span>
                          {u.is_premium && (
                            <span className="px-1.5 py-0.5 rounded-full text-[8px] font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #fef08a, #fbbf24)', color: '#92400e' }}>
                              PREMIUM
                            </span>
                          )}
                          {!u.email_confirmed && (
                            <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-amber-100 text-amber-600 shrink-0">
                              !email
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {hasName && <span>{u.email} · </span>}
                          <span>Entrou {createdAt}</span>
                          {u.city && <span> · {u.city}</span>}
                          {u.is_premium && u.premium_source && <span> · via {u.premium_source}</span>}
                        </div>
                      </div>

                      {/* Last login */}
                      <div className="text-right shrink-0">
                        <div className="text-[9px] text-slate-400">Último login</div>
                        <div className="text-[10px] font-semibold text-slate-600">{lastLogin}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PremiumGrantCard() {
  const [email, setEmail] = useState('');
  const [days, setDays] = useState(90);
  const [loading, setLoading] = useState(false);
  const [revoke, setRevoke] = useState(false);
  const adminToken = sessionStorage.getItem('admin_token') || '';

  const handleGrant = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) { toast.error('Informe o email'); return; }
    setLoading(true);
    try {
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a98fb753/api/premium/grant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Admin-Token': adminToken,
        },
        body: JSON.stringify(revoke ? { email: trimmed, revoke: true } : { email: trimmed, days }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        toast.error(data.error || 'Erro ao processar');
      } else if (data.action === 'revoked') {
        toast.success(`Premium REVOGADO de ${trimmed}`);
      } else {
        toast.success(`Premium concedido a ${trimmed} por ${days} dias!`);
      }
      setEmail('');
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 ${glassCard}`} style={glassBg}>
      <div className="flex items-center gap-2 mb-3">
        <CreditCard className="w-4 h-4 text-amber-500" />
        <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Conceder Premium</span>
      </div>
      <div className="flex flex-col gap-2">
        <input
          type="email"
          placeholder="Email do usuário"
          value={email}
          onChange={e => setEmail(e.target.value)}
          className={glassInput}
        />
        <div className="flex items-center gap-2">
          <select
            value={revoke ? 'revoke' : String(days)}
            onChange={e => {
              if (e.target.value === 'revoke') { setRevoke(true); }
              else { setRevoke(false); setDays(Number(e.target.value)); }
            }}
            className={`${glassInput} w-auto`}
          >
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="180">180 dias</option>
            <option value="365">1 ano</option>
            <option value="revoke">Revogar</option>
          </select>
          <button
            onClick={handleGrant}
            disabled={loading || !email.trim()}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all ${
              revoke
                ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-300'
                : 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300'
            }`}
          >
            {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : revoke ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
            {revoke ? 'Revogar' : 'Conceder'}
          </button>
        </div>
      </div>
    </div>
  );
}

function MigrateLogosCard({ teams, onReload }: { teams: SQLTeam[]; onReload: () => void }) {
  const [migrating, setMigrating] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const externalCount = teams.filter(t => t.logo_url && !t.logo_url.includes(`${projectId}.supabase.co`)).length;

  const run = () => {
    setMigrating(true);
    setLog([]);
    setConfirmOpen(false);
    migrateTeamLogos(
      teams,
      (msg) => setLog(prev => [...prev, msg]),
      () => { setMigrating(false); onReload(); }
    );
  };

  return (
    <div className="p-4 rounded-xl border" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderColor: '#3b82f630' }}>
      <div className="flex items-center gap-2 mb-2">
        <RefreshCw className="w-5 h-5 text-blue-500" />
        <span className="text-sm font-bold text-blue-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Migrar Logos para Supabase</span>
      </div>
      <p className="text-[11px] text-blue-600 mb-3">
        {externalCount > 0
          ? `${externalCount} logo(s) hospedado(s) externamente. Migrar para Supabase Storage otimiza o carregamento (WebP, cache, resize).`
          : 'Todos os logos ja estao no Supabase Storage.'}
      </p>
      {!confirmOpen && !migrating && externalCount > 0 && (
        <button
          onClick={() => setConfirmOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-500 text-white text-xs font-bold hover:bg-blue-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Migrar Logos
        </button>
      )}
      {confirmOpen && !migrating && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-600 font-semibold">Confirma? Vai sobrescrever URLs no banco.</span>
          <button onClick={run} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold hover:bg-red-600">Sim, migrar</button>
          <button onClick={() => setConfirmOpen(false)} className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-300">Cancelar</button>
        </div>
      )}
      {migrating && <div className="flex items-center gap-2 text-xs text-blue-600"><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Migrando...</div>}
      {log.length > 0 && (
        <pre className="mt-2 text-[10px] text-blue-700 bg-blue-50/50 rounded-lg p-2 max-h-40 overflow-y-auto whitespace-pre-wrap" style={{ fontFamily: 'var(--font-mono)' }}>
          {log.join('\n')}
        </pre>
      )}
    </div>
  );
}

function MatchLineupEditor({ matchId, homeTeamId, awayTeamId, teams, players, events, autoRecalc, matchExtraData }: {
  matchId: string;
  homeTeamId: string;
  awayTeamId: string;
  teams: SQLTeam[];
  players: SQLPlayer[];
  events: SQLMatchEvent[];
  autoRecalc: () => void;
  matchExtraData?: any;
}) {
  const [lineups, setLineups] = useState<SQLMatchLineup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState(homeTeamId);
  const [step, setStep] = useState<'formation' | 'starters' | 'bench'>('formation');
  const [starters, setStarters] = useState<Set<string>>(new Set());
  const [bench, setBench] = useState<Set<string>>(new Set());

  // Formation state
  const [formationId, setFormationId] = useState<string>(DEFAULT_FORMATION);
  const [slotAssignments, setSlotAssignments] = useState<Record<string, string>>({});
  const [activeSlot, setActiveSlot] = useState<FormationSlot | null>(null);

  const matchTeamIds = [homeTeamId, awayTeamId];
  const teamId = selectedTeamId || homeTeamId;
  const team = teams.find(t => t.id === teamId);
  const currentFormation = getFormation(formationId);

  const teamPlayers = useMemo(() =>
    players.filter(p => p.team_id === teamId).sort((a, b) => {
      const pa = POSITION_ORDER_LINEUP[a.position] ?? 9;
      const pb = POSITION_ORDER_LINEUP[b.position] ?? 9;
      if (pa !== pb) return pa - pb;
      const numA = parseInt(a.number) || 99;
      const numB = parseInt(b.number) || 99;
      return numA - numB;
    }),
    [players, teamId]
  );

  // Match events for this team
  const matchEvents = useMemo(() =>
    events.filter(e => e.match_id === matchId),
    [events, matchId]
  );

  // Event icons for a player
  const getPlayerEventIcons = useCallback((playerId: string) => {
    const pEvents = matchEvents.filter(e => e.player_id === playerId);
    // player_id = who ENTERS, detail.player_out_id = who LEAVES
    const subOut = matchEvents.find(e => e.event_type === 'substitution' && e.detail?.player_out_id === playerId);
    const icons: { type: string; min: number }[] = [];
    for (const ev of pEvents) {
      if (ev.event_type === 'goal' || ev.event_type === 'penalty_scored') icons.push({ type: 'goal', min: ev.minute });
      else if (ev.event_type === 'own_goal') icons.push({ type: 'og', min: ev.minute });
      else if (ev.event_type === 'yellow_card') icons.push({ type: 'yc', min: ev.minute });
      else if (ev.event_type === 'red_card') icons.push({ type: 'rc', min: ev.minute });
      else if (ev.event_type === 'substitution') icons.push({ type: 'sub_in', min: ev.minute }); // player_id = who enters
      else if (ev.event_type === 'assist') icons.push({ type: 'assist', min: ev.minute });
    }
    if (subOut) icons.push({ type: 'sub_out', min: subOut.minute }); // player found in detail.player_out_id = they left
    return icons;
  }, [matchEvents]);

  // Load existing lineups + formation from extra_data
  useEffect(() => {
    setLoading(true);
    fetchMatchLineups(matchId).then(data => {
      setLineups(data);
      populateFromData(data, teamId);
      setLoading(false);
    });
  }, [matchId]);

  // Restore formation data from match extra_data
  useEffect(() => {
    if (matchExtraData?.formations?.[teamId]) {
      const saved = matchExtraData.formations[teamId];
      if (saved.formationId && getFormation(saved.formationId)) {
        setFormationId(saved.formationId);
      }
      if (saved.slots && typeof saved.slots === 'object') {
        setSlotAssignments(saved.slots);
      }
    }
  }, [matchExtraData, teamId]);

  const populateFromData = (data: SQLMatchLineup[], tid: string) => {
    const teamData = data.filter(l => l.team_id === tid);
    const s = new Set<string>();
    const b = new Set<string>();
    teamData.forEach(l => {
      if (l.is_starter) s.add(l.player_id);
      else b.add(l.player_id);
    });
    setStarters(s);
    setBench(b);
    // If starters exist, jump to starters step (editing mode)
    if (s.size > 0) {
      setStep('starters');
    } else {
      setStep('formation');
    }
  };

  // When switching teams
  const handleTeamSwitch = (tid: string) => {
    setSelectedTeamId(tid);
    setActiveSlot(null);
    populateFromData(lineups, tid);
    // Restore formation for new team
    if (matchExtraData?.formations?.[tid]) {
      const saved = matchExtraData.formations[tid];
      if (saved.formationId) setFormationId(saved.formationId);
      if (saved.slots) setSlotAssignments(saved.slots);
    } else {
      setFormationId(DEFAULT_FORMATION);
      setSlotAssignments({});
    }
  };

  // Assign player to slot
  const assignSlot = (slotId: string, playerId: string) => {
    setSlotAssignments(prev => ({ ...prev, [slotId]: playerId }));
    setStarters(prev => { const next = new Set(prev); next.add(playerId); return next; });
    setActiveSlot(null);
  };

  // Remove player from slot
  const removeSlot = (slotId: string) => {
    const playerId = slotAssignments[slotId];
    setSlotAssignments(prev => { const next = { ...prev }; delete next[slotId]; return next; });
    if (playerId) {
      setStarters(prev => { const next = new Set(prev); next.delete(playerId); return next; });
    }
  };

  // Move to bench step
  const handleNextStep = () => {
    const newBench = new Set<string>();
    teamPlayers.forEach(p => {
      if (!starters.has(p.id)) newBench.add(p.id);
    });
    setBench(newBench);
    setStep('bench');
  };

  // Remove from bench
  const removeBenchPlayer = (playerId: string) => {
    setBench(prev => { const next = new Set(prev); next.delete(playerId); return next; });
  };

  // Save
  const handleSave = async () => {
    if (!teamId) return;
    setSaving(true);
    try {
      const starterIds = Array.from(starters);
      const allNewLineups = [
        ...starterIds.map((playerId, idx) => ({
          match_id: matchId,
          team_id: teamId,
          player_id: playerId,
          is_starter: true,
          lineup_position: idx + 1,
        })),
        ...Array.from(bench).map((playerId, idx) => ({
          match_id: matchId,
          team_id: teamId,
          player_id: playerId,
          is_starter: false,
          lineup_position: 100 + idx,
        })),
      ];

      // Preserve other team's lineups
      const existingAll = await fetchMatchLineups(matchId);
      const otherTeam = existingAll.filter(l => l.team_id !== teamId).map(l => ({
        match_id: l.match_id,
        team_id: l.team_id,
        player_id: l.player_id,
        is_starter: l.is_starter,
        lineup_position: l.lineup_position || 0,
      }));

      await clearMatchLineups(matchId);
      const combined = [...otherTeam, ...allNewLineups];
      if (combined.length > 0) {
        await upsertMatchLineups(combined);
      }

      // Save formation data in match extra_data
      const existingExtra = matchExtraData || {};
      const existingFormations = existingExtra.formations || {};
      existingFormations[teamId] = {
        formationId,
        slots: slotAssignments,
      };
      await updateMatch(matchId, {
        extra_data: { ...existingExtra, formations: existingFormations },
      });

      const updated = await fetchMatchLineups(matchId);
      setLineups(updated);
      autoRecalc();
      toast.success(`Escalação salva! ${formationId} - ${starters.size} titulares, ${bench.size} reservas`);
    } catch (e: any) {
      toast.error(`Erro ao salvar: ${e.message}`);
    }
    setSaving(false);
  };

  const filledSlots = Object.keys(slotAssignments).length;
  const homeLineupCount = lineups.filter(l => l.team_id === homeTeamId).length;
  const awayLineupCount = lineups.filter(l => l.team_id === awayTeamId).length;

  return (
    <div>
      {/* Team selector */}
      <div className="flex gap-2 mb-3">
        {matchTeamIds.map(tid => {
          const t = teams.find(tm => tm.id === tid);
          const isActive = teamId === tid;
          const count = tid === homeTeamId ? homeLineupCount : awayLineupCount;
          return (
            <button
              key={tid}
              onClick={() => handleTeamSwitch(tid)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-colors ${
                isActive ? 'bg-cyan-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {t?.logo_url && <img src={t.logo_url} alt="" className="w-5 h-5 object-contain" />}
              {t?.short_name || '?'}
              {count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white/25' : 'bg-cyan-100 text-cyan-700'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-3 px-1">
        {[
          { id: 'formation', label: 'Esquema' },
          { id: 'starters', label: 'Escalação' },
          { id: 'bench', label: 'Banco' },
        ].map((s, i) => (
          <div key={s.id} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
              step === s.id ? 'bg-cyan-100 text-cyan-700' : 'text-slate-400'
            }`}>{i + 1}. {s.label}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : step === 'formation' ? (
        /* ===== STEP 0: CHOOSE FORMATION ===== */
        <div>
          <p className="text-[10px] text-slate-500 mb-2 px-1">Escolha o esquema tatico para {team?.short_name}:</p>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {FORMATIONS.map(f => {
              const isSelected = formationId === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setFormationId(f.id);
                    setSlotAssignments({});
                    setStarters(new Set());
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-cyan-50 border-2 border-cyan-400 shadow-sm'
                      : 'bg-white border border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <FormationMiniPitch formation={f} isSelected={isSelected} />
                  <span className={`text-[10px] font-bold ${isSelected ? 'text-cyan-700' : 'text-slate-600'}`}>{f.name}</span>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setStep('starters')}
            className="w-full flex items-center justify-center gap-1 py-2.5 rounded-lg bg-cyan-600 text-white text-[11px] font-bold hover:bg-cyan-700 transition-colors"
          >
            Próximo: Preencher Slots <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : step === 'starters' ? (
        /* ===== STEP 1: FILL FORMATION SLOTS ===== */
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <button onClick={() => setStep('formation')} className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700">
              <ArrowLeft className="w-3 h-3" /> Esquema
            </button>
            <div className={`text-xs font-bold px-2 py-0.5 rounded-full ${filledSlots === 11 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
              {filledSlots} / 11 slots
            </div>
            <button
              onClick={handleNextStep}
              disabled={filledSlots !== 11}
              className="flex items-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Próximo <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Visual pitch with slots */}
          {currentFormation && (
            <div className="relative w-full rounded-xl overflow-hidden mb-3" style={{ height: 280 }}>
              {/* Grass */}
              <div className="absolute inset-0">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="w-full" style={{ height: '10%', backgroundColor: i % 2 === 0 ? '#1b5e2e' : '#237a3b' }} />
                ))}
              </div>
              {/* Lines */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150" preserveAspectRatio="none">
                <rect x="3" y="3" width="94" height="144" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <line x1="3" y1="75" x2="97" y2="75" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
                <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              </svg>
              {/* Formation badge */}
              <div className="absolute top-2 right-2 z-10 bg-black/60 text-white px-2 py-0.5 rounded text-[10px] font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {formationId}
              </div>
              {/* Slots */}
              {currentFormation.slots.map(slot => {
                const displayY = 92 - slot.y;
                const assignedPlayerId = slotAssignments[slot.id];
                const player = assignedPlayerId ? teamPlayers.find(p => p.id === assignedPlayerId) : null;
                const icons = player ? getPlayerEventIcons(player.id) : [];
                return (
                  <div
                    key={slot.id}
                    className="absolute z-20 flex flex-col items-center cursor-pointer group"
                    style={{ top: `${displayY}%`, left: `${slot.x}%`, transform: 'translate(-50%, -50%)' }}
                    onClick={() => {
                      if (player) {
                        // Already assigned - remove
                        removeSlot(slot.id);
                      } else {
                        setActiveSlot(slot);
                      }
                    }}
                  >
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        player
                          ? 'border-2 bg-black/50'
                          : 'border-2 border-dashed border-white/40 bg-black/30 group-hover:border-cyan-400 group-hover:bg-black/40'
                      }`} style={player ? { borderColor: team?.color || '#22d3ee' } : undefined}>
                        {player ? (
                          <span className="text-white font-bold text-xs" style={{ fontFamily: 'var(--font-mono)' }}>{player.number || '?'}</span>
                        ) : (
                          <span className="text-white/50 text-[8px] font-bold">{slot.label}</span>
                        )}
                      </div>
                      {icons.length > 0 && (
                        <div className="absolute flex items-center gap-0.5" style={{ top: -3, right: -4, zIndex: 10 }}>
                          {icons.map((ic, i) => (
                            <span key={i}>
                              {ic.type === 'goal' && <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block border border-green-300" />}
                              {ic.type === 'yc' && <span className="w-2 h-2.5 rounded-[1px] bg-yellow-400 inline-block border border-yellow-300" />}
                              {ic.type === 'rc' && <span className="w-2 h-2.5 rounded-[1px] bg-red-500 inline-block border border-red-300" />}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="rounded px-1 py-0.5 mt-0.5 max-w-[60px] truncate text-center" style={{ background: player ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.4)', fontSize: 9, fontWeight: 700, color: player ? '#fff' : 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-heading)' }}>
                      {player ? (player.name.length > 8 ? player.name.split(' ').pop() || player.name.slice(0, 8) : player.name) : slot.label}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Quick fill helper text */}
          <p className="text-[9px] text-slate-400 text-center mb-1">Toque num slot vazio para escolher o jogador. Toque num ocupado para remover.</p>
        </div>
      ) : (
        /* ===== STEP 2: CONFIRM BENCH ===== */
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <button
              onClick={() => setStep('starters')}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" /> Voltar
            </button>
            <div className="text-xs font-bold text-slate-600">
              {formationId} - {starters.size} titulares + {bench.size} reservas
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-2.5 mb-3">
            <p className="text-[10px] font-bold text-slate-600 mb-0.5">Banco de Reservas</p>
            <p className="text-[8px] text-slate-400">Remova quem nao compareceu ao jogo. Quem ficar aqui esta convocado.</p>
          </div>

          <div className="max-h-[35vh] overflow-y-auto space-y-1 mb-3">
            {Array.from(bench).map(playerId => {
              const p = teamPlayers.find(tp => tp.id === playerId);
              if (!p) return null;
              return (
                <div key={playerId} className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-[9px] font-bold text-amber-700 shrink-0">
                    {p.number || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-slate-700 truncate">{p.name}</p>
                    <p className="text-[8px] text-slate-400">{p.position || '-'}</p>
                  </div>
                  <button onClick={() => removeBenchPlayer(playerId)} className="w-5 h-5 rounded flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors shrink-0">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            {bench.size === 0 && (
              <p className="text-xs text-slate-400 text-center py-3">Nenhum reserva selecionado</p>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 rounded-lg bg-cyan-600 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 hover:bg-cyan-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? 'Salvando...' : `Salvar Escalação (${formationId})`}
          </button>
        </div>
      )}

      {/* Slot player picker modal */}
      {activeSlot && (
        <SlotPlayerPicker
          slot={activeSlot}
          players={teamPlayers}
          assignedMap={slotAssignments}
          onSelect={(pid) => assignSlot(activeSlot.id, pid)}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </div>
  );
}

// ============================
// PLAYER PORTAL ADMIN — Generate & manage player claim links
// ============================
function PlayerPortalAdmin({ teams }: { teams: SQLTeam[] }) {
  const [loading, setLoading] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [filterTeam, setFilterTeam] = useState('all');
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState('');

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const pw = sessionStorage.getItem('admin_pw') || '';
      const url = filterTeam === 'all'
        ? `https://${projectId}.supabase.co/functions/v1/make-server-a98fb753/portal/admin/tokens`
        : `https://${projectId}.supabase.co/functions/v1/make-server-a98fb753/portal/admin/tokens?team_id=${filterTeam}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${publicAnonKey}`, 'X-Admin-Token': pw },
      });
      const data = await res.json();
      setLinks(data.players || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const generateTokens = async () => {
    setLoading(true);
    try {
      const pw = sessionStorage.getItem('admin_pw') || '';
      const body = filterTeam === 'all' ? {} : { team_id: filterTeam };
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-a98fb753/portal/generate-tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
          'X-Admin-Token': pw,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setLinks(data.players || []);
        setGenerated(true);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const copyWhatsApp = (player: any) => {
    const msg = `Oi ${player.player_name.split(' ')[0]}! Seu perfil no Power Sports esta pronto. Acesse aqui para ver suas estatisticas e atualizar sua foto:\n\n${player.link}\n\nEsse link e so seu, nao compartilhe!`;
    navigator.clipboard.writeText(msg);
    setCopied(player.player_id);
    setTimeout(() => setCopied(''), 2000);
  };

  const copyAll = () => {
    const withLinks = links.filter(l => l.link);
    const text = withLinks.map(l => `${l.player_name} (#${l.player_number}) - ${l.team_name}\n${l.link}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied('all');
    setTimeout(() => setCopied(''), 2000);
  };

  useEffect(() => { fetchLinks(); }, [filterTeam]);

  const withTokens = links.filter(l => l.has_token || l.token);
  const withoutTokens = links.filter(l => !l.has_token && !l.token);

  return (
    <div className={`p-4 ${glassCard}`} style={glassBg}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🔗</span>
        <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
          Portal do Jogador ({links.length} jogadores)
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Gere links unicos para cada jogador acessar e editar seu perfil.
        Envie via WhatsApp para engajar os atletas.
      </p>

      <div className="flex gap-2 mb-3">
        <select
          value={filterTeam}
          onChange={e => setFilterTeam(e.target.value)}
          className={glassInput + ' max-w-[200px]'}
        >
          <option value="all">Todos os times</option>
          {teams.map(t => (
            <option key={t.id} value={t.id}>{t.short_name || t.name}</option>
          ))}
        </select>

        <button
          onClick={generateTokens}
          disabled={loading}
          className="px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Gerando...' : generated ? '✓ Links gerados!' : 'Gerar links'}
        </button>

        {withTokens.length > 0 && (
          <button
            onClick={copyAll}
            className="px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors"
          >
            {copied === 'all' ? '✓ Copiado!' : 'Copiar todos'}
          </button>
        )}
      </div>

      {withoutTokens.length > 0 && (
        <p className="text-[10px] text-amber-600 mb-2">
          {withoutTokens.length} jogadores ainda sem link. Clique em "Gerar links" para criar.
        </p>
      )}

      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {links.map(l => (
          <div key={l.player_id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            <span className="text-xs font-bold text-slate-400 w-6 text-right">#{l.player_number}</span>
            <span className="text-xs text-slate-700 flex-1 truncate">{l.player_name}</span>
            <span className="text-[10px] text-slate-400 shrink-0">{l.team_name}</span>
            {l.link ? (
              <button
                onClick={() => copyWhatsApp(l)}
                className="text-[10px] px-2 py-1 bg-green-50 text-green-700 rounded-md font-semibold hover:bg-green-100 transition-colors shrink-0"
              >
                {copied === l.player_id ? '✓' : '📋 WhatsApp'}
              </button>
            ) : (
              <span className="text-[10px] text-slate-300">Sem link</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ManagerPanel() {
  // ============================
  // GLOBAL COMPETITION STATE
  // ============================
  const [selectedCompId, setSelectedCompId] = useState<string>(COMPETITION_ID);
  const [allCompetitions, setAllCompetitions] = useState<SQLCompetition[]>([]);
  const [allTeams, setAllTeams] = useState<SQLTeam[]>([]);

  const tournament = useTournament({ pollInterval: 8000, competitionId: selectedCompId });
  const broadcast = useBroadcastState({ mode: 'control', pollInterval: 5000 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [editRound, setEditRound] = useState(0);
  const [playerFilter, setPlayerFilter] = useState('all');
  const [playerTeamFilter, setPlayerTeamFilter] = useState<string>('all');
  const [showPreview, setShowPreview] = useState(false);

  // Edit states
  const [editingMatch, setEditingMatch] = useState<string | null>(null);
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editMatchData, setEditMatchData] = useState<Partial<SQLMatch>>({});
  const [editTeamData, setEditTeamData] = useState<Partial<SQLTeam>>({});
  const [editPlayerData, setEditPlayerData] = useState<Partial<SQLPlayer>>({});

  // Match sub-tab (inline editing: 'info' | 'lineup' | 'events')
  const [matchSubTab, setMatchSubTab] = useState<'info' | 'lineup' | 'events' | 'scout'>('info');
  const [importMatchId, setImportMatchId] = useState<string | null>(null);

  // Event form
  const [eventMatchId, setEventMatchId] = useState<string>('');
  const [newEvent, setNewEvent] = useState({ event_type: 'goal', player_id: '', team_id: '', minute: 0, half: '1T', detail: {} as any });
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [editEventData, setEditEventData] = useState<any>({});

  // Stats
  const [statsMatchId, setStatsMatchId] = useState<string>('');
  const [statsLoading, setStatsLoading] = useState(false);
  const [matchStats, setMatchStats] = useState<SQLMatchTeamStats[]>([]);
  const [statsForm, setStatsForm] = useState<Record<string, Partial<SQLMatchTeamStats>>>({});
  const [statsMatch, setStatsMatch] = useState<SQLMatch | null>(null);

  // New match form
  const [showNewMatchForm, setShowNewMatchForm] = useState(false);
  const [newMatchData, setNewMatchData] = useState({
    home_team_id: '',
    away_team_id: '',
    round_number: 1,
    round_name: '',
    match_date: '',
    location: 'Power Arena',
  });

  // Admin mode - GOD MODE
  const [showNewTeamForm, setShowNewTeamForm] = useState(false);
  const [showNewCompetitionForm, setShowNewCompetitionForm] = useState(false);
  const [newTeamData, setNewTeamData] = useState({
    name: '',
    short_name: '',
    slug: '',
    logo_url: '',
    color: '#3B82F6',
    color_detail: '',
    coach: '',
    stadium: '',
    city: '',
  });
  const [newCompetitionData, setNewCompetitionData] = useState({
    name: '',
    short_name: '',
    year: new Date().getFullYear(),
    type: 'league',
    status: 'active',
    yellow_cards_suspension: 3,
  });

  // Competition editing
  const [editingCompetition, setEditingCompetition] = useState(false);
  const [editCompData, setEditCompData] = useState<Partial<SQLCompetition>>({});

  // ============================
  // EFFECTS
  // ============================
  useEffect(() => {
    document.body.classList.add('control-mode');
    return () => {
      document.body.classList.remove('control-mode');
      if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);
    };
  }, []);

  // Load all competitions and teams globally at mount
  useEffect(() => {
    fetchCompetitions().then(comps => {
      setAllCompetitions(comps);
      // If current selectedCompId doesn't exist, select first available
      if (comps.length > 0 && !comps.find(c => c.id === selectedCompId)) {
        setSelectedCompId(comps[0].id);
      }
    });
    fetchAllTeams().then(setAllTeams);
  }, []);

  // Reset editing states when switching competitions
  useEffect(() => {
    setEditingMatch(null);
    setEditingTeam(null);
    setEditingPlayer(null);
    setStatsMatchId('');
    setStatsForm({});
    setStatsMatch(null);
    setMatchStats([]);
    setEventMatchId('');
    setEditRound(0);
    setShowNewMatchForm(false);
    setEditingCompetition(false);
    setPlayerFilter('all');
  }, [selectedCompId]);

  const reloadGlobals = useCallback(() => {
    fetchCompetitions().then(setAllCompetitions);
    fetchAllTeams().then(setAllTeams);
  }, []);

  const { data, sqlTeams, sqlMatches, sqlPlayers, sqlEvents, isLoading, error, refetch, competition } = tournament;
  const { state, updateState, isOnline, deviceId } = broadcast;

  // ============================
  // AUTO-RECALCULATE (debounced, silent)
  // Fires after any stat-affecting operation.
  // Debounced so rapid changes don't hammer the DB.
  // ============================
  const recalcTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoRecalc = useCallback(() => {
    if (recalcTimerRef.current) clearTimeout(recalcTimerRef.current);
    recalcTimerRef.current = setTimeout(async () => {
      try {
        const result = await recalculateAllStats(selectedCompId || COMPETITION_ID);
        if (result.errors.length > 0) {
          console.warn('[AutoRecalc] Concluído com erros:', result.errors);
          toast('Stats recalculadas (com avisos)', { icon: '⚠️', duration: 2000 });
        } else {
          toast('Stats e classificação atualizadas', { icon: '✓', duration: 1500 });
        }
        refetch();
      } catch (err) {
        console.error('[AutoRecalc] Erro:', err);
        toast.error('Falha ao recalcular stats — veja console');
      }
    }, 1200);
  }, [selectedCompId, refetch]);

  // Synchronize Manager Round with Broadcast Round
  useEffect(() => {
    // Only sync if the admin is actually viewing the matches tab
    // and if the broadcast scene is round-dependent
    const isRoundScene = state.activeScene === 'rounds' || state.activeScene === 'standings' || state.activeScene === 'arena-selection' || state.activeScene === 'selecao-galera' || state.activeScene === 'voting-live';
    
    if (activeTab === 'matches' && isRoundScene) {
      if (state.roundIndex !== editRound) {
        updateState({ roundIndex: editRound });
      }
    }
  }, [editRound, activeTab, state.activeScene, state.roundIndex, updateState]);

  const sortedTeams = useMemo(() =>
    [...sqlTeams].sort((a, b) => a.short_name.localeCompare(b.short_name)),
    [sqlTeams]
  );

  const matchesByRound = useMemo(() => {
    const map: Record<number, SQLMatch[]> = {};
    for (const m of sqlMatches) {
      const r = m.round_number || 1;
      if (!map[r]) map[r] = [];
      map[r].push(m);
    }
    // Sort matches within each round by match_date then by id (stable order — prevents jumping)
    for (const r of Object.keys(map)) {
      map[Number(r)].sort((a, b) => {
        const da = a.match_date || '';
        const db = b.match_date || '';
        if (da !== db) return da.localeCompare(db);
        return (a.id || '').localeCompare(b.id || '');
      });
    }
    return map;
  }, [sqlMatches]);

  const roundNumbers = useMemo(() => Object.keys(matchesByRound).map(Number).sort((a, b) => a - b), [matchesByRound]);

  // Teams not yet in the selected competition (for admin add)
  const teamsNotInComp = useMemo(() => {
    const inComp = new Set(sqlTeams.map(t => t.id));
    return allTeams.filter(t => !inComp.has(t.id));
  }, [allTeams, sqlTeams]);

  // ============================
  // HANDLERS
  // ============================
  const handleSceneChange = useCallback((sceneId: string) => {
    updateState({ activeScene: sceneId });
  }, [updateState]);

  const handleScoreUpdate = useCallback(async (matchId: string, field: 'score_home' | 'score_away', value: string) => {
    const score = value === '' ? null : parseInt(value);
    if (value !== '' && (isNaN(score!) || score! < 0)) return;
    try {
      const update: any = { [field]: score };
      // Auto-finalize: if BOTH scores are now set AND scout is NOT active, auto-mark as finished
      // NEVER auto-finalize a match with active scouting — the scout controls the lifecycle
      const match = sqlMatches.find(m => m.id === matchId);
      const ACTIVE_SCOUT = ['live_half1', 'live_half2', 'halftime', 'pre_game', 'live'];
      if (match && score !== null) {
        const otherScore = field === 'score_home' ? match.score_away : match.score_home;
        if (otherScore !== null && otherScore !== undefined) {
          if (match.status !== 'finished' && !ACTIVE_SCOUT.includes(match.scout_status)) {
            update.status = 'finished';
          }
        }
      }
      await updateMatch(matchId, update);
      refetch();
      autoRecalc();
    } catch (err: any) {
      toast.error(`Erro ao salvar: ${err.message}`);
    }
  }, [sqlMatches, refetch, autoRecalc]);

  const handleStatusUpdate = useCallback(async (matchId: string, status: string) => {
    try {
      await updateMatch(matchId, { status } as any);
      refetch();
      toast.success('Status atualizado');
      autoRecalc();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  }, [refetch, autoRecalc]);

  const handleSaveMatch = useCallback(async () => {
    if (!editingMatch) return;
    try {
      const data = { ...editMatchData } as any;
      // Auto-finalize: if both scores are present AND scout is NOT active, auto-set finished
      // NEVER auto-finalize during active scouting
      const matchObj = sqlMatches.find(m => m.id === editingMatch);
      const activeScout = ['live_half1', 'live_half2', 'halftime', 'pre_game', 'live'];
      if (data.score_home != null && data.score_away != null && data.status !== 'finished') {
        if (!matchObj || !activeScout.includes(matchObj.scout_status)) {
          data.status = 'finished';
        }
      }
      await updateMatch(editingMatch, data);
      setEditingMatch(null);
      refetch();
      toast.success('Partida atualizada');
      autoRecalc();
    } catch (err: any) { toast.error(err.message); }
  }, [editingMatch, editMatchData, refetch, autoRecalc]);

  const handleSaveTeam = useCallback(async () => {
    if (!editingTeam) return;
    try {
      await upsertTeam({ id: editingTeam, ...editTeamData } as any);
      setEditingTeam(null);
      refetch();
      reloadGlobals();
      toast.success('Time atualizado');
    } catch (err: any) { toast.error(err.message); }
  }, [editingTeam, editTeamData, refetch, reloadGlobals]);

  const handleSavePlayer = useCallback(async () => {
    if (!editPlayerData.team_id || !editPlayerData.name) {
      toast.error('Nome e time são obrigatórios');
      return;
    }
    try {
      if (editingPlayer && editingPlayer !== 'new') {
        await upsertPlayer({ id: editingPlayer, ...editPlayerData } as any);
      } else {
        await upsertPlayer(editPlayerData as any);
      }
      setEditingPlayer(null);
      setEditPlayerData({});
      refetch();
      toast.success('Jogador salvo');
    } catch (err: any) { toast.error(err.message); }
  }, [editingPlayer, editPlayerData, refetch]);

  const handleDeletePlayer = useCallback(async (id: string) => {
    if (!confirm('Remover jogador?')) return;
    try {
      await deletePlayer(id);
      refetch();
      toast.success('Jogador removido');
    } catch (err: any) { toast.error(err.message); }
  }, [refetch]);

  const handleAddEvent = useCallback(async () => {
    if (!eventMatchId || !newEvent.player_id || !newEvent.team_id) {
      toast.error('Selecione partida, jogador e time');
      return;
    }
    if (newEvent.event_type === 'substitution' && !newEvent.detail?.player_out_id) {
      toast.error('Substituição precisa de AMBOS jogadores: quem entra E quem sai');
      return;
    }
    try {
      if (newEvent.event_type === 'substitution') {
        // player_id = who ENTERS, detail.player_out_id = who LEAVES
        // Also store player_in_id in detail for MatchFormationView compatibility
        await insertMatchEvent({
          match_id: eventMatchId,
          event_type: 'substitution',
          player_id: newEvent.player_id,
          team_id: newEvent.team_id,
          minute: newEvent.minute,
          half: newEvent.half,
          detail: {
            player_out_id: newEvent.detail?.player_out_id,
            player_in_id: newEvent.player_id, // redundant but needed for formation view
          },
        });
        toast.success('Substituição adicionada');
      } else if (newEvent.event_type === 'second_yellow') {
        // Insert BOTH yellow_card and red_card with detail second_yellow
        await insertMatchEvent({
          match_id: eventMatchId,
          event_type: 'yellow_card',
          player_id: newEvent.player_id,
          team_id: newEvent.team_id,
          minute: newEvent.minute,
          half: newEvent.half,
          detail: {},
        });
        await insertMatchEvent({
          match_id: eventMatchId,
          event_type: 'red_card',
          player_id: newEvent.player_id,
          team_id: newEvent.team_id,
          minute: newEvent.minute,
          half: newEvent.half,
          detail: { reason: 'second_yellow' },
        });
        toast.success('2º Amarelo + Vermelho adicionado');
      } else {
        await insertMatchEvent({ match_id: eventMatchId, ...newEvent });
        toast.success('Evento adicionado');
      }
      setNewEvent({ event_type: 'goal', player_id: '', team_id: '', minute: 0, half: '1T', detail: {} });
      refetch();
      autoRecalc();
    } catch (err: any) { toast.error(err.message); }
  }, [eventMatchId, newEvent, refetch, autoRecalc]);

  const handleDeleteEvent = useCallback(async (id: string) => {
    try {
      await deleteMatchEvent(id);
      refetch();
      toast.success('Evento removido');
      autoRecalc();
    } catch (err: any) { toast.error(err.message); }
  }, [refetch, autoRecalc]);

  // STATS — fetch match directly from DB to avoid stale closure issue
  const loadMatchStats = useCallback(async (matchId: string) => {
    setStatsMatchId(matchId);
    setStatsForm({});
    setStatsMatch(null);
    setStatsLoading(true);
    try {
      const [match, stats] = await Promise.all([
        fetchMatchById(matchId),
        fetchMatchTeamStats(matchId),
      ]);
      setMatchStats(stats);
      if (!match) {
        toast.error('Partida não encontrada no banco');
        setStatsLoading(false);
        return;
      }
      setStatsMatch(match);
      const form: Record<string, Partial<SQLMatchTeamStats>> = {};
      [match.home_team_id, match.away_team_id].forEach(tid => {
        const existing = stats.find(s => s.team_id === tid);
        form[tid] = existing || {
          match_id: matchId,
          team_id: tid,
          possession_pct: 50,
          shots_total: 0,
          shots_on_target: 0,
          shots_off_target: 0,
          shots_blocked: 0,
          saves: 0,
          corners: 0,
          fouls_committed: 0,
          fouls_suffered: 0,
          offsides: 0,
          passes_total: 0,
          passes_completed: 0,
          free_kicks: 0,
          throw_ins: 0,
          goal_kicks: 0,
          yellow_cards: 0,
          red_cards: 0,
        };
      });
      setStatsForm(form);
    } catch (err: any) {
      console.error('loadMatchStats error:', err);
      toast.error(err.message);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const handleSaveStats = useCallback(async () => {
    try {
      for (const [teamId, stats] of Object.entries(statsForm)) {
        await upsertMatchTeamStats({ match_id: statsMatchId, team_id: teamId, ...stats });
      }
      toast.success('Estatísticas salvas');
    } catch (err: any) { toast.error(err.message); }
  }, [statsMatchId, statsForm]);

  const handleCreateMatch = useCallback(async () => {
    if (!newMatchData.home_team_id || !newMatchData.away_team_id) {
      toast.error('Selecione os dois times');
      return;
    }
    if (newMatchData.home_team_id === newMatchData.away_team_id) {
      toast.error('Times devem ser diferentes');
      return;
    }
    try {
      await insertMatch({
        competition_id: selectedCompId,
        home_team_id: newMatchData.home_team_id,
        away_team_id: newMatchData.away_team_id,
        round_number: newMatchData.round_number,
        round_name: newMatchData.round_name || undefined,
        match_date: newMatchData.match_date,
        location: newMatchData.location,
        status: 'scheduled',
        score_home: null,
        score_away: null,
        broadcast: false,
      });
      setNewMatchData({
        home_team_id: '',
        away_team_id: '',
        round_number: 1,
        round_name: '',
        match_date: '',
        location: 'Power Arena',
      });
      setShowNewMatchForm(false);
      refetch();
      toast.success('Partida criada');
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
  }, [newMatchData, refetch, selectedCompId]);

  const handleDeleteMatch = useCallback(async (matchId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta partida? Esta ação não pode ser desfeita.')) return;
    try {
      await deleteMatch(matchId);
      refetch();
      toast.success('Partida excluída');
      autoRecalc();
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
  }, [refetch, autoRecalc]);

  const handleCreateTeam = useCallback(async () => {
    if (!newTeamData.name || !newTeamData.short_name || !newTeamData.slug) {
      toast.error('Preencha nome, sigla e slug');
      return;
    }
    try {
      const team = await insertTeam({
        ...newTeamData,
        slug: newTeamData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      });
      toast.success(`Time ${team.name} criado!`);
      setNewTeamData({ name: '', short_name: '', slug: '', logo_url: '', color: '#3B82F6', color_detail: '', coach: '', stadium: '', city: '' });
      setShowNewTeamForm(false);
      reloadGlobals();
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
  }, [newTeamData, reloadGlobals]);

  const handleDeleteTeam = useCallback(async (teamId: string) => {
    if (!confirm('Tem certeza? Isso excluirá o time e todos os jogadores associados.')) return;
    try {
      await deleteTeam(teamId);
      toast.success('Time excluído');
      reloadGlobals();
      refetch();
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
  }, [refetch, reloadGlobals]);

  const handleCreateCompetition = useCallback(async () => {
    if (!newCompetitionData.name || !newCompetitionData.short_name) {
      toast.error('Preencha nome e sigla');
      return;
    }
    try {
      const comp = await insertCompetition(newCompetitionData);
      toast.success(`Campeonato ${comp.name} criado! Selecionado automaticamente.`);
      setNewCompetitionData({ name: '', short_name: '', year: new Date().getFullYear(), type: 'league', status: 'active', yellow_cards_suspension: 3 });
      setShowNewCompetitionForm(false);
      fetchCompetitions().then(comps => {
        setAllCompetitions(comps);
        setSelectedCompId(comp.id); // auto-switch to new competition
      });
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
  }, [newCompetitionData]);

  const handleDeleteCompetition = useCallback(async (compId: string) => {
    // Block deletion if any match is live
    const liveMatches = sqlMatches.filter(m => m.status === 'live' || m.status === 'in_progress');
    if (liveMatches.length > 0) {
      toast.error('Não é possível excluir um campeonato com partidas ao vivo.');
      return;
    }
    // Extra warning if deleting the active/selected competition
    const isActive = compId === selectedCompId;
    const msg = isActive
      ? 'ATENÇÃO: Este é o campeonato ATIVO exibido no broadcast. Deletar agora deixará a TV em branco. Tem certeza absoluta?'
      : 'Tem certeza? Isso excluirá o campeonato e todas as partidas associadas.';
    if (!confirm(msg)) return;
    try {
      await deleteCompetition(compId);
      toast.success('Campeonato excluído');
      fetchCompetitions().then(comps => {
        setAllCompetitions(comps);
        if (compId === selectedCompId && comps.length > 0) {
          setSelectedCompId(comps[0].id);
        }
      });
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
  }, [selectedCompId, sqlMatches]);

  const handleAddTeamToCompetition = useCallback(async (teamId: string) => {
    try {
      await addTeamToCompetition(selectedCompId, teamId);
      toast.success('Time adicionado ao campeonato');
      refetch();
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
  }, [selectedCompId, refetch]);

  const handleRemoveTeamFromCompetition = useCallback(async (teamId: string) => {
    if (!confirm('Remover time do campeonato?')) return;
    try {
      await removeTeamFromCompetition(selectedCompId, teamId);
      toast.success('Time removido');
      refetch();
    } catch (err: any) { toast.error(`Erro: ${err.message}`); }
  }, [selectedCompId, refetch]);

  const handleSaveCompetition = useCallback(async () => {
    if (!competition) return;
    try {
      await updateCompetition(competition.id, editCompData);
      setEditingCompetition(false);
      refetch();
      reloadGlobals();
      toast.success('Competição atualizada');
    } catch (err: any) { toast.error(err.message); }
  }, [competition, editCompData, refetch, reloadGlobals]);

  const filteredPlayers = useMemo(() => {
    if (playerFilter === 'all') return sqlPlayers;
    return sqlPlayers.filter(p => p.team_id === playerFilter);
  }, [sqlPlayers, playerFilter]);

  const groupedPlayers = useMemo(() => {
    const map: Record<string, SQLPlayer[]> = {};
    for (const p of filteredPlayers) {
      if (!map[p.team_id]) map[p.team_id] = [];
      map[p.team_id].push(p);
    }
    return map;
  }, [filteredPlayers]);

  const matchEventsFiltered = useMemo(() => {
    if (!eventMatchId) return sqlEvents.slice(0, 50);
    return sqlEvents.filter(ev => ev.match_id === eventMatchId);
  }, [sqlEvents, eventMatchId]);

  const currentRoundMatches = matchesByRound[roundNumbers[editRound]] || [];

  if (isLoading) {
    return (
      <div className="h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span className="text-slate-500 font-semibold" style={{ fontFamily: 'Plus Jakarta Sans' }}>Carregando gerenciador...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#f8fafc] text-slate-700 flex overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* ===== SIDEBAR ===== */}
      <aside className="w-16 lg:w-56 flex-shrink-0 flex flex-col h-full" style={{ background: '#ffffff', borderRight: '1px solid #e2e8f0' }}>
        <div className="flex items-center gap-2.5 px-3 py-4 lg:px-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <Settings className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="hidden lg:block min-w-0">
            <div className="text-xs font-bold text-slate-800 truncate" style={{ fontFamily: 'Plus Jakarta Sans' }}>GERENCIADOR</div>
            <div className="text-[9px] text-slate-400 truncate">Arena Força do Vale</div>
          </div>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 px-2 py-2">
          {SIDEBAR_TABS.map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={`flex items-center gap-2.5 px-2.5 py-2.5 rounded-xl text-[11px] font-semibold transition-all ${active ? '' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                style={active ? { background: `${tab.color}12`, color: tab.color, boxShadow: `inset 0 0 0 1px ${tab.color}25` } : {}}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden lg:block truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-2 pb-3 space-y-1.5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${isOnline ? 'text-emerald-600' : 'text-red-500'}`}>
            {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden lg:block">{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button onClick={() => refetch()} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors w-full">
            <RefreshCw className="w-3 h-3" />
            <span className="hidden lg:block">Recarregar</span>
          </button>
          <a href="/tv" target="_blank" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] text-red-500 hover:bg-red-50 transition-colors w-full">
            <Tv className="w-3 h-3" />
            <span className="hidden lg:block">Broadcast</span>
          </a>
        </div>
      </aside>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Top bar with COMPETITION SELECTOR */}
        <header className="flex-shrink-0 flex items-center justify-between px-4 lg:px-6 py-2.5" style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: '#fffbeb', border: '1px solid #f59e0b30' }}>
              <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
              {allCompetitions.length > 0 ? (
                <select
                  value={selectedCompId}
                  onChange={e => setSelectedCompId(e.target.value)}
                  className="text-xs font-bold bg-transparent text-amber-700 outline-none cursor-pointer max-w-[280px]"
                >
                  {allCompetitions.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.year})</option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-amber-600 font-semibold">Nenhum campeonato — crie um na aba Admin</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span>{sqlTeams.length} times</span>
            <span>·</span>
            <span>{sqlMatches.length} jogos</span>
            <span>·</span>
            <span>{sqlPlayers.length} jogadores</span>
            <span>·</span>
            <span>{sqlEvents.length} eventos</span>
          </div>
        </header>

        {error && (
          <div className="mx-4 lg:mx-6 mt-3 flex-shrink-0 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto p-4 lg:p-6 space-y-4">

          {/* ===== DASHBOARD TAB ===== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Stats overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`${glassCard} p-4`} style={glassBg}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Trophy className="w-4 h-4" /></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Campeonato</span>
                  </div>
                  <div className="text-xl font-black text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>{competition?.short_name || 'N/A'}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{competition?.year || '2026'} · {competition?.status === 'active' ? 'Em andamento' : 'Encerrado'}</div>
                </div>
                <div className={`${glassCard} p-4`} style={glassBg}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600"><Users className="w-4 h-4" /></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Times</span>
                  </div>
                  <div className="text-xl font-black text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>{sqlTeams.length}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{sqlPlayers.length} jogadores registrados</div>
                </div>
                <div className={`${glassCard} p-4`} style={glassBg}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><ClipboardList className="w-4 h-4" /></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Partidas</span>
                  </div>
                  <div className="text-xl font-black text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>{sqlMatches.length}</div>
                  <div className="text-[10px] text-slate-400 font-medium">{sqlMatches.filter(m => m.status === 'finished').length} concluídas</div>
                </div>
                <div className={`${glassCard} p-4`} style={glassBg}>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="p-2 rounded-lg bg-amber-50 text-amber-600"><Zap className="w-4 h-4" /></div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gols</span>
                  </div>
                  <div className="text-xl font-black text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>{sqlEvents.filter(e => e.event_type === 'goal').length}</div>
                  <div className="text-[10px] text-slate-400 font-medium">Média de {(sqlEvents.filter(e => e.event_type === 'goal').length / Math.max(sqlMatches.filter(m => m.status === 'finished').length, 1)).toFixed(1)} por jogo</div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Upcoming/Recent Matches */}
                <div className="md:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      Próximos Jogos & Resultados Recentes
                    </h3>
                    <button onClick={() => setActiveTab('matches')} className="text-[10px] font-bold text-emerald-600 hover:underline uppercase">Ver todos</button>
                  </div>
                  <div className="grid gap-3">
                    {sqlMatches
                      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime())
                      .slice(0, 5)
                      .map(m => {
                        const ht = sqlTeams.find(t => t.id === m.home_team_id);
                        const at = sqlTeams.find(t => t.id === m.away_team_id);
                        const isFinished = m.status === 'finished';
                        return (
                          <div key={m.id} className={`${glassCard} p-3 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-pointer`} onClick={() => { setEditingMatch(m.id); setEditMatchData(m); setActiveTab('matches'); }}>
                            <div
                              className="flex items-center gap-3 flex-1 rounded-lg px-1 -mx-1 hover:bg-purple-50 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (ht) {
                                  setEditingTeam(ht.id);
                                  setEditTeamData({ name: ht.name, short_name: ht.short_name, slug: ht.slug, color: ht.color, color_detail: ht.color_detail, coach: ht.coach, president: ht.president, logo_url: ht.logo_url, stadium: ht.stadium, city: ht.city, photo_url: ht.photo_url, badge_url: ht.badge_url });
                                  setActiveTab('admin');
                                }
                              }}
                              title={ht?.name || ''}
                            >
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden">
                                {ht?.logo_url ? <img src={ht.logo_url} className="w-5 h-5 object-contain" /> : <div className="w-4 h-4 bg-slate-200 rounded-full" />}
                              </div>
                              <span className="text-xs font-bold text-slate-700 truncate hover:text-purple-600 transition-colors">{ht?.short_name || '?'}</span>
                            </div>
                            
                            <div className="flex flex-col items-center px-4 min-w-[100px]">
                              {isFinished ? (
                                <div className="flex items-center gap-2 font-black text-slate-900 text-sm" style={{ fontFamily: 'var(--font-mono)' }}>
                                  <span>{m.score_home}</span>
                                  <span className="text-slate-300 font-normal">x</span>
                                  <span>{m.score_away}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase tracking-tight">Agendado</span>
                              )}
                              <span className="text-[9px] text-slate-400 mt-0.5">{m.match_date ? format(new Date(m.match_date), 'dd/MM HH:mm') : 'Data Indefinida'}</span>
                            </div>

                            <div
                              className="flex items-center gap-3 flex-1 justify-end rounded-lg px-1 -mx-1 hover:bg-purple-50 transition-colors cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (at) {
                                  setEditingTeam(at.id);
                                  setEditTeamData({ name: at.name, short_name: at.short_name, slug: at.slug, color: at.color, color_detail: at.color_detail, coach: at.coach, president: at.president, logo_url: at.logo_url, stadium: at.stadium, city: at.city, photo_url: at.photo_url, badge_url: at.badge_url });
                                  setActiveTab('admin');
                                }
                              }}
                              title={at?.name || ''}
                            >
                              <span className="text-xs font-bold text-slate-700 truncate hover:text-purple-600 transition-colors">{at?.short_name || '?'}</span>
                              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden">
                                {at?.logo_url ? <img src={at.logo_url} className="w-5 h-5 object-contain" /> : <div className="w-4 h-4 bg-slate-200 rounded-full" />}
                              </div>
                            </div>
                            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="w-3.5 h-3.5 text-slate-300" />
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                </div>

                {/* Quick Actions & Utils */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Ações Rápidas
                  </h3>
                  <div className="grid gap-2">
                    <a href="/tv" target="_blank" className={`${glassCard} p-3 flex items-center gap-3 hover:bg-red-50 hover:border-red-100 transition-all group`}>
                      <div className="p-2 rounded-lg bg-red-100 text-red-600 group-hover:bg-red-200"><Tv className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Abrir Broadcast TV</div>
                        <div className="text-[10px] text-slate-400">Transmissão em tempo real</div>
                      </div>
                    </a>
                    <a href="/admin/jornal" className={`${glassCard} p-3 flex items-center gap-3 hover:bg-indigo-50 hover:border-indigo-100 transition-all group`}>
                      <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600 group-hover:bg-indigo-200"><Newspaper className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Gerar Versão Impressa</div>
                        <div className="text-[10px] text-slate-400">PDF para jornal da rodada</div>
                      </div>
                    </a>
                    <a href="/admin/narrador" className={`${glassCard} p-3 flex items-center gap-3 hover:bg-amber-50 hover:border-amber-100 transition-all group`}>
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600 group-hover:bg-amber-200"><Radio className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Narrador ao Vivo</div>
                        <div className="text-[10px] text-slate-400">Gols, penaltis e expulsoes em tempo real</div>
                      </div>
                    </a>
                    <button onClick={autoRecalc} title="Seguro — recalcula classificação e stats a partir dos dados reais, sem apagar nada" className={`${glassCard} p-3 flex items-center gap-3 hover:bg-emerald-50 hover:border-emerald-100 transition-all group`}>
                      <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200"><RefreshCw className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Recalcular Tudo</div>
                        <div className="text-[10px] text-slate-400">Seguro — reconstrói tabela e stats</div>
                      </div>
                    </button>
                    <button onClick={() => setActiveTab('arena')} className={`${glassCard} p-3 flex items-center gap-3 hover:bg-purple-50 hover:border-purple-100 transition-all group`}>
                      <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200"><Award className="w-4 h-4" /></div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">Seleção da Rodada</div>
                        <div className="text-[10px] text-slate-400">Definir melhores da semana</div>
                      </div>
                    </button>
                  </div>
                  
                  {/* Top Performers Mini-Table */}
                  <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                    <h4 className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider mb-3">Destaques Individuais</h4>
                    <div className="space-y-2">
                      {/* Top Scorer */}
                      {(() => {
                        const goalsMap: Record<string, number> = {};
                        sqlEvents.filter(e => e.event_type === 'goal').forEach(e => {
                          goalsMap[e.player_id] = (goalsMap[e.player_id] || 0) + 1;
                        });
                        const topScorerId = Object.entries(goalsMap).sort((a, b) => b[1] - a[1])[0]?.[0];
                        const topScorer = sqlPlayers.find(p => p.id === topScorerId);
                        const topScorerTeam = sqlTeams.find(t => t.id === topScorer?.team_id);
                        if (!topScorer) return <div className="text-[10px] text-indigo-400 italic">Nenhum gol registrado</div>;
                        return (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Trophy className="w-3 h-3 text-amber-500" />
                              <span className="text-[11px] font-semibold text-indigo-900">{topScorer.name}</span>
                              <span className="text-[9px] text-indigo-500">({topScorerTeam?.short_name})</span>
                            </div>
                            <span className="text-[11px] font-black text-indigo-900">{goalsMap[topScorerId]} gols</span>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Tips/Alerts */}
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[11px] font-bold text-amber-800">Dica de Gestão</p>
                        <p className="text-[10px] text-amber-700 mt-1 leading-relaxed">
                          Lembre-se de encerrar as partidas como "Finalizado" para que os pontos sejam computados na classificação geral e no bolão.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== BROADCAST TAB ===== */}
          {activeTab === 'broadcast' && (
            <>
              <div ref={containerRef} className={glassCard} style={glassBg}>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Tv className="w-5 h-5 text-emerald-500" />
                      <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Cenas de Broadcast</span>
                    </div>

                    <button
                      onClick={() => updateState({ controllerId: deviceId })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border ${
                        state.controllerId === deviceId 
                          ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm'
                          : 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 animate-pulse'
                      }`}
                    >
                      <Zap className={`w-3 h-3 ${state.controllerId === deviceId ? '' : ''}`} />
                      {state.controllerId === deviceId ? 'CONTROLE ATIVO' : 'ASSUMIR CONTROLE'}
                    </button>
                  </div>
                  
                  {state.controllerId && state.controllerId !== deviceId && (
                    <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center gap-3 text-[11px] text-amber-800 mb-4 shadow-sm backdrop-blur-sm">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold">OUTRA INSTÂNCIA NO CONTROLE</span>
                        <span className="opacity-80">Seus comandos podem não ser refletidos para os outros usuários.</span>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {SCENES.map(scene => {
                      const Icon = scene.icon;
                      const active = state.activeScene === scene.id;
                      return (
                        <button
                          key={scene.id}
                          onClick={() => handleSceneChange(scene.id)}
                          className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl text-[10px] font-semibold transition-all ${active ? 'ring-1' : 'hover:bg-slate-50'}`}
                          style={{
                            background: active ? `${scene.color}12` : 'transparent',
                            color: active ? scene.color : '#64748b',
                            ringColor: active ? `${scene.color}40` : 'transparent',
                          }}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="truncate max-w-full">{scene.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* TV Preview — toggleable */}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-700 transition-colors"
                    >
                      {showPreview ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      Preview ao vivo
                      <ChevronDown className={`w-3 h-3 transition-transform ${showPreview ? 'rotate-180' : ''}`} />
                    </button>
                    <a href="/tv" target="_blank" rel="noopener noreferrer" className="text-[9px] text-emerald-600 font-bold hover:underline flex items-center gap-1">
                      <Tv className="w-3 h-3" /> Abrir /tv
                    </a>
                  </div>
                  {showPreview && (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black" style={{ aspectRatio: '16/9' }}>
                      <iframe
                        src="/tv"
                        className="w-full h-full"
                        style={{ border: 'none', pointerEvents: 'none' }}
                        title="TV Preview"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Context selectors */}
              {(state.activeScene === 'rounds' || state.activeScene === 'standings' || state.activeScene === 'arena-selection' || state.activeScene === 'selecao-galera') && (
                <div className={`p-3 ${glassCard}`} style={glassBg}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Rodada:</span>
                    <button onClick={() => updateState({ roundIndex: Math.max(0, state.roundIndex - 1) })} className="p-1 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                    <span className="text-sm font-bold text-slate-800 px-3 py-1 rounded-lg bg-slate-50 min-w-[80px] text-center">{state.roundIndex + 1}</span>
                    <button onClick={() => updateState({ roundIndex: state.roundIndex + 1 })} className="p-1 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                  </div>
                </div>
              )}

              {state.activeScene === 'team' && (
                <div className={`p-3 ${glassCard}`} style={glassBg}>
                  <span className="text-xs text-slate-500 font-medium block mb-2">Selecionar time:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {sortedTeams.map(t => (
                      <button key={t.id} onClick={() => updateState({ selectedTeamSlug: t.slug })}
                        className={`flex flex-col items-center gap-1 py-2 px-1 rounded-lg text-[10px] transition-all ${state.selectedTeamSlug === t.slug ? 'bg-slate-100 ring-1 ring-emerald-500/30' : 'hover:bg-slate-50'}`}>
                        {t.logo_url && <img src={t.logo_url} alt="" className="w-8 h-8 object-contain" />}
                        <span className="text-slate-600 font-semibold truncate max-w-full">{t.short_name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {state.activeScene === 'mano-a-mano' && (
                <div className={`p-3 ${glassCard}`} style={glassBg}>
                  <div className="grid grid-cols-2 gap-3">
                    {['manoTeam1Slug', 'manoTeam2Slug'].map((key, ki) => (
                      <div key={key}>
                        <span className="text-xs text-slate-500 font-medium block mb-1.5">Time {ki + 1}:</span>
                        <div className="grid grid-cols-4 gap-1">
                          {sortedTeams.map(t => (
                            <button key={t.id} onClick={() => updateState({ [key]: t.slug })}
                              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold ${(state as any)[key] === t.slug ? 'bg-slate-100 ring-1 ring-emerald-500/30 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                              {t.logo_url && <img src={t.logo_url} alt="" className="w-5 h-5 object-contain" />}
                              {t.short_name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(state.activeScene === 'match-detail' || state.activeScene === 'match-replay') && (
                <div className={`p-3 ${glassCard}`} style={glassBg}>
                  <span className="text-xs text-slate-500 font-medium block mb-2">
                    {state.activeScene === 'match-replay' ? '▶ Selecionar partida para Replay:' : 'Selecionar partida:'}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-48 overflow-y-auto">
                    {sqlMatches
                      .filter(m => state.activeScene === 'match-replay' ? m.score_home !== null : true)
                      .map(m => {
                      const ht = sqlTeams.find(t => t.id === m.home_team_id);
                      const at = sqlTeams.find(t => t.id === m.away_team_id);
                      return (
                        <button key={m.id} onClick={() => updateState({ selectedMatchId: m.id })}
                          className={`flex items-center gap-1.5 px-2 py-2 rounded-lg text-[10px] font-semibold ${state.selectedMatchId === m.id ? 'bg-slate-100 ring-1 ring-emerald-500/30 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                          {ht?.logo_url && <img src={ht.logo_url} alt="" className="w-4 h-4 object-contain" />}
                          <span>{ht?.short_name || '?'}</span>
                          <span className="text-slate-400">x</span>
                          <span>{at?.short_name || '?'}</span>
                          {at?.logo_url && <img src={at.logo_url} alt="" className="w-4 h-4 object-contain" />}
                          {m.score_home !== null && <span className="ml-auto text-emerald-600">{m.score_home}-{m.score_away}</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {state.activeScene === 'player' && (
                <div className={`p-3 ${glassCard}`} style={glassBg}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-slate-500 font-medium">Selecionar jogador:</span>
                    <select
                      value={playerTeamFilter}
                      onChange={e => setPlayerTeamFilter(e.target.value)}
                      className="text-[10px] font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 px-2 py-1 outline-none"
                    >
                      <option value="all">Todos os times</option>
                      {sortedTeams.map(t => (
                        <option key={t.id} value={t.id}>{t.short_name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 max-h-64 overflow-y-auto">
                    {sqlPlayers
                      .filter(p => playerTeamFilter === 'all' || p.team_id === playerTeamFilter)
                      .map(p => {
                        const team = sqlTeams.find(t => t.id === p.team_id);
                        return (
                          <button key={p.id} onClick={() => updateState({ selectedPlayerId: p.id })}
                            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold ${state.selectedPlayerId === p.id ? 'bg-slate-100 ring-1 ring-emerald-500/30 text-slate-800' : 'text-slate-500 hover:bg-slate-50'}`}>
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0" style={{ background: `${team?.color || '#3B82F6'}30`, color: team?.color || '#3B82F6' }}>{p.number}</span>
                            <span className="truncate">{p.name}</span>
                          </button>
                        );
                      })
                    }
                  </div>
                </div>
              )}

              {/* Galera scenes — round picker for Arena & Seleção */}
              {(state.activeScene === 'arena-selection' || state.activeScene === 'selecao-galera' || state.activeScene === 'voting-live') && (
                <div className={`p-3 ${glassCard}`} style={glassBg}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Rodada:</span>
                    <button onClick={() => updateState({ roundIndex: Math.max(0, state.roundIndex - 1) })} className="p-1 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4 text-slate-400" /></button>
                    <span className="text-sm font-bold text-slate-800 px-3 py-1 rounded-lg bg-slate-50 min-w-[80px] text-center">{state.roundIndex + 1}</span>
                    <button onClick={() => updateState({ roundIndex: state.roundIndex + 1 })} className="p-1 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4 text-slate-400" /></button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {state.activeScene === 'arena-selection' ? 'Exibe a Seleção do Arena definida pelo admin' : state.activeScene === 'voting-live' ? 'Exibe a votação ao vivo da galera' : 'Exibe a Seleção mais votada pela galera'}
                  </p>
                </div>
              )}

              {/* Bolão / Zebra scenes — force refresh ranking cache */}
              {(state.activeScene === 'bolao-ranking' || state.activeScene === 'zebra') && (
                <div className={`p-3 ${glassCard}`} style={glassBg}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500 font-medium block">Cache do Ranking</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Invalida cache (in-memory + KV) e recalcula do zero
                      </p>
                    </div>
                    <button
                      onClick={async () => {
                        try {
                          toast.loading('Invalidando cache e recalculando ranking...', { id: 'refresh-ranking' });
                          const { refreshRanking, getRankingDetails } = await import('../lib/galera-api');
                          // Force-refresh both ranking AND ranking-details (broadcast)
                          const [result] = await Promise.all([
                            refreshRanking(selectedCompId),
                            getRankingDetails(selectedCompId, true),
                          ]);
                          toast.success(`Ranking atualizado! ${result.ranking?.length || 0} participantes`, { id: 'refresh-ranking' });
                        } catch (err: any) {
                          console.error('[ManagerPanel] refreshRanking error:', err);
                          toast.error(`Erro ao atualizar ranking: ${err.message}`, { id: 'refresh-ranking' });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Forçar Refresh
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          toast.loading('Calculando ranking completo e gerando CSV...', { id: 'export-ranking' });
                          const { getRankingDetails } = await import('../lib/galera-api');
                          const data = await getRankingDetails(selectedCompId, true);
                          const ranking = data.ranking || [];
                          if (ranking.length === 0) {
                            toast.error('Nenhum participante no ranking para exportar.', { id: 'export-ranking' });
                            return;
                          }
                          // Build CSV
                          const BOM = '\uFEFF'; // UTF-8 BOM for Excel
                          const headers = ['Posição', 'Nome', 'Pontos', 'Cravadas (3pts)', 'Acertos (1pt)', 'Total Palpites', 'Cidade', 'User ID'];
                          const rows = ranking.map((r: any, i: number) => [
                            i + 1,
                            `"${(r.display_name || 'Torcedor').replace(/"/g, '""')}"`,
                            r.points || 0,
                            r.exact || 0,
                            r.result || 0,
                            r.total || 0,
                            `"${(r.city || '').replace(/"/g, '""')}"`,
                            r.user_id,
                          ].join(','));
                          const csv = BOM + [headers.join(','), ...rows].join('\n');
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          const dateStr = new Date().toISOString().slice(0, 10);
                          a.download = `ranking-bolao-${dateStr}.csv`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast.success(`CSV exportado! ${ranking.length} participantes`, { id: 'export-ranking' });
                        } catch (err: any) {
                          console.error('[ManagerPanel] exportRanking error:', err);
                          toast.error(`Erro ao exportar: ${err.message}`, { id: 'export-ranking' });
                        }
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Exportar CSV
                    </button>
                  </div>
                </div>
              )}

              {/* Arena Selection — admin defines players when arena-selection scene is active */}
              {state.activeScene === 'arena-selection' && (
                <ArenaSelectionPanel
                  competitionId={selectedCompId}
                  teams={tournament.sqlTeams}
                  players={tournament.sqlPlayers}
                  matches={tournament.sqlMatches}
                />
              )}

              {/* Round Control — always visible in broadcast tab */}
              <RoundControlPanel
                competitionId={selectedCompId}
                matches={tournament.sqlMatches}
              />
            </>
          )}

          {/* ===== MATCHES TAB ===== */}
          {activeTab === 'matches' && (
            <div className="space-y-3">
              <div className={`p-4 ${glassCard}`} style={glassBg}>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Partidas</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowNewMatchForm(!showNewMatchForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Nova Partida
                    </button>
                    <button onClick={() => setEditRound(Math.max(0, editRound - 1))} disabled={editRound === 0} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
                      <ChevronLeft className="w-4 h-4 text-slate-400" />
                    </button>
                    <span className="text-xs font-bold text-slate-800 px-3 py-1.5 rounded-lg bg-slate-50 min-w-[100px] text-center">
                      Rodada {roundNumbers[editRound] || editRound + 1}
                    </span>
                    <button onClick={() => setEditRound(Math.min(roundNumbers.length - 1, editRound + 1))} disabled={editRound >= roundNumbers.length - 1} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30">
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                </div>

                {showNewMatchForm && (
                  <div className="p-3 rounded-xl mb-3 space-y-2" style={{ background: '#f0fdf4', border: '2px solid #10b981' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-800">Criar Nova Partida</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Time Casa</label>
                        <select value={newMatchData.home_team_id} onChange={e => setNewMatchData({...newMatchData, home_team_id: e.target.value})} className={glassInput}>
                          <option value="">Selecione...</option>
                          {sortedTeams.map(t => <option key={t.id} value={t.id}>{t.short_name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Time Visitante</label>
                        <select value={newMatchData.away_team_id} onChange={e => setNewMatchData({...newMatchData, away_team_id: e.target.value})} className={glassInput}>
                          <option value="">Selecione...</option>
                          {sortedTeams.map(t => <option key={t.id} value={t.id}>{t.short_name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Rodada Nº</label>
                        <input type="number" min="1" value={newMatchData.round_number} onChange={e => setNewMatchData({...newMatchData, round_number: parseInt(e.target.value) || 1})} className={glassInput} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Nome Rodada</label>
                        <input type="text" value={newMatchData.round_name} onChange={e => setNewMatchData({...newMatchData, round_name: e.target.value})} className={glassInput} placeholder="Ex: Semifinal" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Data/Hora</label>
                        <input type="datetime-local" value={newMatchData.match_date} onChange={e => setNewMatchData({...newMatchData, match_date: e.target.value})} className={glassInput} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Local</label>
                        <input type="text" value={newMatchData.location} onChange={e => setNewMatchData({...newMatchData, location: e.target.value})} className={glassInput} placeholder="Power Arena" />
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button onClick={handleCreateMatch} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600">
                        <Save className="w-3.5 h-3.5" /> Criar Partida
                      </button>
                      <button onClick={() => setShowNewMatchForm(false)} className="px-3 py-2 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-300">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                {currentRoundMatches.map(match => {
                  const ht = match.home_team || sqlTeams.find(t => t.id === match.home_team_id);
                  const at = match.away_team || sqlTeams.find(t => t.id === match.away_team_id);
                  const isEditing = editingMatch === match.id;

                  return (
                    <div key={match.id} className="p-3 rounded-xl" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                          <span className="text-xs font-bold text-slate-800 truncate">{ht?.short_name || '?'}</span>
                          {ht?.logo_url && <img src={ht.logo_url} alt="" className="w-7 h-7 object-contain flex-shrink-0" />}
                          <div className="w-2 h-7 rounded-full flex-shrink-0" style={{ background: ht?.color || '#3B82F6' }} />
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <input type="number" min="0" value={match.score_home ?? ''} onChange={e => handleScoreUpdate(match.id, 'score_home', e.target.value)}
                            className="w-12 h-9 text-center text-lg font-bold rounded-lg bg-white border border-slate-200 text-slate-800 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                            style={{ fontFamily: 'JetBrains Mono' }} placeholder="-" />
                          <span className="text-slate-600 font-bold text-lg">{'\u00d7'}</span>
                          <input type="number" min="0" value={match.score_away ?? ''} onChange={e => handleScoreUpdate(match.id, 'score_away', e.target.value)}
                            className="w-12 h-9 text-center text-lg font-bold rounded-lg bg-white border border-slate-200 text-slate-800 focus:ring-1 focus:ring-emerald-500/50 outline-none"
                            style={{ fontFamily: 'JetBrains Mono' }} placeholder="-" />
                        </div>

                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-2 h-7 rounded-full flex-shrink-0" style={{ background: at?.color || '#ef4444' }} />
                          {at?.logo_url && <img src={at.logo_url} alt="" className="w-7 h-7 object-contain flex-shrink-0" />}
                          <span className="text-xs font-bold text-slate-800 truncate">{at?.short_name || '?'}</span>
                        </div>

                        <select value={match.status} onChange={e => handleStatusUpdate(match.id, e.target.value)}
                          className="text-[10px] font-semibold rounded-lg bg-white border border-slate-200 text-slate-600 px-2 py-1.5 outline-none">
                          <option value="scheduled">Agendado</option>
                          <option value="live">Ao Vivo</option>
                          <option value="finished">Encerrado</option>
                          <option value="postponed">Adiado</option>
                        </select>

                        <div className="flex items-center gap-1">
                          {match.status === 'scheduled' && (
                            <button onClick={() => handleStatusUpdate(match.id, 'live')} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Iniciar jogo">
                              <Play className="w-3 h-3" />
                            </button>
                          )}
                          {match.status === 'live' && (
                            <button onClick={() => handleStatusUpdate(match.id, 'finished')} className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Finalizar">
                              <Square className="w-3 h-3" />
                            </button>
                          )}
                          <button onClick={() => { setEditingMatch(isEditing ? null : match.id); setMatchSubTab('info'); setEditMatchData({ referee: match.referee || '', attendance: match.attendance, mvp_player_id: match.mvp_player_id, broadcast: match.broadcast, extra_data: match.extra_data }); }}
                            className={`p-1.5 rounded-lg ${isEditing ? 'bg-amber-50 text-amber-600' : 'hover:bg-slate-50 text-slate-500'}`}>
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button onClick={() => handleDeleteMatch(match.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600" title="Excluir partida">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Match meta */}
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-600">
                        <div className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{match.location || '?'}</div>
                        {match.match_date && <div className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{new Date(match.match_date).toLocaleDateString('pt-BR')}</div>}
                        {match.broadcast && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded font-bold">TV</span>}
                        {match.scout_status && match.scout_status !== 'idle' && (
                          <span className={`px-1.5 py-0.5 rounded font-bold ${
                            match.scout_status === 'published' ? 'bg-green-50 text-green-600' :
                            ['live_half1', 'live_half2'].includes(match.scout_status) ? 'bg-red-50 text-red-600' :
                            match.scout_status === 'ended' ? 'bg-amber-50 text-amber-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            🔴 Scout: {match.scout_status === 'published' ? 'Publicado' : match.scout_status === 'ended' ? 'Encerrado' : match.scout_status === 'live_half1' ? '1ºT' : match.scout_status === 'live_half2' ? '2ºT' : match.scout_status}
                          </span>
                        )}
                        {match.referee && <span>Árbitro: {match.referee}</span>}
                      </div>

                      {/* Edit panel with sub-tabs */}
                      {isEditing && (
                        <div className="mt-3 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                          {/* Sub-tab selector */}
                          <div className="flex gap-1 mb-3">
                            {(() => {
                              const evCount = sqlEvents.filter(e => e.match_id === match.id).length;
                              const scoutSt = match.scout_status || 'idle';
                              const scoutPending = scoutSt !== 'idle' && scoutSt !== 'published';
                              return ([
                                { id: 'info' as const, label: 'Detalhes', icon: Edit2, badge: '' },
                                { id: 'lineup' as const, label: 'Escalação', icon: Users, badge: '' },
                                { id: 'events' as const, label: `Eventos${evCount > 0 ? ` (${evCount})` : ''}`, icon: Zap, badge: '' },
                                { id: 'scout' as const, label: 'Olheiros', icon: Radio, badge: scoutPending ? '⚠' : '' },
                              ]).map(tab => {
                                const TabIcon = tab.icon;
                                const isActive = matchSubTab === tab.id;
                                return (
                                  <button
                                    key={tab.id}
                                    onClick={() => setMatchSubTab(tab.id)}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                      isActive
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : tab.badge === '⚠' ? 'text-amber-600 hover:bg-amber-50 border border-amber-200' : 'text-slate-500 hover:bg-slate-50 border border-transparent'
                                  }`}
                                >
                                  <TabIcon className="w-3 h-3" /> {tab.label} {tab.badge}
                                </button>
                                );
                              })
                            })()}
                            <div className="flex items-center gap-1 ml-auto">
                              <button
                                onClick={() => setImportMatchId(match.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold text-violet-600 hover:bg-violet-50 border border-violet-200"
                                title="Colar súmula ou JSON para importar partida"
                              >
                                <FileJson2 className="w-3.5 h-3.5" /> Importar Súmula
                              </button>
                              {/* Legacy prompt copy - hidden, kept for reference
                              <button
                                onClick={() => {
                                  const ht = sqlTeams.find(t => t.id === match.home_team_id);
                                  const at = sqlTeams.find(t => t.id === match.away_team_id);
                                  const homeName = ht?.name || 'MANDANTE';
                                  const awayName = at?.name || 'VISITANTE';
                                  const homeShort = ht?.short_name || homeName;
                                  const awayShort = at?.short_name || awayName;
                                  const formatRoster = (pls: any[]) =>
                                    pls
                                      .sort((a: any, b: any) => (a.number || 0) - (b.number || 0))
                                      .map((p: any) => {
                                        const base = `#${p.number} ${p.name} (${p.position || '?'})`;
                                        return p.real_name ? `${base} — ${p.real_name}` : base;
                                      })
                                      .join('\n');
                                  const homePlayers = sqlPlayers.filter(p => p.team_id === match.home_team_id);
                                  const awayPlayers = sqlPlayers.filter(p => p.team_id === match.away_team_id);
                                  const prompt = `Você converte dados de partida de futebol amador em JSON estruturado.

REGRAS:
- Use EXATAMENTE os APELIDOS do elenco abaixo no JSON.
- O "nome oficial" (após o —) serve APENAS para identificar jogadores quando o texto usa o nome civil.
- Exemplo: texto diz "José Armando fez gol" → no JSON use "ZÉ CABEÇA" (que é o apelido do #8 cujo nome oficial é José Armando).
- Se um nome do texto não bate com nenhum apelido NEM nome oficial do elenco, escreva como está + "[?]".
- Se o minuto não foi informado, use null.
- Dois amarelos para o mesmo jogador = dois eventos yellow_card + suspensions com reason "dois_amarelos".
- Vermelho direto = evento red_card detail "direto" + suspensions com reason "vermelho_direto".
- Retorne SOMENTE o JSON puro. Sem texto, sem markdown.

DADOS DA PARTIDA:
- Mandante: ${homeName}
- Visitante: ${awayName}
- Rodada: ${match.round_number}
- Data: ${match.match_date || 'null'}
- competition_id: ${match.competition_id}

ELENCO ${homeShort}:
${homePlayers.length > 0 ? formatRoster(homePlayers) : '(sem jogadores cadastrados)'}

ELENCO ${awayShort}:
${awayPlayers.length > 0 ? formatRoster(awayPlayers) : '(sem jogadores cadastrados)'}

SCHEMA JSON (retorne exatamente neste formato):
{
  "match_import": {
    "version": "1.0",
    "competition_id": "${match.competition_id}",
    "round_number": ${match.round_number},
    "match_date": "${match.match_date || 'YYYY-MM-DD'}",
    "home_team": { "name": "${homeName}", "score": 0 },
    "away_team": { "name": "${awayName}", "score": 0 },
    "lineups": {
      "home": { "starters": [], "bench": [], "coach": "" },
      "away": { "starters": [], "bench": [], "coach": "" }
    },
    "events": [],
    "suspensions": [],
    "notes": ""
  }
}

Jogador na escalação: { "number": N, "name": "APELIDO", "position": "posição" }
Posições: goleiro, lateral, zagueiro, meia, atacante

Eventos:
- Gol: { "type": "goal", "team": "home"|"away", "player_name": "", "player_number": N, "minute": N|null, "half": 1|2, "detail": "normal"|"penal"|"contra"|"falta" }
- Substituição: { "type": "substitution", "team": "home"|"away", "player_out_name": "", "player_out_number": N, "player_in_name": "", "player_in_number": N, "minute": N|null, "half": 1|2 }
- Amarelo: { "type": "yellow_card", "team": "home"|"away", "player_name": "", "player_number": N, "minute": N|null, "half": 1|2 }
- Vermelho: { "type": "red_card", "team": "home"|"away", "player_name": "", "player_number": N, "minute": N|null, "half": 1|2, "detail": "direto"|"dois_amarelos" }

Suspensões (2 amarelos ou vermelho direto):
{ "player_name": "", "player_number": N, "team": "home"|"away", "reason": "dois_amarelos"|"vermelho_direto", "games_suspended": 1, "next_eligible_round": null, "note": "" }

O material da partida será enviado em seguida. Converta para o JSON acima.`;
                                  navigator.clipboard.writeText(prompt).then(() => {
                                    toast.success('Prompt copiado! Cole no ChatGPT e envie o material da súmula em seguida.');
                                  }).catch(() => {
                                    const ta = document.createElement('textarea');
                                    ta.value = prompt;
                                    ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
                                    document.body.appendChild(ta);
                                    ta.select();
                                    try { document.execCommand('copy'); toast.success('Prompt copiado!'); }
                                    catch { toast.error('Falha ao copiar'); }
                                    document.body.removeChild(ta);
                                  });
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold text-amber-600 hover:bg-amber-50 border border-transparent"
                                title="Copiar prompt para converter súmula em JSON via IA"
                              >
                                <ClipboardCopy className="w-3 h-3" /> Copiar Prompt
                              </button>
                              */}
                            </div>
                          </div>

                          {/* Info sub-tab */}
                          {matchSubTab === 'info' && (
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] text-slate-500 block mb-1">Árbitro</label>
                                <input className={glassInput} value={editMatchData.referee || ''} onChange={e => setEditMatchData(p => ({ ...p, referee: e.target.value }))} placeholder="Nome do árbitro" />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block mb-1">Público</label>
                                <input className={glassInput} type="number" value={editMatchData.attendance ?? ''} onChange={e => setEditMatchData(p => ({ ...p, attendance: e.target.value ? parseInt(e.target.value) : null }))} placeholder="0" />
                              </div>
                              <div>
                                <label className="text-[10px] text-slate-500 block mb-1">MVP</label>
                                <select className={glassInput} value={editMatchData.mvp_player_id || ''} onChange={e => setEditMatchData(p => ({ ...p, mvp_player_id: e.target.value || null }))}>
                                  <option value="">Nenhum</option>
                                  {sqlPlayers.filter(p => p.team_id === match.home_team_id || p.team_id === match.away_team_id).map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>
                              {/* Broadcast toggle + URL */}
                              <div className="col-span-3 flex items-center gap-3 mt-1 p-2 rounded-lg bg-red-50/50 border border-red-100">
                                <label className="flex items-center gap-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={editMatchData.broadcast ?? false}
                                    onChange={e => setEditMatchData(p => ({ ...p, broadcast: e.target.checked }))}
                                    className="accent-red-500 w-3.5 h-3.5"
                                  />
                                  <span className="text-[10px] font-bold text-red-600">Transmissão F7</span>
                                </label>
                                <input
                                  className={glassInput + ' flex-1'}
                                  value={(editMatchData.extra_data as any)?.broadcast_url || ''}
                                  onChange={e => {
                                    const url = e.target.value;
                                    setEditMatchData(p => ({
                                      ...p,
                                      extra_data: { ...(p.extra_data || {}), broadcast_url: url || undefined },
                                    }));
                                  }}
                                  placeholder="Link YouTube/Twitch (live ou gravação)"
                                />
                              </div>
                              <div className="col-span-3 flex gap-2 mt-1">
                                <button onClick={handleSaveMatch} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100">
                                  <Save className="w-3 h-3" /> Salvar
                                </button>
                                <button onClick={() => setEditingMatch(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold hover:bg-slate-100">
                                  <X className="w-3 h-3" /> Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Lineup sub-tab — three-step escalacao editor */}
                          {matchSubTab === 'lineup' && (
                            <MatchLineupEditor
                              matchId={match.id}
                              homeTeamId={match.home_team_id}
                              awayTeamId={match.away_team_id}
                              teams={sqlTeams}
                              players={sqlPlayers}
                              events={sqlEvents}
                              autoRecalc={autoRecalc}
                              matchExtraData={match.extra_data}
                            />
                          )}

                          {/* Events sub-tab — inline event management */}
                          {matchSubTab === 'events' && (() => {
                            const matchEventsHere = sqlEvents.filter(e => e.match_id === match.id);
                            return (
                              <div className="space-y-3">
                                {/* Add event form */}
                                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                                  <div className="text-[10px] font-bold text-slate-700 mb-2">Adicionar evento</div>
                                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-1">Tipo</label>
                                      <select className={glassInput} value={newEvent.event_type} onChange={e => setNewEvent(p => ({ ...p, event_type: e.target.value as any }))}>
                                        <option value="goal">⚽ Gol</option>
                                        <option value="own_goal">⚽ Gol Contra</option>
                                        <option value="penalty_scored">⚽ Pênalti convertido</option>
                                        <option value="penalty_missed">❌ Pênalti perdido</option>
                                        <option value="yellow_card">🟨 Cartão Amarelo</option>
                                        <option value="second_yellow">🟨🟥 2º Amarelo + Vermelho</option>
                                        <option value="red_card">🟥 Cartão Vermelho</option>
                                        <option value="substitution">🔄 Substituição</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-1">Time</label>
                                      <select className={glassInput} value={newEvent.team_id} onChange={e => setNewEvent(p => ({ ...p, team_id: e.target.value, player_id: '' }))}>
                                        <option value="">—</option>
                                        {[match.home_team_id, match.away_team_id].map(tid => {
                                          const t = sqlTeams.find(x => x.id === tid);
                                          return t ? <option key={t.id} value={t.id}>{t.short_name}</option> : null;
                                        })}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="text-[10px] text-slate-500 block mb-1">
                                        {newEvent.event_type === 'substitution' ? '⬅ Jogador que ENTRA' : 'Jogador'}
                                      </label>
                                      <select className={glassInput} value={newEvent.player_id} onChange={e => setNewEvent(p => ({ ...p, player_id: e.target.value }))}>
                                        <option value="">—</option>
                                        {sqlPlayers.filter(p => p.team_id === newEvent.team_id).sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0)).map(p => (
                                          <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-1">Min</label>
                                        <input className={glassInput} type="number" min="0" max="120" value={newEvent.minute} onChange={e => setNewEvent(p => ({ ...p, minute: parseInt(e.target.value) || 0 }))} />
                                      </div>
                                      <div>
                                        <label className="text-[10px] text-slate-500 block mb-1">Tempo</label>
                                        <select className={glassInput} value={newEvent.half} onChange={e => setNewEvent(p => ({ ...p, half: e.target.value }))}>
                                          <option value="1T">1T</option>
                                          <option value="2T">2T</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                  {/* Assist for goals */}
                                  {(newEvent.event_type === 'goal' || newEvent.event_type === 'penalty_scored') && (
                                    <div className="mt-2">
                                      <label className="text-[10px] text-slate-500 block mb-1">Assistência (opcional)</label>
                                      <select className={glassInput + ' !w-auto'} value={newEvent.detail?.assist_player_id || ''} onChange={e => setNewEvent(p => ({ ...p, detail: { ...p.detail, assist_player_id: e.target.value || undefined } }))}>
                                        <option value="">Sem assistência</option>
                                        {sqlPlayers.filter(p => p.team_id === newEvent.team_id).sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0)).map(p => (
                                          <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                  {/* Substitution player out */}
                                  {newEvent.event_type === 'substitution' && (
                                    <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200">
                                      <label className="text-[10px] text-red-600 font-bold block mb-1">➡ Jogador que SAI (obrigatório)</label>
                                      <select className={glassInput + ' !w-auto !border-red-300'} value={newEvent.detail?.player_out_id || ''} onChange={e => setNewEvent(p => ({ ...p, detail: { ...p.detail, player_out_id: e.target.value || undefined } }))}>
                                        <option value="">—</option>
                                        {sqlPlayers.filter(p => p.team_id === newEvent.team_id).sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0)).map(p => (
                                          <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  )}
                                  <button onClick={async () => {
                                    // Inline event add — use this match's ID directly
                                    if (!newEvent.player_id || !newEvent.team_id) {
                                      toast.error('Selecione jogador e time');
                                      return;
                                    }
                                    if (newEvent.event_type === 'substitution' && !newEvent.detail?.player_out_id) {
                                      toast.error('Substituição precisa de AMBOS: quem entra E quem sai');
                                      return;
                                    }
                                    try {
                                      if (newEvent.event_type === 'substitution') {
                                        await insertMatchEvent({
                                          match_id: match.id,
                                          event_type: 'substitution',
                                          player_id: newEvent.player_id,
                                          team_id: newEvent.team_id,
                                          minute: newEvent.minute,
                                          half: newEvent.half,
                                          detail: {
                                            player_out_id: newEvent.detail?.player_out_id,
                                            player_in_id: newEvent.player_id,
                                          },
                                        });
                                        toast.success('Substituição adicionada');
                                      } else if (newEvent.event_type === 'second_yellow') {
                                        await insertMatchEvent({ match_id: match.id, event_type: 'yellow_card', player_id: newEvent.player_id, team_id: newEvent.team_id, minute: newEvent.minute, half: newEvent.half, detail: {} });
                                        await insertMatchEvent({ match_id: match.id, event_type: 'red_card', player_id: newEvent.player_id, team_id: newEvent.team_id, minute: newEvent.minute, half: newEvent.half, detail: { reason: 'second_yellow' } });
                                        toast.success('2º Amarelo + Vermelho adicionado');
                                      } else {
                                        await insertMatchEvent({ match_id: match.id, ...newEvent });
                                        toast.success('Evento adicionado');
                                      }
                                      setNewEvent({ event_type: 'goal', player_id: '', team_id: '', minute: 0, half: '1T', detail: {} });
                                      refetch();
                                      autoRecalc();
                                    } catch (err: any) { toast.error(err.message); }
                                  }} className="mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100">
                                    <Plus className="w-3 h-3" /> Adicionar
                                  </button>
                                </div>

                                {/* Events list for this match — chronological (half then minute) */}
                                {matchEventsHere.length > 0 ? (
                                  <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                                    {[...matchEventsHere]
                                      .sort((a, b) => {
                                        const halfA = a.half === '2T' ? 2 : 1;
                                        const halfB = b.half === '2T' ? 2 : 1;
                                        if (halfA !== halfB) return halfA - halfB;
                                        return (a.minute || 0) - (b.minute || 0);
                                      })
                                      .map(ev => {
                                      const player = ev.player || sqlPlayers.find(p => p.id === ev.player_id);
                                      const team = ev.team || sqlTeams.find(t => t.id === ev.team_id);
                                      const isSecondYellowRed = ev.event_type === 'red_card' && (ev.detail as any)?.reason === 'second_yellow';
                                      const typeLabel = isSecondYellowRed ? '2º Am + Verm' : ev.event_type === 'goal' ? 'Gol' : ev.event_type === 'yellow_card' ? 'Amarelo' : ev.event_type === 'red_card' ? 'Vermelho' : ev.event_type === 'substitution' ? 'Substituição' : ev.event_type === 'own_goal' ? 'Gol Contra' : ev.event_type === 'penalty_scored' ? 'Pênalti' : ev.event_type;
                                      const typeColor = isSecondYellowRed ? '#f97316' : ev.event_type === 'goal' ? '#22c55e' : ev.event_type === 'yellow_card' ? '#eab308' : ev.event_type === 'red_card' ? '#ef4444' : ev.event_type === 'own_goal' ? '#f97316' : ev.event_type === 'substitution' ? '#3b82f6' : '#64748b';
                                      const isEditingThis = editingEventId === ev.id;

                                      if (isEditingThis) {
                                        const edTeamPlayers = sqlPlayers.filter(p => p.team_id === editEventData.team_id).sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0));
                                        return (
                                          <div key={ev.id} className="p-3 rounded-xl border-2 border-emerald-400 bg-emerald-50/50 space-y-2">
                                            <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                                              <div>
                                                <label className="text-[10px] text-slate-500 block mb-0.5">Tipo</label>
                                                <select className={glassInput} value={editEventData.event_type} onChange={e => setEditEventData((p: any) => ({ ...p, event_type: e.target.value }))}>
                                                  <option value="goal">⚽ Gol</option>
                                                  <option value="own_goal">⚽ Gol Contra</option>
                                                  <option value="penalty_scored">⚽ Pênalti</option>
                                                  <option value="penalty_missed">❌ Pênalti perdido</option>
                                                  <option value="yellow_card">🟨 Amarelo</option>
                                                  <option value="red_card">🟥 Vermelho</option>
                                                  <option value="substitution">🔄 Substituição</option>
                                                </select>
                                              </div>
                                              <div>
                                                <label className="text-[10px] text-slate-500 block mb-0.5">Time</label>
                                                <select className={glassInput} value={editEventData.team_id} onChange={e => setEditEventData((p: any) => ({ ...p, team_id: e.target.value, player_id: '' }))}>
                                                  <option value="">—</option>
                                                  {[match.home_team_id, match.away_team_id].map(tid => {
                                                    const t = sqlTeams.find(x => x.id === tid);
                                                    return t ? <option key={t.id} value={t.id}>{t.short_name}</option> : null;
                                                  })}
                                                </select>
                                              </div>
                                              <div>
                                                <label className="text-[10px] text-slate-500 block mb-0.5">
                                                  {editEventData.event_type === 'substitution' ? '⬅ Entra' : 'Jogador'}
                                                </label>
                                                <select className={glassInput} value={editEventData.player_id} onChange={e => setEditEventData((p: any) => ({ ...p, player_id: e.target.value }))}>
                                                  <option value="">—</option>
                                                  {edTeamPlayers.map(p => (
                                                    <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                                                  ))}
                                                </select>
                                              </div>
                                              <div>
                                                <label className="text-[10px] text-slate-500 block mb-0.5">Min</label>
                                                <input className={glassInput} type="number" min="0" max="120" value={editEventData.minute} onChange={e => setEditEventData((p: any) => ({ ...p, minute: parseInt(e.target.value) || 0 }))} />
                                              </div>
                                              <div>
                                                <label className="text-[10px] text-slate-500 block mb-0.5">Tempo</label>
                                                <select className={glassInput} value={editEventData.half} onChange={e => setEditEventData((p: any) => ({ ...p, half: e.target.value }))}>
                                                  <option value="1T">1T</option>
                                                  <option value="2T">2T</option>
                                                </select>
                                              </div>
                                            </div>
                                            {/* Substitution player out */}
                                            {editEventData.event_type === 'substitution' && (
                                              <div className="p-2 rounded-lg bg-red-50 border border-red-200">
                                                <label className="text-[10px] text-red-600 font-bold block mb-0.5">➡ Jogador que SAI</label>
                                                <select className={glassInput + ' !border-red-300'} value={editEventData.detail?.player_out_id || ''} onChange={e => setEditEventData((p: any) => ({ ...p, detail: { ...p.detail, player_out_id: e.target.value || undefined } }))}>
                                                  <option value="">—</option>
                                                  {edTeamPlayers.map(p => (
                                                    <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                                                  ))}
                                                </select>
                                              </div>
                                            )}
                                            {/* Assist for goals */}
                                            {(editEventData.event_type === 'goal' || editEventData.event_type === 'penalty_scored') && (
                                              <div>
                                                <label className="text-[10px] text-slate-500 block mb-0.5">Assistência</label>
                                                <select className={glassInput + ' !w-auto'} value={editEventData.detail?.assist_player_id || ''} onChange={e => setEditEventData((p: any) => ({ ...p, detail: { ...p.detail, assist_player_id: e.target.value || undefined } }))}>
                                                  <option value="">Sem assistência</option>
                                                  {edTeamPlayers.map(p => (
                                                    <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                                                  ))}
                                                </select>
                                              </div>
                                            )}
                                            <div className="flex gap-2 pt-1">
                                              <button onClick={async () => {
                                                try {
                                                  const updates: any = {
                                                    event_type: editEventData.event_type,
                                                    player_id: editEventData.player_id,
                                                    team_id: editEventData.team_id,
                                                    minute: editEventData.minute,
                                                    half: editEventData.half,
                                                    detail: editEventData.detail || {},
                                                  };
                                                  if (editEventData.event_type === 'substitution') {
                                                    updates.detail = {
                                                      ...updates.detail,
                                                      player_in_id: editEventData.player_id,
                                                    };
                                                  }
                                                  await updateMatchEvent(ev.id, updates);
                                                  toast.success('Evento atualizado');
                                                  setEditingEventId(null);
                                                  refetch();
                                                  autoRecalc();
                                                } catch (err: any) { toast.error(err.message); }
                                              }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600">
                                                <Check className="w-3 h-3" /> Salvar
                                              </button>
                                              <button onClick={() => setEditingEventId(null)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold hover:bg-slate-200">
                                                <X className="w-3 h-3" /> Cancelar
                                              </button>
                                              <button onClick={() => { handleDeleteEvent(ev.id); setEditingEventId(null); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-500 text-[10px] font-bold hover:bg-red-100 ml-auto">
                                                <Trash2 className="w-3 h-3" /> Excluir
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      }

                                      return (
                                        <div
                                          key={ev.id}
                                          onClick={() => {
                                            setEditingEventId(ev.id);
                                            setEditEventData({
                                              event_type: ev.event_type,
                                              player_id: ev.player_id,
                                              team_id: ev.team_id,
                                              minute: ev.minute,
                                              half: ev.half,
                                              detail: ev.detail || {},
                                            });
                                          }}
                                          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-50 group transition-colors"
                                          style={{ background: '#fff', border: '1px solid #e2e8f0' }}
                                          title="Clique para editar"
                                        >
                                          <span className="text-[11px] font-bold text-slate-500 w-10 text-right flex-shrink-0" style={{ fontFamily: 'JetBrains Mono' }}>{ev.minute}'</span>
                                          <span className="text-[9px] text-slate-400 flex-shrink-0 w-5">{ev.half}</span>
                                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${typeColor}15`, color: typeColor }}>{typeLabel}</span>
                                          {ev.event_type === 'substitution' ? (
                                            <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1 truncate">
                                              <span className="text-green-600">⬅</span> {player?.name || '?'}
                                              {ev.detail?.player_out_id && (() => {
                                                const pOut = sqlPlayers.find(p => p.id === ev.detail.player_out_id);
                                                return pOut ? <><span className="text-red-400 ml-1">➡</span> <span className="text-slate-500">{pOut.name}</span></> : null;
                                              })()}
                                            </span>
                                          ) : (
                                            <span className="text-[11px] font-semibold text-slate-800 truncate">{player?.name || '?'}</span>
                                          )}
                                          <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                                            {team?.logo_url && <img src={team.logo_url} alt="" className="w-4 h-4 object-contain" />}
                                            <Edit2 className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-center py-6 text-slate-500 text-xs">
                                    Nenhum evento registrado nesta partida
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Scout sub-tab — inline scout management */}
                          {matchSubTab === 'scout' && (
                            <div>
                              <ScoutTokensPanel
                                matchId={match.id}
                                matchInfo={{
                                  home_team: ht ? { id: ht.id, short_name: ht.short_name, name: ht.name, logo_url: ht.logo_url } : undefined,
                                  away_team: at ? { id: at.id, short_name: at.short_name, name: at.name, logo_url: at.logo_url } : undefined,
                                  round: match.round_number,
                                  match_date: match.match_date,
                                  scout_status: match.scout_status || 'idle',
                                }}
                                competitionId={selectedCompId}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                {currentRoundMatches.length === 0 && (
                  <div className="text-center py-12 text-slate-600 text-sm">Nenhuma partida nesta rodada</div>
                )}
              </div>
            </div>

            {/* === EVENTOS DE JOGO — agora integrados dentro de cada partida (sub-tab "Eventos") === */}
            {/* Se precisar da vista consolidada, use o filtro abaixo: */}
            <div className={`p-3 ${glassCard}`} style={glassBg}>
              <details className="group">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-500 hover:text-slate-700 py-1">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-xs">Vista consolidada de eventos (clique para expandir)</span>
                </summary>
                <div className="mt-3">

              {/* Match selector */}
              <div className="mb-3">
                <label className="text-[10px] text-slate-500 block mb-1">Selecionar partida:</label>
                <select className={glassInput} value={eventMatchId} onChange={e => setEventMatchId(e.target.value)}>
                  <option value="">Todas as partidas</option>
                  {sqlMatches.map(m => {
                    const ht = sqlTeams.find(t => t.id === m.home_team_id);
                    const at = sqlTeams.find(t => t.id === m.away_team_id);
                    return <option key={m.id} value={m.id}>R{m.round_number} — {ht?.short_name} x {at?.short_name} {m.score_home !== null ? `(${m.score_home}-${m.score_away})` : ''}</option>;
                  })}
                </select>
              </div>

              {/* New event form */}
              {eventMatchId && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <div className="text-xs font-bold text-slate-800 mb-2">Adicionar evento</div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Tipo</label>
                      <select className={glassInput} value={newEvent.event_type} onChange={e => setNewEvent(p => ({ ...p, event_type: e.target.value as any }))}>
                        <option value="goal">⚽ Gol</option>
                        <option value="own_goal">⚽ Gol Contra</option>
                        <option value="penalty_scored">⚽ Pênalti convertido</option>
                        <option value="penalty_missed">❌ Pênalti perdido</option>
                        <option value="yellow_card">🟨 Cartão Amarelo</option>
                        <option value="second_yellow">🟨🟥 2º Amarelo + Vermelho</option>
                        <option value="red_card">🟥 Cartão Vermelho</option>
                        <option value="substitution">🔄 Substituição</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Time</label>
                      <select className={glassInput} value={newEvent.team_id} onChange={e => setNewEvent(p => ({ ...p, team_id: e.target.value, player_id: '' }))}>
                        <option value="">—</option>
                        {(() => { const m = sqlMatches.find(x => x.id === eventMatchId); return m ? [m.home_team_id, m.away_team_id].map(tid => { const t = sqlTeams.find(x => x.id === tid); return t ? <option key={t.id} value={t.id}>{t.short_name}</option> : null; }) : null; })()}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">
                        {newEvent.event_type === 'substitution' ? '⬅ Jogador que ENTRA' : 'Jogador'}
                      </label>
                      <select className={glassInput} value={newEvent.player_id} onChange={e => setNewEvent(p => ({ ...p, player_id: e.target.value }))}>
                        <option value="">—</option>
                        {sqlPlayers.filter(p => p.team_id === newEvent.team_id).sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0)).map(p => (
                          <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Minuto</label>
                      <input className={glassInput} type="number" min="0" max="120" value={newEvent.minute} onChange={e => setNewEvent(p => ({ ...p, minute: parseInt(e.target.value) || 0 }))} />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Tempo</label>
                      <select className={glassInput} value={newEvent.half} onChange={e => setNewEvent(p => ({ ...p, half: e.target.value }))}>
                        <option value="1T">1º Tempo</option>
                        <option value="2T">2º Tempo</option>
                      </select>
                    </div>
                  </div>
                  {/* Assist for goals */}
                  {(newEvent.event_type === 'goal' || newEvent.event_type === 'penalty_scored') && (
                    <div className="mt-2">
                      <label className="text-[10px] text-slate-500 block mb-1">Assistência (opcional)</label>
                      <select className={glassInput + ' !w-auto'} value={newEvent.detail?.assist_player_id || ''} onChange={e => setNewEvent(p => ({ ...p, detail: { ...p.detail, assist_player_id: e.target.value || undefined } }))}>
                        <option value="">Sem assistência</option>
                        {sqlPlayers.filter(p => p.team_id === newEvent.team_id).sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0)).map(p => (
                          <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {newEvent.event_type === 'substitution' && (
                    <div className="mt-2 p-2 rounded-lg bg-red-50 border border-red-200">
                      <label className="text-[10px] text-red-600 font-bold block mb-1">➡ Jogador que SAI (obrigatório)</label>
                      <select className={glassInput + ' !w-auto !border-red-300'} value={newEvent.detail?.player_out_id || ''} onChange={e => setNewEvent(p => ({ ...p, detail: { ...p.detail, player_out_id: e.target.value || undefined } }))}>
                        <option value="">—</option>
                        {sqlPlayers.filter(p => p.team_id === newEvent.team_id).sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0)).map(p => (
                          <option key={p.id} value={p.id}>#{p.number} {p.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <button onClick={handleAddEvent} className="mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100">
                    <Plus className="w-3 h-3" /> Adicionar
                  </button>
                </div>
              )}

              {/* Events list — sorted chronologically */}
              {matchEventsFiltered.length > 0 ? (
                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                  {[...matchEventsFiltered].sort((a, b) => {
                    const halfA = a.half === '2T' ? 2 : 1;
                    const halfB = b.half === '2T' ? 2 : 1;
                    if (halfA !== halfB) return halfA - halfB;
                    return (a.minute || 0) - (b.minute || 0);
                  }).map(ev => {
                    const player = ev.player || sqlPlayers.find(p => p.id === ev.player_id);
                    const team = ev.team || sqlTeams.find(t => t.id === ev.team_id);
                    const isSecondYellowRed = ev.event_type === 'red_card' && (ev.detail as any)?.reason === 'second_yellow';
                    const typeLabel = isSecondYellowRed ? '2º Am + Verm' : ev.event_type === 'goal' ? 'Gol' : ev.event_type === 'yellow_card' ? 'Amarelo' : ev.event_type === 'red_card' ? 'Vermelho' : ev.event_type === 'substitution' ? 'Substituição' : ev.event_type === 'own_goal' ? 'Gol Contra' : ev.event_type;
                    const typeColor = isSecondYellowRed ? '#f97316' : ev.event_type === 'goal' ? '#22c55e' : ev.event_type === 'yellow_card' ? '#eab308' : ev.event_type === 'red_card' ? '#ef4444' : ev.event_type === 'own_goal' ? '#f97316' : '#3b82f6';

                    return (
                      <div key={ev.id} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <span className="text-xs font-bold px-2 py-0.5 rounded" style={{ background: `${typeColor}15`, color: typeColor }}>{typeLabel}</span>
                        {ev.event_type === 'substitution' ? (
                          <span className="text-[11px] font-semibold text-slate-800 flex items-center gap-1">
                            <span className="text-green-600">⬅</span> {player?.name || '?'}
                            {ev.detail?.player_out_id && (() => {
                              const pOut = sqlPlayers.find(p => p.id === ev.detail.player_out_id);
                              return pOut ? <><span className="text-red-400 ml-1">➡</span> <span className="text-slate-500">{pOut.name}</span></> : null;
                            })()}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-slate-800">{player?.name || '?'}</span>
                        )}
                        <span className="text-[10px] text-slate-500">{ev.minute}' ({ev.half})</span>
                        <div className="flex items-center gap-1 ml-auto">
                          {team?.logo_url && <img src={team.logo_url} alt="" className="w-4 h-4 object-contain" />}
                          <span className="text-[10px] text-slate-500">{team?.short_name}</span>
                        </div>
                        <button onClick={() => handleDeleteEvent(ev.id)} className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-500">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-600">
                  <Zap className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                  <div className="text-sm font-semibold">Nenhum evento registrado</div>
                  <div className="text-xs mt-1">Abra a partida → aba Eventos para adicionar</div>
                </div>
              )}
                </div>
              </details>
            </div>

            {/* === ESTATÍSTICAS DO JOGO (moved from Stats tab) === */}
            <div className={`p-4 ${glassCard}`} style={glassBg}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Estatísticas do Jogo</span>
                </div>
              </div>

              <div className="mb-3">
                <label className="text-[10px] text-slate-500 block mb-1">Selecionar partida:</label>
                <select className={glassInput} value={statsMatchId} onChange={e => {
                  if (e.target.value) loadMatchStats(e.target.value);
                  else { setStatsMatchId(''); setStatsForm({}); setStatsMatch(null); }
                }}>
                  <option value="">Selecione...</option>
                  {sqlMatches.map(m => {
                    const ht = sqlTeams.find(t => t.id === m.home_team_id);
                    const at = sqlTeams.find(t => t.id === m.away_team_id);
                    return <option key={m.id} value={m.id}>R{m.round_number} — {ht?.short_name} {m.score_home ?? '?'} x {m.score_away ?? '?'} {at?.short_name} ({m.status})</option>;
                  })}
                </select>
              </div>

              {statsMatchId && statsMatch && Object.keys(statsForm).length > 0 && (() => {
                const statFields = [
                  { key: 'possession_pct', label: 'Posse (%)', max: 100 },
                  { key: 'shots_total', label: 'Finalizações', max: 50 },
                  { key: 'shots_on_target', label: 'No gol', max: 50 },
                  { key: 'shots_off_target', label: 'Fora do gol', max: 50 },
                  { key: 'shots_blocked', label: 'Bloqueadas', max: 30 },
                  { key: 'saves', label: 'Defesas', max: 30 },
                  { key: 'corners', label: 'Escanteios', max: 30 },
                  { key: 'fouls_committed', label: 'Faltas cometidas', max: 50 },
                  { key: 'fouls_suffered', label: 'Faltas sofridas', max: 50 },
                  { key: 'offsides', label: 'Impedimentos', max: 20 },
                  { key: 'passes_total', label: 'Passes totais', max: 1000 },
                  { key: 'passes_completed', label: 'Passes completos', max: 1000 },
                  { key: 'free_kicks', label: 'Tiros livres', max: 30 },
                  { key: 'throw_ins', label: 'Laterais', max: 100 },
                  { key: 'goal_kicks', label: 'Tiros de meta', max: 50 },
                  { key: 'yellow_cards', label: 'Amarelos', max: 20 },
                  { key: 'red_cards', label: 'Vermelhos', max: 5 },
                ];

                const homeTeam = statsMatch.home_team || sqlTeams.find(t => t.id === statsMatch.home_team_id);
                const awayTeam = statsMatch.away_team || sqlTeams.find(t => t.id === statsMatch.away_team_id);
                return (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center p-2 rounded-lg bg-slate-50">
                      <div className="flex items-center gap-2">
                        {homeTeam?.logo_url && <img src={homeTeam.logo_url} alt="" className="w-6 h-6 object-contain" />}
                        <span className="text-xs font-bold text-slate-800">{homeTeam?.short_name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold text-center">vs</div>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-xs font-bold text-slate-800">{awayTeam?.short_name}</span>
                        {awayTeam?.logo_url && <img src={awayTeam.logo_url} alt="" className="w-6 h-6 object-contain" />}
                      </div>
                    </div>

                    <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                      {statFields.map(sf => (
                        <div key={sf.key} className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                          <input type="number" min="0" max={sf.max} className={glassInput + ' text-center text-xs'} value={(statsForm[statsMatch.home_team_id] as any)?.[sf.key] ?? 0}
                            onChange={e => setStatsForm(f => ({ ...f, [statsMatch.home_team_id]: { ...f[statsMatch.home_team_id], [sf.key]: parseInt(e.target.value) || 0 } }))} />
                          <span className="text-[10px] text-slate-500 font-semibold w-32 text-center">{sf.label}</span>
                          <input type="number" min="0" max={sf.max} className={glassInput + ' text-center text-xs'} value={(statsForm[statsMatch.away_team_id] as any)?.[sf.key] ?? 0}
                            onChange={e => setStatsForm(f => ({ ...f, [statsMatch.away_team_id]: { ...f[statsMatch.away_team_id], [sf.key]: parseInt(e.target.value) || 0 } }))} />
                        </div>
                      ))}
                    </div>

                    <button onClick={handleSaveStats} className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors mt-3">
                      <Save className="w-4 h-4" /> Salvar estatísticas
                    </button>
                  </div>
                );
              })()}

              {statsMatchId && statsLoading && (
                <div className="text-center py-12 text-slate-600">
                  <RefreshCw className="w-10 h-10 mx-auto mb-2 text-slate-700 animate-spin" />
                  <div className="text-sm font-semibold">Carregando estatísticas...</div>
                </div>
              )}

              {statsMatchId && !statsLoading && Object.keys(statsForm).length === 0 && (
                <div className="text-center py-12 text-slate-600">
                  <AlertCircle className="w-10 h-10 mx-auto mb-2 text-amber-500" />
                  <div className="text-sm font-semibold">Erro ao carregar dados</div>
                  <div className="text-xs mt-1">Tente selecionar a partida novamente</div>
                </div>
              )}

              {!statsMatchId && (
                <div className="text-center py-12 text-slate-600">
                  <BarChart3 className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                  <div className="text-sm font-semibold">Selecione uma partida</div>
                  <div className="text-xs mt-1">Preencha posse de bola, finalizações, escanteios e mais</div>
                </div>
              )}
            </div>

            {/* Auto-recalc indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200/50">
              <Zap className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] text-emerald-600">Estatísticas recalculam automaticamente ao salvar</span>
            </div>
            </div>
          )}

          {/* ===== PLAYERS TAB ===== */}
          {activeTab === 'players' && (
            <div className={`p-4 ${glassCard}`} style={glassBg}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Jogadores ({filteredPlayers.length})</span>
                <div className="flex items-center gap-2">
                  <select value={playerFilter} onChange={e => setPlayerFilter(e.target.value)} className={glassInput + ' !w-auto'}>
                    <option value="all">Todos</option>
                    {sortedTeams.map(t => <option key={t.id} value={t.id}>{t.short_name}</option>)}
                  </select>
                  <button onClick={() => { setEditingPlayer('new'); setEditPlayerData({ team_id: playerFilter !== 'all' ? playerFilter : sortedTeams[0]?.id || '', name: '', number: '', position: 'Meio-campo' }); }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100">
                    <Plus className="w-3 h-3" /> Novo
                  </button>
                </div>
              </div>

              {/* New/Edit player form */}
              {editingPlayer && (
                <div className="mb-4 p-3 rounded-xl" style={{ background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                  <div className="text-xs font-bold text-slate-800 mb-2">{editingPlayer === 'new' ? 'Novo jogador' : 'Editar jogador'}</div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    <div><label className="text-[10px] text-slate-500 block mb-1">Nome (apelido) *</label><input className={glassInput} value={editPlayerData.name || ''} onChange={e => setEditPlayerData(p => ({ ...p, name: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-slate-500 block mb-1">Nome Oficial (Súmula)</label><input className={glassInput} placeholder="Nome completo conforme RG" value={editPlayerData.real_name || ''} onChange={e => setEditPlayerData(p => ({ ...p, real_name: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-slate-500 block mb-1">Número</label><input className={glassInput} value={editPlayerData.number || ''} onChange={e => setEditPlayerData(p => ({ ...p, number: e.target.value }))} /></div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Posição</label>
                      <select className={glassInput} value={editPlayerData.position || ''} onChange={e => setEditPlayerData(p => ({ ...p, position: e.target.value }))}>
                        <option value="Goleiro">Goleiro</option>
                        <option value="Zagueiro">Zagueiro</option>
                        <option value="Lateral">Lateral</option>
                        <option value="Meio-campo">Meio-campo</option>
                        <option value="Atacante">Atacante</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-500 block mb-1">Time *</label>
                      <select className={glassInput} value={editPlayerData.team_id || ''} onChange={e => setEditPlayerData(p => ({ ...p, team_id: e.target.value }))}>
                        {sortedTeams.map(t => <option key={t.id} value={t.id}>{t.short_name}</option>)}
                      </select>
                    </div>
                    <div><ImageUpload compact label="Foto" value={editPlayerData.photo_url || ''} onChange={url => setEditPlayerData(p => ({ ...p, photo_url: url }))} /></div>
                    <div><label className="text-[10px] text-slate-500 block mb-1">Data nasc.</label><input className={glassInput} type="date" value={editPlayerData.birth_date || ''} onChange={e => setEditPlayerData(p => ({ ...p, birth_date: e.target.value }))} /></div>
                    <div><label className="text-[10px] text-slate-500 block mb-1">Altura (cm)</label><input className={glassInput} type="number" value={editPlayerData.height_cm || ''} onChange={e => setEditPlayerData(p => ({ ...p, height_cm: parseInt(e.target.value) || undefined }))} /></div>
                    <div><label className="text-[10px] text-slate-500 block mb-1">Pé dom.</label>
                      <select className={glassInput} value={editPlayerData.dominant_foot || ''} onChange={e => setEditPlayerData(p => ({ ...p, dominant_foot: e.target.value }))}>
                        <option value="">—</option><option value="right">Destro</option><option value="left">Canhoto</option><option value="both">Ambidestro</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={handleSavePlayer} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-bold hover:bg-emerald-100"><Save className="w-3 h-3" /> Salvar</button>
                    <button onClick={() => { setEditingPlayer(null); setEditPlayerData({}); }} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-500 text-[10px] font-bold hover:bg-slate-100"><X className="w-3 h-3" /> Cancelar</button>
                  </div>
                </div>
              )}

              {Object.entries(groupedPlayers).sort(([a], [b]) => {
                const ta = sqlTeams.find(t => t.id === a)?.short_name || '';
                const tb = sqlTeams.find(t => t.id === b)?.short_name || '';
                return ta.localeCompare(tb);
              }).map(([teamId, players]) => {
                const team = sqlTeams.find(t => t.id === teamId);
                return (
                  <div key={teamId} className="mb-4">
                    <div className="flex items-center gap-2 mb-2 pb-1" style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <div className="w-2 h-5 rounded-full" style={{ background: team?.color || '#3B82F6' }} />
                      {team?.logo_url && <img src={team.logo_url} alt="" className="w-5 h-5 object-contain" />}
                      <span className="text-xs font-bold text-slate-700">{team?.short_name || teamId}</span>
                      <span className="text-[10px] text-slate-500">({players.length})</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
                      {players.sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0)).map(p => (
                        <div key={p.id} className="flex items-center gap-2 p-2 rounded-lg group hover:bg-slate-50" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0" style={{ background: `${team?.color || '#3B82F6'}30`, color: team?.color || '#3B82F6' }}>
                            {p.number}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-bold text-slate-800 truncate">{p.name}</div>
                            {p.real_name && <div className="text-[9px] text-slate-400 truncate">{p.real_name}</div>}
                            <div className="text-[9px] text-slate-500">{p.position || 'Jogador'}</div>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => { setEditingPlayer(p.id); setEditPlayerData({ ...p }); }}
                              className="p-1 rounded hover:bg-slate-100 text-slate-500"><Edit2 className="w-2.5 h-2.5" /></button>
                            <button onClick={() => handleDeletePlayer(p.id)}
                              className="p-1 rounded hover:bg-red-50 text-slate-500 hover:text-red-500"><Trash2 className="w-2.5 h-2.5" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {filteredPlayers.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <UserPlus className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                  <div className="text-sm font-semibold">Nenhum jogador</div>
                </div>
              )}
            </div>
          )}

          {/* Events and Stats tabs removed — content moved to Matches tab */}
          {/* Discipline manual removed — content moved to Regulations tab */}

          {/* Selections tab removed — ArenaSelection now inside Broadcast (arena-selection scene) */}

          {/* ===== REGULATIONS TAB (was Discipline + manual discipline from Stats) ===== */}
          {activeTab === 'regulations' && (
            <div className="space-y-4">
              <CompetitionRulesPanel competitionId={selectedCompId} />
              <DisciplinePanel
                competitionId={selectedCompId}
                players={tournament.sqlPlayers}
                teams={tournament.sqlTeams}
                currentRound={Math.max(...(tournament.sqlMatches || []).filter((m: any) => m.status === 'finished').map((m: any) => m.round_number || 0), 1)}
              />

              {/* === DISCIPLINA MANUAL (moved from Stats tab) === */}
              <div className={`p-4 ${glassCard}`} style={glassBg}>
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Disciplina por Time</span>
                  <span className="text-[10px] text-slate-400 ml-auto">AM×10 + VM×50</span>
                </div>
                <p className="text-[10px] text-slate-500 mb-3">Insira manualmente os pontos de disciplina (Art.78 LEEA). Se preenchido (&gt;0), sobrescreve o cálculo automático dos eventos.</p>
                {sortedTeams.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">Nenhum time no campeonato</div>
                ) : (
                  <div className="space-y-2">
                    {sortedTeams.map(team => (
                      <div key={team.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                        {team.logo_url && <img src={team.logo_url} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                        <span className="text-xs font-bold text-slate-700 flex-1 min-w-0 truncate">{team.short_name}</span>
                        <input
                          type="number"
                          min="0"
                          className={glassInput + ' !w-20 text-center text-xs font-mono'}
                          placeholder="0"
                          defaultValue={team.discipline_points || ''}
                          onBlur={async (e) => {
                            const val = parseInt(e.target.value) || 0;
                            try {
                              await updateTeam(team.id, { discipline_points: val });
                              toast.success(`${team.short_name}: ${val} pts`);
                              refetch();
                              autoRecalc();
                            } catch (err: any) { toast.error(err.message); }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                          }}
                        />
                        <span className="text-[10px] text-slate-400 w-6">pts</span>
                      </div>
                    ))}
                    <button
                      onClick={async () => {
                        if (!confirm('Zerar disciplina de todos os times?')) return;
                        try {
                          for (const team of sortedTeams) {
                            await updateTeam(team.id, { discipline_points: 0 });
                          }
                          toast.success('Disciplina zerada');
                          refetch();
                          autoRecalc();
                        } catch (err: any) { toast.error(err.message); }
                      }}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-colors mt-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Zerar todos
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== SCOUT TAB (Olheiros ao Vivo) ===== */}
          {activeTab === 'scout' && (
            <div className="space-y-4">
              {/* ⚠️ SESSÕES ATIVAS — mostrar apenas partidas com scout ao vivo ou encerrado sem publicar */}
              {(() => {
                const allM = (tournament.sqlMatches || []) as any[];
                const pendingM = allM.filter((m: any) =>
                  m.scout_status && ['live_half1', 'halftime', 'live_half2', 'ended'].includes(m.scout_status)
                );
                if (pendingM.length === 0) return null;
                return (
                  <div className={`p-4 ${glassCard}`} style={{ ...glassBg, background: '#fffbeb', borderColor: '#fbbf24' }}>
                    <h3 className="text-sm font-bold text-amber-800 mb-3 flex items-center gap-2" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      {pendingM.length} Sessão(ões) de Scout Ativa(s)
                    </h3>
                    <p className="text-xs text-amber-700 mb-3">
                      Estas partidas têm scouting ao vivo ou encerrado sem publicar. Publique os dados ou resete se necessário.
                    </p>
                    <div className="space-y-2">
                      {pendingM.map((m: any) => {
                        const hTeam = tournament.sqlTeams.find((t: any) => t.id === m.home_team_id);
                        const aTeam = tournament.sqlTeams.find((t: any) => t.id === m.away_team_id);
                        const stLabel = m.scout_status === 'ended' ? 'Encerrado' : m.scout_status === 'live_half1' ? '1ºT Ao Vivo' : m.scout_status === 'live_half2' ? '2ºT Ao Vivo' : m.scout_status === 'halftime' ? 'Intervalo' : m.scout_status === 'pre_game' ? 'Pré-Jogo' : m.scout_status;
                        return (
                          <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-amber-200">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {hTeam?.logo_url && <img src={hTeam.logo_url} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                              <span className="text-xs font-bold text-slate-800 truncate">{hTeam?.short_name || '?'} × {aTeam?.short_name || '?'}</span>
                              {aTeam?.logo_url && <img src={aTeam.logo_url} alt="" className="w-6 h-6 object-contain flex-shrink-0" />}
                              <span className="text-[10px] text-slate-500 flex-shrink-0">R{m.round_number}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 flex-shrink-0">{stLabel}</span>
                            <button
                              onClick={async () => {
                                if (!confirm(`Resetar scouting de ${hTeam?.short_name} × ${aTeam?.short_name}?\n\nTokens serão desativados, status volta para "Aguardando".\nEventos do scout NÃO são apagados.`)) return;
                                try {
                                  const res = await resetScout(m.id);
                                  if (res.success) {
                                    toast.success(`Scout resetado: ${hTeam?.short_name} × ${aTeam?.short_name}`);
                                    refetch();
                                  } else {
                                    toast.error(res.error || 'Erro ao resetar');
                                  }
                                } catch (e: any) { toast.error('Erro: ' + e.message); }
                              }}
                              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 border border-red-200 flex-shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> Resetar
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              <div className={`p-4 ${glassCard}`} style={glassBg}>
                <h3 className="text-sm font-bold text-slate-800 mb-3" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  🔴 Olheiros ao Vivo — Tokens por Partida
                </h3>
                <p className="text-xs text-slate-500 mb-4">
                  Gere tokens de acesso para os olheiros. Cada partida gera 1 token.
                  Precisa de mais? Use o bot\u00e3o "+1 Olheiro" dentro de cada jogo.
                </p>

                {/* List matches with scout controls */}
                {(() => {
                  const allMatches = (tournament.sqlMatches || []) as any[];
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayEnd = new Date(today);
                  todayEnd.setHours(23, 59, 59, 999);

                  // 1. Jogos de HOJE (qualquer status)
                  const todayMatches = allMatches.filter((m: any) => {
                    if (!m.match_date) return false;
                    const d = new Date(m.match_date);
                    return d >= today && d <= todayEnd;
                  });

                  // 2. Se não tem jogos hoje, pega a PRÓXIMA rodada agendada
                  let displayMatches = todayMatches;
                  let displayLabel = 'Jogos de Hoje';

                  if (todayMatches.length === 0) {
                    const futureMatches = allMatches
                      .filter((m: any) => m.match_date && new Date(m.match_date) > todayEnd && m.status !== 'finished')
                      .sort((a: any, b: any) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());

                    if (futureMatches.length > 0) {
                      const nextRound = futureMatches[0].round_number;
                      displayMatches = allMatches.filter((m: any) => m.round_number === nextRound);
                      const nextDate = new Date(futureMatches[0].match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
                      displayLabel = `Próxima Rodada ${nextRound} (${nextDate})`;
                    } else {
                      // Fallback: jogos com scout ativo, ou última rodada
                      const liveMatches = allMatches.filter((m: any) =>
                        m.status !== 'finished' || ['pre_game', 'live_half1', 'halftime', 'live_half2', 'ended'].includes(m.scout_status)
                      );
                      if (liveMatches.length > 0) {
                        const round = liveMatches.sort((a: any, b: any) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())[0].round_number;
                        displayMatches = allMatches.filter((m: any) => m.round_number === round);
                        displayLabel = `Rodada ${round}`;
                      } else {
                        const rounds = [...new Set(allMatches.map((m: any) => m.round_number))].sort((a: number, b: number) => b - a);
                        const lastRound = rounds[0] || 1;
                        displayMatches = allMatches.filter((m: any) => m.round_number === lastRound);
                        displayLabel = `Rodada ${lastRound} (mais recente)`;
                      }
                    }
                  }

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-slate-600">{displayLabel}</span>
                        <span className="text-[10px] text-slate-400">({displayMatches.length} jogos)</span>
                      </div>

                      {displayMatches.map((m: any) => {
                        const homeTeam = tournament.sqlTeams.find((t: any) => t.id === m.home_team_id);
                        const awayTeam = tournament.sqlTeams.find((t: any) => t.id === m.away_team_id);
                        return (
                          <ScoutTokensPanel
                            key={m.id}
                            matchId={m.id}
                            matchInfo={{
                              home_team: homeTeam ? { id: homeTeam.id, short_name: homeTeam.short_name, name: homeTeam.name, logo_url: homeTeam.logo_url } : undefined,
                              away_team: awayTeam ? { id: awayTeam.id, short_name: awayTeam.short_name, name: awayTeam.name, logo_url: awayTeam.logo_url } : undefined,
                              round: m.round_number,
                              match_date: m.match_date,
                              scout_status: m.scout_status || 'idle',
                            }}
                            competitionId={selectedCompId}
                          />
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Scout Monitor — realtime feed & scout status */}
              {(() => {
                const allM = (tournament.sqlMatches || []) as any[];
                const liveMatchIds = allM
                  .filter((m: any) => m.scout_status && !['idle', 'published'].includes(m.scout_status))
                  .map((m: any) => m.id);
                if (liveMatchIds.length === 0) return null;
                const liveMatches = allM
                  .filter((m: any) => liveMatchIds.includes(m.id))
                  .map((m: any) => {
                    const hTeam = tournament.sqlTeams.find((t: any) => t.id === m.home_team_id);
                    const aTeam = tournament.sqlTeams.find((t: any) => t.id === m.away_team_id);
                    return {
                      id: m.id,
                      round_number: m.round_number,
                      match_date: m.match_date,
                      scout_status: m.scout_status,
                      home_team: hTeam ? { id: hTeam.id, short_name: hTeam.short_name, logo_url: hTeam.logo_url, color: hTeam.color } : undefined,
                      away_team: aTeam ? { id: aTeam.id, short_name: aTeam.short_name, logo_url: aTeam.logo_url, color: aTeam.color } : undefined,
                    };
                  });
                return (
                  <ScoutMonitor matchIds={liveMatchIds} matches={liveMatches} />
                );
              })()}
            </div>
          )}

          {/* ===== FANS TAB (moved from Admin) ===== */}
          {activeTab === 'fans' && (
            <div className="space-y-4">
              <AdminUsersDashboard />
              <PlayerPortalAdmin teams={allTeams} />
            </div>
          )}

          {/* ===== TEAMS TAB (moved from Admin) ===== */}
          {activeTab === 'teams' && (
            <div className="space-y-4">
              {/* TEAMS CRUD + COMPETITION MEMBERSHIP */}
              <div className={`p-4 ${glassCard}`} style={glassBg}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Times ({allTeams.length})</span>
                    {competition && <span className="text-[10px] text-slate-400 font-medium">· {sqlTeams.length} no campeonato</span>}
                  </div>
                  <button onClick={() => setShowNewTeamForm(!showNewTeamForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-600">
                    <Plus className="w-3.5 h-3.5" /> Novo Time
                  </button>
                </div>

                {showNewTeamForm && (
                  <div className="p-3 rounded-xl mb-3 space-y-2" style={{ background: '#faf5ff', border: '2px solid #8b5cf6' }}>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-500 block mb-1">Nome Completo*</label><input value={newTeamData.name} onChange={e => setNewTeamData({...newTeamData, name: e.target.value})} className={glassInput} placeholder="Grêmio Encantado" /></div>
                      <div><label className="text-[10px] text-slate-500 block mb-1">Sigla*</label><input value={newTeamData.short_name} onChange={e => setNewTeamData({...newTeamData, short_name: e.target.value})} className={glassInput} placeholder="GRE" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-500 block mb-1">Slug (URL)*</label><input value={newTeamData.slug} onChange={e => setNewTeamData({...newTeamData, slug: e.target.value.toLowerCase()})} className={glassInput} placeholder="gremio-encantado" /></div>
                      <div><label className="text-[10px] text-slate-500 block mb-1">Cidade</label><input value={newTeamData.city} onChange={e => setNewTeamData({...newTeamData, city: e.target.value})} className={glassInput} placeholder="Encantado" /></div>
                    </div>
                    <ImageUpload label="Escudo / Logo" value={newTeamData.logo_url} onChange={url => setNewTeamData({...newTeamData, logo_url: url})} />
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-500 block mb-1">Cor Primária</label><div className="flex gap-1"><input type="color" value={newTeamData.color} onChange={e => setNewTeamData({...newTeamData, color: e.target.value})} className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0" /><input className={glassInput} value={newTeamData.color} onChange={e => setNewTeamData({...newTeamData, color: e.target.value})} /></div></div>
                      <div><label className="text-[10px] text-slate-500 block mb-1">Cor Detalhe</label><div className="flex gap-1"><input type="color" value={newTeamData.color_detail || '#FFFFFF'} onChange={e => setNewTeamData({...newTeamData, color_detail: e.target.value})} className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0" /><input className={glassInput} value={newTeamData.color_detail} onChange={e => setNewTeamData({...newTeamData, color_detail: e.target.value})} /></div></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><label className="text-[10px] text-slate-500 block mb-1">Técnico</label><input value={newTeamData.coach} onChange={e => setNewTeamData({...newTeamData, coach: e.target.value})} className={glassInput} placeholder="Nome" /></div>
                      <div><label className="text-[10px] text-slate-500 block mb-1">Estádio</label><input value={newTeamData.stadium} onChange={e => setNewTeamData({...newTeamData, stadium: e.target.value})} className={glassInput} placeholder="Power Arena" /></div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCreateTeam} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-purple-500 text-white text-xs font-bold hover:bg-purple-600"><Save className="w-3.5 h-3.5" /> Criar Time</button>
                      <button onClick={() => setShowNewTeamForm(false)} className="px-3 py-2 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-300"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  {allTeams.map(t => {
                    const inCurrentComp = sqlTeams.some(ct => ct.id === t.id);
                    const isEditing = editingTeam === t.id;
                    return (
                      <div key={t.id} className={`rounded-xl transition-all ${isEditing ? 'ring-2 ring-purple-400' : ''}`} style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        <div className="flex items-center gap-2 p-2.5">
                          {t.logo_url ? <img src={t.logo_url} alt="" className="w-8 h-8 object-contain flex-shrink-0" /> : <div className="w-8 h-8 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0"><Shield className="w-4 h-4 text-slate-400" /></div>}
                          <div className="w-2 h-8 rounded-full flex-shrink-0" style={{ background: t.color || '#3B82F6' }} />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-800 truncate">{t.name}</div>
                            <div className="text-[10px] text-slate-500">{t.slug} {t.city && `· ${t.city}`} {t.coach && `· Tec: ${t.coach}`}</div>
                          </div>
                          {inCurrentComp ? (
                            <span className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold text-emerald-600 bg-emerald-50 flex-shrink-0"><Check className="w-3 h-3" /> Camp.</span>
                          ) : (
                            <button onClick={() => handleAddTeamToCompetition(t.id)} className="px-2 py-1 rounded text-[9px] font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 flex-shrink-0">+ Add</button>
                          )}
                          <button onClick={() => {
                            if (isEditing) { setEditingTeam(null); }
                            else { setEditingTeam(t.id); setEditTeamData({ name: t.name, short_name: t.short_name, slug: t.slug, color: t.color, color_detail: t.color_detail, coach: t.coach, president: t.president, logo_url: t.logo_url, stadium: t.stadium, city: t.city, photo_url: t.photo_url, badge_url: t.badge_url }); }
                          }} className={`p-1.5 rounded-lg flex-shrink-0 ${isEditing ? 'bg-purple-100 text-purple-600' : 'hover:bg-slate-100 text-slate-500'}`}>
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTeam(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 flex-shrink-0">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {isEditing && (
                          <div className="px-3 pb-3 space-y-2" style={{ borderTop: '1px solid #e2e8f0' }}>
                            <div className="pt-2 grid grid-cols-2 lg:grid-cols-3 gap-2">
                              <div><label className="text-[10px] text-slate-500 block mb-1">Nome completo</label><input className={glassInput} value={editTeamData.name || ''} onChange={e => setEditTeamData(p => ({ ...p, name: e.target.value }))} /></div>
                              <div><label className="text-[10px] text-slate-500 block mb-1">Sigla</label><input className={glassInput} value={editTeamData.short_name || ''} onChange={e => setEditTeamData(p => ({ ...p, short_name: e.target.value }))} /></div>
                              <div><label className="text-[10px] text-slate-500 block mb-1">Slug</label><input className={glassInput} value={editTeamData.slug || ''} onChange={e => setEditTeamData(p => ({ ...p, slug: e.target.value }))} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <ImageUpload label="Escudo / Logo" value={editTeamData.logo_url || ''} onChange={url => setEditTeamData(p => ({ ...p, logo_url: url }))} />
                              <ImageUpload label="Foto do time" value={editTeamData.photo_url || ''} onChange={url => setEditTeamData(p => ({ ...p, photo_url: url }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div><label className="text-[10px] text-slate-500 block mb-1">Cor Primária</label><div className="flex gap-1"><input type="color" value={editTeamData.color || '#3B82F6'} onChange={e => setEditTeamData(p => ({ ...p, color: e.target.value }))} className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0" /><input className={glassInput} value={editTeamData.color || ''} onChange={e => setEditTeamData(p => ({ ...p, color: e.target.value }))} /></div></div>
                              <div><label className="text-[10px] text-slate-500 block mb-1">Cor Detalhe</label><div className="flex gap-1"><input type="color" value={editTeamData.color_detail || '#FFFFFF'} onChange={e => setEditTeamData(p => ({ ...p, color_detail: e.target.value }))} className="w-9 h-9 rounded-lg border border-slate-200 cursor-pointer flex-shrink-0" /><input className={glassInput} value={editTeamData.color_detail || ''} onChange={e => setEditTeamData(p => ({ ...p, color_detail: e.target.value }))} /></div></div>
                            </div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                              <div><label className="text-[10px] text-slate-500 block mb-1">Técnico</label><input className={glassInput} value={editTeamData.coach || ''} onChange={e => setEditTeamData(p => ({ ...p, coach: e.target.value }))} /></div>
                              <div><label className="text-[10px] text-slate-500 block mb-1">Presidente</label><input className={glassInput} value={editTeamData.president || ''} onChange={e => setEditTeamData(p => ({ ...p, president: e.target.value }))} /></div>
                              <div><label className="text-[10px] text-slate-500 block mb-1">Estádio</label><input className={glassInput} value={editTeamData.stadium || ''} onChange={e => setEditTeamData(p => ({ ...p, stadium: e.target.value }))} /></div>
                              <div><label className="text-[10px] text-slate-500 block mb-1">Cidade</label><input className={glassInput} value={(editTeamData as any).city || ''} onChange={e => setEditTeamData(p => ({ ...p, city: e.target.value }))} /></div>
                            </div>
                            <div className="flex gap-2 pt-1">
                              <button onClick={handleSaveTeam} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-purple-500 text-white text-[10px] font-bold hover:bg-purple-600"><Save className="w-3 h-3" /> Salvar</button>
                              <button onClick={() => setEditingTeam(null)} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-200 text-slate-600 text-[10px] font-bold hover:bg-slate-300"><X className="w-3 h-3" /> Cancelar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===== CHAMPIONSHIPS TAB (moved from Admin) ===== */}
          {activeTab === 'championships' && (
            <div className="space-y-4">
              {/* CAMPEONATO ATIVO */}
              <div className={`p-4 ${glassCard}`} style={{ ...glassBg, background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderColor: '#f59e0b30' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="text-sm font-bold text-amber-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Campeonato Ativo</span>
                  </div>
                  {competition && !editingCompetition && (
                    <button onClick={() => { setEditingCompetition(true); setEditCompData({ name: competition.name, short_name: competition.short_name, year: competition.year, status: competition.status, type: competition.type, yellow_cards_suspension: competition.yellow_cards_suspension, organizer: competition.organizer, sponsor: competition.sponsor, rules_url: competition.rules_url, logo_url: competition.logo_url }); }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200">
                      <Edit2 className="w-3.5 h-3.5" /> Editar
                    </button>
                  )}
                </div>
                {competition ? (
                  <div className="space-y-3">
                    {editingCompetition ? (
                      <div className="p-3 rounded-xl space-y-2" style={{ background: '#ffffff', border: '2px solid #f59e0b' }}>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                          <div><label className="text-[10px] text-slate-500 block mb-1">Nome</label><input className={glassInput} value={editCompData.name || ''} onChange={e => setEditCompData(p => ({ ...p, name: e.target.value }))} /></div>
                          <div><label className="text-[10px] text-slate-500 block mb-1">Sigla</label><input className={glassInput} value={editCompData.short_name || ''} onChange={e => setEditCompData(p => ({ ...p, short_name: e.target.value }))} /></div>
                          <div><label className="text-[10px] text-slate-500 block mb-1">Ano</label><input className={glassInput} type="number" value={editCompData.year || ''} onChange={e => setEditCompData(p => ({ ...p, year: parseInt(e.target.value) }))} /></div>
                          <div><label className="text-[10px] text-slate-500 block mb-1">Status</label>
                            <select className={glassInput} value={editCompData.status || ''} onChange={e => setEditCompData(p => ({ ...p, status: e.target.value }))}>
                              <option value="active">Ativo</option><option value="finished">Encerrado</option><option value="planned">Planejado</option>
                            </select>
                          </div>
                          <div><label className="text-[10px] text-slate-500 block mb-1">Tipo</label>
                            <select className={glassInput} value={editCompData.type || ''} onChange={e => setEditCompData(p => ({ ...p, type: e.target.value }))}>
                              <option value="league">Liga</option><option value="cup">Copa</option><option value="tournament">Torneio</option>
                            </select>
                          </div>
                          <div><label className="text-[10px] text-slate-500 block mb-1">CA p/ Suspensão</label><input className={glassInput} type="number" min="1" value={editCompData.yellow_cards_suspension ?? 3} onChange={e => setEditCompData(p => ({ ...p, yellow_cards_suspension: parseInt(e.target.value) }))} /></div>
                          <div><label className="text-[10px] text-slate-500 block mb-1">Organizador</label><input className={glassInput} value={editCompData.organizer || ''} onChange={e => setEditCompData(p => ({ ...p, organizer: e.target.value }))} /></div>
                          <div><label className="text-[10px] text-slate-500 block mb-1">Patrocinador</label><input className={glassInput} value={editCompData.sponsor || ''} onChange={e => setEditCompData(p => ({ ...p, sponsor: e.target.value }))} /></div>
                          <div><ImageUpload compact label="Logo" value={editCompData.logo_url || ''} onChange={url => setEditCompData(p => ({ ...p, logo_url: url }))} /></div>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button onClick={handleSaveCompetition} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600"><Save className="w-3 h-3" /> Salvar</button>
                          <button onClick={() => setEditingCompetition(false)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-600 text-[10px] font-bold hover:bg-slate-300"><X className="w-3 h-3" /> Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)' }}>
                          <Award className="w-8 h-8 text-amber-500" />
                          <div>
                            <div className="text-sm font-bold text-slate-800">{competition.name}</div>
                            <div className="text-[10px] text-slate-500">Temporada {competition.year} · Status: {competition.status} · Tipo: {competition.type || 'league'}</div>
                            {competition.organizer && <div className="text-[10px] text-slate-500">Organizador: {competition.organizer}</div>}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
                            <div className="text-xl font-bold text-slate-800" style={{ fontFamily: 'JetBrains Mono' }}>{sqlTeams.length}</div>
                            <div className="text-[9px] text-slate-500 font-semibold mt-0.5">TIMES</div>
                          </div>
                          <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
                            <div className="text-xl font-bold text-slate-800" style={{ fontFamily: 'JetBrains Mono' }}>{sqlMatches.length}</div>
                            <div className="text-[9px] text-slate-500 font-semibold mt-0.5">PARTIDAS</div>
                          </div>
                          <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
                            <div className="text-xl font-bold text-slate-800" style={{ fontFamily: 'JetBrains Mono' }}>{sqlPlayers.length}</div>
                            <div className="text-[9px] text-slate-500 font-semibold mt-0.5">JOGADORES</div>
                          </div>
                          <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
                            <div className="text-xl font-bold text-slate-800" style={{ fontFamily: 'JetBrains Mono' }}>{sqlEvents.length}</div>
                            <div className="text-[9px] text-slate-500 font-semibold mt-0.5">EVENTOS</div>
                          </div>
                        </div>
                        {competition.yellow_cards_suspension && (
                          <div className="text-[11px] text-slate-500 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.7)' }}>
                            <span className="text-amber-600 font-bold">Regras LEEA:</span> {competition.yellow_cards_suspension} cartões amarelos = 1 jogo de suspensão (Art.73)
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-amber-700/60">
                    <Trophy className="w-8 h-8 mx-auto mb-2 text-amber-400" />
                    <div className="text-xs font-semibold">Nenhuma competição selecionada</div>
                    <div className="text-[10px] mt-1">Selecione ou crie um campeonato abaixo</div>
                  </div>
                )}
              </div>

              {/* ALL COMPETITIONS — list & create */}
              <div className={`p-4 ${glassCard}`} style={glassBg}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Todos os Campeonatos ({allCompetitions.length})</span>
                  </div>
                  <button onClick={() => setShowNewCompetitionForm(!showNewCompetitionForm)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600">
                    <Plus className="w-3.5 h-3.5" /> Novo Campeonato
                  </button>
                </div>

                {showNewCompetitionForm && (
                  <div className="p-3 rounded-xl mb-3 space-y-2" style={{ background: '#fffbeb', border: '2px solid #f59e0b' }}>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Nome*</label>
                        <input value={newCompetitionData.name} onChange={e => setNewCompetitionData({...newCompetitionData, name: e.target.value})} className={glassInput} placeholder="Copa do Vale 2026" />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Sigla*</label>
                        <input value={newCompetitionData.short_name} onChange={e => setNewCompetitionData({...newCompetitionData, short_name: e.target.value})} className={glassInput} placeholder="CDV" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Ano</label>
                        <input type="number" value={newCompetitionData.year} onChange={e => setNewCompetitionData({...newCompetitionData, year: parseInt(e.target.value)})} className={glassInput} />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">Tipo</label>
                        <select value={newCompetitionData.type} onChange={e => setNewCompetitionData({...newCompetitionData, type: e.target.value})} className={glassInput}>
                          <option value="league">Liga</option>
                          <option value="cup">Copa</option>
                          <option value="tournament">Torneio</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 block mb-1">CA p/ Suspensão</label>
                        <input type="number" min="1" value={newCompetitionData.yellow_cards_suspension} onChange={e => setNewCompetitionData({...newCompetitionData, yellow_cards_suspension: parseInt(e.target.value)})} className={glassInput} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleCreateCompetition} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600">
                        <Save className="w-3.5 h-3.5" /> Criar Campeonato
                      </button>
                      <button onClick={() => setShowNewCompetitionForm(false)} className="px-3 py-2 rounded-lg bg-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-300">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="max-h-48 overflow-y-auto space-y-1">
                  {allCompetitions.map(c => {
                    const isActive = c.id === selectedCompId;
                    return (
                      <div key={c.id} className={`flex items-center gap-2 p-2 rounded-lg ${isActive ? 'bg-amber-50 ring-1 ring-amber-300' : 'hover:bg-slate-50'}`}>
                        <Award className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-amber-500' : 'text-slate-400'}`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-800 truncate">{c.name}</div>
                          <div className="text-[10px] text-slate-500">{c.year} · {c.status} · {c.type || 'league'}</div>
                        </div>
                        {!isActive && (
                          <button onClick={() => setSelectedCompId(c.id)}
                            className="px-2 py-1 rounded text-[10px] font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100">
                            Selecionar
                          </button>
                        )}
                        {isActive && (
                          <span className="px-2 py-1 rounded text-[10px] font-bold text-amber-600 bg-amber-100">
                            Ativo
                          </span>
                        )}
                        <button onClick={() => handleDeleteCompetition(c.id)} className="px-2 py-1 rounded text-[10px] font-bold bg-red-50 text-red-600 hover:bg-red-100">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ===== ADMIN TAB (slimmed: tools + jornal + migrate) ===== */}
          {activeTab === 'admin' && (
            <div className="space-y-4">
              {/* JORNAL IMPRESSO */}
              <a
                href="/admin/jornal"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-4 ${glassCard} flex items-center gap-3 cursor-pointer hover:scale-[1.01] transition-transform`}
                style={{ ...glassBg, background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', borderColor: '#22c55e30', display: 'flex', textDecoration: 'none' }}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                  <Newspaper className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-emerald-800 block" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                    Quadro Jornal Impresso
                  </span>
                  <span className="text-[11px] text-emerald-600">
                    Gerar página print-ready com classificação, resultados e próxima rodada para o Força do Vale
                  </span>
                </div>
              </a>

              {/* NARRADOR AO VIVO */}
              <a
                href="/admin/narrador"
                className={`p-4 ${glassCard} flex items-center gap-3 cursor-pointer hover:scale-[1.01] transition-transform`}
                style={{ ...glassBg, background: 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)', borderColor: '#eab30830', display: 'flex', textDecoration: 'none' }}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                <div>
                  <span className="text-sm font-bold text-amber-800 block" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                    Narrador ao Vivo
                  </span>
                  <span className="text-[11px] text-amber-600">
                    Dashboard com gols, penaltis e expulsoes de todos os jogos em tempo real com alerta sonoro
                  </span>
                </div>
              </a>

              {/* EXPORTAR PROMPT PARA JORNAL */}
              <div className={`p-4 ${glassCard}`} style={glassBg}>
                <NewsExportPanel
                  matches={sqlMatches}
                  teams={sqlTeams}
                  players={sqlPlayers}
                  events={sqlEvents}
                  competition={competition}
                  competitionName={competition?.name}
                />
              </div>

              {/* MIGRAR LOGOS PARA SUPABASE STORAGE */}
              <MigrateLogosCard teams={sqlTeams} onReload={refetch} />

              {/* CONCEDER PREMIUM */}
              <PremiumGrantCard />

              {/* FERRAMENTAS */}
              <div className={`p-4 ${glassCard}`} style={glassBg}>
                <div className="flex items-center gap-2 mb-3">
                  <RefreshCw className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>Ferramentas</span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  <button onClick={() => refetch()} title="Seguro — apenas recarrega os dados do banco, como um F5" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-semibold hover:bg-emerald-100 border border-emerald-200 transition-all">
                    <RefreshCw className="w-3.5 h-3.5" /> Recarregar Dados SQL
                  </button>
                  <button title="Seguro — copia os dados atuais para a área de transferência" onClick={() => { const ta = document.createElement('textarea'); ta.value = JSON.stringify(data, null, 2); ta.style.position = 'fixed'; ta.style.left = '-9999px'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); toast.success('Dados copiados!'); } catch { toast.error('Falha ao copiar'); } document.body.removeChild(ta); }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 text-slate-600 text-xs font-semibold hover:bg-slate-100 border border-slate-200 transition-all">
                    <FileText className="w-3.5 h-3.5" /> Exportar JSON
                  </button>
                  <button
                    title="Seguro — padroniza nomes de posições (ex: 'goleiro' → 'Goleiro')"
                    onClick={async () => {
                      try {
                        const { adminNormalizePositions } = await import('../lib/admin-api');
                        toast('Normalizando posicoes...');
                        const result = await adminNormalizePositions();
                        if (result.fixed > 0) {
                          toast.success(`${result.fixed} posicao(oes) corrigida(s)!`);
                          console.log('[Normalize] Fixes:', result.fixes);
                          refetch();
                        } else {
                          toast.success('Todas as posicoes ja estao corretas!');
                        }
                      } catch (err: any) {
                        toast.error(`Erro: ${err.message}`);
                        console.error('[Normalize] Error:', err);
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-semibold hover:bg-amber-100 border border-amber-200 transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Normalizar Posicoes
                  </button>
                </div>
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-emerald-50/50 border border-emerald-100 mb-4">
                  <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    <span className="font-bold">Todos os botões acima são seguros.</span> Nenhum apaga dados — apenas recarregam, recalculam ou padronizam informações existentes.
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 leading-relaxed space-y-0.5 pt-3" style={{ borderTop: '1px solid #e2e8f0' }}>
                  <p><span className="text-emerald-600 font-semibold">SQL-First:</span> Dados direto das tabelas Supabase</p>
                  <p><span className="text-emerald-600 font-semibold">KV Store:</span> Apenas estado de broadcast (cena ativa, seleções)</p>
                  <p><span className="text-emerald-400 font-semibold">Polling:</span> SQL 8s (manager) / 10s (broadcast) · KV 5s / 2.5s</p>
                  <p><span className="text-blue-500 font-semibold">Multi-campeonato:</span> Selecione qualquer campeonato no header</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ===== MATCH JSON IMPORTER MODAL ===== */}
      {importMatchId && (() => {
        const importMatch = sqlMatches.find(m => m.id === importMatchId);
        if (!importMatch) return null;
        return (
          <MatchJsonImporter
            match={importMatch}
            teams={sqlTeams}
            players={sqlPlayers}
            onClose={() => setImportMatchId(null)}
            onComplete={() => { refetch(); }}
          />
        );
      })()}
    </div>
  );
}
