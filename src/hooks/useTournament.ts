import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  fetchCompetition, fetchTeams, fetchMatches, fetchPlayers, fetchAllEvents,
  transformToTournamentData, computeTopScorers, computeTopAssists,
  computeCardRanking, computeTeamDiscipline, computeSuspensions,
  COMPETITION_ID,
  type SQLCompetition, type SQLTeam, type SQLMatch, type SQLPlayer, type SQLMatchEvent,
  type TournamentData, type ScorerEntry, type AssistEntry, type CardEntry,
  type TeamDiscipline, type SuspensionEntry,
} from '../lib/supabase';

export type {
  TournamentData, SQLTeam, SQLMatch, SQLPlayer, SQLMatchEvent, SQLCompetition,
  ScorerEntry, AssistEntry, CardEntry, TeamDiscipline, SuspensionEntry,
};
export type { Team, Match, Round, StandingEntry, PlayoffMatch, PlayoffRound } from '../lib/supabase';

interface UseTournamentOptions {
  pollInterval?: number;
  competitionId?: string;
}

export interface TournamentContext {
  // Legacy format for existing scenes
  data: TournamentData;
  // Raw SQL data
  competition: SQLCompetition | null;
  sqlTeams: SQLTeam[];
  sqlMatches: SQLMatch[];
  sqlPlayers: SQLPlayer[];
  sqlEvents: SQLMatchEvent[];
  // Computed stats
  topScorers: ScorerEntry[];
  topAssists: AssistEntry[];
  cardRanking: CardEntry[];
  teamDiscipline: TeamDiscipline[];
  suspensions: SuspensionEntry[];
  // Meta
  isLoading: boolean;
  error: string | null;
  lastUpdated: string;
  refetch: () => Promise<void>;
}

export function useTournament({ pollInterval = 15000, competitionId = COMPETITION_ID }: UseTournamentOptions = {}): TournamentContext {
  const [competition, setCompetition] = useState<SQLCompetition | null>(null);
  const [sqlTeams, setSqlTeams] = useState<SQLTeam[]>([]);
  const [sqlMatches, setSqlMatches] = useState<SQLMatch[]>([]);
  const [sqlPlayers, setSqlPlayers] = useState<SQLPlayer[]>([]);
  const [sqlEvents, setSqlEvents] = useState<SQLMatchEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);
  const loadCounterRef = useRef(0);

  // Reset data when competitionId changes
  useEffect(() => {
    setIsLoading(true);
    setCompetition(null);
    setSqlTeams([]);
    setSqlMatches([]);
    setSqlPlayers([]);
    setSqlEvents([]);
    setError(null);
  }, [competitionId]);

  const loadAll = useCallback(async () => {
    const thisLoad = ++loadCounterRef.current;
    try {
      const [comp, teams] = await Promise.all([
        fetchCompetition(competitionId),
        fetchTeams(competitionId),
      ]);
      if (!mountedRef.current || thisLoad !== loadCounterRef.current) return;

      setCompetition(comp);
      setSqlTeams(teams);

      const teamIds = teams.map(t => t.id);
      const [matches, players] = await Promise.all([
        fetchMatches(competitionId),
        fetchPlayers(teamIds),
      ]);
      if (!mountedRef.current || thisLoad !== loadCounterRef.current) return;

      setSqlMatches(matches);
      setSqlPlayers(players);

      const matchIds = matches.map(m => m.id);
      const events = await fetchAllEvents(matchIds);
      if (!mountedRef.current || thisLoad !== loadCounterRef.current) return;

      setSqlEvents(events);
      setError(null);
      setLastUpdated(new Date().toISOString());
    } catch (err: any) {
      console.error('useTournament loadAll error:', err);
      if (mountedRef.current) setError(err.message || 'Failed to load data');
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [competitionId]);

  // Initial load
  useEffect(() => {
    mountedRef.current = true;
    loadAll();
    return () => { mountedRef.current = false; };
  }, [loadAll]);

  // Polling
  useEffect(() => {
    if (pollInterval <= 0) return;
    pollRef.current = setInterval(loadAll, pollInterval);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [loadAll, pollInterval]);

  // Compute transformed data
  const data = useMemo<TournamentData>(() => {
    if (sqlTeams.length === 0) {
      return { teams: {}, rounds: [], standings: [], playoffRounds: [], teamAnalysis: {} };
    }
    return transformToTournamentData(sqlTeams, sqlMatches, sqlPlayers, sqlEvents);
  }, [sqlTeams, sqlMatches, sqlPlayers, sqlEvents]);

  // Compute stats
  const topScorers = useMemo(() => computeTopScorers(sqlEvents, sqlPlayers, sqlTeams), [sqlEvents, sqlPlayers, sqlTeams]);
  const topAssists = useMemo(() => computeTopAssists(sqlEvents, sqlPlayers, sqlTeams), [sqlEvents, sqlPlayers, sqlTeams]);
  const cardRanking = useMemo(() => computeCardRanking(sqlEvents, sqlPlayers, sqlTeams), [sqlEvents, sqlPlayers, sqlTeams]);
  const teamDiscipline = useMemo(() => computeTeamDiscipline(sqlEvents, sqlTeams), [sqlEvents, sqlTeams]);
  const suspensions = useMemo(() => {
    const yellowsForSusp = competition?.yellow_cards_suspension || 3;
    return computeSuspensions(sqlEvents, sqlPlayers, sqlTeams, yellowsForSusp);
  }, [sqlEvents, sqlPlayers, sqlTeams, competition]);

  return {
    data, competition, sqlTeams, sqlMatches, sqlPlayers, sqlEvents,
    topScorers, topAssists, cardRanking, teamDiscipline, suspensions,
    isLoading, error, lastUpdated, refetch: loadAll,
  };
}