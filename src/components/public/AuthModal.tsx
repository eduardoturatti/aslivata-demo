import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mail, ArrowRight, KeyRound, Timer, CheckCircle, Loader2, X, User, Vote,
} from 'lucide-react';
import { sendMagicLink, verifyOtpCode, getCurrentUser, onAuthChange, type UserProfile } from '../../lib/auth';
import { DisplayNameModal } from './DisplayNameModal';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const COOLDOWN_SECS = 60;
const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a98fb753`;
const DEV_EMAIL = 'dev@powersports.local';
const TAP_THRESHOLD = 5;
const TAP_WINDOW_MS = 2000;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  /** Custom title for context */
  title?: string;
  /** Custom subtitle */
  subtitle?: string;
}

type Step = 'email' | 'otp' | 'success' | 'display_name';

export function AuthModal({ isOpen, onClose, onSuccess, title, subtitle }: AuthModalProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);
  const [devMode, setDevMode] = useState(false);
  const [devCode, setDevCode] = useState('');
  const tapTimesRef = useRef<number[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback((secs: number) => {
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    setCooldown(secs);
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (cooldownRef.current) clearInterval(cooldownRef.current);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, []);

  const handleAuthError = useCallback((errorStr: string) => {
    if (errorStr.startsWith('COOLDOWN:')) {
      const secs = parseInt(errorStr.split(':')[1], 10) || COOLDOWN_SECS;
      startCooldown(secs);
      setError(`Aguarde ${secs}s antes de reenviar`);
    } else {
      setError(errorStr);
    }
  }, [startCooldown]);

  // Proceed to display name step after auth success
  const proceedAfterAuth = useCallback((user: UserProfile) => {
    setPendingUser(user);
    setStep('success');
    setTimeout(() => {
      setStep('display_name');
    }, 800);
  }, []);

  // Listen for auth state changes (e.g. magic link from another tab)
  useEffect(() => {
    if (!isOpen) return;
    const unsub = onAuthChange(async (user) => {
      if (user && (step === 'otp' || step === 'email')) {
        proceedAfterAuth(user);
      }
    });
    return unsub;
  }, [isOpen, step, proceedAfterAuth]);

  if (!isOpen) return null;

  const reset = () => {
    setStep('email');
    setEmail('');
    setOtpCode('');
    setError('');
    setLoading(false);
    setCooldown(0);
    setPendingUser(null);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
  };

  const handleClose = () => {
    reset();
    setDevMode(false);
    setDevCode('');
    tapTimesRef.current = [];
    onClose();
  };

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // Easter egg: tap mail icon 5x in 2s → dev mode
  const handleIconTap = () => {
    const now = Date.now();
    tapTimesRef.current.push(now);
    // Keep only taps within the window
    tapTimesRef.current = tapTimesRef.current.filter(t => now - t < TAP_WINDOW_MS);
    if (tapTimesRef.current.length >= TAP_THRESHOLD) {
      setDevMode(true);
      tapTimesRef.current = [];
    }
  };

  // Dev login: bypass OTP entirely via server-side code generation
  const handleDevLogin = async () => {
    if (!devCode.trim()) return;
    setLoading(true);
    setError('');

    const loginEmail = localStorage.getItem('ps_user_email') || DEV_EMAIL;

    try {
      const res = await fetch(`${SERVER_BASE}/master-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ email: loginEmail, master_code: devCode }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setError(data.error || 'Código inválido');
        setLoading(false);
        return;
      }

      const result = await verifyOtpCode(data.email, data.otp);
      setLoading(false);

      if (result.error) {
        setError(result.error);
        return;
      }

      localStorage.setItem('ps_user_email', data.email);
      const user = await getCurrentUser();
      if (user) {
        proceedAfterAuth(user);
      }
    } catch (err: any) {
      console.error('[AuthModal] Dev login error:', err);
      setError('Erro de conexão');
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!isValidEmail(email)) {
      setError('Digite um e-mail válido');
      return;
    }
    if (cooldown > 0) return;

    setLoading(true);
    setError('');

    const result = await sendMagicLink(email);
    setLoading(false);

    if (result.error) {
      handleAuthError(result.error);
    } else {
      startCooldown(COOLDOWN_SECS);
      setStep('otp');
      setOtpCode('');
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || loading) return;
    setLoading(true);
    setError('');

    const result = await sendMagicLink(email);
    setLoading(false);

    if (result.error) {
      handleAuthError(result.error);
    } else {
      startCooldown(COOLDOWN_SECS);
      setOtpCode('');
    }
  };

  const handleVerifyCode = async () => {
    if (otpCode.trim().length < 6) {
      setError('Digite o código de 6 dígitos');
      return;
    }
    setLoading(true);
    setError('');

    const result = await verifyOtpCode(email, otpCode);
    setLoading(false);

    if (result.error) {
      handleAuthError(result.error);
    } else {
      // Save email for later use
      localStorage.setItem('ps_user_email', email.trim().toLowerCase());

      const user = await getCurrentUser();
      if (user) {
        proceedAfterAuth(user);
      }
    }
  };

  // Display name step — renders as its own full-screen modal
  if (step === 'display_name') {
    return (
      <DisplayNameModal
        isOpen={true}
        email={email || pendingUser?.email}
        onClose={(name) => {
          if (pendingUser) {
            onSuccess({ ...pendingUser, name });
          }
          handleClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative w-full max-w-md mx-4 bg-popover border border-border rounded-2xl p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {step === 'success' && (
          <div className="flex flex-col items-center py-8 gap-4">
            <CheckCircle className="w-16 h-16 text-primary" />
            <p className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              Conta conectada!
            </p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
              Só mais um passo...
            </p>
          </div>
        )}

        {step === 'email' && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div
                className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center cursor-default select-none"
                onClick={handleIconTap}
              >
                <Mail className="w-5 h-5 text-primary pointer-events-none" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  {title || 'Criar conta / Entrar'}
                </h3>
                <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  {subtitle || 'Digite seu e-mail para receber um código de acesso'}
                </p>
              </div>
            </div>

            <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2.5 mb-4">
              <p className="text-[11px] text-muted-foreground leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                <strong className="text-foreground">Gratuito</strong> — Com sua conta você pode votar na <strong className="text-foreground">Seleção da Galera</strong> e participar do <strong className="text-foreground">Bolão</strong>.
                Estatísticas completas requerem Premium.
              </p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-muted-foreground mb-1.5 block" style={{ fontFamily: 'var(--font-heading)' }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSendCode(); }}
                placeholder="seu@email.com"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground text-sm"
                style={{ fontFamily: 'var(--font-body)' }}
                autoFocus
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-3 text-destructive text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSendCode}
              disabled={loading || !email.trim() || cooldown > 0}
              className="w-full disabled:opacity-40 bg-primary text-primary-foreground font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : cooldown > 0 ? (
                <>
                  <Timer className="w-4 h-4" />
                  Aguarde {cooldown}s
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  Enviar código
                </>
              )}
            </button>

            {/* Dev mode — only visible after 5-tap easter egg */}
            {devMode && (
              <div className="mt-1 space-y-2">
                <input
                  type="password"
                  value={devCode}
                  onChange={(e) => { setDevCode(e.target.value); setError(''); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleDevLogin(); }}
                  placeholder="••••••"
                  autoFocus
                  className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground text-sm text-center tracking-widest"
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <button
                  onClick={handleDevLogin}
                  disabled={loading || !devCode.trim()}
                  className="w-full disabled:opacity-40 bg-foreground/10 text-foreground font-bold rounded-xl py-2.5 text-xs transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {loading ? 'Entrando...' : 'OK'}
                </button>
              </div>
            )}

            <button
              onClick={handleClose}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Cancelar
            </button>
          </>
        )}

        {step === 'otp' && (
          <>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Digite o código
                </h3>
                <p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                  Enviado para <strong className="text-foreground">{email}</strong>
                </p>
              </div>
            </div>

            <div className="mb-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                  setOtpCode(val);
                  setError('');
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' && otpCode.length >= 6) handleVerifyCode(); }}
                placeholder="000000"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-4 text-foreground text-center text-2xl tracking-[0.5em] placeholder-muted-foreground"
                style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                autoFocus
              />
              <p className="text-[10px] text-muted-foreground mt-2 text-center leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
                Abra o e-mail e digite o código de 6 dígitos
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 mb-3 text-destructive text-xs" style={{ fontFamily: 'var(--font-body)' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleVerifyCode}
              disabled={loading || otpCode.length < 6}
              className="w-full disabled:opacity-40 bg-primary text-primary-foreground font-bold rounded-xl py-3 transition-colors flex items-center justify-center gap-2 mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Verificar código
                </>
              )}
            </button>

            <button
              onClick={handleResend}
              disabled={loading || cooldown > 0}
              className="w-full bg-card border border-border text-foreground font-semibold rounded-xl py-3 transition-colors active:scale-[0.98] flex items-center justify-center gap-2 mb-3 disabled:opacity-40"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : cooldown > 0 ? (
                <>
                  <Timer className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Reenviar em {cooldown}s</span>
                </>
              ) : (
                'Reenviar código'
              )}
            </button>

            <button
              onClick={() => { setStep('email'); setError(''); setOtpCode(''); }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              Alterar e-mail
            </button>
          </>
        )}
      </div>
    </div>
  );
}