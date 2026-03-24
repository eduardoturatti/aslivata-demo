import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Home, BarChart3, Users, Lock, Trophy, User, Mail, CheckCircle, X, AlertCircle, Vote, Newspaper, Shield, Target } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { useDarkMode } from '../../lib/useDarkMode';
import PowerLogo from './PowerLogo';
import SponsorLogos from './SponsorLogos';
import LogoF7Esportes from '../../imports/LogoF7Esportes';
import LogoForcaDoVale from '../../imports/LogoForcaDoVale';
import { DisplayNameModal, needsNameChange } from './DisplayNameModal';
import { getCachedDisplayName } from '../../lib/galera-api';

const NAV_ITEMS = [
  { path: '/', label: 'Jogos', icon: Home },
  { path: '/classificacao', label: 'Tabela', icon: BarChart3 },
  { path: '/artilharia', label: 'Gols', icon: Trophy },
  { path: '/galera', label: 'Galera', icon: Vote },
  { path: '/times', label: 'Times', icon: Shield },
];

const MAIN_PATHS = ['/', '/classificacao', '/times', '/galera', '/premium', '/noticias', '/bolao', '/artilharia'];

// Session key to avoid re-prompting within the same session
const NAME_PROMPT_SESSION_KEY = 'ps_name_prompt_dismissed';

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, premium, loading: authLoading } = useAuth();
  const [stripeSuccess, setStripeSuccess] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showNameModal, setShowNameModal] = useState(false);
  const isDark = useDarkMode();
  const nameCheckDone = useRef(false);

  // Apply dark class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  // Global check: if user is logged in with "Torcedor" or empty display_name, prompt
  useEffect(() => {
    if (authLoading || !user || nameCheckDone.current) return;
    nameCheckDone.current = true;

    // Don't re-prompt if dismissed this session
    try {
      const dismissed = sessionStorage.getItem(NAME_PROMPT_SESSION_KEY);
      if (dismissed === user.id) return;
    } catch { /* */ }

    // Check cached display name first (instant)
    const cached = getCachedDisplayName();
    if (cached && !needsNameChange(cached)) return;

    // If no cache or cache shows bad name, show modal after short delay
    // (give the page time to render first)
    const timer = setTimeout(() => {
      setShowNameModal(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, authLoading]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.get('success') === 'true') {
      setStripeSuccess(true);
    }

    const errorParam = params.get('error');
    const errorDesc = params.get('error_description');
    if (errorParam) {
      const friendlyMsg = errorDesc
        ? errorDesc.replace(/\+/g, ' ')
        : 'Link expirado ou inválido. Solicite um novo.';
      setAuthError(friendlyMsg);
    }

    const paramsToClean = ['success', 'code', 'error', 'error_description', 'error_code'];
    const url = new URL(window.location.href);
    let needsClean = false;
    for (const p of paramsToClean) {
      if (url.searchParams.has(p)) {
        url.searchParams.delete(p);
        needsClean = true;
      }
    }
    if (url.hash && url.hash.includes('access_token')) {
      url.hash = '';
      needsClean = true;
    }
    if (needsClean) {
      window.history.replaceState({}, '', url.pathname + (url.search || '') + (url.hash || ''));
    }
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const showFooter =
    MAIN_PATHS.includes(location.pathname);

  return (
    <div className="h-dvh bg-background flex flex-col overflow-hidden">
      {authError && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-lg mx-auto px-4 pt-2">
            <div className="bg-card border border-destructive/30 rounded-xl p-4 shadow-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Erro no login
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {authError}
                </p>
              </div>
              <button
                onClick={() => setAuthError(null)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {stripeSuccess && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-lg mx-auto px-4 pt-2">
            <div className="bg-card border border-green-500/30 rounded-xl p-4 shadow-lg flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                  Pagamento confirmado!
                </p>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Enviamos um link de acesso para seu e-mail. Verifique sua caixa de entrada.
                </p>
              </div>
              <button
                onClick={() => setStripeSuccess(false)}
                className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="fixed top-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border h-[52px]">
        <div className="max-w-lg mx-auto px-4 h-full flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex flex-col items-start gap-0">
            <PowerLogo width={150} />
          </button>
          <div className="flex items-center gap-2">
            {premium && (
              <span className="text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide" style={{ backgroundColor: 'rgba(212,168,67,0.2)', color: '#D4A843' }}>
                PRO
              </span>
            )}
            <button
              onClick={() => navigate('/conta')}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                user
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-muted-foreground hover:text-foreground'
              }`}
            >
              {user ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pt-[52px] pb-[72px]">
        <div className="max-w-lg mx-auto min-h-full flex flex-col">
          <div className="flex-1">
            <Outlet />
          </div>

        {showFooter && (
          <div className="px-4 pb-4 mt-auto pt-12">
            <div className="border-t border-border pt-8 pb-2">
              <div className="grid grid-cols-3 items-end gap-8 mb-6 px-0">
                {/* F7 Esportes - Apoio */}
                <div className="flex flex-col items-center">
                  <span className="text-muted-foreground/50 mb-2 font-bold uppercase tracking-[0.2em] text-[7px]" style={{ fontFamily: 'var(--font-heading)' }}>Apoio</span>
                  <div style={{ width: 95, height: 95 * (18.4 / 181), overflow: 'hidden' }}>
                    <div style={{
                      width: 181, height: 18.4,
                      transform: `scale(${95 / 181})`,
                      transformOrigin: 'top left',
                      '--fill-0': isDark ? '#cbd5e1' : undefined,
                    } as React.CSSProperties}>
                      <LogoF7Esportes />
                    </div>
                  </div>
                </div>

                {/* Forca do Vale - Realização */}
                <div className="flex flex-col items-center">
                  <span className="text-muted-foreground/50 mb-2 font-bold uppercase tracking-[0.2em] text-[7px]" style={{ fontFamily: 'var(--font-heading)' }}>Realização</span>
                  <div style={{ width: 95, height: 95 * (24 / 158), overflow: 'hidden' }}>
                    <div style={{
                      width: 158, height: 24,
                      transform: `scale(${95 / 158})`,
                      transformOrigin: 'top left',
                      '--fill-0': isDark ? '#cbd5e1' : undefined,
                    } as React.CSSProperties}>
                      <LogoForcaDoVale />
                    </div>
                  </div>
                </div>

                {/* Power - App */}
                <div className="flex flex-col items-center">
                  <span className="text-muted-foreground/50 mb-2 font-bold uppercase tracking-[0.2em] text-[7px]" style={{ fontFamily: 'var(--font-heading)' }}>App</span>
                  <PowerLogo width={85} />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 mt-6 mb-2">
                <button onClick={() => navigate('/sobre')} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">Sobre</button>
                <span className="text-[10px] text-muted-foreground/30">·</span>
                <button onClick={() => navigate('/termos')} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">Termos</button>
                <span className="text-[10px] text-muted-foreground/30">·</span>
                <button onClick={() => navigate('/privacidade')} className="text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">Privacidade</button>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      {/* Global DisplayName prompt for users with "Torcedor" or empty name */}
      {showNameModal && (
        <DisplayNameModal
          isOpen={true}
          email={user?.email}
          isNameChange={true}
          onClose={(name) => {
            setShowNameModal(false);
            // Mark as dismissed for this session so we don't re-prompt
            try {
              if (user?.id) sessionStorage.setItem(NAME_PROMPT_SESSION_KEY, user.id);
            } catch { /* */ }
          }}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background backdrop-blur-xl border-t border-border">
        <div className="max-w-lg mx-auto flex">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  active
                    ? item.premium ? 'text-[#D4A843]' : 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {item.premium && !premium && (
                    <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1.5" style={{ color: '#D4A843' }} />
                  )}
                </div>
                <span className="text-[10px] font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}