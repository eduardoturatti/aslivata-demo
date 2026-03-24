import React from 'react';

// ============================
// SKELETON PRIMITIVES
// ============================

/** Bloco retangular shimmer */
export function Bone({ className = '' }: { className?: string }) {
  return <div className={`bg-muted rounded animate-pulse ${className}`} />;
}

/** Circulo shimmer */
export function BoneCircle({ size = 40, className = '' }: { size?: number; className?: string }) {
  return <div className="bg-muted rounded-full animate-pulse shrink-0" style={{ width: size, height: size }} />;
}

/** Card wrapper shimmer */
function SkeletonCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-card rounded-xl border border-border p-3 animate-pulse ${className}`}>
      {children}
    </div>
  );
}

// ============================
// HOME PAGE
// ============================

export function HomeSkeleton() {
  return (
    <div className="pb-6">
      {/* Hero carousel */}
      <div className="px-4 pt-2 pb-4">
        <div className="bg-muted rounded-2xl h-44 animate-pulse" />
      </div>

      <div className="px-4 space-y-5">
        {/* Section: Proximos Jogos */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Bone className="w-4 h-4 rounded-full" />
            <Bone className="h-4 w-28" />
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 bg-card rounded-xl border border-border p-3 mb-2 animate-pulse">
              <BoneCircle size={28} />
              <Bone className="h-3 w-20 flex-1" />
              <div className="flex flex-col items-center gap-1 px-2">
                <Bone className="h-2 w-12" />
                <Bone className="h-3 w-10" />
              </div>
              <Bone className="h-3 w-20 flex-1" />
              <BoneCircle size={28} />
            </div>
          ))}
        </section>

        {/* Section: Classificacao */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Bone className="w-4 h-4 rounded-full" />
            <Bone className="h-4 w-28" />
          </div>
          <div className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
            <div className="px-3 py-2 border-b border-border flex gap-2">
              <Bone className="h-2.5 w-6" />
              <Bone className="h-2.5 flex-1" />
              <Bone className="h-2.5 w-6" />
              <Bone className="h-2.5 w-6" />
              <Bone className="h-2.5 w-6" />
            </div>
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                <Bone className="h-3 w-4" />
                <BoneCircle size={20} />
                <Bone className="h-3 flex-1" />
                <Bone className="h-3 w-6" />
                <Bone className="h-3 w-6" />
                <Bone className="h-3 w-6" />
              </div>
            ))}
          </div>
        </section>

        {/* Quick nav */}
        <section>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-xl border border-border p-3 flex flex-col items-center gap-2 animate-pulse">
                <Bone className="w-8 h-8 rounded-lg" />
                <Bone className="h-2.5 w-12" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================
// STANDINGS PAGE
// ============================

export function StandingsSkeleton() {
  return (
    <div className="px-4 py-5 animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <Bone className="w-5 h-5 rounded-full" />
        <Bone className="h-5 w-40" />
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header row */}
        <div className="px-3 py-2 border-b border-border flex gap-2">
          <Bone className="h-2.5 w-4" />
          <Bone className="h-2.5 flex-1" />
          {['P', 'J', 'V', 'E', 'D', 'GP', 'GC', 'SG'].map(c => (
            <Bone key={c} className="h-2.5 w-5" />
          ))}
        </div>
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="px-3 py-3 border-b border-border flex items-center gap-2">
            <Bone className="h-3 w-4" />
            <BoneCircle size={22} />
            <Bone className="h-3 flex-1" />
            {[1, 2, 3, 4, 5, 6, 7, 8].map(j => (
              <Bone key={j} className="h-3 w-5" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================
// TEAMS LIST PAGE
// ============================

export function TeamsListSkeleton() {
  return (
    <div className="px-4 py-5 animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <Bone className="w-5 h-5 rounded-full" />
        <Bone className="h-5 w-24" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-2">
            <BoneCircle size={48} />
            <Bone className="h-3.5 w-20" />
            <Bone className="h-2.5 w-14" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================
// TEAM DETAIL PAGE
// ============================

export function TeamDetailSkeleton() {
  return (
    <div className="pb-6 animate-pulse">
      {/* Hero header */}
      <div className="px-4 pt-4 pb-6 bg-muted/30">
        <Bone className="h-3 w-14 mb-4" />
        <div className="flex items-center gap-4">
          <BoneCircle size={72} />
          <div className="flex-1 space-y-2">
            <Bone className="h-5 w-40" />
            <Bone className="h-3 w-28" />
            <Bone className="h-2.5 w-24" />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Stats grid */}
        <section>
          <Bone className="h-4 w-32 mb-3" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-lg border border-border p-2.5 flex flex-col items-center gap-1">
                <Bone className="h-5 w-8" />
                <Bone className="h-2 w-10" />
              </div>
            ))}
          </div>
        </section>

        {/* Next match */}
        <section>
          <Bone className="h-4 w-28 mb-3" />
          <div className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <Bone className="h-2.5 w-16" />
              <Bone className="h-2.5 w-32" />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex-1 flex flex-col items-center gap-1.5">
                <BoneCircle size={40} />
                <Bone className="h-3 w-14" />
              </div>
              <Bone className="h-5 w-8 mx-4" />
              <div className="flex-1 flex flex-col items-center gap-1.5">
                <BoneCircle size={40} />
                <Bone className="h-3 w-14" />
              </div>
            </div>
          </div>
        </section>

        {/* Squad */}
        <section>
          <Bone className="h-4 w-20 mb-3" />
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex gap-2">
              <Bone className="h-2.5 flex-1" />
              <Bone className="h-2.5 w-6" />
              <Bone className="h-2.5 w-6" />
              <Bone className="h-2.5 w-6" />
            </div>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="px-3 py-2.5 border-b border-border flex items-center gap-2">
                <BoneCircle size={28} />
                <div className="flex-1 space-y-1">
                  <Bone className="h-3 w-28" />
                  <Bone className="h-2 w-10" />
                </div>
                <Bone className="h-3 w-5" />
                <Bone className="h-3 w-5" />
                <Bone className="h-3 w-5" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================
// PLAYER PAGE
// ============================

export function PlayerSkeleton() {
  return (
    <div className="pb-6 animate-pulse">
      {/* Hero */}
      <div className="px-4 pt-4 pb-6 bg-muted/30">
        <Bone className="h-3 w-14 mb-4" />
        <div className="flex items-center gap-4">
          <BoneCircle size={72} />
          <div className="flex-1 space-y-2">
            <Bone className="h-5 w-36" />
            <div className="flex gap-2">
              <BoneCircle size={16} />
              <Bone className="h-3 w-20" />
            </div>
            <Bone className="h-2.5 w-28" />
          </div>
        </div>
      </div>

      <div className="px-4 space-y-5 mt-4">
        {/* Stats */}
        <section>
          <Bone className="h-4 w-24 mb-3" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-card rounded-lg border border-border p-2.5 flex flex-col items-center gap-1">
                <Bone className="h-5 w-8" />
                <Bone className="h-2 w-10" />
              </div>
            ))}
          </div>
        </section>

        {/* Match history */}
        <section>
          <Bone className="h-4 w-36 mb-3" />
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-lg border border-border px-3 py-3 flex items-center gap-3">
                <Bone className="w-6 h-6 rounded-md" />
                <BoneCircle size={24} />
                <Bone className="h-3 w-20 flex-1" />
                <Bone className="h-4 w-12" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ============================
// TOP SCORERS / TOP ASSISTS (Ranking table)
// ============================

export function RankingSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="px-4 py-5 animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <Bone className="w-5 h-5 rounded-full" />
        <Bone className="h-5 w-28" />
      </div>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-3 py-3 border-b border-border flex items-center gap-3">
            <Bone className="h-4 w-5" />
            <BoneCircle size={32} />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3 w-28" />
              <div className="flex items-center gap-1.5">
                <BoneCircle size={14} />
                <Bone className="h-2.5 w-16" />
              </div>
            </div>
            <Bone className="h-5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================
// CARDS PAGE
// ============================

export function CardsSkeleton() {
  return (
    <div className="px-4 py-5 animate-pulse">
      <div className="flex items-center gap-2 mb-5">
        <Bone className="w-5 h-5 rounded-full" />
        <Bone className="h-5 w-36" />
      </div>

      {/* Fair Play Ranking */}
      <section className="mb-6">
        <Bone className="h-4 w-28 mb-3" />
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="px-3 py-3 border-b border-border flex items-center gap-2">
              <Bone className="h-3 w-4" />
              <BoneCircle size={22} />
              <Bone className="h-3 flex-1" />
              <Bone className="h-3 w-8" />
              <Bone className="h-3 w-8" />
              <Bone className="h-3 w-10" />
            </div>
          ))}
        </div>
      </section>

      {/* Player cards list */}
      <section>
        <Bone className="h-4 w-32 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card rounded-lg border border-border px-3 py-3 flex items-center gap-3">
              <Bone className="h-4 w-5" />
              <BoneCircle size={28} />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3 w-24" />
                <Bone className="h-2.5 w-16" />
              </div>
              <div className="flex gap-1">
                <Bone className="w-3.5 h-4.5 rounded-sm" />
                <Bone className="w-3.5 h-4.5 rounded-sm" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ============================
// HEAD TO HEAD PAGE
// ============================

export function HeadToHeadSkeleton() {
  return (
    <div className="px-4 py-4 animate-pulse">
      <Bone className="h-3 w-14 mb-4" />
      <div className="flex items-center gap-2 mb-5">
        <Bone className="w-5 h-5 rounded-full" />
        <Bone className="h-5 w-28" />
      </div>

      {/* Team selectors */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[1, 2].map(i => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 flex flex-col items-center gap-2">
            <BoneCircle size={48} />
            <Bone className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Stats comparison */}
      <div className="bg-card rounded-xl border border-border p-4 space-y-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Bone className="h-5 w-8" />
            <Bone className="h-2 flex-1 rounded-full" />
            <Bone className="h-3 w-16" />
            <Bone className="h-2 flex-1 rounded-full" />
            <Bone className="h-5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================
// GALERA PAGE
// ============================

export function GaleraSkeleton() {
  return (
    <div className="px-4 py-5 animate-pulse">
      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <Bone className="h-9 w-28 rounded-lg" />
        <Bone className="h-9 w-28 rounded-lg" />
      </div>

      {/* Match header */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <BoneCircle size={36} />
            <Bone className="h-3 w-14" />
          </div>
          <Bone className="h-5 w-8 mx-4" />
          <div className="flex-1 flex flex-col items-center gap-1.5">
            <BoneCircle size={36} />
            <Bone className="h-3 w-14" />
          </div>
        </div>
      </div>

      {/* Pitch / picks */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <Bone className="h-4 w-36 mb-4" />
        <div className="bg-muted/50 rounded-xl h-72" />
      </div>

      {/* Player list */}
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="bg-card rounded-lg border border-border px-3 py-3 flex items-center gap-3">
            <BoneCircle size={32} />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3 w-28" />
              <Bone className="h-2.5 w-16" />
            </div>
            <Bone className="h-6 w-16 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================
// PREMIUM PAGE
// ============================

export function PremiumSkeleton() {
  return (
    <div className="px-4 py-5 animate-pulse">
      <div className="flex items-center gap-3 mb-6">
        <Bone className="w-10 h-10 rounded-xl" />
        <div className="space-y-1.5">
          <Bone className="h-5 w-24" />
          <Bone className="h-2.5 w-36" />
        </div>
      </div>

      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
            <Bone className="w-8 h-8 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3.5 w-28" />
              <Bone className="h-2.5 w-44" />
            </div>
          </div>
        ))}
      </div>

      <Bone className="h-12 w-full rounded-xl mt-6" />
    </div>
  );
}

// ============================
// NEWS PAGE (re-export for consistency)
// ============================

export function NewsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card rounded-xl border border-border overflow-hidden animate-pulse">
          <div className="h-44 bg-muted" />
          <div className="p-3 space-y-2">
            <Bone className="h-4 w-full" />
            <Bone className="h-4 w-3/4" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-2/3" />
            <div className="flex items-center gap-2 pt-1">
              <Bone className="h-2.5 w-20" />
              <Bone className="h-2.5 w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================
// LOGIN PAGE
// ============================

export function LoginSkeleton() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 animate-pulse">
      <BoneCircle size={64} />
      <Bone className="h-5 w-36 mt-4" />
      <Bone className="h-3 w-52 mt-2" />
      <Bone className="h-10 w-full max-w-xs rounded-lg mt-8" />
      <Bone className="h-10 w-full max-w-xs rounded-lg mt-3" />
      <Bone className="h-11 w-full max-w-xs rounded-xl mt-5" />
    </div>
  );
}
