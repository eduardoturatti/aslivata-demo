// This component is now replaced by SceneManoAMano
// Kept for backward compatibility - redirects to ManoAMano

import { SceneManoAMano } from './SceneManoAMano';
import { TournamentData } from '../lib/supabase';

interface StudioTeamComparisonProps {
  data: TournamentData;
  fontScale?: number;
}

export function StudioTeamComparison({ data }: StudioTeamComparisonProps) {
  // Default to first two semifinalists if available
  const analysis = data.teamAnalysis || {};
  const keys = Object.keys(analysis);
  const t1 = keys[0] || null;
  const t2 = keys[1] || null;

  return <SceneManoAMano data={data} team1Id={t1} team2Id={t2} />;
}