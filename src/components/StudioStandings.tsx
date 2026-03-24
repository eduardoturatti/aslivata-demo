import { useMemo } from 'react';
import { motion } from 'motion/react';
import { BroadcastText, getTeamColor } from './BroadcastText';
import { TournamentData } from '../lib/supabase';

interface Props { data: TournamentData; }

export function StudioStandings({ data }: Props) {
  const standings = data.standings || [];

  // Compute form guide (last 5 W/D/L) from rounds data
  const formMap = useMemo(() => {
    const map = new Map<string, ('W' | 'D' | 'L')[]>();
    standings.forEach(s => map.set(s.teamId, []));
    if (data.rounds) {
      for (const round of data.rounds) {
        for (const m of round.matches) {
          if (m.scoreHome == null || m.scoreAway == null) continue;
          const hForm = map.get(m.home);
          const aForm = map.get(m.away);
          if (m.scoreHome > m.scoreAway) { hForm?.push('W'); aForm?.push('L'); }
          else if (m.scoreAway > m.scoreHome) { aForm?.push('W'); hForm?.push('L'); }
          else { hForm?.push('D'); aForm?.push('D'); }
        }
      }
    }
    // Keep only last 5
    const result = new Map<string, ('W' | 'D' | 'L')[]>();
    map.forEach((v, k) => result.set(k, v.slice(-5)));
    return result;
  }, [data.rounds, standings]);

  if (!standings.length) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <span style={{ fontSize: 40, fontWeight: 800, color: '#94a3b8' }}>Classificação indisponível</span>
      </div>
    );
  }

  const totalTeams = standings.length;
  // Dynamic row sizing to fit all teams in 1080p (header ~100px, table header ~46px, padding ~48px)
  const availableH = 1080 - 100 - 46 - 48;
  const rowH = Math.min(112, Math.floor(availableH / Math.max(totalTeams, 1)));
  const logoSz = Math.min(64, rowH - 16);
  const fontSize = totalTeams > 8 ? { pos: 38, name: 30, pts: 40, stat: 26, header: 22, aprov: 24 }
    : totalTeams > 6 ? { pos: 44, name: 34, pts: 44, stat: 30, header: 24, aprov: 26 }
    : { pos: 52, name: 38, pts: 52, stat: 34, header: 26, aprov: 28 };

  return (
    <div className="h-full w-full overflow-hidden">
      <div className="h-full flex flex-col px-10 py-5">
        {/* Title bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-3 flex-shrink-0"
        >
          <div className="flex items-center gap-5">
            <div style={{ width: 7, height: 48, background: '#22c55e', borderRadius: 3 }} />
            <span style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>Classificação</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div style={{ width: 12, height: 12, background: '#22c55e', borderRadius: 3 }} />
              <span style={{ fontSize: 22, fontWeight: 600, color: '#64748b' }}>Semifinais</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 3 }} />
              <span style={{ fontSize: 22, fontWeight: 600, color: '#64748b' }}>Eliminado</span>
            </div>
          </div>
        </motion.div>

        {/* Table header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: 0.08 }}
          className="flex items-center flex-shrink-0"
          style={{ height: 42, background: '#f1f5f9', borderRadius: '14px 14px 0 0', paddingLeft: 20, paddingRight: 24 }}
        >
          <div style={{ width: 64, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>#</span>
          </div>
          <div style={{ width: 80, flexShrink: 0 }} />
          <div className="flex-1">
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em' }}>TIME</span>
          </div>
          <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>PTS</span>
          </div>
          <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>J</span>
          </div>
          <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>V</span>
          </div>
          <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>E</span>
          </div>
          <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>D</span>
          </div>
          <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>GP</span>
          </div>
          <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>GC</span>
          </div>
          <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>SG</span>
          </div>
          <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>DISC</span>
          </div>
          <div style={{ width: 100, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>APROV</span>
          </div>
          <div style={{ width: 110, textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: fontSize.header, fontWeight: 700, color: '#94a3b8' }}>FORMA</span>
          </div>
        </motion.div>

        {/* All rows */}
        <div className="flex-1 flex flex-col" style={{ borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
          {standings.map((entry: any, idx: number) => {
            const team = data.teams[entry.teamId] || { name: entry.teamId, short: entry.teamId, logo: '', primaryColor: undefined };
            const isPlayoff = entry.pos <= 4;
            const isLeader = entry.pos === 1;
            const isEliminated = entry.pos >= 5;

            let rowBg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
            if (isLeader) rowBg = 'rgba(234,179,8,0.08)';
            if (isEliminated) rowBg = 'rgba(239,68,68,0.04)';

            const leftColor = isLeader ? '#eab308' : isEliminated ? '#ef4444' : '#22c55e';

            return (
              <motion.div
                key={entry.teamId}
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.35, delay: 0.16 + idx * 0.07 }}
                className="flex items-center flex-1"
                style={{ background: rowBg, borderLeft: `7px solid ${leftColor}`, paddingLeft: 13, paddingRight: 24, minHeight: rowH }}
              >
                {/* Position */}
                <div style={{ width: 64, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{
                    fontSize: isLeader ? fontSize.pos + 8 : fontSize.pos, fontWeight: 900, fontFamily: 'JetBrains Mono',
                    color: isLeader ? '#eab308' : isEliminated ? '#ef4444' : '#22c55e',
                    lineHeight: 1,
                  }}>{entry.pos}</span>
                </div>
                {/* Logo */}
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 80 }}>
                  {team.logo && <img src={team.logo} alt="" style={{ width: logoSz, height: logoSz, objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(0,0,0,0.06))' }} />}
                </div>
                {/* Name */}
                <div className="flex-1 min-w-0 pr-4">
                  <BroadcastText style={{ fontSize: fontSize.name, fontWeight: isLeader ? 900 : 800, color: isEliminated ? '#64748b' : '#0f172a', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans' }} minScale={0.45}>
                    {team.name}
                  </BroadcastText>
                </div>
                {/* PTS */}
                <div style={{ width: 90, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: isLeader ? fontSize.pts + 6 : fontSize.pts, fontWeight: 900, color: '#0f172a', fontFamily: 'JetBrains Mono', lineHeight: 1 }}>{entry.tpg}</span>
                </div>
                {/* J */}
                <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: fontSize.stat, fontWeight: 700, color: '#64748b', fontFamily: 'JetBrains Mono' }}>{entry.j}</span>
                </div>
                {/* V */}
                <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: fontSize.stat, fontWeight: 700, color: '#22c55e', fontFamily: 'JetBrains Mono' }}>{entry.v}</span>
                </div>
                {/* E */}
                <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: fontSize.stat, fontWeight: 700, color: '#eab308', fontFamily: 'JetBrains Mono' }}>{entry.e}</span>
                </div>
                {/* D */}
                <div style={{ width: 60, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: fontSize.stat, fontWeight: 700, color: '#ef4444', fontFamily: 'JetBrains Mono' }}>{entry.d}</span>
                </div>
                {/* GP */}
                <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: fontSize.stat, fontWeight: 700, color: '#64748b', fontFamily: 'JetBrains Mono' }}>{entry.gp}</span>
                </div>
                {/* GC */}
                <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: fontSize.stat, fontWeight: 700, color: '#64748b', fontFamily: 'JetBrains Mono' }}>{entry.gc}</span>
                </div>
                {/* SG */}
                <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{
                    fontSize: fontSize.stat, fontWeight: 800, fontFamily: 'JetBrains Mono',
                    color: entry.sg > 0 ? '#22c55e' : entry.sg < 0 ? '#ef4444' : '#94a3b8',
                  }}>{entry.sg > 0 ? `+${entry.sg}` : entry.sg}</span>
                </div>
                {/* DISC */}
                <div style={{ width: 70, textAlign: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: fontSize.stat - 2, fontWeight: 800, color: entry.disc > 0 ? '#ef4444' : '#cbd5e1', fontFamily: 'JetBrains Mono' }}>{entry.disc}</span>
                </div>
                {/* APROV */}
                <div style={{ width: 100, textAlign: 'center', flexShrink: 0 }}>
                  <div className="inline-flex items-center justify-center px-3 py-1" style={{
                    background: entry.pct >= 67 ? '#22c55e' : entry.pct >= 34 ? '#eab308' : entry.pct > 0 ? '#e2e8f0' : '#f1f5f9',
                    borderRadius: 8, minWidth: 76,
                  }}>
                    <span style={{ fontSize: fontSize.aprov, fontWeight: 900, color: entry.pct > 0 ? (entry.pct >= 34 ? '#fff' : '#334155') : '#94a3b8', fontFamily: 'JetBrains Mono' }}>{entry.pct}%</span>
                  </div>
                </div>
                {/* FORMA */}
                <div className="flex items-center justify-center gap-1.5 flex-shrink-0" style={{ width: 110 }}>
                  {(formMap.get(entry.teamId) || []).map((r, fi) => (
                    <div key={fi} style={{
                      width: totalTeams > 8 ? 18 : 22,
                      height: totalTeams > 8 ? 18 : 22,
                      borderRadius: '50%',
                      background: r === 'W' ? '#22c55e' : r === 'D' ? '#eab308' : '#ef4444',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: totalTeams > 8 ? 11 : 13, fontWeight: 900, color: '#fff' }}>
                        {r === 'W' ? 'V' : r === 'D' ? 'E' : 'D'}
                      </span>
                    </div>
                  ))}
                  {(formMap.get(entry.teamId) || []).length === 0 && (
                    <span style={{ fontSize: fontSize.stat - 4, color: '#cbd5e1', fontWeight: 600 }}>-</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}