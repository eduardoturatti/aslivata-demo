import { useRef, useEffect, useState, useCallback } from 'react';

interface BroadcastTextProps {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  minScale?: number; // minimum horizontal compression (default 0.3)
  align?: 'left' | 'center' | 'right';
}

export function BroadcastText({
  children,
  className = '',
  style,
  minScale = 0.3,
  align = 'left',
}: BroadcastTextProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [sx, setSx] = useState(1);
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const w = wrapRef.current;
    const t = textRef.current;
    if (!w || !t) return;
    // Reset transform for accurate measurement
    t.style.transform = 'none';
    t.style.transition = 'none';
    requestAnimationFrame(() => {
      if (!w || !t) return;
      const cw = w.clientWidth;
      const tw = t.scrollWidth;
      if (tw > 0 && cw > 0 && tw > cw) {
        setSx(Math.max(minScale, cw / tw));
      } else {
        setSx(1);
      }
      // Re-enable transition after measurement, in next frame
      requestAnimationFrame(() => {
        if (t) t.style.transition = 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)';
        setReady(true);
      });
    });
  }, [minScale]);

  useEffect(() => {
    // Delay initial measurement to let parent entry animations settle
    const timer = setTimeout(() => measure(), 80);
    const ro = new ResizeObserver(() => measure());
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => { clearTimeout(timer); ro.disconnect(); };
  }, [children, measure]);

  const origin = align === 'right' ? 'right center' : align === 'center' ? 'center center' : 'left center';

  return (
    <div
      ref={wrapRef}
      style={{
        overflow: 'hidden',
        minWidth: 0,
        display: 'flex',
        justifyContent: align === 'right' ? 'flex-end' : align === 'center' ? 'center' : 'flex-start',
      }}
    >
      <span
        ref={textRef}
        className={className}
        style={{
          ...style,
          display: 'inline-block',
          whiteSpace: 'nowrap',
          transform: `scaleX(${sx})`,
          transformOrigin: origin,
          willChange: 'transform',
          maxWidth: sx < 1 ? 'none' : '100%',
          opacity: ready ? 1 : 0,
          transition: ready ? 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease' : 'none',
        }}
      >
        {children}
      </span>
    </div>
  );
}

// ============================================
// TEAM COLOR UTILITIES
// Generate consistent colors from team names.
// Custom colors override the generated ones.
// ============================================

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

export function getTeamColor(name: string, custom?: string): string {
  if (custom) return custom;
  const h = ((hashString(name) % 360) + 360) % 360;
  return `hsl(${h}, 65%, 42%)`;
}

export function getTeamColorRGB(name: string, custom?: string): { r: number; g: number; b: number } {
  if (custom) {
    // Parse hex
    const hex = custom.replace('#', '');
    return {
      r: parseInt(hex.substring(0, 2), 16) || 100,
      g: parseInt(hex.substring(2, 4), 16) || 100,
      b: parseInt(hex.substring(4, 6), 16) || 100,
    };
  }
  const h = ((hashString(name) % 360) + 360) % 360;
  // HSL to RGB approximation
  const s = 0.65, l = 0.42;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

export function getTeamColorLight(name: string, custom?: string): string {
  if (custom) return custom + '18';
  const h = ((hashString(name) % 360) + 360) % 360;
  return `hsl(${h}, 55%, 95%)`;
}

export function getTeamGradient(name: string, custom?: string, dir = '135deg'): string {
  if (custom) return `linear-gradient(${dir}, ${custom}, ${custom}cc)`;
  const h = ((hashString(name) % 360) + 360) % 360;
  return `linear-gradient(${dir}, hsl(${h}, 70%, 30%), hsl(${h}, 60%, 50%))`;
}

// ============================================
// COMMON DISPLAY UTILITIES
// ============================================

export function parseTeamName(full: string): { name: string; city: string } {
  const m = full.match(/^(.+?)\s*\(([^)]+)\)$/);
  if (m) return { name: m[1].trim().replace(/\s*-\s*(VETERANOS|VET)$/i, ''), city: m[2].trim() };
  return { name: full, city: '' };
}