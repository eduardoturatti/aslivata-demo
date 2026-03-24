import { useState } from 'react';
import { getFormation } from '../lib/formations';
import { photoUrl } from '../lib/image-utils';

// ============================
// TYPES — Accept both SQL and public types
// ============================
interface LineupEntry {
  id: string;
  match_id: string;
  team_id: string;
  player_id: string;
  is_starter: boolean;
  lineup_position?: number;
  player?: {
    id?: string;
    name: string;
    number?: string;
    position?: string;
    photo_url?: string;
  };
}

interface EventEntry {
  id: string;
  match_id: string;
  player_id: string;
  team_id: string;
  event_type: string;
  minute: number;
  half?: string;
  detail?: any;
}

interface TeamInfo {
  id: string;
  name: string;
  short_name: string;
  color?: string;
  text_color?: string;
  logo_url?: string;
}

export interface MatchFormationViewProps {
  matchId: string;
  teamId: string;
  team: TeamInfo;
  players: { id: string; name: string; number?: string; position?: string; photo_url?: string }[];
  lineups: LineupEntry[];
  events: EventEntry[];
  side: 'home' | 'away';
  variant: 'broadcast' | 'public';
  showBench?: boolean;
  formationId?: string;
  slotAssignments?: Record<string, string>; // slotId -> playerId
  onPlayerClick?: (playerId: string) => void;
}

// ============================
// POSITION NORMALIZATION
// ============================
function normalizePosition(pos: string): string {
  const p = (pos || '').toLowerCase().trim();
  if (/goleiro|gk|goalkeeper|gol/i.test(p)) return 'goleiro';
  if (/zagueiro|cb|defens|zag/i.test(p)) return 'zagueiro';
  if (/lateral|lb|rb|fullback|lat|ala/i.test(p)) return 'lateral';
  if (/meia|meio|mid|volante|vol|mei|cm|mc/i.test(p)) return 'meio-campo';
  if (/atacante|forward|striker|ponta|ata|st|fw|centroavante/i.test(p)) return 'atacante';
  return 'meio-campo';
}

// Row Y positions (% from top, representing where each position sits on field)
// y=0 is the goal the team defends (GK at bottom)
// Spread lateral further from zagueiro to prevent overlap
const Y_MAP: Record<string, number> = {
  'goleiro': 90,
  'zagueiro': 72,
  'lateral': 72,
  'meio-campo': 44,
  'atacante': 16,
};

function getFormationCoords(
  position: string,
  indexInPosition: number,
  totalInPosition: number,
  side: 'home' | 'away'
): { top: number; left: number } {
  const normPos = normalizePosition(position);
  const y = Y_MAP[normPos] ?? 50;
  
  // Special handling: when laterals and zagueiros share the same Y row,
  // spread laterals wider on X axis
  let x: number;
  if (normPos === 'lateral') {
    // Laterals go to the wings: ~15% and ~85%
    const lateralPositions = totalInPosition === 1 ? [50] : totalInPosition === 2 ? [14, 86] : [14, 50, 86];
    x = lateralPositions[indexInPosition] ?? (100 / (totalInPosition + 1)) * (indexInPosition + 1);
  } else if (normPos === 'zagueiro') {
    // Center-backs in the middle zone: ~35% and ~65%
    const cbPositions = totalInPosition === 1 ? [50] : totalInPosition === 2 ? [36, 64] : [25, 50, 75];
    x = cbPositions[indexInPosition] ?? (100 / (totalInPosition + 1)) * (indexInPosition + 1);
  } else {
    const xStep = 100 / (totalInPosition + 1);
    x = xStep * (indexInPosition + 1);
  }
  
  const finalY = side === 'away' ? 100 - y : y;
  return { top: finalY, left: x };
}

// ============================
// EVENT ICONS
// ============================
function PlayerEventIcons({ playerId, events, size }: { playerId: string; events: EventEntry[]; size: number }) {
  const playerEvents = events.filter(e => e.player_id === playerId);

  // Convention: player_id = who ENTERS, detail.player_out_id = who LEAVES
  // Check if this player was subbed OUT via detail.player_out_id
  const subbedOut = events.find(e =>
    e.event_type === 'substitution' && e.detail?.player_out_id === playerId
  );

  const icons: { type: string; minute: number; half?: string }[] = [];
  for (const ev of playerEvents) {
    if (ev.event_type === 'goal' || ev.event_type === 'penalty_scored') {
      icons.push({ type: 'goal', minute: ev.minute, half: ev.half });
    } else if (ev.event_type === 'own_goal') {
      icons.push({ type: 'own_goal', minute: ev.minute, half: ev.half });
    } else if (ev.event_type === 'yellow_card') {
      icons.push({ type: 'yellow', minute: ev.minute, half: ev.half });
    } else if (ev.event_type === 'second_yellow') {
      icons.push({ type: 'second_yellow', minute: ev.minute, half: ev.half });
    } else if (ev.event_type === 'red_card') {
      icons.push({ type: 'red', minute: ev.minute, half: ev.half });
    } else if (ev.event_type === 'substitution') {
      // player_id = who entered → sub_in icon
      icons.push({ type: 'sub_in', minute: ev.minute, half: ev.half });
    } else if (ev.event_type === 'assist') {
      icons.push({ type: 'assist', minute: ev.minute, half: ev.half });
    }
  }
  if (subbedOut) {
    icons.push({ type: 'sub_out', minute: subbedOut.minute, half: subbedOut.half });
  }

  if (icons.length === 0) return null;

  const iconSize = size;
  return (
    <div className="flex items-center gap-0.5 flex-wrap" style={{ maxWidth: icons.length * (iconSize + 6) }}>
      {icons.map((ic, i) => (
        <span key={i} className="flex items-center" style={{ fontSize: iconSize }}>
          {ic.type === 'goal' && (
            <span className="flex items-center justify-center rounded-full bg-green-500 text-white" style={{ width: iconSize + 4, height: iconSize + 4, fontSize: iconSize - 2 }}>
              <svg viewBox="0 0 44 44" width={iconSize - 1} height={iconSize - 1}><circle cx="22" cy="22" r="20" fill="white" stroke="#16a34a" strokeWidth="3" /><circle cx="22" cy="22" r="8" fill="#16a34a" /></svg>
            </span>
          )}
          {ic.type === 'own_goal' && (
            <span className="flex items-center justify-center rounded-full bg-orange-500 text-white" style={{ width: iconSize + 4, height: iconSize + 4, fontSize: iconSize - 2 }}>
              <svg viewBox="0 0 44 44" width={iconSize - 1} height={iconSize - 1}><circle cx="22" cy="22" r="20" fill="white" stroke="#f97316" strokeWidth="3" /><circle cx="22" cy="22" r="8" fill="#f97316" /></svg>
            </span>
          )}
          {ic.type === 'yellow' && (
            <span className="inline-block bg-yellow-400 rounded-[0px]" style={{ width: iconSize * 0.6, height: iconSize * 0.85 }} />
          )}
          {ic.type === 'second_yellow' && (
            <div className="flex gap-0.5">
              <span className="inline-block bg-yellow-400 rounded-[0px]" style={{ width: iconSize * 0.4, height: iconSize * 0.85 }} />
              <span className="inline-block bg-red-500 rounded-[0px]" style={{ width: iconSize * 0.4, height: iconSize * 0.85 }} />
            </div>
          )}
          {ic.type === 'red' && (
            <span className="inline-block bg-red-600 rounded-[2px] shadow-md border border-red-800/40" style={{ width: iconSize * 0.75, height: iconSize * 1.05 }} />
          )}
          {ic.type === 'sub_out' && (
            <span className="flex items-center justify-center rounded-full" style={{ width: iconSize + 4, height: iconSize + 4, background: 'rgba(239,68,68,0.9)' }}>
              <svg viewBox="0 0 24 24" width={iconSize - 1} height={iconSize - 1} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12l7 7 7-7"/></svg>
            </span>
          )}
          {ic.type === 'sub_in' && (
            <span className="flex items-center justify-center rounded-full" style={{ width: iconSize + 4, height: iconSize + 4, background: 'rgba(34,197,94,0.9)' }}>
              <svg viewBox="0 0 24 24" width={iconSize - 1} height={iconSize - 1} fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>
            </span>
          )}
          {ic.type === 'assist' && (
            <span className="flex items-center justify-center rounded-full bg-blue-500 text-white font-bold" style={{ width: iconSize + 2, height: iconSize + 2, fontSize: iconSize - 3 }}>A</span>
          )}
        </span>
      ))}
    </div>
  );
}

// ============================
// PLAYER NODE ON PITCH
// ============================
function PlayerNode({
  lineup, events, variant, teamColor, onPlayerClick,
}: {
  lineup: LineupEntry;
  events: EventEntry[];
  variant: 'broadcast' | 'public';
  teamColor: string;
  onPlayerClick?: (playerId: string) => void;
}) {
  const isBroadcast = variant === 'broadcast';
  const circleSize = isBroadcast ? 56 : 44;
  const fontSize = isBroadcast ? 13 : 10;
  const iconSize = isBroadcast ? 14 : 10;
  const numberSize = isBroadcast ? 20 : 14;
  const [imgErr, setImgErr] = useState(false);

  const player = lineup.player;
  const name = player?.name || '?';
  const displayName = name.length > 10 ? name.split(' ').pop() || name.slice(0, 10) : name;
  const number = player?.number || '?';
  const rawPhotoUrl = player?.photo_url;
  const optimizedPhoto = rawPhotoUrl ? photoUrl(rawPhotoUrl, circleSize * 2) : '';

  return (
    <div
      className={`flex flex-col items-center ${onPlayerClick ? 'cursor-pointer' : ''}`}
      style={{ width: circleSize + 16 }}
      onClick={() => onPlayerClick?.(lineup.player_id)}
    >
      {/* Avatar circle with overlaid event icons */}
      <div className="relative shrink-0" style={{ width: circleSize, height: circleSize }}>
        <div
          className="rounded-full flex items-center justify-center overflow-hidden w-full h-full"
          style={{
            border: `3px solid ${teamColor}`,
            background: 'rgba(0,0,0,0.55)',
          }}
        >
          {optimizedPhoto && !imgErr ? (
            <img
              src={optimizedPhoto}
              alt={name}
              width={circleSize}
              height={circleSize}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              onError={() => setImgErr(true)}
            />
          ) : (
            <span className="font-bold text-white" style={{ fontSize: numberSize, fontFamily: 'var(--font-mono, monospace)' }}>
              {number}
            </span>
          )}
        </div>
        {/* Event icons overlaid on top-right of circle */}
        <div className="absolute" style={{ top: -4, right: -6, zIndex: 10 }}>
          <PlayerEventIcons playerId={lineup.player_id} events={events} size={iconSize} />
        </div>
      </div>

      {/* Name tag */}
      <div
        className="rounded-md mt-1 px-1.5 py-0.5 max-w-full truncate text-center"
        style={{
          background: 'rgba(0,0,0,0.75)',
          fontSize,
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'var(--font-heading, system-ui)',
          lineHeight: 1.2,
        }}
      >
        {displayName}
      </div>
    </div>
  );
}

// ============================
// PITCH SVG LINES
// ============================
function PitchLines() {
  return (
    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 150" preserveAspectRatio="none">
      {/* Outer boundary */}
      <rect x="3" y="3" width="94" height="144" fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="0.6" />
      {/* Center line */}
      <line x1="3" y1="75" x2="97" y2="75" stroke="rgba(255,255,255,0.30)" strokeWidth="0.6" />
      {/* Center circle */}
      <circle cx="50" cy="75" r="12" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.6" />
      <circle cx="50" cy="75" r="1.2" fill="rgba(255,255,255,0.4)" />
      {/* Top penalty area */}
      <rect x="22" y="3" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      <rect x="32" y="3" width="36" height="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      {/* Top penalty arc */}
      <path d="M 38 25 Q 50 32 62 25" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
      {/* Top penalty spot */}
      <circle cx="50" cy="18" r="0.8" fill="rgba(255,255,255,0.3)" />
      {/* Bottom penalty area */}
      <rect x="22" y="125" width="56" height="22" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      <rect x="32" y="138" width="36" height="9" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="0.5" />
      {/* Bottom penalty arc */}
      <path d="M 38 125 Q 50 118 62 125" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.5" />
      {/* Bottom penalty spot */}
      <circle cx="50" cy="132" r="0.8" fill="rgba(255,255,255,0.3)" />
      {/* Corner arcs */}
      <path d="M 3 6 Q 6 3 9 3" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
      <path d="M 91 3 Q 97 3 97 6" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
      <path d="M 3 144 Q 3 147 6 147" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
      <path d="M 94 147 Q 97 147 97 144" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4" />
      {/* Goal posts */}
      <rect x="38" y="0.5" width="24" height="2.5" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.4" rx="0.5" />
      <rect x="38" y="147" width="24" height="2.5" fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="0.4" rx="0.5" />
    </svg>
  );
}

// ============================
// MAIN COMPONENT
// ============================
export function MatchFormationView({
  matchId, teamId, team, players, lineups, events, side, variant, showBench = false,
  formationId, slotAssignments, onPlayerClick,
}: MatchFormationViewProps) {
  const isBroadcast = variant === 'broadcast';
  const teamColor = team.color || '#22c55e';

  const teamLineups = lineups.filter(l => l.team_id === teamId && l.match_id === matchId);
  const starters = teamLineups.filter(l => l.is_starter);
  const bench = teamLineups.filter(l => !l.is_starter);
  const matchEvents = events.filter(e => e.match_id === matchId);

  if (starters.length === 0) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl ${isBroadcast ? 'h-full' : ''}`}
        style={{ height: isBroadcast ? undefined : 540, background: 'linear-gradient(180deg, #1b5e2e 0%, #14532d 100%)' }}
      >
        <span className="text-white/40 font-bold text-sm" style={{ fontFamily: 'var(--font-heading)' }}>
          Escalação não cadastrada
        </span>
      </div>
    );
  }

  // Resolve formation for positioning
  const formation = formationId ? getFormation(formationId) : null;

  // Calculate coordinates for each player
  const positioned: { lineup: LineupEntry; top: number; left: number }[] = [];

  if (formation && slotAssignments && Object.keys(slotAssignments).length > 0) {
    // Formation-based positioning: use slot coordinates
    for (const starter of starters) {
      const playerId = starter.player_id || starter.player?.id;
      // Find which slot this player occupies
      const slotEntry = Object.entries(slotAssignments).find(([, pid]) => pid === playerId);
      if (slotEntry) {
        const slot = formation.slots.find(s => s.id === slotEntry[0]);
        if (slot) {
          // Convert from formation coords (y: 0=own goal, 100=opponent) to pitch display
          // For 'home' side: GK at bottom (high y%), attackers at top (low y%)
          // Formation y: 5 = GK, 80 = attacker
          // Display y for home: 88 = GK, 20 = attacker -> invert: displayY = 92 - slot.y
          // Add safe margins to avoid clipping (5% to 95%)
          const safeY = (y: number) => Math.max(8, Math.min(92, y));
          const safeX = (x: number) => Math.max(10, Math.min(90, x));
          
          const displayY = safeY(92 - slot.y);
          const finalY = side === 'away' ? 100 - displayY : displayY;
          positioned.push({ lineup: starter, top: finalY, left: safeX(slot.x) });
          continue;
        }
      }
      // Fallback for unmatched players: use auto positioning
      const normPos = normalizePosition(starter.player?.position || '');
      const samePos = starters.filter(s => normalizePosition(s.player?.position || '') === normPos);
      const idx = samePos.indexOf(starter);
      const coords = getFormationCoords(normPos, idx >= 0 ? idx : 0, samePos.length, side);
      
      const safeX = (x: number) => Math.max(10, Math.min(90, x));
      const safeY = (y: number) => Math.max(8, Math.min(92, y));
      
      positioned.push({ lineup: starter, top: safeY(coords.top), left: safeX(coords.left) });
    }
  } else {
    // Fallback: auto positioning by player position (legacy behavior)
    const positionGroups = new Map<string, LineupEntry[]>();
    for (const s of starters) {
      const normPos = normalizePosition(s.player?.position || '');
      const existing = positionGroups.get(normPos) || [];
      existing.push(s);
      positionGroups.set(normPos, existing);
    }
    
    const safeX = (x: number) => Math.max(10, Math.min(90, x));
    const safeY = (y: number) => Math.max(8, Math.min(92, y));

    for (const [pos, group] of positionGroups) {
      group.forEach((lineup, idx) => {
        const coords = getFormationCoords(pos, idx, group.length, side);
        positioned.push({ lineup, top: safeY(coords.top), left: safeX(coords.left) });
      });
    }
  }

  const benchCircleSize = isBroadcast ? 48 : 32;
  const benchFontSize = isBroadcast ? 13 : 10;
  const benchNumberSize = isBroadcast ? 18 : 12;

  return (
    <div className={isBroadcast ? 'h-full flex flex-col' : ''}>
      {/* Pitch */}
      <div
        className={`relative w-full rounded-xl overflow-hidden ${isBroadcast ? 'flex-1' : ''}`}
        style={{ minHeight: isBroadcast ? undefined : 540, aspectRatio: isBroadcast ? undefined : '3 / 4' }}
      >
        {/* Grass stripes */}
        <div className="absolute inset-0">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="w-full"
              style={{
                height: `${100 / 12}%`,
                backgroundColor: i % 2 === 0 ? '#1f6b34' : '#237a3b',
              }}
            />
          ))}
        </div>

        {/* Pitch lines */}
        <PitchLines />

        {/* Formation label */}
        {formationId && (
          <div
            className="absolute z-30"
            style={{
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,0.6)',
              color: 'white',
              padding: isBroadcast ? '6px 12px' : '3px 8px',
              borderRadius: 6,
              fontSize: isBroadcast ? 18 : 12,
              fontWeight: 700,
              fontFamily: 'Plus Jakarta Sans, system-ui',
            }}
          >
            {formationId}
          </div>
        )}

        {/* Team label */}
        <div className={`absolute ${side === 'home' ? 'top-2' : 'bottom-2'} left-0 right-0 flex justify-center z-10`}>
          <span
            className="text-white/40 font-bold uppercase tracking-wider"
            style={{ fontSize: isBroadcast ? 14 : 9, fontFamily: 'var(--font-heading)' }}
          >
            {team.short_name}
          </span>
        </div>

        {/* Players */}
        {positioned.map(({ lineup, top, left }) => (
          <div
            key={lineup.id || lineup.player_id}
            className="absolute z-20"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <PlayerNode
              lineup={lineup}
              events={matchEvents}
              variant={variant}
              teamColor={teamColor}
              onPlayerClick={onPlayerClick}
            />
          </div>
        ))}
      </div>

      {/* Bench */}
      {showBench && bench.length > 0 && (
        <div className="mt-2">
          <p
            className="text-muted-foreground uppercase font-semibold mb-1.5"
            style={{ fontSize: isBroadcast ? 14 : 9, fontFamily: 'var(--font-heading)' }}
          >
            Banco ({bench.length})
          </p>
          <div className={`flex flex-wrap gap-2 ${isBroadcast ? 'gap-3' : 'gap-1.5'}`}>
            {bench.map(l => {
              const player = l.player;
              const name = player?.name || '?';
              const displayName = name.length > 8 ? name.split(' ').pop() || name.slice(0, 8) : name;
              return (
                <div key={l.id || l.player_id} className="flex flex-col items-center" style={{ width: benchCircleSize + 16 }}>
                  <div
                    className="rounded-full flex items-center justify-center"
                    style={{
                      width: benchCircleSize,
                      height: benchCircleSize,
                      border: `2px solid ${teamColor}40`,
                      background: 'rgba(0,0,0,0.3)',
                    }}
                  >
                    <span className="font-bold text-white/70" style={{ fontSize: benchNumberSize, fontFamily: 'var(--font-mono, monospace)' }}>
                      {player?.number || '?'}
                    </span>
                  </div>
                  <span
                    className="text-muted-foreground truncate max-w-full text-center mt-0.5"
                    style={{ fontSize: benchFontSize, fontFamily: 'var(--font-heading)' }}
                  >
                    {displayName}
                  </span>
                  <PlayerEventIcons playerId={l.player_id} events={matchEvents} size={isBroadcast ? 14 : 10} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}