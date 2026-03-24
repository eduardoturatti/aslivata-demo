import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { fetchTeams, fetchAllPlayers, type Team, type Player } from '../lib/public-supabase';
import { logoUrl, photoUrl } from '../lib/image-utils';
import { Shield, Search, X, User, ChevronRight } from 'lucide-react';
import { PageTransition } from '../components/public/PageTransition';
import { TeamsListSkeleton } from '../components/public/Skeletons';
import { SectionHeader } from '../components/public/SectionHeader';
import { getPositionLabel } from '../lib/galera-api';

function TeamCard({ team, onClick }: { team: Team; onClick: () => void }) {
  const [imgError, setImgError] = useState(false);
  const games = (team.total_wins || 0) + (team.total_draws || 0) + (team.total_losses || 0);

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-3 p-5 rounded-xl bg-card border border-border hover:border-primary/20 transition-all active:scale-95 relative overflow-hidden"
    >
      {/* Subtle team color accent */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ background: team.color ? `radial-gradient(circle at top right, ${team.color}, transparent 70%)` : undefined }}
      />
      <div className="relative z-10 flex flex-col items-center gap-3">
        {team.logo_url && !imgError ? (
          <img
            src={logoUrl(team.logo_url, 80)}
            alt={team.name}
            width={64}
            height={64}
            loading="lazy"
            decoding="async"
            onError={() => setImgError(true)}
            className="w-16 h-16 object-contain"
          />
        ) : (
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-lg"
            style={{ background: team.color || '#374151', fontFamily: 'var(--font-heading)' }}
          >
            {team.short_name.slice(0, 3)}
          </div>
        )}
        <div className="text-center">
          <p className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
            {team.short_name}
          </p>
          {team.coach && (
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Tec. {team.coach}
            </p>
          )}
          {games > 0 && (
            <div className="flex items-center justify-center gap-1.5 mt-1.5">
              <span className="text-[9px] text-green-600 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{team.total_wins || 0}V</span>
              <span className="text-[9px] text-muted-foreground font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{team.total_draws || 0}E</span>
              <span className="text-[9px] text-red-500 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{team.total_losses || 0}D</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

export function TeamsPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    async function load() {
      const [teamsData, playersData] = await Promise.all([
        fetchTeams(),
        fetchAllPlayers(),
      ]);
      setTeams(teamsData);
      setPlayers(playersData);
      setLoading(false);
    }
    load();
  }, []);

  // Normalize text for search (remove accents)
  const normalize = (s: string) =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  const searchResults = useMemo(() => {
    if (!search || search.length < 2) return [];
    const q = normalize(search);
    return players
      .filter(p => {
        const nameMatch = normalize(p.name).includes(q);
        const numberMatch = p.number && p.number.toString() === search.trim();
        const teamMatch = normalize((p.team as any)?.short_name || '').includes(q);
        return nameMatch || numberMatch || teamMatch;
      })
      .slice(0, 15);
  }, [search, players]);

  const showSearchResults = search.length >= 2;

  if (loading) {
    return (<TeamsListSkeleton />);
  }

  return (
    <PageTransition>
    <div className="px-4 py-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Times & Jogadores
        </h2>
        <span className="text-xs text-muted-foreground ml-auto">{teams.length} equipes</span>
      </div>

      {/* Search bar */}
      <div className="relative mb-5 z-50">
        <div className={`flex items-center gap-2 bg-card rounded-xl border px-3.5 py-2.5 transition-colors ${
          searchFocused ? 'border-primary/40 ring-2 ring-primary/10' : 'border-border'
        }`}>
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            placeholder="Buscar jogador por nome, número ou time..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search results dropdown */}
        {showSearchResults && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 max-h-[320px] overflow-y-auto">
            {searchResults.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">Nenhum jogador encontrado</p>
                <p className="text-[10px] text-muted-foreground mt-1">Tente outro nome ou número</p>
              </div>
            ) : (
              searchResults.map((p, i) => {
                const team = p.team as any;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setSearch(''); navigate(`/jogador/${p.id}`); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left ${
                      i < searchResults.length - 1 ? 'border-b border-border' : ''
                    }`}
                  >
                    {p.photo_url ? (
                      <img src={photoUrl(p.photo_url, 40)} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-foreground truncate">{p.name}</span>
                        {p.number && (
                          <span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>#{p.number}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {team?.logo_url && (
                          <img src={logoUrl(team.logo_url, 16)} alt="" className="w-3.5 h-3.5 object-contain" />
                        )}
                        <span className="text-[10px] text-muted-foreground">{team?.short_name || ''}</span>
                        <span className="text-[10px] text-muted-foreground">· {getPositionLabel(p.position)}</span>
                      </div>
                    </div>
                    {/* Quick stats */}
                    <div className="flex items-center gap-2 shrink-0">
                      {(p.total_goals || 0) > 0 && (
                        <span className="text-[9px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded" style={{ fontFamily: 'var(--font-mono)' }}>{p.total_goals}G</span>
                      )}
                      {(p.total_yellow_cards || 0) > 0 && (
                        <div className="flex items-center gap-0.5">
                          <div className="w-1.5 h-2.5 rounded-[1px] bg-yellow-400" />
                          <span className="text-[9px] text-yellow-600" style={{ fontFamily: 'var(--font-mono)' }}>{p.total_yellow_cards}</span>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Teams grid */}
      {!showSearchResults && (
        <>
          <SectionHeader title="Equipes" icon={Shield} />
          <div className="grid grid-cols-2 gap-3">
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onClick={() => navigate(`/time/${team.slug || team.id}`)}
              />
            ))}
          </div>
        </>
      )}
    </div>
    </PageTransition>
  );
}