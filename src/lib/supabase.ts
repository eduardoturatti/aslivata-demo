// ============================================================
// MOCK SUPABASE — Returns hardcoded data for standalone demo
// ============================================================
import { TEAMS, MATCHES, SCORER_PLAYERS, SCORERS, STANDINGS_DATA } from './mock-data';
import { ALL_PLAYERS, MOCK_EVENTS } from './mock-events';

export const supabase = {} as any; // Not used
export const COMPETITION_ID = '00000000-0000-0000-0001-000000000001';

// ============================
// SQL TYPES
// ============================
export interface SQLCompetition {
  id: string;
  name: string;
  short_name?: string;
  year: number;
  type?: string;
  status: string;
  config?: any;
  rules_url?: string;
  logo_url?: string;
  organizer?: string;
  sponsor?: string;
  yellow_cards_suspension?: number;
  red_card_fine?: number;
  max_discipline_points?: number;
  min_games_playoff?: number;
  created_at: string;
}

export interface SQLTeam {
  id: string;
  name: string;
  short_name: string;
  slug: string;
  logo_url: string;
  color: string;
  color_detail?: string;
  text_color?: string;
  stadium?: string;
  city?: string;
  coach?: string;
  default_tactic?: string;
  president?: string;
  founded_year?: number;
  colors_description?: string;
  badge_url?: string;
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

export interface SQLPlayer {
  id: string;
  team_id: string;
  name: string;
  real_name?: string;
  number: string;
  position: string;
  photo_url?: string;
  stats?: any;
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
  created_at?: string;
}

export interface SQLMatch {
  id: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  round_number: number;
  round_name?: string;
  title?: string;
  match_date: string;
  location: string;
  status: 'scheduled' | 'live' | 'finished' | 'postponed';
  score_home: number | null;
  score_away: number | null;
  previous_score_home?: string;
  previous_score_away?: string;
  broadcast: boolean;
  extra_data?: any;
  referee?: string;
  assistant_referee_1?: string;
  assistant_referee_2?: string;
  fourth_official?: string;
  attendance?: number | null;
  stadium_name?: string;
  mvp_player_id?: string | null;
  notes?: string;
  stoppage_time_1st?: number;
  stoppage_time_2nd?: number;
  penalty_score_home?: number;
  penalty_score_away?: number;
  home_team?: SQLTeam;
  away_team?: SQLTeam;
  created_at?: string;
  scout_status?: string;
  scout_started_at?: string;
  scout_half1_end?: string;
  scout_half2_start?: string;
  scout_ended_at?: string;
}

export interface SQLMatchEvent {
  id: string;
  match_id: string;
  event_type: 'goal' | 'yellow_card' | 'red_card' | 'substitution' | 'penalty_scored' | 'penalty_missed' | 'own_goal';
  player_id: string;
  team_id: string;
  minute: number;
  half: string;
  detail?: any;
  player?: SQLPlayer;
  team?: SQLTeam;
}

export interface SQLMatchTeamStats {
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
  free_kicks?: number;
  throw_ins?: number;
  goal_kicks?: number;
  yellow_cards?: number;
  red_cards?: number;
  created_at?: string;
}

export interface SQLMatchLineup {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  is_starter: boolean;
  lineup_position?: number;
  player?: SQLPlayer;
}

export interface SQLMatchPlayerStats {
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
  fouls_committed?: number;
  fouls_suffered?: number;
  saves?: number;
  goals_conceded?: number;
  clean_sheet?: boolean;
  rating?: number;
  is_mvp?: boolean;
  created_at?: string;
}

export interface SQLDisciplinaryRecord {
  id: string;
  competition_id: string;
  player_id?: string;
  team_id: string;
  record_type: string;
  reason?: string;
  source_match_id?: string;
  games_suspended?: number;
  games_served?: number;
  is_active?: boolean;
  fine_amount?: number;
  fine_paid?: boolean;
  discipline_points?: number;
  notes?: string;
  created_at?: string;
}

// ============================
// COMPUTED TYPES
// ============================
export interface StandingEntry {
  pos: number;
  teamId: string;
  team?: SQLTeam;
  tpg: number;
  j: number;
  v: number;
  e: number;
  d: number;
  gp: number;
  gc: number;
  sg: number;
  ca: number;
  cv: number;
  disc: number;
  pct: number;
}

export interface ScorerEntry {
  playerId: string;
  playerName: string;
  teamSlug: string;
  teamName: string;
  teamLogo: string;
  teamColor: string;
  goals: number;
  photo?: string;
  number?: number;
}

export interface AssistEntry {
  playerId: string;
  playerName: string;
  teamSlug: string;
  teamName: string;
  teamLogo: string;
  teamColor: string;
  assists: number;
  photo?: string;
  number?: number;
}

export interface CardEntry {
  playerId: string;
  playerName: string;
  teamSlug: string;
  teamName: string;
  teamLogo: string;
  teamColor: string;
  yellowCards: number;
  redCards: number;
  disciplinePoints: number;
  photo?: string;
  number?: number;
}

export interface TeamDiscipline {
  teamSlug: string;
  teamName: string;
  teamLogo: string;
  teamColor: string;
  yellowCards: number;
  redCards: number;
  disciplinePoints: number;
}

export interface SuspensionEntry {
  playerId: string;
  playerName: string;
  teamSlug: string;
  teamName: string;
  teamLogo: string;
  teamColor: string;
  yellowCards: number;
  isPendurado: boolean;
  isSuspended: boolean;
  suspensionGames: number;
  photo?: string;
  number?: number;
}

// ============================
// LEGACY FORMAT
// ============================
export interface Team {
  name: string;
  short: string;
  logo: string;
  primaryColor?: string;
  secondaryColor?: string;
  stadium?: string;
  players?: PlayerLegacy[];
}

export interface PlayerLegacy {
  id: string;
  name: string;
  number?: string | number;
  position?: string;
  photo?: string;
}

export interface Match {
  city: string;
  datetime: string;
  home: string;
  away: string;
  scoreHome: number | null;
  scoreAway: number | null;
  broadcast?: boolean;
  matchId?: string;
  status?: string;
}

export interface Round {
  name: string;
  matches: Match[];
}

export interface PlayoffMatch {
  team1: string;
  team2: string;
  score1Ida: number | null;
  score2Ida: number | null;
  score1Volta: number | null;
  score2Volta: number | null;
  winner?: string;
  penalties1?: number | null;
  penalties2?: number | null;
}

export interface PlayoffRound {
  name: string;
  matches: PlayoffMatch[];
}

export interface TournamentData {
  teams: Record<string, Team>;
  rounds: Round[];
  standings: StandingEntry[];
  playoffRounds?: PlayoffRound[];
  teamAnalysis?: Record<string, any>;
}

// ============================
// MOCK QUERY FUNCTIONS — Return hardcoded data
// ============================
const MOCK_COMPETITION: SQLCompetition = {
  id: COMPETITION_ID,
  name: '26ª Regional Certel/Sicredi 2025 - Série A',
  short_name: 'Regional 2025',
  year: 2025,
  status: 'finished',
  yellow_cards_suspension: 3,
  organizer: 'ASLIVATA',
  sponsor: 'Certel / Sicredi',
  created_at: '2025-01-01T00:00:00Z',
};

export async function fetchCompetition(_id?: string): Promise<SQLCompetition | null> {
  return MOCK_COMPETITION;
}

export async function fetchTeams(_competitionId?: string): Promise<SQLTeam[]> {
  return TEAMS;
}

export async function fetchMatches(_competitionId?: string): Promise<SQLMatch[]> {
  return MATCHES;
}

export async function fetchPlayers(_teamIds: string[]): Promise<SQLPlayer[]> {
  return ALL_PLAYERS;
}

export async function fetchAllEvents(_matchIds: string[]): Promise<SQLMatchEvent[]> {
  // Enrich events with player/team references
  return MOCK_EVENTS.map(ev => ({
    ...ev,
    player: ALL_PLAYERS.find(p => p.id === ev.player_id),
    team: TEAMS.find(t => t.id === ev.team_id),
  }));
}

export async function fetchMatchTeamStats(_matchId: string): Promise<SQLMatchTeamStats[]> { return []; }
export async function fetchMatchById(matchId: string): Promise<SQLMatch | null> {
  return MATCHES.find(m => m.id === matchId) || null;
}
export async function fetchMatchLineups(_matchId: string): Promise<SQLMatchLineup[]> { return []; }
export async function fetchMatchPlayerStats(_matchId: string): Promise<SQLMatchPlayerStats[]> { return []; }
export async function fetchDisciplinaryRecords(_competitionId?: string): Promise<SQLDisciplinaryRecord[]> { return []; }

// Mutation stubs (no-ops for demo)
export async function updateMatch(..._args: any[]) {}
export async function upsertTeam(..._args: any[]) {}
export async function updateTeam(..._args: any[]) {}
export async function upsertPlayer(..._args: any[]) {}
export async function deletePlayer(..._args: any[]) {}
export async function insertMatch(..._args: any[]) {}
export async function deleteMatch(..._args: any[]) {}
export async function insertMatchEvent(..._args: any[]) {}
export async function deleteMatchEvent(..._args: any[]) {}
export async function upsertMatchTeamStats(..._args: any[]) {}
export async function updateMatchEvent(..._args: any[]) {}
export async function upsertMatchLineup(..._args: any[]) {}
export async function upsertMatchLineups(..._args: any[]) {}
export async function deleteMatchLineup(..._args: any[]) {}
export async function clearMatchLineups(..._args: any[]) {}
export async function clearMatchEvents(..._args: any[]) {}
export async function upsertMatchPlayerStats(..._args: any[]) {}
export async function fetchAllMatchLineups(..._args: any[]): Promise<SQLMatchLineup[]> { return []; }
export async function fetchAllMatchPlayerStats(..._args: any[]): Promise<SQLMatchPlayerStats[]> { return []; }
export async function fetchCompetitions(): Promise<SQLCompetition[]> { return [MOCK_COMPETITION]; }
export async function insertTeam(..._args: any[]) { return null; }
export async function deleteTeam(..._args: any[]) {}
export async function insertCompetition(..._args: any[]) { return null; }
export async function updateCompetition(..._args: any[]) {}
export async function deleteCompetition(..._args: any[]) {}
export async function addTeamToCompetition(..._args: any[]) {}
export async function removeTeamFromCompetition(..._args: any[]) {}
export async function fetchAllTeams(): Promise<SQLTeam[]> { return TEAMS; }

// ============================
// DATA TRANSFORMATION (SQL → Legacy format)
// ============================
export function transformToTournamentData(
  teams: SQLTeam[],
  matches: SQLMatch[],
  players: SQLPlayer[],
  events: SQLMatchEvent[]
): TournamentData {
  const teamsMap: Record<string, Team> = {};
  for (const team of teams) {
    teamsMap[team.slug] = {
      name: team.name,
      short: team.short_name,
      logo: team.logo_url || '',
      primaryColor: team.color || '#3B82F6',
      secondaryColor: team.color_detail || undefined,
      stadium: team.stadium || '',
      players: players
        .filter(p => p.team_id === team.id)
        .map(p => ({ id: p.id, name: p.name, number: p.number, position: p.position || 'Atacante', photo: p.photo_url })),
    };
  }

  const roundsMap: Record<string, Match[]> = {};
  const roundOrder: string[] = [];

  for (const match of matches) {
    const roundName = match.round_name || `Rodada ${match.round_number || 1}`;
    if (!roundsMap[roundName]) {
      roundsMap[roundName] = [];
      roundOrder.push(roundName);
    }
    let datetimeStr = '';
    if (match.match_date) {
      try {
        const d = new Date(match.match_date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const weekdays = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
        const weekday = weekdays[d.getDay()];
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        datetimeStr = `${day}/${month} \u2022 ${weekday} \u2022 ${hours}:${minutes}`;
      } catch { datetimeStr = '15:30'; }
    }
    roundsMap[roundName].push({
      home: match.home_team?.slug || '',
      away: match.away_team?.slug || '',
      scoreHome: match.score_home,
      scoreAway: match.score_away,
      city: match.location || '',
      datetime: datetimeStr,
      broadcast: match.broadcast || false,
      matchId: match.id,
      status: match.status,
    });
  }

  const rounds: Round[] = roundOrder.map(name => ({ name, matches: roundsMap[name] }));

  // Use pre-computed standings from mock data
  return { teams: teamsMap, rounds, standings: STANDINGS_DATA, playoffRounds: [], teamAnalysis: {} };
}

// ============================
// STATISTICS COMPUTATIONS
// ============================
export function computeTopScorers(events: SQLMatchEvent[], players: SQLPlayer[], teams: SQLTeam[]): ScorerEntry[] {
  const goals: Record<string, number> = {};
  for (const ev of events) {
    if (ev.event_type === 'goal' || ev.event_type === 'penalty_scored') {
      goals[ev.player_id] = (goals[ev.player_id] || 0) + 1;
    }
  }
  return Object.entries(goals)
    .map(([pid, g]) => {
      const p = players.find(x => x.id === pid);
      const t = teams.find(x => x.id === p?.team_id);
      return { playerId: pid, playerName: p?.name || '?', teamSlug: t?.slug || '', teamName: t?.short_name || '', teamLogo: t?.logo_url || '', teamColor: t?.color || '#3B82F6', goals: g, photo: p?.photo_url, number: p?.number };
    })
    .sort((a, b) => b.goals - a.goals);
}

export function computeTopAssists(_events: SQLMatchEvent[], _players: SQLPlayer[], _teams: SQLTeam[]): AssistEntry[] {
  return []; // No assist data in demo
}

export function computeCardRanking(events: SQLMatchEvent[], players: SQLPlayer[], teams: SQLTeam[]): CardEntry[] {
  const cards: Record<string, { y: number; r: number }> = {};
  for (const ev of events) {
    if (ev.event_type === 'yellow_card') { if (!cards[ev.player_id]) cards[ev.player_id] = { y: 0, r: 0 }; cards[ev.player_id].y++; }
    if (ev.event_type === 'red_card') { if (!cards[ev.player_id]) cards[ev.player_id] = { y: 0, r: 0 }; cards[ev.player_id].r++; }
  }
  return Object.entries(cards)
    .map(([pid, c]) => {
      const p = players.find(x => x.id === pid);
      const t = teams.find(x => x.id === p?.team_id);
      return { playerId: pid, playerName: p?.name || '?', teamSlug: t?.slug || '', teamName: t?.short_name || '', teamLogo: t?.logo_url || '', teamColor: t?.color || '#3B82F6', yellowCards: c.y, redCards: c.r, disciplinePoints: c.y * 10 + c.r * 50, photo: p?.photo_url, number: p?.number };
    })
    .sort((a, b) => b.disciplinePoints - a.disciplinePoints);
}

export function computeTeamDiscipline(_events: SQLMatchEvent[], teams: SQLTeam[]): TeamDiscipline[] {
  return STANDINGS_DATA.map(s => {
    const t = teams.find(x => x.slug === s.teamId);
    return {
      teamSlug: s.teamId,
      teamName: t?.short_name || '',
      teamLogo: t?.logo_url || '',
      teamColor: t?.color || '#3B82F6',
      yellowCards: s.ca,
      redCards: s.cv,
      disciplinePoints: s.ca * 10 + s.cv * 50,
    };
  }).sort((a, b) => a.disciplinePoints - b.disciplinePoints);
}

export function computeSuspensions(_events: SQLMatchEvent[], _players: SQLPlayer[], _teams: SQLTeam[], _yellowsForSuspension = 3): SuspensionEntry[] {
  return []; // No suspension data in demo
}

export async function recalculateAllStats(_competitionId?: string) {
  return { teamsUpdated: 0, playersUpdated: 0, errors: [] };
}
