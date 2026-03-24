// ============================================================
// COMPETITION RULES PANEL — Admin form for all competition rules
// Organized in collapsible sections (accordion style)
// ============================================================
import { useState, useEffect } from 'react';
import {
  Shield, Swords, Clock, Users, Trophy, DollarSign, FileText,
  Save, RefreshCw, ChevronDown, Check, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { fetchRules, saveRules, type CompetitionRules } from '../lib/discipline-api';

const glassCard = 'rounded-2xl';
const glassBg = { background: '#ffffff', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' };
const glassInput = 'w-full text-xs rounded-lg bg-white border border-slate-200 text-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/30 placeholder-slate-400';

interface Props {
  competitionId: string;
}

interface Section {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  fields: FieldDef[];
}

interface FieldDef {
  key: string;
  label: string;
  type: 'number' | 'boolean' | 'text' | 'textarea' | 'select' | 'money';
  placeholder?: string;
  options?: { value: string; label: string }[];
  suffix?: string;
  min?: number;
  max?: number;
  help?: string;
}

const SECTIONS: Section[] = [
  {
    id: 'discipline',
    title: 'Disciplinar',
    icon: Shield,
    color: '#ef4444',
    fields: [
      { key: 'yellows_for_suspension', label: 'Amarelos para suspensão', type: 'number', min: 1, max: 10, help: 'Quantos cartões amarelos acumulados geram suspensão automática' },
      { key: 'suspension_games', label: 'Jogos de suspensão por acúmulo', type: 'number', min: 1, max: 10 },
      { key: 'double_penalty_on_repeat', label: 'Dobrar pena na reincidência', type: 'boolean', help: '2ª suspensão = dobro de jogos' },
      { key: 'reset_yellows_phase_2', label: 'Zerar amarelos na 2ª fase', type: 'boolean', help: 'Reset do acumulador quando entrar nos playoffs' },
      { key: 'red_direct_suspension_games', label: 'Jogos por vermelho direto', type: 'number', min: 1, max: 30 },
      { key: 'red_card_fine', label: 'Multa por vermelho (R$)', type: 'money', min: 0 },
      { key: 'group_phase_max_round', label: 'Última rodada classificatória (Art. 52)', type: 'number', min: 1, max: 20, help: 'Rodadas 1 até N = fase classificatória para contagem de elegibilidade' },
      { key: 'min_games_for_knockout', label: 'Mín. jogos p/ semi/final (Art. 52)', type: 'number', min: 1, max: 10, help: 'Jogador deve ter assinado súmula em pelo menos N jogos da classificatória' },
      { key: 'max_team_discipline_points', label: 'Pontos disciplinares p/ exclusão (Art. 72)', type: 'number', min: 100, max: 10000, help: 'Equipe excluída ao atingir este total de pontos disciplinares' },
    ],
  },
  {
    id: 'format',
    title: 'Formato da Competição',
    icon: Swords,
    color: '#3b82f6',
    fields: [
      {
        key: 'competition_format', label: 'Tipo de competição', type: 'select',
        options: [
          { value: 'league', label: 'Pontos corridos' },
          { value: 'groups_knockout', label: 'Grupos + mata-mata' },
          { value: 'knockout', label: 'Só mata-mata' },
        ],
      },
      { key: 'phases_count', label: 'Número de fases', type: 'number', min: 1, max: 5 },
      { key: 'knockout_home_away', label: 'Ida e volta no mata-mata', type: 'boolean' },
      { key: 'teams_advancing_per_group', label: 'Classificados por grupo', type: 'number', min: 1, max: 16 },
      { key: 'relegation_spots', label: 'Vagas de rebaixamento', type: 'number', min: 0, max: 8 },
    ],
  },
  {
    id: 'match',
    title: 'Partida',
    icon: Clock,
    color: '#10b981',
    fields: [
      { key: 'half_duration_minutes', label: 'Duração de cada tempo (min)', type: 'number', min: 5, max: 45 },
      { key: 'extra_time_enabled', label: 'Prorrogação prevista', type: 'boolean' },
      { key: 'extra_time_duration', label: 'Duração da prorrogação (min/tempo)', type: 'number', min: 1, max: 15 },
      { key: 'penalties_after_extra', label: 'Pênaltis após prorrogação', type: 'boolean' },
      { key: 'max_substitutions', label: 'Máximo de substituições', type: 'number', min: 0, max: 12 },
      { key: 'min_players_no_wo', label: 'Mínimo de jogadores (sem WO)', type: 'number', min: 3, max: 11 },
      { key: 'wo_tolerance_minutes', label: 'Tolerância de atraso (min)', type: 'number', min: 0, max: 60 },
      { key: 'wo_result', label: 'Resultado de WO', type: 'text', placeholder: '3x0' },
    ],
  },
  {
    id: 'registration',
    title: 'Inscrições',
    icon: Users,
    color: '#8b5cf6',
    fields: [
      { key: 'max_squad_size', label: 'Limite de jogadores por elenco', type: 'number', min: 1, max: 50 },
      { key: 'max_reinforcements_per_round', label: 'Limite de reforços por rodada', type: 'number', min: 0, max: 10, help: '0 = sem limite' },
      { key: 'transfer_deadline', label: 'Prazo de transferência', type: 'text', placeholder: 'Ex: Até a 5ª rodada' },
      { key: 'age_restriction', label: 'Restrição de idade', type: 'text', placeholder: 'Ex: Mínimo 16 anos, Máximo 40 anos' },
    ],
  },
  {
    id: 'points',
    title: 'Pontuação',
    icon: Trophy,
    color: '#f59e0b',
    fields: [
      { key: 'points_win', label: 'Pontos por vitória', type: 'number', min: 0, max: 10 },
      { key: 'points_draw', label: 'Pontos por empate', type: 'number', min: 0, max: 10 },
      { key: 'points_loss', label: 'Pontos por derrota', type: 'number', min: 0, max: 10 },
      { key: 'points_wo_penalty', label: 'Pontos descontados por WO', type: 'number', min: 0, max: 10, help: '0 = sem desconto' },
    ],
  },
  {
    id: 'financial',
    title: 'Financeiro',
    icon: DollarSign,
    color: '#22c55e',
    fields: [
      { key: 'team_registration_fee', label: 'Taxa de inscrição por time (R$)', type: 'money', min: 0 },
      { key: 'wo_fine', label: 'Multa por WO (R$)', type: 'money', min: 0 },
      { key: 'prize_description', label: 'Premiação', type: 'textarea', placeholder: 'Ex: 1º lugar: R$ 5.000 + troféu\n2º lugar: R$ 2.000\n3º lugar: R$ 1.000' },
    ],
  },
  {
    id: 'regulation',
    title: 'Regulamento',
    icon: FileText,
    color: '#6366f1',
    fields: [
      { key: 'regulation_text', label: 'Texto do regulamento', type: 'textarea', placeholder: 'Cole aqui o regulamento completo...' },
      { key: 'regulation_notes', label: 'Observações e exceções', type: 'textarea', placeholder: 'Exceções específicas deste campeonato...' },
    ],
  },
];

export function CompetitionRulesPanel({ competitionId }: Props) {
  const [rules, setRules] = useState<CompetitionRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['discipline']));
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await fetchRules(competitionId);
      setRules(data);
      setDirty(false);
    } catch (err: any) {
      toast.error('Erro ao carregar regras: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [competitionId]);

  const handleSave = async () => {
    if (!rules) return;
    setSaving(true);
    try {
      const saved = await saveRules(competitionId, rules);
      setRules(saved);
      setDirty(false);
      setLastSaved(new Date().toLocaleTimeString('pt-BR'));
      toast.success('Regras salvas com sucesso');
    } catch (err: any) {
      toast.error('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const updateField = (key: string, value: any) => {
    if (!rules) return;
    setRules(prev => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  };

  if (loading) {
    return (
      <div className={`p-6 ${glassCard}`} style={glassBg}>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
          <span className="text-sm text-slate-500">Carregando regras...</span>
        </div>
      </div>
    );
  }

  if (!rules) {
    return (
      <div className={`p-6 ${glassCard}`} style={glassBg}>
        <div className="flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-600">Erro ao carregar regras</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className={`p-4 ${glassCard}`} style={{ ...glassBg, background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', borderColor: '#3b82f630' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-bold text-blue-800" style={{ fontFamily: 'Plus Jakarta Sans' }}>
              Regras do Campeonato
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lastSaved && (
              <span className="text-[9px] text-blue-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Salvo às {lastSaved}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !dirty}
              className={`flex items-center gap-1 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                dirty
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {saving ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {saving ? 'Salvando...' : 'Salvar Regras'}
            </button>
          </div>
        </div>
        {dirty && (
          <div className="mt-2 text-[10px] text-blue-500 font-semibold flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Alterações não salvas
          </div>
        )}
      </div>

      {/* Accordion sections */}
      {SECTIONS.map(section => {
        const isOpen = openSections.has(section.id);
        const Icon = section.icon;

        return (
          <div key={section.id} className={`${glassCard} overflow-hidden`} style={glassBg}>
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50 transition-colors"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${section.color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color: section.color }} />
              </div>
              <span className="text-sm font-bold text-slate-700 flex-1" style={{ fontFamily: 'Plus Jakarta Sans' }}>
                {section.title}
              </span>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
                {section.fields.map(field => (
                  <RuleField
                    key={field.key}
                    field={field}
                    value={(rules as any)[field.key]}
                    onChange={(val) => updateField(field.key, val)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================
// RULE FIELD — Single form field
// ============================
function RuleField({ field, value, onChange }: {
  field: FieldDef;
  value: any;
  onChange: (val: any) => void;
}) {
  switch (field.type) {
    case 'number':
    case 'money':
      return (
        <div>
          <label className="text-[10px] text-slate-500 block mb-1 font-semibold">
            {field.label}
            {field.help && <span className="text-slate-400 font-normal ml-1">— {field.help}</span>}
          </label>
          <div className="flex items-center gap-2">
            {field.type === 'money' && <span className="text-xs text-slate-400">R$</span>}
            <input
              type="number"
              min={field.min}
              max={field.max}
              className={`${glassInput} w-32`}
              value={value ?? ''}
              onChange={e => onChange(field.type === 'money' ? parseFloat(e.target.value) || 0 : parseInt(e.target.value) || 0)}
            />
            {field.suffix && <span className="text-xs text-slate-400">{field.suffix}</span>}
          </div>
        </div>
      );

    case 'boolean':
      return (
        <div className="flex items-center justify-between py-1">
          <div>
            <label className="text-[10px] text-slate-600 font-semibold">{field.label}</label>
            {field.help && <p className="text-[9px] text-slate-400">{field.help}</p>}
          </div>
          <button
            onClick={() => onChange(!value)}
            className={`relative w-10 h-5 rounded-full transition-colors ${value ? 'bg-emerald-500' : 'bg-slate-200'}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${value ? 'left-5' : 'left-0.5'}`}
            />
          </button>
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="text-[10px] text-slate-500 block mb-1 font-semibold">{field.label}</label>
          <select
            className={glassInput}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
          >
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="text-[10px] text-slate-500 block mb-1 font-semibold">{field.label}</label>
          <textarea
            className={`${glassInput} min-h-[80px] resize-y`}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      );

    case 'text':
    default:
      return (
        <div>
          <label className="text-[10px] text-slate-500 block mb-1 font-semibold">
            {field.label}
            {field.help && <span className="text-slate-400 font-normal ml-1">— {field.help}</span>}
          </label>
          <input
            className={glassInput}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      );
  }
}