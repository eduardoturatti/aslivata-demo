// ============================
// FORMATIONS DATABASE
// Pre-defined tactical formations for football/society
// ============================

export interface FormationSlot {
  id: string;           // ex: 'gk', 'cb1', 'cm2'
  label: string;        // ex: 'GOL', 'ZAG', 'MEI'
  position: string;     // posicao generica para filtrar jogadores
  x: number;            // 0-100 (% horizontal, 0=esquerda, 100=direita)
  y: number;            // 0-100 (% vertical, 0=gol proprio, 100=gol adversario)
}

export interface Formation {
  id: string;
  name: string;         // ex: '4-4-2'
  slots: FormationSlot[];
}

// Coordenadas: y=5 e o goleiro, y=95 e o atacante mais avancado
// x=50 e o centro, distribui lateralmente de forma uniforme

export const FORMATIONS: Formation[] = [
  {
    id: '4-4-2',
    name: '4-4-2',
    slots: [
      { id: 'gk',  label: 'GOL', position: 'goleiro',     x: 50, y: 5  },
      { id: 'rb',  label: 'LAT', position: 'lateral',     x: 80, y: 25 },
      { id: 'cb1', label: 'ZAG', position: 'zagueiro',    x: 60, y: 22 },
      { id: 'cb2', label: 'ZAG', position: 'zagueiro',    x: 40, y: 22 },
      { id: 'lb',  label: 'LAT', position: 'lateral',     x: 20, y: 25 },
      { id: 'rm',  label: 'MEI', position: 'meio-campo',  x: 80, y: 50 },
      { id: 'cm1', label: 'MEI', position: 'meio-campo',  x: 60, y: 47 },
      { id: 'cm2', label: 'MEI', position: 'meio-campo',  x: 40, y: 47 },
      { id: 'lm',  label: 'MEI', position: 'meio-campo',  x: 20, y: 50 },
      { id: 'st1', label: 'ATA', position: 'atacante',    x: 62, y: 78 },
      { id: 'st2', label: 'ATA', position: 'atacante',    x: 38, y: 78 },
    ],
  },
  {
    id: '4-3-3',
    name: '4-3-3',
    slots: [
      { id: 'gk',  label: 'GOL', position: 'goleiro',     x: 50, y: 5  },
      { id: 'rb',  label: 'LAT', position: 'lateral',     x: 80, y: 25 },
      { id: 'cb1', label: 'ZAG', position: 'zagueiro',    x: 60, y: 22 },
      { id: 'cb2', label: 'ZAG', position: 'zagueiro',    x: 40, y: 22 },
      { id: 'lb',  label: 'LAT', position: 'lateral',     x: 20, y: 25 },
      { id: 'cm1', label: 'MEI', position: 'meio-campo',  x: 65, y: 48 },
      { id: 'cm2', label: 'MEI', position: 'meio-campo',  x: 50, y: 44 },
      { id: 'cm3', label: 'MEI', position: 'meio-campo',  x: 35, y: 48 },
      { id: 'rw',  label: 'ATA', position: 'atacante',    x: 80, y: 75 },
      { id: 'st',  label: 'ATA', position: 'atacante',    x: 50, y: 80 },
      { id: 'lw',  label: 'ATA', position: 'atacante',    x: 20, y: 75 },
    ],
  },
  {
    id: '4-2-3-1',
    name: '4-2-3-1',
    slots: [
      { id: 'gk',  label: 'GOL', position: 'goleiro',     x: 50, y: 5  },
      { id: 'rb',  label: 'LAT', position: 'lateral',     x: 80, y: 25 },
      { id: 'cb1', label: 'ZAG', position: 'zagueiro',    x: 60, y: 22 },
      { id: 'cb2', label: 'ZAG', position: 'zagueiro',    x: 40, y: 22 },
      { id: 'lb',  label: 'LAT', position: 'lateral',     x: 20, y: 25 },
      { id: 'dm1', label: 'VOL', position: 'meio-campo',  x: 60, y: 42 },
      { id: 'dm2', label: 'VOL', position: 'meio-campo',  x: 40, y: 42 },
      { id: 'ram', label: 'MEI', position: 'meio-campo',  x: 75, y: 62 },
      { id: 'cam', label: 'MEI', position: 'meio-campo',  x: 50, y: 65 },
      { id: 'lam', label: 'MEI', position: 'meio-campo',  x: 25, y: 62 },
      { id: 'st',  label: 'ATA', position: 'atacante',    x: 50, y: 82 },
    ],
  },
  {
    id: '3-5-2',
    name: '3-5-2',
    slots: [
      { id: 'gk',  label: 'GOL', position: 'goleiro',     x: 50, y: 5  },
      { id: 'cb1', label: 'ZAG', position: 'zagueiro',    x: 70, y: 22 },
      { id: 'cb2', label: 'ZAG', position: 'zagueiro',    x: 50, y: 20 },
      { id: 'cb3', label: 'ZAG', position: 'zagueiro',    x: 30, y: 22 },
      { id: 'rwb', label: 'ALA', position: 'lateral',     x: 85, y: 48 },
      { id: 'cm1', label: 'MEI', position: 'meio-campo',  x: 65, y: 50 },
      { id: 'cm2', label: 'MEI', position: 'meio-campo',  x: 50, y: 46 },
      { id: 'cm3', label: 'MEI', position: 'meio-campo',  x: 35, y: 50 },
      { id: 'lwb', label: 'ALA', position: 'lateral',     x: 15, y: 48 },
      { id: 'st1', label: 'ATA', position: 'atacante',    x: 62, y: 78 },
      { id: 'st2', label: 'ATA', position: 'atacante',    x: 38, y: 78 },
    ],
  },
  {
    id: '4-5-1',
    name: '4-5-1',
    slots: [
      { id: 'gk',  label: 'GOL', position: 'goleiro',     x: 50, y: 5  },
      { id: 'rb',  label: 'LAT', position: 'lateral',     x: 80, y: 25 },
      { id: 'cb1', label: 'ZAG', position: 'zagueiro',    x: 60, y: 22 },
      { id: 'cb2', label: 'ZAG', position: 'zagueiro',    x: 40, y: 22 },
      { id: 'lb',  label: 'LAT', position: 'lateral',     x: 20, y: 25 },
      { id: 'rm',  label: 'MEI', position: 'meio-campo',  x: 82, y: 52 },
      { id: 'cm1', label: 'MEI', position: 'meio-campo',  x: 65, y: 48 },
      { id: 'cm2', label: 'MEI', position: 'meio-campo',  x: 50, y: 45 },
      { id: 'cm3', label: 'MEI', position: 'meio-campo',  x: 35, y: 48 },
      { id: 'lm',  label: 'MEI', position: 'meio-campo',  x: 18, y: 52 },
      { id: 'st',  label: 'ATA', position: 'atacante',    x: 50, y: 80 },
    ],
  },
  {
    id: '3-4-3',
    name: '3-4-3',
    slots: [
      { id: 'gk',  label: 'GOL', position: 'goleiro',     x: 50, y: 5  },
      { id: 'cb1', label: 'ZAG', position: 'zagueiro',    x: 70, y: 22 },
      { id: 'cb2', label: 'ZAG', position: 'zagueiro',    x: 50, y: 20 },
      { id: 'cb3', label: 'ZAG', position: 'zagueiro',    x: 30, y: 22 },
      { id: 'rm',  label: 'MEI', position: 'meio-campo',  x: 78, y: 48 },
      { id: 'cm1', label: 'MEI', position: 'meio-campo',  x: 60, y: 45 },
      { id: 'cm2', label: 'MEI', position: 'meio-campo',  x: 40, y: 45 },
      { id: 'lm',  label: 'MEI', position: 'meio-campo',  x: 22, y: 48 },
      { id: 'rw',  label: 'ATA', position: 'atacante',    x: 78, y: 76 },
      { id: 'st',  label: 'ATA', position: 'atacante',    x: 50, y: 80 },
      { id: 'lw',  label: 'ATA', position: 'atacante',    x: 22, y: 76 },
    ],
  },
  {
    id: '5-3-2',
    name: '5-3-2',
    slots: [
      { id: 'gk',  label: 'GOL', position: 'goleiro',     x: 50, y: 5  },
      { id: 'rwb', label: 'ALA', position: 'lateral',     x: 88, y: 28 },
      { id: 'cb1', label: 'ZAG', position: 'zagueiro',    x: 70, y: 22 },
      { id: 'cb2', label: 'ZAG', position: 'zagueiro',    x: 50, y: 20 },
      { id: 'cb3', label: 'ZAG', position: 'zagueiro',    x: 30, y: 22 },
      { id: 'lwb', label: 'ALA', position: 'lateral',     x: 12, y: 28 },
      { id: 'cm1', label: 'MEI', position: 'meio-campo',  x: 65, y: 50 },
      { id: 'cm2', label: 'MEI', position: 'meio-campo',  x: 50, y: 46 },
      { id: 'cm3', label: 'MEI', position: 'meio-campo',  x: 35, y: 50 },
      { id: 'st1', label: 'ATA', position: 'atacante',    x: 62, y: 78 },
      { id: 'st2', label: 'ATA', position: 'atacante',    x: 38, y: 78 },
    ],
  },
  {
    id: '4-1-4-1',
    name: '4-1-4-1',
    slots: [
      { id: 'gk',  label: 'GOL', position: 'goleiro',     x: 50, y: 5  },
      { id: 'rb',  label: 'LAT', position: 'lateral',     x: 80, y: 25 },
      { id: 'cb1', label: 'ZAG', position: 'zagueiro',    x: 60, y: 22 },
      { id: 'cb2', label: 'ZAG', position: 'zagueiro',    x: 40, y: 22 },
      { id: 'lb',  label: 'LAT', position: 'lateral',     x: 20, y: 25 },
      { id: 'dm',  label: 'VOL', position: 'meio-campo',  x: 50, y: 40 },
      { id: 'rm',  label: 'MEI', position: 'meio-campo',  x: 80, y: 58 },
      { id: 'cm1', label: 'MEI', position: 'meio-campo',  x: 60, y: 55 },
      { id: 'cm2', label: 'MEI', position: 'meio-campo',  x: 40, y: 55 },
      { id: 'lm',  label: 'MEI', position: 'meio-campo',  x: 20, y: 58 },
      { id: 'st',  label: 'ATA', position: 'atacante',    x: 50, y: 80 },
    ],
  },
];

export const DEFAULT_FORMATION = '4-4-2';

export function getFormation(id: string): Formation | null {
  return FORMATIONS.find(f => f.id === id) || null;
}

// Normalizar posicao do jogador para comparar com slot.position
export function normalizePositionForSlot(pos: string): string {
  const p = (pos || '').toLowerCase().trim();
  if (/goleiro|gk|goalkeeper|gol/i.test(p)) return 'goleiro';
  if (/zagueiro|cb|defens|zag/i.test(p)) return 'zagueiro';
  if (/lateral|lb|rb|fullback|lat|ala/i.test(p)) return 'lateral';
  if (/meia|meio|mid|volante|vol|mei|cm|mc/i.test(p)) return 'meio-campo';
  if (/atacante|forward|striker|ponta|ata|st|fw|centroavante/i.test(p)) return 'atacante';
  return 'meio-campo';
}
