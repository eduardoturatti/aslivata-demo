import { motion } from 'motion/react';
import type { SuspensionEntry } from '../lib/supabase';
import { photoUrl } from '../lib/image-utils';

interface Props { suspensions: SuspensionEntry[]; }

export function StudioSuspensions({ suspensions }: Props) {
  // Suspended: anyone with isSuspended flag OR direct red card
  const suspended = suspensions.filter(s => s.isSuspended || (s as any).redCards > 0);
  // Pendurados: only yellow accumulation (2+ cards) who are NOT suspended
  const pendurados = suspensions.filter(s => s.isPendurado && !s.isSuspended && !((s as any).redCards > 0));

  if (suspended.length === 0 && pendurados.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <span style={{ fontSize: 40, fontWeight: 800, color: '#94a3b8', fontFamily: 'Plus Jakarta Sans' }}>Sem pendurados ou suspensos</span>
      </div>
    );
  }

  const renderCard = (s: SuspensionEntry, idx: number, type: 'suspended' | 'pendurado') => {
    const isSusp = type === 'suspended';
    const borderColor = isSusp ? '#ef4444' : '#f59e0b';
    const bgColor = isSusp ? 'rgba(239,68,68,0.06)' : 'rgba(245,158,11,0.05)';
    const hasRed = (s as any).redCards > 0;

    return (
      <motion.div
        key={s.playerId}
        initial={{ opacity: 0, x: isSusp ? -30 : 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.15 + idx * 0.05 }}
        className="flex items-center"
        style={{
          height: 82, background: bgColor,
          borderLeft: `6px solid ${borderColor}`, borderRadius: 12,
          paddingLeft: 16, paddingRight: 18,
        }}
      >
        <div className="flex items-center justify-center flex-shrink-0 mx-2" style={{ width: 56 }}>
          {s.photo ? (
            <img src={photoUrl(s.photo)} alt="" style={{ width: 50, height: 50, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${borderColor}` }} />
          ) : (
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: `${borderColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 800, color: borderColor }}>{s.playerName.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 px-3">
          <div style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', lineHeight: 1.1, fontFamily: 'Plus Jakarta Sans' }}>{s.playerName}</div>
          <div className="flex items-center gap-2 mt-1">
            {s.teamLogo && <img src={s.teamLogo} alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} />}
            <span style={{ fontSize: 22, fontWeight: 600, color: '#64748b' }}>{s.teamName}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <div style={{ width: 20, height: 28, background: '#eab308', borderRadius: 3 }} />
            <span style={{ fontSize: 30, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#eab308' }}>{s.yellowCards}</span>
          </div>
          {hasRed && (
            <div className="flex items-center gap-1.5">
              <div style={{ width: 20, height: 28, background: '#ef4444', borderRadius: 3 }} />
              <span style={{ fontSize: 30, fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#ef4444' }}>{(s as any).redCards}</span>
            </div>
          )}
          <div className="px-4 py-2" style={{ background: isSusp ? '#ef4444' : 'rgba(245,158,11,0.15)', borderRadius: 8, border: isSusp ? undefined : '1px solid rgba(245,158,11,0.3)' }}>
            <span style={{ fontSize: 22, fontWeight: 800, color: isSusp ? '#fff' : '#f59e0b' }}>
              {isSusp ? (hasRed ? 'VERMELHO' : 'SUSPENSO') : 'PENDURADO'}
            </span>
          </div>
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
          className="flex items-center justify-between mb-5 flex-shrink-0"
        >
          <div className="flex items-center gap-5">
            <div style={{ width: 7, height: 48, background: '#f59e0b', borderRadius: 3 }} />
            <span style={{ fontSize: 48, fontWeight: 900, color: '#0f172a', lineHeight: 1, fontFamily: 'Plus Jakarta Sans' }}>Pendurados e Suspensos</span>
          </div>
          <span style={{ fontSize: 24, fontWeight: 600, color: '#94a3b8', letterSpacing: '0.06em' }}>Art.73 — 3 CA = 1 jogo suspensão</span>
        </motion.div>

        <div className="flex-1 flex gap-6">
          {/* Suspended column */}
          {suspended.length > 0 && (
            <div className={pendurados.length > 0 ? 'flex-1' : 'w-full'}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.1 }}
                className="flex items-center gap-3 mb-4"
              >
                <div style={{ width: 22, height: 30, background: '#ef4444', borderRadius: 4 }} />
                <span style={{ fontSize: 34, fontWeight: 800, color: '#ef4444', letterSpacing: '0.06em' }}>SUSPENSOS / VERMELHOS</span>
                <span style={{ fontSize: 26, fontWeight: 600, color: '#94a3b8' }}>({suspended.length})</span>
              </motion.div>
              <div className="flex flex-col gap-3">
                {suspended.map((s, idx) => renderCard(s, idx, 'suspended'))}
              </div>
            </div>
          )}

          {/* Divider */}
          {suspended.length > 0 && pendurados.length > 0 && (
            <div style={{ width: 2, background: '#e2e8f0', borderRadius: 2, margin: '40px 0' }} />
          )}

          {/* Pendurados column */}
          {pendurados.length > 0 && (
            <div className={suspended.length > 0 ? 'flex-1' : 'w-full'}>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25, delay: 0.2 }}
                className="flex items-center gap-3 mb-4"
              >
                <div style={{ width: 22, height: 30, background: '#f59e0b', borderRadius: 4 }} />
                <span style={{ fontSize: 34, fontWeight: 800, color: '#f59e0b', letterSpacing: '0.06em' }}>PENDURADOS</span>
                <span style={{ fontSize: 26, fontWeight: 600, color: '#94a3b8' }}>({pendurados.length})</span>
              </motion.div>
              <div className="flex flex-col gap-3">
                {pendurados.map((s, idx) => renderCard(s, idx, 'pendurado'))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}