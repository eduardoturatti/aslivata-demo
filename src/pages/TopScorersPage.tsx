import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Trophy, User } from 'lucide-react';
import { fetchAllPlayers, type Player } from '../lib/public-supabase';
import { logoUrl, photoUrl } from '../lib/image-utils';
import { redact, useIsPremium, UnlockBanner } from '../components/public/PremiumGate';
import { PageTransition } from '../components/public/PageTransition';
import { SectionHeader } from '../components/public/SectionHeader';
import { RankingSkeleton } from '../components/public/Skeletons';
import { getPositionLabel } from '../lib/galera-api';
import { ShareButton } from '../components/public/ShareButton';

function TeamLogo({ url, name }: { url?: string; name: string }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[7px] font-bold text-foreground shrink-0">
        {name.slice(0, 2)}
      </div>
    );
  }
  return <img src={logoUrl(url, 20)} alt={name} width={20} height={20} loading="lazy" decoding="async" onError={() => setErr(true)} className="w-5 h-5 object-contain shrink-0" />;
}

interface ScorerRow {
  playerId: string;
  playerName: string;
  playerNumber: string;
  playerPhoto: string | null;
  playerPosition: string;
  teamName: string;
  teamLogo: string;
  goals: number;
}

const FREE_VISIBLE = 5;

export function TopScorersPage() {
  const navigate = useNavigate();
  const [scorers, setScorers] = useState<ScorerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isPremium = useIsPremium();

  useEffect(() => {
    async function load() {
      const allPlayers = await fetchAllPlayers();
      const sorted = allPlayers
        .filter(p => (p.total_goals ?? 0) > 0)
        .map(p => ({
          playerId: p.id,
          playerName: p.name,
          playerNumber: p.number || '',
          playerPhoto: p.photo_url || null,
          playerPosition: p.position || '',
          teamName: (p.team as any)?.short_name || '',
          teamLogo: (p.team as any)?.logo_url || '',
          goals: p.total_goals ?? 0,
        }))
        .sort((a, b) => b.goals - a.goals);
      setScorers(sorted);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <PageTransition>
      <div className="px-4 py-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        <SectionHeader title="Artilharia" icon={Trophy} variant="page" />

        {loading ? (
          <RankingSkeleton rows={10} />
        ) : scorers.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Nenhum gol registrado</p>
        ) : (
          <>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {scorers.map((s, idx) => {
                const pos = idx + 1;
                const isMedal = pos <= 3;
                const medalColors = ['text-yellow-500', 'text-gray-400', 'text-amber-600'];
                const isLocked = !isPremium && idx >= FREE_VISIBLE;

                return (
                  <button
                    key={s.playerId}
                    onClick={() => {
                      if (isLocked) return; // clicking on locked rows doesn't navigate
                      navigate(`/jogador/${s.playerId}`);
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      idx < scorers.length - 1 ? 'border-b border-border' : ''
                    } ${isLocked ? 'cursor-default' : 'hover:bg-muted'}`}
                  >
                    <span
                      className={`w-6 text-center text-sm font-bold ${isMedal ? medalColors[pos - 1] : 'text-subtle'}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {pos}
                    </span>
                    {/* Photo: real for free, placeholder for locked */}
                    {isLocked ? (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ) : s.playerPhoto ? (
                      <img
                        src={photoUrl(s.playerPhoto, 36)}
                        alt={s.playerName}
                        width={36}
                        height={36}
                        loading="lazy"
                        decoding="async"
                        className="w-9 h-9 rounded-full object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {isLocked ? (
                        <div className="w-5 h-5 rounded-full bg-muted shrink-0" />
                      ) : (
                        <TeamLogo url={s.teamLogo} name={s.teamName} />
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm truncate text-left ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {isLocked ? redact(s.playerName, 'name') : s.playerName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {isLocked
                            ? `${redact(s.teamName, 'name')} · ${getPositionLabel(s.playerPosition)}`
                            : `${s.teamName} · ${getPositionLabel(s.playerPosition)} · #${s.playerNumber}`
                          }
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-lg font-bold ${isLocked ? 'text-muted-foreground' : 'text-green-600'}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {isLocked ? redact(s.goals, 'number') : s.goals}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Unlock CTA */}
            <UnlockBanner
              label="Revelar artilharia completa"
              hiddenCount={Math.max(0, scorers.length - FREE_VISIBLE)}
            />
          </>
        )}

        <ShareButton
          text={scorers.length > 0 ? `Artilharia do 26ª Regional Certel/Sicredi 2025\n\n${scorers.slice(0, 3).map((p, i) => `${i + 1}. ${p.playerName} (${p.teamName}) - ${p.goals} gols`).join('\n')}\n\nConfira o ranking completo no Power Sports!` : ''}
          url="https://power.jornalfv.com.br/artilharia"
          title="Artilharia"
          label="Compartilhar artilharia"
          variant="pill"
          className="mt-4 w-full"
        />
      </div>
    </PageTransition>
  );
}
