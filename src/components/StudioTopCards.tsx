import { motion } from 'motion/react';
import type { CardEntry, TeamDiscipline } from '../lib/supabase';

interface Props { cardRanking: CardEntry[]; teamDiscipline: TeamDiscipline[]; }

export function StudioTopCards({ cardRanking, teamDiscipline }: Props) {
  const topPlayers = cardRanking.slice(0, 10);
  const topTeams = teamDiscipline.slice(0, 10);

  if (topPlayers.length === 0 && topTeams.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <span style={{ fontSize: 40, fontWeight: 800, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }}>Sem cartões registrados</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full flex px-10 py-5 gap-6">
        {/* LEFT: Most booked players — 50% */}
        <div className="flex-1 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-4 mb-4 flex-shrink-0"
          >
            <div style={{ width: 7, height: 44, background: '#ef4444', borderRadius: 3 }} />
            <span style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>Ranking de Cartões</span>
          </motion.div>

          <div className="flex-1 flex flex-col justify-center gap-2">
            {topPlayers.map((p, idx) => (
              <motion.div
                key={p.playerId}
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + idx * 0.04 }}
                className="flex items-center"
                style={{
                  height: 76, background: '#f8fafc',
                  borderLeft: `6px solid ${p.teamColor}`, borderRadius: 12,
                  paddingLeft: 14, paddingRight: 18,
                }}
              >
                <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#cbd5e1' }}>{idx + 1}</span>
                </div>
                <div className="flex items-center justify-center flex-shrink-0 mx-3" style={{ width: 52 }}>
                  {p.photo ? (
                    <img src={p.photo} alt="" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: `${p.teamColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: p.teamColor }}>{p.playerName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 px-2">
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans' }}>{p.playerName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {p.teamLogo && <img src={p.teamLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
                    <span style={{ fontSize: 20, fontWeight: 600, color: '#64748b' }}>{p.teamName}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 22, height: 30, background: '#eab308', borderRadius: 4 }} />
                    <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#eab308' }}>{p.yellowCards}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div style={{ width: 22, height: 30, background: '#ef4444', borderRadius: 4 }} />
                    <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#ef4444' }}>{p.redCards}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div style={{ width: 2, background: '#e2e8f0', borderRadius: 2, margin: '10px 0' }} />

        {/* RIGHT: Team Fair Play — 50% */}
        <div className="flex-1 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="flex items-center gap-4 mb-4 flex-shrink-0"
          >
            <div style={{ width: 7, height: 44, background: '#22c55e', borderRadius: 3 }} />
            <span style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>Fair Play</span>
          </motion.div>

          <div className="flex-1 flex flex-col justify-center gap-2">
            {topTeams.map((t, idx) => {
              const isClean = t.disciplinePoints === 0;
              return (
                <motion.div
                  key={t.teamSlug}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.15 + idx * 0.04 }}
                  className="flex items-center"
                  style={{
                    height: 76, background: idx === 0 ? 'rgba(34,197,94,0.06)' : '#f8fafc',
                    borderLeft: `6px solid ${idx === 0 ? '#22c55e' : t.teamColor}`,
                    borderRadius: 12, paddingLeft: 14, paddingRight: 18,
                  }}
                >
                  <div style={{ width: 46, textAlign: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 34, fontWeight: 900, fontFamily: 'JetBrains Mono', color: idx === 0 ? '#22c55e' : '#cbd5e1' }}>{idx + 1}</span>
                  </div>
                  <div className="flex items-center justify-center flex-shrink-0 mx-3" style={{ width: 56 }}>
                    {t.teamLogo && <img src={t.teamLogo} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />}
                  </div>
                  <div className="flex-1 min-w-0 px-2">
                    <span style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', fontFamily: 'Plus Jakarta Sans' }}>{t.teamName}</span>
                  </div>
                  <div className="flex items-center gap-6 flex-shrink-0">
                    <div className="text-center">
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>CA</div>
                      <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#eab308' }}>{t.yellowCards}</div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>CV</div>
                      <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#ef4444' }}>{t.redCards}</div>
                    </div>
                    <div className="text-center" style={{ minWidth: 70 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>PTS</div>
                      <div style={{ fontSize: 34, fontWeight: 900, fontFamily: 'JetBrains Mono', color: isClean ? '#22c55e' : '#0f172a' }}>{t.disciplinePoints}</div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}