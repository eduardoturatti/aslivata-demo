// ============================================================
// PUBLIC SUPABASE — Mock version for standalone demo
// ============================================================
import { TEAMS, MATCHES, SCORER_PLAYERS, STANDINGS_DATA } from './mock-data';
import { ALL_PLAYERS, MOCK_EVENTS } from './mock-events';

export const supabase = {} as any;
export const COMPETITION_ID = '00000000-0000-0000-0001-000000000001';

// Types
export interface Team {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  color: string;
  color_detail: string;
  text_color: string;
  logo_url: string;
  coach: string;
  default_tactic: string;
  city: string;
  stadium: string;
  founded_year?: number;
  president?: string;
  colors_description?: string;
  photo_url?: string;
  discipline_points?: number;
  total_goals_scored?: number;
  total_goals_conceded?: number;
  total_yellow_cards?: number;
  total_red_cards?: number;
  total_wins?: number;
  total_draws?: number;
  total_losses?: number;
}

export interface Player {
  id: string;
  team_id: string;
  name: string;
  number: string;
  position: string;
  photo_url: string;
  stats: Record<string, unknown>;
  team?: Team;
  birth_date?: string;
  height_cm?: number;
  weight_kg?: number;
  dominant_foot?: string;
  nationality?: string;
  total_games?: number;
  total_goals?: number;
  total_assists?: number;
  total_yellow_cards?: number;
  total_red_cards?: number;
  total_minutes?: number;
  avg_rating?: number;
  is_suspended?: boolean;
  suspension_until?: string;
  yellow_card_accumulator?: number;
}

export interface Match {
  id: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  round_name: string;
  round_number: number;
  title: string;
  match_date: string;
  location: string;
  score_home: number | null;
  score_away: number | null;
  previous_score_home: string | null;
  previous_score_away: string | null;
  status: string;
  broadcast: boolean;
  extra_data: Record<string, unknown>;
  home_team?: Team;
  away_team?: Team;
  referee?: string;
  assistant_referee_1?: string;
  assistant_referee_2?: string;
  attendance?: number;
  mvp_player_id?: string;
  notes?: string;
  stoppage_time_1st?: number;
  stoppage_time_2nd?: number;
  penalty_score_home?: number;
  penalty_score_away?: number;
  scout_status?: string;
  scout_started_at?: string;
  scout_half1_end?: string;
  scout_half2_start?: string;
  scout_ended_at?: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  event_type: string;
  minute: number;
  half: string;
  detail: Record<string, unknown>;
  created_at: string;
  player?: { name: string; number: string; id?: string; team_id?: string; photo_url?: string; position?: string };
  team?: { short_name: string; logo_url?: string; name?: string };
}

export function formatEventTime(minute: number | null | undefined, half: string | null | undefined): string {
  if (minute == null || minute <= 0) return '';
  const halfLabel = getHalfLabel(half, minute);
  return `${minute}' ${halfLabel}`;
}

export function getHalfLabel(half: string | null | undefined, minute: number): string {
  const h = String(half ?? '').toLowerCase().trim();
  if (h === '1' || h === '1st' || h.includes('first') || h === 'primeiro' || h === '1t') return '1ºT';
  if (h === '2' || h === '2nd' || h.includes('second') || h === 'segundo' || h === '2t') return '2ºT';
  return minute <= 45 ? '1ºT' : '2ºT';
}

export interface MatchLineup {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  is_starter: boolean;
  lineup_position: number;
  player?: Player;
}

export interface StandingRow {
  team: Team;
  points: number;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  yellowCards: number;
  redCards: number;
  discipline: number;
  form: ('W' | 'D' | 'L')[];
}

export interface MatchTeamStats {
  id: string;
  match_id: string;
  team_id: string;
  possession_pct?: number;
  passes_total?: number;
  passes_completed?: number;
  shots_total?: number;
  shots_on_target?: number;
  shots_off_target?: number;
  shots_blocked?: number;
  saves?: number;
  fouls_committed?: number;
  fouls_suffered?: number;
  offsides?: number;
  corners?: number;
  yellow_cards?: number;
  red_cards?: number;
}

export interface MatchPlayerStats {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  minutes_played?: number;
  is_starter?: boolean;
  goals?: number;
  assists?: number;
  shots?: number;
  shots_on_target?: number;
  yellow_cards?: number;
  red_cards?: number;
  saves?: number;
  goals_conceded?: number;
  clean_sheet?: boolean;
  rating?: number;
  is_mvp?: boolean;
  player?: { name: string; number: string; position: string; photo_url: string };
}

// ============================
// MOCK API FUNCTIONS
// ============================
function sqlTeamToPublicTeam(t: any): Team {
  return {
    ...t,
    text_color: t.text_color || '',
    coach: t.coach || '',
    default_tactic: t.default_tactic || '',
    stadium: t.stadium || '',
    total_wins: STANDINGS_DATA.find(s => s.teamId === t.slug)?.v,
    total_draws: STANDINGS_DATA.find(s => s.teamId === t.slug)?.e,
    total_losses: STANDINGS_DATA.find(s => s.teamId === t.slug)?.d,
    total_goals_scored: STANDINGS_DATA.find(s => s.teamId === t.slug)?.gp,
    total_goals_conceded: STANDINGS_DATA.find(s => s.teamId === t.slug)?.gc,
    total_yellow_cards: STANDINGS_DATA.find(s => s.teamId === t.slug)?.ca,
    total_red_cards: STANDINGS_DATA.find(s => s.teamId === t.slug)?.cv,
    discipline_points: STANDINGS_DATA.find(s => s.teamId === t.slug)?.disc,
  };
}

export async function fetchTeams(_forceRefresh = false): Promise<Team[]> {
  return TEAMS.map(sqlTeamToPublicTeam);
}

export async function fetchTeamBySlug(slug: string): Promise<Team | null> {
  const t = TEAMS.find(x => x.slug === slug);
  return t ? sqlTeamToPublicTeam(t) : null;
}

export async function fetchTeamById(id: string): Promise<Team | null> {
  const t = TEAMS.find(x => x.id === id);
  return t ? sqlTeamToPublicTeam(t) : null;
}

export async function fetchPlayersByTeam(teamId: string): Promise<Player[]> {
  return ALL_PLAYERS.filter(p => p.team_id === teamId).map(p => ({
    ...p, photo_url: p.photo_url || '', stats: {},
  })) as Player[];
}

export async function fetchPlayerById(playerId: string): Promise<Player | null> {
  const p = ALL_PLAYERS.find(x => x.id === playerId);
  if (!p) return null;
  const team = TEAMS.find(t => t.id === p.team_id);
  return { ...p, photo_url: p.photo_url || '', stats: {}, team: team ? sqlTeamToPublicTeam(team) : undefined } as Player;
}

export async function fetchPlayersByIds(playerIds: string[]): Promise<Player[]> {
  return ALL_PLAYERS.filter(p => playerIds.includes(p.id)).map(p => ({
    ...p, photo_url: p.photo_url || '', stats: {},
  })) as Player[];
}

export async function fetchMatches(_forceRefresh = false): Promise<Match[]> {
  return MATCHES.map(m => ({
    ...m,
    title: m.title || '',
    round_name: m.round_name || '',
    previous_score_home: null,
    previous_score_away: null,
    extra_data: {},
    home_team: m.home_team ? sqlTeamToPublicTeam(m.home_team) : undefined,
    away_team: m.away_team ? sqlTeamToPublicTeam(m.away_team) : undefined,
  })) as Match[];
}

export function invalidateMatchesCache() {}

export async function fetchMatchById(matchId: string): Promise<Match | null> {
  const m = MATCHES.find(x => x.id === matchId);
  if (!m) return null;
  return {
    ...m,
    title: m.title || '',
    round_name: m.round_name || '',
    previous_score_home: null,
    previous_score_away: null,
    extra_data: {},
    home_team: m.home_team ? sqlTeamToPublicTeam(m.home_team) : undefined,
    away_team: m.away_team ? sqlTeamToPublicTeam(m.away_team) : undefined,
  } as Match;
}

export async function fetchMatchEvents(matchId: string): Promise<MatchEvent[]> {
  return MOCK_EVENTS
    .filter(ev => ev.match_id === matchId)
    .map(ev => {
      const player = ALL_PLAYERS.find(p => p.id === ev.player_id);
      const team = TEAMS.find(t => t.id === ev.team_id);
      return {
        id: ev.id,
        match_id: ev.match_id,
        team_id: ev.team_id,
        player_id: ev.player_id,
        event_type: ev.event_type,
        minute: ev.minute,
        half: ev.half,
        detail: ev.detail || {},
        created_at: '',
        player: player ? { name: player.name, number: player.number, id: player.id, team_id: player.team_id, photo_url: player.photo_url || '', position: player.position } : undefined,
        team: team ? { short_name: team.short_name, logo_url: team.logo_url, name: team.name } : undefined,
      };
    })
    .sort((a, b) => a.minute - b.minute);
}
export async function fetchMatchLineups(_matchId: string): Promise<MatchLineup[]> { return []; }
export async function fetchPlayerLineups(_playerId: string): Promise<MatchLineup[]> { return []; }
export async function fetchAllEvents(): Promise<MatchEvent[]> {
  return MOCK_EVENTS.map(ev => {
    const player = ALL_PLAYERS.find(p => p.id === ev.player_id);
    const team = TEAMS.find(t => t.id === ev.team_id);
    return {
      id: ev.id,
      match_id: ev.match_id,
      team_id: ev.team_id,
      player_id: ev.player_id,
      event_type: ev.event_type,
      minute: ev.minute,
      half: ev.half,
      detail: ev.detail || {},
      created_at: '',
      player: player ? { name: player.name, number: player.number, id: player.id, team_id: player.team_id, photo_url: player.photo_url || '', position: player.position } : undefined,
      team: team ? { short_name: team.short_name, logo_url: team.logo_url, name: team.name } : undefined,
    };
  });
}

export function calculateStandings(_matches: Match[], teams: Team[], _events?: MatchEvent[]): StandingRow[] {
  return STANDINGS_DATA.map(s => {
    const team = teams.find(t => t.slug === s.teamId) || teams[0];
    return {
      team,
      points: s.tpg,
      played: s.j,
      wins: s.v,
      draws: s.e,
      losses: s.d,
      goalsFor: s.gp,
      goalsAgainst: s.gc,
      goalDifference: s.sg,
      yellowCards: s.ca,
      redCards: s.cv,
      discipline: s.disc,
      form: [] as ('W' | 'D' | 'L')[],
    };
  });
}

export async function fetchMatchTeamStats(_matchId: string): Promise<MatchTeamStats[]> { return []; }
export async function fetchMatchPlayerStats(_matchId: string): Promise<MatchPlayerStats[]> { return []; }

export async function fetchAllPlayers(_forceRefresh = false): Promise<Player[]> {
  return ALL_PLAYERS.map(p => {
    const team = TEAMS.find(t => t.id === p.team_id);
    return { ...p, photo_url: p.photo_url || '', stats: {}, team: team ? sqlTeamToPublicTeam(team) : undefined } as Player;
  });
}

export function buildStandingsFromTeams(teams: Team[], matches?: Match[]): StandingRow[] {
  return calculateStandings(matches || [], teams);
}
