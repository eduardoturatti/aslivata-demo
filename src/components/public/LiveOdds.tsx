// ============================================================
// LIVE ODDS DISPLAY — Animated percentage with 2 decimal places
// The last decimal digit occasionally flickers to simulate "live" feel
// ============================================================
import React, { useState, useEffect, useRef } from 'react';

interface LiveOddsProps {
  value: number;       // e.g. 45.67
  suffix?: string;     // e.g. "%"
  className?: string;
  animated?: boolean;  // Enable flicker animation (default true)
  color?: string;      // Text color class
}

export function LiveOdds({ value, suffix = '%', className = '', animated = true, color }: LiveOddsProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const baseValue = useRef(value);

  // Update base when value changes
  useEffect(() => {
    baseValue.current = value;
    setDisplayValue(value);
  }, [value]);

  // Flicker effect — randomly adjust the last decimal digit every 2-5 seconds
  useEffect(() => {
    if (!animated) return;

    const tick = () => {
      // Random offset of ±0.01 to ±0.04
      const offset = (Math.random() - 0.5) * 0.08;
      const newVal = Math.max(0, Math.min(100, baseValue.current + offset));
      setDisplayValue(newVal);
    };

    // Random interval between 1.5s and 4s
    const scheduleNext = () => {
      const delay = 1500 + Math.random() * 2500;
      intervalRef.current = setTimeout(() => {
        tick();
        scheduleNext();
      }, delay);
    };

    // Initial delay before starting (stagger animations)
    const initDelay = setTimeout(() => {
      scheduleNext();
    }, Math.random() * 3000);

    return () => {
      clearTimeout(initDelay);
      if (intervalRef.current) clearTimeout(intervalRef.current);
    };
  }, [animated]);

  const formatted = displayValue.toFixed(2);
  const [integerPart, decimalPart] = formatted.split('.');

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className}`} style={{ fontFamily: 'var(--font-mono)', color }}>
      <span>{integerPart}</span>
      <span className="opacity-80">.{decimalPart?.[0]}</span>
      <span className="opacity-60 transition-all duration-300">{decimalPart?.[1]}</span>
      {suffix && <span className="opacity-70 text-[0.85em] ml-[1px]">{suffix}</span>}
    </span>
  );
}

// Simpler version for inline use
export function LivePct({ value, animated = true, className = '' }: { value: number; animated?: boolean; className?: string }) {
  return <LiveOdds value={value} suffix="%" className={className} animated={animated} />;
}
