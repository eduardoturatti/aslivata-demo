// ============================================================
// STUDIO ZEBRA — Broadcast scene 1920x1080
// Compares what the galera predicted (odds from bolao) vs actual results
// Shows stacked bar charts per match, highlighting "zebras" (upsets)
// MUST FIT 1920x1080 with no scroll — max 3 cards
// ============================================================
import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { getBolaoStats } from '../lib/galera-api';
import { COMPETITION_ID } from '../lib/supabase';
import { fetchMatches } from '../lib/public-supabase';
import { Zap, TrendingUp, AlertTriangle, Check, X } from 'lucide-react';

interface Props {
  competitionId?: string;
  roundIndex?: number | null;
}

function TeamLogo({ url, name, size = 48 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold shrink-0"
        style={{ width: size, height: size, fontSize: size * 0.35 }}>
        {name.slice(0, 3)}
      </div>
    );
  }
  return <img src={url} alt={name} width={size} height={size} loading="lazy" decoding="async" onError={() => setErr(true)} className="object-contain shrink-0" />;
}

interface MatchWithStats {
  id: string;
  home_team: any;
  away_team: any;
  score_home: number;
  score_away: number;
  round_number: number;
  home_pct: number;
  draw_pct: number;
  away_pct: number;
  top_score: string;
  top_score_pct: number;
  total_preds: number;
  isZebra: boolean;
  actualResult: 'home' | 'draw' | 'away';
  favoritePct: number;
}

export function StudioZebra({ competitionId = COMPETITION_ID, roundIndex = null }: Props) {
  const [matches, setMatches] = useState<MatchWithStats[]>([]);
  const [loaded, setLoaded] = useState(false);

  const selectedRoundNumber = roundIndex !== null && roundIndex !== undefined ? roundIndex + 1 : null;

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, allMatches] = await Promise.all([
          getBolaoStats(competitionId),
          fetchMatches(),
        ]);
        const stats = statsRes.stats || {};
        const finished = allMatches.filter(
          (m: any) => m.status === 'finished' && m.score_home != null && m.score_away != null && stats[m.id]
        );
        const enriched: MatchWithStats[] = finished.map((m: any) => {
          const st = stats[m.id];
          const actualResult: 'home' | 'draw' | 'away' =
            m.score_home > m.score_away ? 'home' :
            m.score_home < m.score_away ? 'away' : 'draw';
          const maxPct = Math.max(st.home_pct, st.draw_pct, st.away_pct);
          const favResult =
            st.home_pct === maxPct ? 'home' :
            st.away_pct === maxPct ? 'away' : 'draw';
          const isZebra = favResult !== actualResult;
          const favoritePct =
            actualResult === 'home' ? st.home_pct :
            actualResult === 'away' ? st.away_pct : st.draw_pct;
          return {
            id: m.id,
            home_team: m.home_team || { short_name: '?', logo_url: '', color: '#6366f1' },
            away_team: m.away_team || { short_name: '?', logo_url: '', color: '#ef4444' },
            score_home: m.score_home,
            score_away: m.score_away,
            round_number: m.round_number,
            home_pct: st.home_pct,
            draw_pct: st.draw_pct,
            away_pct: st.away_pct,
            top_score: st.top_score,
            top_score_pct: st.top_score_pct,
            total_preds: st.total,
            isZebra,
            actualResult,
            favoritePct,
          };
        });
        enriched.sort((a, b) => {
          if (a.isZebra !== b.isZebra) return a.isZebra ? -1 : 1;
          if (a.isZebra && b.isZebra) return a.favoritePct - b.favoritePct;
          return b.round_number - a.round_number;
        });
        setMatches(enriched);
        setLoaded(true);
      } catch (e) {
        console.error('StudioZebra: Error loading:', e);
        setLoaded(true);
      }
    }
    load();
  }, [competitionId]);

  const filteredMatches = useMemo(() => {
    if (selectedRoundNumber === null) return [];
    return matches.filter(m => m.round_number === selectedRoundNumber);
  }, [matches, selectedRoundNumber]);

  const filteredZebraCount = useMemo(() => filteredMatches.filter(m => m.isZebra).length, [filteredMatches]);

  if (selectedRoundNumber === null) {
    return (
      <div className="h-full w-full flex items-center justify-center" style={{ background: '#f1f5f9' }}>
        <div className="text-center">
          <Zap className="w-32 h-32 mx-auto mb-6 text-slate-300" />
          <span style={{ fontSize: 72, fontWeight: 900, color: '#cbd5e1', fontFamily: 'Plus Jakarta Sans' }}>
            Zebra do Bolão
          </span>
          <p style={{ fontSize: 36, fontWeight: 600, color: '#94a3b8', marginTop: 16 }}>
            Selecione uma rodada no painel admin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col p-6 overflow-hidden" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Title — compact */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-3 flex-shrink-0"
      >
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-10 h-1 rounded-full bg-amber-500" />
          <span style={{ fontSize: 20, fontWeight: 700, color: '#eab308', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Power Sports
          </span>
          <div className="w-10 h-1 rounded-full bg-amber-500" />
        </div>
        <div className="flex items-center justify-center gap-3">
          <Zap className="w-10 h-10 text-yellow-500" />
          <h1 style={{ fontSize: 52, fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-0.02em' }}>
            Zebra do Bolão
          </h1>
          <Zap className="w-10 h-10 text-yellow-500" />
        </div>
        <p style={{ fontSize: 22, color: '#64748b', marginTop: 4, fontWeight: 600 }}>
          Rodada {selectedRoundNumber} • O que a galera apostou vs o que aconteceu
        </p>
      </motion.div>

      {filteredMatches.length === 0 && loaded ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Zap className="w-32 h-32 mx-auto mb-6 text-slate-300" />
            <span style={{ fontSize: 56, fontWeight: 700, color: '#94a3b8' }}>Nenhum jogo finalizado com palpites</span>
          </div>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Stats summary */}
          {filteredZebraCount > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="mb-3 flex items-center justify-center flex-shrink-0"
            >
              <div className="flex items-center gap-3 px-5 py-2 rounded-2xl" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', border: '3px solid #eab30860' }}>
                <Zap className="w-8 h-8 text-yellow-600" />
                <span style={{ fontSize: 32, fontWeight: 900, color: '#92400e' }}>
                  {filteredZebraCount} {filteredZebraCount === 1 ? 'ZEBRA' : 'ZEBRAS'}
                </span>
                <span style={{ fontSize: 26, fontWeight: 600, color: '#92400e' }}>
                  em {filteredMatches.length} jogos
                </span>
              </div>
            </motion.div>
          )}

          {/* Match cards — COMPACT vertical stack */}
          <div className="flex-1 flex flex-col gap-3 justify-center overflow-hidden">
            {filteredMatches.slice(0, 3).map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + idx * 0.08 }}
                className="rounded-xl overflow-hidden flex-shrink-0"
                style={{
                  background: m.isZebra
                    ? 'linear-gradient(135deg, #fef9c3 0%, #fffbeb 100%)'
                    : '#fff',
                  border: m.isZebra ? '3px solid #eab30860' : '2px solid #e2e8f0',
                  boxShadow: m.isZebra ? '0 8px 24px rgba(234,179,8,0.15)' : '0 4px 12px rgba(0,0,0,0.06)',
                }}
              >
                {/* Zebra badge — thin */}
                {m.isZebra && (
                  <div className="flex items-center gap-2 px-4 py-1" style={{ background: 'linear-gradient(90deg, #f59e0b, #eab308)', borderBottom: '2px solid #eab30840' }}>
                    <Zap className="w-5 h-5 text-white" />
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      ZEBRA! Resultado surpreendeu {(100 - m.favoritePct).toFixed(0)}% da galera
                    </span>
                  </div>
                )}

                {/* Match header with result — compact */}
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <TeamLogo url={m.home_team.logo_url} name={m.home_team.short_name} size={48} />
                    <span style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.home_team.short_name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 flex-shrink-0">
                    <span style={{
                      fontSize: 44, fontWeight: 900, fontFamily: 'JetBrains Mono',
                      color: m.actualResult === 'home' ? '#16a34a' : '#0f172a',
                    }}>
                      {m.score_home}
                    </span>
                    <span style={{ fontSize: 28, fontWeight: 700, color: '#94a3b8' }}>×</span>
                    <span style={{
                      fontSize: 44, fontWeight: 900, fontFamily: 'JetBrains Mono',
                      color: m.actualResult === 'away' ? '#16a34a' : '#0f172a',
                    }}>
                      {m.score_away}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                    <span style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>
                      {m.away_team.short_name}
                    </span>
                    <TeamLogo url={m.away_team.logo_url} name={m.away_team.short_name} size={48} />
                  </div>
                </div>

                {/* Stacked bar — compact */}
                <div className="px-4 pb-1.5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-4 h-4 text-slate-400" />
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Palpites da galera
                    </span>
                  </div>
                  <div className="flex rounded-lg overflow-hidden mb-1" style={{ height: 44, background: '#f1f5f9' }}>
                    {m.home_pct > 0 && (
                      <div
                        className="flex items-center justify-center relative"
                        style={{
                          width: `${m.home_pct}%`,
                          backgroundColor: m.home_team.color || '#6366f1',
                          minWidth: m.home_pct > 5 ? 50 : 0,
                        }}
                      >
                        <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                          {m.home_pct.toFixed(1)}%
                        </span>
                        {m.actualResult === 'home' && (
                          <Check className="w-5 h-5 text-white absolute right-1 top-1" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                        )}
                      </div>
                    )}
                    {m.draw_pct > 0 && (
                      <div
                        className="flex items-center justify-center relative"
                        style={{
                          width: `${m.draw_pct}%`,
                          backgroundColor: '#6b7280',
                          minWidth: m.draw_pct > 5 ? 40 : 0,
                        }}
                      >
                        <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                          {m.draw_pct.toFixed(1)}%
                        </span>
                        {m.actualResult === 'draw' && (
                          <Check className="w-5 h-5 text-white absolute right-1 top-1" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                        )}
                      </div>
                    )}
                    {m.away_pct > 0 && (
                      <div
                        className="flex items-center justify-center relative"
                        style={{
                          width: `${m.away_pct}%`,
                          backgroundColor: m.away_team.color || '#ef4444',
                          minWidth: m.away_pct > 5 ? 50 : 0,
                        }}
                      >
                        <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', fontFamily: 'JetBrains Mono', textShadow: '0 2px 4px rgba(0,0,0,0.4)' }}>
                          {m.away_pct.toFixed(1)}%
                        </span>
                        {m.actualResult === 'away' && (
                          <Check className="w-5 h-5 text-white absolute right-1 top-1" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Combined legend + result + top score — single row */}
                <div className="flex items-center justify-between px-4 pb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.home_team.color || '#6366f1' }} />
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>{m.home_team.short_name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm bg-gray-500" />
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>Empate</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.away_team.color || '#ef4444' }} />
                      <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>{m.away_team.short_name}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Top score prediction */}
                    {m.top_score && (
                      <div className="flex items-center gap-1.5">
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#94a3b8' }}>Placar mais apostado:</span>
                        <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#0f172a' }}>{m.top_score}</span>
                        <span style={{ fontSize: 16, fontWeight: 700, color: '#64748b' }}>({m.top_score_pct.toFixed(0)}%)</span>
                        {m.top_score === `${m.score_home}-${m.score_away}` ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <X className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                    )}
                    {/* Result accuracy */}
                    {m.isZebra ? (
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#92400e' }}>
                          Só {m.favoritePct.toFixed(0)}% acertou
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Check className="w-5 h-5 text-green-500" />
                        <span style={{ fontSize: 18, fontWeight: 800, color: '#16a34a' }}>
                          {m.favoritePct.toFixed(0)}% acertou
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
