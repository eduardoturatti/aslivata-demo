import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Users, User } from 'lucide-react';
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

interface AssistRow {
  playerId: string;
  playerName: string;
  playerNumber: string;
  playerPhoto: string | null;
  playerPosition: string;
  teamName: string;
  teamLogo: string;
  assists: number;
}

const FREE_VISIBLE = 5;

export function TopAssistsPage() {
  const navigate = useNavigate();
  const [assisters, setAssisters] = useState<AssistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const isPremium = useIsPremium();

  useEffect(() => {
    async function load() {
      const allPlayers = await fetchAllPlayers();
      const sorted = allPlayers
        .filter(p => (p.total_assists ?? 0) > 0)
        .map(p => ({
          playerId: p.id,
          playerName: p.name,
          playerNumber: p.number || '',
          playerPhoto: p.photo_url || null,
          playerPosition: p.position || '',
          teamName: (p.team as any)?.short_name || '',
          teamLogo: (p.team as any)?.logo_url || '',
          assists: p.total_assists ?? 0,
        }))
        .sort((a, b) => b.assists - a.assists);
      setAssisters(sorted);
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

        <SectionHeader title="Assistencias" icon={Users} variant="page" />

        {loading ? (
          <RankingSkeleton rows={10} />
        ) : assisters.length === 0 ? (
          <p className="text-center text-muted-foreground py-12 text-sm">Nenhuma assistencia registrada</p>
        ) : (
          <>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              {assisters.map((a, idx) => {
                const pos = idx + 1;
                const isMedal = pos <= 3;
                const isLocked = !isPremium && idx >= FREE_VISIBLE;

                return (
                  <button
                    key={a.playerId}
                    onClick={() => { if (!isLocked) navigate(`/jogador/${a.playerId}`); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                      idx < assisters.length - 1 ? 'border-b border-border' : ''
                    } ${isLocked ? 'cursor-default' : 'hover:bg-muted'}`}
                  >
                    <span className={`w-6 text-center text-sm font-bold ${isMedal ? 'text-blue-600' : 'text-subtle'}`}
                      style={{ fontFamily: 'var(--font-mono)' }}>
                      {pos}
                    </span>
                    {isLocked ? (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    ) : a.playerPhoto ? (
                      <img
                        src={photoUrl(a.playerPhoto, 36)}
                        alt={a.playerName}
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
                        <TeamLogo url={a.teamLogo} name={a.teamName} />
                      )}
                      <div className="min-w-0">
                        <p className={`text-sm truncate text-left ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                          {isLocked ? redact(a.playerName, 'name') : a.playerName}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {isLocked
                            ? `${redact(a.teamName, 'name')} · ${getPositionLabel(a.playerPosition)}`
                            : `${a.teamName} · ${getPositionLabel(a.playerPosition)} · #${a.playerNumber}`
                          }
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-lg font-bold ${isLocked ? 'text-muted-foreground' : 'text-blue-600'}`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    >
                      {isLocked ? redact(a.assists, 'number') : a.assists}
                    </span>
                  </button>
                );
              })}
            </div>

            <UnlockBanner
              label="Revelar assistencias completas"
              hiddenCount={Math.max(0, assisters.length - FREE_VISIBLE)}
            />
          </>
        )}

        <ShareButton
          text={assisters.length > 0 ? `Garcons do 26ª Regional Certel/Sicredi 2025\n\n${assisters.slice(0, 3).map((p, i) => `${i + 1}. ${p.playerName} (${p.teamName}) - ${p.assists} assist.`).join('\n')}\n\nConfira o ranking completo no Power Sports!` : ''}
          url="https://power.jornalfv.com.br/assistencias"
          title="Assistencias"
          label="Compartilhar assistencias"
          variant="pill"
          className="mt-4 w-full"
        />
      </div>
    </PageTransition>
  );
}
