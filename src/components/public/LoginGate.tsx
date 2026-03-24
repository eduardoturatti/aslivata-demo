// ============================================================
// LOGIN GATE — Blurs content and shows CTA for non-logged users
// Used on interactive features like Galera (Seleção, Bolão)
// ============================================================
import React, { useState } from 'react';
import { LogIn, Lock, Vote, Target } from 'lucide-react';
import { AuthModal } from './AuthModal';
import { useAuth } from '../../lib/auth-context';

interface LoginGateProps {
  children: React.ReactNode;
  /** What to show above blur overlay */
  title?: string;
  subtitle?: string;
  icon?: React.ElementType;
  /** Auth modal config */
  authTitle?: string;
  authSubtitle?: string;
  /** Callback when user logs in successfully */
  onLogin?: () => void;
}

export function LoginGate({
  children,
  title = 'Faça login para participar',
  subtitle = 'Crie sua conta gratuita e participe',
  icon: Icon = Vote,
  authTitle,
  authSubtitle,
  onLogin,
}: LoginGateProps) {
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);

  // Demo mode: always show content without login
  return <>{children}</>;

  if (user) return <>{children}</>;

  return (
    <>
      <div className="relative">
        {/* Blurred content preview */}
        <div className="blur-[6px] select-none pointer-events-none opacity-60 max-h-[70vh] overflow-hidden">
          {children}
        </div>
      </div>

      {/* Overlay CTA — fixed in viewport, always visible */}
      <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
        <div className="bg-background/90 backdrop-blur-md border border-border rounded-2xl px-6 py-8 max-w-xs mx-auto text-center shadow-2xl pointer-events-auto">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <h3
            className="text-base font-extrabold text-foreground mb-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {title}
          </h3>
          <p className="text-xs text-muted-foreground mb-5 leading-relaxed">
            {subtitle}
          </p>
          <button
            onClick={() => setShowAuth(true)}
            className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <LogIn className="w-4 h-4" /> Criar conta / Entrar
          </button>
        </div>
      </div>

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onSuccess={(u) => {
          setShowAuth(false);
          onLogin?.();
        }}
        title={authTitle || 'Entrar'}
        subtitle={authSubtitle || 'E-mail + codigo de acesso'}
      />
    </>
  );
}

// Embargo gate: blurs results until a specific date (Monday 22:00)
interface EmbargoGateProps {
  children: React.ReactNode;
  /** Unix timestamp or Date after which content is revealed */
  revealsAt: Date | null;
  /** Label for the embargo */
  label?: string;
}

export function EmbargoGate({ children, revealsAt, label }: EmbargoGateProps) {
  if (!revealsAt || new Date() >= revealsAt) {
    return <>{children}</>;
  }

  return (
    <div className="relative">
      <div className="blur-[8px] select-none pointer-events-none opacity-50">
        {children}
      </div>
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <div className="bg-background/80 backdrop-blur-md border border-border rounded-2xl px-6 py-6 max-w-xs mx-auto text-center shadow-lg">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6 text-amber-500" />
          </div>
          <h3
            className="text-sm font-extrabold text-foreground mb-1"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Resultado embargado
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            {label || 'O resultado da Selecao sai no programa de segunda-feira. Aguarde!'}
          </p>
        </div>
      </div>
    </div>
  );
}