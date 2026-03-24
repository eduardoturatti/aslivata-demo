// ============================================================
// SCOUT TOKENS PANEL — Admin panel for managing scout tokens
// Generates, lists, copies and manages access tokens for scouts
// ============================================================
import { useState, useEffect, useCallback } from 'react';
import {
  generateTokens, listTokens, deactivateToken, batchGenerateTokens,
  getAdminEvents, getReport, publishReport, unpublishReport, resetScout,
  type AccessToken,
} from '../lib/scout-api';
import {
  Loader2, Copy, Trash2, RefreshCw, Plus, CheckCircle, AlertTriangle,
  ExternalLink, Eye, Radio, ChevronDown, ChevronUp, Zap, FileText,
  Send, Users, Shield, Clock, RotateCcw, Undo2,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Props {
  matchId: string;
  matchInfo?: {
    home_team?: { id: string; short_name: string; name: string; logo_url?: string };
    away_team?: { id: string; short_name: string; name: string; logo_url?: string };
    round?: number;
    match_date?: string;
    scout_status?: string;
  };
  competitionId?: string;
}

const SCOUT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  idle: { label: 'Aguardando', color: 'bg-gray-500' },
  pre_game: { label: 'Pré-jogo', color: 'bg-blue-500' },
  live_half1: { label: '1º Tempo', color: 'bg-red-500' },
  halftime: { label: 'Intervalo', color: 'bg-amber-500' },
  live_half2: { label: '2º Tempo', color: 'bg-red-500' },
  ended: { label: 'Encerrado', color: 'bg-gray-600' },
  published: { label: 'Publicado', color: 'bg-green-600' },
};

export function ScoutTokensPanel({ matchId, matchInfo, competitionId }: Props) {
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listTokens(matchId);
      setTokens(res.tokens || []);
    } catch (e: any) {
      console.error('[ScoutTokens] Load error:', e);
    }
    setLoading(false);
  }, [matchId]);

  useEffect(() => { loadTokens(); }, [loadTokens]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await generateTokens(matchId);
      if (res.tokens) {
        toast.success(`Token gerado com sucesso`);
        loadTokens();
      } else {
        toast.error(res.error || 'Erro ao gerar token');
      }
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
    setGenerating(false);
  };

  const handleAddToken = async () => {
    setGenerating(true);
    try {
      const nextNum = tokens.length + 1;
      const res = await generateTokens(matchId, [{ label: `Olheiro ${nextNum}` }]);
      if (res.tokens) {
        toast.success(`Token adicional gerado: Olheiro ${nextNum}`);
        loadTokens();
      } else {
        toast.error(res.error || 'Erro ao gerar token');
      }
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
    setGenerating(false);
  };

  const handleDeactivate = async (tokenId: string) => {
    if (!confirm('Desativar este token?')) return;
    try {
      await deactivateToken(tokenId);
      toast.success('Token desativado');
      loadTokens();
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
  };

  const handleCopyLink = (token: string, label?: string) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/live/${token}`;
    navigator.clipboard.writeText(link);
    toast.success(`Link copiado: ${label || token}`);
  };

  const handleCopyWhatsApp = (token: AccessToken) => {
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/live/${token.token}`;
    const teamName = token.team?.short_name || token.label || 'Olheiro';
    const matchLabel = matchInfo
      ? `${matchInfo.home_team?.short_name || '?'} × ${matchInfo.away_team?.short_name || '?'}`
      : 'Partida';
    const expiry = token.expires_at
      ? new Date(token.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
      : '';

    const msg = `⚽ OLHEIRO ${teamName.toUpperCase()} — ${matchLabel}

Seu link para lançamento ao vivo:
${link}

⏰ Válido até ${expiry}
📱 Abra no celular e siga as instruções`;

    navigator.clipboard.writeText(msg);
    toast.success('Mensagem WhatsApp copiada');
  };

  const handleLoadReport = async () => {
    setReportLoading(true);
    try {
      const res = await getReport(matchId);
      setReport(res);
      setShowReport(true);
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
    setReportLoading(false);
  };

  const handlePublish = async () => {
    if (!confirm('Publicar dados desta partida? Os eventos verificados serão transferidos para o banco oficial.')) return;
    setPublishing(true);
    try {
      const res = await publishReport(matchId);
      if (res.success) {
        toast.success(`Publicado: ${res.score?.home}×${res.score?.away} · ${res.events_published} eventos`);
        loadTokens();
        setShowReport(false);
      } else {
        toast.error(res.error || 'Erro ao publicar');
      }
    } catch (e: any) {
      toast.error('Erro: ' + e.message);
    }
    setPublishing(false);
  };

  const scoutStatus = matchInfo?.scout_status || 'idle';
  const statusInfo = SCOUT_STATUS_LABELS[scoutStatus] || SCOUT_STATUS_LABELS.idle;
  const activeTokens = tokens.filter(t => t.is_active);
  const isLive = ['live_half1', 'live_half2'].includes(scoutStatus);
  const canPublish = ['ended', 'live_half1', 'live_half2', 'halftime'].includes(scoutStatus);

  // Auto-load report when match ended (single scout shortcut)
  useEffect(() => {
    if (scoutStatus === 'ended' && !report && !reportLoading && !showReport && tokens.length > 0) {
      handleLoadReport();
    }
  }, [scoutStatus, tokens.length]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Team logos & match info */}
          {matchInfo?.home_team || matchInfo?.away_team ? (
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                {matchInfo.home_team?.logo_url ? (
                  <img src={matchInfo.home_team.logo_url} className="w-7 h-7 object-contain rounded-full bg-white border border-slate-200" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">
                    {matchInfo.home_team?.short_name?.charAt(0) || '?'}
                  </div>
                )}
                <span className="text-[10px] font-bold text-slate-400">×</span>
                {matchInfo.away_team?.logo_url ? (
                  <img src={matchInfo.away_team.logo_url} className="w-7 h-7 object-contain rounded-full bg-white border border-slate-200" alt="" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-500">
                    {matchInfo.away_team?.short_name?.charAt(0) || '?'}
                  </div>
                )}
              </div>
              <div className="text-left min-w-0">
                <span className="text-sm font-bold text-slate-800 block truncate" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  {matchInfo.home_team?.short_name || '???'} × {matchInfo.away_team?.short_name || '???'}
                </span>
                <div className="flex items-center gap-1.5">
                  {matchInfo.round && (
                    <span className="text-[10px] text-slate-500">
                      Rodada {matchInfo.round}
                    </span>
                  )}
                  {matchInfo.match_date && (
                    <span className="text-[10px] text-slate-400">
                      · {new Date(matchInfo.match_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    · {activeTokens.length} token(s)
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                <Radio className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-slate-800 block" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                  Olheiros ao Vivo
                </span>
                <span className="text-[10px] text-slate-500">
                  {activeTokens.length} token(s) ativos
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${statusInfo.color}`}>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            {statusInfo.label}
          </span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-4 py-3 space-y-3">
          {/* Tokens list */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-4">
              <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Nenhum token gerado</p>
              <p className="text-xs text-slate-400">Gere tokens para os olheiros desta partida</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tokens.map(token => (
                <div
                  key={token.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    token.is_active ? 'border-slate-200 bg-slate-50' : 'border-red-100 bg-red-50/50 opacity-60'
                  }`}
                >
                  {/* Scout info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                        <Users className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-xs font-bold text-slate-700 truncate">
                        {token.label || 'Olheiro'}
                      </span>
                      {!token.is_active && (
                        <span className="text-[9px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">INATIVO</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-[10px] font-mono bg-white px-1.5 py-0.5 rounded text-slate-600 border border-slate-200">
                        {token.token}
                      </code>
                      {token.last_used_at && (
                        <span className="text-[9px] text-green-600 flex items-center gap-0.5">
                          <span className="w-1 h-1 rounded-full bg-green-500" />
                          Usado {new Date(token.last_used_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {token.is_active && (
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleCopyLink(token.token, token.label)}
                        className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
                        title="Copiar link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyWhatsApp(token)}
                        className="w-7 h-7 rounded-lg bg-green-50 text-green-600 flex items-center justify-center hover:bg-green-100 transition-colors"
                        title="Copiar mensagem WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          const url = `${window.location.origin}/live/${token.token}`;
                          window.open(url, '_blank');
                        }}
                        className="w-7 h-7 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-colors"
                        title="Abrir"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeactivate(token.id)}
                        className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-colors"
                        title="Desativar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {activeTokens.length === 0 ? (
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Gerar Token
              </button>
            ) : (
              <button
                onClick={handleAddToken}
                disabled={generating}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 border border-emerald-200 disabled:opacity-50 transition-colors"
              >
                {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                +1 Olheiro
              </button>
            )}

            <button
              onClick={loadTokens}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Atualizar
            </button>

            {(scoutStatus === 'ended' || scoutStatus === 'live_half1' || scoutStatus === 'live_half2' || scoutStatus === 'halftime') && (
              <button
                onClick={handleLoadReport}
                disabled={reportLoading}
                className="flex items-center gap-1 px-3 py-2 rounded-xl bg-amber-100 text-amber-700 text-xs font-bold hover:bg-amber-200 disabled:opacity-50 transition-colors"
              >
                {reportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                Relatório
              </button>
            )}
          </div>

          {/* Report panel */}
          {showReport && report && (
            <div className="border-t border-slate-200 pt-3 space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase">
                Relatório de Eventos
              </h4>

              {/* Score */}
              <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                <div className="text-center flex-1">
                  <p className="text-[10px] text-slate-500 uppercase">Placar</p>
                  <p className="text-lg font-bold font-mono text-slate-800">{report.score?.home ?? 0} × {report.score?.away ?? 0}</p>
                </div>
                <div className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">
                  ✓ {report.confirmed?.length || 0} eventos
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-slate-500 uppercase">Total</p>
                  <p className="text-lg font-bold font-mono text-slate-800">{report.total_events || 0}</p>
                </div>
              </div>

              {/* Publish button */}
              {canPublish && (
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 transition-colors"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  PUBLICAR DADOS OFICIAIS
                </button>
              )}
            </div>
          )}

          {/* Reset scout button */}
          {scoutStatus !== 'idle' && scoutStatus !== 'published' && (
            <div className="border-t border-slate-200 pt-3">
              <button
                onClick={async () => {
                  if (!confirm('Resetar scouting? Isso desativa todos os tokens e volta o status para "Aguardando". Os eventos NÃO são apagados.')) return;
                  try {
                    const res = await resetScout(matchId);
                    if (res.success) {
                      toast.success('Scouting resetado');
                      loadTokens();
                      setReport(null);
                      setShowReport(false);
                    } else {
                      toast.error(res.error || 'Erro ao resetar');
                    }
                  } catch (e: any) {
                    toast.error('Erro: ' + e.message);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resetar Scouting
              </button>
            </div>
          )}

          {/* Unpublish button — only shows when published */}
          {scoutStatus === 'published' && (
            <div className="border-t border-slate-200 pt-3 space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-xs text-green-700 font-bold mb-1">✓ Partida publicada</p>
                <p className="text-[10px] text-green-600">
                  Os dados oficiais foram transferidos. Despublique para reverter e continuar editando.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (!confirm('Despublicar esta partida? Os eventos oficiais serão removidos e o status voltará para revisão. Os dados do scout (live_events) NÃO são apagados.')) return;
                  try {
                    const res = await unpublishReport(matchId);
                    if (res.success) {
                      toast.success(`Despublicado! ${res.events_removed} eventos oficiais removidos. Status: ${res.reverted_to}`);
                      loadTokens();
                      setReport(null);
                      setShowReport(false);
                    } else {
                      toast.error(res.error || 'Erro ao despublicar');
                    }
                  } catch (e: any) {
                    toast.error('Erro: ' + e.message);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 transition-colors"
              >
                <Undo2 className="w-3.5 h-3.5" />
                Despublicar Partida
              </button>
              <button
                onClick={async () => {
                  if (!confirm('Resetar scouting COMPLETO? Isso desativa todos os tokens e volta o status para "Aguardando". Os eventos NÃO são apagados.')) return;
                  try {
                    // First unpublish, then reset
                    await unpublishReport(matchId);
                    const res = await resetScout(matchId);
                    if (res.success) {
                      toast.success('Despublicado e resetado');
                      loadTokens();
                      setReport(null);
                      setShowReport(false);
                    } else {
                      toast.error(res.error || 'Erro ao resetar');
                    }
                  } catch (e: any) {
                    toast.error('Erro: ' + e.message);
                  }
                }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resetar Scouting Completo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}