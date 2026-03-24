import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getArenaSelection, FORMATION } from '../lib/galera-api';
import { COMPETITION_ID } from '../lib/supabase';
import type { SQLPlayer, SQLTeam } from '../lib/supabase';
import { photoUrl } from '../lib/image-utils';

interface Props {
  competitionId?: string;
  roundIndex: number;
  sqlPlayers: SQLPlayer[];
  sqlTeams: SQLTeam[];
}

// Horizontal coords for broadcast 1920×1080 landscape field
// Spread more vertically to avoid overlap with smaller player nodes
const BROADCAST_COORDS: Record<string, { top: string; left: string }> = {
  'goleiro:0': { top: '50%', left: '7%' },
  'lateral:0': { top: '15%', left: '28%' },
  'lateral:1': { top: '85%', left: '28%' },
  'zagueiro:0': { top: '35%', left: '21%' },
  'zagueiro:1': { top: '65%', left: '21%' },
  'meia:0': { top: '15%', left: '52%' },
  'meia:1': { top: '50%', left: '55%' },
  'meia:2': { top: '85%', left: '52%' },
  'atacante:0': { top: '18%', left: '78%' },
  'atacante:1': { top: '50%', left: '82%' },
  'atacante:2': { top: '82%', left: '78%' },
  'treinador:0': { top: '92%', left: '7%' },
};

function getBroadcastCoord(position: string, idx: number) {
  return BROADCAST_COORDS[`${position}:${idx}`] || { top: '50%', left: '50%' };
}

export function StudioArenaSelection({ competitionId = COMPETITION_ID, roundIndex, sqlPlayers, sqlTeams }: Props) {
  const [selections, setSelections] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  const round = roundIndex + 1;
  const prevSelectionsRef = useRef<string>('');

  // Poll every 3s for real-time updates when admin changes selection
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getArenaSelection(competitionId, round);
        if (!active) return;
        const newJson = JSON.stringify(data?.selections || {});
        // Only update state if data actually changed (avoid re-render flicker)
        if (newJson !== prevSelectionsRef.current) {
          prevSelectionsRef.current = newJson;
          setSelections(data.selections || {});
          console.log(`[StudioArenaSelection] Updated: ${Object.keys(data?.selections || {}).length} selections`);
        }
        if (!loaded) setLoaded(true);
      } catch (e) {
        console.error('StudioArenaSelection: Error loading:', e);
        if (active && !loaded) setLoaded(true);
      }
    }
    load();
    const interval = setInterval(load, 3000);
    return () => { active = false; clearInterval(interval); };
  }, [competitionId, round]);

  const getPlayerInfo = (sel: any) => {
    if (!sel) return null;
    if (sel.coach_name) {
      const team = sqlTeams.find(t => t.id === sel.team_id);
      return { name: sel.coach_name, team, isCoach: true, photo: undefined };
    }
    const player = sqlPlayers.find(p => p.id === sel.player_id);
    const team = sqlTeams.find(t => t.id === sel.team_id);
    return player ? { name: player.name, number: player.number, position: player.position, photo: player.photo_url, team, isCoach: false } : null;
  };

  const allSlots = FORMATION.flatMap((slot, si) =>
    Array.from({ length: slot.slots }).map((_, idx) => ({
      key: `${slot.position}:${idx}`,
      position: slot.position,
      label: slot.label,
      coord: getBroadcastCoord(slot.position, idx),
      slotIndex: si,
      info: getPlayerInfo(selections[`${slot.position}:${idx}`]),
    }))
  );

  return (
    <div className="h-full w-full overflow-hidden relative" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Full-bleed horizontal football field */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0"
      >
        {/* Premium grass stripes — horizontal bands */}
        <div className="absolute inset-0" style={{
          background: 'repeating-linear-gradient(90deg, #1b5e2e 0%, #1b5e2e 7.7%, #237a3b 7.7%, #237a3b 15.4%)'
        }} />
        {/* Ambient glow */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 30% 80% at 0% 50%, rgba(34,197,94,0.15) 0%, transparent 70%)'
        }} />
        {/* Vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.35) 100%)'
        }} />
        {/* Field lines — landscape premium */}
        <div className="absolute inset-0">
          <div className="absolute inset-[3%] border-2 border-white/20 rounded-sm" />
          <div className="absolute left-[50%] top-[3%] bottom-[3%] w-[2px] bg-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18%] aspect-square rounded-full border-2 border-white/20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white/30" />
          <div className="absolute left-[3%] top-1/2 -translate-y-1/2 w-[14%] h-[52%] border-r-2 border-t-2 border-b-2 border-white/15" />
          <div className="absolute left-[3%] top-1/2 -translate-y-1/2 w-[6%] h-[24%] border-r-2 border-t-2 border-b-2 border-white/15" />
          <div className="absolute left-[14.5%] top-1/2 -translate-y-1/2 w-[6%] h-[18%] rounded-r-full border-r-2 border-white/10" />
          <div className="absolute right-[3%] top-1/2 -translate-y-1/2 w-[14%] h-[52%] border-l-2 border-t-2 border-b-2 border-white/15" />
          <div className="absolute right-[3%] top-1/2 -translate-y-1/2 w-[6%] h-[24%] border-l-2 border-t-2 border-b-2 border-white/15" />
          <div className="absolute right-[14.5%] top-1/2 -translate-y-1/2 w-[6%] h-[18%] rounded-l-full border-l-2 border-white/10" />
          <div className="absolute top-[3%] left-[3%] w-4 h-4 border-b-2 border-r-2 border-white/15 rounded-br-full" />
          <div className="absolute top-[3%] right-[3%] w-4 h-4 border-b-2 border-l-2 border-white/15 rounded-bl-full" />
          <div className="absolute bottom-[3%] left-[3%] w-4 h-4 border-t-2 border-r-2 border-white/15 rounded-tr-full" />
          <div className="absolute bottom-[3%] right-[3%] w-4 h-4 border-t-2 border-l-2 border-white/15 rounded-tl-full" />
        </div>

        {/* Title overlay — top left, below header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-3 left-8 z-20"
        >
          <div className="flex items-center gap-3 px-5 py-2 rounded-xl" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(12px)' }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#a78bfa', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Rodada {round}
            </span>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }}>|</span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '0.02em' }}>
              Seleção do Arena
            </span>
          </div>
        </motion.div>

        {/* Players on field */}
        <AnimatePresence>
          {allSlots.filter(s => !s.info?.isCoach).map((slot, i) => (
            <motion.div
              key={slot.key}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.3 + i * 0.07 }}
              className="absolute flex flex-col items-center z-10"
              style={{
                top: slot.coord.top,
                left: slot.coord.left,
                x: '-50%',
                y: '-50%',
              }}
            >
              {slot.info ? (
                <>
                  <div className="relative">
                    {/* Team Logo Badge */}
                    {slot.info.team?.logo_url && (
                      <motion.div
                        initial={{ scale: 0, x: -6, y: -6 }}
                        animate={{ scale: 1, x: 0, y: 0 }}
                        transition={{ delay: 0.8, type: 'spring', stiffness: 200 }}
                        className="absolute -top-2 -left-2 flex items-center justify-center rounded-full z-20"
                        style={{
                          width: 48,
                          height: 48,
                          background: '#fff',
                          border: `3px solid ${slot.info.team?.color || '#ccc'}`,
                          padding: 4,
                          boxShadow: `0 4px 12px rgba(0,0,0,0.4), 0 0 10px ${(slot.info.team?.color || '#000')}60`,
                        }}
                      >
                        <img src={slot.info.team.logo_url} alt="" className="w-full h-full object-contain" />
                      </motion.div>
                    )}

                    {/* Player Photo Circle */}
                    <div
                      className="flex items-center justify-center rounded-full shadow-lg relative z-10"
                      style={{
                        width: 120,
                        height: 120,
                        background: `linear-gradient(135deg, ${slot.info.team?.color || '#333'} 0%, ${slot.info.team?.color || '#111'}dd 100%)`,
                        border: `4px solid ${slot.info.team?.color || '#fff'}`,
                        boxShadow: `0 0 24px ${slot.info.team?.color || '#000'}aa, inset 0 0 12px rgba(0,0,0,0.4)`,
                        overflow: 'hidden',
                      }}
                    >
                      {slot.info.photo ? (
                        <img src={photoUrl(slot.info.photo, 120)} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span style={{ fontSize: 48, fontWeight: 900, color: slot.info.team?.text_color || '#fff' }}>
                          {slot.info.number || '?'}
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    className="mt-1.5 px-3 py-1 rounded-md text-center"
                    style={{
                      maxWidth: 180,
                    }}
                  >
                    <div style={{
                      fontSize: 24, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap',
                      textShadow: '0 2px 8px rgba(0,0,0,0.9)',
                      lineHeight: 1.1,
                    }}>
                      {slot.info.name.split(' ').slice(-2).join(' ').toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: 16, color: slot.info.team?.color || '#a78bfa', fontWeight: 900,
                      textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                      marginTop: 1,
                      letterSpacing: '0.05em'
                    }}>
                      {slot.info.team?.short_name}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 100,
                    height: 100,
                    background: 'rgba(255,255,255,0.1)',
                    border: '3px dashed rgba(255,255,255,0.25)',
                  }}
                >
                  <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>
                    {slot.label}
                  </span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Coach area — bottom left */}
        {allSlots.filter(s => s.info?.isCoach).map((slot) => (
          <motion.div
            key={slot.key}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            className="absolute z-10"
            style={{ bottom: 40, left: 40 }}
          >
            <div
              className="px-6 py-4 rounded-xl flex items-center gap-5"
              style={{
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.5)',
              }}
            >
              <div
                className="flex items-center justify-center w-14 h-14 rounded-full"
                style={{
                  background: slot.info?.team?.color || '#a78bfa',
                  boxShadow: `0 0 15px ${(slot.info?.team?.color || '#a78bfa')}80`
                }}
              >
                <span style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>T</span>
              </div>
              <div className="flex flex-col">
                <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', textTransform: 'uppercase' }}>
                  {slot.info?.name || 'Treinador'}
                </div>
                <div style={{ fontSize: 16, color: slot.info?.team?.color || '#a78bfa', fontWeight: 800 }}>
                  {slot.info?.team?.short_name} — Treinador
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}