// Mock Supabase client - no real connection needed
const noop = () => {};
const noopAsync = async () => ({ data: null, error: null });
const chainable: any = new Proxy({}, {
  get: () => (..._args: any[]) => chainable,
});

// Realtime channel mock
function createChannel() {
  const ch: any = {
    on: () => ch,
    subscribe: (_cb?: any) => { _cb?.('SUBSCRIBED'); return ch; },
    unsubscribe: noop,
  };
  return ch;
}

export const supabase = {
  from: () => ({
    select: (..._a: any[]) => ({
      eq: (..._b: any[]) => ({
        single: noopAsync,
        maybeSingle: noopAsync,
        data: [],
        error: null,
        order: (..._c: any[]) => ({ data: [], error: null, limit: (..._d: any[]) => ({ data: [], error: null }) }),
        in: (..._c: any[]) => ({ data: [], error: null }),
        limit: (..._c: any[]) => ({ data: [], error: null }),
      }),
      in: (..._b: any[]) => ({ data: [], error: null }),
      order: (..._b: any[]) => ({ data: [], error: null, limit: (..._c: any[]) => ({ data: [], error: null }) }),
      data: [],
      error: null,
      limit: (..._b: any[]) => ({ data: [], error: null }),
    }),
    insert: noopAsync,
    update: noopAsync,
    delete: noopAsync,
    upsert: noopAsync,
  }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithOtp: noopAsync,
    verifyOtp: noopAsync,
    signOut: async () => {},
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: noop } } }),
    refreshSession: async () => ({ data: { session: null }, error: null }),
  },
  channel: (_name: string) => createChannel(),
  removeChannel: noop,
};
