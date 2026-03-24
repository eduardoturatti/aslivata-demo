import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { getRankingDetails } from '../lib/galera-api';
import { COMPETITION_ID } from '../lib/supabase';
import { Trophy, Medal, Star, Crosshair, Target } from 'lucide-react';

interface Props {
  competitionId?: string;
}

export function StudioBolaoRanking({ competitionId = COMPETITION_ID }: Props) {
  const [ranking, setRanking] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await getRankingDetails(competitionId, true);
        setRanking(data.ranking || []);
        setLoaded(true);
      } catch (e) {
        console.error('StudioBolaoRanking: Error loading:', e);
        setLoaded(true);
      }
    }
    load();
  }, [competitionId]);

  const topTen = ranking.slice(0, 10);
  const podiumColors = ['#eab308', '#94a3b8', '#cd7f32'];
  const podiumBg = [
    'linear-gradient(135deg, #fef9c3 0%, #fde68a 100%)',
    'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
  ];

  return (
    <div className="h-full w-full flex flex-col p-8" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-5"
      >
        <div className="flex items-center justify-center gap-3 mb-1">
          <div className="w-12 h-1 rounded-full bg-amber-500" />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#eab308', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Power Sports
          </span>
          <div className="w-12 h-1 rounded-full bg-amber-500" />
        </div>
        <h1 style={{ fontSize: 44, fontWeight: 900, color: '#0f172a', lineHeight: 1.1 }}>
          Bolão da Galera
        </h1>
        <p style={{ fontSize: 16, color: '#64748b', marginTop: 2 }}>
          Top 10 — Ranking geral dos palpiteiros
        </p>
      </motion.div>

      {topTen.length === 0 && loaded ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
          <Trophy className="w-20 h-20 mx-auto mb-4 text-slate-300" />
          <span style={{ fontSize: 24, fontWeight: 700, color: '#94a3b8' }}>Nenhum palpite registrado ainda</span>
        </motion.div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top 3 podium */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex gap-4 mb-4 flex-shrink-0"
          >
            {topTen.slice(0, 3).map((entry, i) => (
              <motion.div
                key={entry.user_id || i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="flex-1 rounded-2xl overflow-hidden"
                style={{
                  background: podiumBg[i],
                  border: `2px solid ${podiumColors[i]}40`,
                  boxShadow: i === 0 ? '0 8px 30px rgba(234,179,8,0.2)' : '0 4px 15px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div
                    className="flex items-center justify-center rounded-full flex-shrink-0"
                    style={{
                      width: 56, height: 56,
                      background: podiumColors[i],
                      boxShadow: `0 4px 15px ${podiumColors[i]}50`,
                    }}
                  >
                    {i === 0 ? <Trophy className="w-7 h-7 text-white" /> :
                     i === 1 ? <Medal className="w-7 h-7 text-white" /> :
                     <Star className="w-7 h-7 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontSize: 14, fontWeight: 800, color: podiumColors[i], letterSpacing: '0.05em' }}>
                      {i + 1}º lugar
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {entry.display_name || 'Anônimo'}
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      {(entry.exact > 0) && (
                        <div className="flex items-center gap-1">
                          <Crosshair className="w-4 h-4 text-green-500" />
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#22c55e' }}>{entry.exact} cravadas</span>
                        </div>
                      )}
                      {(entry.result > 0) && (
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span style={{ fontSize: 15, fontWeight: 800, color: '#3b82f6' }}>{entry.result} acertos</span>
                        </div>
                      )}
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
                        {entry.total_predictions || entry.exact + entry.result + (entry.miss || 0)} apostas
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div style={{ fontSize: 42, fontWeight: 900, color: '#0f172a', fontFamily: 'JetBrains Mono', lineHeight: 1 }}>
                      {entry.total_points || entry.points || 0}
                    </div>
                    <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>pontos</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* 4th-10th table */}
          {topTen.length > 3 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="flex-1 rounded-2xl overflow-hidden flex flex-col"
              style={{ background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 15px rgba(0,0,0,0.04)' }}
            >
              {/* Header */}
              <div className="flex items-center px-6 py-3" style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: '#475569', letterSpacing: '0.08em', flex: 1 }}>CLASSIFICAÇÃO</span>
                <div className="flex items-center gap-6">
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#94a3b8', width: 70, textAlign: 'center' }}>PTS</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#22c55e', width: 60, textAlign: 'center' }}>CRAV</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#3b82f6', width: 60, textAlign: 'center' }}>ACERT</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#94a3b8', width: 80, textAlign: 'center' }}>APOSTAS</span>
                </div>
              </div>
              <div className="divide-y divide-slate-100 flex-1 flex flex-col justify-start overflow-y-auto">
                {topTen.slice(3).map((entry, i) => (
                  <motion.div
                    key={entry.user_id || (i + 3)}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.7 + i * 0.05 }}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <div
                      className="flex items-center justify-center rounded-full flex-shrink-0"
                      style={{ width: 44, height: 44, background: '#f1f5f9', border: '2px solid #e2e8f0' }}
                    >
                      <span style={{ fontSize: 20, fontWeight: 900, color: '#475569', fontFamily: 'JetBrains Mono' }}>
                        {i + 4}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {entry.display_name || 'Anônimo'}
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div style={{ width: 70, textAlign: 'center' }}>
                        <span style={{ fontSize: 30, fontWeight: 900, color: '#0f172a', fontFamily: 'JetBrains Mono' }}>
                          {entry.total_points || entry.points || 0}
                        </span>
                      </div>
                      <div style={{ width: 60, textAlign: 'center' }}>
                        <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono', color: (entry.exact || 0) > 0 ? '#22c55e' : '#e2e8f0' }}>
                          {entry.exact || 0}
                        </span>
                      </div>
                      <div style={{ width: 60, textAlign: 'center' }}>
                        <span style={{ fontSize: 26, fontWeight: 800, fontFamily: 'JetBrains Mono', color: (entry.result || 0) > 0 ? '#3b82f6' : '#e2e8f0' }}>
                          {entry.result || 0}
                        </span>
                      </div>
                      <div style={{ width: 80, textAlign: 'center' }}>
                        <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono', color: '#94a3b8' }}>
                          {entry.total_predictions || entry.exact + entry.result + (entry.miss || 0)}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
