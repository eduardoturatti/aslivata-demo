// ============================================================================
// ASLIVATA Tournament Mock Data - Power Sports Demo
// Complete hardcoded data for the 2025 tournament
// ============================================================================

import type { SQLTeam, SQLMatch, SQLPlayer, ScorerEntry, StandingEntry } from './supabase';

export const COMPETITION_ID = '00000000-0000-0000-0001-000000000001';

// ============================================================================
// TEAMS (19)
// ============================================================================
export const TEAMS: SQLTeam[] = [
  { id: 't01', name: 'GR Canabarrense', short_name: 'CAN', slug: 'canabarrense', logo_url: 'https://www.aslivata.com.br/files/times/time-10/thumbs/logo-canabarrense-sf-69821690423669.png', color: '#1D3557', color_detail: '#457B9D', city: 'Teutônia' },
  { id: 't02', name: 'SRC Tiradentes', short_name: 'TIR', slug: 'tiradentes', logo_url: 'https://image.singular.live/4b6db8fddfec56800f0abe5eca442af9/images/2wzdfjx4Czksg5plZ43NF6_w1080h1200.png', color: '#9B2335', color_detail: '#D4A843', city: 'Nova Bréscia' },
  { id: 't03', name: 'GE Taquariense', short_name: 'TAQ', slug: 'taquariense', logo_url: 'https://www.aslivata.com.br/files/times/time-5/thumbs/logo-taquariense-sf-15091690423707.png', color: '#006633', color_detail: '#FFD700', city: 'Taquari' },
  { id: 't04', name: 'EC Brasil', short_name: 'BRA', slug: 'brasil', logo_url: 'https://www.aslivata.com.br/files/times/time-17/thumbs/logo-brasil-sf-12701752797876.png', color: '#009739', color_detail: '#FEDD00', city: 'Marques de Souza' },
  { id: 't05', name: 'EC Poço das Antas', short_name: 'POC', slug: 'poco-das-antas', logo_url: 'https://image.singular.live/4b6db8fddfec56800f0abe5eca442af9/images/2Oj6KwH17EHwuKQBpH92pj_w1080h1200.png', color: '#E76F51', color_detail: '#F4A261', city: 'Poço das Antas' },
  { id: 't06', name: 'SDRC Serrano', short_name: 'SER', slug: 'serrano', logo_url: 'https://www.aslivata.com.br/files/times/time-9/thumbs/whatsapp-image-2023-07-18-at-105928-73631689772179.jpeg', color: '#2D6A4F', color_detail: '#52B788', city: 'Encantado' },
  { id: 't07', name: 'EC Minuano', short_name: 'MIN', slug: 'minuano', logo_url: 'https://www.aslivata.com.br/files/times/time-11/thumbs/logo-minuano-sf-25901690424268.png', color: '#023E8A', color_detail: '#48CAE4', city: 'Canudos do Vale' },
  { id: 't08', name: 'SER Gaúcho Teutônia', short_name: 'GAU', slug: 'gaucho-teutonia', logo_url: 'https://www.aslivata.com.br/files/times/time-60/thumbs/gaucho-colorpng-91011738197101.png', color: '#E63946', color_detail: '#F1FAEE', city: 'Teutônia' },
  { id: 't09', name: 'Nacional FC', short_name: 'NAC', slug: 'nacional', logo_url: 'https://www.aslivata.com.br/files/times/time-70/thumbs/nacional-forquetinha-21261748826956.jpeg', color: '#0077B6', color_detail: '#90E0EF', city: 'Forquetinha' },
  { id: 't10', name: 'ECAS', short_name: 'ECA', slug: 'ecas', logo_url: 'https://www.aslivata.com.br/files/times/time-12/thumbs/logo-ecas-sf-86011690423584.png', color: '#6A0572', color_detail: '#AB83A1', city: 'Imigrante' },
  { id: 't11', name: 'FC Rudibar', short_name: 'RUD', slug: 'rudibar', logo_url: 'https://www.aslivata.com.br/files/times/time-22/thumbs/rudibar-40361690242765.jpg', color: '#5C4033', color_detail: '#C4A882', city: 'Bom Retiro do Sul' },
  { id: 't12', name: 'EC Imigrante', short_name: 'IMI', slug: 'imigrante', logo_url: 'https://www.aslivata.com.br/files/times/time-47/thumbs/imigrante-12091748827069.jpeg', color: '#BC4749', color_detail: '#F2E8CF', city: 'Nova Bréscia' },
  { id: 't13', name: 'GE Juventude Guaporé', short_name: 'JUG', slug: 'juventude-guapore', logo_url: 'https://www.aslivata.com.br/files/times/time-13/thumbs/whatsapp-image-2025-05-12-at-161201-62351747094646.jpeg', color: '#386641', color_detail: '#A7C957', city: 'Guaporé' },
  { id: 't14', name: 'EC Boavistense', short_name: 'BOA', slug: 'boavistense', logo_url: 'https://www.aslivata.com.br/files/times/time-71/thumbs/boavistense-removebg-preview-78641748826919.png', color: '#264653', color_detail: '#2A9D8F', city: 'Boa Vista do Sul' },
  { id: 't15', name: 'EC Estudiantes', short_name: 'EST', slug: 'estudiantes', logo_url: 'https://www.aslivata.com.br/files/times/time-6/thumbs/logo-estudiantes-sf-34311690424117.png', color: '#6C757D', color_detail: '#ADB5BD', city: 'Lajeado' },
  { id: 't16', name: 'EC Juventude Westfália', short_name: 'JUW', slug: 'juventude-westfalia', logo_url: 'https://www.aslivata.com.br/files/times/time-18/thumbs/logo-juventude-sf-92721690424236.png', color: '#118AB2', color_detail: '#073B4C', city: 'Westfália' },
  { id: 't17', name: 'SC Sete de Setembro', short_name: 'SET', slug: 'sete-de-setembro', logo_url: 'https://image.singular.live/4b6db8fddfec56800f0abe5eca442af9/images/5uNHP66R0lRsNRwcnWuvKR_w1080h1200.png', color: '#F0C800', color_detail: '#EE9B00', city: 'Arroio do Meio' },
  { id: 't18', name: 'GE Gaúcho Progresso', short_name: 'GAP', slug: 'gaucho-progresso', logo_url: 'https://www.aslivata.com.br/files/times/time-69/thumbs/gaucho-progresso-76321748826983.jpeg', color: '#9B2226', color_detail: '#CA6702', city: 'Progresso' },
  { id: 't19', name: 'CAN - Navegantes', short_name: 'NAV', slug: 'navegantes', logo_url: 'https://www.aslivata.com.br/files/times/time-68/thumbs/navegantes-57061748827014.jpg', color: '#495057', color_detail: '#6C757D', city: 'Encantado' },
];

// Helper to find team by slug
const teamBySlug = (slug: string): SQLTeam => TEAMS.find(t => t.slug === slug)!;
const teamIdBySlug = (slug: string): string => teamBySlug(slug).id;

// ============================================================================
// MATCHES (57)
// ============================================================================
function mkMatch(
  id: string,
  round_number: number,
  round_name: string,
  date: string,
  homeSlug: string,
  awaySlug: string,
  score_home: number,
  score_away: number,
  location: string,
  penalty_home?: number,
  penalty_away?: number,
): SQLMatch {
  const home = teamBySlug(homeSlug);
  const away = teamBySlug(awaySlug);
  const match: SQLMatch = {
    id,
    competition_id: COMPETITION_ID,
    home_team_id: home.id,
    away_team_id: away.id,
    round_number,
    round_name,
    match_date: date,
    location,
    status: 'finished',
    score_home,
    score_away,
    broadcast: false,
    home_team: home,
    away_team: away,
  };
  if (penalty_home != null) match.penalty_score_home = penalty_home;
  if (penalty_away != null) match.penalty_score_away = penalty_away;
  return match;
}

export const MATCHES: SQLMatch[] = [
  // ── R1 - 10/08 - Classificatória ──
  mkMatch('m01', 1, 'Rodada 1', '2025-08-10T15:30:00', 'rudibar', 'nacional', 0, 2, 'Bom Retiro do Sul'),
  mkMatch('m02', 1, 'Rodada 1', '2025-08-10T15:30:00', 'juventude-westfalia', 'imigrante', 0, 2, 'Westfália'),
  mkMatch('m03', 1, 'Rodada 1', '2025-08-10T15:30:00', 'gaucho-teutonia', 'sete-de-setembro', 2, 0, 'Teutônia'),
  mkMatch('m04', 1, 'Rodada 1', '2025-08-10T15:30:00', 'serrano', 'taquariense', 1, 0, 'Encantado'),
  mkMatch('m05', 1, 'Rodada 1', '2025-08-10T15:30:00', 'estudiantes', 'tiradentes', 1, 2, 'Lajeado'),
  mkMatch('m06', 1, 'Rodada 1', '2025-08-10T15:30:00', 'ecas', 'juventude-guapore', 1, 1, 'Imigrante'),
  mkMatch('m07', 1, 'Rodada 1', '2025-08-10T15:30:00', 'boavistense', 'brasil', 1, 0, 'Boa Vista do Sul'),
  mkMatch('m08', 1, 'Rodada 1', '2025-08-10T15:30:00', 'minuano', 'poco-das-antas', 1, 2, 'Canudos do Vale'),
  mkMatch('m09', 1, 'Rodada 1', '2025-08-10T15:30:00', 'navegantes', 'canabarrense', 0, 2, 'Encantado'),

  // ── R2 - 17/08 - Classificatória ──
  mkMatch('m10', 2, 'Rodada 2', '2025-08-17T15:30:00', 'sete-de-setembro', 'imigrante', 2, 2, 'Arroio do Meio'),
  mkMatch('m11', 2, 'Rodada 2', '2025-08-17T15:30:00', 'tiradentes', 'serrano', 1, 1, 'Nova Bréscia'),
  mkMatch('m12', 2, 'Rodada 2', '2025-08-17T15:30:00', 'juventude-guapore', 'estudiantes', 3, 3, 'Guaporé'),
  mkMatch('m13', 2, 'Rodada 2', '2025-08-17T15:30:00', 'brasil', 'ecas', 3, 0, 'Marques de Souza'),
  mkMatch('m14', 2, 'Rodada 2', '2025-08-17T15:30:00', 'nacional', 'boavistense', 1, 0, 'Forquetinha'),
  mkMatch('m15', 2, 'Rodada 2', '2025-08-17T15:30:00', 'poco-das-antas', 'rudibar', 3, 3, 'Poço das Antas'),
  mkMatch('m16', 2, 'Rodada 2', '2025-08-17T15:30:00', 'canabarrense', 'minuano', 0, 2, 'Teutônia'),
  mkMatch('m17', 2, 'Rodada 2', '2025-08-17T15:30:00', 'juventude-westfalia', 'navegantes', 3, 2, 'Westfália'),

  // ── R3 - 31/08 - Classificatória ──
  mkMatch('m18', 3, 'Rodada 3', '2025-08-31T15:30:00', 'minuano', 'juventude-westfalia', 1, 0, 'Canudos do Vale'),
  mkMatch('m19', 3, 'Rodada 3', '2025-08-31T15:30:00', 'gaucho-progresso', 'sete-de-setembro', 0, 2, 'Progresso'),
  mkMatch('m20', 3, 'Rodada 3', '2025-08-31T15:30:00', 'rudibar', 'canabarrense', 0, 3, 'Bom Retiro do Sul'),
  mkMatch('m21', 3, 'Rodada 3', '2025-08-31T15:30:00', 'boavistense', 'poco-das-antas', 1, 2, 'Boa Vista do Sul'),
  mkMatch('m22', 3, 'Rodada 3', '2025-08-31T15:30:00', 'ecas', 'nacional', 3, 0, 'Imigrante'),
  mkMatch('m23', 3, 'Rodada 3', '2025-08-31T15:30:00', 'estudiantes', 'brasil', 2, 3, 'Lajeado'),
  mkMatch('m24', 3, 'Rodada 3', '2025-08-31T15:30:00', 'serrano', 'juventude-guapore', 2, 0, 'Encantado'),
  mkMatch('m25', 3, 'Rodada 3', '2025-08-31T15:30:00', 'gaucho-teutonia', 'tiradentes', 1, 2, 'Teutônia'),
  mkMatch('m26', 3, 'Rodada 3', '2025-08-31T15:30:00', 'imigrante', 'taquariense', 2, 3, 'Nova Bréscia'),

  // ── R4 - 07/09 - Classificatória ──
  mkMatch('m27', 4, 'Rodada 4', '2025-09-07T15:30:00', 'minuano', 'navegantes', 1, 2, 'Canudos do Vale'),
  mkMatch('m28', 4, 'Rodada 4', '2025-09-07T15:30:00', 'rudibar', 'gaucho-progresso', 2, 1, 'Bom Retiro do Sul'),
  mkMatch('m29', 4, 'Rodada 4', '2025-09-07T15:30:00', 'boavistense', 'juventude-westfalia', 0, 0, 'Boa Vista do Sul'),
  mkMatch('m30', 4, 'Rodada 4', '2025-09-07T15:30:00', 'estudiantes', 'poco-das-antas', 3, 2, 'Lajeado'),
  mkMatch('m31', 4, 'Rodada 4', '2025-09-07T15:30:00', 'serrano', 'nacional', 2, 0, 'Encantado'),
  mkMatch('m32', 4, 'Rodada 4', '2025-09-07T15:30:00', 'gaucho-teutonia', 'brasil', 1, 3, 'Teutônia'),

  // ── R5 - 14/09 - Classificatória ──
  mkMatch('m33', 5, 'Rodada 5', '2025-09-14T15:30:00', 'navegantes', 'taquariense', 0, 2, 'Encantado'),
  mkMatch('m34', 5, 'Rodada 5', '2025-09-14T15:30:00', 'canabarrense', 'gaucho-progresso', 2, 0, 'Teutônia'),
  mkMatch('m35', 5, 'Rodada 5', '2025-09-14T15:30:00', 'sete-de-setembro', 'tiradentes', 0, 2, 'Arroio do Meio'),

  // ── R6 - 28/09 - Classificatória ──
  mkMatch('m36', 6, 'Rodada 6', '2025-09-28T15:30:00', 'ecas', 'canabarrense', 1, 2, 'Imigrante'),
  mkMatch('m37', 6, 'Rodada 6', '2025-09-28T15:30:00', 'navegantes', 'gaucho-progresso', 1, 2, 'Encantado'),
  mkMatch('m38', 6, 'Rodada 6', '2025-09-28T15:30:00', 'imigrante', 'juventude-guapore', 3, 2, 'Nova Bréscia'),
  mkMatch('m39', 6, 'Rodada 6', '2025-09-28T15:30:00', 'taquariense', 'gaucho-teutonia', 1, 1, 'Taquari'),
  mkMatch('m40', 6, 'Rodada 6', '2025-09-28T15:30:00', 'brasil', 'rudibar', 3, 1, 'Marques de Souza'),

  // ── Oitavas - Ida - 05/10 ──
  mkMatch('m41', 7, 'Oitavas - Ida', '2025-10-05T15:30:00', 'sete-de-setembro', 'serrano', 0, 4, 'Arroio do Meio'),
  mkMatch('m42', 7, 'Oitavas - Ida', '2025-10-05T15:30:00', 'poco-das-antas', 'navegantes', 4, 1, 'Poço das Antas'),
  mkMatch('m43', 7, 'Oitavas - Ida', '2025-10-05T15:30:00', 'nacional', 'minuano', 2, 1, 'Forquetinha'),
  mkMatch('m44', 7, 'Oitavas - Ida', '2025-10-05T15:30:00', 'imigrante', 'gaucho-teutonia', 1, 2, 'Nova Bréscia'),
  mkMatch('m45', 7, 'Oitavas - Ida', '2025-10-05T15:30:00', 'tiradentes', 'ecas', 1, 1, 'Nova Bréscia'),
  mkMatch('m46', 7, 'Oitavas - Ida', '2025-10-05T15:30:00', 'taquariense', 'estudiantes', 3, 2, 'Taquari'),
  mkMatch('m47', 7, 'Oitavas - Ida', '2025-10-05T15:30:00', 'juventude-guapore', 'boavistense', 5, 0, 'Guaporé'),
  mkMatch('m48', 7, 'Oitavas - Ida', '2025-10-05T15:30:00', 'gaucho-progresso', 'juventude-westfalia', 0, 0, 'Progresso'),

  // ── Oitavas - Volta - 12/10 ──
  mkMatch('m49', 8, 'Oitavas - Volta', '2025-10-12T15:30:00', 'brasil', 'serrano', 2, 0, 'Marques de Souza'),
  mkMatch('m50', 8, 'Oitavas - Volta', '2025-10-12T15:30:00', 'nacional', 'estudiantes', 1, 1, 'Forquetinha'),
  mkMatch('m51', 8, 'Oitavas - Volta', '2025-10-12T15:30:00', 'gaucho-progresso', 'minuano', 0, 2, 'Progresso'),
  mkMatch('m52', 8, 'Oitavas - Volta', '2025-10-12T15:30:00', 'juventude-westfalia', 'rudibar', 1, 2, 'Westfália'),
  mkMatch('m53', 8, 'Oitavas - Volta', '2025-10-12T15:30:00', 'canabarrense', 'boavistense', 1, 1, 'Teutônia'),
  mkMatch('m54', 8, 'Oitavas - Volta', '2025-10-12T15:30:00', 'poco-das-antas', 'ecas', 1, 2, 'Poço das Antas'),
  mkMatch('m55', 8, 'Oitavas - Volta', '2025-10-12T15:30:00', 'juventude-guapore', 'gaucho-teutonia', 0, 0, 'Guaporé'),
  mkMatch('m56', 8, 'Oitavas - Volta', '2025-10-12T15:30:00', 'tiradentes', 'imigrante', 5, 0, 'Nova Bréscia'),
  mkMatch('m57', 8, 'Oitavas - Volta', '2025-10-12T15:30:00', 'taquariense', 'sete-de-setembro', 2, 2, 'Taquari'),

  // ── Quartas - Ida - 19/10 ──
  mkMatch('m58', 9, 'Quartas - Ida', '2025-10-19T15:30:00', 'ecas', 'minuano', 1, 3, 'Imigrante'),
  mkMatch('m59', 9, 'Quartas - Ida', '2025-10-19T15:30:00', 'gaucho-teutonia', 'nacional', 0, 0, 'Teutônia'),
  mkMatch('m60', 9, 'Quartas - Ida', '2025-10-19T15:30:00', 'rudibar', 'poco-das-antas', 0, 1, 'Bom Retiro do Sul'),
  mkMatch('m61', 9, 'Quartas - Ida', '2025-10-19T15:30:00', 'imigrante', 'taquariense', 1, 3, 'Nova Bréscia'),
  mkMatch('m62', 9, 'Quartas - Ida', '2025-10-19T15:30:00', 'boavistense', 'serrano', 1, 1, 'Boa Vista do Sul'),
  mkMatch('m63', 9, 'Quartas - Ida', '2025-10-19T15:30:00', 'juventude-westfalia', 'tiradentes', 0, 1, 'Westfália'),
  mkMatch('m64', 9, 'Quartas - Ida', '2025-10-19T15:30:00', 'estudiantes', 'brasil', 0, 0, 'Lajeado'),
  mkMatch('m65', 9, 'Quartas - Ida', '2025-10-19T15:30:00', 'juventude-guapore', 'canabarrense', 0, 2, 'Guaporé'),

  // ── Quartas - Volta - 26/10 ──
  mkMatch('m66', 10, 'Quartas - Volta', '2025-10-26T15:30:00', 'brasil', 'estudiantes', 3, 0, 'Marques de Souza'),
  mkMatch('m67', 10, 'Quartas - Volta', '2025-10-26T15:30:00', 'tiradentes', 'juventude-westfalia', 3, 0, 'Nova Bréscia'),
  mkMatch('m68', 10, 'Quartas - Volta', '2025-10-26T15:30:00', 'serrano', 'boavistense', 2, 1, 'Encantado'),
  mkMatch('m69', 10, 'Quartas - Volta', '2025-10-26T15:30:00', 'canabarrense', 'juventude-guapore', 2, 0, 'Teutônia'),
  mkMatch('m70', 10, 'Quartas - Volta', '2025-10-26T15:30:00', 'taquariense', 'imigrante', 3, 2, 'Taquari'),
  mkMatch('m71', 10, 'Quartas - Volta', '2025-10-26T15:30:00', 'poco-das-antas', 'rudibar', 4, 0, 'Poço das Antas'),
  mkMatch('m72', 10, 'Quartas - Volta', '2025-10-26T15:30:00', 'nacional', 'gaucho-teutonia', 1, 2, 'Forquetinha'),
  mkMatch('m73', 10, 'Quartas - Volta', '2025-10-26T15:30:00', 'minuano', 'ecas', 3, 1, 'Canudos do Vale'),

  // ── Semifinal - Ida - 02/11 ──
  mkMatch('m74', 11, 'Semifinal - Ida', '2025-11-02T15:30:00', 'minuano', 'canabarrense', 0, 2, 'Canudos do Vale'),
  mkMatch('m75', 11, 'Semifinal - Ida', '2025-11-02T15:30:00', 'taquariense', 'serrano', 2, 0, 'Taquari'),
  mkMatch('m76', 11, 'Semifinal - Ida', '2025-11-02T15:30:00', 'poco-das-antas', 'brasil', 1, 1, 'Poço das Antas'),
  mkMatch('m77', 11, 'Semifinal - Ida', '2025-11-02T15:30:00', 'gaucho-teutonia', 'tiradentes', 0, 1, 'Teutônia'),

  // ── Semifinal - Volta - 16/11 ──
  mkMatch('m78', 12, 'Semifinal - Volta', '2025-11-16T15:30:00', 'tiradentes', 'gaucho-teutonia', 2, 1, 'Nova Bréscia'),
  mkMatch('m79', 12, 'Semifinal - Volta', '2025-11-16T15:30:00', 'canabarrense', 'minuano', 1, 0, 'Teutônia'),
  mkMatch('m80', 12, 'Semifinal - Volta', '2025-11-16T15:30:00', 'brasil', 'poco-das-antas', 1, 1, 'Marques de Souza', 4, 5),
  mkMatch('m81', 12, 'Semifinal - Volta', '2025-11-16T15:30:00', 'serrano', 'taquariense', 3, 0, 'Encantado', 3, 4),

  // ── Semi 2 - Ida - 23/11 ──
  mkMatch('m82', 13, 'Semi 2 - Ida', '2025-11-23T15:30:00', 'poco-das-antas', 'tiradentes', 2, 2, 'Poço das Antas'),
  mkMatch('m83', 13, 'Semi 2 - Ida', '2025-11-23T15:30:00', 'taquariense', 'canabarrense', 1, 2, 'Taquari'),

  // ── Semi 2 - Volta - 30/11 ──
  mkMatch('m84', 14, 'Semi 2 - Volta', '2025-11-30T15:30:00', 'tiradentes', 'poco-das-antas', 1, 1, 'Nova Bréscia', 2, 3),
  mkMatch('m85', 14, 'Semi 2 - Volta', '2025-11-30T15:30:00', 'canabarrense', 'taquariense', 0, 2, 'Teutônia', 2, 4),

  // ── Final - Ida - 14/12 ──
  mkMatch('m86', 15, 'Final - Ida', '2025-12-14T15:30:00', 'poco-das-antas', 'taquariense', 1, 1, 'Poço das Antas'),

  // ── Final - Volta - 21/12 ──
  mkMatch('m87', 16, 'Final - Volta', '2025-12-21T15:30:00', 'taquariense', 'poco-das-antas', 4, 2, 'Taquari'),
];

// ============================================================================
// SCORER PLAYERS (28 top scorers as SQLPlayer objects)
// ============================================================================
export const SCORER_PLAYERS: SQLPlayer[] = [
  { id: 'p01', team_id: teamIdBySlug('poco-das-antas'), name: 'Maicon Benini', number: '9', position: 'Atacante' },
  { id: 'p02', team_id: teamIdBySlug('taquariense'), name: 'Theylor H. S. Gularte', number: '10', position: 'Atacante' },
  { id: 'p03', team_id: teamIdBySlug('tiradentes'), name: 'João Felipe de Moura', number: '11', position: 'Atacante' },
  { id: 'p04', team_id: teamIdBySlug('taquariense'), name: 'Andrei L. Macedo Rosa', number: '7', position: 'Atacante' },
  { id: 'p05', team_id: teamIdBySlug('canabarrense'), name: 'Leandro Mauri', number: '9', position: 'Atacante' },
  { id: 'p06', team_id: teamIdBySlug('serrano'), name: 'Diego Altnetter da Costa', number: '10', position: 'Atacante' },
  { id: 'p07', team_id: teamIdBySlug('estudiantes'), name: 'Felipe Gedoz da Conceição', number: '8', position: 'Atacante' },
  { id: 'p08', team_id: teamIdBySlug('poco-das-antas'), name: 'Yan Henrique Claro Lima', number: '7', position: 'Atacante' },
  { id: 'p09', team_id: teamIdBySlug('brasil'), name: 'Wiliam Samuel Dresch', number: '11', position: 'Atacante' },
  { id: 'p10', team_id: teamIdBySlug('brasil'), name: 'Willian A. Kochenborger', number: '9', position: 'Atacante' },
  { id: 'p11', team_id: teamIdBySlug('gaucho-teutonia'), name: 'Fabrício Dutra Corrêa', number: '10', position: 'Atacante' },
  { id: 'p12', team_id: teamIdBySlug('tiradentes'), name: 'Roberson de Arruda Alves', number: '7', position: 'Atacante' },
  { id: 'p13', team_id: teamIdBySlug('poco-das-antas'), name: 'João Carlos Simões Neto', number: '11', position: 'Atacante' },
  { id: 'p14', team_id: teamIdBySlug('navegantes'), name: 'Eduardo Capella', number: '10', position: 'Atacante' },
  { id: 'p15', team_id: teamIdBySlug('brasil'), name: 'Lucas Lima Lopes', number: '8', position: 'Atacante' },
  { id: 'p16', team_id: teamIdBySlug('imigrante'), name: 'Marcus V. Konzen', number: '9', position: 'Atacante' },
  { id: 'p17', team_id: teamIdBySlug('minuano'), name: 'Alan G. da Silva', number: '10', position: 'Atacante' },
  { id: 'p18', team_id: teamIdBySlug('minuano'), name: 'Fabio Carpes Rosa', number: '7', position: 'Atacante' },
  { id: 'p19', team_id: teamIdBySlug('poco-das-antas'), name: 'Luiz G. Lopes da Cruz', number: '8', position: 'Atacante' },
  { id: 'p20', team_id: teamIdBySlug('ecas'), name: 'Edgar Calgaroto Filho', number: '9', position: 'Atacante' },
  { id: 'p21', team_id: teamIdBySlug('ecas'), name: 'Emerson A. M. A. Varela', number: '11', position: 'Atacante' },
  { id: 'p22', team_id: teamIdBySlug('juventude-guapore'), name: 'Patrick Dalbosco Pinto', number: '9', position: 'Atacante' },
  { id: 'p23', team_id: teamIdBySlug('taquariense'), name: 'Alisson R. Santos Tobias', number: '11', position: 'Atacante' },
  { id: 'p24', team_id: teamIdBySlug('canabarrense'), name: 'Juliano Fogaça Soares', number: '7', position: 'Atacante' },
  { id: 'p25', team_id: teamIdBySlug('serrano'), name: 'Alexandre Possamai', number: '9', position: 'Atacante' },
  { id: 'p26', team_id: teamIdBySlug('tiradentes'), name: 'Alisson da Rosa', number: '8', position: 'Atacante' },
  { id: 'p27', team_id: teamIdBySlug('tiradentes'), name: 'Matheus Andrigo do Couto', number: '10', position: 'Atacante' },
  { id: 'p28', team_id: teamIdBySlug('taquariense'), name: 'Guilherme Ferreira da Silva', number: '8', position: 'Atacante' },
];

// ============================================================================
// SCORERS (ScorerEntry format for display)
// ============================================================================
const logoBySlug = (slug: string): string => teamBySlug(slug).logo_url;

export const SCORERS: ScorerEntry[] = [
  { playerId: 'p01', playerName: 'Maicon Benini', teamSlug: 'poco-das-antas', teamName: 'POC', teamLogo: logoBySlug('poco-das-antas'), teamColor: '#E76F51', goals: 9 },
  { playerId: 'p02', playerName: 'Theylor H. S. Gularte', teamSlug: 'taquariense', teamName: 'TAQ', teamLogo: logoBySlug('taquariense'), teamColor: '#006633', goals: 9 },
  { playerId: 'p03', playerName: 'João Felipe de Moura', teamSlug: 'tiradentes', teamName: 'TIR', teamLogo: logoBySlug('tiradentes'), teamColor: '#9B2335', goals: 8 },
  { playerId: 'p04', playerName: 'Andrei L. Macedo Rosa', teamSlug: 'taquariense', teamName: 'TAQ', teamLogo: logoBySlug('taquariense'), teamColor: '#006633', goals: 6 },
  { playerId: 'p05', playerName: 'Leandro Mauri', teamSlug: 'canabarrense', teamName: 'CAN', teamLogo: logoBySlug('canabarrense'), teamColor: '#1D3557', goals: 6 },
  { playerId: 'p06', playerName: 'Diego Altnetter da Costa', teamSlug: 'serrano', teamName: 'SER', teamLogo: logoBySlug('serrano'), teamColor: '#2D6A4F', goals: 6 },
  { playerId: 'p07', playerName: 'Felipe Gedoz da Conceição', teamSlug: 'estudiantes', teamName: 'EST', teamLogo: logoBySlug('estudiantes'), teamColor: '#6C757D', goals: 5 },
  { playerId: 'p08', playerName: 'Yan Henrique Claro Lima', teamSlug: 'poco-das-antas', teamName: 'POC', teamLogo: logoBySlug('poco-das-antas'), teamColor: '#E76F51', goals: 5 },
  { playerId: 'p09', playerName: 'Wiliam Samuel Dresch', teamSlug: 'brasil', teamName: 'BRA', teamLogo: logoBySlug('brasil'), teamColor: '#009739', goals: 4 },
  { playerId: 'p10', playerName: 'Willian A. Kochenborger', teamSlug: 'brasil', teamName: 'BRA', teamLogo: logoBySlug('brasil'), teamColor: '#009739', goals: 4 },
  { playerId: 'p11', playerName: 'Fabrício Dutra Corrêa', teamSlug: 'gaucho-teutonia', teamName: 'GAU', teamLogo: logoBySlug('gaucho-teutonia'), teamColor: '#E63946', goals: 4 },
  { playerId: 'p12', playerName: 'Roberson de Arruda Alves', teamSlug: 'tiradentes', teamName: 'TIR', teamLogo: logoBySlug('tiradentes'), teamColor: '#9B2335', goals: 4 },
  { playerId: 'p13', playerName: 'João Carlos Simões Neto', teamSlug: 'poco-das-antas', teamName: 'POC', teamLogo: logoBySlug('poco-das-antas'), teamColor: '#E76F51', goals: 4 },
  { playerId: 'p14', playerName: 'Eduardo Capella', teamSlug: 'navegantes', teamName: 'NAV', teamLogo: logoBySlug('navegantes'), teamColor: '#495057', goals: 3 },
  { playerId: 'p15', playerName: 'Lucas Lima Lopes', teamSlug: 'brasil', teamName: 'BRA', teamLogo: logoBySlug('brasil'), teamColor: '#009739', goals: 3 },
  { playerId: 'p16', playerName: 'Marcus V. Konzen', teamSlug: 'imigrante', teamName: 'IMI', teamLogo: logoBySlug('imigrante'), teamColor: '#BC4749', goals: 3 },
  { playerId: 'p17', playerName: 'Alan G. da Silva', teamSlug: 'minuano', teamName: 'MIN', teamLogo: logoBySlug('minuano'), teamColor: '#023E8A', goals: 3 },
  { playerId: 'p18', playerName: 'Fabio Carpes Rosa', teamSlug: 'minuano', teamName: 'MIN', teamLogo: logoBySlug('minuano'), teamColor: '#023E8A', goals: 3 },
  { playerId: 'p19', playerName: 'Luiz G. Lopes da Cruz', teamSlug: 'poco-das-antas', teamName: 'POC', teamLogo: logoBySlug('poco-das-antas'), teamColor: '#E76F51', goals: 3 },
  { playerId: 'p20', playerName: 'Edgar Calgaroto Filho', teamSlug: 'ecas', teamName: 'ECA', teamLogo: logoBySlug('ecas'), teamColor: '#6A0572', goals: 3 },
  { playerId: 'p21', playerName: 'Emerson A. M. A. Varela', teamSlug: 'ecas', teamName: 'ECA', teamLogo: logoBySlug('ecas'), teamColor: '#6A0572', goals: 3 },
  { playerId: 'p22', playerName: 'Patrick Dalbosco Pinto', teamSlug: 'juventude-guapore', teamName: 'JUG', teamLogo: logoBySlug('juventude-guapore'), teamColor: '#386641', goals: 3 },
  { playerId: 'p23', playerName: 'Alisson R. Santos Tobias', teamSlug: 'taquariense', teamName: 'TAQ', teamLogo: logoBySlug('taquariense'), teamColor: '#006633', goals: 3 },
  { playerId: 'p24', playerName: 'Juliano Fogaça Soares', teamSlug: 'canabarrense', teamName: 'CAN', teamLogo: logoBySlug('canabarrense'), teamColor: '#1D3557', goals: 3 },
  { playerId: 'p25', playerName: 'Alexandre Possamai', teamSlug: 'serrano', teamName: 'SER', teamLogo: logoBySlug('serrano'), teamColor: '#2D6A4F', goals: 3 },
  { playerId: 'p26', playerName: 'Alisson da Rosa', teamSlug: 'tiradentes', teamName: 'TIR', teamLogo: logoBySlug('tiradentes'), teamColor: '#9B2335', goals: 3 },
  { playerId: 'p27', playerName: 'Matheus Andrigo do Couto', teamSlug: 'tiradentes', teamName: 'TIR', teamLogo: logoBySlug('tiradentes'), teamColor: '#9B2335', goals: 3 },
  { playerId: 'p28', playerName: 'Guilherme Ferreira da Silva', teamSlug: 'taquariense', teamName: 'TAQ', teamLogo: logoBySlug('taquariense'), teamColor: '#006633', goals: 3 },
];

// ============================================================================
// STANDINGS DATA (real classification - 19 teams)
// ============================================================================
export const STANDINGS_DATA: StandingEntry[] = [
  { pos: 1,  teamId: 'canabarrense',       team: teamBySlug('canabarrense'),       tpg: 28, j: 12, v: 9, e: 1, d: 2, gp: 19, gc: 7,  sg: 12,  ca: 25, cv: 1, disc: 300, pct: 78 },
  { pos: 2,  teamId: 'tiradentes',          team: teamBySlug('tiradentes'),          tpg: 28, j: 12, v: 8, e: 4, d: 0, gp: 23, gc: 8,  sg: 15,  ca: 27, cv: 2, disc: 370, pct: 78 },
  { pos: 3,  teamId: 'taquariense',         team: teamBySlug('taquariense'),         tpg: 27, j: 14, v: 8, e: 3, d: 3, gp: 27, gc: 19, sg: 8,   ca: 42, cv: 2, disc: 520, pct: 64 },
  { pos: 4,  teamId: 'brasil',              team: teamBySlug('brasil'),              tpg: 21, j: 10, v: 6, e: 3, d: 1, gp: 19, gc: 7,  sg: 12,  ca: 27, cv: 2, disc: 370, pct: 70 },
  { pos: 5,  teamId: 'poco-das-antas',      team: teamBySlug('poco-das-antas'),      tpg: 21, j: 14, v: 5, e: 6, d: 3, gp: 27, gc: 21, sg: 6,   ca: 35, cv: 4, disc: 550, pct: 50 },
  { pos: 6,  teamId: 'serrano',             team: teamBySlug('serrano'),             tpg: 20, j: 10, v: 6, e: 2, d: 2, gp: 16, gc: 7,  sg: 9,   ca: 23, cv: 0, disc: 230, pct: 67 },
  { pos: 7,  teamId: 'minuano',             team: teamBySlug('minuano'),             tpg: 15, j: 10, v: 5, e: 0, d: 5, gp: 14, gc: 11, sg: 3,   ca: 26, cv: 3, disc: 410, pct: 50 },
  { pos: 8,  teamId: 'gaucho-teutonia',     team: teamBySlug('gaucho-teutonia'),     tpg: 12, j: 10, v: 3, e: 3, d: 4, gp: 10, gc: 11, sg: -1,  ca: 23, cv: 3, disc: 380, pct: 40 },
  { pos: 9,  teamId: 'nacional',            team: teamBySlug('nacional'),            tpg: 11, j: 8,  v: 3, e: 2, d: 3, gp: 7,  gc: 9,  sg: -2,  ca: 31, cv: 4, disc: 510, pct: 46 },
  { pos: 10, teamId: 'ecas',                team: teamBySlug('ecas'),                tpg: 8,  j: 8,  v: 2, e: 2, d: 4, gp: 10, gc: 14, sg: -4,  ca: 13, cv: 2, disc: 230, pct: 33 },
  { pos: 11, teamId: 'rudibar',             team: teamBySlug('rudibar'),             tpg: 7,  j: 8,  v: 2, e: 1, d: 5, gp: 8,  gc: 18, sg: -10, ca: 17, cv: 2, disc: 270, pct: 29 },
  { pos: 12, teamId: 'imigrante',           team: teamBySlug('imigrante'),           tpg: 7,  j: 8,  v: 2, e: 1, d: 5, gp: 13, gc: 20, sg: -7,  ca: 22, cv: 4, disc: 420, pct: 29 },
  { pos: 13, teamId: 'juventude-guapore',   team: teamBySlug('juventude-guapore'),   tpg: 6,  j: 8,  v: 1, e: 3, d: 4, gp: 11, gc: 13, sg: -2,  ca: 17, cv: 1, disc: 220, pct: 25 },
  { pos: 14, teamId: 'boavistense',         team: teamBySlug('boavistense'),         tpg: 6,  j: 8,  v: 1, e: 3, d: 4, gp: 5,  gc: 12, sg: -7,  ca: 18, cv: 1, disc: 230, pct: 25 },
  { pos: 15, teamId: 'estudiantes',         team: teamBySlug('estudiantes'),         tpg: 6,  j: 8,  v: 1, e: 3, d: 4, gp: 12, gc: 17, sg: -5,  ca: 30, cv: 0, disc: 300, pct: 25 },
  { pos: 16, teamId: 'juventude-westfalia', team: teamBySlug('juventude-westfalia'), tpg: 5,  j: 8,  v: 1, e: 2, d: 5, gp: 4,  gc: 11, sg: -7,  ca: 26, cv: 0, disc: 260, pct: 21 },
  { pos: 17, teamId: 'sete-de-setembro',    team: teamBySlug('sete-de-setembro'),    tpg: 5,  j: 6,  v: 1, e: 2, d: 3, gp: 6,  gc: 12, sg: -6,  ca: 15, cv: 0, disc: 150, pct: 28 },
  { pos: 18, teamId: 'gaucho-progresso',    team: teamBySlug('gaucho-progresso'),    tpg: 4,  j: 6,  v: 1, e: 1, d: 4, gp: 3,  gc: 9,  sg: -6,  ca: 17, cv: 6, disc: 470, pct: 22 },
  { pos: 19, teamId: 'navegantes',          team: teamBySlug('navegantes'),          tpg: 3,  j: 6,  v: 1, e: 0, d: 5, gp: 6,  gc: 14, sg: -8,  ca: 15, cv: 6, disc: 450, pct: 17 },
];

// ============================================================================
// BOLÃO PARTICIPANTS (15 fictional participants)
// ============================================================================
export interface BolaoParticipant {
  id: string;
  name: string;
  avatar: string;
  points: number;
  exactScores: number;
  rightResults: number;
  badge: string;
  predictions: BolaoPrediction[];
}

export interface BolaoPrediction {
  matchId: string;
  homeSlug: string;
  awaySlug: string;
  realScoreHome: number;
  realScoreAway: number;
  guessHome: number;
  guessAway: number;
  pointsEarned: number;
}

function pred(
  matchId: string,
  homeSlug: string,
  awaySlug: string,
  realH: number,
  realA: number,
  guessH: number,
  guessA: number,
): BolaoPrediction {
  let pts = 0;
  if (guessH === realH && guessA === realA) {
    pts = 10;
  } else {
    const realResult = realH > realA ? 'H' : realH < realA ? 'A' : 'D';
    const guessResult = guessH > guessA ? 'H' : guessH < guessA ? 'A' : 'D';
    if (realResult === guessResult) {
      pts = realResult === 'D' ? 3 : 5;
    }
  }
  return { matchId, homeSlug, awaySlug, realScoreHome: realH, realScoreAway: realA, guessHome: guessH, guessAway: guessA, pointsEarned: pts };
}

export const BOLAO_PARTICIPANTS: BolaoParticipant[] = [
  {
    id: 'b01', name: 'Marcos Kreutz', avatar: 'MK', points: 195, exactScores: 8, rightResults: 23, badge: 'Mestre dos Placares',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 3, 1),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 1, 1),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 2, 1),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 1, 2),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 2, 2),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 1, 2),
      pred('m79', 'canabarrense', 'minuano', 1, 0, 2, 0),
      pred('m78', 'tiradentes', 'gaucho-teutonia', 2, 1, 2, 1),
    ],
  },
  {
    id: 'b02', name: 'Ana Paula Schneider', avatar: 'AS', points: 182, exactScores: 7, rightResults: 22, badge: 'Rainha do Palpite',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 4, 2),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 2, 1),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 1, 1),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 0, 1),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 1, 1),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 0, 2),
    ],
  },
  {
    id: 'b03', name: 'João Pedro Müller', avatar: 'JM', points: 170, exactScores: 6, rightResults: 22, badge: 'Palpiteiro Nato',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 3, 2),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 0, 0),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 0, 2),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 2, 2),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 2, 3),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 2, 2),
      pred('m79', 'canabarrense', 'minuano', 1, 0, 1, 0),
    ],
  },
  {
    id: 'b04', name: 'Claudia Finkler', avatar: 'CF', points: 158, exactScores: 5, rightResults: 21, badge: 'Zebra Hunter',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 2, 1),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 1, 1),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 1, 3),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 0, 2),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 0, 1),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 3, 3),
    ],
  },
  {
    id: 'b05', name: 'Roberto Konzen', avatar: 'RK', points: 145, exactScores: 4, rightResults: 21, badge: 'Veterano do Bolão',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 2, 0),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 0, 1),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 0, 2),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 1, 0),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 1, 2),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 1, 1),
      pred('m79', 'canabarrense', 'minuano', 1, 0, 1, 0),
    ],
  },
  {
    id: 'b06', name: 'Fernanda Eckert', avatar: 'FE', points: 138, exactScores: 4, rightResults: 19, badge: 'Intuição Feminina',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 3, 1),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 2, 2),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 1, 1),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 1, 1),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 2, 2),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 2, 2),
    ],
  },
  {
    id: 'b07', name: 'Carlos Alberto Henn', avatar: 'CH', points: 130, exactScores: 3, rightResults: 19, badge: 'Caxias do Vale',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 2, 1),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 0, 0),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 2, 2),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 2, 0),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 0, 1),
      pred('m79', 'canabarrense', 'minuano', 1, 0, 2, 1),
    ],
  },
  {
    id: 'b08', name: 'Patricia Stoll', avatar: 'PS', points: 122, exactScores: 3, rightResults: 17, badge: 'Boa de Bola',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 4, 2),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 2, 0),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 1, 0),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 2, 1),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 2, 3),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 3, 1),
    ],
  },
  {
    id: 'b09', name: 'Rafael Sperotto', avatar: 'RS', points: 112, exactScores: 2, rightResults: 18, badge: 'Chutador Nato',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 1, 0),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 1, 1),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 0, 3),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 0, 0),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 0, 0),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 1, 0),
      pred('m79', 'canabarrense', 'minuano', 1, 0, 2, 0),
    ],
  },
  {
    id: 'b10', name: 'Juliana Dresch', avatar: 'JD', points: 105, exactScores: 2, rightResults: 17, badge: 'Oráculo do Vale',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 3, 0),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 1, 2),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 0, 2),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 2, 1),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 3, 3),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 0, 0),
    ],
  },
  {
    id: 'b11', name: 'Anderson Becker', avatar: 'AB', points: 95, exactScores: 2, rightResults: 15, badge: 'Torcedor Raiz',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 2, 2),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 0, 1),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 1, 2),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 1, 1),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 2, 0),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 3, 2),
    ],
  },
  {
    id: 'b12', name: 'Maria Eduarda Rübenich', avatar: 'MR', points: 85, exactScores: 1, rightResults: 14, badge: 'Novata Promissora',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 2, 1),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 2, 0),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 0, 1),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 3, 0),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 0, 2),
      pred('m79', 'canabarrense', 'minuano', 1, 0, 0, 1),
    ],
  },
  {
    id: 'b13', name: 'Leandro Graff', avatar: 'LG', points: 72, exactScores: 1, rightResults: 12, badge: 'Fé no Gol',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 1, 1),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 3, 1),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 2, 0),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 0, 2),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 1, 0),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 2, 2),
    ],
  },
  {
    id: 'b14', name: 'Simone Selbach', avatar: 'SS', points: 62, exactScores: 1, rightResults: 10, badge: 'Coração Valente',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 0, 2),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 2, 0),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 1, 0),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 1, 1),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 2, 1),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 0, 3),
    ],
  },
  {
    id: 'b15', name: 'Thiago Brust', avatar: 'TB', points: 52, exactScores: 0, rightResults: 10, badge: 'Persistente',
    predictions: [
      pred('m87', 'taquariense', 'poco-das-antas', 4, 2, 1, 0),
      pred('m86', 'poco-das-antas', 'taquariense', 1, 1, 2, 0),
      pred('m85', 'canabarrense', 'taquariense', 0, 2, 1, 3),
      pred('m84', 'tiradentes', 'poco-das-antas', 1, 1, 3, 1),
      pred('m83', 'taquariense', 'canabarrense', 1, 2, 0, 0),
      pred('m82', 'poco-das-antas', 'tiradentes', 2, 2, 1, 0),
      pred('m79', 'canabarrense', 'minuano', 1, 0, 0, 2),
    ],
  },
];
