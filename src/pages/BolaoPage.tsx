import React, { useState } from 'react';
import { Trophy, Medal, Target, ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../components/ui/card';
import { PageTransition } from '../components/public/PageTransition';
import { SectionHeader } from '../components/public/SectionHeader';
import { BOLAO_PARTICIPANTS, TEAMS, type BolaoParticipant } from '../lib/mock-data';

const MEDAL_EMOJI = ['🥇', '🥈', '🥉'] as const;

function teamName(slug: string): string {
  return TEAMS.find(t => t.slug === slug)?.name ?? slug;
}

function PredictionResult({ points }: { points: number }) {
  if (points === 10) return <span className="text-[10px] font-bold text-green-400">Exato!</span>;
  if (points === 5) return <span className="text-[10px] font-bold text-yellow-400">Resultado</span>;
  return <span className="text-[10px] font-bold text-red-400">Errou</span>;
}

function ParticipantPredictions({ predictions }: { predictions: BolaoParticipant['predictions'] }) {
  return (
    <div className="px-4 pb-3 pt-1 space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
        Palpites recentes
      </p>
      {predictions.map((pred) => (
        <div key={pred.matchId} className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-[11px] text-foreground">
              <span className="font-semibold truncate">{teamName(pred.homeSlug)}</span>
              <span className="text-muted-foreground">vs</span>
              <span className="font-semibold truncate">{teamName(pred.awaySlug)}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] text-muted-foreground">
                Palpite: <span className="font-bold text-foreground">{pred.predictedHome}-{pred.predictedAway}</span>
              </span>
              <span className="text-[10px] text-muted-foreground">
                Real: <span className="font-bold text-foreground">{pred.actualHome}-{pred.actualAway}</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <PredictionResult points={pred.points} />
            <span className="text-[10px] font-bold" style={{ fontFamily: 'var(--font-mono)', color: pred.points > 0 ? '#D4AF37' : 'var(--muted-foreground)' }}>
              +{pred.points} pts
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BolaoPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalPredictions = BOLAO_PARTICIPANTS.reduce((sum, p) => sum + p.predictions.length, 0);

  return (
    <PageTransition>
      <div className="px-3 py-4">
        {/* Header */}
        <SectionHeader title="Bolão ASLIVATA" icon={Trophy} variant="page" />

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Participantes', value: BOLAO_PARTICIPANTS.length, icon: '👥' },
            { label: 'Palpites', value: totalPredictions, icon: '🎯' },
            { label: 'Rodada', value: '3ª', icon: '📅' },
          ].map((stat) => (
            <Card key={stat.label} className="py-3 px-3 items-center text-center border-border gap-1">
              <span className="text-base">{stat.icon}</span>
              <span className="text-lg font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground font-medium" style={{ fontFamily: 'var(--font-heading)' }}>
                {stat.label}
              </span>
            </Card>
          ))}
        </div>

        {/* Ranking table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {/* Table header */}
          <div
            className="grid grid-cols-[24px_1fr_36px_28px_28px_24px] gap-0 px-3 py-2 border-b border-border text-[9px] text-muted-foreground font-semibold"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            <span className="text-center">#</span>
            <span className="pl-1">Participante</span>
            <span className="text-center">Pts</span>
            <span className="text-center flex items-center justify-center" title="Placares exatos">
              <Target className="w-3 h-3" />
            </span>
            <span className="text-center flex items-center justify-center" title="Resultados corretos">
              <Medal className="w-3 h-3" />
            </span>
            <span />
          </div>

          {/* Participant rows */}
          {BOLAO_PARTICIPANTS.map((p, idx) => {
            const pos = idx + 1;
            const isMedal = pos <= 3;
            const isExpanded = expandedId === p.id;

            return (
              <div key={p.id}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : p.id)}
                  className={`w-full grid grid-cols-[24px_1fr_36px_28px_28px_24px] gap-0 px-3 py-3 items-center transition-colors hover:bg-muted ${
                    idx < BOLAO_PARTICIPANTS.length - 1 && !isExpanded ? 'border-b border-border' : ''
                  }`}
                >
                  {/* Position */}
                  <span
                    className={`text-center text-[11px] font-bold ${
                      isMedal ? 'text-[#D4AF37]' : 'text-muted-foreground'
                    }`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {isMedal ? MEDAL_EMOJI[pos - 1] : pos}
                  </span>

                  {/* Name + avatar + badge */}
                  <div className="flex items-center gap-2 min-w-0 pl-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                      style={{
                        background: isMedal ? 'linear-gradient(135deg, #006633, #008844)' : 'var(--muted)',
                        color: isMedal ? '#D4AF37' : 'var(--foreground)',
                        fontFamily: 'var(--font-heading)',
                      }}
                    >
                      {p.avatar}
                    </div>
                    <div className="min-w-0 text-left">
                      <p className="text-[11px] font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                        {p.name}
                      </p>
                      <p className="text-[9px] text-muted-foreground truncate">
                        {p.badge}
                      </p>
                    </div>
                  </div>

                  {/* Points */}
                  <span
                    className={`text-center text-[13px] font-extrabold ${isMedal ? 'text-[#D4AF37]' : 'text-foreground'}`}
                    style={{ fontFamily: 'var(--font-mono)' }}
                  >
                    {p.points}
                  </span>

                  {/* Exact scores */}
                  <span className="text-center text-[11px] text-green-400 font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                    {p.exactScores}
                  </span>

                  {/* Right results */}
                  <span className="text-center text-[11px] text-yellow-400 font-semibold" style={{ fontFamily: 'var(--font-mono)' }}>
                    {p.rightResults}
                  </span>

                  {/* Expand chevron */}
                  <span className="flex justify-center text-muted-foreground">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </span>
                </button>

                {/* Expandable predictions */}
                {isExpanded && (
                  <div className={`bg-muted/30 ${idx < BOLAO_PARTICIPANTS.length - 1 ? 'border-b border-border' : ''}`}>
                    <ParticipantPredictions predictions={p.predictions} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <Target className="w-3 h-3 text-green-400" />
            <span className="text-[10px] text-muted-foreground">Placares exatos</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Medal className="w-3 h-3 text-yellow-400" />
            <span className="text-[10px] text-muted-foreground">Resultados corretos</span>
          </div>
        </div>

        {/* Scoring info */}
        <Card className="mt-4 px-4 py-3 gap-2 border-border">
          <p className="text-[11px] font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            Pontuação
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-[10px] text-muted-foreground">Placar exato: <span className="font-bold text-foreground">10 pts</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-yellow-400" />
              <span className="text-[10px] text-muted-foreground">Resultado certo: <span className="font-bold text-foreground">5 pts</span></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-400" />
              <span className="text-[10px] text-muted-foreground">Errou: <span className="font-bold text-foreground">0 pts</span></span>
            </div>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}
