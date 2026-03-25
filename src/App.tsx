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

// Anti-scraping / anti-copy protections — multiple friction layers
function useProtections() {
  useEffect(() => {
    // Block right-click entirely
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener('contextmenu', handleContextMenu, { passive: false });

    // Block keyboard shortcuts used to inspect/copy source
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 — DevTools
      if (e.key === 'F12') { e.preventDefault(); return; }
      // Ctrl+Shift+I / Cmd+Option+I — DevTools
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') { e.preventDefault(); return; }
      // Ctrl+Shift+J / Cmd+Option+J — Console
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'J') { e.preventDefault(); return; }
      // Ctrl+Shift+C / Cmd+Option+C — Element picker
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') { e.preventDefault(); return; }
      // Ctrl+U / Cmd+U — View source
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') { e.preventDefault(); return; }
      // Ctrl+S / Cmd+S — Save page
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); return; }
    };
    document.addEventListener('keydown', handleKeyDown, { capture: true });

    // Block drag events (prevent dragging page elements out)
    const handleDragStart = (e: DragEvent) => { e.preventDefault(); };
    document.addEventListener('dragstart', handleDragStart);

    // Block copy events outside of form fields
    const handleCopy = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
        e.preventDefault();
      }
    };
    document.addEventListener('copy', handleCopy);

    // DevTools detection — size-based + debugger timing
    let devToolsOpen = false;
    const detectDevTools = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const sizeDetected = widthDiff > threshold || heightDiff > threshold;

      // Console-based detection (devtools shows formatted objects differently)
      let consoleDetected = false;
      const el = new Image();
      Object.defineProperty(el, 'id', {
        get: () => { consoleDetected = true; return ''; },
      });
      // When devtools console is open, accessing properties of logged objects triggers getters
      // This is a well-known detection technique
      window.console.debug(el);

      if (sizeDetected || consoleDetected) {
        if (!devToolsOpen) {
          devToolsOpen = true;
          document.body.classList.add('devtools-open');
        }
      } else if (devToolsOpen) {
        devToolsOpen = false;
        document.body.classList.remove('devtools-open');
      }
    };
    const devToolsInterval = setInterval(detectDevTools, 2000);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown, { capture: true } as any);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('copy', handleCopy);
      clearInterval(devToolsInterval);
    };
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