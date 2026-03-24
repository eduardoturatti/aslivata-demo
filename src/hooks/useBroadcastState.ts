import { useState, useEffect, useCallback, useRef } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAdminToken } from '../lib/admin-token';
import { supabase as supabaseRT } from '../lib/supabase-client';
import type { RealtimeChannel } from '@supabase/supabase-js';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a98fb753`;
const DEVICE_ID = `device-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;
const REALTIME_CHANNEL = 'broadcast-sync';

// Persistent channel — shared across all instances
let _persistentChannel: RealtimeChannel | null = null;
let _channelReady = false;
const _channelListeners = new Set<(payload: any) => void>();

function ensureChannel() {
  if (_persistentChannel) return _persistentChannel;
  _persistentChannel = supabaseRT.channel(REALTIME_CHANNEL);
  _persistentChannel
    .on('broadcast', { event: 'scene-change' }, (payload) => {
      if (payload?.payload) {
        _channelListeners.forEach(fn => fn(payload.payload));
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        _channelReady = true;
        console.log('[Broadcast] Persistent Realtime channel connected');
      }
    });
  return _persistentChannel;
}

export interface BroadcastState {
  activeScene: string;
  roundIndex: number;
  selectedTeamSlug: string | null;
  selectedMatchId: string | null;
  selectedPlayerId: string | null;
  manoTeam1Slug: string | null;
  manoTeam2Slug: string | null;
  lastUpdated: string;
  updatedBy: string;
  controllerId?: string;
}

const DEFAULT_STATE: BroadcastState = {
  activeScene: 'home',
  roundIndex: 0,
  selectedTeamSlug: null,
  selectedMatchId: null,
  selectedPlayerId: null,
  manoTeam1Slug: null,
  manoTeam2Slug: null,
  lastUpdated: '',
  updatedBy: 'system',
  controllerId: undefined,
};

interface UseBroadcastStateOptions {
  mode: 'display' | 'control';
  pollInterval?: number;
}

export function useBroadcastState({ mode, pollInterval = 20000 }: UseBroadcastStateOptions) {
  const [state, setState] = useState<BroadcastState>(DEFAULT_STATE);
  const [isOnline, setIsOnline] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const lastSyncRef = useRef('');
  const stateRef = useRef(state);
  const bootedRef = useRef(false);

  useEffect(() => { stateRef.current = state; }, [state]);

  const apiFetch = useCallback(async (path: string, options?: RequestInit) => {
    return fetch(`${SERVER_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${publicAnonKey}`,
        'X-Device-ID': DEVICE_ID,
        'X-Admin-Token': getAdminToken(),
        ...(options?.headers || {}),
      },
    });
  }, []);

  const parseState = (s: any): BroadcastState => ({
    activeScene: s.activeScene || s.activeTab || 'home',
    roundIndex: s.roundIndex ?? 0,
    selectedTeamSlug: s.selectedTeamSlug || s.selectedTeam || null,
    selectedMatchId: s.selectedMatchId || null,
    selectedPlayerId: s.selectedPlayerId || null,
    manoTeam1Slug: s.manoTeam1Slug || s.manoTeam1 || null,
    manoTeam2Slug: s.manoTeam2Slug || s.manoTeam2 || null,
    lastUpdated: s.lastUpdated || '',
    updatedBy: s.updatedBy || 'system',
    controllerId: s.controllerId || undefined,
  });

  const applyRemoteState = useCallback((serverState: any) => {
    if (!serverState) return;
    if (serverState.updatedBy === DEVICE_ID) return;
    const newState = parseState(serverState);
    const cur = stateRef.current;
    const changed = cur.activeScene !== newState.activeScene ||
      cur.roundIndex !== newState.roundIndex ||
      cur.selectedTeamSlug !== newState.selectedTeamSlug ||
      cur.selectedMatchId !== newState.selectedMatchId ||
      cur.selectedPlayerId !== newState.selectedPlayerId ||
      cur.manoTeam1Slug !== newState.manoTeam1Slug ||
      cur.manoTeam2Slug !== newState.manoTeam2Slug;
    if (changed) setState(newState);
    lastSyncRef.current = serverState.lastUpdated || '';
    setIsOnline(true);
  }, []);

  // Boot
  useEffect(() => {
    const controller = new AbortController();
    let retryCount = 0;
    const maxRetries = 2;

    async function boot() {
      while (retryCount <= maxRetries && !controller.signal.aborted) {
        try {
          const res = await apiFetch('/boot', {
            method: 'POST',
            body: JSON.stringify({ data: null }),
            signal: controller.signal,
          });
          if (!res.ok) throw new Error(`Boot HTTP ${res.status}`);
          const bootData = await res.json();
          if (controller.signal.aborted) return;
          if (bootData.state) {
            const s = parseState(bootData.state);
            setState(s);
            lastSyncRef.current = bootData.state.lastUpdated || '';
          }
          setIsOnline(true);
          bootedRef.current = true;
          setIsLoading(false);
          return;
        } catch (err: any) {
          if (controller.signal.aborted) return;
          retryCount++;
          if (retryCount > maxRetries) {
            console.warn('Broadcast boot failed after retries:', err?.message);
            bootedRef.current = true;
            setIsLoading(false);
            return;
          }
          await new Promise(r => setTimeout(r, 1000 * retryCount));
        }
      }
    }
    boot();
    return () => { controller.abort(); };
  }, [apiFetch]);

  // Supabase Realtime — persistent channel for BOTH display and control
  useEffect(() => {
    const ch = ensureChannel();
    const listener = (payload: any) => {
      applyRemoteState(payload);
    };
    _channelListeners.add(listener);
    return () => {
      _channelListeners.delete(listener);
    };
  }, [applyRemoteState]);

  // Fallback polling (safety net — 20s default)
  useEffect(() => {
    if (!bootedRef.current && isLoading) return;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const poll = async () => {
      try {
        const res = await apiFetch('/sync');
        if (!res.ok) return;
        const data = await res.json();
        applyRemoteState(data.state);
      } catch {
        if (isOnline) setIsOnline(false);
      }
    };
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(poll, pollInterval);
    }, 500);
    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [apiFetch, applyRemoteState, pollInterval, isLoading, isOnline]);

  // Update state (control mode) — save to KV + broadcast via persistent channel INSTANTLY
  const updateState = useCallback(async (updates: Partial<BroadcastState>) => {
    if (mode === 'display') return;
    const newState = { ...stateRef.current, ...updates };
    setState(newState);

    const payload = {
      ...newState,
      activeTab: newState.activeScene,
      selectedTeam: newState.selectedTeamSlug,
      manoTeam1: newState.manoTeam1Slug,
      manoTeam2: newState.manoTeam2Slug,
      updatedBy: DEVICE_ID,
      lastUpdated: new Date().toISOString(),
    };

    // Send via persistent Realtime channel IMMEDIATELY (no waiting)
    if (_persistentChannel && _channelReady) {
      _persistentChannel.send({
        type: 'broadcast',
        event: 'scene-change',
        payload,
      });
    }

    // Persist to KV in background (non-blocking)
    apiFetch('/tv-state', {
      method: 'POST',
      body: JSON.stringify(payload),
    }).then(res => {
      if (res.ok) {
        res.json().then(result => {
          lastSyncRef.current = result.lastUpdated;
          setIsOnline(true);
        });
      }
    }).catch(() => {
      setIsOnline(false);
    });
  }, [mode, apiFetch]);

  return { state, isOnline, isLoading, deviceId: DEVICE_ID, updateState };
}