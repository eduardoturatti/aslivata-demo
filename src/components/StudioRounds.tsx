import { motion } from 'motion/react';
import { BroadcastText, getTeamColor } from './BroadcastText';
import { TournamentData } from '../lib/supabase';
import Camada1 from '../imports/Camada1';

interface Props {
  data: TournamentData;
  roundIndex: number;
  onRoundChange?: (i: number) => void;
  fontScale?: number;
  hideControls?: boolean;
}

export function StudioRounds({ data, roundIndex }: Props) {
  const round   = data.rounds[roundIndex] || { name: 'Rodada', matches: [] };
  const matches = round.matches.filter(m => m.home && m.away);

  const teamsInRound = new Set<string>();
  matches.forEach(m => { teamsInRound.add(m.home); teamsInRound.add(m.away); });
  const teamsFolga = Object.keys(data.teams).filter(id => !teamsInRound.has(id));

  const firstMatch = matches[0];
  const dateParts  = firstMatch?.datetime?.split('•').map(s => s.trim()) || [];
  const dateStr = dateParts[0] || '';
  const dayStr  = dateParts[1] || '';

  // Scale: bigger shields, fewer elements
  const n      = matches.length;
  // Increase match height to accommodate larger logos
  const matchH = n <= 2 ? 320 : n <= 3 ? 260 : n <= 4 ? 220 : 180;
  // Double the logo size roughly: (previous was 130 -> 260)
  const logoSz = n <= 2 ? 260 : n <= 3 ? 220 : n <= 4 ? 180 : 140;

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: 'transparent' }}>
      <div className="h-full flex flex-col px-12 py-6">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between mb-5 flex-shrink-0"
        >
          <div className="flex items-center gap-5">
            <div style={{ width: 180, height: 50, '--fill-0': '#0f172a' } as React.CSSProperties}>
              <Camada1 />
            </div>
            <div style={{ width: 2, height: 50, background: '#e2e8f0', borderRadius: 2 }} />
            <span style={{ fontSize: 58, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>
              {round.name}
            </span>
            {(dateStr || dayStr) && (
              <span style={{ fontSize: 28, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.04em' }}>
                {dateStr}{dayStr ? ` \u00b7 ${dayStr}` : ''}
              </span>
            )}
          </div>

          {teamsFolga.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.25, delay: 0.18 }}
              className="flex items-center gap-3"
            >
              <span style={{ fontSize: 24, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.12em' }}>FOLGA</span>
              {teamsFolga.map(id => {
                const t = data.teams[id];
                return (
                  <div
                    key={id}
                    className="flex items-center gap-2 px-3 py-1.5"
                    style={{ background: '#f1f5f9', borderRadius: 8, border: '1px solid #e2e8f0' }}
                  >
                    {t?.logo && <img src={t.logo} alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} />}
                    <span style={{ fontSize: 26, fontWeight: 800, color: '#64748b' }}>{t?.short || id}</span>
                  </div>
                );
              })}
            </motion.div>
          )}
        </motion.div>

        {/* Match cards */}
        <div className="flex-1 flex flex-col justify-center">
          {matches.map((match, i) => {
            const ht = data.teams[match.home] || { name: match.home, short: match.home, logo: '', primaryColor: undefined };
            const at = data.teams[match.away] || { name: match.away, short: match.away, logo: '', primaryColor: undefined };
            const played  = match.scoreHome !== null;
            const homeWin = played && match.scoreHome! > match.scoreAway!;
            const awayWin = played && match.scoreAway! > match.scoreHome!;

            return (
              <motion.div
                key={`${match.home}-${match.away}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35, delay: 0.1 + i * 0.09 }}
                className="flex items-center relative border-b last:border-b-0 py-8"
                style={{
                  height: matchH,
                  borderColor: '#e2e8f0',
                }}
              >
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-max max-w-md text-center">
                   <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {data.teams[match.home]?.stadium || match.city || ''}
                   </span>
                </div>

                {/* Home side */}
                <div className="flex-1 flex items-center justify-end gap-6 pr-2">
                  <div className="flex-1 text-right min-w-0">
                    <BroadcastText
                      style={{
                        fontSize: n > 4 ? 38 : 52, 
                        fontWeight: 900,
                        color: '#0f172a',
                        letterSpacing: '-0.03em',
                        textTransform: 'uppercase',
                        lineHeight: 1,
                        fontFamily: 'Plus Jakarta Sans',
                      }}
                      align="right"
                    >
                      {ht.short}
                    </BroadcastText>
                  </div>
                  {ht.logo && (
                    <motion.img
                      layoutId={`logo-${match.home}-${i}`}
                      src={ht.logo} alt=""
                      style={{ width: logoSz, height: logoSz, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 16px rgba(0,0,0,0.06))' }}
                    />
                  )}
                </div>

                {/* Center */}
                <div className="flex flex-col items-center justify-center flex-shrink-0 mx-3 min-w-[60px] relative z-10">
                  {played ? (
                    <div className="flex items-center gap-2">
                       <span style={{ fontSize: 60, fontWeight: 900, color: '#0f172a', fontFamily: 'JetBrains Mono' }}>{match.scoreHome}</span>
                       <span style={{ fontSize: 38, fontWeight: 300, color: '#e2e8f0' }}>:</span>
                       <span style={{ fontSize: 60, fontWeight: 900, color: '#0f172a', fontFamily: 'JetBrains Mono' }}>{match.scoreAway}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-0">
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#e2e8f0', letterSpacing: '0.1em' }}>VS</span>
                      <span style={{ fontSize: 26, fontWeight: 900, color: '#22c55e', letterSpacing: '-0.02em', marginTop: -2, fontFamily: 'JetBrains Mono' }}>15:30</span>
                    </div>
                  )}
                </div>

                {/* Away side */}
                <div className="flex-1 flex items-center justify-start gap-6 pl-2">
                  {at.logo && (
                    <motion.img
                      layoutId={`logo-${match.away}-${i}`}
                      src={at.logo} alt=""
                      style={{ width: logoSz, height: logoSz, objectFit: 'contain', flexShrink: 0, filter: 'drop-shadow(0 0 16px rgba(0,0,0,0.06))' }}
                    />
                  )}
                  <div className="flex-1 text-left min-w-0">
                    <BroadcastText
                      style={{
                        fontSize: n > 4 ? 38 : 52, 
                        fontWeight: 900,
                        color: '#0f172a',
                        letterSpacing: '-0.03em',
                        textTransform: 'uppercase',
                        lineHeight: 1,
                        fontFamily: 'Plus Jakarta Sans',
                      }}
                      align="left"
                    >
                      {at.short}
                    </BroadcastText>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}