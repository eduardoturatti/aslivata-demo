import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, User, Mail, LogOut, Trophy, CheckCircle, Vote, Target } from 'lucide-react';
import { useAuth } from '../lib/auth-context';
import { AuthModal } from '../components/public/AuthModal';
import { PremiumModal } from '../components/public/PremiumModal';
import { PageTransition } from '../components/public/PageTransition';
import { LoginSkeleton } from '../components/public/Skeletons';
import { getProfile, saveProfile, getCachedDisplayName } from '../lib/galera-api';
import { toast } from 'sonner@2.0.3';

const GOLD = '#D4A843';
const GOLD_BG = (opacity: number) => `rgba(212,168,67,${opacity})`;

export function LoginPage() {
  const navigate = useNavigate();
  const { user, premium, loading, signOut, refreshAuth } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [displayName, setDisplayName] = useState(() => getCachedDisplayName());
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);

  // Load profile display name when user is available
  useEffect(() => {
    if (user) {
      getProfile()
        .then((profile: any) => {
          if (profile?.display_name) setDisplayName(profile.display_name);
        })
        .catch(() => {});
    } else {
      setDisplayName('');
    }
  }, [user?.id]);

  const handleSignOut = async () => {
    await signOut();
    setDisplayName('');
  };

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setSavingName(true);
    try {
      await saveProfile({ display_name: displayName.trim() });
      toast.success('Nome atualizado!');
      setEditingName(false);
    } catch {
      toast.error('Erro ao salvar');
    }
    setSavingName(false);
  };

  if (loading) return (<LoginSkeleton />);

  return (
    <PageTransition>
      <div className="px-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /><span className="text-xs">Voltar</span>
        </button>

        <div className="flex flex-col items-center gap-4 mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${user ? 'bg-primary/15' : 'bg-secondary'}`}>
            {user ? <CheckCircle className="w-7 h-7 text-primary" /> : <User className="w-7 h-7 text-muted-foreground" />}
          </div>
          <div className="text-center">
            <h1 className="text-xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              {user ? 'Minha Conta' : 'Entrar'}
            </h1>
            {user && <p className="text-sm text-muted-foreground mt-1">{user.email}</p>}
            {user && premium && (
              <span className="inline-block mt-2 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-wide" style={{ backgroundColor: 'rgba(212,168,67,0.15)', color: GOLD }}>
                Premium Ativo
              </span>
            )}
          </div>
        </div>

        {user ? (
          <div className="space-y-4">
            {/* Email info */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>E-mail</p>
                  <p className="text-sm font-semibold text-foreground truncate">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Display name */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Nome no ranking</p>
                  {editingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                        placeholder="Seu nome"
                        className="flex-1 bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        disabled={savingName}
                        className="text-xs font-bold text-primary px-3 py-1.5 rounded-lg bg-primary/10 disabled:opacity-50"
                      >
                        {savingName ? '...' : 'Salvar'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground">{displayName || 'Torcedor'}</p>
                      <button
                        onClick={() => setEditingName(true)}
                        className="text-[10px] text-primary font-semibold"
                      >
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* What you can do */}
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                O que você pode fazer
              </p>
              <div className="space-y-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Seleção da Galera</p>
                    <p className="text-[10px] text-muted-foreground">Vote nos melhores de cada rodada</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Bolão</p>
                    <p className="text-[10px] text-muted-foreground">Dê palpites e concorra no ranking</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-green-500/15 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">Jogos, classificação e times</p>
                    <p className="text-[10px] text-muted-foreground">Acesso completo ao básico do campeonato</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium status */}
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 shrink-0" style={{ color: premium ? GOLD : undefined }} />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Premium</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{premium ? 'Ativo' : 'Inativo'}</p>
                    {premium && <CheckCircle className="w-3.5 h-3.5" style={{ color: GOLD }} />}
                  </div>
                </div>
                {!premium && (
                  <button onClick={() => setShowPremiumModal(true)} className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors" style={{ backgroundColor: GOLD_BG(0.15), color: GOLD, fontFamily: 'var(--font-heading)' }}>
                    Comprar
                  </button>
                )}
              </div>
              {!premium && (
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Desbloqueie artilharia, cartões, perfis de jogadores, comparativos e mais por <strong style={{ color: GOLD }}>R$ 19,90</strong> (todo o campeonato).
                </p>
              )}
            </div>

            {/* Quick links */}
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/galera')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary/10 border border-primary/20 text-sm font-semibold text-primary hover:bg-primary/15 transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <Vote className="w-4 h-4" /> Galera
              </button>
              <button
                onClick={() => navigate('/galera')}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm font-semibold text-blue-500 hover:bg-blue-500/15 transition-colors"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                <Target className="w-4 h-4" /> Bolão
              </button>
            </div>

            <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 bg-card border border-border text-destructive font-semibold rounded-xl py-3 transition-colors hover:bg-destructive/5 active:scale-[0.98]" style={{ fontFamily: 'var(--font-heading)' }}>
              <LogOut className="w-4 h-4" /> Sair
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
              Crie sua conta gratuita para participar da <strong className="text-foreground">Seleção da Galera</strong> e do <strong className="text-foreground">Bolão</strong>.
            </p>

            {/* Free features */}
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-xs font-bold text-foreground mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
                Gratuito com cadastro
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Vote className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-xs text-muted-foreground">Votar na <strong className="text-foreground">Seleção da Galera</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-xs text-muted-foreground">Participar do <strong className="text-foreground">Bolão</strong> e ranking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs text-muted-foreground">Jogos, classificação e elencos</span>
                </div>
              </div>
            </div>

            <button onClick={() => setShowAuthModal(true)} className="w-full bg-primary text-primary-foreground font-bold rounded-xl py-3 transition-colors hover:bg-primary/90 active:scale-[0.98] flex items-center justify-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
              <Mail className="w-4 h-4" /> Criar conta / Entrar
            </button>

            {/* Premium upsell - secondary */}
            <div className="bg-card rounded-xl border border-border p-4 text-center">
              <Trophy className="w-5 h-5 mx-auto mb-2" style={{ color: GOLD }} />
              <p className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Quer mais?
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
                Com o <strong style={{ color: GOLD }}>Premium</strong> você desbloqueia artilharia, cartões, perfis completos e comparativos.
              </p>
              <button
                onClick={() => navigate('/premium')}
                className="mt-3 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                style={{ backgroundColor: GOLD_BG(0.15), color: GOLD, fontFamily: 'var(--font-heading)' }}
              >
                Saiba mais — R$ 19,90 / campeonato
              </button>
            </div>
          </div>
        )}

        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={async () => {
            setShowAuthModal(false);
            await refreshAuth();
          }}
        />

        <PremiumModal
          isOpen={showPremiumModal}
          onClose={() => setShowPremiumModal(false)}
          onSuccess={async () => {
            setShowPremiumModal(false);
            await refreshAuth();
          }}
        />
      </div>
    </PageTransition>
  );
}