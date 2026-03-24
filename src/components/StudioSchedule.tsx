import { motion } from 'motion/react';
import { BroadcastText, getTeamColor } from './BroadcastText';
import { TournamentData, Match } from '../lib/supabase';

interface Props { data: TournamentData; }

type ScheduleItem = {
  roundName: string;
  roundIndex: number;
  match: Match;
  date: string;
  dayOfWeek: string;
  played: boolean;
};

export function StudioSchedule({ data }: Props) {
  const schedule: ScheduleItem[] = data.rounds.map((round, ri) => {
    const broadcastMatch = round.matches.find(m => m.broadcast) || round.matches.find(m => m.home || m.away) || round.matches[0];
    if (!broadcastMatch) return null;
    const played = broadcastMatch.scoreHome !== null;
    const parts  = broadcastMatch.datetime?.split('•').map(s => s.trim()) || [];
    return {
      roundName: round.name,
      roundIndex: ri,
      match: broadcastMatch,
      date: parts[0] || '',
      dayOfWeek: parts[1] || '',
      played,
    };
  }).filter(Boolean) as ScheduleItem[];

  const nextIndex = (schedule as any[]).findIndex((s: any) => !s.played);

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: 'transparent' }}>
      <div className="h-full flex flex-col px-10 py-5">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-4 flex-shrink-0"
        >
          <div className="flex items-center gap-5">
            <div style={{ width: 7, height: 44, background: '#22c55e', borderRadius: 3 }} />
            <span style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>Agenda de Transmissões</span>
          </div>
          <span style={{ fontSize: 28, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>
            Sábados · 15h30
          </span>
        </motion.div>

        {/* ── Schedule rows ── */}
        <div className="flex-1 flex flex-col gap-2.5 justify-center">
          {(schedule as any[]).map((item: any, idx: number) => {
            if (!item.match) return null;
            const homeKey = item.match.home;
            const awayKey = item.match.away;
            const homeIsTBD = !homeKey || homeKey === 'TBD' || !data.teams[homeKey];
            const awayIsTBD = !awayKey || awayKey === 'TBD' || !data.teams[awayKey];
            const ht = homeIsTBD ? null : data.teams[homeKey];
            const at = awayIsTBD ? null : data.teams[awayKey];
            const hc = ht ? getTeamColor(ht.name, ht.primaryColor) : '#94a3b8';
            const ac = at ? getTeamColor(at.name, at.primaryColor) : '#94a3b8';
            const isNext = idx === nextIndex;
            const isPast = item.played;

            // Featured next-game card vs compact row
            if (isNext) {
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: 0.08 + idx * 0.06 }}
                  style={{
                    background: '#f1f5f9',
                    borderLeft: '8px solid #dc2626',
                    borderRadius: 16,
                    border: '1px solid #e2e8f0',
                    overflow: 'hidden',
                  }}
                >
                  {/* Featured card: two rows */}
                  <div className="flex items-center" style={{ height: 130 }}>
                    {/* Date */}
                    <div className="flex flex-col items-center justify-center flex-shrink-0" style={{ width: 170, borderRight: '2px solid #e2e8f0' }}>
                      <span style={{ fontSize: 38, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono' }}>
                        {item.date}
                      </span>
                      <span style={{ fontSize: 26, fontWeight: 600, color: '#64748b', marginTop: 4, textTransform: 'capitalize' }}>
                        {item.dayOfWeek}
                      </span>
                    </div>

                    {/* Round badge */}
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 120 }}>
                      <div className="px-4 py-1.5" style={{ background: '#dc2626', borderRadius: 8 }}>
                        <span style={{ fontSize: 28, fontWeight: 900, color: '#fff' }}>
                          {item.roundName.replace('Rodada ', 'R')}
                        </span>
                      </div>
                    </div>

                    {/* Home team */}
                    <div className="flex items-center gap-4 flex-1 min-w-0 justify-end pr-4">
                      {homeIsTBD ? (
                        <span style={{ fontSize: 72, fontWeight: 900, color: '#cbd5e1' }}>?</span>
                      ) : (
                        <>
                          <BroadcastText
                            style={{ fontSize: 42, fontWeight: 900, color: '#0f172a' }}
                            align="right" minScale={0.5}
                          >
                            {ht!.short}
                          </BroadcastText>
                          {ht!.logo && (
                            <img src={ht!.logo} alt="" style={{ width: 76, height: 76, objectFit: 'contain', flexShrink: 0 }} />
                          )}
                        </>
                      )}
                    </div>

                    {/* VS */}
                    <div className="flex items-center justify-center flex-shrink-0" style={{ width: 120 }}>
                      <span style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}>VS</span>
                    </div>

                    {/* Away team */}
                    <div className="flex items-center gap-4 flex-1 min-w-0 pl-4">
                      {awayIsTBD ? (
                        <span style={{ fontSize: 72, fontWeight: 900, color: '#cbd5e1' }}>?</span>
                      ) : (
                        <>
                          {at!.logo && (
                            <img src={at!.logo} alt="" style={{ width: 76, height: 76, objectFit: 'contain', flexShrink: 0 }} />
                          )}
                          <BroadcastText
                            style={{ fontSize: 42, fontWeight: 900, color: '#0f172a' }}
                            minScale={0.5}
                          >
                            {at!.short}
                          </BroadcastText>
                        </>
                      )}
                    </div>

                    {/* Stadium */}
                    <div className="flex-shrink-0 pr-6 pl-2" style={{ width: 240 }}>
                      <BroadcastText
                        style={{ fontSize: 26, fontWeight: 600, color: '#64748b' }}
                        minScale={0.45}
                        align="right"
                      >
                        {ht && data.teams[item.match.home]?.stadium ? data.teams[item.match.home].stadium : (item.match.city || 'A definir')}
                      </BroadcastText>
                    </div>
                  </div>
                </motion.div>
              );
            }

            // Compact row for past + future (non-featured)
            const rowH = (schedule as any[]).length <= 7 ? 82 : 70;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: 0.08 + idx * 0.06 }}
                className="flex items-center"
                style={{
                  height: rowH,
                  background: isPast ? '#fafbfc' : '#f8fafc',
                  borderLeft: `5px solid ${isPast ? '#e2e8f0' : hc}`,
                  borderRadius: 12,
                }}
              >
                {/* Date */}
                <div className="flex flex-col items-center justify-center flex-shrink-0 px-5" style={{ width: 155 }}>
                  <span style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, color: isPast ? '#cbd5e1' : '#0f172a', fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono' }}>
                    {item.date}
                  </span>
                  <span style={{ fontSize: 22, fontWeight: 600, color: isPast ? '#e2e8f0' : '#64748b', textTransform: 'capitalize' }}>
                    {item.dayOfWeek}
                  </span>
                </div>

                <div style={{ width: 1, height: '50%', background: '#e2e8f0', flexShrink: 0 }} />

                {/* Round badge */}
                <div className="flex items-center justify-center flex-shrink-0 px-3" style={{ width: 110 }}>
                  <div className="px-3 py-0.5" style={{ background: isPast ? '#f1f5f9' : '#22c55e', borderRadius: 6 }}>
                    <span style={{ fontSize: 26, fontWeight: 800, color: isPast ? '#94a3b8' : '#fff' }}>
                      {item.roundName.replace('Rodada ', 'R')}
                    </span>
                  </div>
                </div>

                {/* Home */}
                <div className="flex items-center gap-3 flex-1 min-w-0 justify-end pr-3">
                  {homeIsTBD ? (
                    <span style={{ fontSize: 52, fontWeight: 900, color: '#cbd5e1' }}>?</span>
                  ) : (
                    <>
                      <BroadcastText
                        style={{ fontSize: 34, fontWeight: 900, color: isPast ? '#cbd5e1' : '#0f172a' }}
                        align="right" minScale={0.5}
                      >
                        {ht!.short}
                      </BroadcastText>
                      {ht!.logo && (
                        <img src={ht!.logo} alt="" style={{ width: 48, height: 48, objectFit: 'contain', opacity: isPast ? 0.35 : 1, flexShrink: 0 }} />
                      )}
                    </>
                  )}
                </div>

                {/* Score or indicator */}
                <div className="flex items-center justify-center flex-shrink-0" style={{ width: 110 }}>
                  {isPast ? (
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 38, fontWeight: 900, fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono', color: item.match.scoreHome! > item.match.scoreAway! ? '#0f172a' : '#cbd5e1' }}>
                        {item.match.scoreHome}
                      </span>
                      <span style={{ fontSize: 26, fontWeight: 700, color: '#e2e8f0' }}>×</span>
                      <span style={{ fontSize: 38, fontWeight: 900, fontVariantNumeric: 'tabular-nums', fontFamily: 'JetBrains Mono', color: item.match.scoreAway! > item.match.scoreHome! ? '#0f172a' : '#cbd5e1' }}>
                        {item.match.scoreAway}
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 28, fontWeight: 700, color: '#22c55e', fontFamily: 'JetBrains Mono' }}>15:30</span>
                  )}
                </div>

                {/* Away */}
                <div className="flex items-center gap-3 flex-1 min-w-0 pl-3">
                  {awayIsTBD ? (
                    <span style={{ fontSize: 52, fontWeight: 900, color: '#cbd5e1' }}>?</span>
                  ) : (
                    <>
                      {at!.logo && (
                        <img src={at!.logo} alt="" style={{ width: 48, height: 48, objectFit: 'contain', opacity: isPast ? 0.35 : 1, flexShrink: 0 }} />
                      )}
                      <BroadcastText
                        style={{ fontSize: 34, fontWeight: 900, color: isPast ? '#cbd5e1' : '#0f172a' }}
                        minScale={0.5}
                      >
                        {at!.short}
                      </BroadcastText>
                    </>
                  )}
                </div>

                {/* Stadium */}
                <div className="flex-shrink-0 pr-5" style={{ width: 230 }}>
                  <BroadcastText
                    style={{ fontSize: 24, fontWeight: 600, color: isPast ? '#e2e8f0' : '#94a3b8' }}
                    align="right" minScale={0.4}
                  >
                    {ht && data.teams[item.match.home]?.stadium ? data.teams[item.match.home].stadium : (item.match.city || 'A definir')}
                  </BroadcastText>
                </div>
              </motion.div>
            );
          })}
        </div>
        {/* Footer intentionally removed — info is in the global header */}
      </div>
    </div>
  );
}