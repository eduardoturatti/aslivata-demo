import { useMemo } from 'react';
import { motion } from 'motion/react';
import { BroadcastText, getTeamColor } from './BroadcastText';
import { TournamentData } from '../lib/supabase';

interface Props {
  data: TournamentData;
  team1Id: string | null;
  team2Id: string | null;
}

export function SceneManoAMano({ data, team1Id, team2Id }: Props) {
  const t1 = team1Id ? data.teams[team1Id] : null;
  const t2 = team2Id ? data.teams[team2Id] : null;

  if (!t1 || !t2 || !team1Id || !team2Id) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-8" style={{ background: 'transparent' }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em' }}>MANO A MANO</div>
        <div style={{ fontSize: 40, fontWeight: 800, color: '#64748b' }}>Selecione dois times no painel</div>
      </div>
    );
  }

  const s1 = data.standings?.find(s => s.teamId === team1Id);
  const s2 = data.standings?.find(s => s.teamId === team2Id);
  const c1 = getTeamColor(t1.name, t1.primaryColor);
  const c2 = getTeamColor(t2.name, t2.primaryColor);

  // Enriched stats from standings data
  const stats = useMemo(() => {
    const rows: { label: string; v1: number; v2: number; fmt?: (v: number) => string; lower?: boolean; icon?: string }[] = [
      { label: 'Pontos', v1: s1?.tpg ?? 0, v2: s2?.tpg ?? 0, icon: '🏆' },
      { label: 'Vitórias', v1: s1?.v ?? 0, v2: s2?.v ?? 0, icon: '✅' },
      { label: 'Empates', v1: s1?.e ?? 0, v2: s2?.e ?? 0, icon: '🤝' },
      { label: 'Derrotas', v1: s1?.d ?? 0, v2: s2?.d ?? 0, lower: true, icon: '❌' },
      { label: 'Gols Pró', v1: s1?.gp ?? 0, v2: s2?.gp ?? 0, icon: '⚽' },
      { label: 'Gols Sofridos', v1: s1?.gc ?? 0, v2: s2?.gc ?? 0, lower: true, icon: '🥅' },
      { label: 'Saldo de Gols', v1: s1?.sg ?? 0, v2: s2?.sg ?? 0, fmt: (v) => v > 0 ? `+${v}` : `${v}`, icon: '📊' },
      { label: 'Aproveitamento', v1: s1?.pct ?? 0, v2: s2?.pct ?? 0, fmt: (v) => `${v}%`, icon: '📈' },
      { label: 'Disciplina', v1: s1?.disc ?? 0, v2: s2?.disc ?? 0, lower: true, icon: '🟨' },
    ];
    return rows;
  }, [s1, s2]);

  const allZero = stats.every(s => s.v1 === 0 && s.v2 === 0);

  const h2h = data.rounds?.flatMap(r =>
    r.matches
      .filter(m =>
        (m.home === team1Id && m.away === team2Id) ||
        (m.home === team2Id && m.away === team1Id)
      )
      .filter(m => m.scoreHome !== null)
      .map(m => ({ ...m, roundName: r.name }))
  ) ?? [];

  // Count H2H wins
  const h2hWins1 = h2h.filter(m => {
    const g1 = m.home === team1Id ? m.scoreHome! : m.scoreAway!;
    const g2 = m.home === team1Id ? m.scoreAway! : m.scoreHome!;
    return g1 > g2;
  }).length;
  const h2hWins2 = h2h.filter(m => {
    const g2 = m.home === team2Id ? m.scoreHome! : m.scoreAway!;
    const g1 = m.home === team2Id ? m.scoreAway! : m.scoreHome!;
    return g2 > g1;
  }).length;
  const h2hDraws = h2h.length - h2hWins1 - h2hWins2;

  const barW = 320;

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: 'transparent' }}>
      <div className="h-full flex flex-col items-center px-10 py-5">

        {/* ── Title ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-center mb-3 flex-shrink-0"
        >
          <span style={{ fontSize: 26, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.2em' }}>MANO A MANO</span>
        </motion.div>

        {/* ── Shields ── */}
        <div className="flex items-center flex-shrink-0" style={{ marginBottom: 16 }}>
          {/* Team 1 */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="flex-1 flex flex-col items-center"
            style={{ minWidth: 0 }}
          >
            {t1.logo ? (
              <img src={t1.logo} alt={t1.short} style={{ width: 140, height: 140, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: c1, opacity: 0.25 }} />
            )}
            <div style={{ marginTop: 10 }}>
              <BroadcastText style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', lineHeight: 1 }} align="center">
                {t1.short}
              </BroadcastText>
            </div>
            {s1 && (
              <div style={{ fontSize: 22, fontWeight: 600, color: '#64748b', marginTop: 2, textAlign: 'center' }}>
                {s1.pos}º lugar · {s1.tpg} pts
              </div>
            )}
          </motion.div>

          {/* VS + H2H summary */}
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.18 }}
            className="flex flex-col items-center justify-center flex-shrink-0"
            style={{ width: 200 }}
          >
            <span style={{ fontSize: 70, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>VS</span>
            {h2h.length > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <span style={{ fontSize: 28, fontWeight: 900, color: c1, fontFamily: 'JetBrains Mono' }}>{h2hWins1}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#cbd5e1' }}>·</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8' }}>{h2hDraws}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: '#cbd5e1' }}>·</span>
                <span style={{ fontSize: 28, fontWeight: 900, color: c2, fontFamily: 'JetBrains Mono' }}>{h2hWins2}</span>
              </div>
            )}
          </motion.div>

          {/* Team 2 */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="flex-1 flex flex-col items-center"
            style={{ minWidth: 0 }}
          >
            {t2.logo ? (
              <img src={t2.logo} alt={t2.short} style={{ width: 140, height: 140, objectFit: 'contain' }} />
            ) : (
              <div style={{ width: 140, height: 140, borderRadius: '50%', background: c2, opacity: 0.25 }} />
            )}
            <div style={{ marginTop: 10 }}>
              <BroadcastText style={{ fontSize: 40, fontWeight: 900, color: '#0f172a', lineHeight: 1 }} align="center">
                {t2.short}
              </BroadcastText>
            </div>
            {s2 && (
              <div style={{ fontSize: 22, fontWeight: 600, color: '#64748b', marginTop: 2, textAlign: 'center' }}>
                {s2.pos}º lugar · {s2.tpg} pts
              </div>
            )}
          </motion.div>
        </div>

        {/* ── Stats comparison — 9 metrics ── */}
        {allZero ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="flex-1 flex items-center justify-center"
          >
            <span style={{ fontSize: 36, fontWeight: 700, color: '#94a3b8' }}>Campeonato ainda não iniciado</span>
          </motion.div>
        ) : (
          <div className="flex-1 flex flex-col justify-center gap-1.5">
            {stats.map((stat, idx) => {
              const max = Math.max(Math.abs(stat.v1), Math.abs(stat.v2), 1);
              const p1 = (Math.abs(stat.v1) / max) * 100;
              const p2 = (Math.abs(stat.v2) / max) * 100;
              // For "lower is better" stats, invert who "wins"
              const w1 = stat.lower ? stat.v1 < stat.v2 : stat.v1 > stat.v2;
              const w2 = stat.lower ? stat.v2 < stat.v1 : stat.v2 > stat.v1;

              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.22 + idx * 0.05 }}
                  className="flex items-center gap-3"
                  style={{ height: 48 }}
                >
                  {/* Value left */}
                  <div style={{ width: 90, textAlign: 'right', flexShrink: 0 }}>
                    <span style={{
                      fontSize: 36, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                      color: '#0f172a',
                      fontFamily: 'JetBrains Mono',
                    }}>
                      {stat.fmt ? stat.fmt(stat.v1) : stat.v1}
                    </span>
                  </div>

                  {/* Bar left */}
                  <div className="flex justify-end" style={{ width: barW, height: 18, background: '#e2e8f0', borderRadius: 5 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, p1)}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + idx * 0.05 }}
                      style={{ height: '100%', background: c1, borderRadius: 5 }}
                    />
                  </div>

                  {/* Label center */}
                  <div style={{ width: 200, textAlign: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.02em' }}>
                      {stat.label}
                    </span>
                  </div>

                  {/* Bar right */}
                  <div style={{ width: barW, height: 18, background: '#e2e8f0', borderRadius: 5 }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(4, p2)}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + idx * 0.05 }}
                      style={{ height: '100%', background: c2, borderRadius: 5 }}
                    />
                  </div>

                  {/* Value right */}
                  <div style={{ width: 90, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 36, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
                      color: '#0f172a',
                      fontFamily: 'JetBrains Mono',
                    }}>
                      {stat.fmt ? stat.fmt(stat.v2) : stat.v2}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Head-to-head results ── */}
        {h2h.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25, delay: 0.75 }}
            className="mt-2 pt-3 flex-shrink-0"
            style={{ borderTop: '2px solid #e2e8f0' }}
          >
            <div className="flex items-center justify-center gap-6">
              <span style={{ fontSize: 22, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.15em' }}>
                CONFRONTOS DIRETOS
              </span>
              {h2h.slice(0, 4).map((m: any, i: number) => {
                const isT1Home = m.home === team1Id;
                const g1 = isT1Home ? m.scoreHome : m.scoreAway;
                const g2 = isT1Home ? m.scoreAway : m.scoreHome;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-4 py-1.5"
                    style={{ background: '#f1f5f9', borderRadius: 10, border: '1px solid #e2e8f0' }}
                  >
                    <span style={{ fontSize: 32, fontWeight: 900, color: c1, fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono' }}>{g1}</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: '#e2e8f0' }}>×</span>
                    <span style={{ fontSize: 32, fontWeight: 900, color: c2, fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono' }}>{g2}</span>
                    <span style={{ fontSize: 18, fontWeight: 600, color: '#94a3b8', marginLeft: 2 }}>{m.roundName}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}