import { useState, useMemo, useCallback, useRef } from 'react';
import { Newspaper, ClipboardCopy, Check, ChevronDown, ChevronUp, FileText, BarChart3, Trophy, Code, Image } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { SQLMatch, SQLPlayer, SQLMatchEvent, SQLTeam, SQLCompetition } from '../lib/supabase';

// ============================
// NEWS EXPORT PANEL
// Aba 1: Prompt ChatGPT (dados + diretrizes editoriais)
// Aba 2: HTML WordPress (blocos inline-style, copiar e colar)
// Usa APELIDO (p.name) — nunca real_name
// ============================

interface NewsExportPanelProps {
  matches: SQLMatch[];
  teams: SQLTeam[];
  players: SQLPlayer[];
  events: SQLMatchEvent[];
  competition?: SQLCompetition | null;
  competitionName?: string;
}

function eventLabel(type: string): string {
  const labels: Record<string, string> = {
    goal: 'Gol', penalty_scored: 'Penalti convertido', penalty_missed: 'Penalti perdido',
    own_goal: 'Gol contra', yellow_card: 'Cartao amarelo', red_card: 'Cartao vermelho',
    substitution: 'Substituicao', second_yellow: '2o amarelo',
  };
  return labels[type] || type;
}

function sortEventsChronologically(events: SQLMatchEvent[]): SQLMatchEvent[] {
  return [...events].sort((a, b) => {
    const halfA = a.half === '2T' ? 2 : 1;
    const halfB = b.half === '2T' ? 2 : 1;
    if (halfA !== halfB) return halfA - halfB;
    return (a.minute || 0) - (b.minute || 0);
  });
}

// Helper: apelido do jogador
function pName(p: SQLPlayer | undefined): string {
  return p?.name || '?';
}

// ============================
// INLINE STYLES for WordPress HTML blocks
// ============================
const S = {
  block: 'font-family:Inter,Helvetica,Arial,sans-serif;background:#0f172a;color:#e2e8f0;border-radius:12px;overflow:hidden;margin:24px 0;border:1px solid #334155',
  header: 'text-align:center;padding:12px 16px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);border-bottom:1px solid #334155',
  headerH3: 'font-family:Plus Jakarta Sans,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#22c55e;text-transform:uppercase;letter-spacing:0.5px;margin:0',
  footer: 'text-align:center;padding:10px 16px;border-top:1px solid #334155',
  footerBrand: 'font-family:Plus Jakarta Sans,Helvetica,sans-serif;font-size:12px;font-weight:800;color:#22c55e',
  footerUrl: 'font-size:10px;color:#64748b;margin-left:6px',
  match: 'display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 16px;border-bottom:1px solid #1e293b',
  teamHome: 'display:flex;align-items:center;gap:6px;flex:1;justify-content:flex-end;text-align:right',
  teamAway: 'display:flex;align-items:center;gap:6px;flex:1;justify-content:flex-start',
  teamName: 'font-weight:700;font-size:13px;color:#f1f5f9',
  teamLogo: 'width:28px;height:28px;object-fit:contain',
  score: 'font-family:Plus Jakarta Sans,Helvetica,sans-serif;font-size:22px;font-weight:800;color:#fff;min-width:70px;text-align:center;background:#334155;border-radius:6px;padding:2px 10px',
  meta: 'text-align:center;font-size:10px;color:#64748b;padding:0 16px 8px',
  goals: 'font-size:11px;color:#94a3b8;padding:4px 16px 10px',
  goalScorer: 'color:#22c55e;font-weight:600',
  pill: 'background:#1e293b;border:1px solid #334155;border-radius:999px;padding:6px 16px;text-align:center;display:inline-block;margin:0 4px',
  pillNum: 'font-family:Plus Jakarta Sans,Helvetica,sans-serif;font-size:18px;font-weight:800;color:#22c55e',
  pillLabel: 'font-size:9px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px',
  statsBar: 'display:flex;gap:8px;justify-content:center;padding:10px 16px;flex-wrap:wrap',
  table: 'width:100%;border-collapse:collapse;font-size:12px',
  th: 'background:#334155;color:#94a3b8;font-weight:600;padding:6px 5px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:0.5px',
  thTeam: 'background:#334155;color:#94a3b8;font-weight:600;padding:6px 5px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:0.5px',
  tdEven: 'padding:6px 5px;text-align:center;border-bottom:1px solid #1e293b;background:#1e293b',
  tdOdd: 'padding:6px 5px;text-align:center;border-bottom:1px solid #1e293b;background:#0f172a',
  tdTeamEven: 'padding:6px 5px;text-align:left;border-bottom:1px solid #1e293b;background:#1e293b',
  tdTeamOdd: 'padding:6px 5px;text-align:left;border-bottom:1px solid #1e293b;background:#0f172a',
  pos: 'font-weight:700;color:#22c55e',
  tcell: 'display:flex;align-items:center;gap:6px',
  tcellLogo: 'width:18px;height:18px;object-fit:contain',
  tcellName: 'font-weight:600;color:#f1f5f9',
  pts: 'font-weight:800;color:#22c55e;font-size:14px',
  sgPos: 'color:#22c55e',
  sgNeg: 'color:#ef4444',
  formBox: 'display:inline-flex;gap:2px;justify-content:center',
  formV: 'width:16px;height:16px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;background:#22c55e',
  formE: 'width:16px;height:16px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;background:#eab308',
  formD: 'width:16px;height:16px;border-radius:3px;display:inline-flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;color:#fff;background:#ef4444',
  scorerRow: 'display:flex;align-items:center;gap:8px;padding:5px 16px;border-bottom:1px solid #1e293b',
  scorerRank: 'width:20px;font-weight:700;color:#22c55e;text-align:right;font-size:13px',
  scorerName: 'flex:1;font-weight:600;color:#f1f5f9;font-size:12px',
  scorerTeam: 'font-size:10px;color:#64748b;margin-left:4px',
  scorerGoals: 'font-weight:800;color:#22c55e;font-size:15px;min-width:28px;text-align:center',
  scorerLogo: 'width:18px;height:18px;object-fit:contain',
  nextRow: 'display:flex;align-items:center;gap:8px;padding:6px 16px;border-bottom:1px solid #1e293b',
  nextTeams: 'flex:1;font-weight:600;color:#f1f5f9;font-size:12px',
  nextInfo: 'font-size:10px;color:#64748b',
  nextLogo: 'width:20px;height:20px;object-fit:contain',
};

function footerHtml(): string {
  return `<div style="${S.footer}"><span style="${S.footerBrand}">Power Sports</span><span style="${S.footerUrl}">power.jornalfv.com.br</span></div>`;
}

export function NewsExportPanel({ matches, teams, players, events, competition, competitionName }: NewsExportPanelProps) {
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [exportMode, setExportMode] = useState<'prompt' | 'html'>('prompt');
  const [includeStandings, setIncludeStandings] = useState(true);
  const [includePlayerStats, setIncludePlayerStats] = useState(true);
  const [includeEditorialGuide, setIncludeEditorialGuide] = useState(true);
  const [includeForm, setIncludeForm] = useState(true);
  const htmlRef = useRef<HTMLDivElement>(null);

  const compName = competitionName || competition?.name || 'Campeonato';
  const compYear = competition?.year || new Date().getFullYear();

  const rounds = useMemo(() => {
    const roundSet = new Set(matches.map(m => m.round_number || 1));
    return [...roundSet].sort((a, b) => a - b);
  }, [matches]);

  useMemo(() => {
    if (selectedRound !== null) return;
    const finishedRounds = rounds.filter(r =>
      matches.filter(m => (m.round_number || 1) === r).every(m => m.status === 'finished')
    );
    if (finishedRounds.length > 0) setSelectedRound(finishedRounds[finishedRounds.length - 1]);
    else if (rounds.length > 0) setSelectedRound(rounds[rounds.length - 1]);
  }, [rounds, matches, selectedRound]);

  const teamMap = useMemo(() => {
    const map: Record<string, SQLTeam> = {};
    teams.forEach(t => { map[t.id] = t; });
    return map;
  }, [teams]);

  const playerMap = useMemo(() => {
    const map: Record<string, SQLPlayer> = {};
    players.forEach(p => { map[p.id] = p; });
    return map;
  }, [players]);

  const roundMatches = useMemo(() =>
    matches.filter(m => (m.round_number || 1) === selectedRound)
      .sort((a, b) => (a.match_date || '').localeCompare(b.match_date || '')),
    [matches, selectedRound]
  );

  const roundEvents = useMemo(() =>
    events.filter(e => roundMatches.some(m => m.id === e.match_id)),
    [events, roundMatches]
  );

  const standings = useMemo(() => {
    const scored = matches.filter(m => m.score_home !== null && m.score_away !== null);
    const stats: Record<string, { team: SQLTeam; pts: number; w: number; d: number; l: number; gf: number; ga: number; gd: number; gp: number }> = {};
    teams.forEach(t => { stats[t.id] = { team: t, pts: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, gp: 0 }; });
    for (const m of scored) {
      const h = stats[m.home_team_id]; const a = stats[m.away_team_id];
      if (!h || !a) continue;
      h.gf += m.score_home!; h.ga += m.score_away!; h.gp++;
      a.gf += m.score_away!; a.ga += m.score_home!; a.gp++;
      if (m.score_home! > m.score_away!) { h.w++; h.pts += 3; a.l++; }
      else if (m.score_away! > m.score_home!) { a.w++; a.pts += 3; h.l++; }
      else { h.d++; h.pts++; a.d++; a.pts++; }
    }
    return Object.values(stats).filter(s => s.gp > 0)
      .map(s => ({ ...s, gd: s.gf - s.ga }))
      .sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);
  }, [matches, teams]);

  const topScorers = useMemo(() =>
    [...players].filter(p => (p.total_goals || 0) > 0)
      .sort((a, b) => (b.total_goals || 0) - (a.total_goals || 0)).slice(0, 10),
    [players]
  );

  const topAssists = useMemo(() =>
    [...players].filter(p => (p.total_assists || 0) > 0)
      .sort((a, b) => (b.total_assists || 0) - (a.total_assists || 0)).slice(0, 10),
    [players]
  );

  const suspendedPlayers = useMemo(() => players.filter(p => p.is_suspended), [players]);
  const warnedPlayers = useMemo(() => players.filter(p => (p.yellow_card_accumulator || 0) >= 2 && !p.is_suspended), [players]);

  const teamForm = useMemo(() => {
    if (!includeForm) return {};
    const form: Record<string, string[]> = {};
    const scored = matches.filter(m => m.score_home !== null && m.score_away !== null)
      .sort((a, b) => (a.round_number || 0) - (b.round_number || 0));
    for (const m of scored) {
      if (!form[m.home_team_id]) form[m.home_team_id] = [];
      if (!form[m.away_team_id]) form[m.away_team_id] = [];
      if (m.score_home! > m.score_away!) { form[m.home_team_id].push('V'); form[m.away_team_id].push('D'); }
      else if (m.score_away! > m.score_home!) { form[m.home_team_id].push('D'); form[m.away_team_id].push('V'); }
      else { form[m.home_team_id].push('E'); form[m.away_team_id].push('E'); }
    }
    const result: Record<string, string> = {};
    for (const [tid, results] of Object.entries(form)) {
      result[tid] = results.slice(-5).join('-');
    }
    return result;
  }, [matches, includeForm]);

  // ============================
  // ABA 1: PROMPT CHATGPT
  // ============================
  const generatePrompt = useCallback(() => {
    if (!selectedRound) return '';
    const lines: string[] = [];
    const now = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const totalRounds = rounds.length;

    lines.push('='.repeat(70));
    lines.push(`DADOS COMPLETOS — ${compName} ${compYear} — RODADA ${selectedRound}/${totalRounds}`);
    lines.push(`Gerado por Power Sports em ${now}`);
    lines.push('='.repeat(70));
    lines.push('');

    // ---- RESULTADOS ----
    lines.push(`## RESULTADOS DA RODADA ${selectedRound}`);
    lines.push('');

    for (const m of roundMatches) {
      const ht = teamMap[m.home_team_id];
      const at = teamMap[m.away_team_id];
      const htName = ht?.name || ht?.short_name || '?';
      const atName = at?.name || at?.short_name || '?';
      const htShort = ht?.short_name || '?';
      const atShort = at?.short_name || '?';

      if (m.score_home !== null && m.score_away !== null) {
        lines.push(`### ${htName} ${m.score_home} x ${m.score_away} ${atName}`);
      } else {
        const dateStr = m.match_date ? new Date(m.match_date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'A definir';
        lines.push(`### ${htName} x ${atName} — ${dateStr} (${m.status === 'scheduled' ? 'Agendado' : m.status})`);
      }

      const details: string[] = [];
      const venue = m.stadium_name || m.location;
      if (venue) details.push(`Local: ${venue}`);
      if (m.referee) details.push(`Arbitro: ${m.referee}`);
      if (m.assistant_referee_1) details.push(`Auxiliar 1: ${m.assistant_referee_1}`);
      if (m.assistant_referee_2) details.push(`Auxiliar 2: ${m.assistant_referee_2}`);
      if (m.attendance) details.push(`Publico: ${m.attendance.toLocaleString('pt-BR')}`);
      if (m.round_name) details.push(`Fase: ${m.round_name}`);
      if (ht?.coach) details.push(`Tecnico ${htShort}: ${ht.coach}`);
      if (at?.coach) details.push(`Tecnico ${atShort}: ${at.coach}`);
      if (ht?.stadium && venue && venue.toLowerCase().includes(ht.stadium.toLowerCase())) {
        details.push(`Mandante: ${htShort} (casa)`);
      } else if (at?.stadium && venue && venue.toLowerCase().includes(at.stadium.toLowerCase())) {
        details.push(`Mandante: ${atShort} (casa)`);
      }
      if (details.length > 0) lines.push(details.join(' | '));

      if (includeForm) {
        const htForm = teamForm[m.home_team_id];
        const atForm = teamForm[m.away_team_id];
        if (htForm || atForm) {
          const formParts: string[] = [];
          if (htForm) formParts.push(`${htShort}: ${htForm}`);
          if (atForm) formParts.push(`${atShort}: ${atForm}`);
          lines.push(`Forma recente (ult. 5): ${formParts.join(' | ')}`);
        }
      }

      const htPos = standings.findIndex(s => s.team.id === m.home_team_id) + 1;
      const atPos = standings.findIndex(s => s.team.id === m.away_team_id) + 1;
      if (htPos > 0 && atPos > 0) {
        lines.push(`Posicao na tabela: ${htShort} ${htPos}o | ${atShort} ${atPos}o`);
      }

      // Cronologia — apelido
      const matchEvents = sortEventsChronologically(roundEvents.filter(e => e.match_id === m.id));
      if (matchEvents.length > 0) {
        lines.push('');
        lines.push('Cronologia:');
        for (const ev of matchEvents) {
          const player = playerMap[ev.player_id];
          const playerName = pName(player);
          const teamShort = ev.team_id === m.home_team_id ? htShort : atShort;
          let detail = `  ${ev.half || ''} ${ev.minute}' — ${eventLabel(ev.event_type)}: ${playerName} (${teamShort})`;

          if (ev.event_type === 'goal' && ev.detail?.assist_player_id) {
            const assister = playerMap[ev.detail.assist_player_id];
            detail += ` — Assist.: ${pName(assister)}`;
          }
          if (ev.event_type === 'own_goal') {
            detail = `  ${ev.half || ''} ${ev.minute}' — Gol contra: ${playerName} (${teamShort})`;
          }
          if (ev.event_type === 'substitution') {
            const outPlayer = ev.detail?.player_out_id ? playerMap[ev.detail.player_out_id] : null;
            if (outPlayer) {
              detail = `  ${ev.half || ''} ${ev.minute}' — Substituicao (${teamShort}): Entrou ${playerName}, Saiu ${pName(outPlayer)}`;
            }
          }
          if (ev.event_type === 'red_card' && ev.detail?.reason === 'second_yellow') {
            detail += ' [2o amarelo]';
          }
          lines.push(detail);
        }
      }

      // Resumo de gols — apelido
      const goals = matchEvents.filter(e => ['goal', 'penalty_scored', 'own_goal'].includes(e.event_type));
      if (goals.length > 0) {
        lines.push('');
        const homeGoals = goals.filter(g => g.event_type === 'own_goal' ? g.team_id === m.away_team_id : g.team_id === m.home_team_id);
        const awayGoals = goals.filter(g => g.event_type === 'own_goal' ? g.team_id === m.home_team_id : g.team_id === m.away_team_id);
        if (homeGoals.length > 0) {
          lines.push(`Gols ${htShort}: ${homeGoals.map(g => {
            const p = playerMap[g.player_id];
            const suffix = g.event_type === 'own_goal' ? ' (contra)' : g.event_type === 'penalty_scored' ? ' (pen.)' : '';
            return `${pName(p)} ${g.minute}'${suffix}`;
          }).join(', ')}`);
        }
        if (awayGoals.length > 0) {
          lines.push(`Gols ${atShort}: ${awayGoals.map(g => {
            const p = playerMap[g.player_id];
            const suffix = g.event_type === 'own_goal' ? ' (contra)' : g.event_type === 'penalty_scored' ? ' (pen.)' : '';
            return `${pName(p)} ${g.minute}'${suffix}`;
          }).join(', ')}`);
        }
      }

      // Cartoes — apelido
      const cards = matchEvents.filter(e => ['yellow_card', 'red_card'].includes(e.event_type));
      if (cards.length > 0) {
        const yellows = cards.filter(c => c.event_type === 'yellow_card');
        const reds = cards.filter(c => c.event_type === 'red_card');
        if (yellows.length > 0) {
          lines.push(`Amarelos: ${yellows.map(c => `${pName(playerMap[c.player_id])} (${c.team_id === m.home_team_id ? htShort : atShort}) ${c.minute}'`).join(', ')}`);
        }
        if (reds.length > 0) {
          lines.push(`Vermelhos: ${reds.map(c => {
            const p = playerMap[c.player_id];
            const reason = c.detail?.reason === 'second_yellow' ? ' [2o am.]' : '';
            return `${pName(p)} (${c.team_id === m.home_team_id ? htShort : atShort}) ${c.minute}'${reason}`;
          }).join(', ')}`);
        }
      }

      if (m.mvp_player_id) {
        const mvp = playerMap[m.mvp_player_id];
        if (mvp) lines.push(`Destaque: ${pName(mvp)} (${teamMap[mvp.team_id]?.short_name || '?'})`);
      }
      if (m.notes) lines.push(`Obs: ${m.notes}`);
      if (m.penalty_score_home != null && m.penalty_score_away != null) {
        lines.push(`Penaltis: ${htShort} ${m.penalty_score_home} x ${m.penalty_score_away} ${atShort}`);
      }
      lines.push('');
    }

    // ---- CLASSIFICACAO ----
    if (includeStandings && standings.length > 0) {
      lines.push('');
      lines.push(`## CLASSIFICACAO (atualizada apos Rodada ${selectedRound})`);
      lines.push('');
      lines.push('Pos | Time                     | Pts | J  | V  | E  | D  | GP | GC | SG  | Forma');
      lines.push('-'.repeat(95));
      standings.forEach((s, i) => {
        const name = (s.team.name || s.team.short_name).padEnd(25);
        const form = includeForm ? (teamForm[s.team.id] || '-') : '';
        lines.push(
          `${String(i + 1).padStart(2)}. | ${name} | ${String(s.pts).padStart(3)} | ${String(s.gp).padStart(2)} | ${String(s.w).padStart(2)} | ${String(s.d).padStart(2)} | ${String(s.l).padStart(2)} | ${String(s.gf).padStart(2)} | ${String(s.ga).padStart(2)} | ${String(s.gd > 0 ? '+' + s.gd : s.gd).padStart(3)} | ${form}`
        );
      });
      lines.push('');
    }

    // ---- ARTILHARIA — apelido ----
    if (includePlayerStats && topScorers.length > 0) {
      lines.push('');
      lines.push('## ARTILHARIA (Top 10)');
      lines.push('');
      topScorers.forEach((p, i) => {
        const team = teamMap[p.team_id];
        lines.push(`${i + 1}. ${pName(p)} (${team?.short_name || '?'}) — ${p.total_goals} gol(s), ${p.total_games || 0} jogo(s), ${p.total_minutes || 0} min`);
      });
    }

    // ---- ASSISTENCIAS — apelido ----
    if (includePlayerStats && topAssists.length > 0) {
      lines.push('');
      lines.push('## GARCONS (Top 10 Assistencias)');
      lines.push('');
      topAssists.forEach((p, i) => {
        const team = teamMap[p.team_id];
        lines.push(`${i + 1}. ${pName(p)} (${team?.short_name || '?'}) — ${p.total_assists} assist(s)`);
      });
    }

    // ---- DISCIPLINA — apelido ----
    if (suspendedPlayers.length > 0 || warnedPlayers.length > 0) {
      lines.push('');
      lines.push('## SITUACAO DISCIPLINAR');
      if (suspendedPlayers.length > 0) {
        lines.push('');
        lines.push('Suspensos (nao podem atuar na proxima rodada):');
        suspendedPlayers.forEach(p => {
          const team = teamMap[p.team_id];
          lines.push(`  - ${pName(p)} (${team?.short_name || '?'}) — ${p.total_yellow_cards || 0} AM, ${p.total_red_cards || 0} VM`);
        });
      }
      if (warnedPlayers.length > 0) {
        lines.push('');
        lines.push('Pendurados (proximo amarelo = suspensao):');
        warnedPlayers.forEach(p => {
          const team = teamMap[p.team_id];
          lines.push(`  - ${pName(p)} (${team?.short_name || '?'}) — ${p.yellow_card_accumulator} AM acumulados`);
        });
      }
    }

    // ---- PROXIMA RODADA ----
    const nextRound = selectedRound + 1;
    const nextMatches = matches.filter(m => (m.round_number || 1) === nextRound);
    if (nextMatches.length > 0) {
      lines.push('');
      lines.push(`## PROXIMA RODADA (Rodada ${nextRound})`);
      lines.push('');
      for (const m of nextMatches) {
        const ht = teamMap[m.home_team_id];
        const at = teamMap[m.away_team_id];
        const dateStr = m.match_date
          ? new Date(m.match_date).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
          : 'A definir';
        const venue = m.stadium_name || m.location || ht?.stadium || '';
        lines.push(`  ${ht?.name || '?'} x ${at?.name || '?'}`);
        lines.push(`    ${dateStr}${venue ? ` | ${venue}` : ''}`);
        const htPos = standings.findIndex(s => s.team.id === m.home_team_id) + 1;
        const atPos = standings.findIndex(s => s.team.id === m.away_team_id) + 1;
        if (htPos > 0 && atPos > 0) {
          lines.push(`    ${ht?.short_name} ${htPos}o lugar (${standings[htPos - 1]?.pts || 0}pts) vs ${at?.short_name} ${atPos}o lugar (${standings[atPos - 1]?.pts || 0}pts)`);
        }
      }
    }

    // ---- NUMEROS DA RODADA ----
    lines.push('');
    lines.push('## NUMEROS DA RODADA');
    const totalGoals = roundEvents.filter(e => ['goal', 'penalty_scored', 'own_goal'].includes(e.event_type)).length;
    const totalYellows = roundEvents.filter(e => e.event_type === 'yellow_card').length;
    const totalReds = roundEvents.filter(e => e.event_type === 'red_card').length;
    const finishedCount = roundMatches.filter(m => m.score_home !== null).length;
    lines.push(`Jogos: ${finishedCount} | Gols: ${totalGoals} | Media: ${(totalGoals / Math.max(finishedCount, 1)).toFixed(1)} gols/jogo | Amarelos: ${totalYellows} | Vermelhos: ${totalReds}`);

    // ---- DIRETRIZES EDITORIAIS ----
    if (includeEditorialGuide) {
      lines.push('');
      lines.push('='.repeat(70));
      lines.push('INSTRUCOES — REDACAO ESPORTIVA PARA O JORNAL FORCA DO VALE');
      lines.push('='.repeat(70));
      lines.push('');
      lines.push('Voce e um redator ESPORTIVO do Jornal Forca do Vale (jornalfv.com.br), com sede em Encantado/RS, Vale do Taquari.');
      lines.push('Especialidade: cobertura de futebol amador e regional.');
      lines.push('');
      lines.push('CONTEXTO DO CAMPEONATO:');
      lines.push(`- Competicao: ${compName} ${compYear}`);
      lines.push('- Formato: futebol de campo, 11 jogadores por time');
      lines.push('- Ambito: regional, times do Vale do Taquari e regiao');
      lines.push('- Cada time tem seu proprio estadio/campo (mandante joga em casa)');
      lines.push('- Dados e estatisticas fornecidos por Power Sports (power.jornalfv.com.br)');
      lines.push('');
      lines.push('TOM E ESTILO — JORNALISMO ESPORTIVO:');
      lines.push('- Escreva como cronista esportivo brasileiro: pulsante, vivo, com ritmo');
      lines.push('- O lide deve prender pela acao, nao pelo burocratico');
      lines.push('- Use verbos de impacto: "fulminou", "arrancou", "selou", "escapou", "desperdicou"');
      lines.push('- Descreva lances decisivos como quem narra: contextualize o momento do gol, a jogada, o minuto');
      lines.push('- Explore narrativas: viradas, invencibilidades, artilheiros em sequencia, duelos diretos na tabela');
      lines.push('- Identifique o fato central da rodada (goleada, zebra, jogo decisivo, briga por vaga) e use como gancho');
      lines.push('- Mencione posicao na tabela, distancia entre times, impacto do resultado na classificacao');
      lines.push('- Se um artilheiro marcou, atualize a contagem e compare com concorrentes');
      lines.push('- Se um time depende de resultado alheio, mencione');
      lines.push('- Use APELIDO dos jogadores (campo "name" nos dados). Nunca invente nomes.');
      lines.push('');
      lines.push('FOCO DA MATERIA — GOLS E RESULTADOS:');
      lines.push('- O titulo e o lide devem ser GERAIS sobre a rodada (panorama, fato principal, impacto na tabela)');
      lines.push('- Depois, um resuminho de cada jogo: placar, quem marcou, minuto, local, lance relevante');
      lines.push('- FOCO nos gols: quem fez, como fez, em que minuto, assistencia se houver');
      lines.push('- Cartoes podem ser mencionados de passagem, sem evidenciar ou criar narrativa negativa');
      lines.push('- Se houve expulsao, mencione brevemente o fato, sem dramatizar');
      lines.push('- NAO enfatize a parte disciplinar — o foco e o futebol jogado, os gols, as disputas de tabela');
      lines.push('');
      lines.push('O QUE PRODUZIR:');
      lines.push('');
      lines.push('1. MATERIA PRINCIPAL (800-1200 palavras)');
      lines.push('   - Antetitulo: frase curta, editorial, provocadora ou contextualizadora (jamais repetir o titulo)');
      lines.push('   - Titulo: GERAL sobre a rodada, objetivo, sem sensacionalismo');
      lines.push('   - Subtitulo: informativo, complementar');
      lines.push('   - Lide: 2 primeiros periodos (~40 palavras), panorama geral da rodada');
      lines.push('   - Corpo: um resumo por jogo com paragrafos curtos, intertitulos, negrito nos gols/nomes');
      lines.push('   - Obrigatorio: citar estadio/local de cada jogo, arbitragem se relevante');
      lines.push('');
      lines.push('2. NOTAS CURTAS para cada jogo (2-3 paragrafos com placar, gols, local)');
      lines.push('');
      lines.push('3. QUADRO "CLASSIFICACAO" — tabela formatada');
      lines.push('');
      lines.push('4. BOX "PROXIMA RODADA" — confrontos com data, hora e local');
      lines.push('');
      lines.push('5. RESUMO PARA INSTAGRAM (formato cards):');
      lines.push('   FUTEBOL | Chamada alternativa');
      lines.push('   (linha em branco)');
      lines.push('   Lide direto e esportivo');
      lines.push('   (linha em branco)');
      lines.push('   * Resultado-destaque');
      lines.push('   * Artilheiro ou lance marcante');
      lines.push('   * Proximo desafio ou contexto de tabela');
      lines.push('   (linha em branco)');
      lines.push('   Acompanhe tudo em power.jornalfv.com.br — classificacao, estatisticas e proximos jogos ao vivo.');
      lines.push('');
      lines.push('RESTRICOES EDITORIAIS:');
      lines.push('- NUNCA linguagem artificial: "no cenario atual", "vale destacar", "diante dessa realidade"');
      lines.push('- NUNCA encerrar com conclusao interpretativa ou desejo de melhora');
      lines.push('- NUNCA adjetivos vagos ("incrivel", "maravilhoso", "transformador")');
      lines.push('- SEM opiniao, suposicoes ou achismos — o dado fala');
      lines.push('- Pode ter ironia leve e critica esportiva (como colunista que entende do jogo)');
      lines.push('- Sem emojis no texto');
      lines.push('- Credito: "Dados: Power Sports (power.jornalfv.com.br)" no rodape');
      lines.push('');
    }

    return lines.join('\n');
  }, [selectedRound, roundMatches, roundEvents, standings, topScorers, topAssists,
      suspendedPlayers, warnedPlayers, teamMap, playerMap, matches, teamForm,
      includeStandings, includePlayerStats, includeEditorialGuide, includeForm,
      compName, compYear, rounds]);

  // ============================
  // ABA 2: HTML WORDPRESS (blocos inline-style, copiar e colar)
  // ============================
  const generateHtml = useCallback(() => {
    if (!selectedRound) return '';

    const totalGoals = roundEvents.filter(e => ['goal', 'penalty_scored', 'own_goal'].includes(e.event_type)).length;
    const finishedCount = roundMatches.filter(m => m.score_home !== null).length;

    // --- BLOCO RESULTADOS ---
    let resultsHtml = `<div style="${S.block}">
<div style="${S.header}"><h3 style="${S.headerH3}">Resultados — Rodada ${selectedRound}</h3></div>
<div style="${S.statsBar}">
  <div style="${S.pill}"><div style="${S.pillNum}">${finishedCount}</div><div style="${S.pillLabel}">Jogos</div></div>
  <div style="${S.pill}"><div style="${S.pillNum}">${totalGoals}</div><div style="${S.pillLabel}">Gols</div></div>
  <div style="${S.pill}"><div style="${S.pillNum}">${(totalGoals / Math.max(finishedCount, 1)).toFixed(1)}</div><div style="${S.pillLabel}">Media/Jogo</div></div>
</div>`;

    for (const m of roundMatches) {
      const ht = teamMap[m.home_team_id];
      const at = teamMap[m.away_team_id];
      const matchEvts = sortEventsChronologically(roundEvents.filter(e => e.match_id === m.id));
      const goals = matchEvts.filter(e => ['goal', 'penalty_scored', 'own_goal'].includes(e.event_type));
      const venue = m.stadium_name || m.location || '';

      resultsHtml += `<div style="${S.match}">
  <div style="${S.teamHome}">
    <span style="${S.teamName}">${ht?.short_name || '?'}</span>
    ${ht?.logo_url ? `<img src="${ht.logo_url}" alt="" style="${S.teamLogo}">` : ''}
  </div>
  <div style="${S.score}">${m.score_home ?? '-'} x ${m.score_away ?? '-'}</div>
  <div style="${S.teamAway}">
    ${at?.logo_url ? `<img src="${at.logo_url}" alt="" style="${S.teamLogo}">` : ''}
    <span style="${S.teamName}">${at?.short_name || '?'}</span>
  </div>
</div>`;
      if (venue) resultsHtml += `<div style="${S.meta}">${venue}</div>`;
      if (goals.length > 0) {
        resultsHtml += `<div style="${S.goals}">`;
        for (const g of goals) {
          const p = playerMap[g.player_id];
          const tShort = g.team_id === m.home_team_id ? (ht?.short_name || '') : (at?.short_name || '');
          const suffix = g.event_type === 'own_goal' ? ' (contra)' : g.event_type === 'penalty_scored' ? ' (pen.)' : '';
          let assistStr = '';
          if (g.event_type === 'goal' && g.detail?.assist_player_id) {
            const a = playerMap[g.detail.assist_player_id];
            assistStr = ` <span style="color:#64748b;font-weight:400">assist. ${pName(a)}</span>`;
          }
          resultsHtml += `<span style="${S.goalScorer}">${pName(p)}</span> ${g.minute}'${suffix}${assistStr} <span style="color:#475569;font-size:9px">(${tShort})</span><br>`;
        }
        resultsHtml += `</div>`;
      }
    }
    resultsHtml += footerHtml() + `</div>`;

    // --- BLOCO CLASSIFICACAO ---
    let standingsHtml = '';
    if (includeStandings && standings.length > 0) {
      standingsHtml = `<div style="${S.block}">
<div style="${S.header}"><h3 style="${S.headerH3}">Classificacao — Apos Rodada ${selectedRound}</h3></div>
<table style="${S.table}">
<tr><th style="${S.th};width:26px">#</th><th style="${S.thTeam}">Time</th><th style="${S.th}">Pts</th><th style="${S.th}">J</th><th style="${S.th}">V</th><th style="${S.th}">E</th><th style="${S.th}">D</th><th style="${S.th}">GP</th><th style="${S.th}">GC</th><th style="${S.th}">SG</th><th style="${S.th};width:90px">Forma</th></tr>`;
      standings.forEach((s, i) => {
        const form = teamForm[s.team.id] || '';
        const formStyles: Record<string, string> = { V: S.formV, E: S.formE, D: S.formD };
        const formHtml = form.split('-').filter(Boolean).map(r => `<span style="${formStyles[r] || S.formE}">${r}</span>`).join('');
        const sgStyle = s.gd > 0 ? `;${S.sgPos}` : s.gd < 0 ? `;${S.sgNeg}` : '';
        const isEven = i % 2 === 1;
        const td = isEven ? S.tdEven : S.tdOdd;
        const tdT = isEven ? S.tdTeamEven : S.tdTeamOdd;
        standingsHtml += `<tr>
  <td style="${td};${S.pos}">${i + 1}</td>
  <td style="${tdT}"><div style="${S.tcell}">${s.team.logo_url ? `<img src="${s.team.logo_url}" alt="" style="${S.tcellLogo}">` : ''}<span style="${S.tcellName}">${s.team.short_name || s.team.name}</span></div></td>
  <td style="${td};${S.pts}">${s.pts}</td><td style="${td}">${s.gp}</td><td style="${td}">${s.w}</td><td style="${td}">${s.d}</td><td style="${td}">${s.l}</td><td style="${td}">${s.gf}</td><td style="${td}">${s.ga}</td>
  <td style="${td}${sgStyle}">${s.gd > 0 ? '+' : ''}${s.gd}</td>
  <td style="${td}"><div style="${S.formBox}">${formHtml}</div></td>
</tr>`;
      });
      standingsHtml += `</table>` + footerHtml() + `</div>`;
    }

    // --- BLOCO ARTILHARIA ---
    let scorersHtml = '';
    if (includePlayerStats && topScorers.length > 0) {
      scorersHtml = `<div style="${S.block}">
<div style="${S.header}"><h3 style="${S.headerH3}">Artilharia</h3></div>`;
      topScorers.forEach((p, i) => {
        const team = teamMap[p.team_id];
        scorersHtml += `<div style="${S.scorerRow}">
  <span style="${S.scorerRank}">${i + 1}</span>
  ${team?.logo_url ? `<img src="${team.logo_url}" alt="" style="${S.scorerLogo}">` : ''}
  <span style="${S.scorerName}">${pName(p)} <span style="${S.scorerTeam}">${team?.short_name || ''}</span></span>
  <span style="${S.scorerGoals}">${p.total_goals}</span>
</div>`;
      });
      scorersHtml += footerHtml() + `</div>`;
    }

    // --- BLOCO PROXIMA RODADA ---
    let nextHtml = '';
    const nextRound = selectedRound + 1;
    const nextMatches = matches.filter(m => (m.round_number || 1) === nextRound);
    if (nextMatches.length > 0) {
      nextHtml = `<div style="${S.block}">
<div style="${S.header}"><h3 style="${S.headerH3}">Proxima Rodada — Rodada ${nextRound}</h3></div>`;
      for (const m of nextMatches) {
        const ht = teamMap[m.home_team_id];
        const at = teamMap[m.away_team_id];
        const dateStr = m.match_date
          ? new Date(m.match_date).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
          : 'A definir';
        const venue = m.stadium_name || m.location || ht?.stadium || '';
        nextHtml += `<div style="${S.nextRow}">
  ${ht?.logo_url ? `<img src="${ht.logo_url}" alt="" style="${S.nextLogo}">` : ''}
  <span style="${S.nextTeams}">${ht?.short_name || '?'} x ${at?.short_name || '?'}</span>
  ${at?.logo_url ? `<img src="${at.logo_url}" alt="" style="${S.nextLogo}">` : ''}
  <span style="${S.nextInfo}">${dateStr}${venue ? ` | ${venue}` : ''}</span>
</div>`;
      }
      nextHtml += footerHtml() + `</div>`;
    }

    // Juntar todos os blocos com comentarios
    const blocks: string[] = [];
    blocks.push(`<!-- BLOCO: RESULTADOS DA RODADA ${selectedRound} -->`);
    blocks.push(resultsHtml);
    blocks.push('');
    if (standingsHtml) {
      blocks.push('<!-- BLOCO: CLASSIFICACAO -->');
      blocks.push(standingsHtml);
      blocks.push('');
    }
    if (scorersHtml) {
      blocks.push('<!-- BLOCO: ARTILHARIA -->');
      blocks.push(scorersHtml);
      blocks.push('');
    }
    if (nextHtml) {
      blocks.push('<!-- BLOCO: PROXIMA RODADA -->');
      blocks.push(nextHtml);
      blocks.push('');
    }

    return blocks.join('\n');
  }, [selectedRound, roundMatches, roundEvents, standings, topScorers,
      teamMap, playerMap, teamForm, compName, compYear, matches, includeStandings, includePlayerStats]);

  // Preview HTML wraps blocks in a minimal page
  const generatePreviewHtml = useCallback(() => {
    const blocks = generateHtml();
    if (!blocks) return '';
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${compName} — Rodada ${selectedRound}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>body{font-family:Inter,sans-serif;background:#0f172a;color:#e2e8f0;padding:24px 16px;margin:0}.page{max-width:800px;margin:0 auto}.hdr{text-align:center;margin-bottom:32px}.hdr h1{font-family:Plus Jakarta Sans,sans-serif;font-size:28px;font-weight:800;color:#22c55e;margin:0}.hdr h2{font-size:16px;color:#94a3b8;margin:4px 0 0}.hdr .badge{display:inline-block;margin-top:12px;padding:6px 20px;border-radius:999px;background:#22c55e;color:#0f172a;font-weight:700;font-size:14px}</style>
</head>
<body>
<div class="page">
<div class="hdr">
  <h1>${compName}</h1>
  <h2>${compYear}</h2>
  <div class="badge">Rodada ${selectedRound}</div>
</div>
${blocks}
</div>
</body>
</html>`;
  }, [generateHtml, compName, compYear, selectedRound]);

  const output = useMemo(() => exportMode === 'prompt' ? generatePrompt() : generateHtml(), [exportMode, generatePrompt, generateHtml]);

  const handleCopy = useCallback((content?: string) => {
    const text = content || output;
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(exportMode);
      toast.success(exportMode === 'prompt' ? 'Prompt copiado! Cole no ChatGPT.' : 'HTML copiado! Cole no WordPress (bloco HTML personalizado).');
      setTimeout(() => setCopied(null), 3000);
    }).catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(exportMode); toast.success('Copiado!'); setTimeout(() => setCopied(null), 3000); }
      catch { toast.error('Falha ao copiar'); }
      document.body.removeChild(ta);
    });
  }, [output, exportMode]);

  const handleOpenHtml = useCallback(() => {
    const html = generatePreviewHtml();
    if (!html) return;
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }, [generatePreviewHtml]);

  const roundStats = useMemo(() => {
    const finished = roundMatches.filter(m => m.score_home !== null).length;
    const totalGoals = roundEvents.filter(e => ['goal', 'penalty_scored', 'own_goal'].includes(e.event_type)).length;
    const totalCards = roundEvents.filter(e => ['yellow_card', 'red_card'].includes(e.event_type)).length;
    return { finished, total: roundMatches.length, totalGoals, totalCards };
  }, [roundMatches, roundEvents]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-1">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100">
          <Newspaper className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
            Exportar para Jornal
          </h3>
          <p className="text-[10px] text-slate-500">
            Prompt para ChatGPT + blocos HTML para WordPress
          </p>
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-slate-100">
        <button
          onClick={() => setExportMode('prompt')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${exportMode === 'prompt' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-3.5 h-3.5" /> Prompt ChatGPT
        </button>
        <button
          onClick={() => setExportMode('html')}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${exportMode === 'html' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Code className="w-3.5 h-3.5" /> HTML WordPress
        </button>
      </div>

      {/* Round selector */}
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-xs font-semibold text-slate-600">Rodada:</label>
        <div className="flex gap-1.5 flex-wrap">
          {rounds.map(r => {
            const isAllFinished = matches.filter(m => (m.round_number || 1) === r).every(m => m.status === 'finished' || (m.score_home !== null && m.score_away !== null));
            return (
              <button
                key={r}
                onClick={() => setSelectedRound(r)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  selectedRound === r
                    ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                    : isAllFinished
                    ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                R{r}
              </button>
            );
          })}
        </div>
      </div>

      {/* Options */}
      <div className="flex gap-3 flex-wrap">
        {[
          { checked: includeStandings, set: setIncludeStandings, icon: Trophy, label: 'Classificacao' },
          { checked: includePlayerStats, set: setIncludePlayerStats, icon: BarChart3, label: 'Artilharia' },
          { checked: includeForm, set: setIncludeForm, icon: BarChart3, label: 'Forma recente' },
          ...(exportMode === 'prompt' ? [{ checked: includeEditorialGuide, set: setIncludeEditorialGuide, icon: FileText, label: 'Diretrizes' }] : []),
        ].map(opt => (
          <label key={opt.label} className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={opt.checked} onChange={e => opt.set(e.target.checked)} className="rounded border-slate-300 text-indigo-500 w-3.5 h-3.5" />
            <opt.icon className="w-3 h-3" /> {opt.label}
          </label>
        ))}
      </div>

      {/* Round quick stats */}
      {selectedRound && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { n: roundStats.total, l: 'Jogos', bg: 'bg-blue-50', border: 'border-blue-100', text: 'text-blue-600', sub: 'text-blue-500' },
            { n: roundStats.finished, l: 'Encerrados', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600', sub: 'text-emerald-500' },
            { n: roundStats.totalGoals, l: 'Gols', bg: 'bg-amber-50', border: 'border-amber-100', text: 'text-amber-600', sub: 'text-amber-500' },
            { n: roundStats.totalCards, l: 'Cartoes', bg: 'bg-red-50', border: 'border-red-100', text: 'text-red-500', sub: 'text-red-400' },
          ].map(s => (
            <div key={s.l} className={`p-2.5 rounded-xl ${s.bg} border ${s.border} text-center`}>
              <div className={`text-lg font-black ${s.text}`}>{s.n}</div>
              <div className={`text-[9px] ${s.sub} font-semibold`}>{s.l}</div>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={() => handleCopy()}
          disabled={!output}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            copied === exportMode
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
              : exportMode === 'prompt'
              ? 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-200'
              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200'
          } disabled:opacity-40`}
        >
          {copied === exportMode ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
          {copied === exportMode ? 'Copiado!' : exportMode === 'prompt' ? 'Copiar Prompt' : 'Copiar HTML'}
        </button>
        {exportMode === 'html' && (
          <button
            onClick={handleOpenHtml}
            disabled={!output}
            className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-purple-500 text-white text-sm font-bold hover:bg-purple-600 shadow-lg shadow-purple-200 disabled:opacity-40"
          >
            <Image className="w-4 h-4" /> Abrir
          </button>
        )}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="flex items-center gap-1.5 px-4 py-3 rounded-xl bg-slate-100 text-slate-600 text-sm font-bold hover:bg-slate-200 border border-slate-200"
        >
          {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Preview */}
      {showPreview && output && (
        <div className="relative">
          {exportMode === 'prompt' ? (
            <pre className="p-4 rounded-xl bg-slate-900 text-slate-300 text-[10px] leading-relaxed overflow-auto max-h-[500px] whitespace-pre-wrap font-mono border border-slate-700">
              {output}
            </pre>
          ) : (
            <div ref={htmlRef} className="rounded-xl overflow-hidden border border-slate-200 max-h-[500px] overflow-auto">
              <iframe
                srcDoc={generatePreviewHtml()}
                className="w-full border-0"
                style={{ height: '500px' }}
                title="Preview HTML"
              />
            </div>
          )}
          <div className="absolute top-2 right-2">
            <button onClick={() => handleCopy()} className="p-1.5 rounded-lg bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors" title="Copiar">
              <ClipboardCopy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 text-right">
            {output.length.toLocaleString('pt-BR')} caracteres
            {exportMode === 'prompt' && ` · ~${Math.ceil(output.split(/\s+/).length / 750)} tokens GPT`}
          </div>
        </div>
      )}
    </div>
  );
}
