import React from 'react';
import { useDarkMode } from '../../lib/useDarkMode';
import LogoPower from '../../imports/LogoPower';

// Natural dimensions of the LogoPower Figma SVG component
const NATURAL_W = 276;
const NATURAL_H = 41;

interface PowerLogoProps {
  width?: number;
  className?: string;
}

/**
 * PowerLogo - renders the Figma-exported POWER | ARENA FORÇA DO VALE logo.
 * In dark mode all fills become light via --fill-0 CSS variable.
 */
export default function PowerLogo({ width = 200, className = '' }: PowerLogoProps) {
  const isDark = useDarkMode();
  const scale = width / NATURAL_W;
  const height = NATURAL_H * scale;

  return (
    <div
      className={className}
      style={{
        width,
        height,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: NATURAL_W,
          height: NATURAL_H,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          position: 'relative',
          '--fill-0': isDark ? '#e2e8f0' : undefined,
          '--stroke-0': isDark ? '#94a3b8' : undefined,
        } as React.CSSProperties}
      >
        <LogoPower />
      </div>
    </div>
  );
}
