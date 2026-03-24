// ============================
// SUMULA PARSER — Parse raw súmula text into MatchImportJSON
// Power Sports / Arena Força do Vale
// ============================
// Parses the structured súmula format directly, no ChatGPT needed.
// Format example:
//   📋 SÚMULA DA PARTIDA
//   S.E.R.C. OURO VERDE x E.C. NACIONAL
//   Árbitro: André Ribeiro
//   🟢 S.E.R.C. OURO VERDE
//   Titulares
//   1 – Thainan Henrique Horst
//   ...

import type { MatchImportJSON, ImportPlayer, ImportEvent, ImportSuspension } from './match-import';

interface ParseResult {
  success: boolean;
  data: MatchImportJSON['match_import'] | null;
  errors: string[];
  warnings: string[];
}

// Detect if text is a súmula (not JSON)
export function isSumulaText(text: string): boolean {
  const t = text.trim();
  // It's JSON if it starts with { or [
  if (t.startsWith('{') || t.startsWith('[')) return false;
  // Check for súmula markers
  const markers = [
    /s[uú]mula/i,
    /titulares/i,
    /banco\s*de\s*reservas/i,
    /cart[oõ]es?\s*amarel/i,
    /cart[oõ]es?\s*vermelh/i,
    /substitui[çc][oõã]es/i,
    /[áa]rbitro/i,
    /\d+\s*[–\-—]\s*\w+/,  // "1 – Name" pattern
  ];
  const matchCount = markers.filter(m => m.test(t)).length;
  return matchCount >= 3;
}

export function parseSumula(
  text: string,
  homeTeamName: string,
  awayTeamName: string,
  competitionId: string,
  roundNumber: number,
  matchDate: string | null,
): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // ── Parse referee ──
  let referee = '';
  for (const line of lines) {
    const refMatch = line.match(/[áa]rbitro\s*:\s*(.+)/i);
    if (refMatch) { referee = refMatch[1].trim(); break; }
  }

  // ── Find team sections ──
  // Team sections start with emoji + team name, or just the team name after a divider
  const teamSections = findTeamSections(lines, homeTeamName, awayTeamName);

  if (!teamSections.home) warnings.push(`Seção do time mandante "${homeTeamName}" não encontrada na súmula`);
  if (!teamSections.away) warnings.push(`Seção do time visitante "${awayTeamName}" não encontrada na súmula`);

  // ── Parse lineups ──
  const homeLineup = teamSections.home
    ? parseTeamSection(teamSections.home.lines)
    : { starters: [], bench: [], coach: '' };
  const awayLineup = teamSections.away
    ? parseTeamSection(teamSections.away.lines)
    : { starters: [], bench: [], coach: '' };

  // ── Parse events ──
  const events: ImportEvent[] = [];
  const suspensions: ImportSuspension[] = [];

  // Build a lookup of all players by number for each team
  const allHomePlayers = [...homeLineup.starters, ...homeLineup.bench];
  const allAwayPlayers = [...awayLineup.starters, ...awayLineup.bench];

  // Parse yellow cards for home
  if (teamSections.home) {
    const yellows = parseCards(teamSections.home.lines, 'yellow');
    for (const c of yellows) {
      events.push({
        type: 'yellow_card',
        team: 'home',
        player_name: c.playerName,
        player_number: c.playerNumber,
        minute: c.minute,
        half: c.half,
      });
    }
    const reds = parseCards(teamSections.home.lines, 'red');
    for (const c of reds) {
      events.push({
        type: 'red_card',
        team: 'home',
        player_name: c.playerName,
        player_number: c.playerNumber,
        minute: c.minute,
        half: c.half,
        detail: 'direto',
      });
      suspensions.push({
        player_name: c.playerName,
        player_number: c.playerNumber,
        team: 'home',
        reason: 'vermelho_direto',
        games_suspended: 1,
        next_eligible_round: null,
        note: '',
      });
    }
    const subs = parseSubstitutions(teamSections.home.lines);
    for (const s of subs) {
      events.push({
        type: 'substitution',
        team: 'home',
        player_out_name: s.outName,
        player_out_number: s.outNumber,
        player_in_name: s.inName,
        player_in_number: s.inNumber,
        minute: s.minute,
        half: s.half,
      });
    }
  }

  // Parse yellow/red cards and subs for away
  if (teamSections.away) {
    const yellows = parseCards(teamSections.away.lines, 'yellow');
    for (const c of yellows) {
      events.push({
        type: 'yellow_card',
        team: 'away',
        player_name: c.playerName,
        player_number: c.playerNumber,
        minute: c.minute,
        half: c.half,
      });
    }
    const reds = parseCards(teamSections.away.lines, 'red');
    for (const c of reds) {
      events.push({
        type: 'red_card',
        team: 'away',
        player_name: c.playerName,
        player_number: c.playerNumber,
        minute: c.minute,
        half: c.half,
        detail: 'direto',
      });
      suspensions.push({
        player_name: c.playerName,
        player_number: c.playerNumber,
        team: 'away',
        reason: 'vermelho_direto',
        games_suspended: 1,
        next_eligible_round: null,
        note: '',
      });
    }
    const subs = parseSubstitutions(teamSections.away.lines);
    for (const s of subs) {
      events.push({
        type: 'substitution',
        team: 'away',
        player_out_name: s.outName,
        player_out_number: s.outNumber,
        player_in_name: s.inName,
        player_in_number: s.inNumber,
        minute: s.minute,
        half: s.half,
      });
    }
  }

  // Check for two yellows = suspension
  const yellowCount: Record<string, { count: number; name: string; number: number; team: 'home' | 'away' }> = {};
  for (const ev of events) {
    if (ev.type === 'yellow_card' && ev.player_name) {
      const key = `${ev.team}-${ev.player_number || ev.player_name}`;
      if (!yellowCount[key]) yellowCount[key] = { count: 0, name: ev.player_name, number: ev.player_number || 0, team: ev.team };
      yellowCount[key].count++;
    }
  }
  for (const entry of Object.values(yellowCount)) {
    if (entry.count >= 2) {
      // Check if already has a red card suspension
      const alreadySuspended = suspensions.some(s => s.player_number === entry.number && s.team === entry.team);
      if (!alreadySuspended) {
        suspensions.push({
          player_name: entry.name,
          player_number: entry.number,
          team: entry.team,
          reason: 'dois_amarelos',
          games_suspended: 1,
          next_eligible_round: null,
          note: '',
        });
      }
    }
  }

  // Try to extract score from header
  let homeScore = 0;
  let awayScore = 0;
  let scoreFound = false;
  for (const line of lines) {
    // Match patterns like "3x1", "3 x 1", "3-1", "3 a 1"
    const scoreMatch = line.match(/(\d+)\s*[xX×]\s*(\d+)/);
    if (scoreMatch) {
      homeScore = parseInt(scoreMatch[1]);
      awayScore = parseInt(scoreMatch[2]);
      scoreFound = true;
      break;
    }
  }
  if (!scoreFound) {
    warnings.push('Placar não encontrado na súmula — informe manualmente');
  }

  // Parse goals (look for "Gols" or "Gol" section anywhere)
  const goalEvents = parseGoals(lines, homeTeamName, awayTeamName, allHomePlayers, allAwayPlayers);
  events.push(...goalEvents);

  const data: MatchImportJSON['match_import'] = {
    version: '1.0',
    competition_id: competitionId,
    round_number: roundNumber,
    match_date: matchDate || '',
    home_team: { name: homeTeamName, score: homeScore },
    away_team: { name: awayTeamName, score: awayScore },
    lineups: {
      home: homeLineup,
      away: awayLineup,
    },
    events,
    suspensions,
    notes: referee ? `Árbitro: ${referee}` : '',
  };

  return {
    success: errors.length === 0,
    data,
    errors,
    warnings,
  };
}

// ── HELPERS ──────────────────────────────────────────

interface TeamSection {
  teamName: string;
  lines: string[];
}

function normalizeForCompare(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s]/g, '').trim();
}

function findTeamSections(lines: string[], homeName: string, awayName: string): { home: TeamSection | null; away: TeamSection | null } {
  const homeNorm = normalizeForCompare(homeName);
  const awayNorm = normalizeForCompare(awayName);
  
  // Find lines that contain team names (with emoji markers or after dividers)
  const teamStartIndices: { index: number; team: 'home' | 'away'; name: string }[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const lineNorm = normalizeForCompare(lines[i]);
    const line = lines[i];
    
    // Check for team markers: emoji + name, or just name in a header-like position
    const isTeamHeader = /^[🟢🔴⚪🟡🔵🟠⚫🏳️🏴\u2B1B\u2B1C\u26AA\u26AB]/.test(line) || 
                          (i > 0 && /^[⸻─━—\-]{2,}/.test(lines[i-1]));
    
    if (isTeamHeader || lineNorm.length > 3) {
      // Check home team
      const homeWords = homeNorm.split(/\s+/).filter(w => w.length > 2);
      const awayWords = awayNorm.split(/\s+/).filter(w => w.length > 2);
      
      const homeMatchCount = homeWords.filter(w => lineNorm.includes(w)).length;
      const awayMatchCount = awayWords.filter(w => lineNorm.includes(w)).length;
      
      if (homeMatchCount >= Math.max(1, homeWords.length * 0.5) && homeMatchCount > awayMatchCount) {
        // Check it's not just the header "X x Y" line
        if (!lineNorm.match(/\d\s*x\s*\d/) && !lineNorm.includes(' x ')) {
          teamStartIndices.push({ index: i, team: 'home', name: homeName });
        }
      } else if (awayMatchCount >= Math.max(1, awayWords.length * 0.5) && awayMatchCount > homeMatchCount) {
        if (!lineNorm.match(/\d\s*x\s*\d/) && !lineNorm.includes(' x ')) {
          teamStartIndices.push({ index: i, team: 'away', name: awayName });
        }
      }
    }
  }

  // Sort by position
  teamStartIndices.sort((a, b) => a.index - b.index);

  // Extract sections
  let home: TeamSection | null = null;
  let away: TeamSection | null = null;

  for (let t = 0; t < teamStartIndices.length; t++) {
    const start = teamStartIndices[t].index;
    const end = t + 1 < teamStartIndices.length ? teamStartIndices[t + 1].index : lines.length;
    const sectionLines = lines.slice(start, end);
    const section: TeamSection = { teamName: teamStartIndices[t].name, lines: sectionLines };
    
    if (teamStartIndices[t].team === 'home' && !home) home = section;
    if (teamStartIndices[t].team === 'away' && !away) away = section;
  }

  return { home, away };
}

function parseTeamSection(lines: string[]): { starters: ImportPlayer[]; bench: ImportPlayer[]; coach: string } {
  const starters: ImportPlayer[] = [];
  const bench: ImportPlayer[] = [];
  let coach = '';
  
  let mode: 'none' | 'starters' | 'bench' = 'none';
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    
    // Detect sections
    if (/titular/i.test(line)) { mode = 'starters'; continue; }
    if (/banco|reserva/i.test(line)) { mode = 'bench'; continue; }
    if (/t[eé]cnico|treinador/i.test(line)) {
      const coachMatch = line.match(/(?:t[eé]cnico|treinador)\s*:?\s*(.+)/i);
      if (coachMatch) coach = coachMatch[1].trim();
      continue;
    }
    if (/cart[oõ]es?\s*amarel/i.test(line) || /cart[oõ]es?\s*vermelh/i.test(line) || /substitui/i.test(line)) {
      mode = 'none';
      continue;
    }
    
    // Skip dividers and empty-ish lines
    if (/^[⸻─━—\-]{2,}$/.test(line)) { continue; }
    if (line.length < 3) continue;
    
    // Try to parse player line: "1 – Name" or "1 - Name" or "#1 Name"
    const playerMatch = line.match(/^#?(\d+)\s*[–\-—:\.]\s*(.+)$/);
    if (playerMatch && mode !== 'none') {
      const number = parseInt(playerMatch[1]);
      const name = playerMatch[2].trim();
      if (name.length > 1) {
        const player: ImportPlayer = { number, name, position: '' };
        if (mode === 'starters') starters.push(player);
        else bench.push(player);
      }
    }
  }
  
  return { starters, bench, coach };
}

interface CardInfo {
  minute: number | null;
  half: number;
  playerNumber: number;
  playerName: string;
}

function parseCards(lines: string[], type: 'yellow' | 'red'): CardInfo[] {
  const cards: CardInfo[] = [];
  let inSection = false;
  
  for (const line of lines) {
    // Detect section start
    if (type === 'yellow' && /cart[oõ]es?\s*amarel/i.test(line)) { inSection = true; continue; }
    if (type === 'red' && /cart[oõ]es?\s*vermelh/i.test(line)) { inSection = true; continue; }
    
    // Section ends at divider or other section
    if (inSection) {
      if (/^[⸻─━—\-]{2,}$/.test(line)) { inSection = false; continue; }
      if (/cart[oõ]es?/i.test(line) || /substitui/i.test(line) || /banco|reserva|titular/i.test(line)) {
        inSection = false;
        continue;
      }
      
      // Parse card line: "45' 1ºT – Nº 14 Marcelo Labres" or "45' 2ºT – Nº 14 Marcelo"
      const cardMatch = line.match(/(\d+)['\u2019]?\s*(\d)[ºo°]?\s*T\s*[–\-—]\s*(?:N[ºo°]?\s*)?(\d+)\s+(.+)/i);
      if (cardMatch) {
        cards.push({
          minute: parseInt(cardMatch[1]),
          half: parseInt(cardMatch[2]),
          playerNumber: parseInt(cardMatch[3]),
          playerName: cardMatch[4].trim(),
        });
        continue;
      }
      
      // Simpler format: "Nº 14 Marcelo Labres" (no minute)
      const simpleMatch = line.match(/(?:N[ºo°]?\s*)?(\d+)\s*[–\-—]\s*(.+)/i);
      if (simpleMatch) {
        cards.push({
          minute: null,
          half: 1,
          playerNumber: parseInt(simpleMatch[1]),
          playerName: simpleMatch[2].trim(),
        });
      }
    }
  }
  
  return cards;
}

interface SubInfo {
  minute: number | null;
  half: number;
  outName: string;
  outNumber: number;
  inName: string;
  inNumber: number;
}

function parseSubstitutions(lines: string[]): SubInfo[] {
  const subs: SubInfo[] = [];
  let inSection = false;
  let currentMinute: number | null = null;
  let currentHalf = 2;
  let pendingOut: { name: string; number: number } | null = null;
  
  for (const line of lines) {
    if (/substitui[çc][oõã]es/i.test(line)) { inSection = true; continue; }
    
    if (inSection) {
      if (/^[⸻─━—\-]{2,}$/.test(line) && !pendingOut) { inSection = false; continue; }
      if (/cart[oõ]es?/i.test(line) || /titular/i.test(line) || /banco|reserva/i.test(line)) {
        inSection = false;
        continue;
      }
      
      // Minute line: "11' 2ºT" or "Intervalo"
      const minuteMatch = line.match(/^(\d+)['\u2019]?\s*(\d)[ºo°]?\s*T\s*$/i);
      if (minuteMatch) {
        currentMinute = parseInt(minuteMatch[1]);
        currentHalf = parseInt(minuteMatch[2]);
        continue;
      }
      if (/^intervalo$/i.test(line)) {
        currentMinute = 45;
        currentHalf = 1;
        continue;
      }
      
      // "Sai: Nº 19 Ivan Carlos Rasche"
      const outMatch = line.match(/sai\s*:?\s*(?:N[ºo°]?\s*)?(\d+)\s+(.+)/i);
      if (outMatch) {
        pendingOut = { number: parseInt(outMatch[1]), name: outMatch[2].trim() };
        continue;
      }
      
      // "Entra: Nº 21 Mauricio Manica Capitanio"
      const inMatch = line.match(/entra\s*:?\s*(?:N[ºo°]?\s*)?(\d+)\s+(.+)/i);
      if (inMatch && pendingOut) {
        subs.push({
          minute: currentMinute,
          half: currentHalf,
          outName: pendingOut.name,
          outNumber: pendingOut.number,
          inName: inMatch[2].trim(),
          inNumber: parseInt(inMatch[1]),
        });
        pendingOut = null;
        continue;
      }
      
      // Inline format: "11' 2ºT – Sai Nº 19 X / Entra Nº 21 Y"
      const inlineMatch = line.match(/(\d+)['\u2019]?\s*(\d)[ºo°]?\s*T\s*[–\-—]\s*sai\s*:?\s*(?:N[ºo°]?\s*)?(\d+)\s+(.+?)\s*[\/,]\s*entra\s*:?\s*(?:N[ºo°]?\s*)?(\d+)\s+(.+)/i);
      if (inlineMatch) {
        subs.push({
          minute: parseInt(inlineMatch[1]),
          half: parseInt(inlineMatch[2]),
          outName: inlineMatch[4].trim(),
          outNumber: parseInt(inlineMatch[3]),
          inName: inlineMatch[6].trim(),
          inNumber: parseInt(inlineMatch[5]),
        });
      }
    }
  }
  
  return subs;
}

function parseGoals(
  lines: string[],
  homeName: string,
  awayName: string,
  homePlayers: ImportPlayer[],
  awayPlayers: ImportPlayer[],
): ImportEvent[] {
  const goals: ImportEvent[] = [];
  let inSection = false;
  
  for (const line of lines) {
    if (/^gols?\s*:?\s*$/i.test(line.trim()) || /^gols?\s+d[ao]/i.test(line.trim())) {
      inSection = true;
      continue;
    }
    
    if (inSection) {
      if (/^[⸻─━—\-]{2,}$/.test(line) || line.trim().length === 0) { inSection = false; continue; }
      
      // Try to parse goal: "NOME 9 aos 20 do 1T" or "20' 1ºT – Nº 9 Nome"
      const goalMatch = line.match(/(\d+)['\u2019]?\s*(\d)[ºo°]?\s*T\s*[–\-—]\s*(?:N[ºo°]?\s*)?(\d+)\s+(.+)/i);
      if (goalMatch) {
        const playerNumber = parseInt(goalMatch[3]);
        const playerName = goalMatch[4].trim().replace(/\s*\(.*\)\s*$/, ''); // Remove parenthetical
        
        // Determine team from player number
        const isHome = homePlayers.some(p => p.number === playerNumber);
        const isAway = awayPlayers.some(p => p.number === playerNumber);
        
        let detail = 'normal';
        const lower = line.toLowerCase();
        if (lower.includes('penal') || lower.includes('pênalti')) detail = 'penal';
        if (lower.includes('contra') || lower.includes('gc')) detail = 'contra';
        if (lower.includes('falta')) detail = 'falta';
        
        goals.push({
          type: 'goal',
          team: isHome ? 'home' : isAway ? 'away' : 'home',
          player_name: playerName,
          player_number: playerNumber,
          minute: parseInt(goalMatch[1]),
          half: parseInt(goalMatch[2]),
          detail,
        });
      }
    }
  }
  
  return goals;
}
