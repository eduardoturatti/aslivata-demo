import { motion } from 'motion/react';
import { BroadcastText, getTeamColor } from './BroadcastText';
import { TournamentData, PlayoffMatch } from '../lib/supabase';

interface Props { data: TournamentData; }

function getAggregate(m: PlayoffMatch) {
  const agg1 = (m.score1Ida ?? 0) + (m.score1Volta ?? 0);
  const agg2 = (m.score2Ida ?? 0) + (m.score2Volta ?? 0);
  const decided = m.score1Ida !== null && m.score2Ida !== null && m.score1Volta !== null && m.score2Volta !== null;
  let penWin: string | undefined;
  if (decided && agg1 === agg2 && m.penalties1 != null && m.penalties2 != null) {
    penWin = m.penalties1 > m.penalties2 ? m.team1 : m.team2;
  }
  return { agg1, agg2, decided, penWin };
}

function getWinner(m: PlayoffMatch): string | null {
  if (m.winner) return m.winner;
  const { agg1, agg2, decided, penWin } = getAggregate(m);
  if (!decided) return null;
  if (penWin) return penWin;
  if (agg1 !== agg2) return agg1 > agg2 ? m.team1 : m.team2;
  const away1 = m.score1Volta ?? 0;
  const away2 = m.score2Ida ?? 0;
  if (away2 !== away1) return away2 > away1 ? m.team2 : m.team1;
  return null;
}

export function SceneBracket({ data }: Props) {
  const playoffs = data.playoffRounds || [];
  const semis = playoffs[0];
  const final = playoffs[1];
  const standings = data.standings || [];
  const top4 = standings.slice(0, 4);

  const semi1 = semis?.matches[0] || { team1: '', team2: '', score1Ida: null, score2Ida: null, score1Volta: null, score2Volta: null };
  const semi2 = semis?.matches[1] || { team1: '', team2: '', score1Ida: null, score2Ida: null, score1Volta: null, score2Volta: null };
  const finalMatch = final?.matches[0] || { team1: '', team2: '', score1Ida: null, score2Ida: null, score1Volta: null, score2Volta: null };

  const s1t1 = semi1.team1 || top4[0]?.teamId || '';
  const s1t2 = semi1.team2 || top4[3]?.teamId || '';
  const s2t1 = semi2.team1 || top4[1]?.teamId || '';
  const s2t2 = semi2.team2 || top4[2]?.teamId || '';
  const s1proj = !semi1.team1 && !semi1.team2;
  const s2proj = !semi2.team1 && !semi2.team2;

  const s1w = getWinner(semi1);
  const s2w = getWinner(semi2);
  const ft1 = finalMatch.team1 || s1w || '';
  const ft2 = finalMatch.team2 || s2w || '';
  const champion = getWinner(finalMatch);

  return (
    <div className="h-full w-full overflow-hidden" style={{ background: 'transparent' }}>
      <div className="h-full flex flex-col px-10 py-5">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-5 mb-5"
        >
          <div style={{ width: 6, height: 40, background: '#ca8a04', borderRadius: 3 }} />
          <span style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>Playoffs</span>
          <div className="px-4 py-1" style={{ background: '#ca8a04', borderRadius: 8 }}>
            <span style={{ fontSize: 28, fontWeight: 800, color: '#fff', letterSpacing: '0.06em' }}>Mata-mata • Ida e volta</span>
          </div>
        </motion.div>

        <div className="flex-1 flex items-center relative">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
            <motion.line x1="680" y1="180" x2="780" y2="180" stroke="#cbd5e1" strokeWidth="3"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
            <motion.line x1="780" y1="180" x2="780" y2="340" stroke="#cbd5e1" strokeWidth="3"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.6 }} />
            <motion.line x1="680" y1="540" x2="780" y2="540" stroke="#cbd5e1" strokeWidth="3"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.5 }} />
            <motion.line x1="780" y1="540" x2="780" y2="380" stroke="#cbd5e1" strokeWidth="3"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.6 }} />
            <motion.line x1="780" y1="360" x2="870" y2="360" stroke="#cbd5e1" strokeWidth="3"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.7 }} />
          </svg>

          <div className="flex flex-col justify-center gap-16" style={{ width: 680, zIndex: 1 }}>
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <BracketMatch match={semi1} t1={s1t1} t2={s1t2} teams={data.teams}
                label="Semifinal 1" sub={s1proj ? '1º × 4º (projeção)' : '1º × 4º'} projected={s1proj} />
            </motion.div>
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <BracketMatch match={semi2} t1={s2t1} t2={s2t2} teams={data.teams}
                label="Semifinal 2" sub={s2proj ? '2º × 3º (projeção)' : '2º × 3º'} projected={s2proj} />
            </motion.div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center" style={{ zIndex: 1, marginLeft: 60 }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="w-full max-w-[580px]"
            >
              <BracketMatch match={finalMatch} t1={ft1} t2={ft2} teams={data.teams}
                label="Final" sub="Decisão do título" isFinal />
            </motion.div>

            {champion && (() => {
              const team = data.teams[champion];
              const cc = team ? getTeamColor(team.name, team.primaryColor) : '#ca8a04';
              return (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.7 }}
                  className="mt-8 flex flex-col items-center"
                >
                  <span style={{ fontSize: 28, fontWeight: 800, color: '#ca8a04', letterSpacing: '0.2em' }}>CAMPEÃO</span>
                  <div className="flex items-center gap-5 mt-2">
                    {team?.logo && <img src={team.logo} alt="" style={{ width: 58, height: 58, objectFit: 'contain' }} />}
                    <span style={{ fontSize: 42, fontWeight: 900, color: '#0f172a' }}>{team?.short || champion}</span>
                  </div>
                </motion.div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}

function BracketMatch({ match, t1, t2, teams, label, sub, isFinal, projected }: {
  match: PlayoffMatch; t1: string; t2: string; teams: Record<string, any>;
  label: string; sub?: string; isFinal?: boolean; projected?: boolean;
}) {
  const team1 = teams[t1];
  const team2 = teams[t2];
  const c1 = team1 ? getTeamColor(team1.name, team1.primaryColor) : '#999';
  const c2 = team2 ? getTeamColor(team2.name, team2.primaryColor) : '#999';
  const { agg1, agg2, decided } = getAggregate(match);
  const winner = getWinner(match);
  const w1 = winner === t1;
  const w2 = winner === t2;
  const h = isFinal ? 74 : 64;

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <span style={{ fontSize: 30, fontWeight: 800, color: isFinal ? '#ca8a04' : '#3b82f6', letterSpacing: '0.04em' }}>{label}</span>
        {sub && <span style={{ fontSize: 28, fontWeight: 600, color: projected ? '#ca8a04' : '#64748b' }}>{sub}</span>}
      </div>

      <div style={{ background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <TeamRow t={team1} tid={t1} c={c1} ida={match.score1Ida} volta={match.score1Volta}
          agg={decided ? agg1 : null} pen={decided && agg1 === agg2 ? match.penalties1 : null}
          win={w1} lose={w2} h={h} projected={projected} isFinal={isFinal} />
        <div style={{ height: 2, background: '#e2e8f0' }} />
        <TeamRow t={team2} tid={t2} c={c2} ida={match.score2Ida} volta={match.score2Volta}
          agg={decided ? agg2 : null} pen={decided && agg1 === agg2 ? match.penalties2 : null}
          win={w2} lose={w1} h={h} projected={projected} isFinal={isFinal} />
      </div>
    </div>
  );
}

function TeamRow({ t, tid, c, ida, volta, agg, pen, win, lose, h, projected, isFinal }: {
  t: any; tid: string; c: string; ida: number | null; volta: number | null;
  agg: number | null; pen: number | null | undefined;
  win: boolean; lose: boolean; h: number; projected?: boolean; isFinal?: boolean;
}) {
  const logoSz = isFinal ? 44 : 36;

  return (
    <div className="flex items-center" style={{ height: h, borderLeft: `5px solid ${win ? c : `${c}40`}` }}>
      <div className="flex items-center justify-center flex-shrink-0 mx-3" style={{ width: logoSz + 8 }}>
        {t?.logo && <img src={t.logo} alt="" style={{ width: logoSz, height: logoSz, objectFit: 'contain' }} />}
      </div>
      <div className="flex-1 min-w-0 pr-3">
        <BroadcastText
          style={{
            fontSize: isFinal ? 36 : 32, fontWeight: 900,
            color: lose ? '#cbd5e1' : projected ? '#94a3b8' : '#0f172a',
          }}
          minScale={0.45}
        >
          {t?.short || tid || 'A definir'}
        </BroadcastText>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 mr-3">
        <ScoreBox label="IDA" val={ida} dim={lose} sz={isFinal ? 34 : 28} />
        <ScoreBox label="VLT" val={volta} dim={lose} sz={isFinal ? 34 : 28} />
        {pen != null && <ScoreBox label="PÊN" val={pen} dim={false} sz={isFinal ? 34 : 28} amber />}
        <div style={{ width: 1, height: 24, background: '#e2e8f0', margin: '0 3px' }} />
        <ScoreBox label="AGG" val={agg} dim={lose} sz={isFinal ? 38 : 30} highlight={win} color={win ? c : undefined} />
      </div>
      {win && (
        <div className="flex items-center justify-center flex-shrink-0 mr-3" style={{
          width: 26, height: 26, background: c, borderRadius: 6,
        }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: '#fff' }}>✓</span>
        </div>
      )}
    </div>
  );
}

function ScoreBox({ label, val, dim, sz, highlight, color, amber }: {
  label: string; val: number | null; dim: boolean; sz: number;
  highlight?: boolean; color?: string; amber?: boolean;
}) {
  return (
    <div className="text-center" style={{ width: sz + 16 }}>
      <div style={{
        fontSize: 22, fontWeight: 700, letterSpacing: '0.06em', marginBottom: 1,
        color: amber ? '#ca8a04' : highlight ? color : '#94a3b8',
      }}>{label}</div>
      <div className="flex items-center justify-center" style={{
        height: sz,
        background: amber ? 'rgba(202,138,4,0.15)' : highlight ? `${color}15` : '#f1f5f9',
        borderBottom: highlight ? `3px solid ${color}` : amber ? '3px solid #ca8a04' : '3px solid transparent',
        borderRadius: 4,
      }}>
        <span style={{
          fontSize: sz * 0.6, fontWeight: 900, fontVariantNumeric: 'tabular-nums',
          fontFamily: 'JetBrains Mono',
          color: amber ? '#fbbf24' : highlight ? '#0f172a' : dim ? '#e2e8f0' : '#475569',
        }}>
          {val !== null && val !== undefined ? val : '-'}
        </span>
      </div>
    </div>
  );
}