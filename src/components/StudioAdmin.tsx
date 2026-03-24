import { useState, useCallback, useRef, useEffect } from 'react';
import { Save, Plus, Trash2, Settings, AlertCircle, GripVertical, Upload, FileText, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface Match {
  city: string;
  datetime: string;
  home: string;
  away: string;
  scoreHome: number | null;
  scoreAway: number | null;
}

interface Round {
  name: string;
  matches: Match[];
}

interface Team {
  name: string;
  short: string;
  logo: string;
}

interface StandingEntry {
  pos: number;
  teamId: string;
  tpg: number; // Total pontos ganhos
  j: number;   // Jogos
  v: number;   // Vitórias
  e: number;   // Empates
  d: number;   // Derrotas
  gp: number;  // Gols pró
  gc: number;  // Gols contra
  sg: number;  // Saldo de gols
  ca: number;  // Cartões amarelos
  cv: number;  // Cartões vermelhos
  disc: number; // Disciplina
  pct: number; // Percentual
}

interface TournamentData {
  teams: Record<string, Team>;
  rounds: Round[];
  standings: StandingEntry[];
}

interface StudioAdminProps {
  data: TournamentData;
  onDataUpdate: (newData: TournamentData) => void;
  fontScale?: number;
}

// Estrutura para dados importados
interface ParsedStandingEntry {
  pos: string;
  teamName: string;
  tpg: string;
  j: string;
  v: string;
  e: string;
  d: string;
  gp: string;
  gc: string;
  sg: string;
  ca: string;
  cv: string;
  disc: string;
  pct: string;
  teamId?: string; // ID mapeado
  matchConfidence?: number; // Confiança do mapeamento
}

// Componente de item da classificação com drag and drop
interface DraggableStandingItemProps {
  entry: StandingEntry;
  index: number;
  team: Team;
  onUpdate: (index: number, field: keyof StandingEntry, value: string) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  onRecalculateGoalDifference: (index: number) => void;
}

function DraggableStandingItem({ 
  entry, 
  index, 
  team, 
  onUpdate, 
  onMove, 
  onRecalculateGoalDifference 
}: DraggableStandingItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: 'standingItem',
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: { index: number }, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      // Determine rectangle on screen
      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      // Get vertical middle
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      // Determine mouse position
      const clientOffset = monitor.getClientOffset();

      // Get pixels to the top
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      // Only perform the move when the mouse has crossed half of the items height
      // When dragging downwards, only move when the cursor is below 50%
      // When dragging upwards, only move when the cursor is above 50%

      // Dragging downwards
      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      // Dragging upwards
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      // Time to actually perform the action
      onMove(dragIndex, hoverIndex);

      // Note: we're mutating the monitor item here!
      // Generally it's better to avoid mutations,
      // but it's good here for the sake of performance
      // to avoid expensive index searches.
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'standingItem',
    item: () => {
      return { index };
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const opacity = isDragging ? 0.4 : 1;
  drag(drop(ref));

  return (
    <div 
      ref={ref} 
      style={{ opacity }}
      data-handler-id={handlerId}
      className="grid grid-cols-12 gap-2 items-center p-3 border border-slate-200 rounded-lg bg-slate-50 text-sm hover:bg-slate-100 transition-colors cursor-move"
    >
      {/* Handle + Posição + Time */}
      <div className="col-span-3 flex items-center gap-2">
        <div className="cursor-grab active:cursor-grabbing">
          <GripVertical className="w-3 h-3 text-slate-400" />
        </div>
        <Input
          type="number"
          min="1"
          value={entry.pos}
          onChange={(e) => onUpdate(index, 'pos', e.target.value)}
          className="w-10 text-center p-1 h-8 text-xs"
        />
        <img 
          src={team?.logo || '/api/placeholder/20/20'} 
          alt={team?.short} 
          className="w-5 h-5 rounded-full object-contain"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/api/placeholder/20/20';
          }}
        />
        <span className="font-medium truncate text-xs">{team?.short}</span>
      </div>

      {/* Pontos */}
      <div className="col-span-1">
        <Input
          type="number"
          min="0"
          value={entry.tpg}
          onChange={(e) => onUpdate(index, 'tpg', e.target.value)}
          className="w-full text-center p-1 h-8 text-xs"
          title="Pontos"
        />
      </div>

      {/* Jogos */}
      <div className="col-span-1">
        <Input
          type="number"
          min="0"
          value={entry.j}
          onChange={(e) => onUpdate(index, 'j', e.target.value)}
          className="w-full text-center p-1 h-8 text-xs"
          title="Jogos"
        />
      </div>

      {/* V-E-D */}
      <div className="col-span-3 grid grid-cols-3 gap-1">
        <Input
          type="number"
          min="0"
          value={entry.v}
          onChange={(e) => onUpdate(index, 'v', e.target.value)}
          className="w-full text-center p-1 h-8 text-xs"
          title="Vitórias"
        />
        <Input
          type="number"
          min="0"
          value={entry.e}
          onChange={(e) => onUpdate(index, 'e', e.target.value)}
          className="w-full text-center p-1 h-8 text-xs"
          title="Empates"
        />
        <Input
          type="number"
          min="0"
          value={entry.d}
          onChange={(e) => onUpdate(index, 'd', e.target.value)}
          className="w-full text-center p-1 h-8 text-xs"
          title="Derrotas"
        />
      </div>

      {/* Gols */}
      <div className="col-span-3 grid grid-cols-3 gap-1">
        <Input
          type="number"
          min="0"
          value={entry.gp}
          onChange={(e) => {
            onUpdate(index, 'gp', e.target.value);
            setTimeout(() => onRecalculateGoalDifference(index), 100);
          }}
          className="w-full text-center p-1 h-8 text-xs"
          title="Gols Pró"
        />
        <Input
          type="number"
          min="0"
          value={entry.gc}
          onChange={(e) => {
            onUpdate(index, 'gc', e.target.value);
            setTimeout(() => onRecalculateGoalDifference(index), 100);
          }}
          className="w-full text-center p-1 h-8 text-xs"
          title="Gols Contra"
        />
        <div className={`flex items-center justify-center h-8 rounded text-xs font-bold ${
          entry.sg >= 0 ? 'text-green-700 bg-green-100' : 'text-red-700 bg-red-100'
        }`}>
          {entry.sg > 0 ? '+' : ''}{entry.sg}
        </div>
      </div>

      {/* Aproveitamento */}
      <div className="col-span-1">
        <Input
          type="number"
          min="0"
          max="100"
          value={entry.pct}
          onChange={(e) => onUpdate(index, 'pct', e.target.value)}
          className="w-full text-center p-1 h-8 text-xs"
          title="Aproveitamento %"
        />
      </div>
    </div>
  );
}

// Função para normalizar nomes dos times para comparação
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .replace(/ec/g, '')
    .replace(/fc/g, '')
    .replace(/sc/g, '')
    .replace(/ge/g, '')
    .replace(/gr/g, '')
    .replace(/ca/g, '')
    .replace(/ser/g, '')
    .replace(/sdrc/g, '')
    .replace(/ecas/g, 'ecas');
}

// Função para mapear time pelo nome
function findTeamByName(teamName: string, teams: Record<string, Team>): { teamId: string; confidence: number } | null {
  const normalizedInput = normalizeTeamName(teamName);
  
  let bestMatch = { teamId: '', confidence: 0 };
  
  Object.entries(teams).forEach(([teamId, team]) => {
    const normalizedTeamName = normalizeTeamName(team.name);
    const normalizedShortName = normalizeTeamName(team.short);
    
    // Verificar correspondência exata
    if (normalizedTeamName === normalizedInput || normalizedShortName === normalizedInput) {
      bestMatch = { teamId, confidence: 100 };
      return;
    }
    
    // Verificar se contém as palavras principais
    const inputWords = normalizedInput.split(' ').filter(w => w.length > 2);
    const teamWords = normalizedTeamName.split(' ').filter(w => w.length > 2);
    const shortWords = normalizedShortName.split(' ').filter(w => w.length > 2);
    
    let matches = 0;
    inputWords.forEach(word => {
      if (teamWords.some(tw => tw.includes(word) || word.includes(tw))) matches++;
      if (shortWords.some(sw => sw.includes(word) || word.includes(sw))) matches++;
    });
    
    const confidence = Math.min(95, (matches / Math.max(inputWords.length, 1)) * 80);
    
    if (confidence > bestMatch.confidence) {
      bestMatch = { teamId, confidence };
    }
  });
  
  return bestMatch.confidence > 50 ? bestMatch : null;
}

// Função para parsear dados da classificação
function parseStandingsData(text: string, teams: Record<string, Team>): ParsedStandingEntry[] {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const dataLines = lines.filter(line => {
    // Filtrar linhas que são dados (começam com número e têm tabs/espaços)
    return /^\d+[ºª°]?\s+/.test(line) && (line.includes('\t') || line.split(/\s+/).length >= 8);
  });

  return dataLines.map((line, index) => {
    // Separar por tabs primeiro, depois por espaços múltiplos
    let parts = line.includes('\t') 
      ? line.split('\t').map(p => p.trim()).filter(p => p.length > 0)
      : line.split(/\s{2,}/).map(p => p.trim()).filter(p => p.length > 0);
    
    // Se ainda não temos partes suficientes, tentar split por espaço simples
    if (parts.length < 10) {
      parts = line.split(/\s+/).map(p => p.trim()).filter(p => p.length > 0);
    }
    
    // Extrair dados baseado na posição esperada
    const pos = parts[0]?.replace(/[ºª°]/g, '') || String(index + 1);
    const teamName = parts[1] || 'Time Desconhecido';
    
    // Tentar mapear o time
    const teamMatch = findTeamByName(teamName, teams);
    
    return {
      pos,
      teamName,
      tpg: parts[2] || '0',
      j: parts[3] || '0',
      v: parts[4] || '0',
      e: parts[5] || '0',
      d: parts[6] || '0',
      gp: parts[7] || '0',
      gc: parts[8] || '0',
      sg: parts[9] || '0',
      ca: parts[10] || '0',
      cv: parts[11] || '0',
      disc: parts[12] || '0',
      pct: parts[13]?.replace('%', '') || '0',
      teamId: teamMatch?.teamId,
      matchConfidence: teamMatch?.confidence || 0
    };
  });
}

export default function StudioAdmin({ data, onDataUpdate, fontScale = 1.0 }: StudioAdminProps) {
  const [activeTab, setActiveTab] = useState<'matches' | 'standings' | 'teams' | 'import'>('matches');
  const [selectedRound, setSelectedRound] = useState(0);
  const [editedData, setEditedData] = useState<TournamentData>(data);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Estados para importação
  const [importText, setImportText] = useState('');
  const [parsedData, setParsedData] = useState<ParsedStandingEntry[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sistema de persistência para mapeamentos de times
  const [teamMappings, setTeamMappings] = useState<Record<string, string>>({});

  // Carregar mapeamentos salvos do localStorage
  const loadTeamMappings = useCallback(() => {
    try {
      const saved = localStorage.getItem('admin-team-mappings');
      if (saved) {
        const mappings = JSON.parse(saved);
        setTeamMappings(mappings);
        return mappings;
      }
    } catch (error) {
      console.warn('Erro ao carregar mapeamentos de times:', error);
    }
    return {};
  }, []);

  // Salvar mapeamentos no localStorage
  const saveTeamMappings = useCallback((mappings: Record<string, string>) => {
    try {
      localStorage.setItem('admin-team-mappings', JSON.stringify(mappings));
      setTeamMappings(mappings);
    } catch (error) {
      console.warn('Erro ao salvar mapeamentos de times:', error);
    }
  }, []);

  // Carregar mapeamentos na inicialização
  useEffect(() => {
    loadTeamMappings();
  }, [loadTeamMappings]);

  // Atualizar placar de uma partida
  const updateMatchScore = useCallback((roundIndex: number, matchIndex: number, field: 'scoreHome' | 'scoreAway', value: string) => {
    const score = value === '' ? null : parseInt(value);
    if (value !== '' && (isNaN(score!) || score! < 0)) return;

    const newData = { ...editedData };
    newData.rounds[roundIndex].matches[matchIndex][field] = score;
    setEditedData(newData);
    setHasUnsavedChanges(true);
  }, [editedData]);

  // Atualizar entrada da classificação
  const updateStandingEntry = useCallback((index: number, field: keyof StandingEntry, value: string) => {
    const numValue = value === '' ? 0 : parseInt(value);
    if (value !== '' && isNaN(numValue)) return;

    const newData = { ...editedData };
    (newData.standings[index] as any)[field] = field === 'teamId' ? value : numValue;
    setEditedData(newData);
    setHasUnsavedChanges(true);
  }, [editedData]);

  // Recalcular saldo de gols automaticamente
  const recalculateGoalDifference = useCallback((index: number) => {
    const entry = editedData.standings[index];
    const newSg = entry.gp - entry.gc;
    updateStandingEntry(index, 'sg', newSg.toString());
  }, [editedData.standings, updateStandingEntry]);

  // Mover time na classificação
  const moveStandingEntry = useCallback((dragIndex: number, hoverIndex: number) => {
    const newData = { ...editedData };
    const dragItem = newData.standings[dragIndex];
    const newStandings = [...newData.standings];
    
    // Remove o item da posição original
    newStandings.splice(dragIndex, 1);
    // Insere na nova posição
    newStandings.splice(hoverIndex, 0, dragItem);
    
    // Atualiza as posições
    newStandings.forEach((entry, index) => {
      entry.pos = index + 1;
    });
    
    newData.standings = newStandings;
    setEditedData(newData);
    setHasUnsavedChanges(true);
  }, [editedData]);

  // Atualizar dados de um time
  const updateTeam = useCallback((teamId: string, field: keyof Team, value: string) => {
    const newData = { ...editedData };
    newData.teams[teamId] = {
      ...newData.teams[teamId],
      [field]: value
    };
    setEditedData(newData);
    setHasUnsavedChanges(true);
  }, [editedData]);

  // Parsear texto colado
  const handleParseImportText = useCallback(() => {
    if (!importText.trim()) {
      setParsedData([]);
      setImportErrors([]);
      return;
    }

    try {
      const parsed = parseStandingsData(importText, editedData.teams);
      
      // Aplicar mapeamentos salvos
      const mappings = loadTeamMappings();
      const parsedWithMappings = parsed.map(p => {
        const savedMapping = mappings[p.teamName.toLowerCase().trim()];
        if (savedMapping && editedData.teams[savedMapping]) {
          return {
            ...p,
            teamId: savedMapping,
            matchConfidence: 100
          };
        }
        return p;
      });
      
      setParsedData(parsedWithMappings);
      
      const errors = [];
      const unmappedTeams = parsed.filter(p => !p.teamId || p.matchConfidence! < 70);
      
      if (unmappedTeams.length > 0) {
        errors.push(`${unmappedTeams.length} time(s) não foram mapeados automaticamente: ${unmappedTeams.map(t => t.teamName).join(', ')}`);
      }
      
      if (parsed.length === 0) {
        errors.push('Nenhum dado válido encontrado. Verifique o formato da tabela.');
      }
      
      setImportErrors(errors);
    } catch (error) {
      setImportErrors(['Erro ao processar os dados. Verifique o formato da tabela.']);
      setParsedData([]);
    }
  }, [importText, editedData.teams, loadTeamMappings]);

  // Atualizar mapeamento manual de time
  const updateTeamMapping = useCallback((index: number, teamId: string) => {
    const newParsedData = [...parsedData];
    const teamName = newParsedData[index].teamName;
    
    newParsedData[index] = {
      ...newParsedData[index],
      teamId,
      matchConfidence: teamId ? 100 : 0
    };
    setParsedData(newParsedData);
    
    // Salvar mapeamento permanentemente
    const currentMappings = { ...teamMappings };
    const key = teamName.toLowerCase().trim();
    
    if (teamId) {
      currentMappings[key] = teamId;
    } else {
      delete currentMappings[key];
    }
    
    saveTeamMappings(currentMappings);
    
    // Recalcular erros
    const errors = [];
    const unmappedTeams = newParsedData.filter(p => !p.teamId);
    if (unmappedTeams.length > 0) {
      errors.push(`${unmappedTeams.length} time(s) não foram mapeados: ${unmappedTeams.map(t => t.teamName).join(', ')}`);
    }
    setImportErrors(errors);
  }, [parsedData, teamMappings, saveTeamMappings]);

  // Aplicar dados importados
  const handleApplyImportedData = useCallback(() => {
    const validData = parsedData.filter(p => p.teamId);
    
    if (validData.length === 0) {
      setImportErrors(['Nenhum dado válido para importar. Mapeie pelo menos um time.']);
      return;
    }
    
    setIsImporting(true);
    
    try {
      const newStandings: StandingEntry[] = validData.map((parsed, index) => ({
        pos: parseInt(parsed.pos) || (index + 1),
        teamId: parsed.teamId!,
        tpg: parseInt(parsed.tpg) || 0,
        j: parseInt(parsed.j) || 0,
        v: parseInt(parsed.v) || 0,
        e: parseInt(parsed.e) || 0,
        d: parseInt(parsed.d) || 0,
        gp: parseInt(parsed.gp) || 0,
        gc: parseInt(parsed.gc) || 0,
        sg: parseInt(parsed.sg) || 0,
        ca: parseInt(parsed.ca) || 0,
        cv: parseInt(parsed.cv) || 0,
        disc: parseInt(parsed.disc) || 0,
        pct: parseInt(parsed.pct) || 0
      }));
      
      const newData = { ...editedData };
      newData.standings = newStandings;
      setEditedData(newData);
      setHasUnsavedChanges(true);
      
      // Limpar importação
      setImportText('');
      setParsedData([]);
      setImportErrors([]);
      setActiveTab('standings'); // Ir para a aba de classificação
      
    } catch (error) {
      setImportErrors(['Erro ao aplicar os dados importados.']);
    } finally {
      setIsImporting(false);
    }
  }, [parsedData, editedData]);

  // Handler para upload de arquivo
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportText(content);
      // Auto-parsear após carregar arquivo
      setTimeout(() => handleParseImportText(), 100);
    };
    reader.readAsText(file, 'UTF-8');
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleParseImportText]);

  // Salvar alterações
  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      onDataUpdate(editedData);
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setIsSaving(false);
    }
  }, [editedData, onDataUpdate]);

  // Resetar alterações
  const handleReset = useCallback(() => {
    setEditedData(data);
    setHasUnsavedChanges(false);
  }, [data]);

  const currentRound = editedData.rounds[selectedRound];

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="h-full bg-white p-6 flex flex-col overflow-hidden">
        {/* Wrapper com transform scale - afeta TODO o conteúdo proporcionalmente */}
        <div 
          className="h-full w-full flex flex-col origin-top-left"
          style={{ 
            transform: `scale(${fontScale})`,
            transformOrigin: 'top left',
            width: `${100 / fontScale}%`,
            height: `${100 / fontScale}%`
          }}
        >
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-slate-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Administração</h1>
            <p className="text-slate-600">Atualizar resultados e classificação</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Alterações não salvas</span>
            </div>
          )}
          
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasUnsavedChanges || isSaving}
          >
            Resetar
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={!hasUnsavedChanges || isSaving}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'matches' | 'standings' | 'teams' | 'import')} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mb-4">
          <TabsTrigger value="matches">📊 Resultados das Partidas</TabsTrigger>
          <TabsTrigger value="standings">Classificação Geral</TabsTrigger>
          <TabsTrigger value="teams">👕 Cadastro de Times</TabsTrigger>
          <TabsTrigger value="import">📥 Importar Classificação</TabsTrigger>
        </TabsList>

        {/* Tab: Resultados das Partidas */}
        <TabsContent value="matches" className="flex-1 flex flex-col space-y-4 overflow-hidden">
          
          {/* Seletor de Rodada */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-4">
                <Label>Selecionar Rodada:</Label>
                <select 
                  value={selectedRound} 
                  onChange={(e) => setSelectedRound(parseInt(e.target.value))}
                  className="px-3 py-2 border border-slate-200 rounded-lg bg-white"
                >
                  {editedData.rounds.map((round, index) => (
                    <option key={`round-${index}`} value={index}>{round.name}</option>
                  ))}
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Partidas */}
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader>
              <CardTitle>{currentRound.name}</CardTitle>
              <CardDescription>
                Digite os placares das partidas. Deixe vazio para partidas não disputadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
              <div className="space-y-4 pr-2">
                {currentRound.matches.map((match, matchIndex) => {
                  const homeTeam = editedData.teams[match.home];
                  const awayTeam = editedData.teams[match.away];
                  
                  return (
                    <div key={`match-${selectedRound}-${matchIndex}`} className="grid grid-cols-12 gap-4 items-center p-4 border border-slate-200 rounded-lg bg-slate-50">
                      
                      {/* Informações da partida */}
                      <div className="col-span-3 text-sm">
                        <div className="font-medium text-slate-900">{match.city}</div>
                        <div className="text-slate-500">{match.datetime}</div>
                      </div>

                      {/* Time da casa */}
                      <div className="col-span-3 flex items-center gap-2">
                        <img 
                          src={homeTeam?.logo || '/api/placeholder/24/24'} 
                          alt={homeTeam?.short} 
                          className="w-6 h-6 rounded-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/24/24';
                          }}
                        />
                        <span className="font-medium text-slate-900 truncate">
                          {homeTeam?.short || match.home}
                        </span>
                      </div>

                      {/* Placares */}
                      <div className="col-span-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={match.scoreHome ?? ''}
                          onChange={(e) => updateMatchScore(selectedRound, matchIndex, 'scoreHome', e.target.value)}
                          className="w-16 text-center"
                        />
                        <span className="text-slate-400 font-bold">×</span>
                        <Input
                          type="number"
                          min="0"
                          placeholder="0"
                          value={match.scoreAway ?? ''}
                          onChange={(e) => updateMatchScore(selectedRound, matchIndex, 'scoreAway', e.target.value)}
                          className="w-16 text-center"
                        />
                      </div>

                      {/* Time visitante */}
                      <div className="col-span-4 flex items-center gap-2">
                        <img 
                          src={awayTeam?.logo || '/api/placeholder/24/24'} 
                          alt={awayTeam?.short} 
                          className="w-6 h-6 rounded-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/api/placeholder/24/24';
                          }}
                        />
                        <span className="font-medium text-slate-900 truncate">
                          {awayTeam?.short || match.away}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Classificação Geral */}
        <TabsContent value="standings" className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Classificação Geral</CardTitle>
              <CardDescription>
                🔄 <strong>Arraste os times</strong> pelo ícone ⣿ para reordenar ou edite o número da posição. O saldo de gols é calculado automaticamente (GP - GC).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              {/* Header da tabela */}
              <div className="grid grid-cols-12 gap-2 items-center p-2 bg-slate-100 rounded-lg text-xs font-medium text-slate-600 mb-2">
                <div className="col-span-3">⣿ Pos. | Time</div>
                <div className="col-span-1 text-center">Pts</div>
                <div className="col-span-1 text-center">J</div>
                <div className="col-span-3 text-center">V-E-D</div>
                <div className="col-span-3 text-center">GP-GC-SG</div>
                <div className="col-span-1 text-center">Aprov.</div>
              </div>

              {/* Lista dos times */}
              <div className="space-y-2 pr-2" style={{ height: 'calc(100% - 50px)', overflowY: 'auto', overflowX: 'hidden' }}>
                {editedData.standings.map((entry, index) => {
                  const team = editedData.teams[entry.teamId];
                  if (!team) return null;
                  
                  return (
                    <DraggableStandingItem
                      key={`standing-${entry.teamId}-${entry.pos}-${index}`}
                      entry={entry}
                      index={index}
                      team={team}
                      onUpdate={updateStandingEntry}
                      onMove={moveStandingEntry}
                      onRecalculateGoalDifference={recalculateGoalDifference}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Cadastro de Times */}
        <TabsContent value="teams" className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Cadastro de Times</CardTitle>
              <CardDescription>
                Edite as informações dos times, incluindo nome, nome curto para exibição e URL do logo.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1" style={{ height: 'calc(100% - 80px)', overflowY: 'auto', overflowX: 'hidden' }}>
              <div className="space-y-6 pr-2">
                {Object.entries(editedData.teams).map(([teamId, team]) => (
                  <Card key={`team-${teamId}`}>
                    <CardContent className="pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Logo e Preview */}
                        <div className="flex flex-col items-center gap-2">
                          <img
                            src={team.logo || '/api/placeholder/48/48'}
                            alt={team.short}
                            className="w-12 h-12 rounded-full object-contain border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/api/placeholder/48/48';
                            }}
                          />
                          <Label className="text-xs font-medium text-slate-600">Logo</Label>
                        </div>

                        {/* Campos de edição */}
                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <Label>Nome Completo</Label>
                            <Input
                              value={team.name}
                              onChange={(e) => updateTeam(teamId, 'name', e.target.value)}
                              placeholder="Nome completo do time"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>Nome para Exibição</Label>
                            <Input
                              value={team.short}
                              onChange={(e) => updateTeam(teamId, 'short', e.target.value)}
                              placeholder="Nome curto para exibição"
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label>URL do Logo</Label>
                            <Input
                              value={team.logo}
                              onChange={(e) => updateTeam(teamId, 'logo', e.target.value)}
                              placeholder="https://exemplo.com/logo.png"
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Importar Classificação */}
        <TabsContent value="import" className="flex-1 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle>Importar Classificação</CardTitle>
              <CardDescription>
                Cole os dados da tabela de classificação ou carregue um arquivo. O sistema tentará mapear automaticamente os times.
                {Object.keys(teamMappings).length > 0 && (
                  <><br /><strong>✅ {Object.keys(teamMappings).length} mapeamento(s) personalizado(s) salvo(s) serão aplicados automaticamente.</strong></>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col space-y-4">
              {/* Área de importação */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Carregar Arquivo
                  </Button>
                  
                  <Button
                    onClick={handleParseImportText}
                    disabled={!importText.trim()}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Processar Dados
                  </Button>
                  
                  {Object.keys(teamMappings).length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (confirm(`Limpar ${Object.keys(teamMappings).length} mapeamento(s) salvo(s)?`)) {
                          saveTeamMappings({});
                        }
                      }}
                      className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Limpar Mapeamentos ({Object.keys(teamMappings).length})
                    </Button>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv,.tsv"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Cole aqui os dados da tabela de classificação..."
                  className="min-h-32 resize-none"
                />
              </div>

              {/* Erros */}
              {importErrors.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {importErrors.map((error, index) => (
                        <div key={`error-${index}`}>{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Preview dos dados processados */}
              {parsedData.length > 0 && (
                <div className="flex-1 flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Preview dos Dados ({parsedData.length} times)</h3>
                    <Button
                      onClick={handleApplyImportedData}
                      disabled={isImporting || parsedData.filter(p => p.teamId).length === 0}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isImporting ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      {isImporting ? 'Importando...' : 'Aplicar Dados'}
                    </Button>
                  </div>

                  <div className="flex-1 overflow-y-auto border rounded-lg">
                    <div className="space-y-2 p-4">
                      {parsedData.map((parsed, index) => (
                        <div 
                          key={`parsed-${index}`}
                          className={`flex items-center justify-between p-3 border rounded-lg ${
                            parsed.teamId ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-lg">{parsed.pos}º</span>
                            <div>
                              <div className="font-medium">{parsed.teamName}</div>
                              <div className="text-sm text-slate-600">
                                {parsed.tpg}pts • {parsed.j}j • {parsed.gp}-{parsed.gc}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {parsed.teamId ? (
                              <div className="flex items-center gap-2 text-green-700">
                                <Check className="w-4 h-4" />
                                <span className="text-sm">
                                  {editedData.teams[parsed.teamId]?.short} 
                                  {parsed.matchConfidence === 100 && teamMappings[parsed.teamName.toLowerCase().trim()] ? 
                                    ' (Salvo)' : ` (${parsed.matchConfidence}%)`
                                  }
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <X className="w-4 h-4 text-red-500" />
                                <select
                                  value={parsed.teamId || ''}
                                  onChange={(e) => updateTeamMapping(index, e.target.value)}
                                  className="px-2 py-1 border border-slate-300 rounded text-sm"
                                >
                                  <option value="">Selecionar time...</option>
                                  {Object.entries(editedData.teams).map(([teamId, team]) => (
                                    <option key={`team-option-${teamId}`} value={teamId}>
                                      {team.short}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div> {/* Fecha wrapper de zoom */}
      </div>
    </DndProvider>
  );
}