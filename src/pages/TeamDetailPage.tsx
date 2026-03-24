import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  ArrowLeft, Calendar, MapPin, Shield, AlertTriangle, Users, Lock,
  BarChart3, Trophy, ChevronRight, ChevronDown, ChevronUp, Clock,
  Swords, TrendingUp, Target, Crosshair, Star, CircleDot, Zap,
  Home, Plane, User, Share2,
} from 'lucide-react';
import {
  fetchTeamBySlug, fetchTeamById, fetchPlayersByTeam,
  fetchMatches, fetchAllEvents, fetchTeams, calculateStandings,
  type Team, type Player, type Match, type MatchEvent, type StandingRow,
} from '../lib/public-supabase';
import { isPremium } from '../lib/premium';
import { logoUrl, photoUrl } from '../lib/image-utils';
import { PremiumModal } from '../components/public/PremiumModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { PageTransition } from '../components/public/PageTransition';
import { SectionHeader } from '../components/public/SectionHeader';
import { TeamDetailSkeleton } from '../components/public/Skeletons';
import { getPositionLabel } from '../lib/galera-api';

const GOLD = '#D4A843';

// ============================
// SHARED COMPONENTS
// ============================

function TeamLogo({ url, name, size = 48 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!url || err) return (
    <div className="rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0"
      style={{ width: size, height: size, fontFamily: 'var(--font-heading)', fontSize: size * 0.3 }}>
      {name.slice(0, 3)}
    </div>
  );
  return <img src={logoUrl(url, size)} alt={name} width={size} height={size} loading="lazy" decoding="async" onError={() => setErr(true)} className="object-contain shrink-0" />;
}

function StatBox({ value, label, color, icon }: { value: string | number; label: string; color?: string; icon?: 'yellow_card' | 'red_card' }) {
  return (
    <div className="bg-card rounded-xl border border-border p-2.5 text-center flex-1 min-w-0">
      <p className={`text-lg font-extrabold leading-none ${color || 'text-foreground'}`} style={{ fontFamily: 'var(--font-mono)' }}>{value}</p>
      {icon ? (
        <div className="flex justify-center mt-1.5">
          <div className={`w-3 h-4 rounded-[2px] ${icon === 'yellow_card' ? 'bg-yellow-400' : 'bg-red-500'}`} />
        </div>
      ) : (
        <p className="text-[9px] text-muted-foreground mt-1 uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{label}</p>
      )}
    </div>
  );
}

function FormBadge({ result }: { result: 'W' | 'D' | 'L' }) {
  const colors = { W: 'bg-green-500/20 text-green-400 border-green-500/30', D: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', L: 'bg-red-500/20 text-red-400 border-red-500/30' };
  const labels = { W: 'V', D: 'E', L: 'D' };
  return <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-[11px] font-bold border ${colors[result]}`} style={{ fontFamily: 'var(--font-mono)' }}>{labels[result]}</span>;
}

function CompareBar({ label, home, away, homeColor, awayColor, isHigherBetter = true }: {
  label: string; home: number; away: number; homeColor: string; awayColor: string; isHigherBetter?: boolean;
}) {
  const minVal = Math.min(home, away);
  const normHome = minVal < 0 ? home - minVal : home;
  const normAway = minVal < 0 ? away - minVal : away;
  const total = normHome + normAway;
  const homePct = total > 0 ? (normHome / total) * 100 : 50;
  const homeWins = isHigherBetter ? home > away : home < away;
  const awayWins = isHigherBetter ? away > home : away < home;
  const tied = home === away;
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className={`text-xs font-bold ${homeWins ? 'text-foreground' : tied ? 'text-muted-foreground' : 'text-muted-foreground/60'}`} style={{ fontFamily: 'var(--font-mono)' }}>{home}</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>{label}</span>
        <span className={`text-xs font-bold ${awayWins ? 'text-foreground' : tied ? 'text-muted-foreground' : 'text-muted-foreground/60'}`} style={{ fontFamily: 'var(--font-mono)' }}>{away}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-secondary gap-0.5">
        <div className="rounded-full transition-all duration-500" style={{ width: `${homePct}%`, backgroundColor: homeColor, opacity: homeWins ? 1 : tied ? 0.6 : 0.35 }} />
        <div className="rounded-full transition-all duration-500" style={{ width: `${100 - homePct}%`, backgroundColor: awayColor, opacity: awayWins ? 1 : tied ? 0.6 : 0.35 }} />
      </div>
    </div>
  );
}

function CollapsibleSection({ title, icon: Icon, children, defaultOpen = false, premium = false, locked = false, onLock }: {
  title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean; premium?: boolean; locked?: boolean; onLock?: () => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="bg-card rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => locked && onLock ? onLock() : setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-secondary/30 transition-colors"
      >
        <Icon className="w-4 h-4 text-primary shrink-0" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wider flex-1 text-left" style={{ fontFamily: 'var(--font-heading)' }}>{title}</span>
        {premium && locked && <Lock className="w-3.5 h-3.5 shrink-0" style={{ color: GOLD }} />}
        {premium && locked ? (
          <Trophy className="w-3.5 h-3.5 shrink-0" style={{ color: GOLD }} />
        ) : (
          open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && !locked && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </section>
  );
}

const POSITION_ORDER: Record<string, number> = {
  'Goleiro': 0, 'Zagueiro': 1, 'Lateral': 2, 'Meio-Campo': 3, 'Meio-campo': 3, 'Meia': 3, 'Volante': 3, 'meio-campo': 3, 'meio campo': 3, 'Atacante': 4,
};

// ============================
// MAIN PAGE
// ============================

export function TeamDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState<Team | null>(null);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [allEvents, setAllEvents] = useState<MatchEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumUnlocked, setPremiumUnlocked] = useState(isPremium());

  useEffect(() => {
    async function load() {
      if (!slug) return;
      let t = await fetchTeamBySlug(slug);
      if (!t) t = await fetchTeamById(slug);
      if (!t) { setLoading(false); return; }
      setTeam(t);
      const [pl, ma, ev, teams] = await Promise.all([
        fetchPlayersByTeam(t.id), fetchMatches(), fetchAllEvents(), fetchTeams()
      ]);
      setPlayers(pl);
      setAllTeams(teams);
      setAllMatches(ma);
      setAllEvents(ev);
      setMatches(ma.filter(m =>
        (m.home_team_id === t!.id || m.away_team_id === t!.id) &&
        !(m.home_team_id === m.away_team_id)
      ));
      setEvents(ev.filter(e => e.team_id === t!.id));
      setLoading(false);
    }
    load();
  }, [slug]);

  // ============================
  // COMPUTED DATA
  // ============================

  const standings = useMemo(() => calculateStandings(allMatches, allTeams, allEvents), [allMatches, allTeams, allEvents]);

  const teamStanding = useMemo(() => {
    if (!team) return null;
    const idx = standings.findIndex(s => s.team.id === team.id);
    return idx >= 0 ? { ...standings[idx], position: idx + 1 } : null;
  }, [standings, team]);

  const finishedMatches = useMemo(() =>
    matches.filter(m => m.status === 'finished').sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()),
    [matches]
  );

  const upcomingMatches = useMemo(() =>
    matches.filter(m => m.status === 'scheduled' || m.status === 'upcoming').sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime()),
    [matches]
  );

  const seasonStats = useMemo(() => {
    if (!team) return null;
    let wins = 0, draws = 0, losses = 0, goalsFor = 0, goalsAgainst = 0;
    let cleanSheets = 0, homeWins = 0, homeDraws = 0, homeLosses = 0;
    let awayWins = 0, awayDraws = 0, awayLosses = 0;
    let biggestWin = 0, biggestWinMatch: Match | null = null;
    let biggestLoss = 0, biggestLossMatch: Match | null = null;
    let homeGoalsFor = 0, homeGoalsAgainst = 0, awayGoalsFor = 0, awayGoalsAgainst = 0;
    const form: ('W' | 'D' | 'L')[] = [];
    const scorelineMap = new Map<string, number>();

    const sorted = [...finishedMatches].sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    sorted.forEach(m => {
      const isHome = m.home_team_id === team.id;
      const gf = isHome ? (m.score_home || 0) : (m.score_away || 0);
      const ga = isHome ? (m.score_away || 0) : (m.score_home || 0);
      goalsFor += gf; goalsAgainst += ga;
      if (ga === 0) cleanSheets++;
      const diff = gf - ga;
      const scoreline = `${gf}-${ga}`;
      scorelineMap.set(scoreline, (scorelineMap.get(scoreline) || 0) + 1);

      if (isHome) { homeGoalsFor += gf; homeGoalsAgainst += ga; }
      else { awayGoalsFor += gf; awayGoalsAgainst += ga; }

      if (diff > biggestWin) { biggestWin = diff; biggestWinMatch = m; }
      if (diff < -biggestLoss) { biggestLoss = -diff; biggestLossMatch = m; }

      if (gf > ga) {
        wins++; form.push('W');
        if (isHome) homeWins++; else awayWins++;
      } else if (gf < ga) {
        losses++; form.push('L');
        if (isHome) homeLosses++; else awayLosses++;
      } else {
        draws++; form.push('D');
        if (isHome) homeDraws++; else awayDraws++;
      }
    });

    const played = wins + draws + losses;
    const points = wins * 3 + draws;
    const winRate = played > 0 ? Math.round((points / (played * 3)) * 100) : 0;
    const avgGoals = played > 0 ? (goalsFor / played).toFixed(1) : '0.0';
    const avgConceded = played > 0 ? (goalsAgainst / played).toFixed(1) : '0.0';

    const goals1H = events.filter(e => (e.event_type === 'goal' || e.event_type === 'penalty_goal') && e.minute > 0 && e.minute <= 45).length;
    const goals2H = events.filter(e => (e.event_type === 'goal' || e.event_type === 'penalty_goal') && e.minute > 45).length;
    const yellows = events.filter(e => e.event_type === 'yellow_card').length;
    const reds = events.filter(e => e.event_type === 'red_card').length;
    const disciplineScore = team.discipline_points ?? (yellows * 10 + reds * 50);

    // Most common scoreline
    let topScoreline = '';
    let topScorelineCount = 0;
    scorelineMap.forEach((count, scoreline) => {
      if (count > topScorelineCount) { topScoreline = scoreline; topScorelineCount = count; }
    });

    const homePlayed = homeWins + homeDraws + homeLosses;
    const awayPlayed = awayWins + awayDraws + awayLosses;

    return {
      wins, draws, losses, goalsFor, goalsAgainst, played, points, winRate,
      avgGoals, avgConceded, cleanSheets, biggestWin, biggestWinMatch,
      biggestLoss, biggestLossMatch, form: form.slice(-5),
      goals1H, goals2H, yellows, reds, disciplineScore,
      homeWins, homeDraws, homeLosses, homePlayed, homeGoalsFor, homeGoalsAgainst,
      awayWins, awayDraws, awayLosses, awayPlayed, awayGoalsFor, awayGoalsAgainst,
      topScoreline, topScorelineCount,
    };
  }, [team, finishedMatches, events]);

  // Player stats
  const sortedPlayers = useMemo(() =>
    [...players].sort((a, b) => {
      const pa = POSITION_ORDER[a.position] ?? 5;
      const pb = POSITION_ORDER[b.position] ?? 5;
      if (pa !== pb) return pa - pb;
      return a.name.localeCompare(b.name);
    }),
    [players]
  );

  const playerStats = useMemo(() =>
    sortedPlayers.map(p => {
      const pEvents = events.filter(e => e.player_id === p.id);
      const goals = pEvents.filter(e => e.event_type === 'goal' || e.event_type === 'penalty_goal').length;
      const assists = pEvents.filter(e => e.event_type === 'assist').length;
      const yellows = pEvents.filter(e => e.event_type === 'yellow_card').length;
      const reds = pEvents.filter(e => e.event_type === 'red_card').length;
      return { player: p, goals, assists, yellows, reds };
    }),
    [sortedPlayers, events]
  );

  // Position groups — case-insensitive normalization to handle "goleiro", "meio campo", etc.
  const positionGroups = useMemo(() => {
    function normalizePos(pos: string): string {
      const p = (pos || '').toLowerCase().trim();
      if (/goleiro|gk|goalkeeper/.test(p)) return 'Goleiro';
      if (/zagueiro|zag|cb|defens/.test(p)) return 'Zagueiro';
      if (/lateral|lb|rb|ala|fullback/.test(p)) return 'Lateral';
      if (/volante|meia|meio|mid|cm|mc/.test(p)) return 'Meio-Campo';
      if (/atacante|ata|forward|striker|ponta/.test(p)) return 'Atacante';
      return '';
    }

    const posLabels = ['Goleiro', 'Zagueiro', 'Lateral', 'Meio-Campo', 'Atacante'];
    const posGroupNames: Record<string, string> = {
      'Goleiro': 'Goleiros', 'Zagueiro': 'Zagueiros', 'Lateral': 'Laterais', 'Meio-Campo': 'Meias', 'Atacante': 'Atacantes',
    };
    const groups: { label: string; stats: typeof playerStats }[] = [];
    for (const pos of posLabels) {
      const group = playerStats.filter(ps => normalizePos(ps.player.position) === pos);
      if (group.length > 0) groups.push({ label: posGroupNames[pos] || pos, stats: group });
    }
    const others = playerStats.filter(ps => !normalizePos(ps.player.position));
    if (others.length > 0) groups.push({ label: 'Outros', stats: others });
    return groups;
  }, [playerStats]);

  // Top scorers and assisters
  const topScorers = useMemo(() => playerStats.filter(p => p.goals > 0).sort((a, b) => b.goals - a.goals).slice(0, 5), [playerStats]);
  const topAssisters = useMemo(() => playerStats.filter(p => p.assists > 0).sort((a, b) => b.assists - a.assists).slice(0, 5), [playerStats]);
  const topCarded = useMemo(() => playerStats.filter(p => p.yellows > 0 || p.reds > 0).sort((a, b) => (b.yellows + b.reds * 3) - (a.yellows + a.reds * 3)).slice(0, 5), [playerStats]);

  const suspendedPlayers = players.filter(p => p.is_suspended);
  const penduradoPlayers = players.filter(p => !p.is_suspended && (p.yellow_card_accumulator ?? 0) >= 2);

  // Mini H2H for upcoming matches
  const getOpponentPreview = (match: Match) => {
    if (!team) return null;
    const oppId = match.home_team_id === team.id ? match.away_team_id : match.home_team_id;
    const oppStanding = standings.find(s => s.team.id === oppId);
    const oppPos = standings.findIndex(s => s.team.id === oppId) + 1;
    // H2H record
    const h2hFinished = finishedMatches.filter(m =>
      (m.home_team_id === team.id && m.away_team_id === oppId) ||
      (m.home_team_id === oppId && m.away_team_id === team.id)
    );
    let h2hWins = 0, h2hDraws = 0, h2hLosses = 0;
    h2hFinished.forEach(m => {
      const isHome = m.home_team_id === team.id;
      const gf = isHome ? (m.score_home || 0) : (m.score_away || 0);
      const ga = isHome ? (m.score_away || 0) : (m.score_home || 0);
      if (gf > ga) h2hWins++; else if (gf < ga) h2hLosses++; else h2hDraws++;
    });
    // Opponent form
    const oppMatches = allMatches.filter(m => m.status === 'finished' && (m.home_team_id === oppId || m.away_team_id === oppId))
      .sort((a, b) => new Date(a.match_date).getTime() - new Date(b.match_date).getTime());
    const oppForm: ('W' | 'D' | 'L')[] = [];
    oppMatches.forEach(m => {
      const isHome = m.home_team_id === oppId;
      const gf = isHome ? (m.score_home || 0) : (m.score_away || 0);
      const ga = isHome ? (m.score_away || 0) : (m.score_home || 0);
      if (gf > ga) oppForm.push('W'); else if (gf < ga) oppForm.push('L'); else oppForm.push('D');
    });
    const oppGoals = oppMatches.reduce((sum, m) => {
      const isHome = m.home_team_id === oppId;
      return sum + (isHome ? (m.score_home || 0) : (m.score_away || 0));
    }, 0);
    const oppConceded = oppMatches.reduce((sum, m) => {
      const isHome = m.home_team_id === oppId;
      return sum + (isHome ? (m.score_away || 0) : (m.score_home || 0));
    }, 0);

    return {
      standing: oppStanding, position: oppPos,
      form: oppForm.slice(-5), goals: oppGoals, conceded: oppConceded, played: oppMatches.length,
      h2h: { wins: h2hWins, draws: h2hDraws, losses: h2hLosses, total: h2hFinished.length },
    };
  };

  // ============================
  // RENDER
  // ============================

  if (loading) return <TeamDetailSkeleton />;
  if (!team) return (
    <div className="px-4 py-8 text-center">
      <p className="text-muted-foreground">Time não encontrado</p>
      <button onClick={() => navigate('/times')} className="text-primary text-sm mt-3">Voltar</button>
    </div>
  );

  const nextMatch = upcomingMatches[0];
  const nextMatchPreview = nextMatch ? getOpponentPreview(nextMatch) : null;

  return (
    <PageTransition>
      <div className="pb-24">
        {/* ===== HERO HEADER ===== */}
        <div className="relative px-4 pt-4 pb-6"
          style={{ background: `linear-gradient(135deg, ${team.color || '#1f2937'}40, ${team.color_detail || team.color || '#1f2937'}20, var(--background))` }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /><span>Voltar</span>
          </button>
          <div className="flex items-center gap-4">
            <TeamLogo url={team.logo_url} name={team.short_name} size={72} />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{team.name}</h1>
              {team.coach && <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {team.coach}</p>}
              {team.stadium && <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" /> {team.stadium}</p>}
            </div>
            <button
              onClick={async () => {
                const text = `Confira tudo sobre o ${team.name} no Power Sports!\n26ª Regional Certel/Sicredi 2025`;
                const url = `https://power.jornalfv.com.br/time/${team.slug || team.id}`;
                if (navigator.share) {
                  try { await navigator.share({ title: team.name, text, url }); return; } catch { /* */ }
                }
                try { await navigator.clipboard.writeText(`${text}\n${url}`); } catch { /* */ }
              }}
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/10 text-muted-foreground hover:text-foreground hover:bg-white/15 transition-all active:scale-95"
              title="Compartilhar"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {team.founded_year && <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">Fundado em {team.founded_year}</span>}
            {team.colors_description && <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">{team.colors_description}</span>}
            {team.default_tactic && <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">{team.default_tactic}</span>}
            {team.city && <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">{team.city}</span>}
            {team.president && <span className="text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">Pres. {team.president}</span>}
          </div>
        </div>

        <div className="px-4 space-y-4 mt-4">

          {/* ===== POSIÇÃO + FORMA (FREE) ===== */}
          {teamStanding && seasonStats && (
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-mono)', color: team.color || 'var(--primary)' }}>
                    {teamStanding.position}º
                  </span>
                  <div>
                    <span className="text-xs font-bold text-foreground block" style={{ fontFamily: 'var(--font-heading)' }}>na classificação</span>
                    <span className="text-[10px] text-muted-foreground">{seasonStats.points} pts em {seasonStats.played} jogos</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{seasonStats.winRate}%</span>
                  <span className="text-[9px] text-muted-foreground block uppercase" style={{ fontFamily: 'var(--font-heading)' }}>Aprov.</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground uppercase font-semibold shrink-0" style={{ fontFamily: 'var(--font-heading)' }}>Forma</span>
                <div className="flex gap-1">{seasonStats.form.map((r, i) => <FormBadge key={i} result={r} />)}</div>
              </div>
            </div>
          )}

          {/* ===== NUMEROS PRINCIPAIS (FREE) ===== */}
          {seasonStats && (
            <section>
              <SectionHeader icon={BarChart3} title="Números do Time" />
              <div className="grid grid-cols-4 gap-2 mb-2">
                <StatBox value={seasonStats.wins} label="Vitórias" color="text-green-500" />
                <StatBox value={seasonStats.draws} label="Empates" color="text-yellow-500" />
                <StatBox value={seasonStats.losses} label="Derrotas" color="text-red-500" />
                <StatBox value={seasonStats.played} label="Jogos" />
              </div>
              <div className="grid grid-cols-4 gap-2">
                <StatBox value={seasonStats.goalsFor} label="Gols" color="text-green-500" />
                <StatBox value={seasonStats.goalsAgainst} label="Sofridos" color="text-red-500" />
                <StatBox value={seasonStats.yellows} label="" icon="yellow_card" />
                <StatBox value={seasonStats.reds} label="" icon="red_card" />
              </div>
              {/* Campanha bar */}
              <div className="mt-3 bg-card rounded-xl border border-border p-3">
                <div className="h-2.5 rounded-full bg-secondary overflow-hidden flex">
                  {seasonStats.wins > 0 && <div className="h-full bg-green-500 transition-all" style={{ width: `${(seasonStats.wins / seasonStats.played) * 100}%` }} />}
                  {seasonStats.draws > 0 && <div className="h-full bg-yellow-500 transition-all" style={{ width: `${(seasonStats.draws / seasonStats.played) * 100}%` }} />}
                  {seasonStats.losses > 0 && <div className="h-full bg-red-500 transition-all" style={{ width: `${(seasonStats.losses / seasonStats.played) * 100}%` }} />}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-muted-foreground">Saldo: <strong className="text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{seasonStats.goalsFor - seasonStats.goalsAgainst > 0 ? '+' : ''}{seasonStats.goalsFor - seasonStats.goalsAgainst}</strong></span>
                  <span className="text-[10px] text-muted-foreground">Média: <strong className="text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{seasonStats.avgGoals} gols/jogo</strong></span>
                </div>
              </div>
            </section>
          )}

          {/* ===== PROXIMO JOGO COM COMPARATIVO (FREE) ===== */}
          {nextMatch && (
            <section>
              <SectionHeader icon={Calendar} title="Próximo Jogo" />
              <div className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => navigate(`/jogo/${nextMatch.id}`)}
                  className="w-full p-4 hover:bg-muted/30 transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase" style={{ fontFamily: 'var(--font-heading)' }}>{nextMatch.round_name || `Rodada ${nextMatch.round_number}`}</span>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {format(new Date(nextMatch.match_date), "EEE dd/MM 'às' HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <TeamLogo url={nextMatch.home_team?.logo_url} name={nextMatch.home_team?.short_name || '?'} size={44} />
                      <span className="text-[11px] font-bold text-foreground truncate max-w-[100px] text-center" style={{ fontFamily: 'var(--font-heading)' }}>
                        {nextMatch.home_team?.short_name || '?'}
                      </span>
                    </div>
                    <span className="text-lg text-muted-foreground px-4" style={{ fontFamily: 'var(--font-mono)' }}>vs</span>
                    <div className="flex-1 flex flex-col items-center gap-1.5">
                      <TeamLogo url={nextMatch.away_team?.logo_url} name={nextMatch.away_team?.short_name || '?'} size={44} />
                      <span className="text-[11px] font-bold text-foreground truncate max-w-[100px] text-center" style={{ fontFamily: 'var(--font-heading)' }}>
                        {nextMatch.away_team?.short_name || '?'}
                      </span>
                    </div>
                  </div>
                  {nextMatch.location && (
                    <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground">
                      <MapPin className="w-3 h-3" /><span>{nextMatch.location}</span>
                    </div>
                  )}
                </button>

                {/* Mini comparative preview */}
                {nextMatchPreview && seasonStats && (() => {
                  // Follow match order: home team on left, away team on right
                  const isHome = nextMatch.home_team_id === team.id;
                  const leftName = isHome ? team.short_name : (nextMatchPreview.standing?.team.short_name || '?');
                  const rightName = isHome ? (nextMatchPreview.standing?.team.short_name || '?') : team.short_name;
                  const leftColor = isHome ? (team.color || '#22c55e') : (nextMatchPreview.standing?.team.color || '#3b82f6');
                  const rightColor = isHome ? (nextMatchPreview.standing?.team.color || '#3b82f6') : (team.color || '#22c55e');
                  const leftPos = isHome ? (teamStanding?.position || '-') : (nextMatchPreview.position || '-');
                  const rightPos = isHome ? (nextMatchPreview.position || '-') : (teamStanding?.position || '-');
                  const leftForm = isHome ? seasonStats.form : nextMatchPreview.form;
                  const rightForm = isHome ? nextMatchPreview.form : seasonStats.form;
                  const leftGF = isHome ? seasonStats.goalsFor : nextMatchPreview.goals;
                  const rightGF = isHome ? nextMatchPreview.goals : seasonStats.goalsFor;
                  const leftGA = isHome ? seasonStats.goalsAgainst : nextMatchPreview.conceded;
                  const rightGA = isHome ? nextMatchPreview.conceded : seasonStats.goalsAgainst;
                  const leftH2H = isHome ? nextMatchPreview.h2h.wins : nextMatchPreview.h2h.losses;
                  const rightH2H = isHome ? nextMatchPreview.h2h.losses : nextMatchPreview.h2h.wins;
                  return (
                  <div className="border-t border-border px-4 py-3 space-y-2 bg-secondary/20">
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground uppercase font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>
                      <span>{leftName}</span>
                      <span className="text-primary">Comparativo</span>
                      <span>{rightName}</span>
                    </div>

                    {/* Position */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{leftPos}º</span>
                      <span className="text-[9px] text-muted-foreground uppercase" style={{ fontFamily: 'var(--font-heading)' }}>Posição</span>
                      <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{rightPos}º</span>
                    </div>

                    {/* Form */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-0.5">{leftForm.map((r, i) => <FormBadge key={`l-${i}`} result={r} />)}</div>
                      <span className="text-[9px] text-muted-foreground uppercase px-1" style={{ fontFamily: 'var(--font-heading)' }}>Forma</span>
                      <div className="flex gap-0.5">{rightForm.map((r, i) => <FormBadge key={`r-${i}`} result={r} />)}</div>
                    </div>

                    {/* Goals comparison */}
                    <CompareBar label="Gols Feitos" home={leftGF} away={rightGF} homeColor={leftColor} awayColor={rightColor} />
                    <CompareBar label="Gols Sofridos" home={leftGA} away={rightGA} homeColor={leftColor} awayColor={rightColor} isHigherBetter={false} />

                    {/* H2H record */}
                    {nextMatchPreview.h2h.total > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-border/50">
                        <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)', color: leftH2H > rightH2H ? leftColor : 'var(--muted-foreground)' }}>
                          {leftH2H}V
                        </span>
                        <span className="text-[9px] text-muted-foreground uppercase" style={{ fontFamily: 'var(--font-heading)' }}>
                          Confronto ({nextMatchPreview.h2h.total} {nextMatchPreview.h2h.total === 1 ? 'jogo' : 'jogos'})
                        </span>
                        <span className="text-xs font-bold" style={{ fontFamily: 'var(--font-mono)', color: rightH2H > leftH2H ? rightColor : 'var(--muted-foreground)' }}>
                          {rightH2H}V
                        </span>
                      </div>
                    )}

                    <button
                      onClick={(e) => { e.stopPropagation(); navigate('/mano-a-mano'); }}
                      className="w-full text-center text-[10px] text-primary font-semibold pt-1 hover:underline"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Ver Mano a Mano completo
                    </button>
                  </div>
                  );
                })()}
              </div>
            </section>
          )}

          {/* ===== CALENDARIO (FREE) ===== */}
          {upcomingMatches.length > 1 && (
            <CollapsibleSection title="Calendário" icon={Swords} defaultOpen={false}>
              <div className="space-y-1.5">
                {upcomingMatches.slice(1).map(m => {
                  const isHome = m.home_team_id === team.id;
                  const opponent = isHome ? m.away_team : m.home_team;
                  return (
                    <button key={m.id} onClick={() => navigate(`/jogo/${m.id}`)}
                      className="w-full flex items-center gap-3 bg-secondary/40 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors">
                      <TeamLogo url={opponent?.logo_url} name={opponent?.short_name || '?'} size={24} />
                      <div className="min-w-0 flex-1 text-left">
                        <span className="text-xs font-semibold text-foreground truncate block">{opponent?.short_name || '?'}</span>
                        <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                          {isHome ? <Home className="w-2.5 h-2.5" /> : <Plane className="w-2.5 h-2.5" />}
                          {isHome ? 'Casa' : 'Fora'} · {m.round_name || `Rodada ${m.round_number}`}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-muted-foreground block" style={{ fontFamily: 'var(--font-mono)' }}>{format(new Date(m.match_date), "dd/MM", { locale: ptBR })}</span>
                        <span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{format(new Date(m.match_date), "HH:mm")}</span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* ===== ULTIMOS RESULTADOS (FREE) ===== */}
          {finishedMatches.length > 0 && (
            <CollapsibleSection title="Últimos Resultados" icon={Trophy} defaultOpen={true}>
              <div className="space-y-1.5">
                {finishedMatches.slice(0, 8).map(m => {
                  const isHome = m.home_team_id === team.id;
                  const opponent = isHome ? m.away_team : m.home_team;
                  const teamScore = isHome ? m.score_home : m.score_away;
                  const opponentScore = isHome ? m.score_away : m.score_home;
                  const result = teamScore! > opponentScore! ? 'V' : teamScore! < opponentScore! ? 'D' : 'E';
                  const resultColor = result === 'V' ? 'bg-green-500' : result === 'D' ? 'bg-red-500' : 'bg-yellow-500';
                  const matchGoals = events.filter(e => e.match_id === m.id && (e.event_type === 'goal' || e.event_type === 'penalty_goal'));
                  return (
                    <button key={m.id} onClick={() => navigate(`/jogo/${m.id}`)} className="w-full flex items-center gap-2.5 bg-secondary/40 rounded-lg px-3 py-2.5 hover:bg-muted transition-colors">
                      <span className={`w-6 h-6 rounded-md ${resultColor} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>{result}</span>
                      <TeamLogo url={opponent?.logo_url} name={opponent?.short_name || '?'} size={22} />
                      <div className="flex-1 min-w-0 text-left">
                        <span className="text-xs font-semibold text-foreground truncate block">{opponent?.short_name || '?'}</span>
                        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                          {isHome ? <Home className="w-2.5 h-2.5" /> : <Plane className="w-2.5 h-2.5" />}
                          <span>{m.round_name || `R${m.round_number}`}</span>
                          {matchGoals.length > 0 && (
                            <span className="text-muted-foreground/70 ml-1 truncate">
                              {matchGoals.map(g => g.player?.name?.split(' ').slice(-1)[0] || '').filter(Boolean).join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold text-foreground shrink-0" style={{ fontFamily: 'var(--font-mono)' }}>{teamScore}-{opponentScore}</span>
                    </button>
                  );
                })}
              </div>
            </CollapsibleSection>
          )}

          {/* ===== ESTATISTICAS AVANCADAS (PREMIUM) ===== */}
          {seasonStats && (
            <CollapsibleSection
              title="Estatísticas Avançadas"
              icon={TrendingUp}
              defaultOpen={premiumUnlocked}
              premium={true}
              locked={!premiumUnlocked}
              onLock={() => setShowPremiumModal(true)}
            >
              {/* Home vs Away */}
              <div className="text-[9px] text-muted-foreground uppercase font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Desempenho Casa vs Fora</div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-secondary/40 rounded-xl p-3 text-center">
                  <Home className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                  <div className="text-sm font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                    {seasonStats.homeWins}V {seasonStats.homeDraws}E {seasonStats.homeLosses}D
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {seasonStats.homeGoalsFor} gols / {seasonStats.homeGoalsAgainst} sofr.
                  </div>
                  <div className="text-[10px] font-bold mt-1" style={{ fontFamily: 'var(--font-mono)', color: team.color || 'var(--primary)' }}>
                    {seasonStats.homePlayed > 0 ? Math.round(((seasonStats.homeWins * 3 + seasonStats.homeDraws) / (seasonStats.homePlayed * 3)) * 100) : 0}%
                  </div>
                </div>
                <div className="bg-secondary/40 rounded-xl p-3 text-center">
                  <Plane className="w-4 h-4 text-muted-foreground mx-auto mb-1.5" />
                  <div className="text-sm font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                    {seasonStats.awayWins}V {seasonStats.awayDraws}E {seasonStats.awayLosses}D
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">
                    {seasonStats.awayGoalsFor} gols / {seasonStats.awayGoalsAgainst} sofr.
                  </div>
                  <div className="text-[10px] font-bold mt-1" style={{ fontFamily: 'var(--font-mono)', color: team.color || 'var(--primary)' }}>
                    {seasonStats.awayPlayed > 0 ? Math.round(((seasonStats.awayWins * 3 + seasonStats.awayDraws) / (seasonStats.awayPlayed * 3)) * 100) : 0}%
                  </div>
                </div>
              </div>

              {/* Extra stats grid */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <StatBox value={seasonStats.cleanSheets} label="SG (Clean Sheet)" />
                <StatBox value={seasonStats.avgGoals} label="Média gols" />
                <StatBox value={seasonStats.avgConceded} label="Média sofr." />
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <StatBox value={`+${seasonStats.biggestWin}`} label="Maior vit." color="text-green-500" />
                <StatBox value={seasonStats.goalsFor - seasonStats.goalsAgainst > 0 ? `+${seasonStats.goalsFor - seasonStats.goalsAgainst}` : `${seasonStats.goalsFor - seasonStats.goalsAgainst}`} label="Saldo" />
                <StatBox value={seasonStats.disciplineScore} label="Pts. Disc." color="text-yellow-500" />
              </div>

              {/* Goals by half */}
              <div className="text-[9px] text-muted-foreground uppercase font-semibold mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Gols por Tempo</div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
                  <span className="text-lg font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{seasonStats.goals1H}</span>
                  <span className="text-[9px] text-muted-foreground block">1º Tempo</span>
                </div>
                <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
                  <span className="text-lg font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{seasonStats.goals2H}</span>
                  <span className="text-[9px] text-muted-foreground block">2º Tempo</span>
                </div>
              </div>

              {/* Most common scoreline */}
              {seasonStats.topScoreline && (
                <div className="bg-secondary/40 rounded-lg p-2.5 text-center">
                  <span className="text-[9px] text-muted-foreground uppercase font-semibold block mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Placar mais frequente</span>
                  <span className="text-base font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{seasonStats.topScoreline}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">({seasonStats.topScorelineCount}x)</span>
                </div>
              )}
            </CollapsibleSection>
          )}

          {/* ===== ARTILHEIROS DO TIME (PREMIUM) ===== */}
          {topScorers.length > 0 && (
            <CollapsibleSection
              title="Artilheiros"
              icon={Crosshair}
              defaultOpen={premiumUnlocked}
              premium={true}
              locked={!premiumUnlocked}
              onLock={() => setShowPremiumModal(true)}
            >
              <div className="space-y-1.5">
                {topScorers.map((ps, i) => (
                  <button key={ps.player.id} onClick={() => navigate(`/jogador/${ps.player.id}`)}
                    className="w-full flex items-center gap-2.5 bg-secondary/40 rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                    <span className="text-[10px] font-bold text-muted-foreground w-4 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{i + 1}</span>
                    {ps.player.photo_url ? (
                      <img src={photoUrl(ps.player.photo_url, 32)} alt={ps.player.name} width={32} height={32} loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover bg-muted shrink-0 border-2" style={{ borderColor: team.color || '#22c55e' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{ps.player.name.slice(0, 2)}</div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-xs font-bold text-foreground truncate block">{ps.player.name}</span>
                      <span className="text-[9px] text-muted-foreground">{getPositionLabel(ps.player.position)} {ps.player.number ? `#${ps.player.number}` : ''}</span>
                    </div>
                    <span className="text-sm font-extrabold text-green-500 shrink-0" style={{ fontFamily: 'var(--font-mono)' }}>{ps.goals}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0">{ps.goals === 1 ? 'gol' : 'gols'}</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* ===== GARCONS (PREMIUM) ===== */}
          {topAssisters.length > 0 && (
            <CollapsibleSection
              title="Garçons"
              icon={Star}
              defaultOpen={false}
              premium={true}
              locked={!premiumUnlocked}
              onLock={() => setShowPremiumModal(true)}
            >
              <div className="space-y-1.5">
                {topAssisters.map((ps, i) => (
                  <button key={ps.player.id} onClick={() => navigate(`/jogador/${ps.player.id}`)}
                    className="w-full flex items-center gap-2.5 bg-secondary/40 rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                    <span className="text-[10px] font-bold text-muted-foreground w-4 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{i + 1}</span>
                    {ps.player.photo_url ? (
                      <img src={photoUrl(ps.player.photo_url, 32)} alt={ps.player.name} width={32} height={32} loading="lazy" decoding="async" className="w-8 h-8 rounded-full object-cover bg-muted shrink-0 border-2" style={{ borderColor: team.color || '#22c55e' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{ps.player.name.slice(0, 2)}</div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-xs font-bold text-foreground truncate block">{ps.player.name}</span>
                      <span className="text-[9px] text-muted-foreground">{getPositionLabel(ps.player.position)}</span>
                    </div>
                    <span className="text-sm font-extrabold text-blue-400 shrink-0" style={{ fontFamily: 'var(--font-mono)' }}>{ps.assists}</span>
                    <span className="text-[9px] text-muted-foreground shrink-0">assist.</span>
                  </button>
                ))}
              </div>
            </CollapsibleSection>
          )}

          {/* ===== ELENCO (FREE nomes / PREMIUM stats) ===== */}
          <section>
            <SectionHeader icon={Shield} title="Elenco" trailing={<span className="text-[10px] text-muted-foreground">{players.length} jogadores</span>} />
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="grid grid-cols-[1fr_28px_28px_28px_28px] gap-0 px-3 py-2 border-b border-border text-[9px] text-muted-foreground font-semibold uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
                <span>Jogador</span>
                <span className="text-center"><CircleDot className="w-3 h-3 mx-auto text-green-500" /></span>
                <span className="text-center"><Star className="w-3 h-3 mx-auto text-blue-400" /></span>
                <span className="flex justify-center"><span className="w-2.5 h-3.5 rounded-[1.5px] bg-yellow-400 inline-block" /></span>
                <span className="flex justify-center"><span className="w-2.5 h-3.5 rounded-[1.5px] bg-red-500 inline-block" /></span>
              </div>

              {positionGroups.map(group => (
                <div key={group.label}>
                  <div className="px-3 py-1.5 bg-muted/50 border-b border-border">
                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>
                      {group.label} ({group.stats.length})
                    </span>
                  </div>
                  {group.stats.map((ps) => (
                    <button
                      key={ps.player.id}
                      onClick={() => premiumUnlocked ? navigate(`/jogador/${ps.player.id}`) : setShowPremiumModal(true)}
                      className="w-full grid grid-cols-[1fr_28px_28px_28px_28px] gap-0 px-3 py-2.5 items-center border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {ps.player.photo_url ? (
                          <img src={photoUrl(ps.player.photo_url, 28)} alt={ps.player.name} width={28} height={28} loading="lazy" decoding="async" className="w-7 h-7 rounded-full object-cover bg-muted shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0" style={{ fontFamily: 'var(--font-heading)' }}>
                            {ps.player.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex flex-col">
                          <span className="text-[12px] font-semibold text-foreground truncate">{ps.player.name}</span>
                          <span className="text-[9px] text-muted-foreground text-left" style={{ fontFamily: 'var(--font-mono)' }}>
                            {ps.player.number ? `#${ps.player.number}` : ''}
                          </span>
                        </div>
                      </div>
                      <span className={`text-center text-xs font-bold ${premiumUnlocked ? 'text-green-500' : 'text-green-500/30 select-none blur-[5px]'}`} style={{ fontFamily: 'var(--font-mono)' }}>{ps.goals || '-'}</span>
                      <span className={`text-center text-xs font-bold ${premiumUnlocked ? 'text-blue-400' : 'text-blue-400/30 select-none blur-[5px]'}`} style={{ fontFamily: 'var(--font-mono)' }}>{ps.assists || '-'}</span>
                      <span className={`text-center text-xs font-semibold ${premiumUnlocked ? 'text-yellow-500' : 'text-yellow-500/30 select-none blur-[5px]'}`} style={{ fontFamily: 'var(--font-mono)' }}>{ps.yellows || '-'}</span>
                      <span className={`text-center text-xs font-semibold ${premiumUnlocked ? 'text-red-500' : 'text-red-500/30 select-none blur-[5px]'}`} style={{ fontFamily: 'var(--font-mono)' }}>{ps.reds || '-'}</span>
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {!premiumUnlocked && (
              <button
                onClick={() => setShowPremiumModal(true)}
                className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold transition-all active:scale-[0.98]"
                style={{
                  fontFamily: 'var(--font-heading)',
                  borderColor: `${GOLD}40`,
                  background: `linear-gradient(135deg, ${GOLD}15, ${GOLD}05)`,
                  color: GOLD,
                }}
              >
                <Lock className="w-3.5 h-3.5" />
                Desbloquear todos os dados
              </button>
            )}
          </section>

          {/* ===== SITUACAO DISCIPLINAR (PREMIUM) ===== */}
          <CollapsibleSection
            title="Situação Disciplinar"
            icon={AlertTriangle}
            defaultOpen={premiumUnlocked && (suspendedPlayers.length > 0 || penduradoPlayers.length > 0)}
            premium={true}
            locked={!premiumUnlocked}
            onLock={() => setShowPremiumModal(true)}
          >
            {seasonStats && (
              <div className="flex items-center justify-between bg-secondary/40 rounded-lg p-2.5 mb-2">
                <span className="text-[10px] text-muted-foreground">Pontos Disciplinares (Art.79)</span>
                <span className="text-sm font-bold text-yellow-500" style={{ fontFamily: 'var(--font-mono)' }}>{seasonStats.disciplineScore}</span>
              </div>
            )}
            {/* Most carded players */}
            {topCarded.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <div className="text-[9px] text-muted-foreground uppercase font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Mais advertidos</div>
                {topCarded.map((ps) => (
                  <button key={ps.player.id} onClick={() => navigate(`/jogador/${ps.player.id}`)}
                    className="w-full flex items-center gap-2 bg-secondary/40 rounded-lg px-3 py-2 hover:bg-muted transition-colors">
                    <span className="text-xs text-foreground flex-1 text-left truncate font-medium">{ps.player.name}</span>
                    {ps.yellows > 0 && <span className="flex items-center gap-0.5"><span className="w-2 h-3 rounded-[1px] bg-yellow-400 inline-block" /><span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{ps.yellows}</span></span>}
                    {ps.reds > 0 && <span className="flex items-center gap-0.5"><span className="w-2 h-3 rounded-[1px] bg-red-500 inline-block" /><span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{ps.reds}</span></span>}
                  </button>
                ))}
              </div>
            )}
            {suspendedPlayers.length > 0 && (
              <div className="mb-3">
                <div className="text-[9px] text-red-500 font-semibold uppercase mb-1.5" style={{ fontFamily: 'var(--font-heading)' }}>Suspensos</div>
                <div className="space-y-1">
                  {suspendedPlayers.map(p => (
                    <button key={p.id} onClick={() => navigate(`/jogador/${p.id}`)} className="w-full flex items-center gap-2 bg-red-500/5 border border-red-500/15 rounded-lg px-3 py-2 hover:bg-red-500/10 transition-colors">
                      <span className="text-xs text-foreground flex-1 text-left truncate">{p.name}</span>
                      <span className="text-[8px] bg-red-500/20 text-red-500 px-1.5 py-0.5 rounded font-bold" style={{ fontFamily: 'var(--font-heading)' }}>SUSPENSO</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {penduradoPlayers.length > 0 && (
              <div>
                <div className="text-[9px] text-yellow-600 font-semibold uppercase mb-1.5 flex items-center gap-1" style={{ fontFamily: 'var(--font-heading)' }}>
                  Pendurados (2 <span className="inline-block w-2 h-3 rounded-[1px] bg-yellow-400" />)
                </div>
                <div className="space-y-1">
                  {penduradoPlayers.map(p => (
                    <button key={p.id} onClick={() => navigate(`/jogador/${p.id}`)} className="w-full flex items-center gap-2 bg-yellow-500/5 border border-yellow-500/15 rounded-lg px-3 py-2 hover:bg-yellow-500/10 transition-colors">
                      <span className="text-xs text-foreground flex-1 text-left truncate">{p.name}</span>
                      <span className="text-[8px] bg-yellow-500/20 text-yellow-600 px-1.5 py-0.5 rounded font-bold" style={{ fontFamily: 'var(--font-heading)' }}>PENDURADO</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {suspendedPlayers.length === 0 && penduradoPlayers.length === 0 && topCarded.length === 0 && (
              <p className="text-[10px] text-muted-foreground text-center py-2">Nenhuma pendência disciplinar</p>
            )}
          </CollapsibleSection>

        </div>

        <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} onSuccess={() => setPremiumUnlocked(true)} />
      </div>
    </PageTransition>
  );
}