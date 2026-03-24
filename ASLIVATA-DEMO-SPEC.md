# ASLIVATA Power Sports Demo — Spec para Claude Code

## Objetivo
Criar um demo STANDALONE do Power Sports personalizado para a ASLIVATA (Associação de Ligas do Vale do Taquari), usando dados reais da 26ª Regional Certel/Sicredi 2025 - Série A.

**SEM SUPABASE. Tudo local, dados hardcoded, pronto pra rodar e apresentar.**

O código-fonte do Power Sports está neste repositório. O demo deve reutilizar o máximo possível do visual/UX existente, mas com uma camada de dados local (mock) substituindo todas as chamadas Supabase.

## O que construir

### 1. Mock Data Layer
Criar `src/lib/mock-data.ts` que exporta todas as funções que `supabase.ts` exporta, mas retornando dados locais hardcoded. O `useTournament` hook deve funcionar sem mudanças — só trocar o import.

### 2. Telas que precisam funcionar
- **Home** — Próximos jogos, últimos resultados, classificação resumida
- **Classificação** — Tabela completa das 19 equipes (dados reais abaixo)
- **Jogos/Rodadas** — 57 jogos reais, organizados por fase (Rodada 1-6, Oitavas, Quartas, Semi, Final)
- **Artilharia** — Top scorers reais (Maicon Benini 9 gols, Theylor 9, etc.)
- **Bolão Simulado** — Ranking fictício de ~15 participantes com pontuações, palpites, etc.
- **Seleção da Galera** — Votação simulada de melhor time da rodada

### 3. Branding
- Nome: "ASLIVATA" / "26ª Regional Certel / Sicredi"
- Cores: Verde escuro (#006633) + Dourado (#D4AF37) 
- Footer: "powered by POWER SPORTS"
- Patrocinadores: Certel + Sicredi (texto/logo placeholder)

---

## DADOS REAIS — 19 EQUIPES

```json
[
  { "id": "t01", "name": "GR Canabarrense", "short_name": "CAN", "slug": "canabarrense", "color": "#1D3557", "color_detail": "#457B9D", "city": "Teutônia" },
  { "id": "t02", "name": "SRC Tiradentes", "short_name": "TIR", "slug": "tiradentes", "color": "#9B2335", "color_detail": "#D4A843", "city": "Nova Bréscia" },
  { "id": "t03", "name": "GE Taquariense", "short_name": "TAQ", "slug": "taquariense", "color": "#006633", "color_detail": "#FFD700", "city": "Taquari" },
  { "id": "t04", "name": "EC Brasil", "short_name": "BRA", "slug": "brasil", "color": "#009739", "color_detail": "#FEDD00", "city": "Marques de Souza" },
  { "id": "t05", "name": "EC Poço das Antas", "short_name": "POC", "slug": "poco-das-antas", "color": "#E76F51", "color_detail": "#F4A261", "city": "Poço das Antas" },
  { "id": "t06", "name": "SDRC Serrano", "short_name": "SER", "slug": "serrano", "color": "#2D6A4F", "color_detail": "#52B788", "city": "Encantado" },
  { "id": "t07", "name": "EC Minuano", "short_name": "MIN", "slug": "minuano", "color": "#023E8A", "color_detail": "#48CAE4", "city": "Canudos do Vale" },
  { "id": "t08", "name": "SER Gaúcho Teutônia", "short_name": "GAU", "slug": "gaucho-teutonia", "color": "#E63946", "color_detail": "#F1FAEE", "city": "Teutônia" },
  { "id": "t09", "name": "Nacional FC", "short_name": "NAC", "slug": "nacional", "color": "#0077B6", "color_detail": "#90E0EF", "city": "Forquetinha" },
  { "id": "t10", "name": "ECAS", "short_name": "ECA", "slug": "ecas", "color": "#6A0572", "color_detail": "#AB83A1", "city": "Imigrante" },
  { "id": "t11", "name": "FC Rudibar", "short_name": "RUD", "slug": "rudibar", "color": "#5C4033", "color_detail": "#C4A882", "city": "Bom Retiro do Sul" },
  { "id": "t12", "name": "EC Imigrante", "short_name": "IMI", "slug": "imigrante", "color": "#BC4749", "color_detail": "#F2E8CF", "city": "Nova Bréscia" },
  { "id": "t13", "name": "GE Juventude Guaporé", "short_name": "JUG", "slug": "juventude-guapore", "color": "#386641", "color_detail": "#A7C957", "city": "Guaporé" },
  { "id": "t14", "name": "EC Boavistense", "short_name": "BOA", "slug": "boavistense", "color": "#264653", "color_detail": "#2A9D8F", "city": "Boa Vista do Sul" },
  { "id": "t15", "name": "EC Estudiantes", "short_name": "EST", "slug": "estudiantes", "color": "#6C757D", "color_detail": "#ADB5BD", "city": "Lajeado" },
  { "id": "t16", "name": "EC Juventude Westfália", "short_name": "JUW", "slug": "juventude-westfalia", "color": "#118AB2", "color_detail": "#073B4C", "city": "Westfália" },
  { "id": "t17", "name": "SC Sete de Setembro", "short_name": "SET", "slug": "sete-de-setembro", "color": "#BB3E03", "color_detail": "#EE9B00", "city": "Arroio do Meio" },
  { "id": "t18", "name": "GE Gaúcho Progresso", "short_name": "GAP", "slug": "gaucho-progresso", "color": "#9B2226", "color_detail": "#CA6702", "city": "Progresso" },
  { "id": "t19", "name": "CAN - Navegantes", "short_name": "NAV", "slug": "navegantes", "color": "#495057", "color_detail": "#6C757D", "city": "Encantado" }
]
```

## CLASSIFICAÇÃO FINAL (fase classificatória — dados reais do site)

```json
[
  { "pos":1,  "slug":"canabarrense",       "pts":28,"j":12,"v":9,"e":1,"d":2,"gp":19,"gc":7, "sg":12, "ca":25,"cv":1 },
  { "pos":2,  "slug":"tiradentes",          "pts":28,"j":12,"v":8,"e":4,"d":0,"gp":23,"gc":8, "sg":15, "ca":27,"cv":2 },
  { "pos":3,  "slug":"taquariense",         "pts":27,"j":14,"v":8,"e":3,"d":3,"gp":27,"gc":19,"sg":8,  "ca":42,"cv":2 },
  { "pos":4,  "slug":"brasil",              "pts":21,"j":10,"v":6,"e":3,"d":1,"gp":19,"gc":7, "sg":12, "ca":27,"cv":2 },
  { "pos":5,  "slug":"poco-das-antas",      "pts":21,"j":14,"v":5,"e":6,"d":3,"gp":27,"gc":21,"sg":6,  "ca":35,"cv":4 },
  { "pos":6,  "slug":"serrano",             "pts":20,"j":10,"v":6,"e":2,"d":2,"gp":16,"gc":7, "sg":9,  "ca":23,"cv":0 },
  { "pos":7,  "slug":"minuano",             "pts":15,"j":10,"v":5,"e":0,"d":5,"gp":14,"gc":11,"sg":3,  "ca":26,"cv":3 },
  { "pos":8,  "slug":"gaucho-teutonia",     "pts":12,"j":10,"v":3,"e":3,"d":4,"gp":10,"gc":11,"sg":-1, "ca":23,"cv":3 },
  { "pos":9,  "slug":"nacional",            "pts":11,"j":8, "v":3,"e":2,"d":3,"gp":7, "gc":9, "sg":-2, "ca":31,"cv":4 },
  { "pos":10, "slug":"ecas",                "pts":8, "j":8, "v":2,"e":2,"d":4,"gp":10,"gc":14,"sg":-4, "ca":13,"cv":2 },
  { "pos":11, "slug":"rudibar",             "pts":7, "j":8, "v":2,"e":1,"d":5,"gp":8, "gc":18,"sg":-10,"ca":17,"cv":2 },
  { "pos":12, "slug":"imigrante",           "pts":7, "j":8, "v":2,"e":1,"d":5,"gp":13,"gc":20,"sg":-7, "ca":22,"cv":4 },
  { "pos":13, "slug":"juventude-guapore",   "pts":6, "j":8, "v":1,"e":3,"d":4,"gp":11,"gc":13,"sg":-2, "ca":17,"cv":1 },
  { "pos":14, "slug":"boavistense",         "pts":6, "j":8, "v":1,"e":3,"d":4,"gp":5, "gc":12,"sg":-7, "ca":18,"cv":1 },
  { "pos":15, "slug":"estudiantes",         "pts":6, "j":8, "v":1,"e":3,"d":4,"gp":12,"gc":17,"sg":-5, "ca":30,"cv":0 },
  { "pos":16, "slug":"juventude-westfalia", "pts":5, "j":8, "v":1,"e":2,"d":5,"gp":4, "gc":11,"sg":-7, "ca":26,"cv":0 },
  { "pos":17, "slug":"sete-de-setembro",    "pts":5, "j":6, "v":1,"e":2,"d":3,"gp":6, "gc":12,"sg":-6, "ca":15,"cv":0 },
  { "pos":18, "slug":"gaucho-progresso",    "pts":4, "j":6, "v":1,"e":1,"d":4,"gp":3, "gc":9, "sg":-6, "ca":17,"cv":6 },
  { "pos":19, "slug":"navegantes",          "pts":3, "j":6, "v":1,"e":0,"d":5,"gp":6, "gc":14,"sg":-8, "ca":15,"cv":6 }
]
```

## TODOS OS 57 JOGOS (dados reais)

Formato: [round, phase, date, home_slug, away_slug, home_score, away_score, city, penalties_home?, penalties_away?]

```
R1 10/08 classificatoria
rudibar 0x2 nacional - Bom Retiro do Sul
juventude-westfalia 0x2 imigrante - Westfália
gaucho-teutonia 2x0 sete-de-setembro - Teutônia
serrano 1x0 taquariense - Encantado
estudiantes 1x2 tiradentes - Lajeado
ecas 1x1 juventude-guapore - Imigrante
boavistense 1x0 brasil - Boa Vista do Sul
minuano 1x2 poco-das-antas - Canudos do Vale
navegantes 0x2 canabarrense - Encantado

R2 17/08 classificatoria
sete-de-setembro 2x2 imigrante - Arroio do Meio
tiradentes 1x1 serrano - Nova Bréscia
juventude-guapore 3x3 estudiantes - Guaporé
brasil 3x0 ecas - Marques de Souza
nacional 1x0 boavistense - Forquetinha
poco-das-antas 3x3 rudibar - Poço das Antas
canabarrense 0x2 minuano - Teutônia
juventude-westfalia 3x2 navegantes - Westfália

R3 31/08 classificatoria
minuano 1x0 juventude-westfalia - Canudos do Vale
gaucho-progresso 0x2 sete-de-setembro - Progresso
rudibar 0x3 canabarrense - Bom Retiro do Sul
boavistense 1x2 poco-das-antas - Boa Vista do Sul
ecas 3x0 nacional - Imigrante
estudiantes 2x3 brasil - Lajeado
serrano 2x0 juventude-guapore - Encantado
gaucho-teutonia 1x2 tiradentes - Teutônia
imigrante 2x3 taquariense - Nova Bréscia

R4 07/09 classificatoria
minuano 1x2 navegantes - Canudos do Vale
rudibar 2x1 gaucho-progresso - Bom Retiro do Sul
boavistense 0x0 juventude-westfalia - Boa Vista do Sul
estudiantes 3x2 poco-das-antas - Lajeado
serrano 2x0 nacional - Encantado
gaucho-teutonia 1x3 brasil - Teutônia

R5 14/09 classificatoria
navegantes 0x2 taquariense - Encantado
canabarrense 2x0 gaucho-progresso - Teutônia
sete-de-setembro 0x2 tiradentes - Arroio do Meio

R6 28/09 classificatoria
ecas 1x2 canabarrense - Imigrante
navegantes 1x2 gaucho-progresso - Encantado
imigrante 3x2 juventude-guapore - Nova Bréscia
taquariense 1x1 gaucho-teutonia - Taquari
brasil 3x1 rudibar - Marques de Souza

OITAVAS IDA 05/10
sete-de-setembro 0x4 serrano - Arroio do Meio
poco-das-antas 4x1 navegantes - Poço das Antas
nacional 2x1 minuano - Forquetinha
imigrante 1x2 gaucho-teutonia - Nova Bréscia
tiradentes 1x1 ecas - Nova Bréscia
taquariense 3x2 estudiantes - Taquari
juventude-guapore 5x0 boavistense - Guaporé
gaucho-progresso 0x0 juventude-westfalia - Progresso

OITAVAS VOLTA 12/10
brasil 2x0 serrano - Marques de Souza
nacional 1x1 estudiantes - Forquetinha
gaucho-progresso 0x2 minuano - Progresso
juventude-westfalia 1x2 rudibar - Westfália
canabarrense 1x1 boavistense - Teutônia
poco-das-antas 1x2 ecas - Poço das Antas
juventude-guapore 0x0 gaucho-teutonia - Guaporé
tiradentes 5x0 imigrante - Nova Bréscia
taquariense 2x2 sete-de-setembro - Taquari

QUARTAS IDA 19/10
ecas 1x3 minuano - Imigrante
gaucho-teutonia 0x0 nacional - Teutônia
rudibar 0x1 poco-das-antas - Bom Retiro do Sul
imigrante 1x3 taquariense - Nova Bréscia
boavistense 1x1 serrano - Boa Vista do Sul
juventude-westfalia 0x1 tiradentes - Westfália
estudiantes 0x0 brasil - Lajeado
juventude-guapore 0x2 canabarrense - Guaporé

QUARTAS VOLTA 26/10
brasil 3x0 estudiantes - Marques de Souza
tiradentes 3x0 juventude-westfalia - Nova Bréscia
serrano 2x1 boavistense - Encantado
canabarrense 2x0 juventude-guapore - Teutônia
taquariense 3x2 imigrante - Taquari
poco-das-antas 4x0 rudibar - Poço das Antas
nacional 1x2 gaucho-teutonia - Forquetinha
minuano 3x1 ecas - Canudos do Vale

SEMI IDA 02/11
minuano 0x2 canabarrense - Canudos do Vale
taquariense 2x0 serrano - Taquari
poco-das-antas 1x1 brasil - Poço das Antas
gaucho-teutonia 0x1 tiradentes - Teutônia

SEMI VOLTA 16/11
tiradentes 2x1 gaucho-teutonia - Nova Bréscia
canabarrense 1x0 minuano - Teutônia
brasil 1(4)x(5)1 poco-das-antas - Marques de Souza [POC nos pênaltis]
serrano 3(3)x(4)0 taquariense - Encantado [TAQ nos pênaltis]

SEMI 2 IDA 23/11
poco-das-antas 2x2 tiradentes - Poço das Antas
taquariense 1x2 canabarrense - Taquari

SEMI 2 VOLTA 30/11
tiradentes 1(2)x(3)1 poco-das-antas - Nova Bréscia [POC nos pênaltis]
canabarrense 0(2)x(4)2 taquariense - Teutônia [TAQ nos pênaltis]

FINAL IDA 14/12
poco-das-antas 1x1 taquariense - Poço das Antas

FINAL VOLTA 21/12
taquariense 4x2 poco-das-antas - Taquari [TAQUARIENSE CAMPEÃO]
```

## ARTILHEIROS REAIS (top 28)

```json
[
  { "name": "Maicon Benini", "slug": "poco-das-antas", "goals": 9 },
  { "name": "Theylor H. S. Gularte", "slug": "taquariense", "goals": 9 },
  { "name": "João Felipe de Moura", "slug": "tiradentes", "goals": 8 },
  { "name": "Andrei L. Macedo Rosa", "slug": "taquariense", "goals": 6 },
  { "name": "Leandro Mauri", "slug": "canabarrense", "goals": 6 },
  { "name": "Diego Altnetter da Costa", "slug": "serrano", "goals": 6 },
  { "name": "Felipe Gedoz da Conceição", "slug": "estudiantes", "goals": 5 },
  { "name": "Yan Henrique Claro Lima", "slug": "poco-das-antas", "goals": 5 },
  { "name": "Wiliam Samuel Dresch", "slug": "brasil", "goals": 4 },
  { "name": "Willian A. Kochenborger", "slug": "brasil", "goals": 4 },
  { "name": "Fabrício Dutra Corrêa", "slug": "gaucho-teutonia", "goals": 4 },
  { "name": "Roberson de Arruda Alves", "slug": "tiradentes", "goals": 4 },
  { "name": "João Carlos Simões Neto", "slug": "poco-das-antas", "goals": 4 },
  { "name": "Eduardo Capella", "slug": "navegantes", "goals": 3 },
  { "name": "Lucas Lima Lopes", "slug": "brasil", "goals": 3 },
  { "name": "Marcus V. Konzen", "slug": "imigrante", "goals": 3 },
  { "name": "Alan G. da Silva", "slug": "minuano", "goals": 3 },
  { "name": "Fabio Carpes Rosa", "slug": "minuano", "goals": 3 },
  { "name": "Luiz G. Lopes da Cruz", "slug": "poco-das-antas", "goals": 3 },
  { "name": "Edgar Calgaroto Filho", "slug": "ecas", "goals": 3 },
  { "name": "Emerson A. M. A. Varela", "slug": "ecas", "goals": 3 },
  { "name": "Patrick Dalbosco Pinto", "slug": "juventude-guapore", "goals": 3 },
  { "name": "Alisson R. Santos Tobias", "slug": "taquariense", "goals": 3 },
  { "name": "Juliano Fogaça Soares", "slug": "canabarrense", "goals": 3 },
  { "name": "Alexandre Possamai", "slug": "serrano", "goals": 3 },
  { "name": "Alisson da Rosa", "slug": "tiradentes", "goals": 3 },
  { "name": "Matheus Andrigo do Couto", "slug": "tiradentes", "goals": 3 },
  { "name": "Guilherme Ferreira da Silva", "slug": "taquariense", "goals": 3 }
]
```

## BOLÃO SIMULADO (dados fictícios pra demo)

Gerar ranking com ~15 participantes fictícios com nomes comuns da região:
- Pontuação baseada em acertos (10pts placar exato, 5pts resultado certo, 3pts empate certo)
- Mostrar palpites vs resultado real de alguns jogos
- Badges: "Mestre dos Placares", "Zebra Hunter", etc.

## RANKING FINAL DO CAMPEONATO

```
1. Taquariense (CAMPEÃO)
2. Poço das Antas (Vice)
3. Canabarrense
4. Tiradentes
5-8: Brasil, Serrano, Minuano, Gaúcho Teutônia
9-16: Nacional, Ecas, Rudibar, Imigrante, Juv. Guaporé, Boavistense, Estudiantes, Juv. Westfália
17-19: 7 de Setembro, Gaúcho Progresso, Navegantes (eliminados na classificatória)
```

## STATS DO CAMPEONATO
- 57 jogos disputados
- 240 gols marcados (média 4.21/jogo)
- 459 cartões amarelos
- 43 cartões vermelhos
- Maior goleada: Juventude Guaporé 5x0 Boavistense e Tiradentes 5x0 Imigrante
- Jogo com mais gols na final: Taquariense 4x2 Poço das Antas

## APPROACH TÉCNICO

Opção recomendada: criar um branch `demo/aslivata` no repo do Power Sports. Substituir `src/lib/supabase-client.ts` por um mock que retorna Promises resolvidas com dados locais. Assim todo o frontend funciona igual, sem tocar no visual.

Alternativa: app React standalone mínimo com Vite, reutilizando os componentes de UI do Power Sports (shadcn, tailwind).
