export async function adminDbCall(..._args: any[]): Promise<any> {
  return { data: null };
}

export async function adminDbBatch(..._args: any[]): Promise<any> {
  return { data: null };
}

export async function adminRecalculateStats(_competitionId?: string): Promise<{ teamsUpdated: number; playersUpdated: number; errors: string[] }> {
  return { teamsUpdated: 0, playersUpdated: 0, errors: [] };
}
