import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getTrendingPlayers } from '../lib/galera-api';
import { COMPETITION_ID } from '../lib/supabase';
import type { SQLPlayer, SQLTeam } from '../lib/supabase';
import { photoUrl, logoUrl } from '../lib/image-utils';

interface Props {
  competitionId?: string;
  roundIndex: number;
  sqlPlayers: SQLPlayer[];
  sqlTeams: SQLTeam[];
}

export function StudioVotingLive({ competitionId = COMPETITION_ID, roundIndex, sqlPlayers, sqlTeams }: Props) {
  const [trending, setTrending] = useState<{ rank: number; player_id: string; team_id: string; pct: number }[]>([]);
  const [totalVoters, setTotalVoters] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const round = roundIndex + 1;

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getTrendingPlayers(competitionId, round);
        if (!active) return;
        setTrending(data.trending || []);
        setTotalVoters(data.total_voters || 0);
        setLoaded(true);
      } catch (e) {
        console.error('StudioVotingLive error:', e);
        setLoaded(true);
      }
    }
    load();
    const interval = setInterval(load, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [competitionId, round]);

  const getPlayerInfo = (playerId: string) => {
    const player = sqlPlayers.find(p => p.id === playerId);
    const team = player ? sqlTeams.find(t => t.id === player.team_id) : null;
    return { player, team };
  };

  return (
    <div className="h-full w-full overflow-hidden relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Premium grass background */}
      <div className="absolute inset-0" style={{
        background: 'repeating-linear-gradient(90deg, #1b5e2e 0%, #1b5e2e 7.7%, #237a3b 7.7%, #237a3b 15.4%)'
      }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 30% 80% at 0% 50%, rgba(34,197,94,0.15) 0%, transparent 70%)'
      }} />
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse 80% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%)'
      }} />

      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4"
      >
        <div className="w-20 h-0.5 rounded-full bg-white/30" />
        <div className="flex items-center gap-3 px-8 py-3 rounded-2xl" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span style={{ fontSize: 22, fontWeight: 900, color: '#4ade80', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Votação ao Vivo
            </span>
          </div>
          <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }}>|</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
            Rodada {round}
          </span>
        </div>
        <div className="w-20 h-0.5 rounded-full bg-white/30" />
      </motion.div>

      {/* Voting bars */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[85%] max-w-[1400px] space-y-6 pt-16">
          <AnimatePresence mode="popLayout">
            {trending.map((item, i) => {
              const { player, team } = getPlayerInfo(item.player_id);
              if (!player) return null;
              const displayName = player.name.split(' ').slice(-2).join(' ');

              return (
                <motion.div
                  key={item.player_id}
                  layout
                  initial={{ opacity: 0, x: -100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 100 }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="relative"
                >
                  <div className="flex items-center gap-6">
                    {/* Rank number */}
                    <div className="flex items-center justify-center shrink-0" style={{ width: 80 }}>
                      <span style={{
                        fontSize: 64, fontWeight: 900, lineHeight: 1,
                        color: i === 0 ? '#fbbf24' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : 'rgba(255,255,255,0.25)',
                        textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                        fontFamily: "'Plus Jakarta Sans', sans-serif",
                      }}>
                        {item.rank}
                      </span>
                    </div>

                    {/* Player photo */}
                    <div className="relative shrink-0">
                      <div className="flex items-center justify-center rounded-full overflow-hidden shadow-xl"
                        style={{
                          width: 100, height: 100,
                          background: `linear-gradient(135deg, ${team?.color || '#333'} 0%, ${team?.color || '#111'}dd 100%)`,
                          border: `5px solid ${team?.color || '#fff'}`,
                          boxShadow: `0 0 30px ${team?.color || '#000'}80`,
                        }}>
                        {player.photo_url ? (
                          <img src={photoUrl(player.photo_url, 100)} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span style={{ fontSize: 40, fontWeight: 900, color: '#fff' }}>
                            {player.number || '?'}
                          </span>
                        )}
                      </div>
                      {/* Team badge */}
                      {team?.logo_url && (
                        <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-white border-3 overflow-hidden shadow-lg flex items-center justify-center"
                          style={{ borderColor: team.color || '#ccc', padding: 3 }}>
                          <img src={logoUrl(team.logo_url, 40)} alt="" className="w-full h-full object-contain" />
                        </div>
                      )}
                    </div>

                    {/* Name + bar */}
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span style={{
                          fontSize: 36, fontWeight: 900, color: '#fff', lineHeight: 1,
                          textShadow: '0 2px 10px rgba(0,0,0,0.8)',
                        }}>
                          {displayName.toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: 22, fontWeight: 800, color: team?.color || '#4ade80',
                          textShadow: '0 1px 6px rgba(0,0,0,0.6)',
                        }}>
                          {team?.short_name}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="relative h-10 rounded-xl overflow-hidden" style={{
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}>
                        <motion.div
                          className="absolute inset-y-0 left-0 rounded-xl"
                          initial={{ width: '0%' }}
                          animate={{ width: `${Math.min(item.pct, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                          style={{
                            background: `linear-gradient(90deg, ${team?.color || '#22c55e'}cc, ${team?.color || '#22c55e'})`,
                            boxShadow: `0 0 20px ${team?.color || '#22c55e'}60`,
                          }}
                        />
                        <div className="absolute inset-0 flex items-center justify-end pr-5">
                          <span style={{
                            fontSize: 28, fontWeight: 900, color: '#fff',
                            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
                          }}>
                            {item.pct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {trending.length === 0 && loaded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <span style={{ fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>
                Aguardando votos...
              </span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Subtitle */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
      >
        <div className="px-8 py-3 rounded-xl" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Seleção da Galera — Top 5 mais votados
          </span>
        </div>
      </motion.div>
    </div>
  );
}