import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { AssistEntry, SQLMatchEvent } from '../lib/supabase';

interface Props {
  assists: AssistEntry[];
  sqlEvents?: SQLMatchEvent[];
}

export function StudioTopAssists({ assists, sqlEvents }: Props) {
  const top = assists.slice(0, 10);
  const maxAssists = top[0]?.assists || 1;

  // Compute games played per player
  const gamesMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!sqlEvents) return map;
    const playerMatches = new Map<string, Set<string>>();
    for (const ev of sqlEvents) {
      if (!playerMatches.has(ev.player_id)) playerMatches.set(ev.player_id, new Set());
      playerMatches.get(ev.player_id)!.add(ev.match_id);
      // Also count assist_player_id
      if (ev.detail?.assist_player_id) {
        if (!playerMatches.has(ev.detail.assist_player_id)) playerMatches.set(ev.detail.assist_player_id, new Set());
        playerMatches.get(ev.detail.assist_player_id)!.add(ev.match_id);
      }
    }
    playerMatches.forEach((matches, pid) => map.set(pid, matches.size));
    return map;
  }, [sqlEvents]);

  if (top.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <span style={{ fontSize: 40, fontWeight: 800, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }}>Sem assistências registradas</span>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full flex flex-col px-12 py-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-5 flex-shrink-0"
        >
          <div className="flex items-center gap-5">
            <div style={{ width: 7, height: 48, background: '#3b82f6', borderRadius: 3 }} />
            <span style={{ fontSize: 52, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>Assistências</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em' }}>MUNICIPAL 2026</span>
        </motion.div>

        <div className="flex-1 flex flex-col justify-center gap-2">
          {top.map((entry, idx) => {
            const barPct = (entry.assists / maxAssists) * 100;
            const isTop1 = idx === 0;
            const isTop3 = idx < 3;
            const medalColor = idx === 0 ? '#3b82f6' : idx === 1 ? '#94a3b8' : idx === 2 ? '#8b5cf6' : '#e2e8f0';
            const games = gamesMap.get(entry.playerId) || 0;
            const ratio = games > 0 ? (entry.assists / games).toFixed(2) : '—';

            return (
              <motion.div
                key={entry.playerId}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.1 + idx * 0.06 }}
                className="flex items-center"
                style={{
                  height: isTop1 ? 84 : 68,
                  background: isTop1 ? 'rgba(59,130,246,0.08)' : '#f8fafc',
                  borderLeft: `6px solid ${medalColor}`,
                  borderRadius: 12, paddingLeft: 16, paddingRight: 20,
                }}
              >
                <div style={{ width: 56, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: isTop1 ? 44 : 34, fontWeight: 900, fontFamily: 'JetBrains Mono', color: isTop3 ? medalColor : '#cbd5e1' }}>{idx + 1}</span>
                </div>
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 56, height: 56 }}>
                  {entry.photo ? (
                    <img src={entry.photo} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${entry.teamColor}` }} />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: `${entry.teamColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: entry.teamColor }}>{entry.playerName.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 px-4">
                  <div style={{ fontSize: isTop1 ? 30 : 26, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans' }}>{entry.playerName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {entry.teamLogo && <img src={entry.teamLogo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />}
                    <span style={{ fontSize: 18, fontWeight: 600, color: '#64748b' }}>{entry.teamName}</span>
                    {entry.number && <span style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>#{entry.number}</span>}
                  </div>
                </div>

                {/* A/J ratio */}
                {games > 0 && (
                  <div className="flex flex-col items-center flex-shrink-0 mr-4" style={{ width: 70 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>A/J</span>
                    <span style={{ fontSize: isTop1 ? 26 : 22, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#22c55e' }}>{ratio}</span>
                  </div>
                )}

                {/* Games played */}
                {games > 0 && (
                  <div className="flex flex-col items-center flex-shrink-0 mr-4" style={{ width: 50 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em' }}>J</span>
                    <span style={{ fontSize: isTop1 ? 26 : 22, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#64748b' }}>{games}</span>
                  </div>
                )}

                {/* Bar */}
                <div style={{ width: 240, flexShrink: 0, marginRight: 12 }}>
                  <div style={{ height: 12, background: '#e2e8f0', borderRadius: 6, overflow: 'hidden' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${barPct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + idx * 0.06 }}
                      style={{ height: '100%', background: isTop1 ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' : entry.teamColor, borderRadius: 6, opacity: isTop3 ? 1 : 0.6 }}
                    />
                  </div>
                </div>

                {/* Assists count */}
                <div style={{ width: 80, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: isTop1 ? 50 : 40, fontWeight: 900, fontFamily: 'JetBrains Mono', color: isTop1 ? '#3b82f6' : '#0f172a' }}>{entry.assists}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
