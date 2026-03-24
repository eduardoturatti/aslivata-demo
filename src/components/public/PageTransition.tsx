import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Lightweight page transition using CSS animations instead of Motion.
 * Uses compositor-friendly transform + opacity only.
 * Saves ~40KB+ of Motion JS from critical path.
 */
export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <div
      className={className}
      style={{ animation: 'fadeUp 0.35s cubic-bezier(0.25, 0.1, 0.25, 1) both' }}
    >
      {children}
    </div>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ animation: `fadeUp 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) ${delay}s both` }}
    >
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className = '',
  index = 0,
}: {
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <div
      className={className}
      style={{ animation: `fadeUp 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) ${index * 0.06}s both` }}
    >
      {children}
    </div>
  );
}
