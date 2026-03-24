import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { fetchMatches, fetchTeams, buildStandingsFromTeams, type StandingRow } from '../lib/public-supabase';
import { logoUrl } from '../lib/image-utils';
import { PageTransition } from '../components/public/PageTransition';
import { SectionHeader } from '../components/public/SectionHeader';
import { StandingsSkeleton } from '../components/public/Skeletons';
import { BarChart3 } from 'lucide-react';
import { ShareButton } from '../components/public/ShareButton';

const GRID_COLS = 'grid-cols-[16px_1fr_22px_18px_18px_18px_18px_24px_20px_24px_42px]';

function FormDots({ form }: { form: ('W' | 'D' | 'L')[] }) {
  const colors = { W: 'bg-green-500', D: 'bg-yellow-500', L: 'bg-red-500' };
  return (
    <div className="flex gap-px">
      {form.map((r, i) => (
        <div key={i} className={`w-[6px] h-[6px] rounded-full ${colors[r]}`} />
      ))}
      {Array.from({ length: Math.max(0, 5 - form.length) }).map((_, i) => (
        <div key={`e-${i}`} className="w-[6px] h-[6px] rounded-full bg-muted" />
      ))}
    </div>
  );
}

function TeamLogo({ url, name }: { url?: string; name: string }) {
  const [error, setError] = useState(false);
  if (!url || error) {
    return (
      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[7px] font-bold text-foreground shrink-0"
        style={{ fontFamily: 'var(--font-heading)' }}>
        {name.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  return <img src={logoUrl(url, 20)} alt={name} width={20} height={20} loading="lazy" decoding="async" onError={() => setError(true)} className="w-5 h-5 object-contain shrink-0" />;
}

export function StandingsPage() {
  const navigate = useNavigate();
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Pure reader: teams already have pre-computed stats from admin
      // matches only needed for form (last 5 results)
      const [matchesData, teamsData] = await Promise.all([
        fetchMatches(),
        fetchTeams(),
      ]);
      const calculated = buildStandingsFromTeams(teamsData, matchesData);
      setStandings(calculated);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (<StandingsSkeleton />);
  }

  return (
    <PageTransition>
      <div className="px-3 py-4">
        <SectionHeader title="Classificação" icon={BarChart3} variant="page" />

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className={`grid ${GRID_COLS} gap-0 px-2 py-2 border-b border-border text-[9px] text-muted-foreground font-semibold`}
            style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="text-center">#</span>
            <span className="pl-1">Time</span>
            <span className="text-center">P</span>
            <span className="text-center">J</span>
            <span className="text-center">V</span>
            <span className="text-center">E</span>
            <span className="text-center">D</span>
            <span className="text-center">SG</span>
            <span className="text-center">GP</span>
            <span className="text-center">DC</span>
            <span className="text-center">Forma</span>
          </div>

          {standings.map((row, idx) => {
            const pos = idx + 1;
            const isQualified = pos <= 4;
            const isEliminated = pos >= 5;

            return (
              <div
                key={row.team.id}
                className={`grid ${GRID_COLS} gap-0 px-2 py-2 items-center transition-colors cursor-pointer hover:bg-muted active:scale-[0.99] ${
                  idx < standings.length - 1 ? 'border-b border-border' : ''
                }`}
                onClick={() => navigate(`/time/${row.team.slug || row.team.id}`)}
              >
                <span className={`text-center text-[10px] font-bold ${
                  isQualified ? 'text-primary' : isEliminated ? 'text-destructive' : 'text-muted-foreground'
                }`} style={{ fontFamily: 'var(--font-mono)' }}>
                  {pos}
                </span>

                <div className="flex items-center gap-1.5 min-w-0 pl-1">
                  <TeamLogo url={row.team.logo_url} name={row.team.short_name} />
                  <span className="text-[11px] font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>
                    {row.team.name}
                  </span>
                </div>

                <span className="text-center text-[11px] font-bold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  {row.points}
                </span>
                <span className="text-center text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  {row.played}
                </span>
                <span className="text-center text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  {row.wins}
                </span>
                <span className="text-center text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  {row.draws}
                </span>
                <span className="text-center text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  {row.losses}
                </span>
                <span className={`text-center text-[10px] font-semibold ${
                  row.goalDifference > 0 ? 'text-green-600' : row.goalDifference < 0 ? 'text-red-500' : 'text-muted-foreground'
                }`} style={{ fontFamily: 'var(--font-mono)' }}>
                  {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                </span>
                <span className="text-center text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  {row.goalsFor}
                </span>
                <span className={`text-center text-[10px] font-semibold ${
                  row.discipline > 0 ? 'text-yellow-600' : 'text-muted-foreground'
                }`} style={{ fontFamily: 'var(--font-mono)' }}>
                  {row.discipline}
                </span>
                <div className="flex justify-center">
                  <FormDots form={row.form} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 px-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-[10px] text-muted-foreground">Semifinal (1º-4º)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[10px] text-muted-foreground">Eliminado (5º-7º)</span>
          </div>
        </div>
        <div className="flex items-center gap-3 mt-2 px-1">
          <span className="text-[10px] text-muted-foreground font-medium" style={{ fontFamily: 'var(--font-heading)' }}>Forma:</span>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] text-muted-foreground">V</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-yellow-500" /><span className="text-[10px] text-muted-foreground">E</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] text-muted-foreground">D</span>
          </div>
        </div>

        <ShareButton
          text={standings.length > 0 ? `Classificação do 26ª Regional Certel/Sicredi 2025\n\n${standings.slice(0, 3).map((r, i) => `${i + 1}. ${r.team.short_name} - ${r.points} pts`).join('\n')}\n\nConfira a tabela completa no Power Sports!` : ''}
          url="https://power.jornalfv.com.br/classificacao"
          title="Classificação"
          label="Compartilhar classificação"
          variant="pill"
          className="mt-4 w-full"
        />
      </div>
    </PageTransition>
  );
}