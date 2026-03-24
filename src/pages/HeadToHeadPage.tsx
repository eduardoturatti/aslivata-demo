import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft, Swords, Trophy, Target, Shield, TrendingUp, Calendar, MapPin, User, Star, CircleDot, ChevronDown, ChevronUp, Zap, Crosshair } from 'lucide-react';
import {
  fetchTeams, fetchMatches, fetchAllEvents, fetchPlayersByTeam,
  calculateStandings,
  type Team, type Match, type MatchEvent, type Player,
  formatEventTime,
} from '../lib/public-supabase';
import { PremiumPageGate } from '../components/public/PremiumGate';
import { SectionHeader } from '../components/public/SectionHeader';
import { HeadToHeadSkeleton } from '../components/public/Skeletons';
import { PageTransition } from '../components/public/PageTransition';

import { logoUrl, photoUrl } from '../lib/image-utils';
import { ShareButton } from '../components/public/ShareButton';

// ============================
// HELPERS
// ============================

function TeamLogo({ url, name, size = 32 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!url || err) return (
    <div className="rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0" style={{ width: size, height: size, fontFamily: 'var(--font-heading)', fontSize: size * 0.3 }}>
      {name.slice(0, 2)}
    </div>
  );
  return <img src={logoUrl(url, size)} alt={name} width={size} height={size} loading="lazy" decoding="async" onError={() => setErr(true)} className="object-contain shrink-0" />;
}

function CompareBar({ label, home, away, homeColor, awayColor, suffix = '', isHigherBetter = true }: {
  label: string; home: number; away: number; homeColor: string; awayColor: string; suffix?: string; isHigherBetter?: boolean;
}) {
  // Handle negative values (e.g. saldo de gols) by normalizing to positive range
  const minVal = Math.min(home, away);
  const normHome = minVal < 0 ? home - minVal : home;
  const normAway = minVal < 0 ? away - minVal : away;
  const total = normHome + normAway;
  const homePct = total > 0 ? (normHome / total) * 100 : 50;
  const homeWins = isHigherBetter ? home > away : home < away;
  const awayWins = isHigherBetter ? away > home : away < home;
  const tied = home === away;
  const fmtVal = (v: number) => (minVal < 0 && v > 0 ? `+${v}` : `${v}`);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className={`text-sm font-bold ${homeWins ? 'text-foreground' : tied ? 'text-muted-foreground' : 'text-muted-foreground/60'}`} style={{ fontFamily: 'var(--font-mono)' }}>
          {fmtVal(home)}{suffix}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{label}</span>
        <span className={`text-sm font-bold ${awayWins ? 'text-foreground' : tied ? 'text-muted-foreground' : 'text-muted-foreground/60'}`} style={{ fontFamily: 'var(--font-mono)' }}>
          {fmtVal(away)}{suffix}
        </span>
      </div>
      <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary gap-0.5">
        <div className="rounded-full transition-all duration-700" style={{ width: `${homePct}%`, backgroundColor: homeColor, opacity: homeWins ? 1 : tied ? 0.6 : 0.35 }} />
        <div className="rounded-full transition-all duration-700" style={{ width: `${100 - homePct}%`, backgroundColor: awayColor, opacity: awayWins ? 1 : tied ? 0.6 : 0.35 }} />
      </div>
    </div>
  );
}

function StatBadge({ value, label, icon: Icon }: { value: string | number; label: string; icon?: React.ElementType }) {
  return (
    <div className="bg-secondary/60 rounded-xl px-3 py-2.5 text-center flex-1 min-w-0">
      {Icon && <Icon className="w-3.5 h-3.5 text-muted-foreground mx-auto mb-1" />}
      <div className="text-lg font-extrabold text-foreground leading-none" style={{ fontFamily: 'var(--font-mono)' }}>{value}</div>
      <div className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{label}</div>
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, collapsible = false, defaultOpen = true }: {
  title: string; icon: React.ElementType; children: React.ReactNode; collapsible?: boolean; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={collapsible ? () => setOpen(!open) : undefined}
        className={`w-full flex items-center gap-2 px-4 py-3 ${collapsible ? 'cursor-pointer hover:bg-secondary/30 transition-colors' : 'cursor-default'}`}
      >
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex-1 text-left" style={{ fontFamily: 'var(--font-heading)' }}>{title}</span>
        {collapsible && (open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />)}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = { W: 'bg-green-500/20 text-green-400 border-green-500/30', D: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', L: 'bg-red-500/20 text-red-400 border-red-500/30' };
  const labels = { W: 'V', D: 'E', L: 'D' };
  return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-[11px] font-bold border ${colors[result]}`} style={{ fontFamily: 'var(--font-mono)' }}>{labels[result]}</span>;
}

function MatchRow({ m, teamAId, teamBId, tA, tB, events }: {
  m: Match; teamAId: string; teamBId: string; tA: Team; tB: Team; events: MatchEvent[];
}) {
  const isHome = m.home_team_id === teamAId;
  const homeTeam = isHome ? tA : tB;
  const awayTeam = isHome ? tB : tA;
  const matchEvents = events.filter(e => e.match_id === m.id);
  const goals = matchEvents.filter(e => e.event_type === 'goal' || e.event_type === 'penalty_goal');
  const cards = matchEvents.filter(e => e.event_type === 'yellow_card' || e.event_type === 'red_card');
  const date = new Date(m.match_date);
  const finished = m.status === 'finished';

  return (
    <div className="bg-secondary/40 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span className="font-semibold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>{m.round_name || `Rodada ${m.round_number}`}</span>
        <span style={{ fontFamily: 'var(--font-mono)' }}>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <TeamLogo url={homeTeam.logo_url} name={homeTeam.short_name} size={24} />
          <span className="text-xs font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>{homeTeam.short_name}</span>
        </div>
        {finished ? (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-background/60 rounded-lg">
            <span className="text-base font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{m.score_home}</span>
            <span className="text-[10px] text-muted-foreground">x</span>
            <span className="text-base font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{m.score_away}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground font-semibold px-2 py-1 bg-background/60 rounded-lg">{date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        )}
        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
          <span className="text-xs font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>{awayTeam.short_name}</span>
          <TeamLogo url={awayTeam.logo_url} name={awayTeam.short_name} size={24} />
        </div>
      </div>
      {finished && goals.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {goals.map((g, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background/40 rounded-md px-1.5 py-0.5">
              <CircleDot className="w-2.5 h-2.5 text-green-400" />
              <span className="font-medium">{g.player?.name?.split(' ').slice(-1)[0] || '?'}</span>
              {g.minute > 0 && <span style={{ fontFamily: 'var(--font-mono)' }}>{g.minute}'</span>}
            </span>
          ))}
        </div>
      )}
      {finished && cards.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {cards.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] text-muted-foreground bg-background/40 rounded-md px-1.5 py-0.5">
              <span className={`w-2 h-3 rounded-[1px] ${c.event_type === 'red_card' ? 'bg-red-500' : 'bg-yellow-400'}`} />
              <span className="font-medium">{c.player?.name?.split(' ').slice(-1)[0] || '?'}</span>
              {c.minute > 0 && <span style={{ fontFamily: 'var(--font-mono)' }}>{c.minute}'</span>}
            </span>
          ))}
        </div>
      )}
      {m.location && (
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          <MapPin className="w-2.5 h-2.5" />
          <span>{m.location}</span>
        </div>
      )}
    </div>
  );
}

function TopPlayerCard({ player, stat, statLabel, team }: { player: { name: string; photo_url?: string }; stat: number; statLabel: string; team: Team }) {
  const [err, setErr] = useState(false);
  const lastName = player.name.split(' ').slice(-1)[0];
  return (
    <div className="flex items-center gap-2 bg-secondary/40 rounded-lg px-2.5 py-2 min-w-0">
      {player.photo_url && !err ? (
        <img src={photoUrl(player.photo_url, 32)} alt={player.name} onError={() => setErr(true)} className="w-8 h-8 rounded-full object-cover shrink-0 border-2" style={{ borderColor: team.color || '#22c55e' }} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground shrink-0" style={{ fontFamily: 'var(--font-heading)' }}>{player.name.slice(0, 2)}</div>
      )}
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-foreground truncate" style={{ fontFamily: 'var(--font-heading)' }}>{lastName}</div>
        <div className="text-[10px] text-muted-foreground">{stat} {statLabel}</div>
      </div>
    </div>
  );
}

// ============================
// MAIN PAGE
// ============================

export function HeadToHeadPage() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [playersA, setPlayersA] = useState<Player[]>([]);
  const [playersB, setPlayersB] = useState<Player[]>([]);
  const [teamA, setTeamA] = useState('');
  const [teamB, setTeamB] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    Promise.all([fetchTeams(), fetchMatches(), fetchAllEvents()]).then(([t, m, e]) => {
      setTeams(t); setMatches(m); setEvents(e); setLoading(false);
    });
  }, []);

  // Fetch players when teams change
  useEffect(() => {
    if (!teamA || !teamB) { setPlayersA([]); setPlayersB([]); return; }
    setLoadingPlayers(true);
    Promise.all([fetchPlayersByTeam(teamA), fetchPlayersByTeam(teamB)]).then(([pA, pB]) => {
      setPlayersA(pA); setPlayersB(pB); setLoadingPlayers(false);
    });
  }, [teamA, teamB]);

  const tA = teams.find(t => t.id === teamA);
  const tB = teams.find(t => t.id === teamB);
  const colorA = tA?.color || '#22c55e';
  const colorB = tB?.color || '#3b82f6';

  // All H2H matches between the two teams
  const h2hMatches = useMemo(() =>
    matches.filter(m =>
      (m.home_team_id === teamA && m.away_team_id === teamB) ||
      (m.home_team_id === teamB && m.away_team_id === teamA)
    ).sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()),
    [matches, teamA, teamB]
  );

  const finishedH2H = h2hMatches.filter(m => m.status === 'finished');
  const upcomingH2H = h2hMatches.filter(m => m.status !== 'finished');

  // H2H aggregate stats
  const h2hStats = useMemo(() => {
    let winsA = 0, winsB = 0, draws = 0, goalsA = 0, goalsB = 0;
    finishedH2H.forEach(m => {
      const isAHome = m.home_team_id === teamA;
      const gA = isAHome ? (m.score_home || 0) : (m.score_away || 0);
      const gB = isAHome ? (m.score_away || 0) : (m.score_home || 0);
      goalsA += gA; goalsB += gB;
      if (gA > gB) winsA++; else if (gB > gA) winsB++; else draws++;
    });
    return { winsA, winsB, draws, goalsA, goalsB, total: finishedH2H.length };
  }, [finishedH2H, teamA]);

  // Full season stats per team
  const getTeamStats = (tid: string) => {
    const teamMatches = matches.filter(m => m.status === 'finished' && (m.home_team_id === tid || m.away_team_id === tid));
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0, cleanSheets = 0;
    let biggestWin = 0, homeWins = 0, awayWins = 0;
    const form: ('W' | 'D' | 'L')[] = [];

    teamMatches.sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()).forEach(m => {
      const isHome = m.home_team_id === tid;
      const gf = isHome ? (m.score_home || 0) : (m.score_away || 0);
      const ga = isHome ? (m.score_away || 0) : (m.score_home || 0);
      goalsFor += gf; goalsAgainst += ga;
      if (ga === 0) cleanSheets++;
      const diff = gf - ga;
      if (diff > biggestWin) biggestWin = diff;
      if (gf > ga) { wins++; form.push('W'); if (isHome) homeWins++; else awayWins++; }
      else if (gf < ga) { losses++; form.push('L'); }
      else { draws++; form.push('D'); }
    });

    const yellows = events.filter(e => e.team_id === tid && e.event_type === 'yellow_card').length;
    const reds = events.filter(e => e.team_id === tid && e.event_type === 'red_card').length;
    const goals1H = events.filter(e => e.team_id === tid && (e.event_type === 'goal' || e.event_type === 'penalty_goal') && e.minute > 0 && e.minute <= 45).length;
    const goals2H = events.filter(e => e.team_id === tid && (e.event_type === 'goal' || e.event_type === 'penalty_goal') && e.minute > 45).length;
    const played = teamMatches.length;
    const avgGoals = played > 0 ? (goalsFor / played).toFixed(1) : '0.0';
    const avgConceded = played > 0 ? (goalsAgainst / played).toFixed(1) : '0.0';
    const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;

    return { wins, draws, losses, goalsFor, goalsAgainst, yellows, reds, played, cleanSheets, biggestWin, homeWins, awayWins, form: form.slice(-5), goals1H, goals2H, avgGoals, avgConceded, winRate };
  };

  const statsA = teamA ? getTeamStats(teamA) : null;
  const statsB = teamB ? getTeamStats(teamB) : null;

  // Standings position
  const standings = useMemo(() => calculateStandings(matches, teams, events), [matches, teams, events]);
  const posA = standings.findIndex(s => s.team.id === teamA) + 1;
  const posB = standings.findIndex(s => s.team.id === teamB) + 1;
  const teamStandingA = standings.find(s => s.team.id === teamA);
  const teamStandingB = standings.find(s => s.team.id === teamB);

  // Top scorers per team (from events)
  const getTopScorers = (tid: string, limit = 3) => {
    const goalEvents = events.filter(e => e.team_id === tid && (e.event_type === 'goal' || e.event_type === 'penalty_goal') && e.player_id);
    const map = new Map<string, { name: string; photo_url?: string; count: number }>();
    goalEvents.forEach(e => {
      const existing = map.get(e.player_id);
      if (existing) { existing.count++; }
      else { map.set(e.player_id, { name: e.player?.name || '?', photo_url: e.player?.photo_url, count: 1 }); }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, limit);
  };

  // Top assist providers per team (from events)
  const getTopAssisters = (tid: string, limit = 3) => {
    const assistEvents = events.filter(e => e.team_id === tid && e.event_type === 'assist' && e.player_id);
    const map = new Map<string, { name: string; photo_url?: string; count: number }>();
    assistEvents.forEach(e => {
      const existing = map.get(e.player_id);
      if (existing) { existing.count++; }
      else { map.set(e.player_id, { name: e.player?.name || '?', photo_url: e.player?.photo_url, count: 1 }); }
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, limit);
  };

  // Most carded players per team
  const getTopCarded = (tid: string, limit = 3) => {
    const cardEvents = events.filter(e => e.team_id === tid && (e.event_type === 'yellow_card' || e.event_type === 'red_card') && e.player_id);
    const map = new Map<string, { name: string; photo_url?: string; yellows: number; reds: number }>();
    cardEvents.forEach(e => {
      const existing = map.get(e.player_id) || { name: e.player?.name || '?', photo_url: e.player?.photo_url, yellows: 0, reds: 0 };
      if (e.event_type === 'yellow_card') existing.yellows++; else existing.reds++;
      map.set(e.player_id, existing);
    });
    return Array.from(map.values()).sort((a, b) => (b.yellows + b.reds * 3) - (a.yellows + a.reds * 3)).slice(0, limit);
  };

  // Common opponents comparison
  const getCommonOpponents = () => {
    if (!teamA || !teamB) return [];
    const getOpponentResults = (tid: string) => {
      const results = new Map<string, { gf: number; ga: number; w: number; d: number; l: number }>();
      matches.filter(m => m.status === 'finished' && (m.home_team_id === tid || m.away_team_id === tid)).forEach(m => {
        const isHome = m.home_team_id === tid;
        const oppId = isHome ? m.away_team_id : m.home_team_id;
        if (oppId === teamA || oppId === teamB) return; // skip h2h
        const gf = isHome ? (m.score_home || 0) : (m.score_away || 0);
        const ga = isHome ? (m.score_away || 0) : (m.score_home || 0);
        const existing = results.get(oppId) || { gf: 0, ga: 0, w: 0, d: 0, l: 0 };
        existing.gf += gf; existing.ga += ga;
        if (gf > ga) existing.w++; else if (gf < ga) existing.l++; else existing.d++;
        results.set(oppId, existing);
      });
      return results;
    };

    const resA = getOpponentResults(teamA);
    const resB = getOpponentResults(teamB);
    const commonIds = [...resA.keys()].filter(id => resB.has(id));

    return commonIds.map(id => {
      const opp = teams.find(t => t.id === id);
      return { team: opp, resultA: resA.get(id)!, resultB: resB.get(id)! };
    }).filter(x => x.team);
  };

  const scorersA = tA ? getTopScorers(teamA) : [];
  const scorersB = tB ? getTopScorers(teamB) : [];
  const assistsA = tA ? getTopAssisters(teamA) : [];
  const assistsB = tB ? getTopAssisters(teamB) : [];
  const cardedA = tA ? getTopCarded(teamA) : [];
  const cardedB = tB ? getTopCarded(teamB) : [];
  const commonOpponents = tA && tB ? getCommonOpponents() : [];

  return (
    <PremiumPageGate>
      <PageTransition>
        <div className="px-4 py-4 pb-24">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <SectionHeader title="Mano a Mano" icon={Swords} variant="page" />

          {loading ? (<HeadToHeadSkeleton />) : (
            <>
              {/* Team Selectors */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Time 1</label>
                  <select value={teamA} onChange={e => setTeamA(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground appearance-none" style={{ fontFamily: 'var(--font-heading)' }}>
                    <option value="">Selecione</option>
                    {teams.filter(t => t.id !== teamB).map(t => (<option key={t.id} value={t.id}>{t.short_name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground mb-1 block uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Time 2</label>
                  <select value={teamB} onChange={e => setTeamB(e.target.value)} className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground appearance-none" style={{ fontFamily: 'var(--font-heading)' }}>
                    <option value="">Selecione</option>
                    {teams.filter(t => t.id !== teamA).map(t => (<option key={t.id} value={t.id}>{t.short_name}</option>))}
                  </select>
                </div>
              </div>

              {tA && tB && statsA && statsB ? (
                <div className="space-y-4">

                  {/* ===== HEADER: Team crests + position ===== */}
                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <TeamLogo url={tA.logo_url} name={tA.short_name} size={56} />
                        <span className="text-xs font-bold text-foreground text-center" style={{ fontFamily: 'var(--font-heading)' }}>{tA.short_name}</span>
                        {posA > 0 && <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 bg-secondary rounded-full" style={{ fontFamily: 'var(--font-mono)' }}>{posA}º lugar</span>}
                      </div>
                      <div className="flex flex-col items-center gap-1 px-3">
                        <Swords className="w-7 h-7 text-subtle" />
                        <span className="text-[9px] text-muted-foreground uppercase font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>VS</span>
                      </div>
                      <div className="flex flex-col items-center gap-2 flex-1">
                        <TeamLogo url={tB.logo_url} name={tB.short_name} size={56} />
                        <span className="text-xs font-bold text-foreground text-center" style={{ fontFamily: 'var(--font-heading)' }}>{tB.short_name}</span>
                        {posB > 0 && <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 bg-secondary rounded-full" style={{ fontFamily: 'var(--font-mono)' }}>{posB}º lugar</span>}
                      </div>
                    </div>

                    {/* Quick team info row */}
                    <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-border">
                      <div className="space-y-1.5">
                        {tA.coach && <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><User className="w-3 h-3 shrink-0" /><span className="truncate">{tA.coach}</span></div>}
                        {tA.stadium && <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{tA.stadium}</span></div>}
                        {tA.default_tactic && <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><Shield className="w-3 h-3 shrink-0" /><span>{tA.default_tactic}</span></div>}
                      </div>
                      <div className="space-y-1.5 text-right">
                        {tB.coach && <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground justify-end"><span className="truncate">{tB.coach}</span><User className="w-3 h-3 shrink-0" /></div>}
                        {tB.stadium && <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground justify-end"><span className="truncate">{tB.stadium}</span><MapPin className="w-3 h-3 shrink-0" /></div>}
                        {tB.default_tactic && <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground justify-end"><span>{tB.default_tactic}</span><Shield className="w-3 h-3 shrink-0" /></div>}
                      </div>
                    </div>
                  </div>

                  {/* ===== SEASON FORM ===== */}
                  <div className="bg-card rounded-xl border border-border p-4">
                    <div className="text-[10px] text-muted-foreground text-center uppercase font-semibold mb-3" style={{ fontFamily: 'var(--font-heading)' }}>Forma Recente (5 jogos)</div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-1">{statsA.form.map((r, i) => <FormBadge key={`a-${i}`} result={r} />)}</div>
                      <div className="flex gap-1">{statsB.form.map((r, i) => <FormBadge key={`b-${i}`} result={r} />)}</div>
                    </div>
                  </div>

                  {/* ===== CONFRONTO DIRETO ===== */}
                  {finishedH2H.length > 0 && (
                    <SectionCard title="Confronto Direto" icon={Swords} defaultOpen={true}>
                      {/* Summary */}
                      <div className="flex items-center justify-around text-center py-2">
                        <div>
                          <div className="text-2xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)', color: h2hStats.winsA > h2hStats.winsB ? colorA : undefined }}>{h2hStats.winsA}</div>
                          <div className="text-[9px] text-muted-foreground uppercase font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Vit. {tA.short_name}</div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{h2hStats.draws}</div>
                          <div className="text-[9px] text-muted-foreground uppercase font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Empates</div>
                        </div>
                        <div>
                          <div className="text-2xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)', color: h2hStats.winsB > h2hStats.winsA ? colorB : undefined }}>{h2hStats.winsB}</div>
                          <div className="text-[9px] text-muted-foreground uppercase font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Vit. {tB.short_name}</div>
                        </div>
                      </div>
                      <CompareBar label="Gols no confronto" home={h2hStats.goalsA} away={h2hStats.goalsB} homeColor={colorA} awayColor={colorB} />
                      {/* Match list */}
                      <div className="space-y-2 pt-1">
                        {h2hMatches.map(m => (
                          <MatchRow key={m.id} m={m} teamAId={teamA} teamBId={teamB} tA={tA} tB={tB} events={events} />
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {upcomingH2H.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-[10px] uppercase font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>Próximo confronto</span>
                      </div>
                      {upcomingH2H.map(m => (
                        <MatchRow key={m.id} m={m} teamAId={teamA} teamBId={teamB} tA={tA} tB={tB} events={events} />
                      ))}
                    </div>
                  )}

                  {/* ===== STATS COMPARISON ===== */}
                  <SectionCard title="Desempenho no Campeonato" icon={TrendingUp} defaultOpen={true}>
                    {/* Quick stat badges */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <StatBadge value={teamStandingA?.points ?? '-'} label="Pontos" icon={Trophy} />
                          <StatBadge value={`${statsA.winRate}%`} label="Aprov." icon={Zap} />
                        </div>
                        <div className="flex gap-2">
                          <StatBadge value={statsA.avgGoals} label="Gols/jogo" icon={Target} />
                          <StatBadge value={statsA.cleanSheets} label="SG" icon={Shield} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <StatBadge value={teamStandingB?.points ?? '-'} label="Pontos" icon={Trophy} />
                          <StatBadge value={`${statsB.winRate}%`} label="Aprov." icon={Zap} />
                        </div>
                        <div className="flex gap-2">
                          <StatBadge value={statsB.avgGoals} label="Gols/jogo" icon={Target} />
                          <StatBadge value={statsB.cleanSheets} label="SG" icon={Shield} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <CompareBar label="Vitórias" home={statsA.wins} away={statsB.wins} homeColor={colorA} awayColor={colorB} />
                      <CompareBar label="Empates" home={statsA.draws} away={statsB.draws} homeColor={colorA} awayColor={colorB} />
                      <CompareBar label="Derrotas" home={statsA.losses} away={statsB.losses} homeColor={colorA} awayColor={colorB} isHigherBetter={false} />
                      <CompareBar label="Gols Feitos" home={statsA.goalsFor} away={statsB.goalsFor} homeColor={colorA} awayColor={colorB} />
                      <CompareBar label="Gols Sofridos" home={statsA.goalsAgainst} away={statsB.goalsAgainst} homeColor={colorA} awayColor={colorB} isHigherBetter={false} />
                      <CompareBar label="Saldo de Gols" home={statsA.goalsFor - statsA.goalsAgainst} away={statsB.goalsFor - statsB.goalsAgainst} homeColor={colorA} awayColor={colorB} />
                      <CompareBar label="Vitórias em casa" home={statsA.homeWins} away={statsB.homeWins} homeColor={colorA} awayColor={colorB} />
                      <CompareBar label="Vitórias fora" home={statsA.awayWins} away={statsB.awayWins} homeColor={colorA} awayColor={colorB} />
                      <CompareBar label="Maior goleada" home={statsA.biggestWin} away={statsB.biggestWin} homeColor={colorA} awayColor={colorB} suffix=" gols" />
                    </div>
                  </SectionCard>

                  {/* ===== GOALS DISTRIBUTION ===== */}
                  <SectionCard title="Gols por Tempo" icon={CircleDot} defaultOpen={true}>
                    <CompareBar label="1º Tempo" home={statsA.goals1H} away={statsB.goals1H} homeColor={colorA} awayColor={colorB} />
                    <CompareBar label="2º Tempo" home={statsA.goals2H} away={statsB.goals2H} homeColor={colorA} awayColor={colorB} />
                    <CompareBar label="Média sofridos/jogo" home={parseFloat(statsA.avgConceded)} away={parseFloat(statsB.avgConceded)} homeColor={colorA} awayColor={colorB} isHigherBetter={false} />
                  </SectionCard>

                  {/* ===== DISCIPLINE ===== */}
                  <SectionCard title="Disciplina" icon={Shield} defaultOpen={true}>
                    <CompareBar label="Cartões Amarelos" home={statsA.yellows} away={statsB.yellows} homeColor="#eab308" awayColor="#eab308" isHigherBetter={false} />
                    <CompareBar label="Cartões Vermelhos" home={statsA.reds} away={statsB.reds} homeColor="#ef4444" awayColor="#ef4444" isHigherBetter={false} />
                    <CompareBar label="Pontos Disciplinares" home={statsA.yellows * 10 + statsA.reds * 50} away={statsB.yellows * 10 + statsB.reds * 50} homeColor={colorA} awayColor={colorB} isHigherBetter={false} />

                    {(cardedA.length > 0 || cardedB.length > 0) && (
                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div className="space-y-1.5">
                          <div className="text-[9px] text-muted-foreground uppercase font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Mais advertidos</div>
                          {cardedA.map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px]">
                              <span className="text-foreground font-medium truncate">{p.name.split(' ').slice(-1)[0]}</span>
                              {p.yellows > 0 && <span className="flex items-center gap-0.5"><span className="w-2 h-3 rounded-[1px] bg-yellow-400 inline-block" /><span className="text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{p.yellows}</span></span>}
                              {p.reds > 0 && <span className="flex items-center gap-0.5"><span className="w-2 h-3 rounded-[1px] bg-red-500 inline-block" /><span className="text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{p.reds}</span></span>}
                            </div>
                          ))}
                        </div>
                        <div className="space-y-1.5 text-right">
                          <div className="text-[9px] text-muted-foreground uppercase font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Mais advertidos</div>
                          {cardedB.map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-[10px] justify-end">
                              {p.reds > 0 && <span className="flex items-center gap-0.5"><span className="text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{p.reds}</span><span className="w-2 h-3 rounded-[1px] bg-red-500 inline-block" /></span>}
                              {p.yellows > 0 && <span className="flex items-center gap-0.5"><span className="text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{p.yellows}</span><span className="w-2 h-3 rounded-[1px] bg-yellow-400 inline-block" /></span>}
                              <span className="text-foreground font-medium truncate">{p.name.split(' ').slice(-1)[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </SectionCard>

                  {/* ===== TOP SCORERS ===== */}
                  {(scorersA.length > 0 || scorersB.length > 0) && (
                    <SectionCard title="Artilheiros" icon={Crosshair} defaultOpen={true}>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          {scorersA.length > 0 ? scorersA.map((s, i) => (
                            <TopPlayerCard key={i} player={s} stat={s.count} statLabel={s.count === 1 ? 'gol' : 'gols'} team={tA} />
                          )) : <p className="text-[10px] text-muted-foreground">Sem gols</p>}
                        </div>
                        <div className="space-y-2">
                          {scorersB.length > 0 ? scorersB.map((s, i) => (
                            <TopPlayerCard key={i} player={s} stat={s.count} statLabel={s.count === 1 ? 'gol' : 'gols'} team={tB} />
                          )) : <p className="text-[10px] text-muted-foreground">Sem gols</p>}
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  {/* ===== TOP ASSISTS ===== */}
                  {(assistsA.length > 0 || assistsB.length > 0) && (
                    <SectionCard title="Garçons" icon={Star} defaultOpen={false} collapsible>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          {assistsA.length > 0 ? assistsA.map((s, i) => (
                            <TopPlayerCard key={i} player={s} stat={s.count} statLabel={s.count === 1 ? 'assist.' : 'assist.'} team={tA} />
                          )) : <p className="text-[10px] text-muted-foreground">Sem assistências</p>}
                        </div>
                        <div className="space-y-2">
                          {assistsB.length > 0 ? assistsB.map((s, i) => (
                            <TopPlayerCard key={i} player={s} stat={s.count} statLabel={s.count === 1 ? 'assist.' : 'assist.'} team={tB} />
                          )) : <p className="text-[10px] text-muted-foreground">Sem assistências</p>}
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  {/* ===== SQUAD SIZE ===== */}
                  {(playersA.length > 0 || playersB.length > 0) && !loadingPlayers && (
                    <SectionCard title="Elenco" icon={User} defaultOpen={false} collapsible>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <StatBadge value={playersA.length} label="Jogadores" />
                          <div className="grid grid-cols-2 gap-1.5">
                            <StatBadge value={playersA.filter(p => /goleiro|gk/i.test(p.position)).length} label="GOL" />
                            <StatBadge value={playersA.filter(p => /zagueiro|lateral|defens/i.test(p.position)).length} label="DEF" />
                            <StatBadge value={playersA.filter(p => /meia|meio|volante/i.test(p.position)).length} label="MEI" />
                            <StatBadge value={playersA.filter(p => /atacante|ponta|centroavante/i.test(p.position)).length} label="ATA" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <StatBadge value={playersB.length} label="Jogadores" />
                          <div className="grid grid-cols-2 gap-1.5">
                            <StatBadge value={playersB.filter(p => /goleiro|gk/i.test(p.position)).length} label="GOL" />
                            <StatBadge value={playersB.filter(p => /zagueiro|lateral|defens/i.test(p.position)).length} label="DEF" />
                            <StatBadge value={playersB.filter(p => /meia|meio|volante/i.test(p.position)).length} label="MEI" />
                            <StatBadge value={playersB.filter(p => /atacante|ponta|centroavante/i.test(p.position)).length} label="ATA" />
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  )}

                  {/* ===== COMMON OPPONENTS ===== */}
                  {commonOpponents.length > 0 && (
                    <SectionCard title="Adversários em Comum" icon={Target} defaultOpen={false} collapsible>
                      <div className="space-y-2">
                        {commonOpponents.map(({ team: opp, resultA: rA, resultB: rB }) => (
                          <div key={opp!.id} className="bg-secondary/40 rounded-lg p-2.5">
                            <div className="flex items-center gap-2 mb-2">
                              <TeamLogo url={opp!.logo_url} name={opp!.short_name} size={20} />
                              <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{opp!.short_name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="text-[10px]">
                                <span className="text-muted-foreground">{tA.short_name}: </span>
                                <span className="font-bold" style={{ fontFamily: 'var(--font-mono)', color: colorA }}>
                                  {rA.gf}-{rA.ga}
                                </span>
                                <span className="text-muted-foreground ml-1">({rA.w > 0 ? 'V' : rA.d > 0 ? 'E' : 'D'})</span>
                              </div>
                              <div className="text-[10px] text-right">
                                <span className="text-muted-foreground">{tB.short_name}: </span>
                                <span className="font-bold" style={{ fontFamily: 'var(--font-mono)', color: colorB }}>
                                  {rB.gf}-{rB.ga}
                                </span>
                                <span className="text-muted-foreground ml-1">({rB.w > 0 ? 'V' : rB.d > 0 ? 'E' : 'D'})</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </SectionCard>
                  )}

                  {/* Share comparison */}
                  <ShareButton
                    text={`${tA.name} vs ${tB.name} - Mano a Mano\n26ª Regional Certel/Sicredi 2025\n\nConfira a comparacao completa no Power Sports!`}
                    url="https://power.jornalfv.com.br/confronto"
                    title={`${tA.short_name} vs ${tB.short_name}`}
                    label="Compartilhar confronto"
                    variant="pill"
                    className="w-full"
                  />

                </div>
              ) : (
                <div className="text-center py-16">
                  <Swords className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm">Selecione dois times para comparar</p>
                  <p className="text-muted-foreground/60 text-xs mt-1">Escolha acima para ver o confronto completo</p>
                </div>
              )}
            </>
          )}
        </div>
      </PageTransition>
    </PremiumPageGate>
  );
}