import { useEffect, useState, useRef, useCallback } from 'react';
import { useTournament } from '../hooks/useTournament';
import { useBroadcastState } from '../hooks/useBroadcastState';
import { StudioHome } from './StudioHome';
import { StudioRounds } from './StudioRounds';
import { StudioStandings } from './StudioStandings';
import { StudioTeamFilter } from './StudioTeamFilter';
import { SceneManoAMano } from './SceneManoAMano';
import { SceneBracket } from './SceneBracket';
import { StudioSchedule } from './StudioSchedule';
import { StudioTopScorers } from './StudioTopScorers';
import { StudioTopAssists } from './StudioTopAssists';
import { StudioTopCards } from './StudioTopCards';
import { StudioMatchDetail } from './StudioMatchDetail';
import { StudioPlayerProfile } from './StudioPlayerProfile';
import { StudioSuspensions } from './StudioSuspensions';
import { StudioArenaSelection } from './StudioArenaSelection';
import { StudioSelecaoGalera } from './StudioSelecaoGalera';
import { StudioBolaoRanking } from './StudioBolaoRanking';
import { StudioMatchReplay } from './StudioMatchReplay';
import { StudioZebra } from './StudioZebra';
import { StudioVotingLive } from './StudioVotingLive';
import { motion, AnimatePresence } from 'motion/react';
import LogoPower from '../imports/LogoPower';

const CANVAS_W = 1920;
const CANVAS_H = 1080;

interface DisplayViewProps {
  embedded?: boolean;
  broadcast?: boolean;
}

export function DisplayView({ embedded = false, broadcast = false }: DisplayViewProps) {
  const tournament = useTournament({ pollInterval: broadcast ? 60000 : 15000 });
  const { state, isOnline } = useBroadcastState({ mode: 'display', pollInterval: broadcast ? 20000 : 5000 });
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (broadcast) {
      document.body.classList.add('display-mode');
      document.body.classList.remove('control-mode');
      return () => { document.body.classList.remove('display-mode'); };
    }
  }, [broadcast]);

  const updateScale = useCallback(() => {
    let w: number, h: number;
    if (embedded && containerRef.current) {
      const r = containerRef.current.getBoundingClientRect();
      w = r.width; h = r.height;
    } else {
      w = window.innerWidth; h = window.innerHeight;
    }
    setScale(Math.min(w / CANVAS_W, h / CANVAS_H));
  }, [embedded]);

  useEffect(() => {
    updateScale();
    window.addEventListener('resize', updateScale);
    let ro: ResizeObserver | null = null;
    if (embedded && containerRef.current) {
      ro = new ResizeObserver(updateScale);
      ro.observe(containerRef.current);
    }
    return () => { window.removeEventListener('resize', updateScale); ro?.disconnect(); };
  }, [updateScale]);

  if (tournament.isLoading) {
    return (
      <div className={`${embedded ? 'w-full h-full' : 'w-screen h-screen'} bg-[#f8fafc] flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
          <span style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 18, fontWeight: 600, color: '#64748b' }}>Carregando dados...</span>
        </div>
      </div>
    );
  }

  const { data, topScorers, topAssists, cardRanking, teamDiscipline, suspensions, sqlTeams, sqlMatches, sqlPlayers, sqlEvents } = tournament;
  const scene = state.activeScene || 'home';
  const sceneKey = `${scene}-${state.roundIndex}-${state.selectedTeamSlug}-${state.selectedMatchId}-${state.selectedPlayerId}-${state.manoTeam1Slug}-${state.manoTeam2Slug}`;

  const renderScene = () => {
    switch (scene) {
      case 'home': return <StudioHome data={data} competition={tournament.competition} />;
      case 'rounds': return <StudioRounds data={data} roundIndex={state.roundIndex} />;
      case 'standings': return <StudioStandings data={data} />;
      case 'standings-top': return <StudioStandings data={data} />;
      case 'standings-bottom': return <StudioStandings data={data} />;
      case 'team': return <StudioTeamFilter data={data} selectedTeam={state.selectedTeamSlug} sqlPlayers={sqlPlayers} sqlEvents={sqlEvents} />;
      case 'mano-a-mano': return <SceneManoAMano data={data} team1Id={state.manoTeam1Slug} team2Id={state.manoTeam2Slug} />;
      case 'bracket': return <SceneBracket data={data} />;
      case 'schedule': return <StudioSchedule data={data} />;
      case 'scorers': return <StudioTopScorers scorers={topScorers} sqlEvents={sqlEvents} />;
      case 'assists': return <StudioTopAssists assists={topAssists} sqlEvents={sqlEvents} />;
      case 'cards': return <StudioTopCards cardRanking={cardRanking} teamDiscipline={teamDiscipline} />;
      case 'match-detail': return <StudioMatchDetail matchId={state.selectedMatchId} sqlMatches={sqlMatches} sqlEvents={sqlEvents} sqlTeams={sqlTeams} sqlPlayers={sqlPlayers} data={data} />;
      case 'player': return <StudioPlayerProfile playerId={state.selectedPlayerId} sqlPlayers={sqlPlayers} sqlTeams={sqlTeams} sqlEvents={sqlEvents} sqlMatches={sqlMatches} data={data} />;
      case 'suspensions': return <StudioSuspensions suspensions={suspensions} />;
      case 'arena-selection': return <StudioArenaSelection competitionId={tournament.competition?.id} roundIndex={state.roundIndex} sqlPlayers={sqlPlayers} sqlTeams={sqlTeams} />;
      case 'selecao-galera': return <StudioSelecaoGalera competitionId={tournament.competition?.id} roundIndex={state.roundIndex} sqlPlayers={sqlPlayers} sqlTeams={sqlTeams} />;
      case 'bolao-ranking': return <StudioBolaoRanking competitionId={tournament.competition?.id} />;
      case 'voting-live': return <StudioVotingLive competitionId={tournament.competition?.id} roundIndex={state.roundIndex} sqlPlayers={sqlPlayers} sqlTeams={sqlTeams} />;
      case 'zebra': return <StudioZebra competitionId={tournament.competition?.id} roundIndex={state.roundIndex} />;
      case 'match-replay': return <StudioMatchReplay matchId={state.selectedMatchId} sqlMatches={sqlMatches} sqlEvents={sqlEvents} sqlTeams={sqlTeams} sqlPlayers={sqlPlayers} data={data} />;
      default: return <StudioHome data={data} competition={tournament.competition} />;
    }
  };

  const scaledW = CANVAS_W * scale;
  const scaledH = CANVAS_H * scale;

  return (
    <div
      ref={containerRef}
      className={`${embedded ? 'w-full h-full' : 'w-screen h-screen'} bg-[#f1f5f9] flex items-center justify-center overflow-hidden`}
    >
      <div style={{ width: scaledW, height: scaledH, position: 'relative', overflow: 'hidden' }}>
        <div style={{
          width: CANVAS_W, height: CANVAS_H,
          transform: `scale(${scale})`, transformOrigin: 'top left',
          position: 'absolute', top: 0, left: 0, overflow: 'hidden',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
          fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
        }}>
          {/* Header bar - only show in broadcast mode, not embedded */}
          {!embedded && (
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between" style={{
              height: 68, background: 'linear-gradient(90deg, #1a7a2e, #22862f, #1a7a2e)',
              borderBottom: '2px solid rgba(98,192,105,0.4)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
            }}>
              {/* Left side - POWER SPORTS logo */}
              <div className="flex items-center h-full pl-8">
                <div style={{ width: 280, height: 42, filter: 'brightness(0) invert(1)' }}>
                  <LogoPower />
                </div>
              </div>

              {/* Right side - online indicator only */}
              <div className="flex items-center gap-4 pr-8 h-full">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-emerald-300' : 'bg-red-400'}`} />
              </div>
            </div>
          )}

          {/* Scene content */}
          <div className="absolute inset-0" style={{ top: embedded ? 0 : 68 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={sceneKey}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full"
              >
                {renderScene()}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom accent */}
          <div className="absolute bottom-0 left-0 right-0 z-30" style={{ height: 4, background: 'linear-gradient(90deg, #16a34a, #22c55e, #16a34a)' }} />
        </div>
      </div>
    </div>
  );
}