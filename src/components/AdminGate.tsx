import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import { Lock, Eye, EyeOff, Shield, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { setAdminToken, clearAdminToken, getAdminToken } from '../lib/admin-token';

// Auth persisted in localStorage (cross-tab) with configurable expiry
const AUTH_KEY = 'power_admin_auth';
const AUTH_TS_KEY = 'power_admin_auth_ts';
const AUTH_REMEMBER_KEY = 'power_admin_remember';
const AUTH_EXPIRY_SHORT = 4 * 60 * 60 * 1000; // 4 hours (default)
const AUTH_EXPIRY_LONG = 30 * 24 * 60 * 60 * 1000; // 30 days (remember me)

const SERVER_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-a98fb753`;

// Rate limiting — prevent brute-force password guessing
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_KEY = 'power_admin_rl';

function getRateLimitState(): { attempts: number; lockedUntil: number } {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
    if (!raw) return { attempts: 0, lockedUntil: 0 };
    return JSON.parse(raw);
  } catch { return { attempts: 0, lockedUntil: 0 }; }
}

function setRateLimitState(state: { attempts: number; lockedUntil: number }) {
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
}

function isRateLimited(): { limited: boolean; remainingSeconds: number } {
  const state = getRateLimitState();
  if (state.lockedUntil > Date.now()) {
    return { limited: true, remainingSeconds: Math.ceil((state.lockedUntil - Date.now()) / 1000) };
  }
  // Reset if lockout expired
  if (state.lockedUntil > 0 && state.lockedUntil <= Date.now()) {
    setRateLimitState({ attempts: 0, lockedUntil: 0 });
  }
  return { limited: false, remainingSeconds: 0 };
}

function recordFailedAttempt() {
  const state = getRateLimitState();
  state.attempts += 1;
  if (state.attempts >= MAX_ATTEMPTS) {
    state.lockedUntil = Date.now() + LOCKOUT_DURATION;
  }
  setRateLimitState(state);
}

function resetRateLimit() {
  sessionStorage.removeItem(RATE_LIMIT_KEY);
}

function getAuthExpiry(): number {
  return localStorage.getItem(AUTH_REMEMBER_KEY) === 'true' ? AUTH_EXPIRY_LONG : AUTH_EXPIRY_SHORT;
}

function isAuthValid(): boolean {
  const saved = localStorage.getItem(AUTH_KEY);
  const ts = localStorage.getItem(AUTH_TS_KEY);
  if (saved !== 'true' || !ts) return false;
  return Date.now() - parseInt(ts, 10) < getAuthExpiry();
}

function clearAuth() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(AUTH_TS_KEY);
  localStorage.removeItem(AUTH_REMEMBER_KEY);
  clearAdminToken();
}

export function AdminGate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [remember, setRemember] = useState(() => localStorage.getItem(AUTH_REMEMBER_KEY) === 'true');

  useEffect(() => {
    if (isAuthValid()) {
      setAuthenticated(true);
    } else {
      clearAuth();
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    // Check rate limiting before attempting
    const rl = isRateLimited();
    if (rl.limited) {
      setError(`Muitas tentativas. Aguarde ${rl.remainingSeconds}s.`);
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${SERVER_BASE}/admin-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        recordFailedAttempt();
        setError(data.error || 'Erro ao autenticar');
        setPassword('');
        setSubmitting(false);
        return;
      }

      if (data.valid) {
        resetRateLimit();
        localStorage.setItem(AUTH_KEY, 'true');
        localStorage.setItem(AUTH_TS_KEY, String(Date.now()));
        localStorage.setItem(AUTH_REMEMBER_KEY, String(remember));
        // Store token in memory/sessionStorage only (not localStorage)
        setAdminToken(password);
        setAuthenticated(true);
        setError('');
      } else {
        recordFailedAttempt();
        const rlAfter = isRateLimited();
        if (rlAfter.limited) {
          setError(`Muitas tentativas. Bloqueado por ${Math.ceil(LOCKOUT_DURATION / 60000)} minutos.`);
        } else {
          const remaining = MAX_ATTEMPTS - getRateLimitState().attempts;
          setError(`Senha incorreta. ${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`);
        }
        setPassword('');
      }
    } catch (err: any) {
      setError('Erro de conexao. Tente novamente.');
      setPassword('');
    }

    setSubmitting(false);
  };

  if (checking) return null;

  if (authenticated) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-white mb-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            POWER ARENA
          </h1>
          <p className="text-sm text-slate-500">Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 block mb-1.5">Senha de acesso</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="Digite a senha..."
                autoFocus
                disabled={submitting}
                className={`w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800/50 border text-white text-sm outline-none transition-colors ${
                  error
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-slate-700 focus:border-emerald-500'
                } ${submitting ? 'opacity-60' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-400 mt-1.5">{error}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {submitting ? 'Verificando...' : 'Entrar'}
          </button>

          <label className="flex items-center gap-2 cursor-pointer select-none justify-center">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-emerald-500 w-4 h-4"
            />
            <span className="text-xs text-slate-400">Lembrar neste dispositivo (30 dias)</span>
          </label>
        </form>

        <p className="text-center text-[10px] text-slate-600 mt-6">
          Acesso restrito à equipe Power Sports / Jornal FV
        </p>
      </div>
    </div>
  );
}

// Re-export for backward compatibility (some files may still import from here)
export { getAdminToken };