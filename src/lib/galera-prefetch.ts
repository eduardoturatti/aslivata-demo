// Mock galera-prefetch - no real connection needed

export function getCachedSelecaoBatch(_round: number): any | null {
  return null;
}

export function getCachedBolaoBatch(): any | null {
  return null;
}

export async function prefetchGaleraData(_compId: string, _activeRound: number | null): Promise<void> {}

export function clearGaleraPrefetch(): void {}
