// Mock galera-api — stubs for standalone demo
import { TEAMS, SCORER_PLAYERS, BOLAO_PARTICIPANTS, MATCHES } from './mock-data';
import type { SQLTeam } from './supabase';

export function getCachedDisplayName(): string {
  return 'Torcedor Demo';
}

export async function getProfile() {
  return { display_name: 'Torcedor Demo' };
}

export async function saveProfile(_data: any) {
  return { ok: true };
}

export function generateStoryImage() { return ''; }
export function downloadStoryImage() {}
export function shareStoryImage() {}
export async function shareContent(..._args: any[]) {}

export function getPositionLabel(pos: string): string {
  const labels: Record<string, string> = {
    GOL: 'Goleiro', ZAG: 'Zagueiro', LAT: 'Lateral', VOL: 'Volante',
    MEI: 'Meia', ATA: 'Atacante', Goleiro: 'Goleiro', Zagueiro: 'Zagueiro',
    Lateral: 'Lateral', Volante: 'Volante', Meia: 'Meia', Atacante: 'Atacante',
    goleiro: 'Goleiro', zagueiro: 'Zagueiro', lateral: 'Lateral',
    volante: 'Volante', meia: 'Meia', atacante: 'Atacante',
    treinador: 'Treinador',
  };
  return labels[pos] || pos || 'Jogador';
}

export async function getTrendingPlayers() { return []; }

export async function getBolaoStats(..._args: any[]) {
  return {
    total_participants: BOLAO_PARTICIPANTS.length,
    total_predictions: BOLAO_PARTICIPANTS.reduce((s, p) => s + p.predictions.length, 0),
    total_predictors: BOLAO_PARTICIPANTS.length,
    current_round: 16,
    stats: {},
  };
}

// ============================
// SELEÇÃO DA GALERA — Simulação completa
// ============================

// Jogadores fictícios por posição para popular o campinho
const MOCK_PLAYERS_BY_POSITION: Record<string, Array<{ id: string; name: string; number: string; position: string; team_id: string; photo_url: string }>> = {
  GOL: [
    { id: 'pg01', name: 'Rafael Souza', number: '1', position: 'Goleiro', team_id: 't03', photo_url: '' },
    { id: 'pg02', name: 'Marcos Lopes', number: '12', position: 'Goleiro', team_id: 't01', photo_url: '' },
    { id: 'pg03', name: 'Anderson Silva', number: '1', position: 'Goleiro', team_id: 't05', photo_url: '' },
  ],
  ZAG: [
    { id: 'pz01', name: 'Lucas Müller', number: '3', position: 'Zagueiro', team_id: 't01', photo_url: '' },
    { id: 'pz02', name: 'Thiago Ramos', number: '4', position: 'Zagueiro', team_id: 't02', photo_url: '' },
    { id: 'pz03', name: 'Felipe Kreutz', number: '3', position: 'Zagueiro', team_id: 't03', photo_url: '' },
    { id: 'pz04', name: 'Bruno Eckert', number: '4', position: 'Zagueiro', team_id: 't05', photo_url: '' },
    { id: 'pz05', name: 'Marcelo Henn', number: '13', position: 'Zagueiro', team_id: 't04', photo_url: '' },
  ],
  LAT: [
    { id: 'pl01', name: 'Gabriel Schneider', number: '2', position: 'Lateral', team_id: 't03', photo_url: '' },
    { id: 'pl02', name: 'Rodrigo Finkler', number: '6', position: 'Lateral', team_id: 't01', photo_url: '' },
    { id: 'pl03', name: 'Diego Becker', number: '2', position: 'Lateral', team_id: 't05', photo_url: '' },
    { id: 'pl04', name: 'André Stoll', number: '6', position: 'Lateral', team_id: 't02', photo_url: '' },
  ],
  VOL: [
    { id: 'pv01', name: 'Carlos Sperotto', number: '5', position: 'Volante', team_id: 't03', photo_url: '' },
    { id: 'pv02', name: 'Eduardo Graff', number: '5', position: 'Volante', team_id: 't01', photo_url: '' },
    { id: 'pv03', name: 'Matheus Konzen', number: '5', position: 'Volante', team_id: 't04', photo_url: '' },
  ],
  MEI: [
    { id: 'pm01', name: 'Andrei L. Macedo Rosa', number: '7', position: 'Meia', team_id: 't03', photo_url: '' },
    { id: 'pm02', name: 'João Felipe de Moura', number: '11', position: 'Meia', team_id: 't02', photo_url: '' },
    { id: 'pm03', name: 'Felipe Gedoz', number: '8', position: 'Meia', team_id: 't15', photo_url: '' },
    { id: 'pm04', name: 'Alisson R. Santos Tobias', number: '11', position: 'Meia', team_id: 't03', photo_url: '' },
  ],
  ATA: [
    ...SCORER_PLAYERS.slice(0, 8).map(p => ({ ...p, photo_url: p.photo_url || '' })),
  ],
};

const ALL_ELIGIBLE_PLAYERS = Object.values(MOCK_PLAYERS_BY_POSITION).flat();

const MOCK_COACHES = [
  { name: 'Técnico Rodrigo', team_id: 't03' },
  { name: 'Técnico Marcelo', team_id: 't01' },
  { name: 'Técnico Paulo', team_id: 't02' },
  { name: 'Técnico André', team_id: 't05' },
  { name: 'Técnico Carlos', team_id: 't04' },
];

// Gera seleção simulada para uma rodada (determinístico baseado na rodada)
function generateRoundSelection(round: number) {
  const seed = round * 7;
  const pick = <T,>(arr: T[], offset: number): T => arr[(seed + offset) % arr.length];

  // Vencedores por posição (resultado da votação popular)
  const winners: Record<string, any> = {};
  const myVotes: Record<string, any> = {};

  // GOL
  const gol = pick(MOCK_PLAYERS_BY_POSITION.GOL, 0);
  winners['GOL:0'] = { player_id: gol.id, team_id: gol.team_id, count: 45 + (seed % 30) };
  myVotes['GOL:0'] = { player_id: gol.id, team_id: gol.team_id };

  // ZAG (2)
  const zags = MOCK_PLAYERS_BY_POSITION.ZAG;
  for (let i = 0; i < 2; i++) {
    const z = pick(zags, i * 3);
    winners[`ZAG:${i}`] = { player_id: z.id, team_id: z.team_id, count: 38 + ((seed + i) % 25) };
    myVotes[`ZAG:${i}`] = { player_id: z.id, team_id: z.team_id };
  }

  // LAT (2)
  const lats = MOCK_PLAYERS_BY_POSITION.LAT;
  for (let i = 0; i < 2; i++) {
    const l = pick(lats, i * 2);
    winners[`LAT:${i}`] = { player_id: l.id, team_id: l.team_id, count: 32 + ((seed + i) % 20) };
    myVotes[`LAT:${i}`] = { player_id: l.id, team_id: l.team_id };
  }

  // VOL (1)
  const vol = pick(MOCK_PLAYERS_BY_POSITION.VOL, 1);
  winners['VOL:0'] = { player_id: vol.id, team_id: vol.team_id, count: 40 + (seed % 22) };
  myVotes['VOL:0'] = { player_id: vol.id, team_id: vol.team_id };

  // MEI (2)
  const meis = MOCK_PLAYERS_BY_POSITION.MEI;
  for (let i = 0; i < 2; i++) {
    const m = pick(meis, i * 2 + 1);
    winners[`MEI:${i}`] = { player_id: m.id, team_id: m.team_id, count: 35 + ((seed + i) % 28) };
    myVotes[`MEI:${i}`] = { player_id: m.id, team_id: m.team_id };
  }

  // ATA (3)
  const atas = MOCK_PLAYERS_BY_POSITION.ATA;
  for (let i = 0; i < 3; i++) {
    const a = pick(atas, i * 2);
    winners[`ATA:${i}`] = { player_id: a.id, team_id: a.team_id, count: 50 + ((seed + i) % 35) };
    myVotes[`ATA:${i}`] = { player_id: a.id, team_id: a.team_id };
  }

  // Treinador
  const coach = pick(MOCK_COACHES, 2);
  winners['treinador:0'] = { coach_name: coach.name, team_id: coach.team_id, count: 42 + (seed % 20) };
  myVotes['treinador:0'] = { coach_name: coach.name, team_id: coach.team_id };

  // Trending (top 3 jogadores mais votados na rodada)
  const trending = SCORER_PLAYERS.slice(0, 3).map((p, i) => ({
    rank: i + 1,
    player_id: p.id,
    team_id: p.team_id,
    pct: 25 - i * 5,
  }));

  return { winners, myVotes, trending };
}

// getSelecaoBatch — chamada com (compId, round)
export async function getSelecaoBatch(...args: any[]) {
  const round = typeof args[1] === 'number' ? args[1] : (typeof args[0] === 'number' ? args[0] : 1);
  const { winners, myVotes, trending } = generateRoundSelection(round);

  return {
    round,
    eligible: {
      players: ALL_ELIGIBLE_PLAYERS,
      coaches: MOCK_COACHES,
      teams: TEAMS.map((t: SQLTeam) => ({ id: t.id, name: t.name, short_name: t.short_name, slug: t.slug, logo_url: t.logo_url, color: t.color })),
      voting_open: true,
      closes_at: new Date(Date.now() + 86400000).toISOString(),
    },
    myVotes,
    trending,
    results: winners,
    total_voters: 87 + (round * 3),
  };
}

// getVoteResults — chamada com (compId, round)
export async function getVoteResults(...args: any[]) {
  const round = typeof args[1] === 'number' ? args[1] : (typeof args[0] === 'number' ? args[0] : 1);
  const { winners } = generateRoundSelection(round);
  return { winners, total_voters: 87 + (round * 3) };
}

// getReleaseStatus — todas as rodadas liberadas no demo
export async function getReleaseStatus(..._args: any[]) {
  const releases: Record<string, boolean> = {};
  for (let i = 1; i <= 16; i++) releases[String(i)] = true;
  return { releases };
}

export async function getRankingDetails() {
  return BOLAO_PARTICIPANTS.map(p => ({
    user_id: p.id,
    display_name: p.name,
    avatar_url: '',
    total_points: p.points,
    exact_scores: p.exactScores,
    correct_results: p.rightResults,
    total_predictions: p.predictions.length * 10,
    badge: p.badge,
  }));
}

export async function getArenaSelection() { return null; }

// FORMATION as array with coords for the campinho (field view)
export const FORMATION = [
  {
    position: 'GOL', label: 'Goleiro',
    coords: [{ top: '90%', left: '50%' }],
  },
  {
    position: 'ZAG', label: 'Zagueiro',
    coords: [{ top: '75%', left: '30%' }, { top: '75%', left: '70%' }],
  },
  {
    position: 'LAT', label: 'Lateral',
    coords: [{ top: '62%', left: '15%' }, { top: '62%', left: '85%' }],
  },
  {
    position: 'VOL', label: 'Volante',
    coords: [{ top: '55%', left: '50%' }],
  },
  {
    position: 'MEI', label: 'Meia',
    coords: [{ top: '40%', left: '30%' }, { top: '40%', left: '70%' }],
  },
  {
    position: 'ATA', label: 'Atacante',
    coords: [{ top: '22%', left: '25%' }, { top: '18%', left: '50%' }, { top: '22%', left: '75%' }],
  },
  {
    position: 'treinador', label: 'Treinador',
    coords: [{ top: '96%', left: '85%' }],
  },
];

export function mapPlayerToVotingPosition(pos: string): string {
  const map: Record<string, string> = {
    Goleiro: 'GOL', Zagueiro: 'ZAG', Lateral: 'LAT',
    Volante: 'VOL', Meia: 'MEI', Atacante: 'ATA',
    goleiro: 'GOL', zagueiro: 'ZAG', lateral: 'LAT',
    volante: 'VOL', meia: 'MEI', atacante: 'ATA',
  };
  return map[pos] || 'ATA';
}

export function generateSelectionShareText(..._args: any[]): string { return 'Confira a Seleção da Galera! 🏆⚽'; }
export async function submitVote(..._args: any[]) { return { ok: true }; }
export async function submitPrediction(..._args: any[]) { return { ok: true }; }
export async function submitPredictionsBatch(..._args: any[]) { return { ok: true }; }

// Return simulated bolão predictions — accepts any args (compId, round, etc)
export async function getBolaoBatch(..._args: any[]) {
  // Generate predictions for all finished matches
  const predictions: Record<string, { home: number; away: number }> = {};
  for (const m of MATCHES) {
    if (m.score_home !== null && m.score_away !== null) {
      // Deterministic "user predictions" based on match id
      const hash = m.id.charCodeAt(1) + m.id.charCodeAt(2);
      predictions[m.id] = {
        home: Math.max(0, (m.score_home || 0) + (hash % 3 === 0 ? 1 : hash % 3 === 1 ? -1 : 0)),
        away: Math.max(0, (m.score_away || 0) + (hash % 2 === 0 ? 1 : 0)),
      };
    }
  }

  // Map bolão participants to ranking format
  const ranking = BOLAO_PARTICIPANTS.map(p => ({
    user_id: p.id,
    display_name: p.name,
    avatar_url: '',
    total_points: p.points,
    exact_scores: p.exactScores,
    correct_results: p.rightResults,
    total_predictions: p.predictions.length * 10,
    badge: p.badge,
  }));

  return { predictions, ranking };
}

export async function getRoundControl(..._args: any[]) {
  const rounds: Record<string, boolean> = {};
  for (let i = 1; i <= 16; i++) rounds[String(i)] = true;
  return {
    current_round: 16,
    voting_open: true,
    predictions_open: true,
    selecao: rounds,
    bolao: rounds,
  };
}
