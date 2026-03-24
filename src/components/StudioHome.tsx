import { motion } from 'motion/react';
import { TournamentData, SQLCompetition } from '../lib/supabase';

interface Props {
  data: TournamentData;
  competition?: SQLCompetition | null;
}

export function StudioHome({ data, competition }: Props) {
  return (
    <div className="h-full w-full overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #2eaa55 0%, #1a8a3e 40%, #15753a 100%)' }}>

      {/* Subtle grass texture */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'repeating-linear-gradient(90deg, transparent, transparent 119px, rgba(255,255,255,0.02) 119px, rgba(255,255,255,0.02) 120px)',
      }} />

      {/* Nome do Campeonato centralizado */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ zIndex: 10 }}
      >
        <h1 className="text-white font-black text-8xl tracking-tight text-center"
          style={{
            textShadow: '0 4px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.5)',
            letterSpacing: '-0.02em',
          }}
        >
          {competition?.name || 'Campeonato'}
        </h1>
      </motion.div>
    </div>
  );
}