import React, { createContext, useContext } from 'react';

// Demo user — always logged in
const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@aslivata.com.br',
  name: 'Torcedor Demo',
};

interface AuthState {
  user: typeof DEMO_USER | null;
  premium: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: DEMO_USER,
  premium: true,
  loading: false,
  signOut: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthContext.Provider value={{ user: DEMO_USER, premium: true, loading: false, signOut: async () => {}, refreshAuth: async () => {} }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
