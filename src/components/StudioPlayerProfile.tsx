import { useMemo } from 'react';
import { motion } from 'motion/react';
import { getTeamColor } from './BroadcastText';
import type { SQLPlayer, SQLTeam, SQLMatchEvent, SQLMatch, TournamentData } from '../lib/supabase';

interface Props {
  playerId: string | null;
  sqlPlayers: SQLPlayer[];
  sqlTeams: SQLTeam[];
  sqlEvents: SQLMatchEvent[];
  sqlMatches: SQLMatch[];
  data: TournamentData;
}

const FOOT_LABELS: Record<string, string> = { right: 'Destro', left: 'Canhoto', both: 'Ambidestro' };
const POS_LABELS: Record<string, string> = {
  GOL: 'Goleiro', ZAG: 'Zagueiro', LD: 'Lateral Dir.', LE: 'Lateral Esq.',
  VOL: 'Volante', MC: 'Meia Central', MEI: 'Meia', ATA: 'Atacante', PE: 'Ponta Esq.', PD: 'Ponta Dir.',
};

export function StudioPlayerProfile({ playerId, sqlPlayers, sqlTeams, sqlEvents, sqlMatches, data }: Props) {
  const player = playerId ? sqlPlayers.find(p => p.id === playerId) : null;

  if (!player) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <span style={{ fontSize: 40, fontWeight: 800, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }}>Selecione um jogador no painel</span>
      </div>
    );
  }

  const team = sqlTeams.find(t => t.id === player.team_id);
  const tc = team ? getTeamColor(team.name, team.color) : '#3B82F6';

  const playerEvents = sqlEvents.filter(e => e.player_id === player.id);
  const goals = playerEvents.filter(e => e.event_type === 'goal' || e.event_type === 'penalty_scored').length;
  const ownGoals = playerEvents.filter(e => e.event_type === 'own_goal').length;
  const yellowCards = playerEvents.filter(e => e.event_type === 'yellow_card').length;
  const redCards = playerEvents.filter(e => e.event_type === 'red_card').length;
  const assists = sqlEvents.filter(e =>
    (e.event_type === 'goal' || e.event_type === 'penalty_scored') &&
    e.detail?.assist_player_id === player.id
  ).length;
  const matchesWithEvents = new Set(playerEvents.map(e => e.match_id));
  const gamesPlayed = matchesWithEvents.size;
  const goalsPerGame = gamesPlayed > 0 ? (goals / gamesPlayed).toFixed(2) : '0.00';

  const age = useMemo(() => {
    if (!player.birth_date) return null;
    const birth = new Date(player.birth_date);
    const today = new Date();
    let a = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) a--;
    return a;
  }, [player.birth_date]);

  const scorerRank = useMemo(() => {
    if (goals === 0) return null;
    const sorted = data.topScorers || [];
    const idx = sorted.findIndex(s => s.playerId === player.id);
    return idx >= 0 ? idx + 1 : null;
  }, [data.topScorers, player.id, goals]);

  const recentMatches = Array.from(matchesWithEvents)
    .map(mid => sqlMatches.find(m => m.id === mid))
    .filter(Boolean)
    .slice(-5)
    .reverse() as SQLMatch[];

  const posLabel = POS_LABELS[player.position || ''] || player.position || 'Jogador';

  // All stats in a grid
  const statCards = [
    { label: 'JOGOS', value: gamesPlayed, color: '#0f172a', size: 'large' },
    { label: 'GOLS', value: goals, color: '#eab308', size: 'large' },
    { label: 'ASSISTÊNCIAS', value: assists, color: '#3b82f6', size: 'large' },
    { label: 'GOLS/JOGO', value: goalsPerGame, color: '#22c55e', size: 'medium' },
    { label: 'G+A', value: goals + assists, color: '#6366f1', size: 'medium' },
    { label: 'AMARELOS', value: yellowCards, color: '#eab308', size: 'medium' },
    { label: 'VERMELHOS', value: redCards, color: '#ef4444', size: 'medium' },
    ...(ownGoals > 0 ? [{ label: 'GOLS C.', value: ownGoals, color: '#ef4444', size: 'medium' as const }] : []),
    ...(scorerRank ? [{ label: 'ARTILHARIA', value: `${scorerRank}º`, color: '#eab308', size: 'medium' as const }] : []),
  ];

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full flex">
        {/* Left: Player identity — wider */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center justify-center relative"
          style={{ width: 560, background: `linear-gradient(135deg, ${tc}15, ${tc}08)`, borderRight: `4px solid ${tc}30` }}
        >
          {/* Number watermark */}
          <div style={{ fontSize: 220, fontWeight: 900, color: tc, fontFamily: 'JetBrains Mono', lineHeight: 1, opacity: 0.08, position: 'absolute', top: 10, right: 20 }}>
            {player.number}
          </div>

          {/* Photo */}
          <div style={{ width: 240, height: 240, borderRadius: '50%', overflow: 'hidden', border: `5px solid ${tc}`, marginBottom: 20 }}>
            {player.photo_url ? (
              <img src={player.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: `${tc}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 90, fontWeight: 900, color: tc, fontFamily: 'JetBrains Mono' }}>{player.number}</span>
              </div>
            )}
          </div>

          {/* Name */}
          <div style={{ fontSize: 52, fontWeight: 900, color: '#0f172a', lineHeight: 1, textAlign: 'center', fontFamily: 'Plus Jakarta Sans', padding: '0 24px' }}>
            {player.name}
          </div>

          {/* Position + Number */}
          <div className="flex items-center gap-4 mt-3">
            <span style={{ fontSize: 32, fontWeight: 700, color: tc, fontFamily: 'JetBrains Mono' }}>#{player.number}</span>
            <span style={{ fontSize: 28, fontWeight: 600, color: '#64748b' }}>{posLabel}</span>
          </div>

          {/* Team */}
          <div className="flex items-center gap-4 mt-5">
            {team?.logo_url && <img src={team.logo_url} alt="" style={{ width: 52, height: 52, objectFit: 'contain' }} />}
            <span style={{ fontSize: 32, fontWeight: 700, color: '#475569' }}>{team?.name || ''}</span>
          </div>

          {/* Age */}
          {age && (
            <div className="mt-4" style={{ fontSize: 26, fontWeight: 600, color: '#94a3b8' }}>
              {age} anos
            </div>
          )}
        </motion.div>

        {/* Right: Stats grid + matches */}
        <div className="flex-1 flex flex-col px-10 py-5">
          {/* Stats grid — 3-4 columns */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
            className="flex-shrink-0 mb-5"
          >
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
              {statCards.map((s) => (
                <div key={s.label} className="flex flex-col items-center justify-center py-5" style={{
                  background: '#f8fafc', borderRadius: 16, border: '1px solid #e2e8f0',
                }}>
                  <span style={{ fontSize: 58, fontWeight: 900, fontFamily: 'JetBrains Mono', color: s.color, lineHeight: 1 }}>{s.value}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.1em', marginTop: 8 }}>{s.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent matches */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="flex-1 flex flex-col"
          >
            <div className="flex items-center gap-4 mb-4">
              <div style={{ width: 6, height: 28, background: tc, borderRadius: 3 }} />
              <span style={{ fontSize: 30, fontWeight: 800, color: '#64748b', letterSpacing: '0.08em' }}>ÚLTIMOS JOGOS</span>
            </div>

            <div className="flex-1 flex flex-col gap-3 justify-center">
              {recentMatches.length > 0 ? recentMatches.map((m, idx) => {
                const ht = m.home_team || sqlTeams.find(t => t.id === m.home_team_id);
                const at = m.away_team || sqlTeams.find(t => t.id === m.away_team_id);
                const eventsInMatch = playerEvents.filter(e => e.match_id === m.id);
                const goalsInMatch = eventsInMatch.filter(e => e.event_type === 'goal' || e.event_type === 'penalty_scored').length;
                const isHome = m.home_team_id === player.team_id;
                const teamScore = isHome ? m.score_home : m.score_away;
                const oppScore = isHome ? m.score_away : m.score_home;
                const result = teamScore != null && oppScore != null
                  ? teamScore > oppScore ? 'W' : teamScore < oppScore ? 'L' : 'D'
                  : null;
                const resultColor = result === 'W' ? '#22c55e' : result === 'L' ? '#ef4444' : '#eab308';

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: 0.4 + idx * 0.05 }}
                    className="flex items-center"
                    style={{ height: 72, background: '#f8fafc', borderRadius: 12, paddingLeft: 14, paddingRight: 16, borderLeft: result ? `6px solid ${resultColor}` : undefined }}
                  >
                    {result && (
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: resultColor, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12, flexShrink: 0 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, color: '#fff' }}>{result === 'W' ? 'V' : result === 'D' ? 'E' : 'D'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 flex-1">
                      {ht?.logo_url && <img src={ht.logo_url} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />}
                      <span style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{ht?.short_name}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 mx-4">
                      <span style={{ fontSize: 38, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#0f172a' }}>{m.score_home ?? '-'}</span>
                      <span style={{ fontSize: 22, color: '#cbd5e1' }}>×</span>
                      <span style={{ fontSize: 38, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#0f172a' }}>{m.score_away ?? '-'}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <span style={{ fontSize: 26, fontWeight: 800, color: '#0f172a' }}>{at?.short_name}</span>
                      {at?.logo_url && <img src={at.logo_url} alt="" style={{ width: 36, height: 36, objectFit: 'contain' }} />}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-5">
                      {goalsInMatch > 0 && (
                        <span style={{ fontSize: 22 }}>
                          {Array.from({ length: Math.min(goalsInMatch, 3) }, () => '⚽').join('')}
                        </span>
                      )}
                      {eventsInMatch.some(e => e.event_type === 'yellow_card') && (
                        <span style={{ display: 'inline-block', width: 16, height: 22, background: '#eab308', borderRadius: 3 }} />
                      )}
                      {eventsInMatch.some(e => e.event_type === 'red_card') && (
                        <span style={{ display: 'inline-block', width: 16, height: 22, background: '#ef4444', borderRadius: 3 }} />
                      )}
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      <span style={{ fontSize: 20, fontWeight: 600, color: '#94a3b8' }}>{m.round_name || `R${m.round_number}`}</span>
                    </div>
                  </motion.div>
                );
              }) : (
                <div className="flex items-center justify-center py-8">
                  <span style={{ fontSize: 28, fontWeight: 600, color: '#94a3b8' }}>Nenhum jogo registrado</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
