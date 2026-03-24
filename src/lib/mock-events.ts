// ============================================================
// MOCK MATCH EVENTS & PLAYER ROSTER
// Generated from real Aslivata 2025 tournament data
// ============================================================
import type { SQLMatchEvent, SQLPlayer } from './supabase';

// ============================
// PLAYER ROSTER
// ============================

export const ALL_PLAYERS: SQLPlayer[] = [
  // ── CANABARRENSE (t01) ──
  { id: 'p0101', team_id: 't01', name: 'Leandro Mauri', number: '9', position: 'FW' },
  { id: 'p0102', team_id: 't01', name: 'Juliano Fogaça Soares', number: '10', position: 'FW' },
  { id: 'p0103', team_id: 't01', name: 'Caio Ávila', number: '2', position: 'DF' },
  { id: 'p0104', team_id: 't01', name: 'Caubi Mass', number: '3', position: 'DF' },
  { id: 'p0105', team_id: 't01', name: 'Dhomini Sales', number: '5', position: 'MF' },
  { id: 'p0106', team_id: 't01', name: 'Leonardo Scherer', number: '4', position: 'DF' },
  { id: 'p0107', team_id: 't01', name: 'Mateus Schoulten', number: '6', position: 'MF' },
  { id: 'p0108', team_id: 't01', name: 'Matheus Navacosquy', number: '8', position: 'MF' },
  { id: 'p0109', team_id: 't01', name: 'Wilson de Oliveira', number: '7', position: 'MF' },
  { id: 'p0110', team_id: 't01', name: 'Rafael Scherer', number: '11', position: 'FW' },
  { id: 'p0111', team_id: 't01', name: 'Anderson Lopes', number: '14', position: 'MF' },
  { id: 'p0112', team_id: 't01', name: 'Bruno Vargas', number: '15', position: 'DF' },
  { id: 'p0113', team_id: 't01', name: 'Marcos Correia', number: '1', position: 'GK' },
  { id: 'p0114', team_id: 't01', name: 'Diego Silveira', number: '16', position: 'MF' },
  { id: 'p0115', team_id: 't01', name: 'Tiago Borges', number: '17', position: 'DF' },
  { id: 'p0116', team_id: 't01', name: 'Felipe Ramos', number: '18', position: 'FW' },

  // ── TIRADENTES (t02) ──
  { id: 'p0201', team_id: 't02', name: 'João Felipe de Moura', number: '9', position: 'FW' },
  { id: 'p0202', team_id: 't02', name: 'Roberson de Arruda Alves', number: '10', position: 'FW' },
  { id: 'p0203', team_id: 't02', name: 'Alisson da Rosa', number: '11', position: 'FW' },
  { id: 'p0204', team_id: 't02', name: 'Matheus Andrigo do Couto', number: '7', position: 'MF' },
  { id: 'p0205', team_id: 't02', name: 'Claudio Guimarães Rosa', number: '4', position: 'DF' },
  { id: 'p0206', team_id: 't02', name: 'Daniel Lucini', number: '5', position: 'DF' },
  { id: 'p0207', team_id: 't02', name: 'Denis Rafael Santos', number: '6', position: 'MF' },
  { id: 'p0208', team_id: 't02', name: 'Douglas Lucini', number: '3', position: 'DF' },
  { id: 'p0209', team_id: 't02', name: 'Felipe Matheus Werner', number: '8', position: 'MF' },
  { id: 'p0210', team_id: 't02', name: 'Guilherme Bitencourt', number: '2', position: 'DF' },
  { id: 'p0211', team_id: 't02', name: 'Ismael Krindges', number: '14', position: 'MF' },
  { id: 'p0212', team_id: 't02', name: 'Marcos Rodrigo Guevedi', number: '15', position: 'DF' },
  { id: 'p0213', team_id: 't02', name: 'Vinicius Machado', number: '16', position: 'MF' },
  { id: 'p0214', team_id: 't02', name: 'Ricardo Fernandes', number: '1', position: 'GK' },
  { id: 'p0215', team_id: 't02', name: 'Leonardo Souza', number: '17', position: 'FW' },
  { id: 'p0216', team_id: 't02', name: 'Thiago Müller', number: '18', position: 'DF' },

  // ── TAQUARIENSE (t03) ──
  { id: 'p0301', team_id: 't03', name: 'Theylor H. S. Gularte', number: '9', position: 'FW' },
  { id: 'p0302', team_id: 't03', name: 'Andrei L. Macedo Rosa', number: '10', position: 'FW' },
  { id: 'p0303', team_id: 't03', name: 'Alisson R. Santos Tobias', number: '11', position: 'MF' },
  { id: 'p0304', team_id: 't03', name: 'Guilherme Ferreira da Silva', number: '7', position: 'MF' },
  { id: 'p0305', team_id: 't03', name: 'Anderson Brandão', number: '4', position: 'DF' },
  { id: 'p0306', team_id: 't03', name: 'Christian Dexter', number: '5', position: 'MF' },
  { id: 'p0307', team_id: 't03', name: 'Douglas Trindade Ramos', number: '3', position: 'DF' },
  { id: 'p0308', team_id: 't03', name: 'Edgar de Oliveira Barbosa', number: '6', position: 'MF' },
  { id: 'p0309', team_id: 't03', name: 'Heitor Corrêa', number: '2', position: 'DF' },
  { id: 'p0310', team_id: 't03', name: 'Yuri da Silva Aquino', number: '8', position: 'MF' },
  { id: 'p0311', team_id: 't03', name: 'Yuri Erich Braga', number: '14', position: 'DF' },
  { id: 'p0312', team_id: 't03', name: 'Lucas Pereira', number: '15', position: 'MF' },
  { id: 'p0313', team_id: 't03', name: 'Luiz Felipe Machado', number: '16', position: 'DF' },
  { id: 'p0314', team_id: 't03', name: 'Bruno da Silva Correia', number: '17', position: 'MF' },
  { id: 'p0315', team_id: 't03', name: 'Franciel Lautert', number: '18', position: 'MF' },
  { id: 'p0316', team_id: 't03', name: 'Rafael Machado', number: '1', position: 'GK' },
  { id: 'p0317', team_id: 't03', name: 'Vinícius Costa', number: '19', position: 'FW' },

  // ── BRASIL (t04) ──
  { id: 'p0401', team_id: 't04', name: 'Wiliam Samuel Dresch', number: '9', position: 'FW' },
  { id: 'p0402', team_id: 't04', name: 'Willian A. Kochenborger', number: '10', position: 'FW' },
  { id: 'p0403', team_id: 't04', name: 'Lucas Lima Lopes', number: '11', position: 'FW' },
  { id: 'p0404', team_id: 't04', name: 'Bruno Coelho Rosa', number: '4', position: 'DF' },
  { id: 'p0405', team_id: 't04', name: 'Bruno Medeiros', number: '5', position: 'MF' },
  { id: 'p0406', team_id: 't04', name: 'Deni Alexander', number: '3', position: 'DF' },
  { id: 'p0407', team_id: 't04', name: 'Diorgenes Brum', number: '6', position: 'MF' },
  { id: 'p0408', team_id: 't04', name: 'Eduardo Kempf', number: '8', position: 'MF' },
  { id: 'p0409', team_id: 't04', name: 'Matheus Henrique', number: '7', position: 'MF' },
  { id: 'p0410', team_id: 't04', name: 'Mathias Barth', number: '2', position: 'DF' },
  { id: 'p0411', team_id: 't04', name: 'Moisés Mendonça', number: '14', position: 'MF' },
  { id: 'p0412', team_id: 't04', name: 'Pedro Pereira Lopes', number: '15', position: 'DF' },
  { id: 'p0413', team_id: 't04', name: 'Vinícius Ribeiro', number: '16', position: 'MF' },
  { id: 'p0414', team_id: 't04', name: 'Welliton Felipe', number: '17', position: 'FW' },
  { id: 'p0415', team_id: 't04', name: 'Willian Samuel Bones', number: '18', position: 'DF' },
  { id: 'p0416', team_id: 't04', name: 'Juliano Kern', number: '19', position: 'MF' },
  { id: 'p0417', team_id: 't04', name: 'Sirio Pereira', number: '20', position: 'MF' },
  { id: 'p0418', team_id: 't04', name: 'Rodrigo Dias', number: '1', position: 'GK' },

  // ── POÇO DAS ANTAS (t05) ──
  { id: 'p0501', team_id: 't05', name: 'Maicon Benini', number: '9', position: 'FW' },
  { id: 'p0502', team_id: 't05', name: 'Yan Henrique Claro Lima', number: '10', position: 'FW' },
  { id: 'p0503', team_id: 't05', name: 'João Carlos Simões Neto', number: '11', position: 'FW' },
  { id: 'p0504', team_id: 't05', name: 'Luiz G. Lopes da Cruz', number: '7', position: 'MF' },
  { id: 'p0505', team_id: 't05', name: 'Alisson da Silva Marques', number: '4', position: 'DF' },
  { id: 'p0506', team_id: 't05', name: 'Cássio dos Santos', number: '5', position: 'MF' },
  { id: 'p0507', team_id: 't05', name: 'Gabriel Aloisio', number: '3', position: 'DF' },
  { id: 'p0508', team_id: 't05', name: 'Gabriel Kremer', number: '6', position: 'MF' },
  { id: 'p0509', team_id: 't05', name: 'Henrique Cronst Paese', number: '2', position: 'DF' },
  { id: 'p0510', team_id: 't05', name: 'Luan Patrick', number: '8', position: 'MF' },
  { id: 'p0511', team_id: 't05', name: 'Maurício Rossoni', number: '14', position: 'DF' },
  { id: 'p0512', team_id: 't05', name: 'Naiel Damião', number: '15', position: 'MF' },
  { id: 'p0513', team_id: 't05', name: 'William Duarte', number: '16', position: 'MF' },
  { id: 'p0514', team_id: 't05', name: 'Winicius Ramos', number: '17', position: 'DF' },
  { id: 'p0515', team_id: 't05', name: 'Márcio Flach', number: '18', position: 'MF' },
  { id: 'p0516', team_id: 't05', name: 'Everton Souza', number: '1', position: 'GK' },

  // ── SERRANO (t06) ──
  { id: 'p0601', team_id: 't06', name: 'Diego Altnetter da Costa', number: '9', position: 'FW' },
  { id: 'p0602', team_id: 't06', name: 'Alexandre Possamai', number: '10', position: 'FW' },
  { id: 'p0603', team_id: 't06', name: 'Airton Chicuta', number: '4', position: 'DF' },
  { id: 'p0604', team_id: 't06', name: 'Everton Diego Martins', number: '5', position: 'MF' },
  { id: 'p0605', team_id: 't06', name: 'Rafael Giacomolli', number: '3', position: 'DF' },
  { id: 'p0606', team_id: 't06', name: 'Ricardo Dorigon', number: '6', position: 'MF' },
  { id: 'p0607', team_id: 't06', name: 'Rodrigo Sirena Elias', number: '8', position: 'MF' },
  { id: 'p0608', team_id: 't06', name: 'Rondinelly de Andrade Silva', number: '2', position: 'DF' },
  { id: 'p0609', team_id: 't06', name: 'Wagner da Silva', number: '7', position: 'MF' },
  { id: 'p0610', team_id: 't06', name: 'Fabiano Fraporti', number: '14', position: 'DF' },
  { id: 'p0611', team_id: 't06', name: 'Marcos Almeida', number: '11', position: 'FW' },
  { id: 'p0612', team_id: 't06', name: 'Carlos Henrique Silva', number: '15', position: 'MF' },
  { id: 'p0613', team_id: 't06', name: 'Fernando Oliveira', number: '1', position: 'GK' },
  { id: 'p0614', team_id: 't06', name: 'André Machado', number: '16', position: 'DF' },

  // ── MINUANO (t07) ──
  { id: 'p0701', team_id: 't07', name: 'Alan G. da Silva', number: '9', position: 'FW' },
  { id: 'p0702', team_id: 't07', name: 'Fabio Carpes Rosa', number: '10', position: 'FW' },
  { id: 'p0703', team_id: 't07', name: 'Afonso Leonel', number: '4', position: 'DF' },
  { id: 'p0704', team_id: 't07', name: 'Christian Raphael', number: '5', position: 'MF' },
  { id: 'p0705', team_id: 't07', name: 'Cleifer Lupian', number: '3', position: 'DF' },
  { id: 'p0706', team_id: 't07', name: 'Emanuel Nunes', number: '6', position: 'MF' },
  { id: 'p0707', team_id: 't07', name: 'Fernando Daniel', number: '8', position: 'MF' },
  { id: 'p0708', team_id: 't07', name: 'Isaías Araújo', number: '2', position: 'DF' },
  { id: 'p0709', team_id: 't07', name: 'Jeferson de Oliveira', number: '7', position: 'MF' },
  { id: 'p0710', team_id: 't07', name: 'Lucas de Jesus', number: '11', position: 'FW' },
  { id: 'p0711', team_id: 't07', name: 'Maiquel Vargas', number: '14', position: 'MF' },
  { id: 'p0712', team_id: 't07', name: 'Victor Souza', number: '15', position: 'DF' },
  { id: 'p0713', team_id: 't07', name: 'Rodrigo Felício', number: '16', position: 'MF' },
  { id: 'p0714', team_id: 't07', name: 'Gustavo Pires', number: '1', position: 'GK' },
  { id: 'p0715', team_id: 't07', name: 'Diego Martins', number: '17', position: 'FW' },

  // ── GAÚCHO TEUTÔNIA (t08) ──
  { id: 'p0801', team_id: 't08', name: 'Fabrício Dutra Corrêa', number: '9', position: 'FW' },
  { id: 'p0802', team_id: 't08', name: 'Cleiton de Oliveira Velasques', number: '4', position: 'DF' },
  { id: 'p0803', team_id: 't08', name: 'Elias dos Santos Bueno', number: '5', position: 'MF' },
  { id: 'p0804', team_id: 't08', name: 'Frederico Burgel', number: '3', position: 'DF' },
  { id: 'p0805', team_id: 't08', name: 'Henrique da Silva', number: '6', position: 'MF' },
  { id: 'p0806', team_id: 't08', name: 'João Pedro Bardales', number: '8', position: 'MF' },
  { id: 'p0807', team_id: 't08', name: 'Josué Alves', number: '2', position: 'DF' },
  { id: 'p0808', team_id: 't08', name: 'Laércio Solda', number: '7', position: 'MF' },
  { id: 'p0809', team_id: 't08', name: 'Márcio Lima', number: '10', position: 'MF' },
  { id: 'p0810', team_id: 't08', name: 'Nicolas Fernandes', number: '11', position: 'FW' },
  { id: 'p0811', team_id: 't08', name: 'Wesley Neiva', number: '14', position: 'MF' },
  { id: 'p0812', team_id: 't08', name: 'Rafael Gonçalves', number: '15', position: 'FW' },
  { id: 'p0813', team_id: 't08', name: 'Luciano Ferreira', number: '1', position: 'GK' },
  { id: 'p0814', team_id: 't08', name: 'Tiago Kremer', number: '16', position: 'DF' },

  // ── NACIONAL (t09) ──
  { id: 'p0901', team_id: 't09', name: 'Bruno Bairros', number: '9', position: 'FW' },
  { id: 'p0902', team_id: 't09', name: 'Douglas Duarte Gandon', number: '4', position: 'DF' },
  { id: 'p0903', team_id: 't09', name: 'Douglas Gustavo Santos', number: '5', position: 'MF' },
  { id: 'p0904', team_id: 't09', name: 'Giovani Darnei', number: '10', position: 'MF' },
  { id: 'p0905', team_id: 't09', name: 'Guilherme de Matos Bitencourt', number: '3', position: 'DF' },
  { id: 'p0906', team_id: 't09', name: 'Guilherme Henrique Walter', number: '6', position: 'MF' },
  { id: 'p0907', team_id: 't09', name: 'Henrique Petrini', number: '8', position: 'MF' },
  { id: 'p0908', team_id: 't09', name: 'Josué Corrêa', number: '2', position: 'DF' },
  { id: 'p0909', team_id: 't09', name: 'Leandro Soares', number: '7', position: 'MF' },
  { id: 'p0910', team_id: 't09', name: 'Marco Augusto Marmitt', number: '11', position: 'FW' },
  { id: 'p0911', team_id: 't09', name: 'Shayman Ricardo', number: '14', position: 'FW' },
  { id: 'p0912', team_id: 't09', name: 'Thiago Henrique', number: '15', position: 'DF' },
  { id: 'p0913', team_id: 't09', name: 'Tiago Luís', number: '16', position: 'MF' },
  { id: 'p0914', team_id: 't09', name: 'Cléber Pereira', number: '17', position: 'MF' },
  { id: 'p0915', team_id: 't09', name: 'Rogério Rocha', number: '18', position: 'DF' },
  { id: 'p0916', team_id: 't09', name: 'Felipe Santos', number: '1', position: 'GK' },
  { id: 'p0917', team_id: 't09', name: 'Anderson Moreira', number: '19', position: 'FW' },

  // ── ECAS (t10) ──
  { id: 'p1001', team_id: 't10', name: 'Edgar Calgaroto Filho', number: '9', position: 'FW' },
  { id: 'p1002', team_id: 't10', name: 'Emerson A. M. A. Varela', number: '10', position: 'FW' },
  { id: 'p1003', team_id: 't10', name: 'Rodrigo Pereira', number: '4', position: 'DF' },
  { id: 'p1004', team_id: 't10', name: 'Carlos Eduardo Lima', number: '5', position: 'MF' },
  { id: 'p1005', team_id: 't10', name: 'Marcos Vinícius Prado', number: '6', position: 'MF' },
  { id: 'p1006', team_id: 't10', name: 'Felipe Augusto', number: '8', position: 'MF' },
  { id: 'p1007', team_id: 't10', name: 'Tiago Ramos', number: '7', position: 'MF' },
  { id: 'p1008', team_id: 't10', name: 'Anderson Cunha', number: '3', position: 'DF' },
  { id: 'p1009', team_id: 't10', name: 'Julio Ferreira', number: '2', position: 'DF' },
  { id: 'p1010', team_id: 't10', name: 'Lucas Moreira', number: '11', position: 'FW' },
  { id: 'p1011', team_id: 't10', name: 'Paulo Henrique Dias', number: '1', position: 'GK' },
  { id: 'p1012', team_id: 't10', name: 'Roberto Nascimento', number: '14', position: 'DF' },

  // ── RUDIBAR (t11) ──
  { id: 'p1101', team_id: 't11', name: 'Cristiano Ferreira', number: '9', position: 'FW' },
  { id: 'p1102', team_id: 't11', name: 'Márcio Almeida', number: '10', position: 'MF' },
  { id: 'p1103', team_id: 't11', name: 'Gabriel Pinto', number: '4', position: 'DF' },
  { id: 'p1104', team_id: 't11', name: 'Rafael Moraes', number: '5', position: 'MF' },
  { id: 'p1105', team_id: 't11', name: 'Adriano Costa', number: '6', position: 'MF' },
  { id: 'p1106', team_id: 't11', name: 'Luciano Vargas', number: '3', position: 'DF' },
  { id: 'p1107', team_id: 't11', name: 'Henrique Borges', number: '7', position: 'MF' },
  { id: 'p1108', team_id: 't11', name: 'Thiago Mendes', number: '8', position: 'MF' },
  { id: 'p1109', team_id: 't11', name: 'Diego Ribas', number: '11', position: 'FW' },
  { id: 'p1110', team_id: 't11', name: 'Fábio Cunha', number: '2', position: 'DF' },
  { id: 'p1111', team_id: 't11', name: 'Marcelo Silveira', number: '1', position: 'GK' },
  { id: 'p1112', team_id: 't11', name: 'João Augusto', number: '14', position: 'DF' },

  // ── IMIGRANTE (t12) ──
  { id: 'p1201', team_id: 't12', name: 'Marcus V. Konzen', number: '9', position: 'FW' },
  { id: 'p1202', team_id: 't12', name: 'Rodrigo Dalcin', number: '10', position: 'MF' },
  { id: 'p1203', team_id: 't12', name: 'Leandro Schmitt', number: '4', position: 'DF' },
  { id: 'p1204', team_id: 't12', name: 'Eduardo Konzen', number: '5', position: 'MF' },
  { id: 'p1205', team_id: 't12', name: 'Tiago Brandt', number: '6', position: 'MF' },
  { id: 'p1206', team_id: 't12', name: 'Rafael Kunz', number: '3', position: 'DF' },
  { id: 'p1207', team_id: 't12', name: 'Anderson Becker', number: '7', position: 'MF' },
  { id: 'p1208', team_id: 't12', name: 'Carlos Scherer', number: '8', position: 'MF' },
  { id: 'p1209', team_id: 't12', name: 'Felipe Borges', number: '11', position: 'FW' },
  { id: 'p1210', team_id: 't12', name: 'Gustavo Werner', number: '2', position: 'DF' },
  { id: 'p1211', team_id: 't12', name: 'Matheus Lopes', number: '1', position: 'GK' },
  { id: 'p1212', team_id: 't12', name: 'Bruno Ferreira', number: '14', position: 'DF' },

  // ── JUVENTUDE GUAPORÉ (t13) ──
  { id: 'p1301', team_id: 't13', name: 'Patrick Dalbosco Pinto', number: '9', position: 'FW' },
  { id: 'p1302', team_id: 't13', name: 'Adriano Pereira', number: '10', position: 'MF' },
  { id: 'p1303', team_id: 't13', name: 'Lucas Bianchi', number: '4', position: 'DF' },
  { id: 'p1304', team_id: 't13', name: 'Marcelo Zanini', number: '5', position: 'MF' },
  { id: 'p1305', team_id: 't13', name: 'Felipe Giacomini', number: '6', position: 'MF' },
  { id: 'p1306', team_id: 't13', name: 'Tiago Ferreira', number: '3', position: 'DF' },
  { id: 'p1307', team_id: 't13', name: 'Rafael Sartori', number: '7', position: 'MF' },
  { id: 'p1308', team_id: 't13', name: 'Eduardo Moraes', number: '8', position: 'MF' },
  { id: 'p1309', team_id: 't13', name: 'Bruno Lopes', number: '11', position: 'FW' },
  { id: 'p1310', team_id: 't13', name: 'Guilherme Zanetti', number: '2', position: 'DF' },
  { id: 'p1311', team_id: 't13', name: 'Ricardo Bortolini', number: '1', position: 'GK' },

  // ── BOAVISTENSE (t14) ──
  { id: 'p1401', team_id: 't14', name: 'Cristiano Ramos', number: '9', position: 'FW' },
  { id: 'p1402', team_id: 't14', name: 'Márcio Bianchi', number: '10', position: 'MF' },
  { id: 'p1403', team_id: 't14', name: 'Rafael Pinto', number: '4', position: 'DF' },
  { id: 'p1404', team_id: 't14', name: 'Anderson Ferreira', number: '5', position: 'MF' },
  { id: 'p1405', team_id: 't14', name: 'Felipe Zanella', number: '6', position: 'MF' },
  { id: 'p1406', team_id: 't14', name: 'Leandro Costa', number: '3', position: 'DF' },
  { id: 'p1407', team_id: 't14', name: 'Tiago Farias', number: '7', position: 'MF' },
  { id: 'p1408', team_id: 't14', name: 'Diego Oliveira', number: '8', position: 'MF' },
  { id: 'p1409', team_id: 't14', name: 'Bruno Menezes', number: '11', position: 'FW' },
  { id: 'p1410', team_id: 't14', name: 'Carlos Fontana', number: '2', position: 'DF' },
  { id: 'p1411', team_id: 't14', name: 'Rodrigo Camargo', number: '1', position: 'GK' },

  // ── ESTUDIANTES (t15) ──
  { id: 'p1501', team_id: 't15', name: 'Felipe Gedoz da Conceição', number: '9', position: 'FW' },
  { id: 'p1502', team_id: 't15', name: 'Marcos Schneider', number: '10', position: 'MF' },
  { id: 'p1503', team_id: 't15', name: 'Rafael Ferreira', number: '4', position: 'DF' },
  { id: 'p1504', team_id: 't15', name: 'Leandro Santos', number: '5', position: 'MF' },
  { id: 'p1505', team_id: 't15', name: 'Tiago Gonçalves', number: '6', position: 'MF' },
  { id: 'p1506', team_id: 't15', name: 'Bruno Rodrigues', number: '3', position: 'DF' },
  { id: 'p1507', team_id: 't15', name: 'Diego Almeida', number: '7', position: 'MF' },
  { id: 'p1508', team_id: 't15', name: 'Anderson Souza', number: '8', position: 'MF' },
  { id: 'p1509', team_id: 't15', name: 'Carlos Pereira', number: '11', position: 'FW' },
  { id: 'p1510', team_id: 't15', name: 'Gustavo Lima', number: '2', position: 'DF' },
  { id: 'p1511', team_id: 't15', name: 'Henrique Matos', number: '1', position: 'GK' },

  // ── JUVENTUDE WESTFÁLIA (t16) ──
  { id: 'p1601', team_id: 't16', name: 'Matheus Schramm', number: '9', position: 'FW' },
  { id: 'p1602', team_id: 't16', name: 'Lucas Westfália', number: '10', position: 'MF' },
  { id: 'p1603', team_id: 't16', name: 'Rafael Stumpf', number: '4', position: 'DF' },
  { id: 'p1604', team_id: 't16', name: 'Anderson Dreher', number: '5', position: 'MF' },
  { id: 'p1605', team_id: 't16', name: 'Felipe Konrath', number: '6', position: 'MF' },
  { id: 'p1606', team_id: 't16', name: 'Tiago Weber', number: '3', position: 'DF' },
  { id: 'p1607', team_id: 't16', name: 'Bruno Hackbart', number: '7', position: 'MF' },
  { id: 'p1608', team_id: 't16', name: 'Eduardo Reinke', number: '8', position: 'MF' },
  { id: 'p1609', team_id: 't16', name: 'Diego Kessler', number: '11', position: 'FW' },
  { id: 'p1610', team_id: 't16', name: 'Leandro Schmidt', number: '2', position: 'DF' },
  { id: 'p1611', team_id: 't16', name: 'Marcos Neumann', number: '1', position: 'GK' },

  // ── SETE DE SETEMBRO (t17) ──
  { id: 'p1701', team_id: 't17', name: 'Cristiano Sperb', number: '9', position: 'FW' },
  { id: 'p1702', team_id: 't17', name: 'Rafael Engel', number: '10', position: 'MF' },
  { id: 'p1703', team_id: 't17', name: 'Anderson Müller', number: '4', position: 'DF' },
  { id: 'p1704', team_id: 't17', name: 'Felipe Kroth', number: '5', position: 'MF' },
  { id: 'p1705', team_id: 't17', name: 'Tiago Langner', number: '6', position: 'MF' },
  { id: 'p1706', team_id: 't17', name: 'Bruno Streck', number: '3', position: 'DF' },
  { id: 'p1707', team_id: 't17', name: 'Diego Hammes', number: '7', position: 'MF' },
  { id: 'p1708', team_id: 't17', name: 'Leandro Brust', number: '8', position: 'MF' },
  { id: 'p1709', team_id: 't17', name: 'Marcos Selbach', number: '11', position: 'FW' },
  { id: 'p1710', team_id: 't17', name: 'Carlos Schmitz', number: '2', position: 'DF' },
  { id: 'p1711', team_id: 't17', name: 'Gustavo Noll', number: '1', position: 'GK' },

  // ── GAÚCHO PROGRESSO (t18) ──
  { id: 'p1801', team_id: 't18', name: 'Rodrigo Farias', number: '9', position: 'FW' },
  { id: 'p1802', team_id: 't18', name: 'Marcos Oliveira', number: '10', position: 'MF' },
  { id: 'p1803', team_id: 't18', name: 'Felipe Nunes', number: '4', position: 'DF' },
  { id: 'p1804', team_id: 't18', name: 'Tiago Amaral', number: '5', position: 'MF' },
  { id: 'p1805', team_id: 't18', name: 'Bruno Costa', number: '6', position: 'MF' },
  { id: 'p1806', team_id: 't18', name: 'Anderson Lima', number: '3', position: 'DF' },
  { id: 'p1807', team_id: 't18', name: 'Diego Peres', number: '7', position: 'MF' },
  { id: 'p1808', team_id: 't18', name: 'Leandro Cunha', number: '8', position: 'MF' },
  { id: 'p1809', team_id: 't18', name: 'Carlos Matos', number: '11', position: 'FW' },
  { id: 'p1810', team_id: 't18', name: 'Rafael Duarte', number: '2', position: 'DF' },
  { id: 'p1811', team_id: 't18', name: 'Henrique Leal', number: '1', position: 'GK' },
  { id: 'p1812', team_id: 't18', name: 'Gustavo Prado', number: '14', position: 'MF' },

  // ── NAVEGANTES (t19) ──
  { id: 'p1901', team_id: 't19', name: 'Eduardo Capella', number: '9', position: 'FW' },
  { id: 'p1902', team_id: 't19', name: 'Marcos Vieira', number: '10', position: 'MF' },
  { id: 'p1903', team_id: 't19', name: 'Rafael Lima', number: '4', position: 'DF' },
  { id: 'p1904', team_id: 't19', name: 'Anderson Melo', number: '5', position: 'MF' },
  { id: 'p1905', team_id: 't19', name: 'Felipe Braga', number: '6', position: 'MF' },
  { id: 'p1906', team_id: 't19', name: 'Tiago Cardoso', number: '3', position: 'DF' },
  { id: 'p1907', team_id: 't19', name: 'Bruno Azevedo', number: '7', position: 'MF' },
  { id: 'p1908', team_id: 't19', name: 'Diego Tavares', number: '8', position: 'MF' },
  { id: 'p1909', team_id: 't19', name: 'Leandro Fonseca', number: '11', position: 'FW' },
  { id: 'p1910', team_id: 't19', name: 'Carlos Ribeiro', number: '2', position: 'DF' },
  { id: 'p1911', team_id: 't19', name: 'Gustavo Mendes', number: '1', position: 'GK' },
];

// ============================
// MATCH EVENTS
// ============================

export const MOCK_EVENTS: SQLMatchEvent[] = [
  // ════════════════════════════════════════
  // ROUND 1 (m01-m09)
  // ════════════════════════════════════════

  // m01: rudibar(t11) 0 x 2 nacional(t09)
  { id: 'ev001', match_id: 'm01', event_type: 'goal', player_id: 'p0901', team_id: 't09', minute: 23, half: '1' },
  { id: 'ev002', match_id: 'm01', event_type: 'goal', player_id: 'p0910', team_id: 't09', minute: 67, half: '2' },
  { id: 'ev003', match_id: 'm01', event_type: 'yellow_card', player_id: 'p1103', team_id: 't11', minute: 31, half: '1' },
  { id: 'ev004', match_id: 'm01', event_type: 'yellow_card', player_id: 'p0908', team_id: 't09', minute: 55, half: '2' },

  // m02: juv-westfalia(t16) 0 x 2 imigrante(t12)
  { id: 'ev005', match_id: 'm02', event_type: 'goal', player_id: 'p1201', team_id: 't12', minute: 38, half: '1' },
  { id: 'ev006', match_id: 'm02', event_type: 'goal', player_id: 'p1201', team_id: 't12', minute: 72, half: '2' },
  { id: 'ev007', match_id: 'm02', event_type: 'yellow_card', player_id: 'p1603', team_id: 't16', minute: 44, half: '1' },

  // m03: gaucho-teut(t08) 2 x 0 sete-set(t17)
  { id: 'ev008', match_id: 'm03', event_type: 'goal', player_id: 'p0801', team_id: 't08', minute: 15, half: '1' },
  { id: 'ev009', match_id: 'm03', event_type: 'goal', player_id: 'p0801', team_id: 't08', minute: 58, half: '2' },
  { id: 'ev010', match_id: 'm03', event_type: 'yellow_card', player_id: 'p1703', team_id: 't17', minute: 40, half: '1' },
  { id: 'ev011', match_id: 'm03', event_type: 'yellow_card', player_id: 'p0807', team_id: 't08', minute: 75, half: '2' },

  // m04: serrano(t06) 1 x 0 taquariense(t03)
  { id: 'ev012', match_id: 'm04', event_type: 'goal', player_id: 'p0601', team_id: 't06', minute: 34, half: '1' },
  { id: 'ev013', match_id: 'm04', event_type: 'yellow_card', player_id: 'p0306', team_id: 't03', minute: 62, half: '2' },
  { id: 'ev014', match_id: 'm04', event_type: 'yellow_card', player_id: 'p0603', team_id: 't06', minute: 78, half: '2' },

  // m05: estudiantes(t15) 1 x 2 tiradentes(t02)
  { id: 'ev015', match_id: 'm05', event_type: 'goal', player_id: 'p1501', team_id: 't15', minute: 22, half: '1' },
  { id: 'ev016', match_id: 'm05', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 41, half: '1' },
  { id: 'ev017', match_id: 'm05', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 70, half: '2' },
  { id: 'ev018', match_id: 'm05', event_type: 'yellow_card', player_id: 'p0209', team_id: 't02', minute: 50, half: '2' },
  { id: 'ev019', match_id: 'm05', event_type: 'yellow_card', player_id: 'p1503', team_id: 't15', minute: 65, half: '2' },

  // m06: ecas(t10) 1 x 1 juv-guapore(t13)
  { id: 'ev020', match_id: 'm06', event_type: 'goal', player_id: 'p1001', team_id: 't10', minute: 28, half: '1' },
  { id: 'ev021', match_id: 'm06', event_type: 'goal', player_id: 'p1301', team_id: 't13', minute: 63, half: '2' },
  { id: 'ev022', match_id: 'm06', event_type: 'yellow_card', player_id: 'p1003', team_id: 't10', minute: 45, half: '1' },
  { id: 'ev023', match_id: 'm06', event_type: 'yellow_card', player_id: 'p1306', team_id: 't13', minute: 80, half: '2' },

  // m07: boavistense(t14) 1 x 0 brasil(t04)
  { id: 'ev024', match_id: 'm07', event_type: 'goal', player_id: 'p1401', team_id: 't14', minute: 56, half: '2' },
  { id: 'ev025', match_id: 'm07', event_type: 'yellow_card', player_id: 'p0404', team_id: 't04', minute: 33, half: '1' },
  { id: 'ev026', match_id: 'm07', event_type: 'yellow_card', player_id: 'p1403', team_id: 't14', minute: 72, half: '2' },

  // m08: minuano(t07) 1 x 2 poco-antas(t05)
  { id: 'ev027', match_id: 'm08', event_type: 'goal', player_id: 'p0701', team_id: 't07', minute: 12, half: '1' },
  { id: 'ev028', match_id: 'm08', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 35, half: '1' },
  { id: 'ev029', match_id: 'm08', event_type: 'goal', player_id: 'p0502', team_id: 't05', minute: 82, half: '2' },
  { id: 'ev030', match_id: 'm08', event_type: 'yellow_card', player_id: 'p0711', team_id: 't07', minute: 60, half: '2' },
  { id: 'ev031', match_id: 'm08', event_type: 'yellow_card', player_id: 'p0509', team_id: 't05', minute: 88, half: '2' },

  // m09: navegantes(t19) 0 x 2 canabarrense(t01)
  { id: 'ev032', match_id: 'm09', event_type: 'goal', player_id: 'p0101', team_id: 't01', minute: 19, half: '1' },
  { id: 'ev033', match_id: 'm09', event_type: 'goal', player_id: 'p0101', team_id: 't01', minute: 74, half: '2' },
  { id: 'ev034', match_id: 'm09', event_type: 'yellow_card', player_id: 'p1903', team_id: 't19', minute: 42, half: '1' },
  { id: 'ev035', match_id: 'm09', event_type: 'red_card', player_id: 'p1904', team_id: 't19', minute: 68, half: '2' },

  // ════════════════════════════════════════
  // ROUND 2 (m10-m17)
  // ════════════════════════════════════════

  // m10: sete-set(t17) 2 x 2 imigrante(t12)
  { id: 'ev036', match_id: 'm10', event_type: 'goal', player_id: 'p1701', team_id: 't17', minute: 11, half: '1' },
  { id: 'ev037', match_id: 'm10', event_type: 'goal', player_id: 'p1201', team_id: 't12', minute: 30, half: '1' },
  { id: 'ev038', match_id: 'm10', event_type: 'goal', player_id: 'p1709', team_id: 't17', minute: 55, half: '2' },
  { id: 'ev039', match_id: 'm10', event_type: 'goal', player_id: 'p1209', team_id: 't12', minute: 78, half: '2' },
  { id: 'ev040', match_id: 'm10', event_type: 'yellow_card', player_id: 'p1206', team_id: 't12', minute: 44, half: '1' },
  { id: 'ev041', match_id: 'm10', event_type: 'red_card', player_id: 'p1210', team_id: 't12', minute: 85, half: '2' },

  // m11: tiradentes(t02) 1 x 1 serrano(t06)
  { id: 'ev042', match_id: 'm11', event_type: 'goal', player_id: 'p0202', team_id: 't02', minute: 25, half: '1' },
  { id: 'ev043', match_id: 'm11', event_type: 'goal', player_id: 'p0602', team_id: 't06', minute: 61, half: '2' },
  { id: 'ev044', match_id: 'm11', event_type: 'yellow_card', player_id: 'p0205', team_id: 't02', minute: 39, half: '1' },
  { id: 'ev045', match_id: 'm11', event_type: 'yellow_card', player_id: 'p0604', team_id: 't06', minute: 73, half: '2' },

  // m12: juv-guapore(t13) 3 x 3 estudiantes(t15)
  { id: 'ev046', match_id: 'm12', event_type: 'goal', player_id: 'p1301', team_id: 't13', minute: 8, half: '1' },
  { id: 'ev047', match_id: 'm12', event_type: 'goal', player_id: 'p1501', team_id: 't15', minute: 18, half: '1' },
  { id: 'ev048', match_id: 'm12', event_type: 'goal', player_id: 'p1301', team_id: 't13', minute: 33, half: '1' },
  { id: 'ev049', match_id: 'm12', event_type: 'goal', player_id: 'p1501', team_id: 't15', minute: 52, half: '2' },
  { id: 'ev050', match_id: 'm12', event_type: 'goal', player_id: 'p1302', team_id: 't13', minute: 68, half: '2' },
  { id: 'ev051', match_id: 'm12', event_type: 'goal', player_id: 'p1501', team_id: 't15', minute: 88, half: '2' },
  { id: 'ev052', match_id: 'm12', event_type: 'yellow_card', player_id: 'p1303', team_id: 't13', minute: 42, half: '1' },
  { id: 'ev053', match_id: 'm12', event_type: 'yellow_card', player_id: 'p1504', team_id: 't15', minute: 76, half: '2' },

  // m13: brasil(t04) 3 x 0 ecas(t10)
  { id: 'ev054', match_id: 'm13', event_type: 'goal', player_id: 'p0401', team_id: 't04', minute: 14, half: '1' },
  { id: 'ev055', match_id: 'm13', event_type: 'goal', player_id: 'p0402', team_id: 't04', minute: 40, half: '1' },
  { id: 'ev056', match_id: 'm13', event_type: 'goal', player_id: 'p0403', team_id: 't04', minute: 71, half: '2' },
  { id: 'ev057', match_id: 'm13', event_type: 'yellow_card', player_id: 'p1004', team_id: 't10', minute: 55, half: '2' },
  { id: 'ev058', match_id: 'm13', event_type: 'red_card', player_id: 'p1009', team_id: 't10', minute: 82, half: '2' },

  // m14: nacional(t09) 1 x 0 boavistense(t14)
  { id: 'ev059', match_id: 'm14', event_type: 'goal', player_id: 'p0911', team_id: 't09', minute: 47, half: '2' },
  { id: 'ev060', match_id: 'm14', event_type: 'yellow_card', player_id: 'p0902', team_id: 't09', minute: 29, half: '1' },
  { id: 'ev061', match_id: 'm14', event_type: 'yellow_card', player_id: 'p1406', team_id: 't14', minute: 63, half: '2' },

  // m15: poco-antas(t05) 3 x 3 rudibar(t11)
  { id: 'ev062', match_id: 'm15', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 5, half: '1' },
  { id: 'ev063', match_id: 'm15', event_type: 'goal', player_id: 'p1101', team_id: 't11', minute: 20, half: '1' },
  { id: 'ev064', match_id: 'm15', event_type: 'goal', player_id: 'p0503', team_id: 't05', minute: 37, half: '1' },
  { id: 'ev065', match_id: 'm15', event_type: 'goal', player_id: 'p1109', team_id: 't11', minute: 53, half: '2' },
  { id: 'ev066', match_id: 'm15', event_type: 'goal', player_id: 'p0502', team_id: 't05', minute: 64, half: '2' },
  { id: 'ev067', match_id: 'm15', event_type: 'goal', player_id: 'p1102', team_id: 't11', minute: 89, half: '2' },
  { id: 'ev068', match_id: 'm15', event_type: 'yellow_card', player_id: 'p0505', team_id: 't05', minute: 43, half: '1' },
  { id: 'ev069', match_id: 'm15', event_type: 'yellow_card', player_id: 'p1106', team_id: 't11', minute: 70, half: '2' },
  { id: 'ev070', match_id: 'm15', event_type: 'red_card', player_id: 'p1107', team_id: 't11', minute: 91, half: '2' },

  // m16: canabarrense(t01) 0 x 2 minuano(t07)
  { id: 'ev071', match_id: 'm16', event_type: 'goal', player_id: 'p0701', team_id: 't07', minute: 32, half: '1' },
  { id: 'ev072', match_id: 'm16', event_type: 'goal', player_id: 'p0702', team_id: 't07', minute: 77, half: '2' },
  { id: 'ev073', match_id: 'm16', event_type: 'yellow_card', player_id: 'p0103', team_id: 't01', minute: 18, half: '1' },
  { id: 'ev074', match_id: 'm16', event_type: 'yellow_card', player_id: 'p0709', team_id: 't07', minute: 59, half: '2' },

  // m17: juv-westfalia(t16) 3 x 2 navegantes(t19)
  { id: 'ev075', match_id: 'm17', event_type: 'goal', player_id: 'p1601', team_id: 't16', minute: 10, half: '1' },
  { id: 'ev076', match_id: 'm17', event_type: 'goal', player_id: 'p1901', team_id: 't19', minute: 27, half: '1' },
  { id: 'ev077', match_id: 'm17', event_type: 'goal', player_id: 'p1609', team_id: 't16', minute: 44, half: '1' },
  { id: 'ev078', match_id: 'm17', event_type: 'goal', player_id: 'p1901', team_id: 't19', minute: 60, half: '2' },
  { id: 'ev079', match_id: 'm17', event_type: 'goal', player_id: 'p1601', team_id: 't16', minute: 85, half: '2' },
  { id: 'ev080', match_id: 'm17', event_type: 'yellow_card', player_id: 'p1906', team_id: 't19', minute: 38, half: '1' },
  { id: 'ev081', match_id: 'm17', event_type: 'red_card', player_id: 'p1907', team_id: 't19', minute: 80, half: '2' },

  // ════════════════════════════════════════
  // ROUND 3 (m18-m26)
  // ════════════════════════════════════════

  // m18: minuano(t07) 1 x 0 juv-westfalia(t16)
  { id: 'ev082', match_id: 'm18', event_type: 'goal', player_id: 'p0702', team_id: 't07', minute: 66, half: '2' },
  { id: 'ev083', match_id: 'm18', event_type: 'yellow_card', player_id: 'p0703', team_id: 't07', minute: 29, half: '1' },
  { id: 'ev084', match_id: 'm18', event_type: 'yellow_card', player_id: 'p1604', team_id: 't16', minute: 51, half: '2' },

  // m19: gaucho-prog(t18) 0 x 2 sete-set(t17)
  { id: 'ev085', match_id: 'm19', event_type: 'goal', player_id: 'p1701', team_id: 't17', minute: 39, half: '1' },
  { id: 'ev086', match_id: 'm19', event_type: 'goal', player_id: 'p1702', team_id: 't17', minute: 73, half: '2' },
  { id: 'ev087', match_id: 'm19', event_type: 'yellow_card', player_id: 'p1803', team_id: 't18', minute: 55, half: '2' },
  { id: 'ev088', match_id: 'm19', event_type: 'red_card', player_id: 'p1804', team_id: 't18', minute: 83, half: '2' },

  // m20: rudibar(t11) 0 x 3 canabarrense(t01)
  { id: 'ev089', match_id: 'm20', event_type: 'goal', player_id: 'p0101', team_id: 't01', minute: 17, half: '1' },
  { id: 'ev090', match_id: 'm20', event_type: 'goal', player_id: 'p0102', team_id: 't01', minute: 52, half: '2' },
  { id: 'ev091', match_id: 'm20', event_type: 'goal', player_id: 'p0102', team_id: 't01', minute: 81, half: '2' },
  { id: 'ev092', match_id: 'm20', event_type: 'yellow_card', player_id: 'p1104', team_id: 't11', minute: 36, half: '1' },
  { id: 'ev093', match_id: 'm20', event_type: 'red_card', player_id: 'p1108', team_id: 't11', minute: 90, half: '2' },

  // m21: boavistense(t14) 1 x 2 poco-antas(t05)
  { id: 'ev094', match_id: 'm21', event_type: 'goal', player_id: 'p1409', team_id: 't14', minute: 14, half: '1' },
  { id: 'ev095', match_id: 'm21', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 48, half: '2' },
  { id: 'ev096', match_id: 'm21', event_type: 'goal', player_id: 'p0503', team_id: 't05', minute: 75, half: '2' },
  { id: 'ev097', match_id: 'm21', event_type: 'yellow_card', player_id: 'p0506', team_id: 't05', minute: 62, half: '2' },
  { id: 'ev098', match_id: 'm21', event_type: 'yellow_card', player_id: 'p1407', team_id: 't14', minute: 80, half: '2' },

  // m22: ecas(t10) 3 x 0 nacional(t09)
  { id: 'ev099', match_id: 'm22', event_type: 'goal', player_id: 'p1001', team_id: 't10', minute: 21, half: '1' },
  { id: 'ev100', match_id: 'm22', event_type: 'goal', player_id: 'p1002', team_id: 't10', minute: 57, half: '2' },
  { id: 'ev101', match_id: 'm22', event_type: 'goal', player_id: 'p1002', team_id: 't10', minute: 84, half: '2' },
  { id: 'ev102', match_id: 'm22', event_type: 'yellow_card', player_id: 'p0903', team_id: 't09', minute: 40, half: '1' },
  { id: 'ev103', match_id: 'm22', event_type: 'yellow_card', player_id: 'p0909', team_id: 't09', minute: 71, half: '2' },
  { id: 'ev104', match_id: 'm22', event_type: 'red_card', player_id: 'p0912', team_id: 't09', minute: 87, half: '2' },

  // m23: estudiantes(t15) 2 x 3 brasil(t04)
  { id: 'ev105', match_id: 'm23', event_type: 'goal', player_id: 'p1501', team_id: 't15', minute: 9, half: '1' },
  { id: 'ev106', match_id: 'm23', event_type: 'goal', player_id: 'p0401', team_id: 't04', minute: 24, half: '1' },
  { id: 'ev107', match_id: 'm23', event_type: 'goal', player_id: 'p0402', team_id: 't04', minute: 46, half: '2' },
  { id: 'ev108', match_id: 'm23', event_type: 'goal', player_id: 'p1509', team_id: 't15', minute: 65, half: '2' },
  { id: 'ev109', match_id: 'm23', event_type: 'goal', player_id: 'p0403', team_id: 't04', minute: 83, half: '2' },
  { id: 'ev110', match_id: 'm23', event_type: 'yellow_card', player_id: 'p0405', team_id: 't04', minute: 37, half: '1' },
  { id: 'ev111', match_id: 'm23', event_type: 'yellow_card', player_id: 'p1505', team_id: 't15', minute: 58, half: '2' },

  // m24: serrano(t06) 2 x 0 juv-guapore(t13)
  { id: 'ev112', match_id: 'm24', event_type: 'goal', player_id: 'p0601', team_id: 't06', minute: 30, half: '1' },
  { id: 'ev113', match_id: 'm24', event_type: 'goal', player_id: 'p0602', team_id: 't06', minute: 69, half: '2' },
  { id: 'ev114', match_id: 'm24', event_type: 'yellow_card', player_id: 'p0606', team_id: 't06', minute: 53, half: '2' },
  { id: 'ev115', match_id: 'm24', event_type: 'yellow_card', player_id: 'p1304', team_id: 't13', minute: 77, half: '2' },

  // m25: gaucho-teut(t08) 1 x 2 tiradentes(t02)
  { id: 'ev116', match_id: 'm25', event_type: 'goal', player_id: 'p0810', team_id: 't08', minute: 20, half: '1' },
  { id: 'ev117', match_id: 'm25', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 43, half: '1' },
  { id: 'ev118', match_id: 'm25', event_type: 'goal', player_id: 'p0204', team_id: 't02', minute: 67, half: '2' },
  { id: 'ev119', match_id: 'm25', event_type: 'yellow_card', player_id: 'p0802', team_id: 't08', minute: 55, half: '2' },
  { id: 'ev120', match_id: 'm25', event_type: 'yellow_card', player_id: 'p0207', team_id: 't02', minute: 80, half: '2' },

  // m26: imigrante(t12) 2 x 3 taquariense(t03)
  { id: 'ev121', match_id: 'm26', event_type: 'goal', player_id: 'p1202', team_id: 't12', minute: 15, half: '1' },
  { id: 'ev122', match_id: 'm26', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 28, half: '1' },
  { id: 'ev123', match_id: 'm26', event_type: 'goal', player_id: 'p0302', team_id: 't03', minute: 47, half: '2' },
  { id: 'ev124', match_id: 'm26', event_type: 'goal', player_id: 'p1207', team_id: 't12', minute: 62, half: '2' },
  { id: 'ev125', match_id: 'm26', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 79, half: '2' },
  { id: 'ev126', match_id: 'm26', event_type: 'yellow_card', player_id: 'p0305', team_id: 't03', minute: 38, half: '1' },
  { id: 'ev127', match_id: 'm26', event_type: 'yellow_card', player_id: 'p1203', team_id: 't12', minute: 70, half: '2' },
  { id: 'ev128', match_id: 'm26', event_type: 'red_card', player_id: 'p1208', team_id: 't12', minute: 85, half: '2' },

  // ════════════════════════════════════════
  // ROUND 4 (m27-m32)
  // ════════════════════════════════════════

  // m27: minuano(t07) 1 x 2 navegantes(t19)
  { id: 'ev129', match_id: 'm27', event_type: 'goal', player_id: 'p0710', team_id: 't07', minute: 33, half: '1' },
  { id: 'ev130', match_id: 'm27', event_type: 'goal', player_id: 'p1901', team_id: 't19', minute: 58, half: '2' },
  { id: 'ev131', match_id: 'm27', event_type: 'goal', player_id: 'p1909', team_id: 't19', minute: 76, half: '2' },
  { id: 'ev132', match_id: 'm27', event_type: 'yellow_card', player_id: 'p0706', team_id: 't07', minute: 44, half: '1' },
  { id: 'ev133', match_id: 'm27', event_type: 'yellow_card', player_id: 'p1910', team_id: 't19', minute: 82, half: '2' },

  // m28: rudibar(t11) 2 x 1 gaucho-prog(t18)
  { id: 'ev134', match_id: 'm28', event_type: 'goal', player_id: 'p1101', team_id: 't11', minute: 22, half: '1' },
  { id: 'ev135', match_id: 'm28', event_type: 'goal', player_id: 'p1801', team_id: 't18', minute: 51, half: '2' },
  { id: 'ev136', match_id: 'm28', event_type: 'goal', player_id: 'p1109', team_id: 't11', minute: 88, half: '2' },
  { id: 'ev137', match_id: 'm28', event_type: 'yellow_card', player_id: 'p1805', team_id: 't18', minute: 35, half: '1' },
  { id: 'ev138', match_id: 'm28', event_type: 'red_card', player_id: 'p1806', team_id: 't18', minute: 75, half: '2' },

  // m29: boavistense(t14) 0 x 0 juv-westfalia(t16)
  { id: 'ev139', match_id: 'm29', event_type: 'yellow_card', player_id: 'p1404', team_id: 't14', minute: 42, half: '1' },
  { id: 'ev140', match_id: 'm29', event_type: 'yellow_card', player_id: 'p1605', team_id: 't16', minute: 68, half: '2' },
  { id: 'ev141', match_id: 'm29', event_type: 'yellow_card', player_id: 'p1408', team_id: 't14', minute: 79, half: '2' },

  // m30: estudiantes(t15) 3 x 2 poco-antas(t05)
  { id: 'ev142', match_id: 'm30', event_type: 'goal', player_id: 'p1501', team_id: 't15', minute: 7, half: '1' },
  { id: 'ev143', match_id: 'm30', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 26, half: '1' },
  { id: 'ev144', match_id: 'm30', event_type: 'goal', player_id: 'p1507', team_id: 't15', minute: 41, half: '1' },
  { id: 'ev145', match_id: 'm30', event_type: 'goal', player_id: 'p0504', team_id: 't05', minute: 59, half: '2' },
  { id: 'ev146', match_id: 'm30', event_type: 'goal', player_id: 'p1502', team_id: 't15', minute: 78, half: '2' },
  { id: 'ev147', match_id: 'm30', event_type: 'yellow_card', player_id: 'p0508', team_id: 't05', minute: 35, half: '1' },
  { id: 'ev148', match_id: 'm30', event_type: 'yellow_card', player_id: 'p1506', team_id: 't15', minute: 65, half: '2' },

  // m31: serrano(t06) 2 x 0 nacional(t09)
  { id: 'ev149', match_id: 'm31', event_type: 'goal', player_id: 'p0601', team_id: 't06', minute: 36, half: '1' },
  { id: 'ev150', match_id: 'm31', event_type: 'goal', player_id: 'p0601', team_id: 't06', minute: 72, half: '2' },
  { id: 'ev151', match_id: 'm31', event_type: 'yellow_card', player_id: 'p0608', team_id: 't06', minute: 50, half: '2' },
  { id: 'ev152', match_id: 'm31', event_type: 'yellow_card', player_id: 'p0904', team_id: 't09', minute: 63, half: '2' },
  { id: 'ev153', match_id: 'm31', event_type: 'red_card', player_id: 'p0913', team_id: 't09', minute: 82, half: '2' },

  // m32: gaucho-teut(t08) 1 x 3 brasil(t04)
  { id: 'ev154', match_id: 'm32', event_type: 'goal', player_id: 'p0801', team_id: 't08', minute: 19, half: '1' },
  { id: 'ev155', match_id: 'm32', event_type: 'goal', player_id: 'p0401', team_id: 't04', minute: 31, half: '1' },
  { id: 'ev156', match_id: 'm32', event_type: 'goal', player_id: 'p0402', team_id: 't04', minute: 55, half: '2' },
  { id: 'ev157', match_id: 'm32', event_type: 'goal', player_id: 'p0403', team_id: 't04', minute: 70, half: '2' },
  { id: 'ev158', match_id: 'm32', event_type: 'yellow_card', player_id: 'p0803', team_id: 't08', minute: 42, half: '1' },
  { id: 'ev159', match_id: 'm32', event_type: 'yellow_card', player_id: 'p0406', team_id: 't04', minute: 64, half: '2' },

  // ════════════════════════════════════════
  // ROUND 5 (m33-m35)
  // ════════════════════════════════════════

  // m33: navegantes(t19) 0 x 2 taquariense(t03)
  { id: 'ev160', match_id: 'm33', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 28, half: '1' },
  { id: 'ev161', match_id: 'm33', event_type: 'goal', player_id: 'p0302', team_id: 't03', minute: 71, half: '2' },
  { id: 'ev162', match_id: 'm33', event_type: 'yellow_card', player_id: 'p1908', team_id: 't19', minute: 40, half: '1' },
  { id: 'ev163', match_id: 'm33', event_type: 'red_card', player_id: 'p1905', team_id: 't19', minute: 65, half: '2' },

  // m34: canabarrense(t01) 2 x 0 gaucho-prog(t18)
  { id: 'ev164', match_id: 'm34', event_type: 'goal', player_id: 'p0101', team_id: 't01', minute: 16, half: '1' },
  { id: 'ev165', match_id: 'm34', event_type: 'goal', player_id: 'p0102', team_id: 't01', minute: 59, half: '2' },
  { id: 'ev166', match_id: 'm34', event_type: 'yellow_card', player_id: 'p0104', team_id: 't01', minute: 33, half: '1' },
  { id: 'ev167', match_id: 'm34', event_type: 'yellow_card', player_id: 'p1807', team_id: 't18', minute: 73, half: '2' },
  { id: 'ev168', match_id: 'm34', event_type: 'red_card', player_id: 'p1808', team_id: 't18', minute: 85, half: '2' },

  // m35: sete-set(t17) 0 x 2 tiradentes(t02)
  { id: 'ev169', match_id: 'm35', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 38, half: '1' },
  { id: 'ev170', match_id: 'm35', event_type: 'goal', player_id: 'p0203', team_id: 't02', minute: 74, half: '2' },
  { id: 'ev171', match_id: 'm35', event_type: 'yellow_card', player_id: 'p1705', team_id: 't17', minute: 52, half: '2' },
  { id: 'ev172', match_id: 'm35', event_type: 'yellow_card', player_id: 'p0206', team_id: 't02', minute: 81, half: '2' },

  // ════════════════════════════════════════
  // ROUND 6 (m36-m40)
  // ════════════════════════════════════════

  // m36: ecas(t10) 1 x 2 canabarrense(t01)
  { id: 'ev173', match_id: 'm36', event_type: 'goal', player_id: 'p1002', team_id: 't10', minute: 25, half: '1' },
  { id: 'ev174', match_id: 'm36', event_type: 'goal', player_id: 'p0101', team_id: 't01', minute: 53, half: '2' },
  { id: 'ev175', match_id: 'm36', event_type: 'goal', player_id: 'p0110', team_id: 't01', minute: 87, half: '2' },
  { id: 'ev176', match_id: 'm36', event_type: 'yellow_card', player_id: 'p0105', team_id: 't01', minute: 40, half: '1' },
  { id: 'ev177', match_id: 'm36', event_type: 'yellow_card', player_id: 'p1005', team_id: 't10', minute: 68, half: '2' },

  // m37: navegantes(t19) 1 x 2 gaucho-prog(t18)
  { id: 'ev178', match_id: 'm37', event_type: 'goal', player_id: 'p1909', team_id: 't19', minute: 17, half: '1' },
  { id: 'ev179', match_id: 'm37', event_type: 'goal', player_id: 'p1801', team_id: 't18', minute: 48, half: '2' },
  { id: 'ev180', match_id: 'm37', event_type: 'goal', player_id: 'p1802', team_id: 't18', minute: 82, half: '2' },
  { id: 'ev181', match_id: 'm37', event_type: 'yellow_card', player_id: 'p1903', team_id: 't19', minute: 36, half: '1' },
  { id: 'ev182', match_id: 'm37', event_type: 'red_card', player_id: 'p1910', team_id: 't19', minute: 74, half: '2' },

  // m38: imigrante(t12) 3 x 2 juv-guapore(t13)
  { id: 'ev183', match_id: 'm38', event_type: 'goal', player_id: 'p1201', team_id: 't12', minute: 11, half: '1' },
  { id: 'ev184', match_id: 'm38', event_type: 'goal', player_id: 'p1309', team_id: 't13', minute: 29, half: '1' },
  { id: 'ev185', match_id: 'm38', event_type: 'goal', player_id: 'p1204', team_id: 't12', minute: 44, half: '1' },
  { id: 'ev186', match_id: 'm38', event_type: 'goal', player_id: 'p1307', team_id: 't13', minute: 60, half: '2' },
  { id: 'ev187', match_id: 'm38', event_type: 'goal', player_id: 'p1205', team_id: 't12', minute: 78, half: '2' },
  { id: 'ev188', match_id: 'm38', event_type: 'yellow_card', player_id: 'p1305', team_id: 't13', minute: 52, half: '2' },
  { id: 'ev189', match_id: 'm38', event_type: 'red_card', player_id: 'p1212', team_id: 't12', minute: 89, half: '2' },

  // m39: taquariense(t03) 1 x 1 gaucho-teut(t08)
  { id: 'ev190', match_id: 'm39', event_type: 'goal', player_id: 'p0302', team_id: 't03', minute: 34, half: '1' },
  { id: 'ev191', match_id: 'm39', event_type: 'goal', player_id: 'p0801', team_id: 't08', minute: 63, half: '2' },
  { id: 'ev192', match_id: 'm39', event_type: 'yellow_card', player_id: 'p0308', team_id: 't03', minute: 47, half: '2' },
  { id: 'ev193', match_id: 'm39', event_type: 'yellow_card', player_id: 'p0805', team_id: 't08', minute: 72, half: '2' },

  // m40: brasil(t04) 3 x 1 rudibar(t11)
  { id: 'ev194', match_id: 'm40', event_type: 'goal', player_id: 'p0401', team_id: 't04', minute: 13, half: '1' },
  { id: 'ev195', match_id: 'm40', event_type: 'goal', player_id: 'p0402', team_id: 't04', minute: 37, half: '1' },
  { id: 'ev196', match_id: 'm40', event_type: 'goal', player_id: 'p1101', team_id: 't11', minute: 56, half: '2' },
  { id: 'ev197', match_id: 'm40', event_type: 'goal', player_id: 'p0414', team_id: 't04', minute: 80, half: '2' },
  { id: 'ev198', match_id: 'm40', event_type: 'yellow_card', player_id: 'p0407', team_id: 't04', minute: 45, half: '1' },
  { id: 'ev199', match_id: 'm40', event_type: 'yellow_card', player_id: 'p1103', team_id: 't11', minute: 67, half: '2' },

  // ════════════════════════════════════════
  // OITAVAS IDA (m41-m48)
  // ════════════════════════════════════════

  // m41: sete-set(t17) 0 x 4 serrano(t06)
  { id: 'ev200', match_id: 'm41', event_type: 'goal', player_id: 'p0601', team_id: 't06', minute: 10, half: '1' },
  { id: 'ev201', match_id: 'm41', event_type: 'goal', player_id: 'p0601', team_id: 't06', minute: 35, half: '1' },
  { id: 'ev202', match_id: 'm41', event_type: 'goal', player_id: 'p0602', team_id: 't06', minute: 58, half: '2' },
  { id: 'ev203', match_id: 'm41', event_type: 'goal', player_id: 'p0609', team_id: 't06', minute: 79, half: '2' },
  { id: 'ev204', match_id: 'm41', event_type: 'yellow_card', player_id: 'p1704', team_id: 't17', minute: 27, half: '1' },
  { id: 'ev205', match_id: 'm41', event_type: 'yellow_card', player_id: 'p0607', team_id: 't06', minute: 70, half: '2' },

  // m42: poco-antas(t05) 4 x 1 navegantes(t19)
  { id: 'ev206', match_id: 'm42', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 8, half: '1' },
  { id: 'ev207', match_id: 'm42', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 29, half: '1' },
  { id: 'ev208', match_id: 'm42', event_type: 'goal', player_id: 'p1901', team_id: 't19', minute: 43, half: '1' },
  { id: 'ev209', match_id: 'm42', event_type: 'goal', player_id: 'p0502', team_id: 't05', minute: 61, half: '2' },
  { id: 'ev210', match_id: 'm42', event_type: 'goal', player_id: 'p0504', team_id: 't05', minute: 83, half: '2' },
  { id: 'ev211', match_id: 'm42', event_type: 'yellow_card', player_id: 'p1906', team_id: 't19', minute: 37, half: '1' },
  { id: 'ev212', match_id: 'm42', event_type: 'yellow_card', player_id: 'p0510', team_id: 't05', minute: 75, half: '2' },
  { id: 'ev213', match_id: 'm42', event_type: 'red_card', player_id: 'p1908', team_id: 't19', minute: 88, half: '2' },

  // m43: nacional(t09) 2 x 1 minuano(t07)
  { id: 'ev214', match_id: 'm43', event_type: 'goal', player_id: 'p0901', team_id: 't09', minute: 18, half: '1' },
  { id: 'ev215', match_id: 'm43', event_type: 'goal', player_id: 'p0702', team_id: 't07', minute: 40, half: '1' },
  { id: 'ev216', match_id: 'm43', event_type: 'goal', player_id: 'p0910', team_id: 't09', minute: 73, half: '2' },
  { id: 'ev217', match_id: 'm43', event_type: 'yellow_card', player_id: 'p0711', team_id: 't07', minute: 55, half: '2' },
  { id: 'ev218', match_id: 'm43', event_type: 'yellow_card', player_id: 'p0907', team_id: 't09', minute: 81, half: '2' },

  // m44: imigrante(t12) 1 x 2 gaucho-teut(t08)
  { id: 'ev219', match_id: 'm44', event_type: 'goal', player_id: 'p1209', team_id: 't12', minute: 22, half: '1' },
  { id: 'ev220', match_id: 'm44', event_type: 'goal', player_id: 'p0812', team_id: 't08', minute: 50, half: '2' },
  { id: 'ev221', match_id: 'm44', event_type: 'goal', player_id: 'p0809', team_id: 't08', minute: 77, half: '2' },
  { id: 'ev222', match_id: 'm44', event_type: 'yellow_card', player_id: 'p1205', team_id: 't12', minute: 35, half: '1' },
  { id: 'ev223', match_id: 'm44', event_type: 'yellow_card', player_id: 'p0806', team_id: 't08', minute: 65, half: '2' },
  { id: 'ev224', match_id: 'm44', event_type: 'red_card', player_id: 'p1206', team_id: 't12', minute: 84, half: '2' },

  // m45: tiradentes(t02) 1 x 1 ecas(t10)
  { id: 'ev225', match_id: 'm45', event_type: 'goal', player_id: 'p0203', team_id: 't02', minute: 31, half: '1' },
  { id: 'ev226', match_id: 'm45', event_type: 'goal', player_id: 'p1001', team_id: 't10', minute: 66, half: '2' },
  { id: 'ev227', match_id: 'm45', event_type: 'yellow_card', player_id: 'p0211', team_id: 't02', minute: 44, half: '1' },
  { id: 'ev228', match_id: 'm45', event_type: 'yellow_card', player_id: 'p1007', team_id: 't10', minute: 73, half: '2' },
  { id: 'ev229', match_id: 'm45', event_type: 'red_card', player_id: 'p1008', team_id: 't10', minute: 89, half: '2' },

  // m46: taquariense(t03) 3 x 2 estudiantes(t15)
  { id: 'ev230', match_id: 'm46', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 14, half: '1' },
  { id: 'ev231', match_id: 'm46', event_type: 'goal', player_id: 'p1501', team_id: 't15', minute: 28, half: '1' },
  { id: 'ev232', match_id: 'm46', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 42, half: '1' },
  { id: 'ev233', match_id: 'm46', event_type: 'goal', player_id: 'p1509', team_id: 't15', minute: 57, half: '2' },
  { id: 'ev234', match_id: 'm46', event_type: 'goal', player_id: 'p0304', team_id: 't03', minute: 81, half: '2' },
  { id: 'ev235', match_id: 'm46', event_type: 'yellow_card', player_id: 'p0309', team_id: 't03', minute: 36, half: '1' },
  { id: 'ev236', match_id: 'm46', event_type: 'yellow_card', player_id: 'p1503', team_id: 't15', minute: 69, half: '2' },

  // m47: juv-guapore(t13) 5 x 0 boavistense(t14)
  { id: 'ev237', match_id: 'm47', event_type: 'goal', player_id: 'p1301', team_id: 't13', minute: 5, half: '1' },
  { id: 'ev238', match_id: 'm47', event_type: 'goal', player_id: 'p1302', team_id: 't13', minute: 23, half: '1' },
  { id: 'ev239', match_id: 'm47', event_type: 'goal', player_id: 'p1309', team_id: 't13', minute: 41, half: '1' },
  { id: 'ev240', match_id: 'm47', event_type: 'goal', player_id: 'p1305', team_id: 't13', minute: 64, half: '2' },
  { id: 'ev241', match_id: 'm47', event_type: 'goal', player_id: 'p1307', team_id: 't13', minute: 80, half: '2' },
  { id: 'ev242', match_id: 'm47', event_type: 'yellow_card', player_id: 'p1405', team_id: 't14', minute: 33, half: '1' },
  { id: 'ev243', match_id: 'm47', event_type: 'red_card', player_id: 'p1410', team_id: 't14', minute: 55, half: '2' },

  // m48: gaucho-prog(t18) 0 x 0 juv-westfalia(t16)
  { id: 'ev244', match_id: 'm48', event_type: 'yellow_card', player_id: 'p1812', team_id: 't18', minute: 38, half: '1' },
  { id: 'ev245', match_id: 'm48', event_type: 'yellow_card', player_id: 'p1607', team_id: 't16', minute: 62, half: '2' },
  { id: 'ev246', match_id: 'm48', event_type: 'red_card', player_id: 'p1810', team_id: 't18', minute: 78, half: '2' },

  // ════════════════════════════════════════
  // OITAVAS VOLTA (m49-m57)
  // ════════════════════════════════════════

  // m49: brasil(t04) 2 x 0 serrano(t06) (aggregate: brasil advances)
  { id: 'ev247', match_id: 'm49', event_type: 'goal', player_id: 'p0401', team_id: 't04', minute: 32, half: '1' },
  { id: 'ev248', match_id: 'm49', event_type: 'goal', player_id: 'p0414', team_id: 't04', minute: 69, half: '2' },
  { id: 'ev249', match_id: 'm49', event_type: 'yellow_card', player_id: 'p0609', team_id: 't06', minute: 48, half: '2' },
  { id: 'ev250', match_id: 'm49', event_type: 'yellow_card', player_id: 'p0412', team_id: 't04', minute: 78, half: '2' },

  // m50: nacional(t09) 1 x 1 estudiantes(t15)
  { id: 'ev251', match_id: 'm50', event_type: 'goal', player_id: 'p0917', team_id: 't09', minute: 24, half: '1' },
  { id: 'ev252', match_id: 'm50', event_type: 'goal', player_id: 'p1507', team_id: 't15', minute: 71, half: '2' },
  { id: 'ev253', match_id: 'm50', event_type: 'yellow_card', player_id: 'p0905', team_id: 't09', minute: 40, half: '1' },
  { id: 'ev254', match_id: 'm50', event_type: 'yellow_card', player_id: 'p0902', team_id: 't09', minute: 85, half: '2' },

  // m51: gaucho-prog(t18) 0 x 2 minuano(t07)
  { id: 'ev255', match_id: 'm51', event_type: 'goal', player_id: 'p0701', team_id: 't07', minute: 37, half: '1' },
  { id: 'ev256', match_id: 'm51', event_type: 'goal', player_id: 'p0710', team_id: 't07', minute: 64, half: '2' },
  { id: 'ev257', match_id: 'm51', event_type: 'yellow_card', player_id: 'p1801', team_id: 't18', minute: 28, half: '1' },
  { id: 'ev258', match_id: 'm51', event_type: 'yellow_card', player_id: 'p0704', team_id: 't07', minute: 72, half: '2' },
  { id: 'ev259', match_id: 'm51', event_type: 'red_card', player_id: 'p1809', team_id: 't18', minute: 80, half: '2' },

  // m52: juv-westfalia(t16) 1 x 2 rudibar(t11)
  { id: 'ev260', match_id: 'm52', event_type: 'goal', player_id: 'p1602', team_id: 't16', minute: 20, half: '1' },
  { id: 'ev261', match_id: 'm52', event_type: 'goal', player_id: 'p1101', team_id: 't11', minute: 53, half: '2' },
  { id: 'ev262', match_id: 'm52', event_type: 'goal', player_id: 'p1102', team_id: 't11', minute: 86, half: '2' },
  { id: 'ev263', match_id: 'm52', event_type: 'yellow_card', player_id: 'p1606', team_id: 't16', minute: 44, half: '1' },
  { id: 'ev264', match_id: 'm52', event_type: 'yellow_card', player_id: 'p1105', team_id: 't11', minute: 75, half: '2' },

  // m53: canabarrense(t01) 1 x 1 boavistense(t14) (can advances on aggregate)
  { id: 'ev265', match_id: 'm53', event_type: 'goal', player_id: 'p0101', team_id: 't01', minute: 15, half: '1' },
  { id: 'ev266', match_id: 'm53', event_type: 'goal', player_id: 'p1402', team_id: 't14', minute: 62, half: '2' },
  { id: 'ev267', match_id: 'm53', event_type: 'yellow_card', player_id: 'p0106', team_id: 't01', minute: 38, half: '1' },
  { id: 'ev268', match_id: 'm53', event_type: 'yellow_card', player_id: 'p0107', team_id: 't01', minute: 77, half: '2' },

  // m54: poco-antas(t05) 1 x 2 ecas(t10)
  { id: 'ev269', match_id: 'm54', event_type: 'goal', player_id: 'p0502', team_id: 't05', minute: 19, half: '1' },
  { id: 'ev270', match_id: 'm54', event_type: 'goal', player_id: 'p1010', team_id: 't10', minute: 47, half: '2' },
  { id: 'ev271', match_id: 'm54', event_type: 'goal', player_id: 'p1002', team_id: 't10', minute: 84, half: '2' },
  { id: 'ev272', match_id: 'm54', event_type: 'yellow_card', player_id: 'p0513', team_id: 't05', minute: 35, half: '1' },
  { id: 'ev273', match_id: 'm54', event_type: 'yellow_card', player_id: 'p0511', team_id: 't05', minute: 60, half: '2' },
  { id: 'ev274', match_id: 'm54', event_type: 'red_card', player_id: 'p0512', team_id: 't05', minute: 90, half: '2' },

  // m55: juv-guapore(t13) 0 x 0 gaucho-teut(t08)
  { id: 'ev275', match_id: 'm55', event_type: 'yellow_card', player_id: 'p1308', team_id: 't13', minute: 42, half: '1' },
  { id: 'ev276', match_id: 'm55', event_type: 'yellow_card', player_id: 'p0808', team_id: 't08', minute: 58, half: '2' },
  { id: 'ev277', match_id: 'm55', event_type: 'yellow_card', player_id: 'p0802', team_id: 't08', minute: 81, half: '2' },
  { id: 'ev278', match_id: 'm55', event_type: 'red_card', player_id: 'p0814', team_id: 't08', minute: 88, half: '2' },

  // m56: tiradentes(t02) 5 x 0 imigrante(t12)
  { id: 'ev279', match_id: 'm56', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 7, half: '1' },
  { id: 'ev280', match_id: 'm56', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 26, half: '1' },
  { id: 'ev281', match_id: 'm56', event_type: 'goal', player_id: 'p0204', team_id: 't02', minute: 43, half: '1' },
  { id: 'ev282', match_id: 'm56', event_type: 'goal', player_id: 'p0202', team_id: 't02', minute: 61, half: '2' },
  { id: 'ev283', match_id: 'm56', event_type: 'goal', player_id: 'p0203', team_id: 't02', minute: 80, half: '2' },
  { id: 'ev284', match_id: 'm56', event_type: 'yellow_card', player_id: 'p1204', team_id: 't12', minute: 33, half: '1' },
  { id: 'ev285', match_id: 'm56', event_type: 'yellow_card', player_id: 'p0205', team_id: 't02', minute: 70, half: '2' },
  { id: 'ev286', match_id: 'm56', event_type: 'red_card', player_id: 'p1207', team_id: 't12', minute: 75, half: '2' },

  // m57: taquariense(t03) 2 x 2 sete-set(t17) (taq advances on aggregate)
  { id: 'ev287', match_id: 'm57', event_type: 'goal', player_id: 'p0302', team_id: 't03', minute: 16, half: '1' },
  { id: 'ev288', match_id: 'm57', event_type: 'goal', player_id: 'p1701', team_id: 't17', minute: 33, half: '1' },
  { id: 'ev289', match_id: 'm57', event_type: 'goal', player_id: 'p0303', team_id: 't03', minute: 54, half: '2' },
  { id: 'ev290', match_id: 'm57', event_type: 'goal', player_id: 'p1707', team_id: 't17', minute: 78, half: '2' },
  { id: 'ev291', match_id: 'm57', event_type: 'yellow_card', player_id: 'p0307', team_id: 't03', minute: 26, half: '1' },
  { id: 'ev292', match_id: 'm57', event_type: 'yellow_card', player_id: 'p0301', team_id: 't03', minute: 68, half: '2' },
  { id: 'ev293', match_id: 'm57', event_type: 'yellow_card', player_id: 'p1706', team_id: 't17', minute: 82, half: '2' },

  // ════════════════════════════════════════
  // QUARTAS IDA (m58-m65)
  // ════════════════════════════════════════

  // m58: ecas(t10) 1 x 3 minuano(t07)
  { id: 'ev294', match_id: 'm58', event_type: 'goal', player_id: 'p1001', team_id: 't10', minute: 12, half: '1' },
  { id: 'ev295', match_id: 'm58', event_type: 'goal', player_id: 'p0701', team_id: 't07', minute: 29, half: '1' },
  { id: 'ev296', match_id: 'm58', event_type: 'goal', player_id: 'p0702', team_id: 't07', minute: 56, half: '2' },
  { id: 'ev297', match_id: 'm58', event_type: 'goal', player_id: 'p0710', team_id: 't07', minute: 79, half: '2' },
  { id: 'ev298', match_id: 'm58', event_type: 'yellow_card', player_id: 'p1006', team_id: 't10', minute: 40, half: '1' },
  { id: 'ev299', match_id: 'm58', event_type: 'yellow_card', player_id: 'p0707', team_id: 't07', minute: 65, half: '2' },
  { id: 'ev300', match_id: 'm58', event_type: 'red_card', player_id: 'p0708', team_id: 't07', minute: 91, half: '2' },

  // m59: gaucho-teut(t08) 0 x 0 nacional(t09)
  { id: 'ev301', match_id: 'm59', event_type: 'yellow_card', player_id: 'p0803', team_id: 't08', minute: 34, half: '1' },
  { id: 'ev302', match_id: 'm59', event_type: 'yellow_card', player_id: 'p0906', team_id: 't09', minute: 58, half: '2' },
  { id: 'ev303', match_id: 'm59', event_type: 'yellow_card', player_id: 'p0909', team_id: 't09', minute: 76, half: '2' },

  // m60: rudibar(t11) 0 x 1 poco-antas(t05)
  { id: 'ev304', match_id: 'm60', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 63, half: '2' },
  { id: 'ev305', match_id: 'm60', event_type: 'yellow_card', player_id: 'p1110', team_id: 't11', minute: 25, half: '1' },
  { id: 'ev306', match_id: 'm60', event_type: 'yellow_card', player_id: 'p0507', team_id: 't05', minute: 47, half: '2' },
  { id: 'ev307', match_id: 'm60', event_type: 'yellow_card', player_id: 'p0505', team_id: 't05', minute: 80, half: '2' },

  // m61: imigrante(t12) 1 x 3 taquariense(t03)
  { id: 'ev308', match_id: 'm61', event_type: 'goal', player_id: 'p1201', team_id: 't12', minute: 18, half: '1' },
  { id: 'ev309', match_id: 'm61', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 35, half: '1' },
  { id: 'ev310', match_id: 'm61', event_type: 'goal', player_id: 'p0302', team_id: 't03', minute: 52, half: '2' },
  { id: 'ev311', match_id: 'm61', event_type: 'goal', player_id: 'p0304', team_id: 't03', minute: 77, half: '2' },
  { id: 'ev312', match_id: 'm61', event_type: 'yellow_card', player_id: 'p0310', team_id: 't03', minute: 43, half: '1' },
  { id: 'ev313', match_id: 'm61', event_type: 'yellow_card', player_id: 'p1203', team_id: 't12', minute: 60, half: '2' },

  // m62: boavistense(t14) 1 x 1 serrano(t06) (aggregate tied, serrano advances)
  { id: 'ev314', match_id: 'm62', event_type: 'goal', player_id: 'p1401', team_id: 't14', minute: 27, half: '1' },
  { id: 'ev315', match_id: 'm62', event_type: 'goal', player_id: 'p0611', team_id: 't06', minute: 68, half: '2' },
  { id: 'ev316', match_id: 'm62', event_type: 'yellow_card', player_id: 'p0610', team_id: 't06', minute: 42, half: '1' },
  { id: 'ev317', match_id: 'm62', event_type: 'yellow_card', player_id: 'p1403', team_id: 't14', minute: 55, half: '2' },

  // m63: juv-westfalia(t16) 0 x 1 tiradentes(t02)
  { id: 'ev318', match_id: 'm63', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 54, half: '2' },
  { id: 'ev319', match_id: 'm63', event_type: 'yellow_card', player_id: 'p1608', team_id: 't16', minute: 30, half: '1' },
  { id: 'ev320', match_id: 'm63', event_type: 'yellow_card', player_id: 'p0209', team_id: 't02', minute: 71, half: '2' },
  { id: 'ev321', match_id: 'm63', event_type: 'yellow_card', player_id: 'p0212', team_id: 't02', minute: 87, half: '2' },

  // m64: estudiantes(t15) 0 x 0 brasil(t04)
  { id: 'ev322', match_id: 'm64', event_type: 'yellow_card', player_id: 'p1504', team_id: 't15', minute: 36, half: '1' },
  { id: 'ev323', match_id: 'm64', event_type: 'yellow_card', player_id: 'p0408', team_id: 't04', minute: 52, half: '2' },
  { id: 'ev324', match_id: 'm64', event_type: 'yellow_card', player_id: 'p0409', team_id: 't04', minute: 79, half: '2' },
  { id: 'ev325', match_id: 'm64', event_type: 'red_card', player_id: 'p0413', team_id: 't04', minute: 88, half: '2' },

  // m65: juv-guapore(t13) 0 x 2 canabarrense(t01)
  { id: 'ev326', match_id: 'm65', event_type: 'goal', player_id: 'p0101', team_id: 't01', minute: 41, half: '1' },
  { id: 'ev327', match_id: 'm65', event_type: 'goal', player_id: 'p0110', team_id: 't01', minute: 73, half: '2' },
  { id: 'ev328', match_id: 'm65', event_type: 'yellow_card', player_id: 'p1302', team_id: 't13', minute: 56, half: '2' },
  { id: 'ev329', match_id: 'm65', event_type: 'yellow_card', player_id: 'p0108', team_id: 't01', minute: 82, half: '2' },
  { id: 'ev330', match_id: 'm65', event_type: 'red_card', player_id: 'p1310', team_id: 't13', minute: 90, half: '2' },

  // ════════════════════════════════════════
  // QUARTAS VOLTA (m66-m73)
  // ════════════════════════════════════════

  // m66: brasil(t04) 3 x 0 estudiantes(t15)
  { id: 'ev331', match_id: 'm66', event_type: 'goal', player_id: 'p0402', team_id: 't04', minute: 11, half: '1' },
  { id: 'ev332', match_id: 'm66', event_type: 'goal', player_id: 'p0401', team_id: 't04', minute: 39, half: '1' },
  { id: 'ev333', match_id: 'm66', event_type: 'goal', player_id: 'p0403', team_id: 't04', minute: 72, half: '2' },
  { id: 'ev334', match_id: 'm66', event_type: 'yellow_card', player_id: 'p1507', team_id: 't15', minute: 50, half: '2' },
  { id: 'ev335', match_id: 'm66', event_type: 'yellow_card', player_id: 'p0411', team_id: 't04', minute: 83, half: '2' },
  { id: 'ev336', match_id: 'm66', event_type: 'red_card', player_id: 'p0415', team_id: 't04', minute: 91, half: '2' },

  // m67: tiradentes(t02) 3 x 0 juv-westfalia(t16)
  { id: 'ev337', match_id: 'm67', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 15, half: '1' },
  { id: 'ev338', match_id: 'm67', event_type: 'goal', player_id: 'p0204', team_id: 't02', minute: 53, half: '2' },
  { id: 'ev339', match_id: 'm67', event_type: 'goal', player_id: 'p0202', team_id: 't02', minute: 81, half: '2' },
  { id: 'ev340', match_id: 'm67', event_type: 'yellow_card', player_id: 'p1610', team_id: 't16', minute: 38, half: '1' },
  { id: 'ev341', match_id: 'm67', event_type: 'yellow_card', player_id: 'p0208', team_id: 't02', minute: 64, half: '2' },

  // m68: serrano(t06) 2 x 1 boavistense(t14)
  { id: 'ev342', match_id: 'm68', event_type: 'goal', player_id: 'p0601', team_id: 't06', minute: 22, half: '1' },
  { id: 'ev343', match_id: 'm68', event_type: 'goal', player_id: 'p1409', team_id: 't14', minute: 50, half: '2' },
  { id: 'ev344', match_id: 'm68', event_type: 'goal', player_id: 'p0602', team_id: 't06', minute: 77, half: '2' },
  { id: 'ev345', match_id: 'm68', event_type: 'yellow_card', player_id: 'p0605', team_id: 't06', minute: 33, half: '1' },
  { id: 'ev346', match_id: 'm68', event_type: 'yellow_card', player_id: 'p1402', team_id: 't14', minute: 66, half: '2' },

  // m69: canabarrense(t01) 2 x 0 juv-guapore(t13)
  { id: 'ev347', match_id: 'm69', event_type: 'goal', player_id: 'p0102', team_id: 't01', minute: 28, half: '1' },
  { id: 'ev348', match_id: 'm69', event_type: 'goal', player_id: 'p0111', team_id: 't01', minute: 65, half: '2' },
  { id: 'ev349', match_id: 'm69', event_type: 'yellow_card', player_id: 'p0109', team_id: 't01', minute: 42, half: '1' },
  { id: 'ev350', match_id: 'm69', event_type: 'yellow_card', player_id: 'p1307', team_id: 't13', minute: 58, half: '2' },
  { id: 'ev351', match_id: 'm69', event_type: 'red_card', player_id: 'p0114', team_id: 't01', minute: 84, half: '2' },

  // m70: taquariense(t03) 3 x 2 imigrante(t12)
  { id: 'ev352', match_id: 'm70', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 9, half: '1' },
  { id: 'ev353', match_id: 'm70', event_type: 'goal', player_id: 'p1201', team_id: 't12', minute: 24, half: '1' },
  { id: 'ev354', match_id: 'm70', event_type: 'goal', player_id: 'p0302', team_id: 't03', minute: 47, half: '2' },
  { id: 'ev355', match_id: 'm70', event_type: 'goal', player_id: 'p1209', team_id: 't12', minute: 63, half: '2' },
  { id: 'ev356', match_id: 'm70', event_type: 'goal', player_id: 'p0303', team_id: 't03', minute: 85, half: '2' },
  { id: 'ev357', match_id: 'm70', event_type: 'yellow_card', player_id: 'p0311', team_id: 't03', minute: 35, half: '1' },
  { id: 'ev358', match_id: 'm70', event_type: 'yellow_card', player_id: 'p1202', team_id: 't12', minute: 55, half: '2' },
  { id: 'ev359', match_id: 'm70', event_type: 'red_card', player_id: 'p0308', team_id: 't03', minute: 90, half: '2' },

  // m71: poco-antas(t05) 4 x 0 rudibar(t11)
  { id: 'ev360', match_id: 'm71', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 6, half: '1' },
  { id: 'ev361', match_id: 'm71', event_type: 'goal', player_id: 'p0503', team_id: 't05', minute: 30, half: '1' },
  { id: 'ev362', match_id: 'm71', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 55, half: '2' },
  { id: 'ev363', match_id: 'm71', event_type: 'goal', player_id: 'p0502', team_id: 't05', minute: 78, half: '2' },
  { id: 'ev364', match_id: 'm71', event_type: 'yellow_card', player_id: 'p1104', team_id: 't11', minute: 22, half: '1' },
  { id: 'ev365', match_id: 'm71', event_type: 'yellow_card', player_id: 'p0509', team_id: 't05', minute: 67, half: '2' },
  { id: 'ev366', match_id: 'm71', event_type: 'yellow_card', player_id: 'p0513', team_id: 't05', minute: 86, half: '2' },

  // m72: nacional(t09) 1 x 2 gaucho-teut(t08)
  { id: 'ev367', match_id: 'm72', event_type: 'goal', player_id: 'p0901', team_id: 't09', minute: 33, half: '1' },
  { id: 'ev368', match_id: 'm72', event_type: 'goal', player_id: 'p0801', team_id: 't08', minute: 57, half: '2' },
  { id: 'ev369', match_id: 'm72', event_type: 'goal', player_id: 'p0810', team_id: 't08', minute: 82, half: '2' },
  { id: 'ev370', match_id: 'm72', event_type: 'yellow_card', player_id: 'p0910', team_id: 't09', minute: 45, half: '1' },
  { id: 'ev371', match_id: 'm72', event_type: 'yellow_card', player_id: 'p0811', team_id: 't08', minute: 70, half: '2' },
  { id: 'ev372', match_id: 'm72', event_type: 'red_card', player_id: 'p0914', team_id: 't09', minute: 88, half: '2' },
  { id: 'ev373', match_id: 'm72', event_type: 'red_card', player_id: 'p0807', team_id: 't08', minute: 92, half: '2' },

  // m73: minuano(t07) 3 x 1 ecas(t10)
  { id: 'ev374', match_id: 'm73', event_type: 'goal', player_id: 'p0701', team_id: 't07', minute: 14, half: '1' },
  { id: 'ev375', match_id: 'm73', event_type: 'goal', player_id: 'p1002', team_id: 't10', minute: 38, half: '1' },
  { id: 'ev376', match_id: 'm73', event_type: 'goal', player_id: 'p0702', team_id: 't07', minute: 60, half: '2' },
  { id: 'ev377', match_id: 'm73', event_type: 'goal', player_id: 'p0715', team_id: 't07', minute: 83, half: '2' },
  { id: 'ev378', match_id: 'm73', event_type: 'yellow_card', player_id: 'p1003', team_id: 't10', minute: 28, half: '1' },
  { id: 'ev379', match_id: 'm73', event_type: 'yellow_card', player_id: 'p0705', team_id: 't07', minute: 50, half: '2' },
  { id: 'ev380', match_id: 'm73', event_type: 'red_card', player_id: 'p0712', team_id: 't07', minute: 89, half: '2' },

  // ════════════════════════════════════════
  // SEMI IDA (m74-m77)
  // ════════════════════════════════════════

  // m74: minuano(t07) 0 x 2 canabarrense(t01)
  { id: 'ev381', match_id: 'm74', event_type: 'goal', player_id: 'p0101', team_id: 't01', minute: 37, half: '1' },
  { id: 'ev382', match_id: 'm74', event_type: 'goal', player_id: 'p0102', team_id: 't01', minute: 71, half: '2' },
  { id: 'ev383', match_id: 'm74', event_type: 'yellow_card', player_id: 'p0703', team_id: 't07', minute: 25, half: '1' },
  { id: 'ev384', match_id: 'm74', event_type: 'yellow_card', player_id: 'p0706', team_id: 't07', minute: 55, half: '2' },
  { id: 'ev385', match_id: 'm74', event_type: 'yellow_card', player_id: 'p0112', team_id: 't01', minute: 80, half: '2' },
  { id: 'ev386', match_id: 'm74', event_type: 'red_card', player_id: 'p0713', team_id: 't07', minute: 87, half: '2' },

  // m75: taquariense(t03) 2 x 0 serrano(t06)
  { id: 'ev387', match_id: 'm75', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 22, half: '1' },
  { id: 'ev388', match_id: 'm75', event_type: 'goal', player_id: 'p0302', team_id: 't03', minute: 68, half: '2' },
  { id: 'ev389', match_id: 'm75', event_type: 'yellow_card', player_id: 'p0306', team_id: 't03', minute: 40, half: '1' },
  { id: 'ev390', match_id: 'm75', event_type: 'yellow_card', player_id: 'p0614', team_id: 't06', minute: 58, half: '2' },
  { id: 'ev391', match_id: 'm75', event_type: 'yellow_card', player_id: 'p0607', team_id: 't06', minute: 77, half: '2' },
  { id: 'ev392', match_id: 'm75', event_type: 'red_card', player_id: 'p0612', team_id: 't06', minute: 85, half: '2' },

  // m76: poco-antas(t05) 1 x 1 brasil(t04) [pen 4-5 later in volta]
  { id: 'ev393', match_id: 'm76', event_type: 'goal', player_id: 'p0503', team_id: 't05', minute: 29, half: '1' },
  { id: 'ev394', match_id: 'm76', event_type: 'goal', player_id: 'p0402', team_id: 't04', minute: 64, half: '2' },
  { id: 'ev395', match_id: 'm76', event_type: 'yellow_card', player_id: 'p0508', team_id: 't05', minute: 38, half: '1' },
  { id: 'ev396', match_id: 'm76', event_type: 'yellow_card', player_id: 'p0412', team_id: 't04', minute: 55, half: '2' },
  { id: 'ev397', match_id: 'm76', event_type: 'yellow_card', player_id: 'p0504', team_id: 't05', minute: 80, half: '2' },

  // m77: gaucho-teut(t08) 0 x 1 tiradentes(t02)
  { id: 'ev398', match_id: 'm77', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 58, half: '2' },
  { id: 'ev399', match_id: 'm77', event_type: 'yellow_card', player_id: 'p0804', team_id: 't08', minute: 22, half: '1' },
  { id: 'ev400', match_id: 'm77', event_type: 'yellow_card', player_id: 'p0807', team_id: 't08', minute: 45, half: '1' },
  { id: 'ev401', match_id: 'm77', event_type: 'yellow_card', player_id: 'p0213', team_id: 't02', minute: 70, half: '2' },
  { id: 'ev402', match_id: 'm77', event_type: 'red_card', player_id: 'p0810', team_id: 't08', minute: 83, half: '2' },

  // ════════════════════════════════════════
  // SEMI VOLTA (m78-m81)
  // ════════════════════════════════════════

  // m78: tiradentes(t02) 2 x 1 gaucho-teut(t08) (tir advances 3-1 agg)
  { id: 'ev403', match_id: 'm78', event_type: 'goal', player_id: 'p0204', team_id: 't02', minute: 18, half: '1' },
  { id: 'ev404', match_id: 'm78', event_type: 'goal', player_id: 'p0801', team_id: 't08', minute: 42, half: '1' },
  { id: 'ev405', match_id: 'm78', event_type: 'goal', player_id: 'p0203', team_id: 't02', minute: 76, half: '2' },
  { id: 'ev406', match_id: 'm78', event_type: 'yellow_card', player_id: 'p0809', team_id: 't08', minute: 30, half: '1' },
  { id: 'ev407', match_id: 'm78', event_type: 'yellow_card', player_id: 'p0210', team_id: 't02', minute: 55, half: '2' },
  { id: 'ev408', match_id: 'm78', event_type: 'yellow_card', player_id: 'p0811', team_id: 't08', minute: 84, half: '2' },
  { id: 'ev409', match_id: 'm78', event_type: 'red_card', player_id: 'p0205', team_id: 't02', minute: 91, half: '2' },

  // m79: canabarrense(t01) 1 x 0 minuano(t07) (can advances 3-0 agg)
  { id: 'ev410', match_id: 'm79', event_type: 'goal', player_id: 'p0101', team_id: 't01', minute: 52, half: '2' },
  { id: 'ev411', match_id: 'm79', event_type: 'yellow_card', player_id: 'p0712', team_id: 't07', minute: 34, half: '1' },
  { id: 'ev412', match_id: 'm79', event_type: 'yellow_card', player_id: 'p0115', team_id: 't01', minute: 63, half: '2' },
  { id: 'ev413', match_id: 'm79', event_type: 'yellow_card', player_id: 'p0710', team_id: 't07', minute: 79, half: '2' },
  { id: 'ev414', match_id: 'm79', event_type: 'red_card', player_id: 'p0711', team_id: 't07', minute: 86, half: '2' },

  // m80: brasil(t04) 1 x 1 poco-antas(t05) [pen 4-5, poco advances]
  { id: 'ev415', match_id: 'm80', event_type: 'goal', player_id: 'p0403', team_id: 't04', minute: 25, half: '1' },
  { id: 'ev416', match_id: 'm80', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 73, half: '2' },
  { id: 'ev417', match_id: 'm80', event_type: 'yellow_card', player_id: 'p0410', team_id: 't04', minute: 38, half: '1' },
  { id: 'ev418', match_id: 'm80', event_type: 'yellow_card', player_id: 'p0509', team_id: 't05', minute: 56, half: '2' },
  { id: 'ev419', match_id: 'm80', event_type: 'yellow_card', player_id: 'p0413', team_id: 't04', minute: 85, half: '2' },
  { id: 'ev420', match_id: 'm80', event_type: 'red_card', player_id: 'p0514', team_id: 't05', minute: 93, half: '2' },

  // m81: serrano(t06) 3 x 0 taquariense(t03) [pen 3-4, taq advances on pens]
  { id: 'ev421', match_id: 'm81', event_type: 'goal', player_id: 'p0601', team_id: 't06', minute: 13, half: '1' },
  { id: 'ev422', match_id: 'm81', event_type: 'goal', player_id: 'p0611', team_id: 't06', minute: 49, half: '2' },
  { id: 'ev423', match_id: 'm81', event_type: 'goal', player_id: 'p0602', team_id: 't06', minute: 78, half: '2' },
  { id: 'ev424', match_id: 'm81', event_type: 'yellow_card', player_id: 'p0312', team_id: 't03', minute: 32, half: '1' },
  { id: 'ev425', match_id: 'm81', event_type: 'yellow_card', player_id: 'p0304', team_id: 't03', minute: 60, half: '2' },
  { id: 'ev426', match_id: 'm81', event_type: 'yellow_card', player_id: 'p0603', team_id: 't06', minute: 72, half: '2' },
  { id: 'ev427', match_id: 'm81', event_type: 'red_card', player_id: 'p0314', team_id: 't03', minute: 88, half: '2' },

  // ════════════════════════════════════════
  // SEMI 2 IDA (m82-m83)
  // ════════════════════════════════════════

  // m82: poco-antas(t05) 2 x 2 tiradentes(t02)
  { id: 'ev428', match_id: 'm82', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 17, half: '1' },
  { id: 'ev429', match_id: 'm82', event_type: 'goal', player_id: 'p0201', team_id: 't02', minute: 34, half: '1' },
  { id: 'ev430', match_id: 'm82', event_type: 'goal', player_id: 'p0504', team_id: 't05', minute: 58, half: '2' },
  { id: 'ev431', match_id: 'm82', event_type: 'goal', player_id: 'p0202', team_id: 't02', minute: 82, half: '2' },
  { id: 'ev432', match_id: 'm82', event_type: 'yellow_card', player_id: 'p0508', team_id: 't05', minute: 26, half: '1' },
  { id: 'ev433', match_id: 'm82', event_type: 'yellow_card', player_id: 'p0207', team_id: 't02', minute: 47, half: '2' },
  { id: 'ev434', match_id: 'm82', event_type: 'yellow_card', player_id: 'p0501', team_id: 't05', minute: 75, half: '2' },
  { id: 'ev435', match_id: 'm82', event_type: 'red_card', player_id: 'p0513', team_id: 't05', minute: 90, half: '2' },

  // m83: taquariense(t03) 1 x 2 canabarrense(t01)
  { id: 'ev436', match_id: 'm83', event_type: 'goal', player_id: 'p0304', team_id: 't03', minute: 21, half: '1' },
  { id: 'ev437', match_id: 'm83', event_type: 'goal', player_id: 'p0102', team_id: 't01', minute: 53, half: '2' },
  { id: 'ev438', match_id: 'm83', event_type: 'goal', player_id: 'p0116', team_id: 't01', minute: 79, half: '2' },
  { id: 'ev439', match_id: 'm83', event_type: 'yellow_card', player_id: 'p0307', team_id: 't03', minute: 37, half: '1' },
  { id: 'ev440', match_id: 'm83', event_type: 'yellow_card', player_id: 'p0308', team_id: 't03', minute: 63, half: '2' },
  { id: 'ev441', match_id: 'm83', event_type: 'yellow_card', player_id: 'p0111', team_id: 't01', minute: 71, half: '2' },
  { id: 'ev442', match_id: 'm83', event_type: 'red_card', player_id: 'p0309', team_id: 't03', minute: 88, half: '2' },

  // ════════════════════════════════════════
  // SEMI 2 VOLTA (m84-m85)
  // ════════════════════════════════════════

  // m84: tiradentes(t02) 1 x 1 poco-antas(t05) [pen 2-3, poco advances]
  { id: 'ev443', match_id: 'm84', event_type: 'goal', player_id: 'p0204', team_id: 't02', minute: 30, half: '1' },
  { id: 'ev444', match_id: 'm84', event_type: 'goal', player_id: 'p0502', team_id: 't05', minute: 67, half: '2' },
  { id: 'ev445', match_id: 'm84', event_type: 'yellow_card', player_id: 'p0209', team_id: 't02', minute: 22, half: '1' },
  { id: 'ev446', match_id: 'm84', event_type: 'yellow_card', player_id: 'p0506', team_id: 't05', minute: 48, half: '2' },
  { id: 'ev447', match_id: 'm84', event_type: 'yellow_card', player_id: 'p0214', team_id: 't02', minute: 75, half: '2' },
  { id: 'ev448', match_id: 'm84', event_type: 'red_card', player_id: 'p0215', team_id: 't02', minute: 88, half: '2' },
  { id: 'ev449', match_id: 'm84', event_type: 'red_card', player_id: 'p0510', team_id: 't05', minute: 91, half: '2' },

  // m85: canabarrense(t01) 0 x 2 taquariense(t03) [pen 2-4, taq advances]
  { id: 'ev450', match_id: 'm85', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 41, half: '1' },
  { id: 'ev451', match_id: 'm85', event_type: 'goal', player_id: 'p0302', team_id: 't03', minute: 72, half: '2' },
  { id: 'ev452', match_id: 'm85', event_type: 'yellow_card', player_id: 'p0115', team_id: 't01', minute: 30, half: '1' },
  { id: 'ev453', match_id: 'm85', event_type: 'yellow_card', player_id: 'p0313', team_id: 't03', minute: 55, half: '2' },
  { id: 'ev454', match_id: 'm85', event_type: 'yellow_card', player_id: 'p0116', team_id: 't01', minute: 65, half: '2' },
  { id: 'ev455', match_id: 'm85', event_type: 'yellow_card', player_id: 'p0314', team_id: 't03', minute: 83, half: '2' },

  // ════════════════════════════════════════
  // FINAL IDA (m86)
  // ════════════════════════════════════════

  // m86: poco-antas(t05) 1 x 1 taquariense(t03)
  { id: 'ev456', match_id: 'm86', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 33, half: '1' },
  { id: 'ev457', match_id: 'm86', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 62, half: '2' },
  { id: 'ev458', match_id: 'm86', event_type: 'yellow_card', player_id: 'p0505', team_id: 't05', minute: 20, half: '1' },
  { id: 'ev459', match_id: 'm86', event_type: 'yellow_card', player_id: 'p0308', team_id: 't03', minute: 44, half: '1' },
  { id: 'ev460', match_id: 'm86', event_type: 'yellow_card', player_id: 'p0509', team_id: 't05', minute: 56, half: '2' },
  { id: 'ev461', match_id: 'm86', event_type: 'yellow_card', player_id: 'p0310', team_id: 't03', minute: 74, half: '2' },
  { id: 'ev462', match_id: 'm86', event_type: 'yellow_card', player_id: 'p0513', team_id: 't05', minute: 85, half: '2' },
  { id: 'ev463', match_id: 'm86', event_type: 'red_card', player_id: 'p0512', team_id: 't05', minute: 91, half: '2' },

  // ════════════════════════════════════════
  // FINAL VOLTA (m87)
  // ════════════════════════════════════════

  // m87: taquariense(t03) 4 x 2 poco-antas(t05) — TAQUARIENSE CAMPEÃO!
  { id: 'ev464', match_id: 'm87', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 11, half: '1' },
  { id: 'ev465', match_id: 'm87', event_type: 'goal', player_id: 'p0501', team_id: 't05', minute: 27, half: '1' },
  { id: 'ev466', match_id: 'm87', event_type: 'goal', player_id: 'p0302', team_id: 't03', minute: 39, half: '1' },
  { id: 'ev467', match_id: 'm87', event_type: 'goal', player_id: 'p0301', team_id: 't03', minute: 54, half: '2' },
  { id: 'ev468', match_id: 'm87', event_type: 'goal', player_id: 'p0503', team_id: 't05', minute: 69, half: '2' },
  { id: 'ev469', match_id: 'm87', event_type: 'goal', player_id: 'p0304', team_id: 't03', minute: 83, half: '2' },
  { id: 'ev470', match_id: 'm87', event_type: 'yellow_card', player_id: 'p0506', team_id: 't05', minute: 15, half: '1' },
  { id: 'ev471', match_id: 'm87', event_type: 'yellow_card', player_id: 'p0306', team_id: 't03', minute: 32, half: '1' },
  { id: 'ev472', match_id: 'm87', event_type: 'yellow_card', player_id: 'p0508', team_id: 't05', minute: 48, half: '2' },
  { id: 'ev473', match_id: 'm87', event_type: 'yellow_card', player_id: 'p0304', team_id: 't03', minute: 60, half: '2' },
  { id: 'ev474', match_id: 'm87', event_type: 'yellow_card', player_id: 'p0509', team_id: 't05', minute: 76, half: '2' },
  { id: 'ev475', match_id: 'm87', event_type: 'red_card', player_id: 'p0514', team_id: 't05', minute: 88, half: '2' },

  // ════════════════════════════════════════
  // ADDITIONAL YELLOW CARDS (distributed across matches to fill quotas)
  // These cover remaining yellow card counts for teams
  // ════════════════════════════════════════

  // Additional Gaúcho Progresso yellows (need more for 6 reds total + yellows)
  { id: 'ev476', match_id: 'm19', event_type: 'yellow_card', player_id: 'p1802', team_id: 't18', minute: 30, half: '1' },
  { id: 'ev477', match_id: 'm28', event_type: 'yellow_card', player_id: 'p1807', team_id: 't18', minute: 62, half: '2' },
  { id: 'ev478', match_id: 'm37', event_type: 'red_card', player_id: 'p1803', team_id: 't18', minute: 90, half: '2' },

  // Additional Navegantes reds (need 6 total)
  { id: 'ev479', match_id: 'm27', event_type: 'red_card', player_id: 'p1902', team_id: 't19', minute: 89, half: '2' },
  { id: 'ev480', match_id: 'm33', event_type: 'red_card', player_id: 'p1909', team_id: 't19', minute: 85, half: '2' },

  // Additional Nacional reds (need 4 total)
  { id: 'ev481', match_id: 'm43', event_type: 'red_card', player_id: 'p0908', team_id: 't09', minute: 90, half: '2' },
  { id: 'ev482', match_id: 'm50', event_type: 'red_card', player_id: 'p0911', team_id: 't09', minute: 89, half: '2' },

  // Additional yellow cards for remaining Nacional quota
  { id: 'ev483', match_id: 'm01', event_type: 'yellow_card', player_id: 'p0901', team_id: 't09', minute: 73, half: '2' },
  { id: 'ev484', match_id: 'm14', event_type: 'yellow_card', player_id: 'p0913', team_id: 't09', minute: 75, half: '2' },
  { id: 'ev485', match_id: 'm22', event_type: 'yellow_card', player_id: 'p0912', team_id: 't09', minute: 24, half: '1' },
  { id: 'ev486', match_id: 'm31', event_type: 'yellow_card', player_id: 'p0906', team_id: 't09', minute: 18, half: '1' },
  { id: 'ev487', match_id: 'm43', event_type: 'yellow_card', player_id: 'p0909', team_id: 't09', minute: 38, half: '1' },
  { id: 'ev488', match_id: 'm50', event_type: 'yellow_card', player_id: 'p0910', team_id: 't09', minute: 55, half: '2' },
  { id: 'ev489', match_id: 'm59', event_type: 'yellow_card', player_id: 'p0908', team_id: 't09', minute: 42, half: '1' },
  { id: 'ev490', match_id: 'm72', event_type: 'yellow_card', player_id: 'p0902', team_id: 't09', minute: 28, half: '1' },
  { id: 'ev491', match_id: 'm72', event_type: 'yellow_card', player_id: 'p0915', team_id: 't09', minute: 64, half: '2' },
  { id: 'ev492', match_id: 'm72', event_type: 'yellow_card', player_id: 'p0915', team_id: 't09', minute: 80, half: '2' },

  // Additional Canabarrense yellows
  { id: 'ev493', match_id: 'm20', event_type: 'yellow_card', player_id: 'p0110', team_id: 't01', minute: 27, half: '1' },
  { id: 'ev494', match_id: 'm34', event_type: 'yellow_card', player_id: 'p0113', team_id: 't01', minute: 55, half: '2' },
  { id: 'ev495', match_id: 'm36', event_type: 'yellow_card', player_id: 'p0112', team_id: 't01', minute: 60, half: '2' },
  { id: 'ev496', match_id: 'm53', event_type: 'yellow_card', player_id: 'p0114', team_id: 't01', minute: 52, half: '2' },
  { id: 'ev497', match_id: 'm65', event_type: 'yellow_card', player_id: 'p0110', team_id: 't01', minute: 35, half: '1' },
  { id: 'ev498', match_id: 'm69', event_type: 'yellow_card', player_id: 'p0115', team_id: 't01', minute: 22, half: '1' },
  { id: 'ev499', match_id: 'm74', event_type: 'yellow_card', player_id: 'p0116', team_id: 't01', minute: 65, half: '2' },
  { id: 'ev500', match_id: 'm79', event_type: 'yellow_card', player_id: 'p0111', team_id: 't01', minute: 44, half: '1' },
  { id: 'ev501', match_id: 'm83', event_type: 'yellow_card', player_id: 'p0112', team_id: 't01', minute: 36, half: '1' },
  { id: 'ev502', match_id: 'm85', event_type: 'yellow_card', player_id: 'p0113', team_id: 't01', minute: 48, half: '2' },

  // Additional Tiradentes yellows
  { id: 'ev503', match_id: 'm25', event_type: 'yellow_card', player_id: 'p0210', team_id: 't02', minute: 32, half: '1' },
  { id: 'ev504', match_id: 'm35', event_type: 'yellow_card', player_id: 'p0202', team_id: 't02', minute: 28, half: '1' },
  { id: 'ev505', match_id: 'm45', event_type: 'yellow_card', player_id: 'p0208', team_id: 't02', minute: 60, half: '2' },
  { id: 'ev506', match_id: 'm56', event_type: 'yellow_card', player_id: 'p0211', team_id: 't02', minute: 50, half: '2' },
  { id: 'ev507', match_id: 'm67', event_type: 'yellow_card', player_id: 'p0209', team_id: 't02', minute: 42, half: '1' },
  { id: 'ev508', match_id: 'm77', event_type: 'yellow_card', player_id: 'p0212', team_id: 't02', minute: 35, half: '1' },
  { id: 'ev509', match_id: 'm82', event_type: 'yellow_card', player_id: 'p0206', team_id: 't02', minute: 65, half: '2' },

  // Additional Taquariense yellows
  { id: 'ev510', match_id: 'm04', event_type: 'yellow_card', player_id: 'p0308', team_id: 't03', minute: 38, half: '1' },
  { id: 'ev511', match_id: 'm26', event_type: 'yellow_card', player_id: 'p0304', team_id: 't03', minute: 55, half: '2' },
  { id: 'ev512', match_id: 'm33', event_type: 'yellow_card', player_id: 'p0301', team_id: 't03', minute: 52, half: '2' },
  { id: 'ev513', match_id: 'm39', event_type: 'yellow_card', player_id: 'p0309', team_id: 't03', minute: 28, half: '1' },
  { id: 'ev514', match_id: 'm46', event_type: 'yellow_card', player_id: 'p0310', team_id: 't03', minute: 75, half: '2' },
  { id: 'ev515', match_id: 'm57', event_type: 'yellow_card', player_id: 'p0311', team_id: 't03', minute: 40, half: '1' },
  { id: 'ev516', match_id: 'm61', event_type: 'yellow_card', player_id: 'p0312', team_id: 't03', minute: 28, half: '1' },
  { id: 'ev517', match_id: 'm70', event_type: 'yellow_card', player_id: 'p0313', team_id: 't03', minute: 70, half: '2' },
  { id: 'ev518', match_id: 'm75', event_type: 'yellow_card', player_id: 'p0314', team_id: 't03', minute: 48, half: '2' },
  { id: 'ev519', match_id: 'm75', event_type: 'yellow_card', player_id: 'p0315', team_id: 't03', minute: 82, half: '2' },
  { id: 'ev520', match_id: 'm81', event_type: 'yellow_card', player_id: 'p0305', team_id: 't03', minute: 44, half: '1' },
  { id: 'ev521', match_id: 'm85', event_type: 'yellow_card', player_id: 'p0301', team_id: 't03', minute: 20, half: '1' },
  { id: 'ev522', match_id: 'm86', event_type: 'yellow_card', player_id: 'p0307', team_id: 't03', minute: 80, half: '2' },

  // Additional Brasil yellows
  { id: 'ev523', match_id: 'm13', event_type: 'yellow_card', player_id: 'p0409', team_id: 't04', minute: 30, half: '1' },
  { id: 'ev524', match_id: 'm23', event_type: 'yellow_card', player_id: 'p0411', team_id: 't04', minute: 72, half: '2' },
  { id: 'ev525', match_id: 'm32', event_type: 'yellow_card', player_id: 'p0410', team_id: 't04', minute: 25, half: '1' },
  { id: 'ev526', match_id: 'm40', event_type: 'yellow_card', player_id: 'p0414', team_id: 't04', minute: 58, half: '2' },
  { id: 'ev527', match_id: 'm49', event_type: 'yellow_card', player_id: 'p0413', team_id: 't04', minute: 35, half: '1' },
  { id: 'ev528', match_id: 'm64', event_type: 'yellow_card', player_id: 'p0415', team_id: 't04', minute: 65, half: '2' },
  { id: 'ev529', match_id: 'm66', event_type: 'yellow_card', player_id: 'p0416', team_id: 't04', minute: 28, half: '1' },
  { id: 'ev530', match_id: 'm76', event_type: 'yellow_card', player_id: 'p0417', team_id: 't04', minute: 70, half: '2' },

  // Additional Poço das Antas yellows
  { id: 'ev531', match_id: 'm15', event_type: 'yellow_card', player_id: 'p0508', team_id: 't05', minute: 30, half: '1' },
  { id: 'ev532', match_id: 'm21', event_type: 'yellow_card', player_id: 'p0512', team_id: 't05', minute: 38, half: '1' },
  { id: 'ev533', match_id: 'm30', event_type: 'yellow_card', player_id: 'p0514', team_id: 't05', minute: 72, half: '2' },
  { id: 'ev534', match_id: 'm42', event_type: 'yellow_card', player_id: 'p0513', team_id: 't05', minute: 55, half: '2' },
  { id: 'ev535', match_id: 'm54', event_type: 'yellow_card', player_id: 'p0507', team_id: 't05', minute: 75, half: '2' },
  { id: 'ev536', match_id: 'm60', event_type: 'yellow_card', player_id: 'p0515', team_id: 't05', minute: 35, half: '1' },
  { id: 'ev537', match_id: 'm71', event_type: 'yellow_card', player_id: 'p0510', team_id: 't05', minute: 42, half: '1' },
  { id: 'ev538', match_id: 'm80', event_type: 'yellow_card', player_id: 'p0515', team_id: 't05', minute: 30, half: '1' },

  // Additional Serrano yellows
  { id: 'ev539', match_id: 'm11', event_type: 'yellow_card', player_id: 'p0607', team_id: 't06', minute: 48, half: '2' },
  { id: 'ev540', match_id: 'm24', event_type: 'yellow_card', player_id: 'p0609', team_id: 't06', minute: 75, half: '2' },
  { id: 'ev541', match_id: 'm41', event_type: 'yellow_card', player_id: 'p0605', team_id: 't06', minute: 45, half: '1' },
  { id: 'ev542', match_id: 'm49', event_type: 'yellow_card', player_id: 'p0608', team_id: 't06', minute: 60, half: '2' },
  { id: 'ev543', match_id: 'm62', event_type: 'yellow_card', player_id: 'p0606', team_id: 't06', minute: 30, half: '1' },
  { id: 'ev544', match_id: 'm68', event_type: 'yellow_card', player_id: 'p0614', team_id: 't06', minute: 88, half: '2' },
  { id: 'ev545', match_id: 'm81', event_type: 'yellow_card', player_id: 'p0609', team_id: 't06', minute: 50, half: '2' },

  // Additional Minuano yellows
  { id: 'ev546', match_id: 'm08', event_type: 'yellow_card', player_id: 'p0708', team_id: 't07', minute: 42, half: '1' },
  { id: 'ev547', match_id: 'm18', event_type: 'yellow_card', player_id: 'p0707', team_id: 't07', minute: 55, half: '2' },
  { id: 'ev548', match_id: 'm27', event_type: 'yellow_card', player_id: 'p0712', team_id: 't07', minute: 18, half: '1' },
  { id: 'ev549', match_id: 'm43', event_type: 'yellow_card', player_id: 'p0705', team_id: 't07', minute: 30, half: '1' },
  { id: 'ev550', match_id: 'm51', event_type: 'yellow_card', player_id: 'p0710', team_id: 't07', minute: 48, half: '2' },
  { id: 'ev551', match_id: 'm58', event_type: 'yellow_card', player_id: 'p0713', team_id: 't07', minute: 38, half: '1' },
  { id: 'ev552', match_id: 'm73', event_type: 'yellow_card', player_id: 'p0706', team_id: 't07', minute: 72, half: '2' },
  { id: 'ev553', match_id: 'm74', event_type: 'yellow_card', player_id: 'p0714', team_id: 't07', minute: 42, half: '1' },

  // Additional Gaúcho Teutônia yellows
  { id: 'ev554', match_id: 'm03', event_type: 'yellow_card', player_id: 'p0806', team_id: 't08', minute: 28, half: '1' },
  { id: 'ev555', match_id: 'm25', event_type: 'yellow_card', player_id: 'p0808', team_id: 't08', minute: 35, half: '1' },
  { id: 'ev556', match_id: 'm32', event_type: 'yellow_card', player_id: 'p0809', team_id: 't08', minute: 70, half: '2' },
  { id: 'ev557', match_id: 'm39', event_type: 'yellow_card', player_id: 'p0810', team_id: 't08', minute: 52, half: '2' },
  { id: 'ev558', match_id: 'm44', event_type: 'yellow_card', player_id: 'p0804', team_id: 't08', minute: 40, half: '1' },
  { id: 'ev559', match_id: 'm72', event_type: 'yellow_card', player_id: 'p0803', team_id: 't08', minute: 43, half: '1' },
  { id: 'ev560', match_id: 'm77', event_type: 'yellow_card', player_id: 'p0801', team_id: 't08', minute: 65, half: '2' },

  // Additional Gaúcho Progresso yellows + reds
  { id: 'ev561', match_id: 'm34', event_type: 'yellow_card', player_id: 'p1809', team_id: 't18', minute: 50, half: '2' },
  { id: 'ev562', match_id: 'm37', event_type: 'yellow_card', player_id: 'p1806', team_id: 't18', minute: 30, half: '1' },
  { id: 'ev563', match_id: 'm48', event_type: 'red_card', player_id: 'p1802', team_id: 't18', minute: 85, half: '2' },

  // Additional Navegantes yellows + reds
  { id: 'ev564', match_id: 'm09', event_type: 'yellow_card', player_id: 'p1906', team_id: 't19', minute: 55, half: '2' },
  { id: 'ev565', match_id: 'm17', event_type: 'yellow_card', player_id: 'p1904', team_id: 't19', minute: 50, half: '2' },
  { id: 'ev566', match_id: 'm42', event_type: 'yellow_card', player_id: 'p1910', team_id: 't19', minute: 28, half: '1' },
];
