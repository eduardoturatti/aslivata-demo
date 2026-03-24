import type { TournamentData, StandingEntry, Round } from '../hooks/useTournament';

/**
 * CÁLCULO AUTOMÁTICO DE CLASSIFICAÇÃO
 * Baseado no regulamento da LEEA - Campeonato 26ª Regional Certel/Sicredi 2025
 *
 * Pontuação: V=3, E=1, D=0
 * Critérios de desempate (ordem):
 *   1. Pontos (TPG) - maior
 *   2. Disciplina (DISC) - menor (amarelo=10pts, vermelho=50pts)
 *   3. Vitórias (V) - maior
 *   4. Gols Pró (GP) - maior
 *   5. Gols Contra (GC) - menor
 *   6. Saldo de Gols (SG) - maior
 *   7. Sorteio (não automatizável)
 */
export function calculateStandings(data: TournamentData): StandingEntry[] {
  const teamIds = Object.keys(data.teams);
  if (teamIds.length === 0) return [];

  // Initialize accumulators
  const acc: Record<string, {
    j: number; v: number; e: number; d: number;
    gp: number; gc: number;
    ca: number; cv: number; disc: number;
  }> = {};

  teamIds.forEach(id => {
    acc[id] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, ca: 0, cv: 0, disc: 0 };
  });

  // Preserve existing card data from current standings
  if (data.standings) {
    data.standings.forEach(s => {
      if (acc[s.teamId]) {
        acc[s.teamId].ca = s.ca || 0;
        acc[s.teamId].cv = s.cv || 0;
        acc[s.teamId].disc = s.disc || 0;
      }
    });
  }

  // Process all rounds
  (data.rounds || []).forEach((round: Round) => {
    round.matches.forEach(match => {
      if (match.scoreHome === null || match.scoreAway === null) return;
      if (!match.home || !match.away) return;

      const h = match.home;
      const a = match.away;

      // Ensure teams exist in accumulator (safety)
      if (!acc[h]) acc[h] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, ca: 0, cv: 0, disc: 0 };
      if (!acc[a]) acc[a] = { j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, ca: 0, cv: 0, disc: 0 };

      const sh = match.scoreHome;
      const sa = match.scoreAway;

      // Games played
      acc[h].j++;
      acc[a].j++;

      // Goals
      acc[h].gp += sh;
      acc[h].gc += sa;
      acc[a].gp += sa;
      acc[a].gc += sh;

      // Results
      if (sh > sa) {
        // Home win
        acc[h].v++;
        acc[a].d++;
      } else if (sa > sh) {
        // Away win
        acc[a].v++;
        acc[h].d++;
      } else {
        // Draw
        acc[h].e++;
        acc[a].e++;
      }
    });
  });

  // Build standings entries
  const entries: StandingEntry[] = teamIds.map(teamId => {
    const t = acc[teamId];
    const tpg = t.v * 3 + t.e * 1;
    const sg = t.gp - t.gc;
    const maxPts = t.j * 3;
    const pct = maxPts > 0 ? Math.round((tpg / maxPts) * 100) : 0;

    return {
      pos: 0, // Will be set after sorting
      teamId,
      tpg,
      j: t.j,
      v: t.v,
      e: t.e,
      d: t.d,
      gp: t.gp,
      gc: t.gc,
      sg,
      ca: t.ca,
      cv: t.cv,
      disc: t.disc,
      pct,
    };
  });

  // Sort by tiebreaker criteria
  entries.sort((a, b) => {
    // 1. Pontos (maior)
    if (a.tpg !== b.tpg) return b.tpg - a.tpg;
    // 2. Disciplina (menor = melhor)
    if (a.disc !== b.disc) return a.disc - b.disc;
    // 3. Vitórias (maior)
    if (a.v !== b.v) return b.v - a.v;
    // 4. Gols Pró (maior)
    if (a.gp !== b.gp) return b.gp - a.gp;
    // 5. Gols Contra (menor = melhor)
    if (a.gc !== b.gc) return a.gc - b.gc;
    // 6. Saldo de Gols (maior)
    if (a.sg !== b.sg) return b.sg - a.sg;
    // 7. Sorteio - alphabetical as fallback
    return a.teamId.localeCompare(b.teamId);
  });

  // Assign positions
  entries.forEach((entry, idx) => {
    entry.pos = idx + 1;
  });

  return entries;
}

/**
 * Auto-populate playoff matchups from standings
 * Semi 1: 1st vs 4th
 * Semi 2: 2nd vs 3rd
 */
export function autoPopulatePlayoffs(data: TournamentData): TournamentData {
  const standings = data.standings || [];
  if (standings.length < 4) return data;

  const playoffRounds = data.playoffRounds ? [...data.playoffRounds.map(r => ({
    ...r,
    matches: r.matches.map(m => ({ ...m })),
  }))] : [];

  if (playoffRounds.length === 0) return data;

  // Only auto-populate if semifinal teams aren't set yet
  const semis = playoffRounds[0];
  if (semis && semis.matches.length >= 2) {
    const s1 = semis.matches[0];
    const s2 = semis.matches[1];

    // Auto-populate if empty
    if (!s1.team1 && !s1.team2) {
      s1.team1 = standings[0]?.teamId || '';
      s1.team2 = standings[3]?.teamId || '';
    }
    if (!s2.team1 && !s2.team2) {
      s2.team1 = standings[1]?.teamId || '';
      s2.team2 = standings[2]?.teamId || '';
    }
  }

  return { ...data, playoffRounds };
}
