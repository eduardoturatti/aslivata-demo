import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, AlertTriangle, Shield, Ban, ChevronRight, Users, Clock, Gavel, FileText } from 'lucide-react';
import {
  fetchTeams, fetchAllPlayers,
  type Team, type Player, COMPETITION_ID,
} from '../lib/public-supabase';
import { logoUrl } from '../lib/image-utils';
import { PremiumPageGate } from '../components/public/PremiumGate';
import { PageTransition } from '../components/public/PageTransition';
import { SectionHeader } from '../components/public/SectionHeader';
import { CardsSkeleton } from '../components/public/Skeletons';
import {
  fetchDisciplineOverview, fetchRules,
  fetchEligibility,
  type DisciplineOverview, type DisciplineEntry, type CompetitionRules,
  type EligibilityData,
} from '../lib/discipline-api';

function TeamLogo({ url, name, size = 20 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.35 }}>
        {name.slice(0, 2)}
      </div>
    );
  }
  return <img src={logoUrl(url, size * 2)} alt={name} width={size} height={size} loading="lazy" decoding="async" onError={() => setErr(true)} className="object-contain shrink-0" style={{ width: size, height: size }} />;
}

interface CardPlayerRow {
  playerId: string;
  playerName: string;
  playerNumber: string;
  teamName: string;
  teamLogo: string;
  teamColor: string;
  yellows: number;
  reds: number;
  isSuspended: boolean;
  isPendurado: boolean;
  yellowAccumulator: number;
  suspensionReason: string | null;
  nextEligibleRound: number | null;
  suspensionGamesTotal: number;
  suspensionGamesServed: number;
  suspensionCount: number;
}

interface FairPlayRow {
  team: Team;
  yellows: number;
  reds: number;
  score: number;
  suspendedCount: number;
  penduradoCount: number;
}

export function CardsPage() {
  const navigate = useNavigate();
  const [playerCards, setPlayerCards] = useState<CardPlayerRow[]>([]);
  const [fairPlay, setFairPlay] = useState<FairPlayRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'players' | 'situacao' | 'fairplay' | 'elegibilidade'>('players');
  const [overview, setOverview] = useState<DisciplineOverview | null>(null);
  const [rules, setRules] = useState<CompetitionRules | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [eligTeamFilter, setEligTeamFilter] = useState('');

  useEffect(() => {
    async function load() {
      const [teamsData, allPlayers, overviewData, rulesData] = await Promise.all([
        fetchTeams(),
        fetchAllPlayers(),
        fetchDisciplineOverview(COMPETITION_ID).catch(() => null),
        fetchRules(COMPETITION_ID).catch(() => null),
      ]);

      setTeams(teamsData);
      setOverview(overviewData);
      setRules(rulesData);

      // Build player card rows — prefer discipline API data, fallback to player records
      const entryMap: Record<string, DisciplineEntry> = {};
      if (overviewData?.entries) {
        overviewData.entries.forEach(e => { entryMap[e.player_id] = e; });
      }

      const sortedCards: CardPlayerRow[] = allPlayers
        .filter(p => (p.total_yellow_cards ?? 0) > 0 || (p.total_red_cards ?? 0) > 0 || p.is_suspended || (p.yellow_card_accumulator ?? 0) >= 2)
        .map(p => {
          const team = (p.team as any);
          const entry = entryMap[p.id];
          return {
            playerId: p.id,
            playerName: p.name,
            playerNumber: p.number,
            teamName: team?.short_name || '',
            teamLogo: team?.logo_url || '',
            teamColor: team?.color || '#3B82F6',
            yellows: p.total_yellow_cards ?? 0,
            reds: p.total_red_cards ?? 0,
            isSuspended: entry?.is_suspended ?? p.is_suspended ?? false,
            isPendurado: entry?.is_pendurado ?? (!p.is_suspended && (p.yellow_card_accumulator ?? 0) >= 2),
            yellowAccumulator: entry?.yellow_accumulator ?? p.yellow_card_accumulator ?? 0,
            suspensionReason: entry?.suspension_reason || null,
            nextEligibleRound: entry?.next_eligible_round || null,
            suspensionGamesTotal: entry?.suspension_games_total || 0,
            suspensionGamesServed: entry?.suspension_games_served || 0,
            suspensionCount: entry?.suspension_count || 0,
          };
        })
        .sort((a, b) => {
          const scoreA = a.yellows * 10 + a.reds * 50;
          const scoreB = b.yellows * 10 + b.reds * 50;
          return scoreB - scoreA;
        });
      setPlayerCards(sortedCards);

      // Fair Play — enrich with discipline data
      const teamSuspended: Record<string, number> = {};
      const teamPendurado: Record<string, number> = {};
      if (overviewData?.entries) {
        overviewData.entries.forEach(e => {
          if (e.is_suspended) teamSuspended[e.team_id] = (teamSuspended[e.team_id] || 0) + 1;
          if (e.is_pendurado) teamPendurado[e.team_id] = (teamPendurado[e.team_id] || 0) + 1;
        });
      }

      const sortedFP: FairPlayRow[] = teamsData
        .map(t => ({
          team: t,
          yellows: t.total_yellow_cards ?? 0,
          reds: t.total_red_cards ?? 0,
          score: t.discipline_points ?? 0,
          suspendedCount: teamSuspended[t.id] || 0,
          penduradoCount: teamPendurado[t.id] || 0,
        }))
        .sort((a, b) => a.score - b.score);
      setFairPlay(sortedFP);

      // Load eligibility (Art. 52)
      fetchEligibility(COMPETITION_ID).then(setEligibility).catch(() => {});

      setLoading(false);
    }
    load();
  }, []);

  const suspendedPlayers = playerCards.filter(p => p.isSuspended);
  const penduradoPlayers = playerCards.filter(p => p.isPendurado);
  const yellowsLimit = rules?.yellows_for_suspension || 3;

  return (
    <PremiumPageGate>
      <PageTransition>
      <div className="px-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <SectionHeader title="Cartões & Fair Play" icon={AlertTriangle} variant="page" />

        {/* Summary cards */}
        {overview?.stats && (
          <div className="grid grid-cols-4 gap-2 mb-5">
            <div className="bg-card rounded-xl border border-border p-2.5 text-center">
              <p className="text-lg font-black text-yellow-600" style={{ fontFamily: 'var(--font-mono)' }}>
                {overview.stats.totalYellows}
              </p>
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Amarelos</p>
            </div>
            <div className="bg-card rounded-xl border border-border p-2.5 text-center">
              <p className="text-lg font-black text-red-500" style={{ fontFamily: 'var(--font-mono)' }}>
                {overview.stats.totalReds}
              </p>
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Vermelhos</p>
            </div>
            <div className="bg-card rounded-xl border border-red-500/20 p-2.5 text-center">
              <p className="text-lg font-black text-red-600" style={{ fontFamily: 'var(--font-mono)' }}>
                {overview.stats.suspended}
              </p>
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Suspensos</p>
            </div>
            <div className="bg-card rounded-xl border border-yellow-500/20 p-2.5 text-center">
              <p className="text-lg font-black text-amber-600" style={{ fontFamily: 'var(--font-mono)' }}>
                {overview.stats.pendurados}
              </p>
              <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Pendurados</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-secondary rounded-lg p-0.5 mb-5">
          {([
            { id: 'players' as const, label: 'Jogadores' },
            { id: 'situacao' as const, label: 'Situação', badge: suspendedPlayers.length + penduradoPlayers.length },
            { id: 'fairplay' as const, label: 'Fair Play' },
            { id: 'elegibilidade' as const, label: 'Art. 52' },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-md text-xs font-semibold transition-colors relative ${
                tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-yellow-500 text-white text-[8px] font-bold flex items-center justify-center">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <CardsSkeleton />
        ) : tab === 'players' ? (
          /* ============ PLAYERS TAB ============ */
          playerCards.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">Nenhum cartão registrado</p>
          ) : (
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_40px_40px] gap-0 px-4 py-2 border-b border-border text-[10px] text-muted-foreground font-semibold"
                style={{ fontFamily: 'var(--font-heading)' }}>
                <span>Jogador</span>
                <span className="flex justify-center"><span className="w-2.5 h-3.5 rounded-[1.5px] bg-yellow-400 inline-block" /></span>
                <span className="flex justify-center"><span className="w-2.5 h-3.5 rounded-[1.5px] bg-red-500 inline-block" /></span>
              </div>
              {playerCards.filter(pc => pc.yellows > 0 || pc.reds > 0).map((pc, idx, arr) => (
                <button
                  key={pc.playerId}
                  onClick={() => navigate(`/jogador/${pc.playerId}`)}
                  className={`w-full grid grid-cols-[1fr_40px_40px] gap-0 px-4 py-2.5 items-center hover:bg-muted transition-colors ${
                    idx < arr.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <TeamLogo url={pc.teamLogo} name={pc.teamName} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-foreground truncate">{pc.playerName}</span>
                        {pc.isSuspended && (
                          <span className="text-[7px] bg-red-500/20 text-red-500 px-1 py-0 rounded font-bold shrink-0">SUSP</span>
                        )}
                        {pc.isPendurado && (
                          <span className="text-[7px] bg-yellow-500/20 text-yellow-600 px-1 py-0 rounded font-bold shrink-0">PEND</span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground text-left">{pc.teamName}</p>
                    </div>
                  </div>
                  <span className="text-center text-sm font-bold text-yellow-600" style={{ fontFamily: 'var(--font-mono)' }}>
                    {pc.yellows || '-'}
                  </span>
                  <span className="text-center text-sm font-bold text-red-500" style={{ fontFamily: 'var(--font-mono)' }}>
                    {pc.reds || '-'}
                  </span>
                </button>
              ))}
            </div>
          )

        ) : tab === 'situacao' ? (
          /* ============ SITUAÇÃO TAB ============ */
          <div className="space-y-5">

            {/* Rule banner */}
            {rules && (
              <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3">
                <Gavel className="w-4 h-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>REGRA VIGENTE</p>
                  <p className="text-xs text-foreground">
                    {rules.yellows_for_suspension} cartões amarelos = {rules.suspension_games} jogo(s) de suspensão
                    {rules.double_penalty_on_repeat && ' · Pena dobrada na reincidência'}
                    {rules.reset_yellows_phase_2 && ' · Amarelos zerados na 2ª fase'}
                  </p>
                  {rules.red_direct_suspension_games > 0 && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Vermelho direto: {rules.red_direct_suspension_games} jogo(s) + R$ {rules.red_card_fine.toFixed(2)} de multa
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* SUSPENSOS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Ban className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Suspensos
                </h3>
                <span className="text-[10px] text-muted-foreground ml-auto">{suspendedPlayers.length} jogadores</span>
              </div>
              {suspendedPlayers.length === 0 ? (
                <div className="text-center py-8 bg-card rounded-xl border border-border">
                  <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-foreground font-semibold">Nenhum suspenso</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Todos os jogadores aptos para a próxima rodada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {suspendedPlayers.map(pc => (
                    <button
                      key={pc.playerId}
                      onClick={() => navigate(`/jogador/${pc.playerId}`)}
                      className="w-full bg-card rounded-xl border border-red-500/20 overflow-hidden hover:border-red-500/40 transition-colors"
                    >
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="relative shrink-0">
                          <TeamLogo url={pc.teamLogo} name={pc.teamName} size={28} />
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                            <Ban className="w-2.5 h-2.5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-foreground font-bold truncate">{pc.playerName}</span>
                            {pc.playerNumber && (
                              <span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>#{pc.playerNumber}</span>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground">{pc.teamName}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[8px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold uppercase">
                            Suspenso
                          </span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      </div>

                      {/* Suspension detail row */}
                      <div className="px-4 pb-3 flex items-center gap-3">
                        {pc.suspensionReason && (
                          <span className="text-[9px] text-red-500 flex items-center gap-1 flex-1 min-w-0 truncate">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            {pc.suspensionReason}
                          </span>
                        )}
                        {pc.suspensionGamesTotal > 0 && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-red-500 h-full rounded-full"
                                style={{ width: `${(pc.suspensionGamesServed / pc.suspensionGamesTotal) * 100}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-red-500" style={{ fontFamily: 'var(--font-mono)' }}>
                              {pc.suspensionGamesServed}/{pc.suspensionGamesTotal}
                            </span>
                          </div>
                        )}
                        {pc.nextEligibleRound && (
                          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                            <Clock className="w-3 h-3" />
                            Volta rod. {pc.nextEligibleRound}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* PENDURADOS */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Pendurados
                </h3>
                <span className="text-[9px] text-muted-foreground bg-yellow-500/10 px-2 py-0.5 rounded-full font-semibold">
                  {yellowsLimit - 1} de {yellowsLimit} <span className="inline-block w-1.5 h-2.5 rounded-[1px] bg-yellow-400 align-middle ml-0.5" />
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">{penduradoPlayers.length} jogadores</span>
              </div>
              {penduradoPlayers.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm bg-card rounded-xl border border-border">
                  Nenhum jogador pendurado
                </p>
              ) : (
                <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                  {penduradoPlayers.map(pc => (
                    <button
                      key={pc.playerId}
                      onClick={() => navigate(`/jogador/${pc.playerId}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors"
                    >
                      <div className="relative shrink-0">
                        <TeamLogo url={pc.teamLogo} name={pc.teamName} size={24} />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-yellow-500 flex items-center justify-center">
                          <AlertTriangle className="w-2 h-2 text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-foreground font-semibold truncate">{pc.playerName}</span>
                          {pc.playerNumber && (
                            <span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>#{pc.playerNumber}</span>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {pc.teamName} · {pc.yellowAccumulator} cartões acumulados
                          {pc.suspensionCount > 0 && ` · ${pc.suspensionCount}ª suspensão servida`}
                        </p>
                      </div>
                      {/* Visual card stack */}
                      <div className="flex items-center gap-0.5 shrink-0">
                        {Array.from({ length: pc.yellowAccumulator }).map((_, i) => (
                          <div key={i} className="w-2 h-3 rounded-[1px] bg-yellow-400" />
                        ))}
                        <div className="w-2 h-3 rounded-[1px] border border-dashed border-yellow-400/50" />
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Próximos em risco — jogadores com 1 amarelo a menos que pendurado */}
            {(() => {
              const nearPendurados = playerCards.filter(pc =>
                !pc.isSuspended && !pc.isPendurado && pc.yellowAccumulator > 0 && pc.yellowAccumulator === yellowsLimit - 2
              );
              if (nearPendurados.length === 0) return null;
              return (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="w-4 h-4 text-slate-500" />
                    <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                      Atenção
                    </h3>
                    <span className="text-[9px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full font-semibold">
                      {yellowsLimit - 2} de {yellowsLimit} <span className="inline-block w-1.5 h-2.5 rounded-[1px] bg-yellow-400 align-middle ml-0.5" />
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{nearPendurados.length} jogadores</span>
                  </div>
                  <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
                    {nearPendurados.slice(0, 10).map(pc => (
                      <button
                        key={pc.playerId}
                        onClick={() => navigate(`/jogador/${pc.playerId}`)}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
                      >
                        <TeamLogo url={pc.teamLogo} name={pc.teamName} />
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-xs text-foreground truncate">{pc.playerName}</span>
                          <p className="text-[10px] text-muted-foreground">{pc.teamName}</p>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {Array.from({ length: pc.yellowAccumulator }).map((_, i) => (
                            <div key={i} className="w-1.5 h-2.5 rounded-[1px] bg-yellow-400" />
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })()}

            {rules && (
              <p className="text-[9px] text-subtle text-center mt-2">
                Art.79: {rules.yellows_for_suspension} cartões amarelos acumulados = suspensão automática de {rules.suspension_games} jogo(s).
                {rules.red_card_fine > 0 && ` Multa de R$ ${rules.red_card_fine.toFixed(2)} por cartão vermelho.`}
              </p>
            )}
          </div>

        ) : tab === 'fairplay' ? (
          /* ============ FAIR PLAY TAB ============ */
          <div className="space-y-2">
            {fairPlay.map((fp, idx) => {
              const isBest = idx === 0;
              const isWorst = idx === fairPlay.length - 1 && fairPlay.length > 1;
              const totalGames = (fp.team.total_wins || 0) + (fp.team.total_draws || 0) + (fp.team.total_losses || 0);
              const cardsPerGame = totalGames > 0 ? ((fp.yellows + fp.reds) / totalGames).toFixed(1) : '-';
              return (
                <button
                  key={fp.team.id}
                  onClick={() => navigate(`/time/${fp.team.slug}`)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors hover:bg-muted ${
                    isBest ? 'border-green-500/30 bg-green-500/5' : isWorst ? 'border-red-500/20 bg-red-500/5' : 'border-border bg-card'
                  }`}
                >
                  <span className={`w-6 text-center text-sm font-bold shrink-0 ${isBest ? 'text-green-600' : isWorst ? 'text-red-500' : 'text-subtle'}`}
                    style={{ fontFamily: 'var(--font-mono)' }}>
                    {idx + 1}
                  </span>
                  <TeamLogo url={fp.team.logo_url} name={fp.team.short_name} size={24} />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm text-foreground font-semibold truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                      {fp.team.short_name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden max-w-[100px]">
                        <div
                          className={`h-full rounded-full ${fp.score > 1500 ? 'bg-red-500' : fp.score > 1000 ? 'bg-yellow-500' : 'bg-primary'}`}
                          style={{ width: `${Math.min((fp.score / 2000) * 100, 100)}%` }}
                        />
                      </div>
                      {/* Badges */}
                      {fp.suspendedCount > 0 && (
                        <span className="text-[7px] bg-red-500/15 text-red-500 px-1 rounded font-bold">{fp.suspendedCount} susp</span>
                      )}
                      {fp.penduradoCount > 0 && (
                        <span className="text-[7px] bg-yellow-500/15 text-yellow-600 px-1 rounded font-bold">{fp.penduradoCount} pend</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className={`text-sm font-bold ${fp.score > 1500 ? 'text-red-500' : 'text-foreground'}`}
                      style={{ fontFamily: 'var(--font-mono)' }}>
                      {fp.score}
                    </span>
                    <div className="flex items-center gap-2 text-[9px]">
                      <span className="text-yellow-600 flex items-center gap-0.5" style={{ fontFamily: 'var(--font-mono)' }}>{fp.yellows} <span className="inline-block w-1.5 h-2.5 rounded-[1px] bg-yellow-400" /></span>
                      <span className="text-red-500 flex items-center gap-0.5" style={{ fontFamily: 'var(--font-mono)' }}>{fp.reds} <span className="inline-block w-1.5 h-2.5 rounded-[1px] bg-red-500" /></span>
                    </div>
                    <span className="text-[8px] text-muted-foreground">{cardsPerGame}/jogo</span>
                  </div>
                  {isBest && (
                    <Shield className="w-4 h-4 text-primary shrink-0" />
                  )}
                </button>
              );
            })}
            <p className="text-[9px] text-subtle text-center mt-2">
              Pontuação: CA = 10pts | CV = 50pts · Menor pontuação = time mais disciplinado
            </p>
          </div>

        ) : tab === 'elegibilidade' ? (
          /* ============ ELEGIBILIDADE TAB — Art. 52 ============ */
          <div className="space-y-4">
            {eligibility?.summary && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-card rounded-xl border border-border p-2.5">
                  <p className="text-lg font-black text-blue-600" style={{ fontFamily: 'var(--font-mono)' }}>
                    {eligibility.summary.group_matches_played}
                  </p>
                  <p className="text-[8px] font-semibold text-muted-foreground uppercase">Jogos classif.</p>
                </div>
                <div className="bg-card rounded-xl border border-green-500/20 p-2.5">
                  <p className="text-lg font-black text-green-600" style={{ fontFamily: 'var(--font-mono)' }}>
                    {eligibility.summary.eligible}
                  </p>
                  <p className="text-[8px] font-semibold text-muted-foreground uppercase">Elegíveis</p>
                </div>
                <div className="bg-card rounded-xl border border-red-500/20 p-2.5">
                  <p className="text-lg font-black text-red-600" style={{ fontFamily: 'var(--font-mono)' }}>
                    {eligibility.summary.ineligible}
                  </p>
                  <p className="text-[8px] font-semibold text-muted-foreground uppercase">Inelegíveis</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 bg-card rounded-xl border border-border px-4 py-3">
              <Gavel className="w-4 h-4 text-primary shrink-0" />
              <p className="text-xs text-foreground">
                Art. 52 — Mín. <strong>{eligibility?.rules.min_games_for_knockout || 3} jogos</strong> na fase classificatória (rod. 1–{eligibility?.rules.group_phase_max_round || 6}) para jogar semifinal e final.
              </p>
            </div>

            <select
              className="w-full text-xs rounded-lg bg-card border border-border text-foreground px-3 py-2 outline-none"
              value={eligTeamFilter}
              onChange={e => setEligTeamFilter(e.target.value)}
            >
              <option value="">Todos os times</option>
              {(() => {
                const seen = new Map<string, string>();
                (eligibility?.eligibility || []).forEach(e => { if (!seen.has(e.team_id)) seen.set(e.team_id, e.team_short_name); });
                return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1])).map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ));
              })()}
            </select>

            <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
              {(eligibility?.eligibility || [])
                .filter(p => !eligTeamFilter || p.team_id === eligTeamFilter)
                .map(p => {
                  const barPct = Math.min(100, (p.group_phase_games / p.min_required) * 100);
                  return (
                    <div key={p.player_id} className="flex items-center gap-2.5 px-4 py-2.5">
                      <TeamLogo url={p.team_logo} name={p.team_short_name} size={18} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-foreground truncate">{p.player_name}</span>
                          {p.player_number && <span className="text-[9px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>#{p.player_number}</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden max-w-[80px]">
                            <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: p.eligible ? '#10b981' : '#ef4444' }} />
                          </div>
                          <span className="text-[9px] font-bold shrink-0" style={{ fontFamily: 'var(--font-mono)', color: p.eligible ? '#10b981' : '#ef4444' }}>
                            {p.group_phase_games}/{p.min_required}
                          </span>
                        </div>
                      </div>
                      {!p.eligible && (
                        <span className="text-[7px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">Inapto</span>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        ) : null}
      </div>
      </PageTransition>
    </PremiumPageGate>
  );
}