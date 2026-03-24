import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, MapPin, Calendar, Clock, Radio, Users, Star, RefreshCw, TrendingUp, Shield, Zap, Target, AlertTriangle, ClipboardList } from 'lucide-react';
import {
  fetchMatchById, fetchMatchEvents, fetchMatchLineups, fetchMatchTeamStats, fetchPlayerById, fetchPlayersByIds,
  fetchTeams, fetchMatches, buildStandingsFromTeams, fetchMatchPlayerStats,
  type Match, type MatchEvent, type MatchLineup, type MatchTeamStats, type MatchPlayerStats, type Player, type Team, type StandingRow,
  formatEventTime, getHalfLabel,
} from '../lib/public-supabase';
import { PremiumGate } from '../components/public/PremiumGate';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { PageTransition } from '../components/public/PageTransition';
import { toast } from 'sonner@2.0.3';
import svgPaths from '../imports/svg-gs19ap0rlg';
import { ShareButton } from '../components/public/ShareButton';
import { SectionHeader } from '../components/public/SectionHeader';
import { MatchFormationView } from '../components/MatchFormationView';
import { LiveMatchView } from '../components/LiveMatchView';
import { logoUrl, photoUrl } from '../lib/image-utils';
import { supabase } from '../lib/supabase-client';

// ============================
// ICONS
// ============================
function GoalNetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 3873 3873" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="m3638.5 3047.7h-276.8c-33.4 0-60.5-27.1-60.5-60.5v-1764.1h-2729.4v1764.1c0 33.4-27.1 60.5-60.5 60.5h-276.8c-33.4 0-60.5-27.1-60.5-60.5v-1914c0-136.7 111.2-247.9 247.9-247.9h3029.3c136.7 0 247.9 111.2 247.9 247.9v1914c-.1 33.4-27.2 60.5-60.6 60.5zm-216.3-121h155.8v-1853.5c0-69.9-56.9-126.8-126.8-126.8h-3029.3c-69.9 0-126.8 56.9-126.8 126.8v1853.5h155.8v-1764.1c0-33.4 27.1-60.5 60.5-60.5h2850.3c33.4 0 60.5 27.1 60.5 60.5z"/>
      <path d="m1006.4 2564.8c-133.5-645.4-96.9-468.7-184-889.5-10.2-49.3-28.7-95.9-55.2-138.7-38.2-62.2-68.7-82.7-300-332.6-22.9-24.4-21.7-62.7 2.7-85.5s62.7-21.7 85.5 2.7c237.2 257 266.6 273.5 315 351.8 33.8 54.8 57.6 114.6 70.7 177.8l183.9 889.4c6.8 32.7-14.2 64.8-46.9 71.6-34.7 6.6-65.1-15.5-71.7-47z"/>
      <path d="m1296 2560.6c-3.9-28-121.4-880.3-122.6-889.3-19-137-72.8-210.7-75.6-216.5l-162.6-257.8c-17.8-28.3-9.4-65.6 18.9-83.5 28.3-17.8 65.6-9.4 83.5 18.9l164.3 260.4c46.4 73.5 78 164.1 91.5 261.9l122.6 889.5c4.5 33.1-18.7 63.6-51.8 68.1-30.5 5.3-63.5-16.9-68.2-51.7z"/>
      <path d="m1646.2 2613c-31.5 0-58.1-24.4-60.3-56.4l-61.3-889.4c-5.8-84.7-19.2-162.1-38.7-223.9l-82.1-260.4c-10.1-31.9 7.6-65.9 39.5-75.9 31.9-10.1 65.9 7.6 75.9 39.5l82.1 260.4c22.3 70.8 37.5 157.9 44 252l61.3 889.4c2.4 35.1-25.5 64.7-60.4 64.7z"/>
      <path d="m1936.5 2613c-33.4 0-60.5-27.1-60.5-60.5v-1387.8c0-33.4 27.1-60.5 60.5-60.5s60.5 27.1 60.5 60.5v1387.8c0 33.4-27.1 60.5-60.5 60.5z"/>
      <path d="m2222.6 2612.9c-33.3-2.3-58.5-31.2-56.2-64.5l61.3-889.4c6.5-94.1 21.7-181.2 44-252l82.1-260.4c10.1-31.9 44-49.6 75.9-39.5s49.6 44 39.5 75.9l-82.1 260.4c-19.5 61.8-32.9 139.2-38.7 223.9l-61.3 889.4c-2.3 33.5-31.5 58.6-64.5 56.2z"/>
      <path d="m2508.8 2612.4c-33.1-4.6-56.2-35.1-51.7-68.2l122.6-889.4c13.5-97.9 45.1-188.4 91.5-262l164.2-260.4c17.8-28.3 55.2-36.7 83.5-18.9s36.7 55.2 18.9 83.5l-164.2 260.4c-37.2 59.1-62.8 133-74 213.9l-122.6 889.4c-4.6 33.4-35.6 56.4-68.2 51.7z"/>
      <path d="m2795 2611.7c-32.7-6.8-53.8-38.8-47-71.5l183.9-889.4c20.7-100.4 68.9-192.8 139.4-267.2l246.3-262.4c22.9-24.4 61.2-25.6 85.5-2.7 24.4 22.9 25.6 61.2 2.7 85.5-258 274.8-246.2 262.3-246.6 262.7-55 58.1-92.6 130.2-108.8 208.6l-183.9 889.4c-6.9 33.6-40.1 53.9-71.5 47z"/>
      <path d="m463.8 3024.6c-20.7-26.3-16.2-64.3 10.1-85l554.4-436.8c18.5-14.5 37.4-13 37.5-13l1741.5.2c13.6 0 26.8 4.6 37.4 13l554.4 436.6c26.3 20.7 30.8 58.7 10.1 85s-58.7 30.8-85 10.1l-538-423.7-1699.6-.2-537.9 423.8c-25.4 20.5-63.8 16.7-84.9-10z"/>
      <path d="m463.7 2685c-20.6-26.3-15.9-64.4 10.5-84.9l494.3-385.9c26.3-20.6 64.4-15.9 84.9 10.5 20.6 26.3 15.9 64.4-10.5 84.9l-494.3 385.9c-26.1 20.5-64.3 16-84.9-10.5z"/>
      <path d="m463.7 2384.1c-20.6-26.3-15.9-64.4 10.5-84.9l440.7-344c26.3-20.6 64.4-15.9 84.9 10.5 20.6 26.3 15.9 64.4-10.5 84.9l-440.7 344c-26.7 20.7-64.6 15.6-84.9-10.5z"/>
      <path d="m463.7 2083.1c-20.6-26.3-15.9-64.4 10.5-84.9l387-302.2c26.3-20.6 64.4-15.9 84.9 10.5 20.6 26.3 15.9 64.4-10.5 84.9l-387.1 302.2c-26.3 20.6-64.3 15.8-84.8-10.5z"/>
      <path d="m463.7 1782.1c-20.6-26.3-15.9-64.4 10.5-84.9l307.6-240.1c26.3-20.6 64.4-15.9 84.9 10.5 20.6 26.3 15.9 64.4-10.5 84.9l-307.6 240.1c-26.7 20.7-64.6 15.6-84.9-10.5z"/>
      <path d="m3324.4 2695.5-494.2-385.8c-26.3-20.6-31-58.6-10.5-84.9 20.6-26.3 58.6-31 84.9-10.5l494.2 385.8c26.3 20.6 31 58.6 10.5 84.9-20.3 26.2-58.2 31.2-84.9 10.5z"/>
      <path d="m3324.4 2394.5-440.6-343.9c-26.3-20.6-31-58.6-10.5-84.9 20.6-26.3 58.6-31 84.9-10.5l440.6 343.9c26.3 20.6 31 58.6 10.5 84.9-20.3 26.2-58.2 31.2-84.9 10.5z"/>
      <path d="m3324.4 2093.5-387-302.1c-26.3-20.6-31-58.6-10.5-84.9 20.6-26.3 58.6-31 84.9-10.5l387 302.1c26.3 20.6 31 58.6 10.5 84.9-20.3 26.2-58.2 31.2-84.9 10.5z"/>
      <path d="m3324.4 1792.5-307.5-240c-26.3-20.6-31-58.6-10.5-84.9 20.6-26.3 58.6-31 84.9-10.5l307.5 240c26.3 20.6 31 58.6 10.5 84.9-20.3 26.2-58.2 31.2-84.9 10.5z"/>
      <path d="m2860.1 2355.2h-1847.3c-33.4 0-60.5-27.1-60.5-60.5s27.1-60.5 60.5-60.5h1847.3c33.4 0 60.5 27.1 60.5 60.5s-27.1 60.5-60.5 60.5z"/>
      <path d="m2920.2 2064.5h-1967.5c-33.4 0-60.5-27.1-60.5-60.5s27.1-60.5 60.5-60.5h1967.5c33.4 0 60.5 27.1 60.5 60.5s-27.1 60.5-60.5 60.5z"/>
      <path d="m2980.3 1773.8h-2087.7c-33.4 0-60.5-27.1-60.5-60.5s27.1-60.5 60.5-60.5h2087.7c33.4 0 60.5 27.1 60.5 60.5s-27.1 60.5-60.5 60.5z"/>
      <path d="m3117.7 1483.1h-2362.4c-33.4 0-60.5-27.1-60.5-60.5s27.1-60.5 60.5-60.5h2362.4c33.4 0 60.5 27.1 60.5 60.5s-27.1 60.5-60.5 60.5z"/>
    </svg>
  );
}

// ============================
// COMPONENTS
// ============================
function TeamLogo({ url, name, size = 48 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="rounded-full bg-muted flex items-center justify-center text-foreground font-bold"
        style={{ width: size, height: size, fontFamily: 'var(--font-heading)', fontSize: size * 0.3 }}>
        {name.slice(0, 3)}
      </div>
    );
  }
  return <img src={logoUrl(url, size)} alt={name} width={size} height={size} loading="lazy" decoding="async" onError={() => setErr(true)} className="object-contain" />;
}

// Soccer ball SVG from Figma
function BallIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={className}>
      <path d={svgPaths.p3f399800} fill="currentColor" />
    </svg>
  );
}

// Penalty missed: ball with X
function PenaltyMissedIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" className={className}>
      <path d={svgPaths.p3f399800} fill="currentColor" opacity="0.5" />
      <g stroke="white" strokeWidth="4" strokeLinecap="round">
        <line x1="14" y1="14" x2="30" y2="30" />
        <line x1="30" y1="14" x2="14" y2="30" />
      </g>
    </svg>
  );
}

// Second yellow card icon (yellow + red overlapping)
function SecondYellowIcon({ size = 16 }: { size?: number }) {
  const w = size * 0.42;
  const h = size * 0.65;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20">
      <rect x="2" y="3" width={w} height={h} rx="1.2" fill="#facc15" />
      <rect x="9.5" y="5" width={w} height={h} rx="1.2" fill="#ef4444" />
    </svg>
  );
}

// Circular arrows (substitution)
function SubIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
    </svg>
  );
}

const EVENT_ICONS: Record<string, { label: string; color: string; isCard?: boolean; isBall?: boolean; isSub?: boolean }> = {
  goal: { label: '', color: 'text-white', isBall: true },
  own_goal: { label: 'GC', color: 'text-red-400', isBall: true },
  yellow_card: { label: '', color: 'bg-yellow-400 text-black', isCard: true },
  red_card: { label: '', color: 'bg-red-600 text-white', isCard: true },
  substitution: { label: '', color: 'text-blue-400', isSub: true },
  penalty_scored: { label: '', color: 'text-green-400', isBall: true },
  penalty_missed: { label: 'X', color: 'text-red-400', isBall: true },
};

const EVENT_LABELS: Record<string, string> = {
  goal: 'Gol', own_goal: 'Gol Contra', yellow_card: 'Cartão Amarelo', red_card: 'Cartão Vermelho',
  substitution: 'Substituição', penalty_scored: 'Pênalti Convertido', penalty_missed: 'Pênalti Perdido',
};

// ============================
// SKELETON SHIMMER
// ============================
function MatchSkeleton() {
  return (
    <div className="pb-6 animate-pulse">
      {/* Header */}
      <div className="px-4 pt-4 pb-6">
        <div className="h-3 w-24 bg-muted rounded mx-auto mb-4" />
        <div className="flex items-center justify-between px-4">
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-muted rounded-full" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-muted rounded" />
            <div className="w-4 h-6 bg-muted rounded" />
            <div className="w-10 h-10 bg-muted rounded" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 bg-muted rounded-full" />
            <div className="h-3 w-16 bg-muted rounded" />
          </div>
        </div>
        <div className="flex justify-center gap-3 mt-4">
          <div className="h-3 w-32 bg-muted rounded" />
          <div className="h-3 w-20 bg-muted rounded" />
        </div>
      </div>
      {/* Sections */}
      <div className="px-4 space-y-5">
        {[1, 2, 3].map(i => (
          <div key={i}>
            <div className="h-4 w-28 bg-muted rounded mb-3" />
            <div className="space-y-2">
              {[1, 2].map(j => (
                <div key={j} className="flex items-center gap-3 bg-card rounded-lg px-3 py-3">
                  <div className="w-5 h-5 bg-muted rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-36 bg-muted rounded" />
                    <div className="h-2.5 w-20 bg-muted rounded" />
                  </div>
                  <div className="h-3 w-10 bg-muted rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================
// BROADCAST EMBED HELPER
// ============================
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  try {
    // YouTube: watch?v=ID, youtu.be/ID, live/ID
    const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|live\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=0&rel=0`;
    // Twitch: twitch.tv/videos/ID or twitch.tv/channel
    const twitchVideo = url.match(/twitch\.tv\/videos\/(\d+)/);
    if (twitchVideo) return `https://player.twitch.tv/?video=${twitchVideo[1]}&parent=${window.location.hostname}&autoplay=false`;
    const twitchChannel = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/);
    if (twitchChannel) return `https://player.twitch.tv/?channel=${twitchChannel[1]}&parent=${window.location.hostname}&autoplay=false`;
    // Generic embed (if already an embed URL or iframe-compatible)
    if (url.includes('embed') || url.includes('player')) return url;
    return null;
  } catch {
    return null;
  }
}

// ============================
// STAT BAR
// ============================
function StatBar({ label, home, away, homeColor, awayColor, suffix = '' }: { label: string; home: number; away: number; homeColor?: string; awayColor?: string; suffix?: string }) {
  // Handle negative values (e.g. goal difference) by shifting to positive range
  const minVal = Math.min(home, away);
  const normHome = minVal < 0 ? home - minVal : home;
  const normAway = minVal < 0 ? away - minVal : away;
  const total = normHome + normAway;
  const homePercent = total > 0 ? (normHome / total) * 100 : 50;
  const awayPercent = total > 0 ? (normAway / total) * 100 : 50;
  const hColor = homeColor || '#6366f1';
  const aColor = awayColor || '#22c55e';
  return (
    <div className="flex items-center gap-2">
      <span className="w-8 text-right text-sm font-extrabold" style={{ fontFamily: 'var(--font-mono)', color: hColor }}>{home > 0 && minVal < 0 ? '+' : ''}{home}{suffix}</span>
      <div className="flex-1">
        <div className="flex h-2 rounded-full overflow-hidden gap-px bg-white/5">
          <div className="rounded-l-full transition-all duration-500" style={{ width: `${homePercent}%`, backgroundColor: hColor, opacity: 0.85 }} />
          <div className="rounded-r-full transition-all duration-500" style={{ width: `${awayPercent}%`, backgroundColor: aColor, opacity: 0.85 }} />
        </div>
        <p className="text-[9px] text-center text-muted-foreground mt-0.5">{label}</p>
      </div>
      <span className="w-8 text-left text-sm font-extrabold" style={{ fontFamily: 'var(--font-mono)', color: aColor }}>{away > 0 && minVal < 0 ? '+' : ''}{away}{suffix}</span>
    </div>
  );
}

// ============================
// FORMATION TOGGLE — Switch between home/away on mobile
// ============================
function FormationToggle({ matchId, homeTeam, awayTeam, lineups, events, homeStarters, awayStarters, matchExtraData, onPlayerClick }: {
  matchId: string;
  homeTeam?: Team;
  awayTeam?: Team;
  lineups: MatchLineup[];
  events: MatchEvent[];
  homeStarters: MatchLineup[];
  awayStarters: MatchLineup[];
  matchExtraData?: Record<string, unknown>;
  onPlayerClick?: (playerId: string) => void;
}) {
  const hasHome = homeStarters.length > 0;
  const hasAway = awayStarters.length > 0;
  const [viewTeam, setViewTeam] = useState<'home' | 'away'>(hasHome ? 'home' : 'away');

  const currentTeam = viewTeam === 'home' ? homeTeam : awayTeam;
  const currentTeamId = viewTeam === 'home' ? homeTeam?.id : awayTeam?.id;

  if (!currentTeam || !currentTeamId) return null;

  // Resolve formation data from match extra_data
  const formations = matchExtraData?.formations as Record<string, { formationId?: string; slots?: Record<string, string> }> | undefined;
  const teamFormation = currentTeamId ? formations?.[currentTeamId] : undefined;

  return (
    <div>
      {/* Toggle buttons */}
      {hasHome && hasAway && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setViewTeam('home')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-colors ${
              viewTeam === 'home'
                ? 'text-white'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
            style={viewTeam === 'home' ? { backgroundColor: homeTeam?.color || '#22c55e' } : undefined}
          >
            {homeTeam?.logo_url && <img src={logoUrl(homeTeam.logo_url, 16)} alt="" width={16} height={16} loading="lazy" decoding="async" className="w-4 h-4 object-contain" />}
            {homeTeam?.short_name}
          </button>
          <button
            onClick={() => setViewTeam('away')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-bold transition-colors ${
              viewTeam === 'away'
                ? 'text-white'
                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
            }`}
            style={viewTeam === 'away' ? { backgroundColor: awayTeam?.color || '#64748b' } : undefined}
          >
            {awayTeam?.logo_url && <img src={logoUrl(awayTeam.logo_url, 16)} alt="" width={16} height={16} loading="lazy" decoding="async" className="w-4 h-4 object-contain" />}
            {awayTeam?.short_name}
          </button>
        </div>
      )}

      <MatchFormationView
        matchId={matchId}
        teamId={currentTeamId}
        team={currentTeam as any}
        players={[]}
        lineups={lineups}
        events={events}
        side={viewTeam}
        variant="public"
        showBench
        formationId={teamFormation?.formationId}
        slotAssignments={teamFormation?.slots}
        onPlayerClick={onPlayerClick}
      />
    </div>
  );
}

// ============================
// MAIN COMPONENT
// ============================
export function MatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<Match | null>(null);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [lineups, setLineups] = useState<MatchLineup[]>([]);
  const [teamStats, setTeamStats] = useState<MatchTeamStats[]>([]);
  const [playerStats, setPlayerStats] = useState<MatchPlayerStats[]>([]);
  const [mvpPlayer, setMvpPlayer] = useState<Player | null>(null);
  const [playerOutMap, setPlayerOutMap] = useState<Record<string, Player>>({});
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const scoreRef = useRef<HTMLDivElement>(null);
  const [liveScoreHome, setLiveScoreHome] = useState<number | null>(null);
  const [liveScoreAway, setLiveScoreAway] = useState<number | null>(null);
  const handleLiveScore = useCallback((h: number, a: number) => {
    setLiveScoreHome(h);
    setLiveScoreAway(a);
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [m, ev, lu, ts, ps] = await Promise.all([
      fetchMatchById(id), fetchMatchEvents(id), fetchMatchLineups(id), fetchMatchTeamStats(id), fetchMatchPlayerStats(id),
    ]);
    setMatch(m); setEvents(ev); setLineups(lu); setTeamStats(ts); setPlayerStats(ps);

    // Fetch player_out names for substitutions
    const subOutIds = ev
      .filter(e => e.event_type === 'substitution' && e.detail?.player_out_id)
      .map(e => e.detail.player_out_id as string);
    if (subOutIds.length > 0) {
      const outPlayers = await fetchPlayersByIds(subOutIds);
      const map: Record<string, Player> = {};
      outPlayers.forEach(p => { map[p.id] = p; });
      setPlayerOutMap(map);
    }

    if (m?.mvp_player_id) {
      const mvp = await fetchPlayerById(m.mvp_player_id);
      setMvpPlayer(mvp);
    }

    // Fetch standings for team positions
    try {
      const [teams, allMatches] = await Promise.all([fetchTeams(), fetchMatches()]);
      const st = buildStandingsFromTeams(teams, allMatches);
      setStandings(st);
    } catch (e) { console.error('[MatchDetail] Standings error:', e); }

    setLoading(false);
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  // Realtime subscription on matches table — track scout_status transitions
  // Without this, fans won't see the match go live, change halves, or end
  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`match_status_${id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'matches',
        filter: `id=eq.${id}`,
      }, (payload: any) => {
        const updated = payload.new;
        setMatch(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            scout_status: 'scout_status' in updated ? updated.scout_status : prev.scout_status,
            scout_started_at: 'scout_started_at' in updated ? updated.scout_started_at : prev.scout_started_at,
            scout_half1_end: 'scout_half1_end' in updated ? updated.scout_half1_end : prev.scout_half1_end,
            scout_half2_start: 'scout_half2_start' in updated ? updated.scout_half2_start : prev.scout_half2_start,
            scout_ended_at: 'scout_ended_at' in updated ? updated.scout_ended_at : prev.scout_ended_at,
            status: 'status' in updated ? updated.status : prev.status,
            score_home: 'score_home' in updated ? updated.score_home : prev.score_home,
            score_away: 'score_away' in updated ? updated.score_away : prev.score_away,
          };
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [id]);

  // Sticky header via scroll observer
  useEffect(() => {
    const el = scoreRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyHeader(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  if (loading) return (
    <PageTransition>
      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /><span>Voltar</span>
        </button>
      </div>
      <MatchSkeleton />
    </PageTransition>
  );

  if (!match) return (
    <div className="px-4 py-8 text-center">
      <p className="text-muted-foreground">Partida não encontrada</p>
      <button onClick={() => navigate('/')} className="text-primary text-sm mt-3">Voltar</button>
    </div>
  );

  const isFinished = match.status === 'finished';
  const isLive = match.scout_status && !['idle', 'published'].includes(match.scout_status);
  const hasScore = match.score_home !== null && match.score_away !== null;
  const hasLiveScore = isLive && liveScoreHome !== null && liveScoreAway !== null;
  // When live, always show score (default 0-0 while LiveMatchView loads)
  const displayScoreHome = hasScore ? match.score_home : hasLiveScore ? liveScoreHome : isLive ? 0 : null;
  const displayScoreAway = hasScore ? match.score_away : hasLiveScore ? liveScoreAway : isLive ? 0 : null;
  const displayHasScore = displayScoreHome !== null && displayScoreAway !== null;
  const goalEvents = events.filter(e => ['goal', 'own_goal', 'penalty_scored'].includes(e.event_type));
  const sortedGoalEvents = [...goalEvents].sort((a, b) => {
    const halfA = getHalfLabel(a.half, a.minute ?? 0) === '1ºT' ? 1 : 2;
    const halfB = getHalfLabel(b.half, b.minute ?? 0) === '1ºT' ? 1 : 2;
    if (halfA !== halfB) return halfA - halfB;
    return (a.minute ?? 0) - (b.minute ?? 0);
  });
  const homeLineup = lineups.filter(l => l.team_id === match.home_team_id);
  const awayLineup = lineups.filter(l => l.team_id === match.away_team_id);
  const homeStarters = homeLineup.filter(l => l.is_starter);
  const homeSubs = homeLineup.filter(l => !l.is_starter);
  const awayStarters = awayLineup.filter(l => l.is_starter);
  const awaySubs = awayLineup.filter(l => !l.is_starter);
  const homeYellows = events.filter(e => e.event_type === 'yellow_card' && e.team_id === match.home_team_id).length;
  const awayYellows = events.filter(e => e.event_type === 'yellow_card' && e.team_id === match.away_team_id).length;
  const homeReds = events.filter(e => e.event_type === 'red_card' && e.team_id === match.home_team_id).length;
  const awayReds = events.filter(e => e.event_type === 'red_card' && e.team_id === match.away_team_id).length;
  const homeSubs2 = events.filter(e => e.event_type === 'substitution' && e.team_id === match.home_team_id).length;
  const awaySubs2 = events.filter(e => e.event_type === 'substitution' && e.team_id === match.away_team_id).length;
  const homeStats = teamStats.find(s => s.team_id === match.home_team_id);
  const awayStats = teamStats.find(s => s.team_id === match.away_team_id);
  const hasTeamStats = homeStats || awayStats;
  const hasPenalties = match.penalty_score_home != null && match.penalty_score_away != null;

  // Team standing positions
  const homePosition = standings.findIndex(s => s.team.id === match.home_team_id) + 1;
  const awayPosition = standings.findIndex(s => s.team.id === match.away_team_id) + 1;
  const homeStanding = standings.find(s => s.team.id === match.home_team_id);
  const awayStanding = standings.find(s => s.team.id === match.away_team_id);

  // Computed match stats (from events)
  const homeGoalsTotal = events.filter(e => (e.event_type === 'goal' || e.event_type === 'penalty_scored') && e.team_id === match.home_team_id).length;
  const awayGoalsTotal = events.filter(e => (e.event_type === 'goal' || e.event_type === 'penalty_scored') && e.team_id === match.away_team_id).length;
  const homeOwnGoals = events.filter(e => e.event_type === 'own_goal' && e.team_id === match.home_team_id).length;
  const awayOwnGoals = events.filter(e => e.event_type === 'own_goal' && e.team_id === match.away_team_id).length;
  const homePenMissed = events.filter(e => e.event_type === 'penalty_missed' && e.team_id === match.home_team_id).length;
  const awayPenMissed = events.filter(e => e.event_type === 'penalty_missed' && e.team_id === match.away_team_id).length;
  const totalEvents = events.length;

  // Player stats summaries
  const homePlayerStats = playerStats.filter(s => s.team_id === match.home_team_id);
  const awayPlayerStats = playerStats.filter(s => s.team_id === match.away_team_id);
  const homeAvgRating = homePlayerStats.length > 0 ? homePlayerStats.reduce((a, s) => a + (s.rating || 0), 0) / homePlayerStats.filter(s => s.rating).length : 0;
  const awayAvgRating = awayPlayerStats.length > 0 ? awayPlayerStats.reduce((a, s) => a + (s.rating || 0), 0) / awayPlayerStats.filter(s => s.rating).length : 0;
  const hasRatings = homeAvgRating > 0 || awayAvgRating > 0;

  return (
    <PageTransition>
    <div className="pb-6">
      {/* Sticky sub-header — positioned below the app shell header (52px) */}
      <div className={`fixed top-[52px] left-0 right-0 z-30 transition-all duration-300 ${showStickyHeader && displayHasScore ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'}`}>
        <div className="bg-background/95 backdrop-blur-md border-b border-border px-4 py-2">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={() => match.home_team && navigate(`/time/${match.home_team.slug || match.home_team_id}`)}
              >
                {match.home_team?.logo_url && <img src={match.home_team.logo_url} alt="" className="w-5 h-5 object-contain" />}
                <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{match.home_team?.short_name}</span>
              </div>
              <span className="text-sm font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                {displayHasScore ? `${displayScoreHome} - ${displayScoreAway}` : 'vs'}
              </span>
              <div
                className="flex items-center gap-1.5 cursor-pointer"
                onClick={() => match.away_team && navigate(`/time/${match.away_team.slug || match.away_team_id}`)}
              >
                <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{match.away_team?.short_name}</span>
                {match.away_team?.logo_url && <img src={match.away_team.logo_url} alt="" className="w-5 h-5 object-contain" />}
              </div>
            </div>
            {isLive ? (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            ) : (
              <div className="w-4" />
            )}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ArrowLeft className="w-4 h-4" /><span>Voltar</span>
        </button>
      </div>

      
      <div className="px-4 pt-4 pb-6">
        <div className="text-center mb-1">
          <span className="text-[10px] text-muted-foreground font-medium">
            {match.round_name || `Rodada ${match.round_number}`}
          </span>
          {match.broadcast && (
            <span className="inline-flex items-center gap-1 bg-red-500/15 text-red-500 text-[9px] font-semibold px-1.5 py-0.5 rounded-full ml-2">
              <Radio className="w-2.5 h-2.5" /><span className="tracking-wide uppercase">AO VIVO NA F7</span>
            </span>
          )}
        </div>

        <div ref={scoreRef} className="flex items-center justify-between">
          <div
            className="flex-1 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            onClick={() => match.home_team && navigate(`/time/${match.home_team.slug || match.home_team_id}`)}
          >
            <TeamLogo url={match.home_team?.logo_url} name={match.home_team?.short_name || '?'} size={56} />
            <span className="text-xs font-bold text-foreground text-center max-w-[110px] truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              {match.home_team?.name || match.home_team?.short_name || '?'}
            </span>
            {homePosition > 0 && (
              <span className="text-[9px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary" style={{ fontFamily: 'var(--font-mono)' }}>
                {homePosition}º lugar
              </span>
            )}
            {homeStanding && homeStanding.form.length > 0 && (
              <div className="flex gap-0.5 mt-0.5">
                {(homeStanding.form || []).slice(-5).map((r, i) => (
                  <span key={i} className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-bold ${
                    r === 'W' ? 'bg-green-500/20 text-green-400' :
                    r === 'D' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{r === 'W' ? 'V' : r === 'D' ? 'E' : 'D'}</span>
                ))}
              </div>
            )}
          </div>
          <div className="flex-shrink-0 px-6 flex flex-col items-center gap-1">
            {displayHasScore ? (
              <div className="flex items-center gap-3">
                <span className="text-4xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{displayScoreHome}</span>
                <span className="text-xl text-muted-foreground">&ndash;</span>
                <span className="text-4xl font-extrabold text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>{displayScoreAway}</span>
              </div>
            ) : (
              <span className="text-2xl text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>vs</span>
            )}
            {hasPenalties && (
              <span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                ({match.penalty_score_home} - {match.penalty_score_away} pen.)
              </span>
            )}
            {isFinished && <span className="text-[10px] text-muted-foreground uppercase font-semibold">Encerrado</span>}
            {isLive && (
              <span className="inline-flex items-center gap-1 text-red-500 text-[10px] font-bold uppercase mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                {match.scout_status === 'live_half1' ? '1º Tempo' :
                 match.scout_status === 'halftime' ? 'Intervalo' :
                 match.scout_status === 'live_half2' ? '2º Tempo' :
                 match.scout_status === 'ended' ? 'Encerrado' : 'Ao Vivo'}
              </span>
            )}
            {!isFinished && !isLive && (
              <span className="text-[10px] text-muted-foreground">
                {format(new Date(match.match_date), "dd/MM · HH:mm", { locale: ptBR })}
              </span>
            )}
          </div>
          <div
            className="flex-1 flex flex-col items-center gap-2 cursor-pointer active:scale-95 transition-transform"
            onClick={() => match.away_team && navigate(`/time/${match.away_team.slug || match.away_team_id}`)}
          >
            <TeamLogo url={match.away_team?.logo_url} name={match.away_team?.short_name || '?'} size={56} />
            <span className="text-xs font-bold text-foreground text-center max-w-[110px] truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              {match.away_team?.name || match.away_team?.short_name || '?'}
            </span>
            {awayPosition > 0 && (
              <span className="text-[9px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary" style={{ fontFamily: 'var(--font-mono)' }}>
                {awayPosition}º lugar
              </span>
            )}
            {awayStanding && awayStanding.form.length > 0 && (
              <div className="flex gap-0.5 mt-0.5">
                {(awayStanding.form || []).slice(-5).map((r, i) => (
                  <span key={i} className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[6px] font-bold ${
                    r === 'W' ? 'bg-green-500/20 text-green-400' :
                    r === 'D' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>{r === 'W' ? 'V' : r === 'D' ? 'E' : 'D'}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Broadcast Embed - logo abaixo do placar */}
        {match.broadcast && (match.extra_data as any)?.broadcast_url && (() => {
          const embedUrl = getEmbedUrl((match.extra_data as any).broadcast_url);
          if (!embedUrl) return null;
          return (
            <div className="mt-4">
              <div className="rounded-xl overflow-hidden border border-red-500/20 bg-black">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-red-600/10 to-transparent">
                  <Radio className="w-3 h-3 text-red-500" />
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-wide">
                    {isFinished ? 'Gravação da Transmissão' : match.status === 'live' ? 'Ao Vivo' : 'Transmissão'}
                  </span>
                </div>
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    src={embedUrl}
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Transmissão da partida"
                  />
                </div>
              </div>
            </div>
          );
        })()}

        <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground flex-wrap">
          {match.match_date && (
            <div className="flex items-center gap-1"><Calendar className="w-3 h-3" /><span>{format(new Date(match.match_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}</span></div>
          )}
          {match.location && (
            <div className="flex items-center gap-1"><MapPin className="w-3 h-3" /><span>{match.location}</span></div>
          )}
          {match.referee && (
            <div className="flex items-center gap-1"><Users className="w-3 h-3" /><span>Árbitro: {match.referee}</span></div>
          )}
          {match.attendance && match.attendance > 0 && (
            <div className="flex items-center gap-1"><Users className="w-3 h-3" /><span>{match.attendance} presentes</span></div>
          )}
        </div>

        {/* Share Link */}
        {isFinished && hasScore && (
          <div className="flex items-center justify-center gap-2 mt-3">
            <ShareButton
              text={`${match.home_team?.short_name} ${match.score_home} x ${match.score_away} ${match.away_team?.short_name}\n${match.round_name || `Rodada ${match.round_number}`}\n26ª Regional Certel/Sicredi 2025`}
              url={window.location.href}
              title="Power Sports"
              label="Compartilhar resultado"
              variant="pill"
            />
          </div>
        )}
      </div>

      <div className="px-4 space-y-5">
        {/* MVP */}
        {mvpPlayer && isFinished && (
          <section>
            <button onClick={() => navigate(`/jogador/${mvpPlayer.id}`)}
              className="w-full rounded-xl border border-yellow-500/20 overflow-hidden hover:border-yellow-500/40 transition-colors active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(234,179,8,0.02) 100%)' }}
            >
              <div className="flex items-center gap-3 p-3">
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-500/30 bg-secondary">
                    {mvpPlayer.photo_url ? (
                      <img src={photoUrl(mvpPlayer.photo_url, 96)} alt={mvpPlayer.name} width={72} height={72} loading="lazy" decoding="async" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
                        {mvpPlayer.number || '?'}
                      </div>
                    )}
                  </div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center shadow-sm">
                    <Star className="w-3 h-3 text-white fill-white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[9px] text-yellow-600 font-semibold uppercase tracking-wide">Craque do Jogo</p>
                  <p className="text-sm text-foreground font-bold truncate" style={{ fontFamily: 'var(--font-heading)' }}>{mvpPlayer.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-yellow-500/15 text-yellow-600 border border-yellow-500/20">{mvpPlayer.position}</span>
                    {mvpPlayer.number && <span className="text-[10px] text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>#{mvpPlayer.number}</span>}
                  </div>
                </div>
                {mvpPlayer.team && mvpPlayer.team.logo_url && (
                  <img src={logoUrl(mvpPlayer.team.logo_url, 80)} alt="" width={40} height={40} loading="lazy" decoding="async" className="w-10 h-10 object-contain shrink-0 opacity-100" />
                )}
              </div>
            </button>
          </section>
        )}

        {/* Quick Numbers */}
        {isFinished && totalEvents > 0 && (
          <section>
            <SectionHeader title="Números da Partida" icon={Zap} />
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: 'Gols', value: (match.score_home ?? 0) + (match.score_away ?? 0), iconEl: <BallIcon size={18} className="text-green-400" /> },
                { label: 'Amarelos', value: homeYellows + awayYellows, iconEl: <div className="w-3.5 h-5 rounded-[1.5px] bg-yellow-400" /> },
                { label: 'Vermelhos', value: homeReds + awayReds, iconEl: <div className="w-3.5 h-5 rounded-[1.5px] bg-red-500" /> },
                { label: 'Trocas', value: homeSubs2 + awaySubs2, iconEl: <SubIcon size={18} className="text-blue-400" /> },
              ].map(item => (
                <div key={item.label} className="bg-card rounded-lg p-2.5 text-center border border-border/50 flex flex-col items-center">
                  <div className="h-5 flex items-center justify-center">{item.iconEl}</div>
                  <p className="text-lg font-extrabold text-foreground mt-1" style={{ fontFamily: 'var(--font-mono)' }}>{item.value}</p>
                  <p className="text-[8px] text-muted-foreground uppercase">{item.label}</p>
                </div>
              ))}
            </div>
            {(homePenMissed > 0 || awayPenMissed > 0 || homeOwnGoals > 0 || awayOwnGoals > 0) && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {(homePenMissed + awayPenMissed) > 0 && (
                  <span className="text-[9px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> {homePenMissed + awayPenMissed} pênalti(s) perdido(s)
                  </span>
                )}
                {(homeOwnGoals + awayOwnGoals) > 0 && (
                  <span className="text-[9px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> {homeOwnGoals + awayOwnGoals} gol(s) contra
                  </span>
                )}
              </div>
            )}
          </section>
        )}

        {/* Live Match View — shows when scout system is active */}
        {match.scout_status && match.scout_status !== 'idle' && match.scout_status !== 'published' && (
          <LiveMatchView
            matchId={match.id}
            scoutStatus={match.scout_status}
            homeTeamId={match.home_team_id}
            awayTeamId={match.away_team_id}
            homeTeam={match.home_team ? { short_name: match.home_team.short_name, logo_url: match.home_team.logo_url } : undefined}
            awayTeam={match.away_team ? { short_name: match.away_team.short_name, logo_url: match.away_team.logo_url } : undefined}
            scoutStartedAt={match.scout_started_at}
            scoutHalf1End={match.scout_half1_end}
            scoutHalf2Start={match.scout_half2_start}
            scoutEndedAt={match.scout_ended_at}
            onLiveScore={handleLiveScore}
          />
        )}

        {/* Goals */}
        {goalEvents.length > 0 && (
          <section>
            <SectionHeader title="Gols" icon={GoalNetIcon} />
            <div className="space-y-2">
              {sortedGoalEvents.map(ev => {
                const isAway = ev.team_id === match.away_team_id;
                const teamData = isAway ? match.away_team : match.home_team;
                return (
                  <div key={ev.id} className="flex items-center gap-2.5 bg-card rounded-lg px-3 py-2.5">
                    <BallIcon size={18} className={ev.event_type === 'own_goal' ? 'text-red-400' : 'text-green-400'} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {ev.player?.number && (
                          <span className="text-[10px] text-muted-foreground font-bold" style={{ fontFamily: 'var(--font-mono)' }}>#{ev.player.number}</span>
                        )}
                        <span className="text-sm text-foreground font-medium">{ev.player?.name || 'Jogador'}</span>
                        {ev.event_type === 'own_goal' && <span className="text-[10px] text-red-400 font-semibold">(GC)</span>}
                        {ev.event_type === 'penalty_scored' && <span className="text-[10px] text-green-400 font-semibold">(P)</span>}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {teamData?.logo_url && <img src={logoUrl(teamData.logo_url, 14)} alt="" width={14} height={14} loading="lazy" decoding="async" className="w-3.5 h-3.5 object-contain" />}
                        <span className="text-[10px] text-muted-foreground">{teamData?.short_name}</span>
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground font-bold" style={{ fontFamily: 'var(--font-mono)' }}>{formatEventTime(ev.minute, ev.half)}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Timeline - FREE (this is the hook — it shows what the app can do) */}
        {!isLive && <section>
            <SectionHeader title="Timeline" icon={Clock} />
            <div className="relative">
              {(() => {
                const getHalfNumber = (ev: MatchEvent): 1 | 2 => {
                  const h = String(ev.half ?? '').toLowerCase().trim();
                  if (h === '1' || h === '1st' || h.includes('first') || h === 'primeiro' || h === '1t') return 1;
                  if (h === '2' || h === '2nd' || h.includes('second') || h === 'segundo' || h === '2t') return 2;
                  if (ev.minute != null && ev.minute <= 45) return 1;
                  return 2;
                };
                // Second yellow detection (runs first to build duplicateRedIds)
                const allSorted = [...events].sort((a, b) => {
                  const ha = getHalfNumber(a), hb = getHalfNumber(b);
                  if (ha !== hb) return ha - hb;
                  return (a.minute ?? 0) - (b.minute ?? 0);
                });
                const secondYellowRedIds = new Set<string>();
                const duplicateRedIds = new Set<string>(); // red_card events to hide (already shown via 2nd yellow)
                const yellowSeen = new Set<string>();
                for (const ev of allSorted) {
                  const pid = ev.player_id;
                  if (!pid) continue;
                  if (ev.event_type === 'yellow_card') {
                    if (yellowSeen.has(pid)) secondYellowRedIds.add(ev.id);
                    yellowSeen.add(pid);
                  }
                  if (ev.event_type === 'red_card' && yellowSeen.has(pid)) {
                    // Hide this red_card — the 2nd yellow already covers it visually
                    duplicateRedIds.add(ev.id);
                  }
                }

                // Filter out duplicate red_card events (2nd yellow already covers them)
                const displayEvents = events.filter(ev => !duplicateRedIds.has(ev.id));
                const firstHalf = displayEvents.filter(ev => getHalfNumber(ev) === 1);
                const secondHalf = displayEvents.filter(ev => getHalfNumber(ev) === 2);

                // Running score
                const runningScoreMap = new Map<string, { home: number; away: number }>();
                let rHome = 0, rAway = 0;
                for (const ev of allSorted) {
                  const isGoalEvent = ['goal', 'own_goal', 'penalty_scored'].includes(ev.event_type);
                  if (isGoalEvent) {
                    if (ev.event_type === 'own_goal') {
                      if (ev.team_id === match.home_team_id) rAway++; else rHome++;
                    } else {
                      if (ev.team_id === match.home_team_id) rHome++; else rAway++;
                    }
                    runningScoreMap.set(ev.id, { home: rHome, away: rAway });
                  }
                }

                const renderEvent = (ev: MatchEvent) => {
                  const isHome = ev.team_id === match.home_team_id;
                  const evIcon = EVENT_ICONS[ev.event_type] || EVENT_ICONS.goal;
                  const isSubstitution = ev.event_type === 'substitution';
                  const isGoalType = ['goal', 'own_goal', 'penalty_scored'].includes(ev.event_type);
                  const isPenaltyMissed = ev.event_type === 'penalty_missed';
                  const isSecondYellow = secondYellowRedIds.has(ev.id);
                  const runningScore = runningScoreMap.get(ev.id);
                  
                  const playerOutId = isSubstitution ? (ev.detail?.player_out_id as string) : null;
                  const playerOut = playerOutId
                    ? (playerOutMap[playerOutId] || lineups.find(l => l.player_id === playerOutId)?.player || null)
                    : null;
                  
                  return (
                    <div key={ev.id} className="relative flex items-start gap-3 pl-1">
                      <div className="w-11 shrink-0 text-right pr-1">
                        <span className="text-[11px] font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                          {ev.minute != null && ev.minute > 0 ? `${ev.minute}'` : '-'}
                        </span>
                      </div>
                      <div className="w-5 h-5 flex items-center justify-center z-10 shrink-0 mt-0.5">
                        {isSecondYellow ? (
                          <SecondYellowIcon size={16} />
                        ) : isPenaltyMissed ? (
                          <PenaltyMissedIcon size={16} className="text-red-400" />
                        ) : evIcon.isCard ? (
                          <div className="w-3 h-4 rounded-[1.5px]" style={{ backgroundColor: ev.event_type === 'yellow_card' ? '#facc15' : '#ef4444' }} />
                        ) : evIcon.isBall ? (
                          <BallIcon size={16} className={ev.event_type === 'own_goal' ? 'text-red-400' : 'text-green-400'} />
                        ) : evIcon.isSub ? (
                          <SubIcon size={16} className="text-blue-400" />
                        ) : (
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold ${evIcon.color}`}>
                            {evIcon.label}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        {isSubstitution ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <svg className="w-3 h-3 text-green-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                              </svg>
                              {ev.player?.number && <span className="text-[10px] text-muted-foreground font-bold" style={{ fontFamily: 'var(--font-mono)' }}>#{ev.player.number}</span>}
                              <span className="text-xs text-foreground font-medium">{ev.player?.name || 'Jogador'}</span>
                            </div>
                            {playerOut && (
                              <div className="flex items-center gap-1.5">
                                <svg className="w-3 h-3 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                                {playerOut.number && <span className="text-[10px] text-muted-foreground/50 font-bold" style={{ fontFamily: 'var(--font-mono)' }}>#{playerOut.number}</span>}
                                <span className="text-xs text-muted-foreground">{playerOut.name}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1 mt-0.5">
                              {(isHome ? match.home_team?.logo_url : match.away_team?.logo_url) && (
                                <img src={logoUrl((isHome ? match.home_team?.logo_url : match.away_team?.logo_url)!, 14)} alt="" width={14} height={14} loading="lazy" decoding="async" className="w-3.5 h-3.5 object-contain" />
                              )}
                              <span className="text-[10px] text-muted-foreground/60">{isHome ? match.home_team?.short_name : match.away_team?.short_name}</span>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs text-foreground font-medium flex items-center gap-1.5 min-w-0">
                                {ev.player?.number && <span className="text-[10px] text-muted-foreground font-bold" style={{ fontFamily: 'var(--font-mono)' }}>#{ev.player.number}</span>}
                                <span className="truncate">{ev.player?.name || 'Jogador'}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-1 mt-0.5">
                              {(isHome ? match.home_team?.logo_url : match.away_team?.logo_url) && (
                                <img src={logoUrl((isHome ? match.home_team?.logo_url : match.away_team?.logo_url)!, 14)} alt="" width={14} height={14} loading="lazy" decoding="async" className="w-3.5 h-3.5 object-contain" />
                              )}
                              <span className="text-[10px] text-muted-foreground">{isHome ? match.home_team?.short_name : match.away_team?.short_name}</span>
                              <span className="text-[10px] text-muted-foreground/60 ml-1">
                                {isSecondYellow ? '2º Amarelo / Expulsão' : (EVENT_LABELS[ev.event_type] || ev.event_type)}
                              </span>
                              {/* Running score inline after goal label */}
                              {isGoalType && runningScore && (
                                <span className="text-[10px] font-extrabold text-primary ml-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
                                  ({runningScore.home}-{runningScore.away})
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                };

                const renderHalfHeader = (label: string) => (
                  <div className="flex items-center gap-2 py-2 pl-1">
                    <div className="w-11 shrink-0" />
                    <div className="flex-1 flex items-center gap-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap" style={{ fontFamily: 'var(--font-heading)' }}>{label}</span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
                  </div>
                );

                return (
                  <>
                    {firstHalf.length > 0 && (
                      <>{renderHalfHeader('1º Tempo')}<div className="relative"><div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" /><div className="space-y-1">{firstHalf.map(renderEvent)}</div></div></>
                    )}
                    {secondHalf.length > 0 && (
                      <>{renderHalfHeader('Intervalo')}{renderHalfHeader('2º Tempo')}<div className="relative"><div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" /><div className="space-y-1">{secondHalf.map(renderEvent)}</div></div></>
                    )}
                    {firstHalf.length === 0 && secondHalf.length === 0 && displayEvents.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum evento registrado</p>
                    )}
                    {firstHalf.length === 0 && secondHalf.length === 0 && displayEvents.length > 0 && (
                      <div className="relative"><div className="absolute left-[22px] top-0 bottom-0 w-px bg-border" /><div className="space-y-1">{displayEvents.map(renderEvent)}</div></div>
                    )}
                    {isFinished && (firstHalf.length > 0 || secondHalf.length > 0) && renderHalfHeader('Fim de Jogo')}
                  </>
                );
              })()}
            </div>
          </section>
        }

        {/* Tactical Pitch - PREMIUM (always show for finished/live — MatchFormationView handles empty state) */}
        {(isFinished || match.status === 'live') && (
          <PremiumGate label="Campinho Tatico">
            <section>
              <SectionHeader title="Formação" icon={Shield} />
              <FormationToggle
                matchId={match.id}
                homeTeam={match.home_team}
                awayTeam={match.away_team}
                lineups={lineups}
                events={events}
                homeStarters={homeStarters}
                awayStarters={awayStarters}
                matchExtraData={match.extra_data}
                onPlayerClick={(playerId) => navigate(`/jogador/${playerId}`)}
              />
            </section>
          </PremiumGate>
        )}

        {/* Lineups list - PREMIUM (always show for finished/live — shows fallback if empty) */}
        {(isFinished || match.status === 'live') && (
          <PremiumGate label="Escalações">
            <section>
              <SectionHeader title="Escalações" icon={ClipboardList} />
              {(homeLineup.length > 0 || awayLineup.length > 0) ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase" style={{ fontFamily: 'var(--font-heading)' }}>{match.home_team?.short_name}</p>
                  <div className="space-y-0.5">
                    {homeStarters.map(l => (
                      <div key={l.id} className="flex items-center gap-1.5 text-xs text-foreground py-0.5">
                        <span className="text-[10px] text-muted-foreground w-5 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{l.player?.number}</span>
                        <span className="truncate">{l.player?.name}</span>
                      </div>
                    ))}
                    {homeSubs.length > 0 && (<><p className="text-[9px] text-subtle mt-2 mb-1 uppercase">Reservas</p>{homeSubs.map(l => (<div key={l.id} className="flex items-center gap-1.5 text-xs text-muted-foreground py-0.5"><span className="text-[10px] text-subtle w-5 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{l.player?.number}</span><span className="truncate">{l.player?.name}</span></div>))}</>)}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold mb-2 uppercase text-right" style={{ fontFamily: 'var(--font-heading)' }}>{match.away_team?.short_name}</p>
                  <div className="space-y-0.5">
                    {awayStarters.map(l => (
                      <div key={l.id} className="flex items-center gap-1.5 text-xs text-foreground py-0.5 justify-end">
                        <span className="truncate">{l.player?.name}</span>
                        <span className="text-[10px] text-muted-foreground w-5 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{l.player?.number}</span>
                      </div>
                    ))}
                    {awaySubs.length > 0 && (<><p className="text-[9px] text-subtle mt-2 mb-1 uppercase text-right">Reservas</p>{awaySubs.map(l => (<div key={l.id} className="flex items-center gap-1.5 text-xs text-muted-foreground py-0.5 justify-end"><span className="truncate">{l.player?.name}</span><span className="text-[10px] text-subtle w-5 text-center" style={{ fontFamily: 'var(--font-mono)' }}>{l.player?.number}</span></div>))}</>)}
                  </div>
                </div>
              </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Escalações não cadastradas para esta partida</p>
              )}
            </section>
          </PremiumGate>
        )}

        {/* ====== UNIFIED INFOGRAPHIC: Stats + Championship ====== */}
        <PremiumGate label="Raio-X da Partida" blur>
          <section>
            <SectionHeader title="Raio-X da Partida" icon={TrendingUp} />
            <div className="rounded-2xl overflow-hidden border border-border/50 bg-card shadow-sm">
              {/* Gradient header with team logos */}
              <div
                className="relative px-4 py-3 flex items-center justify-between"
                style={{
                  background: `linear-gradient(135deg, ${match.home_team?.color || '#6366f1'}20 0%, transparent 50%, ${match.away_team?.color || '#22c55e'}20 100%)`,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div className="flex items-center gap-2">
                  {match.home_team?.logo_url && <img src={logoUrl(match.home_team.logo_url, 28)} alt="" width={28} height={28} loading="lazy" decoding="async" className="w-7 h-7 object-contain" />}
                  <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{match.home_team?.short_name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>Raio-X</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>{match.away_team?.short_name}</span>
                  {match.away_team?.logo_url && <img src={logoUrl(match.away_team.logo_url, 28)} alt="" width={28} height={28} loading="lazy" decoding="async" className="w-7 h-7 object-contain" />}
                </div>
              </div>

              {/* Match stats bars */}
              <div className="px-4 py-3 space-y-2.5">
                <StatBar label="Gols" home={homeGoalsTotal + awayOwnGoals} away={awayGoalsTotal + homeOwnGoals} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />
                {hasTeamStats && (
                  <>
                    {(homeStats?.possession_pct != null || awayStats?.possession_pct != null) && <StatBar label="Posse de Bola" home={homeStats?.possession_pct ?? 50} away={awayStats?.possession_pct ?? 50} homeColor={match.home_team?.color} awayColor={match.away_team?.color} suffix="%" />}
                    {(homeStats?.shots_total != null || awayStats?.shots_total != null) && <StatBar label="Finalizações" home={homeStats?.shots_total ?? 0} away={awayStats?.shots_total ?? 0} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />}
                    {(homeStats?.shots_on_target != null || awayStats?.shots_on_target != null) && <StatBar label="No Gol" home={homeStats?.shots_on_target ?? 0} away={awayStats?.shots_on_target ?? 0} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />}
                    {(homeStats?.passes_total != null || awayStats?.passes_total != null) && <StatBar label="Passes" home={homeStats?.passes_total ?? 0} away={awayStats?.passes_total ?? 0} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />}
                    {(homeStats?.passes_completed != null || awayStats?.passes_completed != null) && (homeStats?.passes_total ?? 0) > 0 && (
                      <StatBar
                        label="Precisão Passes"
                        home={Math.round(((homeStats?.passes_completed ?? 0) / Math.max(homeStats?.passes_total ?? 1, 1)) * 100)}
                        away={Math.round(((awayStats?.passes_completed ?? 0) / Math.max(awayStats?.passes_total ?? 1, 1)) * 100)}
                        homeColor={match.home_team?.color} awayColor={match.away_team?.color} suffix="%"
                      />
                    )}
                    {(homeStats?.corners != null || awayStats?.corners != null) && <StatBar label="Escanteios" home={homeStats?.corners ?? 0} away={awayStats?.corners ?? 0} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />}
                    {(homeStats?.fouls_committed != null || awayStats?.fouls_committed != null) && <StatBar label="Faltas" home={homeStats?.fouls_committed ?? 0} away={awayStats?.fouls_committed ?? 0} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />}
                    {(homeStats?.offsides != null || awayStats?.offsides != null) && <StatBar label="Impedimentos" home={homeStats?.offsides ?? 0} away={awayStats?.offsides ?? 0} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />}
                    {(homeStats?.saves != null || awayStats?.saves != null) && <StatBar label="Defesas" home={homeStats?.saves ?? 0} away={awayStats?.saves ?? 0} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />}
                  </>
                )}
                <StatBar label="Cartões Amarelos" home={homeYellows} away={awayYellows} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />
                <StatBar label="Cartões Vermelhos" home={homeReds} away={awayReds} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />
                <StatBar label="Substituições" home={homeSubs2} away={awaySubs2} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />
                {hasRatings && (
                  <StatBar
                    label="Nota Média"
                    home={parseFloat(homeAvgRating.toFixed(1))}
                    away={parseFloat(awayAvgRating.toFixed(1))}
                    homeColor={match.home_team?.color} awayColor={match.away_team?.color}
                  />
                )}
              </div>

              {/* Seamless divider into championship section */}
              {homeStanding && awayStanding && (
                <>
                  <div className="flex items-center gap-3 px-4 py-1">
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${match.home_team?.color || '#6366f1'}40, transparent)` }} />
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Target className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider" style={{ fontFamily: 'var(--font-heading)' }}>No Campeonato</span>
                    </div>
                    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, transparent, ${match.away_team?.color || '#22c55e'}40)` }} />
                  </div>

                  {/* Posição + Pontos highlight cards */}
                  <div className="px-4 pt-2 pb-1 grid grid-cols-2 gap-2">
                    {[
                      { label: 'Posição', home: homePosition, away: awayPosition, lowerBetter: true, suffix: 'º' },
                      { label: 'Pontos', home: homeStanding.points, away: awayStanding.points, lowerBetter: false, suffix: '' },
                    ].map(item => {
                      const hColor = match.home_team?.color || '#6366f1';
                      const aColor = match.away_team?.color || '#22c55e';
                      const homeBetter = item.lowerBetter ? item.home < item.away : item.home > item.away;
                      const awayBetter = item.lowerBetter ? item.away < item.home : item.away > item.home;
                      return (
                        <div key={item.label} className="rounded-lg bg-secondary/10 p-2.5 text-center">
                          <p className="text-[9px] text-muted-foreground uppercase font-semibold mb-1">{item.label}</p>
                          <div className="flex items-center justify-center gap-4">
                            <span className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-mono)', color: homeBetter ? hColor : awayBetter ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
                              {item.home}{item.suffix}
                            </span>
                            <span className="text-[10px] text-muted-foreground/40">vs</span>
                            <span className="text-lg font-extrabold" style={{ fontFamily: 'var(--font-mono)', color: awayBetter ? aColor : homeBetter ? 'var(--muted-foreground)' : 'var(--foreground)' }}>
                              {item.away}{item.suffix}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Numeric championship stats as StatBars */}
                  <div className="px-4 pt-1 pb-3 space-y-2.5">
                    <StatBar label="Jogos" home={homeStanding.played} away={awayStanding.played} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />
                    <StatBar label="Vitórias" home={homeStanding.wins} away={awayStanding.wins} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />
                    <StatBar label="Gols Pró" home={homeStanding.goalsFor} away={awayStanding.goalsFor} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />
                    <StatBar label="Gols Contra" home={homeStanding.goalsAgainst} away={awayStanding.goalsAgainst} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />
                    <StatBar label="Saldo de Gols" home={homeStanding.goalDifference} away={awayStanding.goalDifference} homeColor={match.home_team?.color} awayColor={match.away_team?.color} />
                  </div>
                </>
              )}
            </div>
          </section>
        </PremiumGate>

      </div>
    </div>
    </PageTransition>
  );
}