// Mock scout-api - no real connection needed

// ============================
// TYPES
// ============================
export interface TeamInfo {
  id: string;
  name: string;
  short_name: string;
  color?: string;
  text_color?: string;
  logo_url?: string;
}

export interface MatchInfo {
  id: string;
  match_date: string;
  status: string;
  round: number;
  venue?: string;
  competition_id: string;
  scout_status: string;
  scout_started_at?: string;
  scout_half1_end?: string;
  scout_half2_start?: string;
  scout_ended_at?: string;
  score_home?: number;
  score_away?: number;
  home_team: TeamInfo;
  away_team: TeamInfo;
}

export interface TokenValidation {
  valid: boolean;
  token_id?: string;
  match_id?: string;
  team_id?: string;
  label?: string;
  expires_at?: string;
  match_info?: MatchInfo;
  error?: string;
}

export interface PlayerInfo {
  id: string;
  name: string;
  number?: string;
  position?: string;
  photo_url?: string;
  team_id: string;
  is_starter?: boolean;
  source: 'lineup' | 'roster';
}

export interface LiveEvent {
  id: string;
  match_id: string;
  source_token_id: string;
  type: string;
  team_id?: string;
  player_id?: string;
  player_out_id?: string;
  player_in_id?: string;
  target_team_id?: string;
  related_event_id?: string;
  detail?: string;
  note?: string;
  added_minutes?: number;
  match_minute?: number | null;
  half?: number | null;
  real_timestamp: string;
  status: string;
  player?: { id: string; name: string; number?: string } | null;
  player_out?: { id: string; name: string; number?: string } | null;
  player_in?: { id: string; name: string; number?: string } | null;
  team?: { id: string; short_name: string; color?: string } | null;
}

export interface AccessToken {
  id: string;
  token: string;
  match_id: string;
  team_id?: string;
  label?: string;
  expires_at: string;
  is_active: boolean;
  last_used_at?: string;
  created_at: string;
  team?: TeamInfo;
}

// ============================
// SCOUT (token-based) stubs
// ============================

export async function validateScoutToken(_token: string): Promise<TokenValidation> {
  return { valid: false, error: 'Demo mode' };
}

export async function getMatchPlayers(_matchId: string, _token: string): Promise<{ players: PlayerInfo[]; source: string }> {
  return { players: [], source: 'demo' };
}

export async function saveLineup(
  _token: string,
  _players: { player_id: string; team_id: string; started: boolean }[]
): Promise<{ success?: boolean; error?: string }> {
  return { success: true };
}

export async function getSavedLineup(_matchId: string, _token: string) {
  return { lineup: [] };
}

export async function postEvent(
  _token: string,
  _data: {
    type: string;
    team_id?: string;
    player_id?: string;
    player_out_id?: string;
    player_in_id?: string;
    target_team_id?: string;
    detail?: string;
    note?: string;
    added_minutes?: number;
    match_minute?: number;
    started_minutes_ago?: number;
  }
): Promise<{ success?: boolean; event?: LiveEvent; auto_red?: LiveEvent; second_yellow?: boolean; error?: string }> {
  return { success: true };
}

export async function getEvents(_matchId: string, _token: string): Promise<{ events: LiveEvent[] }> {
  return { events: [] };
}

export async function editEvent(_eventId: string, _token: string, _changes: Record<string, any>, _justification: string) {
  return { success: true };
}

export async function deleteEvent(_eventId: string, _token: string, _justification: string) {
  return { success: true };
}

export async function getMatchState(_matchId: string, _token: string) {
  return { match: null };
}

// ============================
// ADMIN stubs
// ============================

export async function generateTokens(_matchId: string, _tokenDefs?: { team_id?: string; label?: string }[]) {
  return { tokens: [] };
}

export async function listTokens(_matchId: string): Promise<{ tokens: AccessToken[] }> {
  return { tokens: [] };
}

export async function deactivateToken(_tokenId: string) {
  return { success: true };
}

export async function getAdminEvents(_matchId: string) {
  return { events: [] };
}

export async function getReport(_matchId: string) {
  return { report: null };
}

export async function publishReport(_matchId: string) {
  return { success: true };
}

export async function unpublishReport(_matchId: string) {
  return { success: true };
}

export async function resetScout(_matchId: string) {
  return { success: true };
}

export async function batchGenerateTokens(_competitionId: string, _round: number) {
  return { tokens: [] };
}
