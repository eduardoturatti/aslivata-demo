import { useMemo } from 'react';
import { motion } from 'motion/react';
import { BroadcastText, getTeamColor } from './BroadcastText';
import { TournamentData } from '../lib/supabase';
import type { SQLPlayer, SQLMatchEvent } from '../lib/supabase';

interface Props {
  data: TournamentData;
  selectedTeam: string | null;
  onTeamSelect?: (id: string | null) => void;
  fontScale?: number;
  sqlPlayers?: SQLPlayer[];
  sqlEvents?: SQLMatchEvent[];
}

const POS_ORDER: Record<string, number> = { GOL: 0, ZAG: 1, LD: 2, LE: 3, VOL: 4, MC: 5, MEI: 6, PE: 7, PD: 8, ATA: 9 };
const POS_LABEL: Record<string, string> = {
  GOL: 'Goleiro', ZAG: 'Zagueiro', LD: 'Lat. Dir.', LE: 'Lat. Esq.',
  VOL: 'Volante', MC: 'Meia', MEI: 'Meia', PE: 'Ponta Esq.', PD: 'Ponta Dir.', ATA: 'Atacante',
};

export function StudioTeamFilter({ data, selectedTeam, sqlPlayers, sqlEvents }: Props) {

  // ── TEAM PICKER (no team selected) ─────────────────────────────────────
  if (!selectedTeam) {
    const teams = Object.entries(data.teams).sort(([, a], [, b]) => a.short.localeCompare(b.short));

    return (
      <div className="h-full w-full overflow-hidden" style={{ background: 'transparent' }}>
        <div className="h-full flex flex-col px-14 py-8">

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-5 mb-8 flex-shrink-0"
          >
            <div style={{ width: 7, height: 48, background: '#22c55e', borderRadius: 3 }} />
            <span style={{ fontSize: 54, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>Elencos</span>
          </motion.div>

          {/* Shields grid */}
          <div
            className="flex-1"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(4, 1fr)`,
              gap: 48,
              alignContent: 'center',
            }}
          >
            {teams.map(([id, team], i) => {
              const stats = data.standings?.find(s => s.teamId === id);
              const c = getTeamColor(team.name, team.primaryColor);
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.08 + i * 0.05 }}
                  className="flex flex-col items-center"
                  style={{ gap: 14 }}
                >
                  {team.logo ? (
                    <img src={team.logo} alt={team.short} style={{ width: 110, height: 110, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ width: 110, height: 110, borderRadius: '50%', background: c, opacity: 0.25 }} />
                  )}

                  <div style={{ textAlign: 'center', width: '100%' }}>
                    <BroadcastText style={{ fontSize: 34, fontWeight: 900, color: '#0f172a' }} align="center" minScale={0.55}>
                      {team.short}
                    </BroadcastText>
                  </div>

                  {stats && (
                    <div className="flex items-center gap-2 px-3 py-1" style={{ borderRadius: 8, background: '#f1f5f9', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: 24, fontWeight: 900, color: c }}>{stats.pos}º</span>
                      <span style={{ fontSize: 22, fontWeight: 600, color: '#94a3b8' }}>·</span>
                      <span style={{ fontSize: 24, fontWeight: 700, color: '#475569' }}>{stats.tpg} pts</span>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ── TEAM PROFILE (team selected) ───────────────────────────────────────
  const team = data.teams[selectedTeam];
  if (!team) return null;

  const stats = data.standings?.find(s => s.teamId === selectedTeam);
  const c = getTeamColor(team.name, team.primaryColor);

  const matches = data.rounds.flatMap(r =>
    r.matches
      .filter(m => m.home === selectedTeam || m.away === selectedTeam)
      .map(m => ({ round: r.name, ...m }))
  );

  // Get roster from sqlPlayers
  const roster = useMemo(() => {
    if (!sqlPlayers) return [];
    return sqlPlayers
      .filter(p => p.team_id === selectedTeam)
      .sort((a, b) => {
        const posA = POS_ORDER[a.position || ''] ?? 99;
        const posB = POS_ORDER[b.position || ''] ?? 99;
        if (posA !== posB) return posA - posB;
        return (a.number || 99) - (b.number || 99);
      });
  }, [sqlPlayers, selectedTeam]);

  // Player stats from events
  const playerStatsMap = useMemo(() => {
    const map = new Map<string, { goals: number; assists: number; yellows: number; reds: number }>();
    if (!sqlEvents) return map;
    for (const ev of sqlEvents) {
      if (!map.has(ev.player_id)) map.set(ev.player_id, { goals: 0, assists: 0, yellows: 0, reds: 0 });
      const s = map.get(ev.player_id)!;
      if (ev.event_type === 'goal' || ev.event_type === 'penalty_scored') s.goals++;
      if (ev.event_type === 'yellow_card') s.yellows++;
      if (ev.event_type === 'red_card') s.reds++;
      // Assists
      if ((ev.event_type === 'goal' || ev.event_type === 'penalty_scored') && ev.detail?.assist_player_id) {
        if (!map.has(ev.detail.assist_player_id)) map.set(ev.detail.assist_player_id, { goals: 0, assists: 0, yellows: 0, reds: 0 });
        map.get(ev.detail.assist_player_id)!.assists++;
      }
    }
    return map;
  }, [sqlEvents]);

  // 8 headline stats
  const statCards = stats ? [
    { label: 'PTS', val: `${stats.tpg}`, color: '#0f172a' },
    { label: 'V', val: `${stats.v}`, color: '#22c55e' },
    { label: 'E', val: `${stats.e}`, color: '#eab308' },
    { label: 'D', val: `${stats.d}`, color: '#ef4444' },
    { label: 'GP', val: `${stats.gp}`, color: '#0f172a' },
    { label: 'GC', val: `${stats.gc}`, color: '#0f172a' },
    { label: 'SG', val: stats.sg > 0 ? `+${stats.sg}` : `${stats.sg}`, color: stats.sg > 0 ? '#22c55e' : stats.sg < 0 ? '#ef4444' : '#94a3b8' },
    { label: 'APROV', val: `${stats.pct}%`, color: stats.pct >= 67 ? '#22c55e' : stats.pct >= 34 ? '#eab308' : '#ef4444' },
  ] : [];

  const hasRoster = roster.length > 0;

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: 'transparent' }}>
      <div className="h-full flex flex-col">

        {/* ── Team header ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="flex items-center gap-8 px-12 py-5 flex-shrink-0"
          style={{ background: c }}
        >
          {team.logo && (
            <img src={team.logo} alt={team.short} style={{ width: 120, height: 120, objectFit: 'contain', flexShrink: 0 }} />
          )}

          <div className="flex-1 min-w-0">
            <BroadcastText style={{ fontSize: 60, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
              {team.short}
            </BroadcastText>
            <div style={{ fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>
              {team.name}
            </div>
          </div>

          {stats && (
            <div className="flex-shrink-0 text-center pr-4">
              <div style={{ fontSize: 72, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{stats.pos}º</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.1em', marginTop: 2 }}>POSIÇÃO</div>
            </div>
          )}
        </motion.div>

        {/* ── Stats cards row ── */}
        {statCards.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.12 }}
            className="flex flex-shrink-0"
          >
            {statCards.map((s, i) => (
              <div key={s.label} className="flex-1 flex flex-col items-center justify-center py-4"
                style={{ background: i % 2 === 0 ? '#f8fafc' : '#f1f5f9', borderRight: i < statCards.length - 1 ? '1px solid #e2e8f0' : 'none' }}>
                <div style={{ fontSize: 48, fontWeight: 900, color: s.color, lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono' }}>{s.val}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Content: Roster + Matches side by side ── */}
        <div className="flex-1 min-h-0 flex overflow-hidden">

          {/* Roster */}
          {hasRoster && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="flex flex-col"
              style={{ width: 660, borderRight: '2px solid #e2e8f0' }}
            >
              <div className="flex items-center gap-3 px-6 py-3 flex-shrink-0" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ width: 4, height: 20, background: c, borderRadius: 2 }} />
                <span style={{ fontSize: 22, fontWeight: 800, color: '#64748b', letterSpacing: '0.06em' }}>ELENCO</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>{roster.length} jogadores</span>
              </div>

              {/* Table header */}
              <div className="flex items-center px-4 py-2 flex-shrink-0" style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                <div style={{ width: 40 }} />
                <div style={{ width: 44 }} />
                <div className="flex-1" />
                <div style={{ width: 68, textAlign: 'center' }}><span style={{ fontSize: 16, fontWeight: 800, color: '#94a3b8' }}>POS</span></div>
                <div style={{ width: 46, textAlign: 'center' }}><span style={{ fontSize: 16, fontWeight: 800, color: '#94a3b8' }}>G</span></div>
                <div style={{ width: 46, textAlign: 'center' }}><span style={{ fontSize: 16, fontWeight: 800, color: '#94a3b8' }}>A</span></div>
                <div style={{ width: 40, textAlign: 'center' }}><span style={{ fontSize: 16, fontWeight: 800, color: '#eab308' }}>CA</span></div>
                <div style={{ width: 40, textAlign: 'center' }}><span style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>CV</span></div>
              </div>

              {/* Player rows */}
              <div className="flex-1 overflow-hidden flex flex-col">
                {roster.slice(0, 14).map((p, idx) => {
                  const ps = playerStatsMap.get(p.id);
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: 0.25 + idx * 0.03 }}
                      className="flex items-center px-4"
                      style={{ height: roster.length > 12 ? 42 : 48, borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#fff' : '#fafbfc' }}
                    >
                      {/* Number */}
                      <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'JetBrains Mono', color: c }}>{p.number || ''}</span>
                      </div>
                      {/* Photo */}
                      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 44 }}>
                        {p.photo_url ? (
                          <img src={p.photo_url} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${c}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: 16, fontWeight: 800, color: c }}>{p.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      {/* Name */}
                      <div className="flex-1 min-w-0 px-2">
                        <span style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', fontFamily: 'Plus Jakarta Sans' }}>{p.name}</span>
                      </div>
                      {/* Position */}
                      <div style={{ width: 68, textAlign: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8' }}>{POS_LABEL[p.position || ''] || p.position || '-'}</span>
                      </div>
                      {/* Goals */}
                      <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'JetBrains Mono', color: (ps?.goals || 0) > 0 ? '#22c55e' : '#e2e8f0' }}>{ps?.goals || 0}</span>
                      </div>
                      {/* Assists */}
                      <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'JetBrains Mono', color: (ps?.assists || 0) > 0 ? '#3b82f6' : '#e2e8f0' }}>{ps?.assists || 0}</span>
                      </div>
                      {/* Yellow */}
                      <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'JetBrains Mono', color: (ps?.yellows || 0) > 0 ? '#eab308' : '#e2e8f0' }}>{ps?.yellows || 0}</span>
                      </div>
                      {/* Red */}
                      <div style={{ width: 40, textAlign: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'JetBrains Mono', color: (ps?.reds || 0) > 0 ? '#ef4444' : '#e2e8f0' }}>{ps?.reds || 0}</span>
                      </div>
                    </motion.div>
                  );
                })}
                {roster.length > 14 && (
                  <div className="flex items-center justify-center py-1" style={{ background: '#f1f5f9' }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>+{roster.length - 14} jogadores</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Games list */}
          <div className={`flex-1 flex flex-col px-6 py-4 overflow-hidden`}>
            <div className="flex items-center gap-3 mb-3 flex-shrink-0">
              <div style={{ width: 4, height: 20, background: c, borderRadius: 2 }} />
              <span style={{ fontSize: 22, fontWeight: 800, color: '#64748b', letterSpacing: '0.06em' }}>JOGOS</span>
            </div>

            <div className="flex-1 flex flex-col gap-2 justify-center">
              {matches.slice(0, hasRoster ? 7 : 8).map((m: any, i: number) => {
                const ht = data.teams[m.home] || { short: m.home, primaryColor: undefined, name: m.home, logo: '' };
                const at = data.teams[m.away] || { short: m.away, primaryColor: undefined, name: m.away, logo: '' };
                const hc = getTeamColor(ht.name, ht.primaryColor);
                const ac = getTeamColor(at.name, at.primaryColor);
                const isHome = m.home === selectedTeam;
                const played = m.scoreHome !== null;
                const won = played && ((isHome && m.scoreHome > m.scoreAway) || (!isHome && m.scoreAway > m.scoreHome));
                const lost = played && ((isHome && m.scoreHome < m.scoreAway) || (!isHome && m.scoreAway < m.scoreHome));
                const resultColor = won ? '#16a34a' : lost ? '#dc2626' : '#ca8a04';

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: 0.22 + i * 0.05 }}
                    className="flex items-center gap-3 px-4"
                    style={{
                      height: hasRoster ? 56 : 64,
                      background: '#f8fafc',
                      borderLeft: `5px solid ${played ? resultColor : '#e2e8f0'}`,
                      borderRadius: 10,
                    }}
                  >
                    <div className="px-1.5 py-0.5 flex-shrink-0" style={{ background: '#f1f5f9', borderRadius: 4 }}>
                      <span style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>
                        {m.round.replace('Rodada ', 'R')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                      <BroadcastText style={{ fontSize: 26, fontWeight: isHome ? 900 : 600, color: isHome ? '#0f172a' : '#94a3b8' }} align="right" minScale={0.45}>
                        {ht.short}
                      </BroadcastText>
                      {ht.logo && <img src={ht.logo} alt="" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />}
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 mx-1" style={{ fontVariantNumeric: 'tabular-nums', minWidth: 70 }}>
                      {played ? (
                        <>
                          <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', width: 22, textAlign: 'center', display: 'inline-block', fontFamily: 'JetBrains Mono' }}>{m.scoreHome}</span>
                          <span style={{ fontSize: 22, color: '#e2e8f0', fontWeight: 700 }}>×</span>
                          <span style={{ fontSize: 32, fontWeight: 900, color: '#0f172a', width: 22, textAlign: 'center', display: 'inline-block', fontFamily: 'JetBrains Mono' }}>{m.scoreAway}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0', display: 'block', textAlign: 'center', width: '100%' }}>vs</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {at.logo && <img src={at.logo} alt="" style={{ width: 34, height: 34, objectFit: 'contain', flexShrink: 0 }} />}
                      <BroadcastText style={{ fontSize: 26, fontWeight: !isHome ? 900 : 600, color: !isHome ? '#0f172a' : '#94a3b8' }} minScale={0.45}>
                        {at.short}
                      </BroadcastText>
                    </div>

                    {played && (
                      <div className="flex items-center justify-center flex-shrink-0" style={{ width: 28, height: 24, background: resultColor, borderRadius: 5 }}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#fff' }}>{won ? 'V' : lost ? 'D' : 'E'}</span>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}