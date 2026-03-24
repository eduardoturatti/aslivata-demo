import { useMemo } from 'react';
import { motion } from 'motion/react';
import type { ScorerEntry, SQLMatchEvent } from '../lib/supabase';

interface Props {
  scorers: ScorerEntry[];
  sqlEvents?: SQLMatchEvent[];
}

export function StudioTopScorers({ scorers, sqlEvents }: Props) {
  const top = scorers.slice(0, 14);
  const maxGoals = top[0]?.goals || 1;

  const gamesMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!sqlEvents) return map;
    const playerMatches = new Map<string, Set<string>>();
    for (const ev of sqlEvents) {
      if (!playerMatches.has(ev.player_id)) playerMatches.set(ev.player_id, new Set());
      playerMatches.get(ev.player_id)!.add(ev.match_id);
    }
    playerMatches.forEach((matches, pid) => map.set(pid, matches.size));
    return map;
  }, [sqlEvents]);

  if (top.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <span style={{ fontSize: 40, fontWeight: 800, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }}>Sem gols registrados</span>
      </div>
    );
  }

  // Split into two columns
  const half = Math.ceil(top.length / 2);
  const col1 = top.slice(0, half);
  const col2 = top.slice(half);

  const renderRow = (scorer: ScorerEntry, idx: number, globalIdx: number) => {
    const barPct = (scorer.goals / maxGoals) * 100;
    const isTop1 = globalIdx === 0;
    const isTop3 = globalIdx < 3;
    const medalColor = globalIdx === 0 ? '#eab308' : globalIdx === 1 ? '#94a3b8' : globalIdx === 2 ? '#cd7f32' : '#e2e8f0';
    const games = gamesMap.get(scorer.playerId) || 0;
    const ratio = games > 0 ? (scorer.goals / games).toFixed(2) : '—';

    return (
      <motion.div
        key={scorer.playerId}
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.1 + globalIdx * 0.04 }}
        className="flex items-center"
        style={{
          height: isTop1 ? 100 : 86,
          background: isTop1 ? 'rgba(234,179,8,0.08)' : '#f8fafc',
          borderLeft: `6px solid ${medalColor}`,
          borderRadius: 12,
          paddingLeft: 14, paddingRight: 16,
        }}
      >
        {/* Position */}
        <div style={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: isTop1 ? 44 : 38, fontWeight: 900, fontFamily: 'JetBrains Mono', color: isTop3 ? medalColor : '#cbd5e1' }}>{globalIdx + 1}</span>
        </div>

        {/* Photo */}
        <div className="flex items-center justify-center flex-shrink-0" style={{ width: 64, height: 64 }}>
          {scorer.photo ? (
            <img src={scorer.photo} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${scorer.teamColor}` }} />
          ) : (
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: `${scorer.teamColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: scorer.teamColor }}>{scorer.playerName.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Name + Team */}
        <div className="flex-1 min-w-0 px-3">
          <div style={{ fontSize: isTop1 ? 30 : 28, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans' }}>
            {scorer.playerName}
          </div>
          <div className="flex items-center gap-2 mt-1">
            {scorer.teamLogo && <img src={scorer.teamLogo} alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} />}
            <span style={{ fontSize: 20, fontWeight: 600, color: '#64748b' }}>{scorer.teamName}</span>
          </div>
        </div>

        {/* G/J ratio */}
        {games > 0 && (
          <div className="flex flex-col items-center flex-shrink-0 mr-3" style={{ width: 60 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>G/J</span>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#22c55e' }}>{ratio}</span>
          </div>
        )}

        {/* Goals */}
        <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: isTop1 ? 50 : 42, fontWeight: 900, fontFamily: 'JetBrains Mono', color: isTop1 ? '#eab308' : '#0f172a' }}>{scorer.goals}</span>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full flex flex-col px-10 py-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-4 flex-shrink-0"
        >
          <div className="flex items-center gap-5">
            <div style={{ width: 7, height: 48, background: '#eab308', borderRadius: 3 }} />
            <span style={{ fontSize: 52, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>Artilharia</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.08em' }}>MUNICIPAL 2026</span>
        </motion.div>

        {/* Two columns */}
        <div className="flex-1 flex gap-6">
          <div className="flex-1 flex flex-col justify-center gap-2">
            {col1.map((s, i) => renderRow(s, i, i))}
          </div>
          <div style={{ width: 2, background: '#e2e8f0', borderRadius: 2, margin: '20px 0' }} />
          <div className="flex-1 flex flex-col justify-center gap-2">
            {col2.map((s, i) => renderRow(s, i, i + half))}
          </div>
        </div>
      </div>
    </div>
  );
}
