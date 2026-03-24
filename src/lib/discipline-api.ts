// Mock discipline-api - no real connection needed

// ============================
// TYPES
// ============================
export interface CompetitionRules {
  yellows_for_suspension: number;
  suspension_games: number;
  double_penalty_on_repeat: boolean;
  reset_yellows_phase_2: boolean;
  red_direct_suspension_games: number;
  red_card_fine: number;
  group_phase_max_round: number;
  min_games_for_knockout: number;
  max_team_discipline_points: number;
  competition_format: string;
  phases_count: number;
  knockout_home_away: boolean;
  tiebreaker_order: string[];
  relegation_spots: number;
  teams_advancing_per_group: number;
  half_duration_minutes: number;
  extra_time_enabled: boolean;
  extra_time_duration: number;
  penalties_after_extra: boolean;
  max_substitutions: number;
  min_players_no_wo: number;
  wo_tolerance_minutes: number;
  wo_result: string;
  max_squad_size: number;
  max_reinforcements_per_round: number;
  transfer_deadline: string;
  age_restriction: string;
  points_win: number;
  points_draw: number;
  points_loss: number;
  points_wo_penalty: number;
  team_registration_fee: number;
  wo_fine: number;
  prize_description: string;
  regulation_text: string;
  regulation_notes: string;
  updated_at?: string;
  updated_by?: string;
}

export interface DisciplineEntry {
  player_id: string;
  player_name: string;
  player_number: string;
  player_photo: string | null;
  team_id: string;
  team_name: string;
  team_short_name: string;
  team_logo: string;
  team_color: string;
  total_yellows: number;
  total_reds: number;
  yellow_accumulator: number;
  is_suspended: boolean;
  is_pendurado: boolean;
  suspension_type: string | null;
  suspension_reason: string | null;
  suspension_games_total: number;
  suspension_games_served: number;
  suspension_from_round: number | null;
  next_eligible_round: number | null;
  suspension_count: number;
  manual_suspension_id: string | null;
}

export interface ManualSuspension {
  id: string;
  competition_id: string;
  player_id: string;
  player_name: string;
  team_id: string;
  team_name: string;
  type: string;
  reason: string;
  games_total: number;
  games_served: number;
  from_round: number;
  next_eligible_round: number | null;
  admin_notes: string;
  active: boolean;
  created_at: string;
  resolved_at: string | null;
}

export interface DisciplineOverview {
  rules: CompetitionRules;
  entries: DisciplineEntry[];
  manualSuspensions: ManualSuspension[];
  stats: {
    suspended: number;
    pendurados: number;
    totalYellows: number;
    totalReds: number;
  };
}

export interface PlayerEligibility {
  player_id: string;
  player_name: string;
  player_number: string;
  player_position: string;
  player_photo: string | null;
  team_id: string;
  team_name: string;
  team_short_name: string;
  team_logo: string;
  team_color: string;
  group_phase_games: number;
  min_required: number;
  eligible: boolean;
}

export interface EligibilityData {
  eligibility: PlayerEligibility[];
  rules: {
    group_phase_max_round: number;
    min_games_for_knockout: number;
  };
  summary: {
    total_players: number;
    eligible: number;
    ineligible: number;
    group_matches_played: number;
  };
}

export interface TeamDisciplineEntry {
  team_id: string;
  team_name: string;
  team_short_name: string;
  team_logo: string;
  team_color: string;
  yellow_cards: number;
  red_cards: number;
  card_points: number;
  manual_points: number;
  total_points: number;
  max_points: number;
  remaining: number;
  percentage: number;
  alert: 'ok' | 'warning' | 'danger' | 'excluded';
}

export interface TeamDisciplineData {
  teams: TeamDisciplineEntry[];
  maxPoints: number;
}

// ============================
// PUBLIC API stubs
// ============================

const defaultRules: CompetitionRules = {
  yellows_for_suspension: 3,
  suspension_games: 1,
  double_penalty_on_repeat: false,
  reset_yellows_phase_2: false,
  red_direct_suspension_games: 1,
  red_card_fine: 0,
  group_phase_max_round: 7,
  min_games_for_knockout: 4,
  max_team_discipline_points: 100,
  competition_format: 'groups',
  phases_count: 1,
  knockout_home_away: false,
  tiebreaker_order: ['points', 'wins', 'goal_diff', 'goals_for'],
  relegation_spots: 0,
  teams_advancing_per_group: 2,
  half_duration_minutes: 25,
  extra_time_enabled: false,
  extra_time_duration: 5,
  penalties_after_extra: false,
  max_substitutions: 5,
  min_players_no_wo: 5,
  wo_tolerance_minutes: 15,
  wo_result: '3x0',
  max_squad_size: 25,
  max_reinforcements_per_round: 3,
  transfer_deadline: '',
  age_restriction: '',
  points_win: 3,
  points_draw: 1,
  points_loss: 0,
  points_wo_penalty: -3,
  team_registration_fee: 0,
  wo_fine: 0,
  prize_description: '',
  regulation_text: '',
  regulation_notes: '',
};

export async function fetchRules(_competitionId: string): Promise<CompetitionRules> {
  return defaultRules;
}

export async function fetchDisciplineOverview(_competitionId: string): Promise<DisciplineOverview> {
  return {
    rules: defaultRules,
    entries: [],
    manualSuspensions: [],
    stats: { suspended: 0, pendurados: 0, totalYellows: 0, totalReds: 0 },
  };
}

// ============================
// ADMIN API stubs
// ============================

export async function saveRules(_competitionId: string, _rules: Partial<CompetitionRules>): Promise<CompetitionRules> {
  return defaultRules;
}

export async function createManualSuspension(_suspension: {
  competition_id: string;
  player_id: string;
  player_name: string;
  team_id: string;
  team_name: string;
  reason: string;
  games_total: number;
  from_round: number;
  admin_notes?: string;
  type?: string;
}): Promise<ManualSuspension> {
  return {} as ManualSuspension;
}

export async function updateManualSuspension(
  _id: string,
  _competitionId: string,
  _updates: Partial<ManualSuspension>,
): Promise<ManualSuspension> {
  return {} as ManualSuspension;
}

export async function deleteManualSuspension(_id: string, _competitionId: string): Promise<void> {}

export async function serveGame(_id: string, _competitionId: string): Promise<ManualSuspension> {
  return {} as ManualSuspension;
}

export async function syncDisciplineToPlayers(_competitionId: string): Promise<{ updated: number; total: number }> {
  return { updated: 0, total: 0 };
}

export async function fetchEligibility(_competitionId: string): Promise<EligibilityData> {
  return {
    eligibility: [],
    rules: { group_phase_max_round: 7, min_games_for_knockout: 4 },
    summary: { total_players: 0, eligible: 0, ineligible: 0, group_matches_played: 0 },
  };
}

export async function fetchTeamDiscipline(_competitionId: string): Promise<TeamDisciplineData> {
  return { teams: [], maxPoints: 100 };
}
