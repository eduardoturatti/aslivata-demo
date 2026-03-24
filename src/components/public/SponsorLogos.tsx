import React from 'react';
import { useDarkMode } from '../../lib/useDarkMode';
import LogoF7Esportes from '../../imports/LogoF7Esportes';
import LogoForcaDoVale from '../../imports/LogoForcaDoVale';

// Natural dimensions
const F7_W = 181;
const F7_H = 18.4;
const FDV_W = 158;
const FDV_H = 24;

interface SponsorLogosProps {
  width?: number;
  className?: string;
  showLabels?: boolean;
}

/**
 * SponsorLogos - renders F7 ESPORTES (Apoio) and FORÇA DO VALE (Realização) logos side by side.
 * In dark mode, fills become light via --fill-0 CSS variable.
 */
export default function SponsorLogos({ width = 280, className = '', showLabels = false }: SponsorLogosProps) {
  const isDark = useDarkMode();

  const gap = 20;
  const halfWidth = (width - gap) / 2;

  const f7Scale = Math.min(halfWidth / F7_W, 1);
  const fdvScale = Math.min(halfWidth / FDV_W, 1);
  const scale = Math.min(f7Scale, fdvScale);

  const cssVars = {
    '--fill-0': isDark ? '#cbd5e1' : undefined,
    '--stroke-0': isDark ? '#64748b' : undefined,
  } as React.CSSProperties;

  const labelStyle: React.CSSProperties = {
    fontSize: 8,
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: 'var(--font-heading)',
    marginBottom: 6,
  };

  return (
    <div
      className={`flex items-end justify-center gap-5 ${className}`}
      style={{ width }}
    >
      {/* F7 ESPORTES — APOIO */}
      <div className="flex flex-col items-center">
        {showLabels && (
          <span className="text-muted-foreground/60" style={labelStyle}>Apoio</span>
        )}
        <div
          style={{
            width: F7_W * scale,
            height: F7_H * scale,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: F7_W,
              height: F7_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'relative',
              ...cssVars,
            }}
          >
            <LogoF7Esportes />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div
        className="shrink-0"
        style={{
          width: 1,
          height: Math.max(F7_H, FDV_H) * scale,
          background: isDark ? '#475569' : '#d1d5db',
        }}
      />

      {/* FORÇA DO VALE — REALIZAÇÃO */}
      <div className="flex flex-col items-center">
        {showLabels && (
          <span className="text-muted-foreground/60" style={labelStyle}>Realização</span>
        )}
        <div
          style={{
            width: FDV_W * scale,
            height: FDV_H * scale,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: FDV_W,
              height: FDV_H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              position: 'relative',
              ...cssVars,
            }}
          >
            <LogoForcaDoVale />
          </div>
        </div>
      </div>
    </div>
  );
}
