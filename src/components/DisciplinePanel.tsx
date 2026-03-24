// ============================================================
// DISCIPLINE PANEL — Admin panel for managing competition discipline
// Sections: Suspensions overview, Pendurados, Manual suspension CRUD
// ============================================================
import { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle, Shield, UserX, RefreshCw, Plus, Save, X, ChevronDown,
  Check, Search, Trash2, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import {
  fetchDisciplineOverview, createManualSuspension, updateManualSuspension,
  deleteManualSuspension, serveGame, syncDisciplineToPlayers,
  fetchEligibility, fetchTeamDiscipline,
  type DisciplineOverview, type DisciplineEntry, type ManualSuspension,
  type EligibilityData, type PlayerEligibility,
  type TeamDisciplineData,
} from '../lib/discipline-api';
import type { SQLPlayer, SQLTeam } from '../lib/supabase';

const glassCard = 'rounded-2xl';
const glassBg = { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const glassInput = 'w-full text-xs rounded-lg bg-white border border-slate-200 text-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/30 placeholder-slate-400';

interface Props {
  competitionId: string;
  players: SQLPlayer[];
  teams: SQLTeam[];
  currentRound?: number;
}

export function DisciplinePanel({ competitionId, players, teams, currentRound }: Props) {
  const [overview, setOverview] = useState<DisciplineOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showNewSuspension, setShowNewSuspension] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // New suspension form
  const [newSus, setNewSus] = useState({
    player_id: '',
    reason: '',
    games_total: 1,
    from_round: currentRound || 1,
    admin_notes: '',
  });
  const [playerSearch, setPlayerSearch] = useState('');

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await fetchDisciplineOverview(competitionId);
      setOverview(data);
    } catch (err: any) {
      toast.error('Erro ao carregar disciplina: ' + err.message);
      console.error('[Discipline] Load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOverview(); }, [competitionId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const result = await syncDisciplineToPlayers(competitionId);
      toast.success(`Sincronizado: ${result.updated} jogadores atualizados`);
      await loadOverview();
    } catch (err: any) {
      toast.error('Erro ao sincronizar: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateSuspension = async () => {
    if (!newSus.player_id) { toast.error('Selecione um jogador'); return; }
    if (!newSus.reason.trim()) { toast.error('Informe o motivo'); return; }
    try {
      const player = players.find(p => p.id === newSus.player_id);
      const team = teams.find(t => t.id === player?.team_id);
      await createManualSuspension({
        competition_id: competitionId,
        player_id: newSus.player_id,
        player_name: player?.name || '',
        team_id: team?.id || '',
        team_name: team?.short_name || team?.name || '',
        reason: newSus.reason,
        games_total: newSus.games_total,
        from_round: newSus.from_round,
        admin_notes: newSus.admin_notes,
      });
      toast.success('Suspensão manual criada');
      setShowNewSuspension(false);
      setNewSus({ player_id: '', reason: '', games_total: 1, from_round: currentRound || 1, admin_notes: '' });
      await loadOverview();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleServeGame = async (sus: ManualSuspension) => {
    try {
      await serveGame(sus.id, competitionId);
      toast.success(`Jogo cumprido (${sus.games_served + 1}/${sus.games_total})`);
      await loadOverview();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  const handleDeleteSuspension = async (sus: ManualSuspension) => {
    if (!confirm(`Remover suspensão de ${sus.player_name}?`)) return;
    try {
      await deleteManualSuspension(sus.id, competitionId);
      toast.success('Suspensão removida');
      await loadOverview();
    } catch (err: any) {
      toast.error('Erro: ' + err.message);
    }
  };

  // Filter entries
  const suspended = useMemo(() =>
    overview?.entries.filter(e => e.is_suspended) || [],
    [overview]
  );
  const pendurados = useMemo(() =>
    overview?.entries.filter(e => e.is_pendurado) || [],
    [overview]
  );
  const allEntries = useMemo(() => {
    let entries = overview?.entries || [];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      entries = entries.filter(e =>
        e.player_name.toLowerCase().includes(term) ||
        e.team_short_name.toLowerCase().includes(term)
      );
    }
    if (filterTeam) {
      entries = entries.filter(e => e.team_id === filterTeam);
    }
    return entries;
  }, [overview, searchTerm, filterTeam]);

  // Active + inactive manual suspensions
  const activeManuais = overview?.manualSuspensions.filter(m => m.active) || [];
  const inactiveManuais = overview?.manualSuspensions.filter(m => !m.active) || [];

  // Player search for new suspension form
  const filteredPlayers = useMemo(() => {
    if (!playerSearch) return players.slice(0, 20);
    const term = playerSearch.toLowerCase();
    return players.filter(p =>
      p.name.toLowerCase().includes(term) ||
      teams.find(t => t.id === p.team_id)?.short_name?.toLowerCase().includes(term)
    ).slice(0, 20);
  }, [playerSearch, players, teams]);

  if (loading && !overview) {
    return (
      <div className={`p-6 ${glassCard}`} style={glassBg}>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
          <span className="text-sm text-slate-500">Carregando disciplina...</span>
        </div>
      </div>
    );
  }

  const rules = overview?.rules;
  const stats = overview?.stats;

  return (
    <div className="space-y-4">
      {/* Header + Stats */}
      <div className={`p-4 ${glassCard}`} style={{ ...glassBg, background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', borderColor: '#f59e0b30' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold text-amber-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Disciplina
            </span>
            {rules && (
              <span className="text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
                {rules.yellows_for_suspension} CA = {rules.suspension_games} jogo(s)
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-[10px] font-bold hover:bg-amber-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar'}
            </button>
            <button
              onClick={loadOverview}
              disabled={loading}
              className="p-1.5 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Stats row */}
        {stats && (
          <div className="grid grid-cols-4 gap-2">
            <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="text-xl font-bold text-red-600" style={{ fontFamily: 'JetBrains Mono' }}>{stats.suspended}</div>
              <div className="text-[9px] text-slate-500 font-semibold">SUSPENSOS</div>
            </div>
            <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="text-xl font-bold text-amber-600" style={{ fontFamily: 'JetBrains Mono' }}>{stats.pendurados}</div>
              <div className="text-[9px] text-slate-500 font-semibold">PENDURADOS</div>
            </div>
            <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="text-xl font-bold text-yellow-600" style={{ fontFamily: 'JetBrains Mono' }}>{stats.totalYellows}</div>
              <div className="text-[9px] text-slate-500 font-semibold">AMARELOS</div>
            </div>
            <div className="p-2.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.7)' }}>
              <div className="text-xl font-bold text-red-600" style={{ fontFamily: 'JetBrains Mono' }}>{stats.totalReds}</div>
              <div className="text-[9px] text-slate-500 font-semibold">VERMELHOS</div>
            </div>
          </div>
        )}
      </div>

      {/* SUSPENDED */}
      {suspended.length > 0 && (
        <div className={`p-4 ${glassCard}`} style={{ ...glassBg, borderLeft: '4px solid #ef4444' }}>
          <div className="flex items-center gap-2 mb-3">
            <UserX className="w-4 h-4 text-red-500" />
            <span className="text-sm font-bold text-red-700" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Suspensos ({suspended.length})
            </span>
          </div>
          <div className="space-y-2">
            {suspended.map(entry => (
              <EntryCard key={entry.player_id} entry={entry} type="suspended" teams={teams} />
            ))}
          </div>
        </div>
      )}

      {/* PENDURADOS */}
      {pendurados.length > 0 && (
        <div className={`p-4 ${glassCard}`} style={{ ...glassBg, borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Pendurados ({pendurados.length})
            </span>
            {rules && (
              <span className="text-[10px] text-amber-500">
                ({rules.yellows_for_suspension - 1} de {rules.yellows_for_suspension} CA)
              </span>
            )}
          </div>
          <div className="space-y-2">
            {pendurados.map(entry => (
              <EntryCard key={entry.player_id} entry={entry} type="pendurado" teams={teams} />
            ))}
          </div>
        </div>
      )}

      {/* MANUAL SUSPENSIONS */}
      <div className={`p-4 ${glassCard}`} style={glassBg}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Suspensões Manuais ({activeManuais.length})
            </span>
          </div>
          <button
            onClick={() => setShowNewSuspension(!showNewSuspension)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-500 text-white text-[10px] font-bold hover:bg-purple-600"
          >
            <Plus className="w-3 h-3" /> Nova Suspensão
          </button>
        </div>

        {/* New suspension form */}
        {showNewSuspension && (
          <div className="p-3 rounded-xl mb-3 space-y-2" style={{ background: '#faf5ff', border: '2px solid #8b5cf6' }}>
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Buscar jogador</label>
              <input
                className={glassInput}
                placeholder="Nome do jogador ou time..."
                value={playerSearch}
                onChange={e => setPlayerSearch(e.target.value)}
              />
              {playerSearch && (
                <div className="mt-1 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white">
                  {filteredPlayers.map(p => {
                    const t = teams.find(tt => tt.id === p.team_id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setNewSus(s => ({ ...s, player_id: p.id }));
                          setPlayerSearch('');
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 text-xs ${newSus.player_id === p.id ? 'bg-purple-50' : ''}`}
                      >
                        {t?.logo_url && <img src={t.logo_url} alt="" className="w-5 h-5 object-contain" />}
                        <span className="font-semibold text-slate-800">{p.name}</span>
                        <span className="text-slate-400">#{p.number}</span>
                        <span className="text-slate-400 ml-auto">{t?.short_name}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {newSus.player_id && (
                <div className="mt-1 text-[10px] text-purple-600 font-semibold">
                  Selecionado: {players.find(p => p.id === newSus.player_id)?.name}
                  <button onClick={() => setNewSus(s => ({ ...s, player_id: '' }))} className="ml-2 text-red-500">✕</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">Jogos de suspensão</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  className={glassInput}
                  value={newSus.games_total}
                  onChange={e => setNewSus(s => ({ ...s, games_total: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-500 block mb-1">A partir da rodada</label>
                <input
                  type="number"
                  min={1}
                  className={glassInput}
                  value={newSus.from_round}
                  onChange={e => setNewSus(s => ({ ...s, from_round: parseInt(e.target.value) || 1 }))}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Motivo *</label>
              <input
                className={glassInput}
                placeholder="Ex: Agressão ao árbitro, comportamento antiesportivo..."
                value={newSus.reason}
                onChange={e => setNewSus(s => ({ ...s, reason: e.target.value }))}
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1">Notas do admin</label>
              <textarea
                className={`${glassInput} h-16 resize-none`}
                placeholder="Observações internas..."
                value={newSus.admin_notes}
                onChange={e => setNewSus(s => ({ ...s, admin_notes: e.target.value }))}
              />
            </div>

            <div className="flex gap-2">
              <button onClick={handleCreateSuspension} className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-purple-500 text-white text-[10px] font-bold hover:bg-purple-600">
                <Save className="w-3 h-3" /> Criar Suspensão
              </button>
              <button onClick={() => setShowNewSuspension(false)} className="px-3 py-2 rounded-lg bg-slate-200 text-slate-600 text-[10px] font-bold hover:bg-slate-300">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Active manual suspensions list */}
        {activeManuais.length > 0 ? (
          <div className="space-y-2">
            {activeManuais.map(sus => (
              <ManualSuspensionCard
                key={sus.id}
                suspension={sus}
                onServe={() => handleServeGame(sus)}
                onDelete={() => handleDeleteSuspension(sus)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4 text-slate-400 text-xs">
            Nenhuma suspensão manual ativa
          </div>
        )}

        {/* History toggle */}
        {inactiveManuais.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 font-semibold"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              Histórico ({inactiveManuais.length})
            </button>
            {showHistory && (
              <div className="space-y-1.5 mt-2">
                {inactiveManuais.map(sus => (
                  <div key={sus.id} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 text-xs text-slate-400">
                    <span className="font-semibold">{sus.player_name}</span>
                    <span>·</span>
                    <span>{sus.reason}</span>
                    <span className="ml-auto">{sus.games_served}/{sus.games_total} jogos</span>
                    <Check className="w-3 h-3 text-green-500" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ALL ENTRIES — Full list with search */}
      <div className={`p-4 ${glassCard}`} style={glassBg}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Todos os Cartões ({overview?.entries.length || 0})
            </span>
          </div>
        </div>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              className={`${glassInput} pl-8`}
              placeholder="Buscar jogador..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className={`${glassInput} w-40`}
            value={filterTeam}
            onChange={e => setFilterTeam(e.target.value)}
          >
            <option value="">Todos os times</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.short_name}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5 max-h-96 overflow-y-auto">
          {allEntries.map(entry => (
            <EntryCard key={entry.player_id} entry={entry} type="full" teams={teams} />
          ))}
          {allEntries.length === 0 && (
            <div className="text-center py-4 text-slate-400 text-xs">
              Nenhum jogador com cartões
            </div>
          )}
        </div>
      </div>

      {/* ART. 72 — TEAM DISCIPLINE POINTS */}
      <TeamDisciplineSection competitionId={competitionId} />

      {/* ART. 52 — PLAYER ELIGIBILITY */}
      <EligibilitySection competitionId={competitionId} />
    </div>
  );
}

// ============================
// ENTRY CARD — Single player discipline entry
// ============================
function EntryCard({ entry, type, teams }: {
  entry: DisciplineEntry;
  type: 'suspended' | 'pendurado' | 'full';
  teams: SQLTeam[];
}) {
  const bgColor = entry.is_suspended
    ? 'bg-red-50 border-red-200'
    : entry.is_pendurado
      ? 'bg-amber-50 border-amber-200'
      : 'bg-slate-50 border-slate-100';

  return (
    <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${bgColor}`}>
      {/* Team logo */}
      {entry.team_logo ? (
        <img src={entry.team_logo} alt="" className="w-7 h-7 object-contain shrink-0" />
      ) : (
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0"
          style={{ background: entry.team_color }}
        >
          {entry.team_short_name.slice(0, 2)}
        </div>
      )}

      {/* Player info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-800 truncate">{entry.player_name}</span>
          {entry.player_number && (
            <span className="text-[10px] text-slate-400" style={{ fontFamily: 'JetBrains Mono' }}>#{entry.player_number}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-slate-500">{entry.team_short_name}</span>
          {entry.is_suspended && entry.suspension_reason && (
            <span className="text-[9px] text-red-500 truncate">· {entry.suspension_reason}</span>
          )}
          {entry.is_suspended && entry.next_eligible_round && (
            <span className="text-[9px] text-red-400 font-semibold">
              · Volta rod. {entry.next_eligible_round}
            </span>
          )}
        </div>
      </div>

      {/* Cards display */}
      <div className="flex items-center gap-1 shrink-0">
        {entry.yellow_accumulator > 0 && (
          <div className="flex items-center gap-0.5">
            <div className="w-3 h-4 rounded-[2px] bg-yellow-400" />
            <span className="text-[10px] font-bold text-yellow-700" style={{ fontFamily: 'JetBrains Mono' }}>
              {entry.yellow_accumulator}
            </span>
          </div>
        )}
        {entry.total_reds > 0 && (
          <div className="flex items-center gap-0.5 ml-1">
            <div className="w-3 h-4 rounded-[2px] bg-red-500" />
            <span className="text-[10px] font-bold text-red-700" style={{ fontFamily: 'JetBrains Mono' }}>
              {entry.total_reds}
            </span>
          </div>
        )}
      </div>

      {/* Status badge */}
      {entry.is_suspended && (
        <span className="shrink-0 text-[8px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-full uppercase">
          Suspenso
        </span>
      )}
      {entry.is_pendurado && (
        <span className="shrink-0 text-[8px] font-bold text-amber-600 bg-amber-100 px-2 py-1 rounded-full uppercase">
          Pendurado
        </span>
      )}
      {type === 'full' && !entry.is_suspended && !entry.is_pendurado && entry.total_yellows > 0 && (
        <span className="shrink-0 text-[9px] text-slate-400 font-semibold" style={{ fontFamily: 'JetBrains Mono' }}>
          {entry.total_yellows}A {entry.total_reds > 0 ? `${entry.total_reds}V` : ''}
        </span>
      )}
    </div>
  );
}

// ============================
// MANUAL SUSPENSION CARD
// ============================
function ManualSuspensionCard({ suspension, onServe, onDelete }: {
  suspension: ManualSuspension;
  onServe: () => void;
  onDelete: () => void;
}) {
  const progress = suspension.games_total > 0
    ? (suspension.games_served / suspension.games_total) * 100
    : 0;

  return (
    <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/50">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-800">{suspension.player_name}</span>
            <span className="text-[10px] text-slate-400">{suspension.team_name}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{suspension.reason}</p>
          {suspension.admin_notes && (
            <p className="text-[9px] text-slate-400 italic mt-0.5">{suspension.admin_notes}</p>
          )}
        </div>
        <button
          onClick={onDelete}
          className="p-1 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-purple-500 h-full rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-purple-600 shrink-0" style={{ fontFamily: 'JetBrains Mono' }}>
          {suspension.games_served}/{suspension.games_total}
        </span>
        <button
          onClick={onServe}
          disabled={suspension.games_served >= suspension.games_total}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500 text-white text-[9px] font-bold hover:bg-purple-600 disabled:opacity-30 shrink-0"
        >
          <Check className="w-3 h-3" /> Cumpriu
        </button>
      </div>

      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-slate-400">
        <span>Rodada {suspension.from_round}–{suspension.next_eligible_round || '?'}</span>
        <span>Criada: {new Date(suspension.created_at).toLocaleDateString('pt-BR')}</span>
      </div>
    </div>
  );
}

// ============================
// TEAM DISCIPLINE SECTION — Art. 72
// ============================
function TeamDisciplineSection({ competitionId }: { competitionId: string }) {
  const [data, setData] = useState<TeamDisciplineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchTeamDiscipline(competitionId)
      .then(setData)
      .catch(err => console.error('[TeamDisc]', err))
      .finally(() => setLoading(false));
  }, [competitionId]);

  const alertTeams = data?.teams.filter(t => t.alert !== 'ok') || [];

  return (
    <div className={`p-4 ${glassCard}`} style={{ ...glassBg, borderLeft: alertTeams.length > 0 ? '4px solid #dc2626' : undefined }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Pontuação Disciplinar — Art. 72
          </span>
          {alertTeams.length > 0 && (
            <span className="text-[10px] text-red-600 bg-red-100 px-2 py-0.5 rounded-full font-bold">
              {alertTeams.length} em alerta
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {loading && <div className="text-xs text-slate-400 text-center py-2">Carregando...</div>}

          {data?.teams.map(t => {
            const alertColor = t.alert === 'excluded' ? 'bg-red-100 border-red-300'
              : t.alert === 'danger' ? 'bg-red-50 border-red-200'
              : t.alert === 'warning' ? 'bg-amber-50 border-amber-200'
              : 'bg-slate-50 border-slate-100';
            const barColor = t.alert === 'excluded' ? '#dc2626'
              : t.alert === 'danger' ? '#ef4444'
              : t.alert === 'warning' ? '#f59e0b'
              : '#10b981';

            return (
              <div key={t.team_id} className={`p-3 rounded-xl border ${alertColor}`}>
                <div className="flex items-center gap-2 mb-1.5">
                  {t.team_logo ? (
                    <img src={t.team_logo} alt="" className="w-6 h-6 object-contain shrink-0" />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: t.team_color }}>
                      {t.team_short_name.slice(0, 2)}
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-800 flex-1">{t.team_short_name}</span>
                  <span className="text-[10px] font-bold" style={{ fontFamily: 'JetBrains Mono', color: barColor }}>
                    {t.total_points}/{t.max_points}
                  </span>
                  {t.alert === 'excluded' && (
                    <span className="text-[8px] font-bold text-white bg-red-600 px-2 py-0.5 rounded-full uppercase">Excluido</span>
                  )}
                  {t.alert === 'danger' && (
                    <span className="text-[8px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full uppercase">Perigo</span>
                  )}
                  {t.alert === 'warning' && (
                    <span className="text-[8px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full uppercase">Atenção</span>
                  )}
                </div>
                {/* Bar */}
                <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${t.percentage}%`, background: barColor }} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400">
                  <span>{t.yellow_cards} CA ({t.yellow_cards * 10}pts)</span>
                  <span>{t.red_cards} CV ({t.red_cards * 50}pts)</span>
                  {t.manual_points > 0 && <span>Manual: {t.manual_points}pts</span>}
                  <span className="ml-auto">Restam {t.remaining}pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================
// ELIGIBILITY SECTION — Art. 52
// ============================
function EligibilitySection({ competitionId }: { competitionId: string }) {
  const [data, setData] = useState<EligibilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [eligFilterTeam, setEligFilterTeam] = useState('');

  useEffect(() => {
    setLoading(true);
    fetchEligibility(competitionId)
      .then(setData)
      .catch(err => console.error('[Eligibility]', err))
      .finally(() => setLoading(false));
  }, [competitionId]);

  const ineligible = data?.eligibility.filter(e => !e.eligible) || [];
  const filtered = useMemo(() => {
    let list = data?.eligibility || [];
    if (eligFilterTeam) list = list.filter(e => e.team_id === eligFilterTeam);
    return list;
  }, [data, eligFilterTeam]);

  // Get unique teams for filter
  const eligTeams = useMemo(() => {
    const seen = new Map<string, string>();
    (data?.eligibility || []).forEach(e => { if (!seen.has(e.team_id)) seen.set(e.team_id, e.team_short_name); });
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [data]);

  return (
    <div className={`p-4 ${glassCard}`} style={{ ...glassBg, borderLeft: ineligible.length > 0 ? '4px solid #f59e0b' : undefined }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <UserX className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Elegibilidade Semi/Final — Art. 52
          </span>
          {data?.summary && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
              ineligible.length > 0 ? 'text-amber-600 bg-amber-100' : 'text-green-600 bg-green-100'
            }`}>
              {ineligible.length > 0 ? `${ineligible.length} inelegíveis` : 'Todos ok'}
            </span>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      {expanded && (
        <div className="mt-3 space-y-2">
          {loading && <div className="text-xs text-slate-400 text-center py-2">Carregando...</div>}

          {data?.summary && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-lg bg-blue-50">
                <div className="text-lg font-bold text-blue-600" style={{ fontFamily: 'JetBrains Mono' }}>{data.summary.group_matches_played}</div>
                <div className="text-[9px] text-slate-500">Jogos classif.</div>
              </div>
              <div className="p-2 rounded-lg bg-green-50">
                <div className="text-lg font-bold text-green-600" style={{ fontFamily: 'JetBrains Mono' }}>{data.summary.eligible}</div>
                <div className="text-[9px] text-slate-500">Elegíveis</div>
              </div>
              <div className="p-2 rounded-lg bg-red-50">
                <div className="text-lg font-bold text-red-600" style={{ fontFamily: 'JetBrains Mono' }}>{data.summary.ineligible}</div>
                <div className="text-[9px] text-slate-500">Inelegíveis</div>
              </div>
            </div>
          )}

          <div className="text-[10px] text-slate-400 text-center">
            Mín. {data?.rules.min_games_for_knockout || 3} jogos nas rodadas 1–{data?.rules.group_phase_max_round || 6} (fase classificatória)
          </div>

          <select
            className={`${glassInput} w-full`}
            value={eligFilterTeam}
            onChange={e => setEligFilterTeam(e.target.value)}
          >
            <option value="">Todos os times</option>
            {eligTeams.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filtered.map(p => {
              const barPct = Math.min(100, (p.group_phase_games / p.min_required) * 100);
              return (
                <div key={p.player_id} className={`flex items-center gap-2 p-2 rounded-lg border ${
                  p.eligible ? 'bg-slate-50 border-slate-100' : 'bg-red-50 border-red-200'
                }`}>
                  {p.team_logo ? (
                    <img src={p.team_logo} alt="" className="w-5 h-5 object-contain shrink-0" />
                  ) : (
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[7px] font-bold" style={{ background: p.team_color }}>
                      {p.team_short_name.slice(0, 2)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold text-slate-800 truncate">{p.player_name}</span>
                      {p.player_number && <span className="text-[9px] text-slate-400 font-mono">#{p.player_number}</span>}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: p.eligible ? '#10b981' : '#ef4444' }} />
                      </div>
                      <span className="text-[9px] font-bold font-mono shrink-0" style={{ color: p.eligible ? '#10b981' : '#ef4444' }}>
                        {p.group_phase_games}/{p.min_required}
                      </span>
                    </div>
                  </div>
                  {!p.eligible && (
                    <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full uppercase shrink-0">
                      Inapto
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}