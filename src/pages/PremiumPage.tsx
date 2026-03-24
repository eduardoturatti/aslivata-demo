import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Trophy, AlertTriangle, Swords, Lock, BarChart3, ExternalLink, CheckCircle, Star, TrendingUp, Shield, Zap } from 'lucide-react';
import { STRIPE_CHECKOUT_URL } from '../lib/premium';
import { useAuth } from '../lib/auth-context';
import { PremiumModal } from '../components/public/PremiumModal';
import { PageTransition } from '../components/public/PageTransition';
import { PremiumSkeleton } from '../components/public/Skeletons';
import { SectionHeader } from '../components/public/SectionHeader';
import { motion } from 'motion/react';

const GOLD = '#D4A843';
const GOLD_BG = (opacity: number) => `rgba(212,168,67,${opacity})`;
const GOLD_DARK = '#BF9638';

const PREMIUM_SECTIONS = [
  { path: '/artilharia', label: 'Artilharia', desc: 'Ranking dos goleadores do campeonato', icon: Trophy, color: 'from-green-500/20 to-green-500/5' },
  { path: '/cartoes', label: 'Cartões & Fair Play', desc: 'Ranking de cartões e disciplina por time', icon: AlertTriangle, color: 'from-yellow-500/20 to-yellow-500/5' },
  { path: '/mano-a-mano', label: 'Mano a Mano', desc: 'Compare dois times lado a lado', icon: Swords, color: 'from-purple-500/20 to-purple-500/5' },
  { path: '/times', label: 'Estatísticas', desc: 'Stats de time e elenco completo', icon: BarChart3, color: 'from-blue-500/20 to-blue-500/5' },
];

// Mock data for premium preview
const MOCK_TOP_SCORERS = [
  { pos: 1, name: '???', team: '???', goals: '??' },
  { pos: 2, name: '???', team: '???', goals: '??' },
  { pos: 3, name: '???', team: '???', goals: '??' },
];

function PreviewCard({ title, icon: Icon, children, delay }: { title: string; icon: any; children: React.ReactNode; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="px-3 py-2 border-b border-border flex items-center gap-2">
        <Icon className="w-3.5 h-3.5" style={{ color: GOLD }} />
        <span className="text-[11px] font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{title}</span>
      </div>
      <div className="relative">
        <div className="blur-[5px] select-none pointer-events-none p-3">
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-card via-card/80 to-transparent">
          <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: GOLD }}>
            <Lock className="w-3 h-3" /> Premium
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function PremiumPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { user, premium, loading, refreshAuth } = useAuth();

  if (loading) return (<PremiumSkeleton />);

  if (premium) {
    return (
      <PageTransition>
        <div className="px-4 py-4">
          <SectionHeader
            title="Premium"
            icon={Trophy}
            variant="page"
            trailing={
              <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: GOLD }}>
                <CheckCircle className="w-3 h-3" /> Acesso ativado
              </span>
            }
          />
          <div className="space-y-3">
            {PREMIUM_SECTIONS.map(section => {
              const Icon = section.icon;
              return (<button key={section.path} onClick={() => navigate(section.path)} className={`w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-gradient-to-r ${section.color} hover:border-primary/20 transition-all active:scale-[0.98]`}>
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0"><Icon className="w-5 h-5 text-foreground" /></div>
                <div className="flex-1 text-left"><p className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{section.label}</p><p className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>{section.desc}</p></div>
              </button>);
            })}
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="pb-6">
        {/* Hero banner */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${GOLD_BG(0.15)}, transparent 60%)` }} />
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[80px] pointer-events-none" style={{ background: GOLD_BG(0.12) }} />

          <div className="relative px-4 pt-8 pb-6 text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: GOLD_BG(0.15), border: `2px solid ${GOLD_BG(0.3)}` }}
            >
              <Trophy className="w-10 h-10" style={{ color: GOLD }} />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-2xl font-extrabold text-foreground mb-2"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Power Sports <span style={{ color: GOLD }}>Premium</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto"
            >
              Estatísticas completas, artilharia, confrontos diretos e muito mais.
            </motion.p>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Price card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-2xl p-5 text-center"
            style={{ border: `1.5px solid ${GOLD_BG(0.3)}`, background: `linear-gradient(135deg, ${GOLD_BG(0.08)}, transparent)` }}
          >
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Pagamento único</p>
            <div className="flex items-baseline justify-center gap-1 mb-1">
              <span className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>R$</span>
              <span className="text-4xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>19,90</span>
            </div>
            <p className="text-[11px] text-muted-foreground">Válido por todo o campeonato (fev-mai 2026)</p>
          </motion.div>

          {/* Blurred preview cards - provocative */}
          <PreviewCard title="Artilharia" icon={Trophy} delay={0.3}>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm font-bold text-foreground w-5 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{i}</span>
                  <div className="w-6 h-6 rounded-full bg-muted" />
                  <span className="text-xs text-foreground flex-1">Jogador Exemplo {i}</span>
                  <span className="text-sm font-bold text-green-500" style={{ fontFamily: 'var(--font-mono)' }}>{8 - i}</span>
                </div>
              ))}
            </div>
          </PreviewCard>

          <PreviewCard title="Cartões & Disciplina" icon={AlertTriangle} delay={0.4}>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-muted" />
                  <span className="text-xs text-foreground flex-1">Time Exemplo {i}</span>
                  <span className="text-xs text-yellow-500 font-bold flex items-center gap-0.5" style={{ fontFamily: 'var(--font-mono)' }}>{12 - i * 2} <span className="inline-block w-1.5 h-2.5 rounded-[1px] bg-yellow-400" /></span>
                  <span className="text-xs text-red-500 font-bold flex items-center gap-0.5" style={{ fontFamily: 'var(--font-mono)' }}>{3 - i} <span className="inline-block w-1.5 h-2.5 rounded-[1px] bg-red-500" /></span>
                </div>
              ))}
            </div>
          </PreviewCard>

          <PreviewCard title="Mano a Mano" icon={Swords} delay={0.5}>
            <div className="flex items-center justify-around py-2">
              <div className="text-center"><div className="w-10 h-10 rounded-full bg-muted mx-auto mb-1" /><span className="text-[10px] text-foreground">Time A</span></div>
              <div className="text-center"><span className="text-xl font-bold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>VS</span></div>
              <div className="text-center"><div className="w-10 h-10 rounded-full bg-muted mx-auto mb-1" /><span className="text-[10px] text-foreground">Time B</span></div>
            </div>
          </PreviewCard>

          <PreviewCard title="Stats do Elenco" icon={BarChart3} delay={0.6}>
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_30px_30px_30px] gap-0 text-[9px] text-muted-foreground font-bold">
                <span>Jogador</span><span className="text-center">G</span><span className="text-center">A</span><span className="flex justify-center"><span className="w-2 h-3 rounded-[1px] bg-yellow-400 inline-block" /></span>
              </div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="grid grid-cols-[1fr_30px_30px_30px] gap-0 text-xs">
                  <span className="text-foreground">Jogador {i}</span>
                  <span className="text-center text-green-500 font-bold">{5 - i}</span>
                  <span className="text-center text-blue-500">{3 - (i > 2 ? 2 : i - 1)}</span>
                  <span className="text-center text-yellow-500">{i}</span>
                </div>
              ))}
            </div>
          </PreviewCard>

          {/* Features list */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.65 }}
            className="space-y-2"
          >
            {[
              { icon: Trophy, text: 'Ranking de artilheiros atualizado' },
              { icon: AlertTriangle, text: 'Cartões, suspensões e pendurados' },
              { icon: Swords, text: 'Comparação mano a mano entre times' },
              { icon: BarChart3, text: 'Estatísticas individuais de cada jogador' },
              { icon: Shield, text: 'Escalações e posições em campo' },
              { icon: TrendingUp, text: 'Médias de gols por jogo, aproveitamento' },
            ].map(feat => (
              <div key={feat.text} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-card border border-border">
                <feat.icon className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
                <span className="text-[12px] text-foreground font-medium">{feat.text}</span>
              </div>
            ))}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.75 }}
            className="space-y-3 pt-2"
          >
            <a
              href={STRIPE_CHECKOUT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-white font-bold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2 active:scale-[0.98] shadow-lg"
              style={{ fontFamily: 'var(--font-heading)', backgroundColor: GOLD }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = GOLD_DARK)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = GOLD)}
            >
              <Trophy className="w-4 h-4" /> Comprar Premium — R$19,90
            </a>
            <button
              onClick={() => setShowModal(true)}
              className="w-full bg-card border border-border text-foreground font-semibold rounded-xl py-3 transition-colors active:scale-[0.98]"
              style={{ fontFamily: 'var(--font-heading)' }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = GOLD_BG(0.3))}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = '')}
            >
              Já tenho Premium — Entrar
            </button>
          </motion.div>
        </div>

        <PremiumModal isOpen={showModal} onClose={() => setShowModal(false)} onSuccess={async () => { await refreshAuth(); setShowModal(false); }} />
      </div>
    </PageTransition>
  );
}