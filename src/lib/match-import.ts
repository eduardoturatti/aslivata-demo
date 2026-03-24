// ============================
// MATCH JSON IMPORT — Validation, Matching & Processing
// Power Sports / Arena Força do Vale
// ============================

import type { SQLTeam, SQLPlayer, SQLMatch, SQLMatchEvent } from './supabase';
import {
  updateMatch, insertMatchEvent, clearMatchEvents,
  upsertMatchLineups, clearMatchLineups,
  upsertPlayer, recalculateAllStats,
  supabase,
} from './supabase';

// ── SCHEMA TYPES ──────────────────────────────────────────

export interface MatchImportJSON {
  match_import: {
    version: string;
    competition_id: string;
    round_number: number;
    match_date: string;
    home_team: { name: string; score: number };
    away_team: { name: string; score: number };
    lineups: {
      home: {
        starters: ImportPlayer[];
        bench: ImportPlayer[];
        coach: string;
      };
      away: {
        starters: ImportPlayer[];
        bench: ImportPlayer[];
        coach: string;
      };
    };
    events: ImportEvent[];
    suspensions: ImportSuspension[];
    notes: string;
  };
}

export interface ImportPlayer {
  number: number;
  name: string;
  position: string;
}

export interface ImportEvent {
  type: 'goal' | 'yellow_card' | 'red_card' | 'substitution';
  team: 'home' | 'away';
  player_name?: string;
  player_number?: number;
  player_out_name?: string;
  player_out_number?: number;
  player_in_name?: string;
  player_in_number?: number;
  minute: number | null;
  half: number;
  detail?: string;
  note?: string;
}

export interface ImportSuspension {
  player_name: string;
  player_number: number;
  team: 'home' | 'away';
  reason: string;
  games_suspended: number;
  next_eligible_round: number | null;
  note: string;
}

// ── VALIDATION ──────────────────────────────────────────

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  data?: MatchImportJSON['match_import'];
}

const VALID_POSITIONS = ['goleiro', 'lateral', 'zagueiro', 'meia', 'atacante'];
const VALID_EVENT_TYPES = ['goal', 'yellow_card', 'red_card', 'substitution'];
const VALID_HALVES = [1, 2, 3];

export function validateImportJSON(raw: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  let parsed: any;
  try {
    // Clean up common issues from ChatGPT/Claude responses
    let cleaned = raw.trim();
    
    // Remove BOM
    cleaned = cleaned.replace(/^\uFEFF/, '');
    
    // Remove markdown code blocks: ```json ... ``` or ``` ... ```
    cleaned = cleaned.replace(/^```(?:json|JSON)?\s*\n?/m, '');
    cleaned = cleaned.replace(/\n?```\s*$/m, '');
    cleaned = cleaned.trim();
    
    // If the response starts with text before the JSON, extract the JSON object
    if (!cleaned.startsWith('{') && !cleaned.startsWith('[')) {
      const jsonStart = cleaned.indexOf('{');
      if (jsonStart >= 0) {
        // Find the matching closing brace
        let depth = 0;
        let jsonEnd = -1;
        for (let i = jsonStart; i < cleaned.length; i++) {
          if (cleaned[i] === '{') depth++;
          else if (cleaned[i] === '}') {
            depth--;
            if (depth === 0) { jsonEnd = i; break; }
          }
        }
        if (jsonEnd > 0) {
          cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
        }
      }
    }
    
    // Remove trailing text after JSON (common: ChatGPT adds explanation after)
    if (cleaned.startsWith('{')) {
      let depth = 0;
      let jsonEnd = -1;
      for (let i = 0; i < cleaned.length; i++) {
        if (cleaned[i] === '{') depth++;
        else if (cleaned[i] === '}') {
          depth--;
          if (depth === 0) { jsonEnd = i; break; }
        }
      }
      if (jsonEnd > 0 && jsonEnd < cleaned.length - 1) {
        cleaned = cleaned.slice(0, jsonEnd + 1);
      }
    }
    
    // Remove control characters except newlines and tabs
    cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    // Fix common JSON issues: trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    
    parsed = JSON.parse(cleaned);
  } catch (e: any) {
    return { valid: false, errors: [`JSON inválido: ${e.message}\n\nDica: Copie APENAS o JSON retornado pela IA, sem texto extra. Se a IA envolveu o JSON em \`\`\`json ... \`\`\`, tente copiar só o conteúdo de dentro.`], warnings: [] };
  }

  const data = parsed.match_import;
  if (!data) {
    return { valid: false, errors: ['Campo "match_import" não encontrado no JSON'], warnings: [] };
  }

  // Required fields
  if (!data.home_team?.name) errors.push('Nome do time mandante ausente');
  if (!data.away_team?.name) errors.push('Nome do time visitante ausente');
  if (data.home_team?.score == null) errors.push('Placar mandante ausente');
  if (data.away_team?.score == null) errors.push('Placar visitante ausente');

  // Lineups validation
  const lineups = data.lineups;
  if (lineups) {
    for (const side of ['home', 'away'] as const) {
      const l = lineups[side];
      if (!l) { warnings.push(`Escalação ${side === 'home' ? 'mandante' : 'visitante'} ausente`); continue; }
      
      const starters = l.starters || [];
      const bench = l.bench || [];
      
      if (starters.length === 0) warnings.push(`Nenhum titular ${side === 'home' ? 'mandante' : 'visitante'}`);
      
      for (const p of [...starters, ...bench]) {
        if (!p.name) warnings.push(`Jogador sem nome (nº ${p.number})`);
        if (p.position && !VALID_POSITIONS.includes(p.position)) {
          warnings.push(`Posição "${p.position}" inválida para ${p.name || `nº ${p.number}`}`);
        }
      }
    }
  } else {
    warnings.push('Escalações ausentes');
  }

  // Events validation
  const events = data.events || [];
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    if (!VALID_EVENT_TYPES.includes(ev.type)) {
      errors.push(`Evento ${i + 1}: tipo "${ev.type}" inválido`);
    }
    if (!ev.team || !['home', 'away'].includes(ev.team)) {
      errors.push(`Evento ${i + 1}: campo "team" deve ser "home" ou "away"`);
    }
    if (ev.half != null && !VALID_HALVES.includes(ev.half)) {
      warnings.push(`Evento ${i + 1}: half "${ev.half}" incomum`);
    }
    if (ev.type === 'substitution') {
      if (!ev.player_out_name && !ev.player_out_number) warnings.push(`Substituição ${i + 1}: jogador saindo não identificado`);
      if (!ev.player_in_name && !ev.player_in_number) warnings.push(`Substituição ${i + 1}: jogador entrando não identificado`);
    }
  }

  // Goal count consistency
  const homeGoals = events.filter(e => e.type === 'goal' && e.team === 'home').length;
  const awayGoals = events.filter(e => e.type === 'goal' && e.team === 'away').length;
  if (data.home_team?.score != null && homeGoals !== data.home_team.score) {
    warnings.push(`Gols mandante: placar=${data.home_team.score}, eventos=${homeGoals}`);
  }
  if (data.away_team?.score != null && awayGoals !== data.away_team.score) {
    warnings.push(`Gols visitante: placar=${data.away_team.score}, eventos=${awayGoals}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    data: errors.length === 0 ? data : undefined,
  };
}

// ── FUZZY MATCHING ──────────────────────────────────────

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

function similarity(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.9;
  
  // Word-based matching (more flexible)
  const wordsA = na.split(/\s+/).filter(w => w.length > 1);
  const wordsB = nb.split(/\s+/).filter(w => w.length > 1);
  
  // Check if last names match (strong signal in Brazilian names)
  if (wordsA.length > 0 && wordsB.length > 0) {
    const lastA = wordsA[wordsA.length - 1];
    const lastB = wordsB[wordsB.length - 1];
    if (lastA === lastB && lastA.length >= 3) return 0.85;
  }
  
  const commonWords = wordsA.filter(w => wordsB.some(wb => wb === w || (wb.length >= 4 && (wb.includes(w) || w.includes(wb)))));
  const maxWords = Math.max(wordsA.length, wordsB.length);
  if (maxWords === 0) return 0;
  
  const wordScore = commonWords.length / maxWords;
  
  // Levenshtein-like quick check for small typos
  if (wordScore === 0 && na.length > 3 && nb.length > 3) {
    const shorter = na.length < nb.length ? na : nb;
    const longer = na.length < nb.length ? nb : na;
    if (longer.length - shorter.length <= 2) {
      let diffs = 0;
      for (let i = 0; i < shorter.length && diffs <= 2; i++) {
        if (shorter[i] !== longer[i]) diffs++;
      }
      if (diffs <= 2) return 0.7;
    }
  }
  
  return wordScore;
}

export function matchTeam(name: string, teams: SQLTeam[]): { team: SQLTeam; confidence: number } | null {
  let bestMatch: SQLTeam | null = null;
  let bestScore = 0;

  for (const t of teams) {
    const scores = [
      similarity(name, t.name),
      similarity(name, t.short_name),
      similarity(name, t.slug),
    ];
    const maxScore = Math.max(...scores);
    if (maxScore > bestScore) {
      bestScore = maxScore;
      bestMatch = t;
    }
  }

  return bestMatch && bestScore >= 0.5
    ? { team: bestMatch, confidence: bestScore }
    : null;
}

export interface PlayerMatch {
  player: SQLPlayer | null;
  confidence: number;
  importName: string;
  importNumber: number;
  isNew: boolean; // Player not found in DB
}

export function matchPlayer(
  name: string,
  number: number | undefined,
  teamPlayers: SQLPlayer[],
): PlayerMatch {
  let bestPlayer: SQLPlayer | null = null;
  let bestScore = 0;

  for (const p of teamPlayers) {
    // Check against nickname (p.name)
    let score = similarity(name, p.name);
    
    // Check against real_name if available (súmulas use real names)
    if (p.real_name) {
      const realNameScore = similarity(name, p.real_name);
      score = Math.max(score, realNameScore);
    }
    
    // Check against display_name if available
    if ((p as any).display_name) {
      const displayScore = similarity(name, (p as any).display_name);
      score = Math.max(score, displayScore);
    }
    
    // Number match is a WEAK signal (numbers change between games)
    // Only use as tiebreaker, not as primary match
    if (number != null && p.number === String(number) && score >= 0.3) {
      score = Math.min(1, score + 0.15);
    }
    
    if (score > bestScore) {
      bestScore = score;
      bestPlayer = p;
    }
  }

  return {
    player: bestPlayer && bestScore >= 0.4 ? bestPlayer : null,
    confidence: bestScore,
    importName: name,
    importNumber: number || 0,
    isNew: !bestPlayer || bestScore < 0.4,
  };
}

// ── PREVIEW BUILDER ──────────────────────────────────────

export interface ImportPreview {
  homeTeam: { team: SQLTeam; confidence: number } | null;
  awayTeam: { team: SQLTeam; confidence: number } | null;
  homeScore: number;
  awayScore: number;
  roundNumber: number;
  matchDate: string;
  homeLineup: {
    starters: PlayerMatch[];
    bench: PlayerMatch[];
    coach: string;
  };
  awayLineup: {
    starters: PlayerMatch[];
    bench: PlayerMatch[];
    coach: string;
  };
  events: (ImportEvent & { resolvedPlayer?: PlayerMatch; resolvedPlayerIn?: PlayerMatch; resolvedPlayerOut?: PlayerMatch })[];
  suspensions: ImportSuspension[];
  warnings: string[];
  notes: string;
  newPlayersCount: number;
  scoutComparison?: ScoutComparison;
}

// ── SCOUT COMPARISON ──────────────────────────────────────

export interface ScoutComparisonEvent {
  type: string;
  playerName: string;
  playerNumber?: number;
  minute: number;
  half: string;
  teamSide: 'home' | 'away';
  detail?: any;
}

export interface ScoutComparison {
  scoutOnlyEvents: ScoutComparisonEvent[];   // Events scouts registered that aren't in the súmula
  sumulaOnlyEvents: ScoutComparisonEvent[];  // Events in súmula that scouts didn't register
  matchingEvents: ScoutComparisonEvent[];    // Events that match between both
  scoutTotal: number;
  sumulaTotal: number;
}

function eventKey(type: string, playerName: string, half: string | number, minute: number): string {
  const h = typeof half === 'number' ? (half === 2 ? '2T' : half === 3 ? 'PRO' : '1T') : half;
  return `${type}|${normalize(playerName)}|${h}|${minute}`;
}

export function compareWithScoutEvents(
  importEvents: ImportEvent[],
  existingEvents: SQLMatchEvent[],
  players: SQLPlayer[],
  homeTeamId: string,
  awayTeamId: string,
): ScoutComparison {
  // Build lookup for existing (scout) events
  const getPlayerName = (playerId: string): string => {
    const p = players.find(pl => pl.id === playerId);
    return p ? p.name : '?';
  };
  const getTeamSide = (teamId: string): 'home' | 'away' =>
    teamId === homeTeamId ? 'home' : 'away';

  const scoutEvents: ScoutComparisonEvent[] = existingEvents
    .filter(e => !['assist'].includes(e.event_type)) // skip assists for comparison
    .map(e => ({
      type: e.event_type,
      playerName: getPlayerName(e.player_id),
      minute: e.minute,
      half: e.half,
      teamSide: getTeamSide(e.team_id),
      detail: e.detail,
    }));

  const sumulaEvents: ScoutComparisonEvent[] = importEvents.map(e => {
    const h = e.half === 2 ? '2T' : e.half === 3 ? 'PRO' : '1T';
    if (e.type === 'substitution') {
      return {
        type: e.type,
        playerName: `${e.player_out_name || '?'} → ${e.player_in_name || '?'}`,
        minute: e.minute || 0,
        half: h,
        teamSide: e.team,
      };
    }
    return {
      type: e.type,
      playerName: e.player_name || '?',
      playerNumber: e.player_number,
      minute: e.minute || 0,
      half: h,
      teamSide: e.team,
    };
  });

  // Fuzzy matching: match events by type + team + approximate minute
  const matchedScoutIndices = new Set<number>();
  const matchedSumulaIndices = new Set<number>();
  const matchingEvents: ScoutComparisonEvent[] = [];

  for (let si = 0; si < sumulaEvents.length; si++) {
    const se = sumulaEvents[si];
    for (let ei = 0; ei < scoutEvents.length; ei++) {
      if (matchedScoutIndices.has(ei)) continue;
      const ee = scoutEvents[ei];

      // Type mapping (scout may store 'penalty_scored' vs import 'goal' with detail 'penal')
      const typeMatch =
        se.type === ee.type ||
        (se.type === 'goal' && (ee.type === 'penalty_scored' || ee.type === 'own_goal')) ||
        (ee.type === 'goal' && se.type === 'goal');

      if (!typeMatch) continue;
      if (se.teamSide !== ee.teamSide) continue;

      // Check minute proximity (within 3 minutes tolerance)
      const minuteDiff = Math.abs(se.minute - ee.minute);
      if (minuteDiff > 3) continue;

      // Half must match
      const seHalf = se.half;
      const eeHalf = ee.half;
      if (seHalf !== eeHalf) continue;

      // Good enough match
      matchedScoutIndices.add(ei);
      matchedSumulaIndices.add(si);
      matchingEvents.push(se);
      break;
    }
  }

  const scoutOnlyEvents = scoutEvents.filter((_, i) => !matchedScoutIndices.has(i));
  const sumulaOnlyEvents = sumulaEvents.filter((_, i) => !matchedSumulaIndices.has(i));

  return {
    scoutOnlyEvents,
    sumulaOnlyEvents,
    matchingEvents,
    scoutTotal: scoutEvents.length,
    sumulaTotal: sumulaEvents.length,
  };
}

export function buildPreview(
  data: MatchImportJSON['match_import'],
  teams: SQLTeam[],
  players: SQLPlayer[],
  match: SQLMatch,
): ImportPreview {
  const warnings: string[] = [];

  // Match teams
  const homeTeamMatch = matchTeam(data.home_team.name, teams);
  const awayTeamMatch = matchTeam(data.away_team.name, teams);

  if (!homeTeamMatch) warnings.push(`Time "${data.home_team.name}" não encontrado no sistema`);
  if (!awayTeamMatch) warnings.push(`Time "${data.away_team.name}" não encontrado no sistema`);

  // If teams don't match the match's teams, warn
  if (homeTeamMatch && homeTeamMatch.team.id !== match.home_team_id) {
    warnings.push(`Time mandante no JSON (${homeTeamMatch.team.short_name}) diferente da partida (${match.home_team?.short_name})`);
  }
  if (awayTeamMatch && awayTeamMatch.team.id !== match.away_team_id) {
    warnings.push(`Time visitante no JSON (${awayTeamMatch.team.short_name}) diferente da partida (${match.away_team?.short_name})`);
  }

  // Get players per team
  const homePlayers = players.filter(p => p.team_id === (homeTeamMatch?.team.id || match.home_team_id));
  const awayPlayers = players.filter(p => p.team_id === (awayTeamMatch?.team.id || match.away_team_id));

  const getTeamPlayers = (side: 'home' | 'away') => side === 'home' ? homePlayers : awayPlayers;

  // Match lineups
  const matchLineup = (side: 'home' | 'away', list: ImportPlayer[]) =>
    list.map(p => matchPlayer(p.name, p.number, getTeamPlayers(side)));

  const homeLineup = {
    starters: matchLineup('home', data.lineups?.home?.starters || []),
    bench: matchLineup('home', data.lineups?.home?.bench || []),
    coach: data.lineups?.home?.coach || '',
  };
  const awayLineup = {
    starters: matchLineup('away', data.lineups?.away?.starters || []),
    bench: matchLineup('away', data.lineups?.away?.bench || []),
    coach: data.lineups?.away?.coach || '',
  };

  // Count new players
  const allMatched = [...homeLineup.starters, ...homeLineup.bench, ...awayLineup.starters, ...awayLineup.bench];
  const newPlayersCount = allMatched.filter(m => m.isNew).length;
  if (newPlayersCount > 0) {
    warnings.push(`${newPlayersCount} jogador(es) não encontrado(s) — serão criados automaticamente`);
  }

  // Resolve events
  const events = (data.events || []).map(ev => {
    const tp = getTeamPlayers(ev.team);
    const resolved: any = { ...ev };
    
    if (ev.type === 'substitution') {
      resolved.resolvedPlayerOut = ev.player_out_name
        ? matchPlayer(ev.player_out_name, ev.player_out_number, tp)
        : null;
      resolved.resolvedPlayerIn = ev.player_in_name
        ? matchPlayer(ev.player_in_name, ev.player_in_number, tp)
        : null;
    } else {
      resolved.resolvedPlayer = ev.player_name
        ? matchPlayer(ev.player_name, ev.player_number, tp)
        : null;
    }
    return resolved;
  });

  return {
    homeTeam: homeTeamMatch,
    awayTeam: awayTeamMatch,
    homeScore: data.home_team.score,
    awayScore: data.away_team.score,
    roundNumber: data.round_number,
    matchDate: data.match_date,
    homeLineup,
    awayLineup,
    events,
    suspensions: data.suspensions || [],
    warnings,
    notes: data.notes || '',
    newPlayersCount,
  };
}

// ── PROCESSING ──────────────────────────────────────────

export interface ProcessResult {
  success: boolean;
  eventsCreated: number;
  lineupsCreated: number;
  playersCreated: number;
  errors: string[];
  eventBreakdown?: Record<string, number>;
}

export async function processMatchImport(
  data: MatchImportJSON['match_import'],
  matchId: string,
  match: SQLMatch,
  teams: SQLTeam[],
  players: SQLPlayer[],
): Promise<ProcessResult> {
  const result: ProcessResult = {
    success: false,
    eventsCreated: 0,
    lineupsCreated: 0,
    playersCreated: 0,
    errors: [],
    eventBreakdown: {},
  };

  try {
    const homeTeamId = match.home_team_id;
    const awayTeamId = match.away_team_id;
    const homePlayers = players.filter(p => p.team_id === homeTeamId);
    const awayPlayers = players.filter(p => p.team_id === awayTeamId);
    const getTeamPlayers = (side: 'home' | 'away') => side === 'home' ? homePlayers : awayPlayers;
    const getTeamId = (side: 'home' | 'away') => side === 'home' ? homeTeamId : awayTeamId;

    // Helper: find or create player
    const resolvedCache: Record<string, string> = {}; // "name|number|teamId" → playerId
    
    async function resolvePlayerId(
      name: string,
      number: number | undefined,
      side: 'home' | 'away',
      position: string = 'atacante',
    ): Promise<string | null> {
      if (!name) return null;
      const teamId = getTeamId(side);
      const cacheKey = `${normalize(name)}|${number}|${teamId}`;
      if (resolvedCache[cacheKey]) return resolvedCache[cacheKey];

      const tp = getTeamPlayers(side);
      const pmResult = matchPlayer(name, number, tp);
      
      if (pmResult.player) {
        resolvedCache[cacheKey] = pmResult.player.id;
        return pmResult.player.id;
      }

      // Create new player
      try {
        const { data: created, error } = await supabase
          .from('players')
          .insert({
            team_id: teamId,
            name: name,
            number: String(number || 0),
            position: VALID_POSITIONS.includes(position) ? position : 'atacante',
          })
          .select('id')
          .single();
        
        if (error) throw error;
        if (created) {
          resolvedCache[cacheKey] = created.id;
          result.playersCreated++;
          // Add to local list for future lookups in this import
          const newPlayer: SQLPlayer = {
            id: created.id,
            team_id: teamId,
            name,
            number: String(number || 0),
            position: VALID_POSITIONS.includes(position) ? position : 'atacante',
          };
          if (side === 'home') homePlayers.push(newPlayer);
          else awayPlayers.push(newPlayer);
          return created.id;
        }
      } catch (err: any) {
        result.errors.push(`Erro ao criar jogador "${name}": ${err.message}`);
      }
      return null;
    }

    // 1. Update match score and status
    await updateMatch(matchId, {
      score_home: data.home_team.score,
      score_away: data.away_team.score,
      status: 'finished',
      notes: data.notes || match.notes || '',
    });

    // 2. Clear existing lineups and events
    await clearMatchLineups(matchId);
    await clearMatchEvents(matchId);

    // 3. Process lineups
    const lineupEntries: { match_id: string; team_id: string; player_id: string; is_starter: boolean; lineup_position?: number }[] = [];

    for (const side of ['home', 'away'] as const) {
      const teamId = getTeamId(side);
      const lineup = data.lineups?.[side];
      if (!lineup) continue;

      for (const p of lineup.starters || []) {
        const playerId = await resolvePlayerId(p.name, p.number, side, p.position);
        if (playerId) {
          lineupEntries.push({
            match_id: matchId,
            team_id: teamId,
            player_id: playerId,
            is_starter: true,
            lineup_position: p.number,
          });
        }
      }

      for (const p of lineup.bench || []) {
        const playerId = await resolvePlayerId(p.name, p.number, side, p.position);
        if (playerId) {
          lineupEntries.push({
            match_id: matchId,
            team_id: teamId,
            player_id: playerId,
            is_starter: false,
            lineup_position: p.number,
          });
        }
      }

      // Update coach
      if (lineup.coach) {
        try {
          await supabase.from('teams').update({ coach: lineup.coach }).eq('id', teamId);
        } catch { /* non-fatal */ }
      }
    }

    if (lineupEntries.length > 0) {
      // Deduplicate by player_id to avoid "ON CONFLICT DO UPDATE cannot affect row a second time"
      const seen = new Set<string>();
      const dedupedEntries = lineupEntries.filter(e => {
        const key = `${e.match_id}|${e.player_id}`;
        if (seen.has(key)) {
          result.errors.push(`Jogador duplicado na escalação (player_id=${e.player_id}), ignorando entrada extra`);
          return false;
        }
        seen.add(key);
        return true;
      });
      await upsertMatchLineups(dedupedEntries);
      result.lineupsCreated = dedupedEntries.length;
    }

    // 4. Process events in chronological order
    const sortedEvents = [...(data.events || [])].sort((a, b) => {
      const ha = a.half || 1;
      const hb = b.half || 1;
      if (ha !== hb) return ha - hb;
      return (a.minute || 0) - (b.minute || 0);
    });

    for (const ev of sortedEvents) {
      const teamId = getTeamId(ev.team);
      const halfStr = ev.half === 2 ? '2T' : ev.half === 3 ? 'PRO' : '1T';

      try {
        if (ev.type === 'goal') {
          const playerId = await resolvePlayerId(ev.player_name || '', ev.player_number, ev.team);
          if (!playerId) { result.errors.push(`Gol: jogador "${ev.player_name}" não resolvido`); continue; }
          
          const eventType = ev.detail === 'contra' ? 'own_goal' as const
            : ev.detail === 'penal' ? 'penalty_scored' as const
            : 'goal' as const;

          await insertMatchEvent({
            match_id: matchId,
            event_type: eventType,
            player_id: playerId,
            team_id: teamId,
            minute: ev.minute || 0,
            half: halfStr,
            detail: ev.detail ? { type: ev.detail } : undefined,
          });
          result.eventsCreated++;
          if (!result.eventBreakdown) result.eventBreakdown = {};
          result.eventBreakdown[eventType] = (result.eventBreakdown[eventType] || 0) + 1;
        }
        else if (ev.type === 'yellow_card') {
          const playerId = await resolvePlayerId(ev.player_name || '', ev.player_number, ev.team);
          if (!playerId) { result.errors.push(`Amarelo: jogador "${ev.player_name}" não resolvido`); continue; }
          
          await insertMatchEvent({
            match_id: matchId,
            event_type: 'yellow_card',
            player_id: playerId,
            team_id: teamId,
            minute: ev.minute || 0,
            half: halfStr,
            detail: ev.note ? { note: ev.note } : undefined,
          });
          result.eventsCreated++;
          if (!result.eventBreakdown) result.eventBreakdown = {};
          result.eventBreakdown['yellow_card'] = (result.eventBreakdown['yellow_card'] || 0) + 1;
        }
        else if (ev.type === 'red_card') {
          const playerId = await resolvePlayerId(ev.player_name || '', ev.player_number, ev.team);
          if (!playerId) { result.errors.push(`Vermelho: jogador "${ev.player_name}" não resolvido`); continue; }
          
          await insertMatchEvent({
            match_id: matchId,
            event_type: 'red_card',
            player_id: playerId,
            team_id: teamId,
            minute: ev.minute || 0,
            half: halfStr,
            detail: ev.detail ? { type: ev.detail, note: ev.note } : undefined,
          });
          result.eventsCreated++;
          if (!result.eventBreakdown) result.eventBreakdown = {};
          result.eventBreakdown['red_card'] = (result.eventBreakdown['red_card'] || 0) + 1;
        }
        else if (ev.type === 'substitution') {
          const playerOutId = await resolvePlayerId(ev.player_out_name || '', ev.player_out_number, ev.team);
          const playerInId = await resolvePlayerId(ev.player_in_name || '', ev.player_in_number, ev.team);
          
          if (!playerInId && !playerOutId) { result.errors.push(`Substituição: nenhum jogador resolvido (sai: "${ev.player_out_name}", entra: "${ev.player_in_name}")`); continue; }
          
          // Convention: player_id = who ENTERS, detail.player_out_id = who LEAVES
          await insertMatchEvent({
            match_id: matchId,
            event_type: 'substitution',
            player_id: playerInId || playerOutId!, // primary = who enters
            team_id: teamId,
            minute: ev.minute || 0,
            half: halfStr,
            detail: {
              player_out_id: playerOutId || undefined,
              player_in_id: playerInId || undefined,
            },
          });
          result.eventsCreated++;
          if (!result.eventBreakdown) result.eventBreakdown = {};
          result.eventBreakdown['substitution'] = (result.eventBreakdown['substitution'] || 0) + 1;
        }
      } catch (err: any) {
        result.errors.push(`Erro evento ${ev.type}: ${err.message}`);
      }
    }

    // 5. Recalculate all stats
    try {
      await recalculateAllStats(match.competition_id);
    } catch (err: any) {
      result.errors.push(`Erro ao recalcular stats: ${err.message}`);
    }

    result.success = true;
  } catch (err: any) {
    result.errors.push(`Erro fatal: ${err.message}`);
  }

  return result;
}