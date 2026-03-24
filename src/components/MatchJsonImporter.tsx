// ============================
// MATCH JSON IMPORTER — v4
// Duas vias: Colar Súmula direto OU Gerar Prompt → IA → JSON
// ============================

import { useState, useMemo } from 'react';
import {
  FileJson2, CheckCircle2, AlertTriangle, XCircle, Upload,
  ChevronRight, ArrowLeft, Loader2, Users, Zap, Shield,
  AlertCircle, X, CircleCheck, User, Copy, ClipboardCheck,
  Sparkles, ClipboardPaste, FileText, Bot,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import type { SQLTeam, SQLPlayer, SQLMatch } from '../lib/supabase';
import {
  validateImportJSON, buildPreview, processMatchImport,
  type ImportPreview, type PlayerMatch, type ValidationResult,
  type MatchImportJSON,
} from '../lib/match-import';
import { compareWithScoutEvents, type ScoutComparison } from '../lib/match-import';
import { fetchAllEvents } from '../lib/supabase';
import type { SQLMatchEvent } from '../lib/supabase';
import { isSumulaText, parseSumula } from '../lib/sumula-parser';

const glassCard = 'rounded-2xl';
const glassBg = { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };

interface MatchJsonImporterProps {
  match: SQLMatch;
  teams: SQLTeam[];
  players: SQLPlayer[];
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'input' | 'score' | 'preview' | 'processing' | 'done';
type InputMode = 'direct' | 'prompt';

// ── PROMPT GENERATOR ──────────────────────────────────

function generatePrompt(
  match: SQLMatch,
  homeTeam: SQLTeam | undefined,
  awayTeam: SQLTeam | undefined,
  homePlayers: SQLPlayer[],
  awayPlayers: SQLPlayer[],
  sumulaText: string,
): string {
  const homeName = homeTeam?.name || 'MANDANTE';
  const awayName = awayTeam?.name || 'VISITANTE';
  const homeShort = homeTeam?.short_name || homeName;
  const awayShort = awayTeam?.short_name || awayName;

  const formatRoster = (players: SQLPlayer[]) =>
    players
      .sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0))
      .map(p => {
        const base = `#${p.number} ${p.name} (${p.position || '?'})`;
        return p.real_name ? `${base} — ${p.real_name}` : base;
      })
      .join('\n');

  return `Você converte dados de partida de futebol amador em JSON estruturado.

REGRAS:
- Use EXATAMENTE os APELIDOS do elenco abaixo no JSON.
- O "nome oficial" (após o —) serve APENAS para identificar jogadores quando o texto usa o nome civil.
- Exemplo: texto diz "José Armando fez gol" → no JSON use "ZÉ CABEÇA" (que é o apelido do #8 cujo nome oficial é José Armando).
- Se um nome do texto não bate com nenhum apelido NEM nome oficial do elenco, escreva como está + "[?]".
- Se o minuto não foi informado, use null.
- Dois amarelos para o mesmo jogador = dois eventos yellow_card + suspensions com reason "dois_amarelos".
- Vermelho direto = evento red_card detail "direto" + suspensions com reason "vermelho_direto".
- IMPORTANTE: Retorne SOMENTE o JSON puro. Sem \`\`\`json, sem texto antes ou depois. APENAS o JSON.
- Os números da camisa na súmula podem diferir dos do elenco. Use o NÚMERO DA SÚMULA no JSON, mas identifique o jogador pelo NOME.

DADOS DA PARTIDA:
- Mandante: ${homeName}
- Visitante: ${awayName}
- Rodada: ${match.round_number}
- Data: ${match.match_date || 'null'}
- competition_id: ${match.competition_id}

ELENCO ${homeShort}:
${homePlayers.length > 0 ? formatRoster(homePlayers) : '(sem jogadores cadastrados)'}

ELENCO ${awayShort}:
${awayPlayers.length > 0 ? formatRoster(awayPlayers) : '(sem jogadores cadastrados)'}

SCHEMA JSON (retorne exatamente neste formato):
{
  "match_import": {
    "version": "1.0",
    "competition_id": "${match.competition_id}",
    "round_number": ${match.round_number},
    "match_date": "${match.match_date || 'YYYY-MM-DD'}",
    "home_team": { "name": "${homeName}", "score": 0 },
    "away_team": { "name": "${awayName}", "score": 0 },
    "lineups": {
      "home": { "starters": [], "bench": [], "coach": "" },
      "away": { "starters": [], "bench": [], "coach": "" }
    },
    "events": [],
    "suspensions": [],
    "notes": ""
  }
}

Jogador na escalação: { "number": N, "name": "APELIDO", "position": "posição" }
Posições: goleiro, lateral, zagueiro, meia, atacante

Eventos:
- Gol: { "type": "goal", "team": "home"|"away", "player_name": "", "player_number": N, "minute": N|null, "half": 1|2, "detail": "normal"|"penal"|"contra"|"falta" }
- Substituição: { "type": "substitution", "team": "home"|"away", "player_out_name": "", "player_out_number": N, "player_in_name": "", "player_in_number": N, "minute": N|null, "half": 1|2 }
- Amarelo: { "type": "yellow_card", "team": "home"|"away", "player_name": "", "player_number": N, "minute": N|null, "half": 1|2 }
- Vermelho: { "type": "red_card", "team": "home"|"away", "player_name": "", "player_number": N, "minute": N|null, "half": 1|2, "detail": "direto"|"dois_amarelos" }

Suspensões (2 amarelos ou vermelho direto):
{ "player_name": "", "player_number": N, "team": "home"|"away", "reason": "dois_amarelos"|"vermelho_direto", "games_suspended": 1, "next_eligible_round": null, "note": "" }

TEXTO DA PARTIDA (converter para JSON):
${sumulaText}`;
}

// ── MAIN COMPONENT ──────────────────────────────────────

export function MatchJsonImporter({ match, teams, players, onClose, onComplete }: MatchJsonImporterProps) {
  const [step, setStep] = useState<Step>('input');
  const [inputMode, setInputMode] = useState<InputMode>('direct');
  const [pastedText, setPastedText] = useState('');
  const [sumulaTextForPrompt, setSumulaTextForPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [detectedFormat, setDetectedFormat] = useState<'sumula' | 'json' | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [rawData, setRawData] = useState<MatchImportJSON['match_import'] | null>(null);
  const [processLog, setProcessLog] = useState<string[]>([]);
  const [result, setResult] = useState<{ eventsCreated: number; lineupsCreated: number; playersCreated: number; errors: string[]; eventBreakdown?: Record<string, number> } | null>(null);
  const [scoreHome, setScoreHome] = useState('');
  const [scoreAway, setScoreAway] = useState('');
  const [scoutComparison, setScoutComparison] = useState<ScoutComparison | null>(null);
  const [loadingScout, setLoadingScout] = useState(false);

  const homeTeam = teams.find(t => t.id === match.home_team_id);
  const awayTeam = teams.find(t => t.id === match.away_team_id);
  const homePlayers = useMemo(() => players.filter(p => p.team_id === match.home_team_id), [players, match.home_team_id]);
  const awayPlayers = useMemo(() => players.filter(p => p.team_id === match.away_team_id), [players, match.away_team_id]);

  // Dynamic prompt
  const fullPrompt = useMemo(
    () => generatePrompt(match, homeTeam, awayTeam, homePlayers, awayPlayers, sumulaTextForPrompt),
    [match, homeTeam, awayTeam, homePlayers, awayPlayers, sumulaTextForPrompt],
  );

  // ── Copy prompt ──
  async function handleCopyPrompt() {
    try {
      await navigator.clipboard.writeText(fullPrompt);
      setCopied(true);
      toast.success('Prompt copiado! Cole no ChatGPT/Claude.');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      const ta = document.createElement('textarea');
      ta.value = fullPrompt;
      ta.style.cssText = 'position:fixed;left:-9999px;opacity:0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); setCopied(true); toast.success('Prompt copiado!'); setTimeout(() => setCopied(false), 3000); }
      catch { toast.error('Erro ao copiar'); }
      document.body.removeChild(ta);
    }
  }

  // ── Process pasted text (direct mode) ──
  function handleProcess() {
    const text = pastedText.trim();
    if (!text) return;

    if (isSumulaText(text)) {
      setDetectedFormat('sumula');
      handleSumulaParse(text);
    } else {
      setDetectedFormat('json');
      handleJsonValidate(text);
    }
  }

  // ── Parse súmula ──
  function handleSumulaParse(text: string) {
    const homeName = homeTeam?.name || 'MANDANTE';
    const awayName = awayTeam?.name || 'VISITANTE';
    const result = parseSumula(text, homeName, awayName, match.competition_id, match.round_number, match.match_date);
    setParseWarnings(result.warnings);
    if (!result.data) {
      setValidation({ valid: false, errors: result.errors, warnings: result.warnings });
      return;
    }
    if (result.data.home_team.score === 0 && result.data.away_team.score === 0) {
      setRawData(result.data);
      setStep('score');
      return;
    }
    finishParse(result.data);
  }

  // ── Validate JSON ──
  function handleJsonValidate(text: string) {
    const v = validateImportJSON(text);
    setValidation(v);
    if (v.valid && v.data) {
      setDetectedFormat('json');
      finishParse(v.data);
    }
  }

  // ── Finish → preview (now also loads scout events) ──
  async function finishParse(data: MatchImportJSON['match_import']) {
    const p = buildPreview(data, teams, players, match);
    setPreview(p);
    setRawData(data);
    setStep('preview');

    // Load existing scout events for comparison
    setLoadingScout(true);
    try {
      const existingEvents = await fetchAllEvents([match.id]);
      if (existingEvents.length > 0) {
        const comparison = compareWithScoutEvents(
          data.events || [],
          existingEvents,
          players,
          match.home_team_id,
          match.away_team_id,
        );
        setScoutComparison(comparison);
      } else {
        setScoutComparison(null);
      }
    } catch (err) {
      console.error('Error loading scout events:', err);
      setScoutComparison(null);
    }
    setLoadingScout(false);
  }

  // ── Apply manual score ──
  function handleApplyScore() {
    if (!rawData) return;
    const h = parseInt(scoreHome) || 0;
    const a = parseInt(scoreAway) || 0;
    finishParse({
      ...rawData,
      home_team: { ...rawData.home_team, score: h },
      away_team: { ...rawData.away_team, score: a },
    });
  }

  // ── Process import ──
  async function handleConfirm() {
    if (!rawData) return;
    setStep('processing');
    setProcessLog(['Iniciando importação...']);
    try {
      setProcessLog(prev => [...prev, 'Atualizando placar...']);
      const res = await processMatchImport(rawData, match.id, match, teams, players);
      const breakdownStr = res.eventBreakdown
        ? Object.entries(res.eventBreakdown)
            .map(([k, v]) => {
              const labels: Record<string, string> = {
                goal: '⚽ gols', own_goal: '⚽ gols contra', penalty_scored: '⚽ pênaltis',
                yellow_card: '🟨 amarelos', red_card: '🟥 vermelhos', substitution: '🔄 substituições',
              };
              return `${labels[k] || k}: ${v}`;
            })
            .join(', ')
        : '';
      setProcessLog(prev => [
        ...prev,
        `Escalações: ${res.lineupsCreated} jogadores`,
        `Eventos: ${res.eventsCreated} registrados${breakdownStr ? ` (${breakdownStr})` : ''}`,
        ...(res.playersCreated > 0 ? [`Jogadores criados: ${res.playersCreated}`] : []),
        ...(res.errors.length > 0 ? res.errors.map(e => `⚠ ${e}`) : []),
        res.success ? '✓ Importação concluída!' : '✗ Importação com erros',
      ]);
      setResult(res);
      setStep('done');
      if (res.success) {
        toast.success(`Partida importada: ${res.eventsCreated} eventos${breakdownStr ? ` (${breakdownStr})` : ''}`);
      } else {
        toast.error(`Importação com ${res.errors.length} erro(s)`);
      }
    } catch (err: any) {
      setProcessLog(prev => [...prev, `ERRO FATAL: ${err.message}`]);
      setResult({ eventsCreated: 0, lineupsCreated: 0, playersCreated: 0, errors: [err.message] });
      setStep('done');
      toast.error('Erro na importação');
    }
  }

  // ── Steps indicator ──
  const stepsList: { key: Step; label: string; icon: any }[] = [
    { key: 'input', label: 'Dados', icon: ClipboardPaste },
    { key: 'score', label: 'Placar', icon: Zap },
    { key: 'preview', label: 'Preview', icon: Users },
    { key: 'processing', label: 'Processando', icon: Loader2 },
    { key: 'done', label: 'Concluído', icon: CheckCircle2 },
  ];
  const stepOrder = stepsList.map(s => s.key);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 py-3.5 flex items-center justify-between rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <FileJson2 className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                Importar Partida
              </h2>
              <p className="text-[10px] text-slate-400">
                {homeTeam?.short_name || '?'} vs {awayTeam?.short_name || '?'} · Rodada {match.round_number}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Steps indicator */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {stepsList.map((s, i) => {
            const Icon = s.icon;
            const isActive = step === s.key;
            const isPast = stepOrder.indexOf(step) > i;
            return (
              <div key={s.key} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-emerald-100 text-emerald-700' : isPast ? 'text-emerald-500' : 'text-slate-400'
                }`}>
                  <Icon className={`w-3 h-3 ${isActive && s.key === 'processing' ? 'animate-spin' : ''}`} />
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-5">

          {/* ═══════ STEP 1: INPUT ═══════ */}
          {step === 'input' && (
            <div className="space-y-4">

              {/* Mode toggle */}
              <div className="flex rounded-xl bg-slate-100 p-1 gap-1">
                <button
                  onClick={() => { setInputMode('direct'); setValidation(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'direct'
                      ? 'bg-white text-emerald-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <ClipboardPaste className="w-4 h-4" />
                  Colar Súmula / JSON
                </button>
                <button
                  onClick={() => { setInputMode('prompt'); setValidation(null); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    inputMode === 'prompt'
                      ? 'bg-white text-violet-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Bot className="w-4 h-4" />
                  Gerar Prompt p/ IA
                </button>
              </div>

              {/* ── DIRECT MODE ── */}
              {inputMode === 'direct' && (
                <>
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <Sparkles className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-emerald-800 space-y-1">
                      <p className="font-bold">Cole a súmula ou o JSON aqui</p>
                      <p>O sistema detecta automaticamente se é texto de súmula ou JSON e processa.</p>
                    </div>
                  </div>

                  <textarea
                    value={pastedText}
                    onChange={e => { setPastedText(e.target.value); setValidation(null); setDetectedFormat(null); }}
                    className="w-full h-56 text-xs rounded-xl border border-slate-200 bg-white p-4 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 outline-none resize-none"
                    placeholder={`Cole aqui a súmula ou o JSON...\n\nExemplo de súmula:\n📋 SÚMULA DA PARTIDA\n${homeTeam?.name || 'TIME A'} x ${awayTeam?.name || 'TIME B'}\nTitulares\n1 – Nome do Jogador\n...\n\nOu cole o JSON do ChatGPT aqui.`}
                    autoFocus
                  />

                  {/* Format hint */}
                  {pastedText.trim().length > 20 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-[10px] text-slate-500">
                        Formato detectado: <strong className="text-slate-700">
                          {isSumulaText(pastedText) ? 'Súmula (texto)' : 'JSON'}
                        </strong>
                        {isSumulaText(pastedText)
                          ? ' — parseado automaticamente'
                          : ' — validado e importado direto'}
                      </span>
                    </div>
                  )}

                  {/* Errors */}
                  {validation && !validation.valid && (
                    <div className="space-y-1.5">
                      {validation.errors.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                          <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <span className="text-xs text-red-700 whitespace-pre-wrap">{e}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
                      Cancelar
                    </button>
                    <button
                      onClick={handleProcess}
                      disabled={!pastedText.trim()}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Processar
                    </button>
                  </div>
                </>
              )}

              {/* ── PROMPT MODE ── */}
              {inputMode === 'prompt' && (
                <>
                  <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-violet-50 border border-violet-200">
                    <Bot className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
                    <div className="text-[11px] text-violet-800 space-y-1">
                      <p className="font-bold">Gerar prompt para converter via IA</p>
                      <ol className="list-decimal ml-4 space-y-0.5">
                        <li>Cole o texto da súmula abaixo</li>
                        <li>Clique em <strong>"Copiar Prompt"</strong></li>
                        <li>Cole no <strong>ChatGPT ou Claude</strong></li>
                        <li>Copie o JSON que a IA retornar</li>
                        <li>Volte aqui, mude para <strong>"Colar Súmula / JSON"</strong> e cole o JSON</li>
                      </ol>
                    </div>
                  </div>

                  {/* Elencos resumo */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 mb-1">
                        {homeTeam?.short_name} — {homePlayers.length} jogadores
                      </p>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        {homePlayers
                          .sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0))
                          .slice(0, 12)
                          .map(p => `#${p.number} ${p.name}${p.real_name ? ` (${p.real_name.split(' ')[0]})` : ''}`)
                          .join(' · ')}
                        {homePlayers.length > 12 ? ` +${homePlayers.length - 12}` : ''}
                      </p>
                    </div>
                    <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-[10px] font-bold text-slate-500 mb-1">
                        {awayTeam?.short_name} — {awayPlayers.length} jogadores
                      </p>
                      <p className="text-[9px] text-slate-400 leading-relaxed">
                        {awayPlayers
                          .sort((a, b) => (parseInt(a.number) || 0) - (parseInt(b.number) || 0))
                          .slice(0, 12)
                          .map(p => `#${p.number} ${p.name}${p.real_name ? ` (${p.real_name.split(' ')[0]})` : ''}`)
                          .join(' · ')}
                        {awayPlayers.length > 12 ? ` +${awayPlayers.length - 12}` : ''}
                      </p>
                    </div>
                  </div>

                  {/* Textarea para texto da súmula */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 mb-1.5 block">
                      Texto da súmula / partida
                    </label>
                    <textarea
                      value={sumulaTextForPrompt}
                      onChange={e => setSumulaTextForPrompt(e.target.value)}
                      className="w-full h-44 text-xs rounded-xl border border-slate-200 bg-white p-4 text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 outline-none resize-none"
                      placeholder={`Cole aqui o texto da súmula...\n\nExemplo:\n📋 SÚMULA DA PARTIDA\n${homeTeam?.name || 'TIME A'} x ${awayTeam?.name || 'TIME B'}\nÁrbitro: ...\nTitulares\n1 – Nome do Jogador\n...\nCartões Amarelos\n45' 1ºT – Nº 14 Nome\n...\n\nOu qualquer texto descritivo da partida.`}
                      autoFocus
                    />
                  </div>

                  {/* Prompt preview */}
                  {sumulaTextForPrompt.trim() && (
                    <details className="group">
                      <summary className="text-[11px] text-slate-500 cursor-pointer hover:text-slate-700 flex items-center gap-1.5">
                        <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                        Ver prompt completo ({fullPrompt.length.toLocaleString()} chars)
                      </summary>
                      <pre className="mt-2 text-[9px] text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3 max-h-40 overflow-y-auto whitespace-pre-wrap font-mono select-all">
                        {fullPrompt}
                      </pre>
                    </details>
                  )}

                  {/* Actions */}
                  <div className="flex justify-between items-center">
                    <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
                      Cancelar
                    </button>
                    <button
                      onClick={handleCopyPrompt}
                      disabled={!sumulaTextForPrompt.trim()}
                      className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${
                        copied
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                          : 'bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                    >
                      {copied ? <ClipboardCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copiado! Agora cole no ChatGPT' : 'Copiar Prompt'}
                    </button>
                  </div>

                  {/* Hint after copy */}
                  {copied && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-[11px] text-emerald-800">
                        Prompt copiado! Cole no ChatGPT/Claude, copie o JSON que ele retornar, 
                        depois mude para <strong>"Colar Súmula / JSON"</strong> e cole o JSON ali.
                      </span>
                    </div>
                  )}
                </>
              )}

            </div>
          )}

          {/* ═══════ STEP 2: SCORE INPUT ═══════ */}
          {step === 'score' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-[11px] text-amber-800">
                  <p className="font-bold">Placar não encontrado na súmula</p>
                  <p>Informe o placar da partida abaixo.</p>
                </div>
              </div>

              {parseWarnings.length > 0 && (
                <div className="space-y-1">
                  {parseWarnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                      <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="text-[10px] text-amber-700">{w}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-center gap-4 py-6">
                <div className="text-center">
                  {homeTeam?.logo_url && <img src={homeTeam.logo_url} className="w-14 h-14 mx-auto mb-2 object-contain" />}
                  <p className="text-sm font-bold text-slate-800 mb-2">{homeTeam?.short_name || '?'}</p>
                  <input
                    type="number"
                    min="0"
                    value={scoreHome}
                    onChange={e => setScoreHome(e.target.value)}
                    className="w-20 h-16 text-center text-3xl font-black rounded-xl border-2 border-slate-300 focus:border-emerald-500 outline-none"
                    placeholder="0"
                    autoFocus
                  />
                </div>
                <span className="text-2xl font-bold text-slate-300 pt-10">x</span>
                <div className="text-center">
                  {awayTeam?.logo_url && <img src={awayTeam.logo_url} className="w-14 h-14 mx-auto mb-2 object-contain" />}
                  <p className="text-sm font-bold text-slate-800 mb-2">{awayTeam?.short_name || '?'}</p>
                  <input
                    type="number"
                    min="0"
                    value={scoreAway}
                    onChange={e => setScoreAway(e.target.value)}
                    className="w-20 h-16 text-center text-3xl font-black rounded-xl border-2 border-slate-300 focus:border-emerald-500 outline-none"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  onClick={() => setStep('input')}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
                <button
                  onClick={handleApplyScore}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Placar
                </button>
              </div>
            </div>
          )}

          {/* ═══════ STEP 3: PREVIEW ═══════ */}
          {step === 'preview' && preview && (
            <div className="space-y-4">
              {/* Format badge */}
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  detectedFormat === 'sumula' ? 'bg-violet-100 text-violet-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {detectedFormat === 'sumula' ? 'PARSEADO DA SÚMULA' : 'JSON IMPORTADO'}
                </span>
              </div>

              {/* Warnings */}
              {(preview.warnings.length > 0 || parseWarnings.length > 0) && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {[...parseWarnings, ...preview.warnings].map((w, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-[11px] text-amber-700">{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Score */}
              <div className={`p-4 ${glassCard}`} style={glassBg}>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    {homeTeam?.logo_url && <img src={homeTeam.logo_url} className="w-10 h-10 mx-auto mb-1 object-contain" />}
                    <p className="text-xs font-bold text-slate-800">{homeTeam?.short_name || '?'}</p>
                  </div>
                  <div className="text-center px-4">
                    <p className="text-3xl font-black text-slate-900" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                      {preview.homeScore} <span className="text-slate-300 text-lg mx-1">x</span> {preview.awayScore}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Rodada {preview.roundNumber} · {preview.matchDate}</p>
                  </div>
                  <div className="text-center">
                    {awayTeam?.logo_url && <img src={awayTeam.logo_url} className="w-10 h-10 mx-auto mb-1 object-contain" />}
                    <p className="text-xs font-bold text-slate-800">{awayTeam?.short_name || '?'}</p>
                  </div>
                </div>
              </div>

              {/* Lineups */}
              <div className="grid grid-cols-2 gap-3">
                <LineupPreview title={homeTeam?.short_name || 'Mandante'} lineup={preview.homeLineup} color={homeTeam?.color || '#22c55e'} />
                <LineupPreview title={awayTeam?.short_name || 'Visitante'} lineup={preview.awayLineup} color={awayTeam?.color || '#3b82f6'} />
              </div>

              {/* Events */}
              {preview.events.length > 0 && (
                <div className={`p-4 ${glassCard}`} style={glassBg}>
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Eventos ({preview.events.length})
                  </h4>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {preview.events.map((ev, i) => (
                      <EventPreviewRow key={i} event={ev} homeTeam={homeTeam} awayTeam={awayTeam} />
                    ))}
                  </div>
                </div>
              )}

              {/* ══ SCOUT COMPARISON ══ */}
              {loadingScout && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200">
                  <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                  <span className="text-[11px] text-slate-500">Comparando com dados dos olheiros...</span>
                </div>
              )}
              {scoutComparison && scoutComparison.scoutTotal > 0 && (
                <div className={`p-4 ${glassCard}`} style={{ ...glassBg, borderColor: scoutComparison.scoutOnlyEvents.length > 0 ? '#fbbf24' : '#86efac' }}>
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    Validação dos Olheiros
                    <span className="text-[9px] font-normal text-slate-400 ml-auto">
                      {scoutComparison.scoutTotal} eventos registrados
                    </span>
                  </h4>

                  {/* Matching summary */}
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-emerald-50">
                      <p className="text-sm font-black text-emerald-600">{scoutComparison.matchingEvents.length}</p>
                      <p className="text-[9px] text-emerald-700 font-bold">Confirmados</p>
                    </div>
                    <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-amber-50">
                      <p className="text-sm font-black text-amber-600">{scoutComparison.scoutOnlyEvents.length}</p>
                      <p className="text-[9px] text-amber-700 font-bold">Só Olheiros</p>
                    </div>
                    <div className="flex-1 text-center px-2 py-1.5 rounded-lg bg-blue-50">
                      <p className="text-sm font-black text-blue-600">{scoutComparison.sumulaOnlyEvents.length}</p>
                      <p className="text-[9px] text-blue-700 font-bold">Só Súmula</p>
                    </div>
                  </div>

                  {/* Scout-only events — these need attention! */}
                  {scoutComparison.scoutOnlyEvents.length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-amber-700 mb-1.5 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Eventos dos olheiros que NÃO constam na súmula:
                      </p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {scoutComparison.scoutOnlyEvents.map((ev, i) => {
                          const typeLabel: Record<string, string> = {
                            goal: '⚽ Gol', yellow_card: '🟨 Amarelo', red_card: '🟥 Vermelho',
                            substitution: '🔄 Substituição', penalty_scored: '⚽ Pênalti', own_goal: '⚽ Gol contra',
                            penalty_missed: '❌ Pênalti errado',
                          };
                          return (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                              <span className="text-[10px] shrink-0">{typeLabel[ev.type] || ev.type}</span>
                              <span className="text-[11px] font-semibold text-amber-800 flex-1 min-w-0 truncate">{ev.playerName}</span>
                              <span className="text-[10px] text-amber-600 shrink-0">{ev.teamSide === 'home' ? homeTeam?.short_name : awayTeam?.short_name}</span>
                              <span className="text-[10px] font-bold text-amber-600 shrink-0">{ev.half} {ev.minute}'</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[9px] text-amber-600 mt-1.5 italic">
                        Estes eventos serão perdidos ao importar a súmula. Revise se são válidos.
                      </p>
                    </div>
                  )}

                  {/* Sumula-only events */}
                  {scoutComparison.sumulaOnlyEvents.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-blue-700 mb-1.5 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        Eventos na súmula que os olheiros NÃO registraram:
                      </p>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {scoutComparison.sumulaOnlyEvents.map((ev, i) => {
                          const typeLabel: Record<string, string> = {
                            goal: '⚽ Gol', yellow_card: '🟨 Amarelo', red_card: '🟥 Vermelho',
                            substitution: '🔄 Substituição',
                          };
                          return (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200">
                              <span className="text-[10px] shrink-0">{typeLabel[ev.type] || ev.type}</span>
                              <span className="text-[11px] font-semibold text-blue-800 flex-1 min-w-0 truncate">{ev.playerName}</span>
                              <span className="text-[10px] text-blue-600 shrink-0">{ev.teamSide === 'home' ? homeTeam?.short_name : awayTeam?.short_name}</span>
                              <span className="text-[10px] font-bold text-blue-600 shrink-0">{ev.half} {ev.minute}'</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* All matched */}
                  {scoutComparison.scoutOnlyEvents.length === 0 && scoutComparison.sumulaOnlyEvents.length === 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                      <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-[11px] text-emerald-800 font-bold">
                        Todos os eventos dos olheiros conferem com a súmula!
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Suspensions */}
              {preview.suspensions.length > 0 && (
                <div className={`p-4 ${glassCard}`} style={glassBg}>
                  <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    Suspensões ({preview.suspensions.length})
                  </h4>
                  <div className="space-y-1.5">
                    {preview.suspensions.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100">
                        <Shield className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-bold text-slate-800">{s.player_name}</span>
                          <span className="text-[10px] text-slate-500 ml-1.5">
                            {s.reason === 'dois_amarelos' ? '2 amarelos' : s.reason === 'vermelho_direto' ? 'Vermelho direto' : s.reason}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-red-600 shrink-0">{s.games_suspended} jogo(s)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {preview.notes && (
                <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <p className="text-[10px] text-slate-500 font-bold mb-0.5">Observações:</p>
                  <p className="text-[11px] text-slate-600">{preview.notes}</p>
                </div>
              )}

              {/* Summary */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                <CircleCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <p className="text-[11px] text-emerald-800">
                  <strong>{preview.homeLineup.starters.length + preview.awayLineup.starters.length}</strong> titulares ·{' '}
                  <strong>{preview.homeLineup.bench.length + preview.awayLineup.bench.length}</strong> reservas ·{' '}
                  <strong>{preview.events.length}</strong> eventos ·{' '}
                  <strong>{preview.suspensions.length}</strong> suspensões
                  {preview.newPlayersCount > 0 && (
                    <span className="text-amber-600"> · {preview.newPlayersCount} jogador(es) novo(s)</span>
                  )}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => { setStep('input'); setPreview(null); }}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar
                </button>
                <div className="flex gap-2">
                  <button onClick={onClose} className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700">
                    Cancelar
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Confirmar e Publicar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ STEP 4: PROCESSING ═══════ */}
          {step === 'processing' && (
            <div className="space-y-4 py-8">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-emerald-500 animate-spin mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-800">Processando importação...</p>
                <p className="text-xs text-slate-400 mt-1">Não feche esta janela</p>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {processLog.map((log, i) => (
                  <p key={i} className="text-[11px] text-slate-600 font-mono px-3 py-1 rounded bg-slate-50">{log}</p>
                ))}
              </div>
            </div>
          )}

          {/* ═══════ STEP 5: DONE ═══════ */}
          {step === 'done' && result && (
            <div className="space-y-4 py-6">
              <div className="text-center">
                {result.errors.length === 0 ? (
                  <>
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Importação Concluída!</p>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                      <AlertTriangle className="w-7 h-7 text-amber-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">Importação com Avisos</p>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 rounded-xl bg-emerald-50">
                  <p className="text-xl font-black text-emerald-600">{result.eventsCreated}</p>
                  <p className="text-[10px] text-slate-500 font-bold">EVENTOS</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-blue-50">
                  <p className="text-xl font-black text-blue-600">{result.lineupsCreated}</p>
                  <p className="text-[10px] text-slate-500 font-bold">ESCALAÇÕES</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-purple-50">
                  <p className="text-xl font-black text-purple-600">{result.playersCreated}</p>
                  <p className="text-[10px] text-slate-500 font-bold">NOVOS JOGADORES</p>
                </div>
              </div>

              {/* Event breakdown */}
              {result.eventBreakdown && Object.keys(result.eventBreakdown).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500">Detalhamento:</span>
                  {Object.entries(result.eventBreakdown).map(([type, count]) => {
                    const labels: Record<string, { icon: string; label: string; color: string }> = {
                      goal: { icon: '⚽', label: 'Gols', color: 'bg-emerald-100 text-emerald-700' },
                      own_goal: { icon: '⚽', label: 'G. Contra', color: 'bg-orange-100 text-orange-700' },
                      penalty_scored: { icon: '⚽', label: 'Pênaltis', color: 'bg-emerald-100 text-emerald-700' },
                      yellow_card: { icon: '🟨', label: 'Amarelos', color: 'bg-amber-100 text-amber-700' },
                      red_card: { icon: '🟥', label: 'Vermelhos', color: 'bg-red-100 text-red-700' },
                      substitution: { icon: '🔄', label: 'Substituições', color: 'bg-blue-100 text-blue-700' },
                    };
                    const cfg = labels[type] || { icon: '?', label: type, color: 'bg-slate-100 text-slate-600' };
                    return (
                      <span key={type} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${cfg.color}`}>
                        {cfg.icon} {count} {cfg.label}
                      </span>
                    );
                  })}
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {result.errors.map((e, i) => (
                    <div key={i} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                      <AlertCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                      <span className="text-[10px] text-red-700">{e}</span>
                    </div>
                  ))}
                </div>
              )}

              <details className="text-[10px]">
                <summary className="text-slate-400 cursor-pointer hover:text-slate-600">Ver log completo</summary>
                <div className="mt-2 space-y-0.5 max-h-32 overflow-y-auto">
                  {processLog.map((log, i) => (
                    <p key={i} className="text-slate-500 font-mono px-2 py-0.5 rounded bg-slate-50">{log}</p>
                  ))}
                </div>
              </details>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => { onComplete(); onClose(); }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Fechar e Atualizar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SUB-COMPONENTS ──────────────────────────────────────

function LineupPreview({ title, lineup, color }: {
  title: string;
  lineup: { starters: PlayerMatch[]; bench: PlayerMatch[]; coach: string };
  color: string;
}) {
  return (
    <div className={`p-3 ${glassCard}`} style={glassBg}>
      <h4 className="text-xs font-bold text-slate-800 mb-2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: color }} />
        {title}
      </h4>
      {lineup.coach && (
        <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded bg-slate-50">
          <User className="w-3 h-3 text-slate-400" />
          <span className="text-[10px] text-slate-600">Técnico: <strong>{lineup.coach}</strong></span>
        </div>
      )}
      <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 px-1">Titulares ({lineup.starters.length})</p>
      <div className="space-y-0.5 mb-2">
        {lineup.starters.map((p, i) => <PlayerMatchRow key={i} pm={p} />)}
      </div>
      {lineup.bench.length > 0 && (
        <>
          <p className="text-[9px] text-slate-400 font-bold uppercase mb-1 px-1">Reservas ({lineup.bench.length})</p>
          <div className="space-y-0.5">
            {lineup.bench.map((p, i) => <PlayerMatchRow key={i} pm={p} />)}
          </div>
        </>
      )}
    </div>
  );
}

function PlayerMatchRow({ pm }: { pm: PlayerMatch }) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] ${
      pm.isNew
        ? 'bg-amber-50 border border-amber-200'
        : pm.confidence >= 0.8
          ? 'bg-white'
          : 'bg-yellow-50 border border-yellow-100'
    }`}>
      <span className="w-5 text-center text-[10px] font-bold text-slate-400 shrink-0">{pm.importNumber || '—'}</span>
      <span className={`flex-1 min-w-0 truncate ${pm.isNew ? 'text-amber-700 font-bold' : 'text-slate-700'}`}>
        {pm.importName}
      </span>
      {pm.player && !pm.isNew && pm.player.name !== pm.importName && (
        <span className="text-[8px] text-slate-400 truncate max-w-[60px]" title={pm.player.name}>
          → {pm.player.name}
        </span>
      )}
      {pm.isNew ? (
        <span className="text-[8px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold shrink-0">NOVO</span>
      ) : pm.confidence < 0.8 ? (
        <span className="text-[8px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded font-bold shrink-0" title={`Match: ${pm.player?.name}`}>
          ~{Math.round(pm.confidence * 100)}%
        </span>
      ) : (
        <CircleCheck className="w-3 h-3 text-emerald-500 shrink-0" />
      )}
    </div>
  );
}

function EventPreviewRow({ event, homeTeam, awayTeam }: {
  event: any;
  homeTeam?: SQLTeam;
  awayTeam?: SQLTeam;
}) {
  const team = event.team === 'home' ? homeTeam : awayTeam;
  const halfLabel = event.half === 2 ? '2T' : event.half === 3 ? 'PRO' : '1T';
  const minuteStr = event.minute != null ? `${event.minute}'` : '—';
  const typeConfig: Record<string, { icon: string; color: string; bg: string }> = {
    goal: { icon: '⚽', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
    yellow_card: { icon: '🟨', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
    red_card: { icon: '🟥', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
    substitution: { icon: '🔄', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  };
  const cfg = typeConfig[event.type] || typeConfig.goal;
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${cfg.bg}`}>
      <span className="text-xs shrink-0">{cfg.icon}</span>
      <div className="flex-1 min-w-0">
        {event.type === 'substitution' ? (
          <span className={`text-[11px] ${cfg.color}`}>
            <span className="text-red-600">↓ {event.player_out_name || '?'}</span>
            {' '}
            <span className="text-emerald-600">↑ {event.player_in_name || '?'}</span>
          </span>
        ) : (
          <span className={`text-[11px] font-semibold ${cfg.color}`}>
            {event.player_name || '?'}
            {event.detail && event.detail !== 'normal' && event.detail !== 'direto' && (
              <span className="text-[9px] font-normal ml-1 opacity-70">({event.detail})</span>
            )}
          </span>
        )}
      </div>
      <span className="text-[10px] text-slate-500 shrink-0">{team?.short_name}</span>
      <span className="text-[10px] font-bold text-slate-600 shrink-0 min-w-[32px] text-right">{halfLabel} {minuteStr}</span>
    </div>
  );
}

export default MatchJsonImporter;