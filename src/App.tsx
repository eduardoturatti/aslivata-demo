import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner@2.0.3';
import { router } from './routes';
import { useEffect, lazy, Suspense } from 'react';
import { AuthProvider } from './lib/auth-context';
import { loadAdScript } from './lib/ad-utils';
import { projectId } from './utils/supabase/info';
import './styles/protection.css';

// Lazy-load DisplayView — only used with ?broadcast param (OBS).
// Loading eagerly pulled in 15+ Studio components + motion + supabase
// at boot, increasing the chance of module conflicts in the bundler.
const LazyDisplayView = lazy(() =>
  import('./components/DisplayView').then(m => ({ default: m.DisplayView }))
);

// Google Analytics — deferred to idle time
const GA_ID = 'G-316F8NP7EE';
function useGoogleAnalytics() {
  useEffect(() => {
    const init = () => {
      if (document.querySelector(`script[src*="googletagmanager.com/gtag/js?id=${GA_ID}"]`)) return;
      const s = document.createElement('script');
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
      document.head.appendChild(s);
      (window as any).dataLayer = (window as any).dataLayer || [];
      function gtag(...args: any[]) { (window as any).dataLayer.push(args); }
      gtag('js', new Date());
      gtag('config', GA_ID);
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(init, { timeout: 3000 });
    } else {
      setTimeout(init, 2000);
    }
  }, []);
}

// Google Fonts — async, non-render-blocking
function useAsyncFonts() {
  useEffect(() => {
    if (document.querySelector('link[data-fonts-loaded]')) return;
    const fontsUrl = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap';

    // Preconnect
    const pc1 = document.createElement('link');
    pc1.rel = 'preconnect';
    pc1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(pc1);

    const pc2 = document.createElement('link');
    pc2.rel = 'preconnect';
    pc2.href = 'https://fonts.gstatic.com';
    pc2.crossOrigin = 'anonymous';
    document.head.appendChild(pc2);

    // Preconnect to wsrv.nl image CDN (used for logo/news image optimization)
    const pc3 = document.createElement('link');
    pc3.rel = 'preconnect';
    pc3.href = 'https://wsrv.nl';
    document.head.appendChild(pc3);

    // Preconnect to Supabase
    const pc4 = document.createElement('link');
    pc4.rel = 'preconnect';
    pc4.href = `https://${projectId}.supabase.co`;
    document.head.appendChild(pc4);

    // Load stylesheet asynchronously
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'style';
    link.href = fontsUrl;
    link.setAttribute('data-fonts-loaded', 'true');
    link.onload = () => { link.rel = 'stylesheet'; };
    document.head.appendChild(link);

    // Fallback noscript
    const fallback = document.createElement('link');
    fallback.rel = 'stylesheet';
    fallback.href = fontsUrl;
    fallback.media = 'print';
    fallback.onload = () => { fallback.media = 'all'; };
    document.head.appendChild(fallback);
  }, []);
}

// Alright Network ad script (conditional, deferred)
function useAdNetwork() {
  useEffect(() => {
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => loadAdScript(), { timeout: 5000 });
    } else {
      setTimeout(() => loadAdScript(), 3000);
    }
  }, []);
}

// Anti-scraping protections — deferred, reduced frequency
function useProtections() {
  useEffect(() => {
    const init = () => {
      // Block right-click on images and data elements
      const handleContextMenu = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'IMG' ||
          target.closest('.protected-text') ||
          target.closest('.standings-table') ||
          target.closest('.match-card')
        ) {
          e.preventDefault();
          return false;
        }
      };
      document.addEventListener('contextmenu', handleContextMenu, { passive: false });

      // DevTools detection (friction only) — lower frequency
      let devToolsOpen = false;
      const detectDevTools = () => {
        const threshold = 160;
        const widthDiff = window.outerWidth - window.innerWidth;
        const heightDiff = window.outerHeight - window.innerHeight;
        if (widthDiff > threshold || heightDiff > threshold) {
          if (!devToolsOpen) {
            devToolsOpen = true;
            document.body.classList.add('devtools-open');
          }
        } else if (devToolsOpen) {
          devToolsOpen = false;
          document.body.classList.remove('devtools-open');
        }
      };
      const devToolsInterval = setInterval(detectDevTools, 4000);

      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        clearInterval(devToolsInterval);
      };
    };

    if ('requestIdleCallback' in window) {
      let cleanup: (() => void) | undefined;
      (window as any).requestIdleCallback(() => { cleanup = init() as any; }, { timeout: 4000 });
      return () => cleanup?.();
    } else {
      const timer = setTimeout(init, 2500);
      return () => clearTimeout(timer);
    }
  }, []);
}

export default function App() {
  useGoogleAnalytics();
  useAsyncFonts();
  useAdNetwork();
  useProtections();

  // Legacy support: ?broadcast query param -> full-screen display
  const params = new URLSearchParams(window.location.search);
  if (params.has('broadcast')) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-black" />}>
        <LazyDisplayView broadcast />
      </Suspense>
    );
  }

  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}