import { createBrowserRouter } from 'react-router';
import { lazy, Suspense } from 'react';
import { Layout } from './components/public/Layout';
import { NotFoundPage } from './pages/NotFoundPage';

// ============================
// LAZY-LOADED PAGES — Code splitting for performance
// Heavy pages load on demand, reducing initial bundle size.
// ============================

// Public pages (lazy)
const HomePage = lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })));
const StandingsPage = lazy(() => import('./pages/StandingsPage').then(m => ({ default: m.StandingsPage })));
const TeamsPage = lazy(() => import('./pages/TeamsPage').then(m => ({ default: m.TeamsPage })));
const TeamDetailPage = lazy(() => import('./pages/TeamDetailPage').then(m => ({ default: m.TeamDetailPage })));
const MatchDetailPage = lazy(() => import('./pages/MatchDetailPage').then(m => ({ default: m.MatchDetailPage })));
const PlayerPage = lazy(() => import('./pages/PlayerPage').then(m => ({ default: m.PlayerPage })));
const PremiumPage = lazy(() => import('./pages/PremiumPage').then(m => ({ default: m.PremiumPage })));
const TopScorersPage = lazy(() => import('./pages/TopScorersPage').then(m => ({ default: m.TopScorersPage })));
const TopAssistsPage = lazy(() => import('./pages/TopAssistsPage').then(m => ({ default: m.TopAssistsPage })));
const CardsPage = lazy(() => import('./pages/CardsPage').then(m => ({ default: m.CardsPage })));
const HeadToHeadPage = lazy(() => import('./pages/HeadToHeadPage').then(m => ({ default: m.HeadToHeadPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const AboutPage = lazy(() => import('./pages/AboutPage').then(m => ({ default: m.AboutPage })));
const TermsPage = lazy(() => import('./pages/TermsPage').then(m => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage').then(m => ({ default: m.PrivacyPage })));
const GaleraPage = lazy(() => import('./pages/GaleraPage').then(m => ({ default: m.GaleraPage })));
const NewsPage = lazy(() => import('./pages/NewsPage').then(m => ({ default: m.NewsPage })));
const BolaoPage = lazy(() => import('./pages/BolaoPage').then(m => ({ default: m.BolaoPage })));
const PlayerPortalPage = lazy(() => import('./pages/PlayerPortalPage').then(m => ({ default: m.PlayerPortalPage })));

// Admin (lazy — heavy chunk, only loaded when admin accesses)
const AdminGate = lazy(() => import('./components/AdminGate').then(m => ({ default: m.AdminGate })));
const ManagerPanel = lazy(() => import('./components/ManagerPanel').then(m => ({ default: m.ManagerPanel })));
const PrintNewspaperPage = lazy(() => import('./pages/PrintNewspaperPage').then(m => ({ default: m.PrintNewspaperPage })));

// Broadcast (lazy — only loaded in OBS)
const TvPage = lazy(() => import('./pages/TvPage').then(m => ({ default: m.TvPage })));

// Scout (lazy — only loaded when scout accesses via token link)
const ScoutPage = lazy(() => import('./pages/ScoutPage').then(m => ({ default: m.ScoutPage })));

// ============================
// SUSPENSE WRAPPER — minimal loading state
// ============================
function LazyFallback() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function withSuspense(Component: React.ComponentType) {
  return function SuspenseWrapped() {
    return (
      <Suspense fallback={<LazyFallback />}>
        <Component />
      </Suspense>
    );
  };
}

// ============================
// UNIFIED ROUTER — POWER SPORTS + POWER ARENA
//
// ESTRUTURA DE URLs:
//
//   PUBLICO (Power Sports — app mobile-first, dark mode)
//   /                    → Home (jogos da rodada, proximos jogos)
//   /classificacao       → Tabela de classificacao
//   /times               → Lista de times
//   /time/:slug          → Perfil do time
//   /jogo/:id            → Detalhe da partida
//   /jogador/:id         → Perfil do jogador
//   /artilharia          → Ranking de gols
//   /assistencias        → Ranking de assistencias
//   /cartoes             → Ranking de cartoes
//   /mano-a-mano         → Comparacao entre times
//   /galera              → Selecao da Galera + Bolao
//   /premium             → Plano Premium (R$19,90)
//   /conta               → Login / perfil do usuario
//   /sobre               → Sobre o app
//   /termos              → Termos de uso
//   /privacidade         → Politica de privacidade
//   /noticias            → Noticias
//   /meu-perfil/:token   → Portal do jogador
//
//   ADMIN (Power Arena — painel de controle, protegido por senha)
//   /admin               → Gate de senha → ManagerPanel
//
//   BROADCAST (TV Interativa — tela 1920x1080 para OBS)
//   /tv                  → DisplayView em tela cheia (usar no OBS)
//
//   SCOUT (Live scouting — mobile interface for field reps)
//   /live/:token         → Live scouting interface
//
// DOMINIO:
//   power.jornalfv.com.br → este projeto
//
// ============================
export const router = createBrowserRouter([
  // ========== PUBLIC (Power Sports — fan app) ==========
  {
    path: '/',
    Component: Layout,
    children: [
      { index: true, Component: withSuspense(HomePage) },
      { path: 'classificacao', Component: withSuspense(StandingsPage) },
      { path: 'times', Component: withSuspense(TeamsPage) },
      { path: 'time/:slug', Component: withSuspense(TeamDetailPage) },
      { path: 'jogo/:id', Component: withSuspense(MatchDetailPage) },
      { path: 'jogador/:id', Component: withSuspense(PlayerPage) },
      { path: 'premium', Component: withSuspense(PremiumPage) },
      { path: 'artilharia', Component: withSuspense(TopScorersPage) },
      { path: 'assistencias', Component: withSuspense(TopAssistsPage) },
      { path: 'cartoes', Component: withSuspense(CardsPage) },
      { path: 'mano-a-mano', Component: withSuspense(HeadToHeadPage) },
      { path: 'conta', Component: withSuspense(LoginPage) },
      { path: 'sobre', Component: withSuspense(AboutPage) },
      { path: 'termos', Component: withSuspense(TermsPage) },
      { path: 'privacidade', Component: withSuspense(PrivacyPage) },
      { path: 'galera/:tab?/:round?', Component: withSuspense(GaleraPage) },
      { path: 'bolao', Component: withSuspense(BolaoPage) },
      { path: 'noticias', Component: withSuspense(NewsPage) },
      { path: 'meu-perfil/:token', Component: withSuspense(PlayerPortalPage) },
      // 404 catch-all dentro do layout publico
      { path: '*', Component: NotFoundPage },
    ],
  },

  // ========== ADMIN (Power Arena — Manager Panel) ==========
  // Protegido por senha (sessionStorage)
  {
    path: '/admin',
    Component: withSuspense(AdminGate),
    children: [
      { index: true, Component: withSuspense(ManagerPanel) },
      { path: 'jornal', Component: withSuspense(PrintNewspaperPage) },
    ],
  },

  // ========== BROADCAST (TV — 1920x1080 para OBS) ==========
  // Sem layout, sem header, tela inteira
  {
    path: '/tv',
    Component: withSuspense(TvPage),
  },

  // ========== SCOUT (Live scouting — mobile interface for field reps) ==========
  // Sem layout, dark theme dedicado, mobile-first
  {
    path: '/live/:token',
    Component: withSuspense(ScoutPage),
  },
]);