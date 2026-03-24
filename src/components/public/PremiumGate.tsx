import React, { useState } from 'react';
import { Trophy, Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { PremiumModal } from './PremiumModal';

const GOLD = '#D4A843';
const GOLD_BG = (opacity: number) => `rgba(212,168,67,${opacity})`;

// ═══════════════════════════════════════════════════════
// REDACTED — The core of the new strategy
// Shows real layout, replaces values with "•••"
// ═══════════════════════════════════════════════════════

/** Redact a string — keeps first char visible for names, fully redacts numbers */
export function redact(value: string | number | null | undefined, type: 'name' | 'number' | 'text' = 'text'): string {
  if (value == null) return '•••';
  const s = String(value);
  if (type === 'number') return '••';
  if (type === 'name' && s.length > 2) return s[0] + '•'.repeat(Math.min(s.length - 1, 8));
  return '•'.repeat(Math.min(s.length || 4, 8));
}

/** Check if user is premium (for use outside React components) */
export function useIsPremium(): boolean {
  const { premium } = useAuth();
  return premium;
}

// ═══════════════════════════════════════════════════════
// PremiumGate — Original wrapper (blur mode for sections)
// ═══════════════════════════════════════════════════════

interface PremiumGateProps {
  children: React.ReactNode;
  label?: string;
  inline?: boolean;
  blur?: boolean;
}

export function PremiumGate({ children, label = 'Conteúdo Premium', inline = false, blur = false }: PremiumGateProps) {
  const [showModal, setShowModal] = useState(false);
  const { premium: unlocked } = useAuth();

  if (unlocked) return <>{children}</>;

  if (blur) {
    return (
      <>
        <div
          onClick={() => setShowModal(true)}
          className="relative cursor-pointer group rounded-2xl overflow-hidden"
        >
          <div className="pointer-events-none select-none" style={{ filter: 'blur(6px)' }}>
            {children}
          </div>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-background/90 via-background/40 to-transparent flex flex-col items-center justify-center gap-2">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110"
              style={{ backgroundColor: GOLD_BG(0.15), border: `1px solid ${GOLD_BG(0.3)}` }}
            >
              <Lock className="w-4 h-4" style={{ color: GOLD }} />
            </div>
            <p className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              {label}
            </p>
            <p className="text-[10px] text-muted-foreground">Toque para desbloquear</p>
          </div>
        </div>
        <PremiumModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => {}} />
      </>
    );
  }

  if (inline) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Trophy className="w-3 h-3" style={{ color: GOLD }} />
          <span>{label}</span>
        </button>
        <PremiumModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => {}} />
      </>
    );
  }

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className="relative cursor-pointer group rounded-xl border border-border bg-card p-6 overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10" />
        <div className="relative z-20 flex flex-col items-center justify-center py-6 gap-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: GOLD_BG(0.1), border: `1px solid ${GOLD_BG(0.2)}` }}
          >
            <Trophy className="w-5 h-5" style={{ color: GOLD }} />
          </div>
          <p className="text-sm font-semibold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {label}
          </p>
          <p className="text-xs text-muted-foreground text-center">Compre o Premium para desbloquear</p>
        </div>
      </div>
      <PremiumModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => {}} />
    </>
  );
}

// ═══════════════════════════════════════════════════════
// PremiumPageGate — Now just passes through (pages show skeleton with redacted data)
// ═══════════════════════════════════════════════════════

export function PremiumPageGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

// ═══════════════════════════════════════════════════════
// UnlockBanner — A bottom CTA that appears after showing redacted content
// This replaces FreemiumList/FreemiumCutoff with a simpler pattern
// ═══════════════════════════════════════════════════════

interface UnlockBannerProps {
  /** Short hook text */
  label?: string;
  /** Optional count of hidden items */
  hiddenCount?: number;
}

export function UnlockBanner({ label = 'Desbloquear dados completos', hiddenCount }: UnlockBannerProps) {
  const [showModal, setShowModal] = useState(false);
  const { premium: unlocked } = useAuth();

  if (unlocked) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full mt-3 rounded-2xl overflow-hidden transition-all active:scale-[0.98] text-left"
        style={{
          background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
          border: `1px solid ${GOLD_BG(0.25)}`,
          boxShadow: `0 4px 20px rgba(0,0,0,0.15)`,
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{ background: GOLD_BG(0.2) }}
          >
            <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {hiddenCount ? `${label} (+${hiddenCount})` : label}
            </p>
            <p className="text-[10px] text-white/60">
              R$ 19,90 · Todo o campeonato
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shrink-0"
            style={{ background: GOLD }}
          >
            Ver
          </div>
        </div>
      </button>
      <PremiumModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => {}} />
    </>
  );
}

// ═══════════════════════════════════════════════════════
// FreemiumList — Shows first N items free, rest with redacted data
// ═══════════════════════════════════════════════════════

interface FreemiumListProps {
  children: React.ReactNode;
  hiddenChildren?: React.ReactNode;
  freeCount?: number;
  totalCount: number;
  label?: string;
  valueProp?: string;
}

export function FreemiumList({
  children,
  hiddenChildren,
  freeCount = 3,
  totalCount,
  label = 'ranking completo',
  valueProp,
}: FreemiumListProps) {
  const [showModal, setShowModal] = useState(false);
  const { premium: unlocked } = useAuth();

  if (unlocked || totalCount <= freeCount) {
    return (
      <>
        {children}
        {hiddenChildren}
      </>
    );
  }

  const remaining = totalCount - freeCount;

  return (
    <>
      {children}
      {hiddenChildren}
      <UnlockBanner label={`Revelar ${label}`} hiddenCount={remaining} />
    </>
  );
}

// ═══════════════════════════════════════════════════════
// FreemiumCutoff — Shows content, adds unlock CTA at bottom
// ═══════════════════════════════════════════════════════

interface FreemiumCutoffProps {
  children: React.ReactNode;
  premiumContent?: React.ReactNode;
  label?: string;
  compact?: boolean;
}

export function FreemiumCutoff({ children, premiumContent, label = 'Análise completa', compact = false }: FreemiumCutoffProps) {
  const { premium: unlocked } = useAuth();

  if (unlocked) {
    return (
      <>
        {children}
        {premiumContent}
      </>
    );
  }

  return (
    <>
      {children}
      {premiumContent}
      <UnlockBanner label={label} />
    </>
  );
}

// ═══════════════════════════════════════════════════════
// PremiumBanner — Homepage CTA
// ═══════════════════════════════════════════════════════

interface PremiumBannerProps {
  stats?: { label: string; value: string }[];
}

export function PremiumBanner({ stats }: PremiumBannerProps) {
  const [showModal, setShowModal] = useState(false);
  const { premium: unlocked } = useAuth();

  if (unlocked) return null;

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full rounded-2xl overflow-hidden transition-all active:scale-[0.98] text-left"
        style={{
          background: `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`,
          border: `1px solid ${GOLD_BG(0.2)}`,
          boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
        }}
      >
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: GOLD_BG(0.2) }}>
              <Sparkles className="w-4 h-4" style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-sm font-black text-white" style={{ fontFamily: 'var(--font-heading)' }}>
                POWER PREMIUM
              </p>
              <p className="text-[10px] font-medium" style={{ color: GOLD }}>
                R$ 19,90 · Todo o campeonato
              </p>
            </div>
          </div>

          {/* Updated feature list — only what Premium actually unlocks now */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {[
              'Rankings sem censura',
              'Escalações e formações',
              'Artilharia completa',
              'Raio-X de partidas',
              'Assistências completas',
              'Mano a mano detalhado',
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: GOLD }} />
                <span className="text-[10px] text-white/70 font-medium">{feature}</span>
              </div>
            ))}
          </div>

          {/* Teaser: show what they're missing with redacted preview */}
          {stats && stats.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-hidden">
              {stats.slice(0, 3).map((s, i) => (
                <div key={i} className="flex-1 rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${GOLD_BG(0.1)}` }}>
                  <p className="text-xs font-black text-white" style={{ fontFamily: 'var(--font-mono)' }}>{s.value}</p>
                  <p className="text-[8px] text-white/50 font-semibold uppercase">{s.label}</p>
                </div>
              ))}
            </div>
          )}

          <div
            className="w-full py-3 rounded-xl text-center font-bold text-sm text-white"
            style={{
              fontFamily: 'var(--font-heading)',
              background: `linear-gradient(135deg, ${GOLD} 0%, #BF9638 100%)`,
              boxShadow: `0 4px 16px ${GOLD_BG(0.3)}`,
            }}
          >
            Desbloquear agora
          </div>
        </div>
      </button>
      <PremiumModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={() => {}} />
    </>
  );
}