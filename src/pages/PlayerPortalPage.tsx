import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  User, Camera, Save, Target, AlertTriangle,
  Calendar, Zap, Edit3, Share2, Check, Loader2,
  Instagram, Ruler, Weight, Footprints, ChevronRight, BarChart3,
  ArrowLeft,
} from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { logoUrl, photoUrl } from '../lib/image-utils';
import { getPositionLabel, shareContent } from '../lib/galera-api';
import { differenceInYears } from 'date-fns';
import { motion } from 'motion/react';
import { PageTransition } from '../components/public/PageTransition';

const SERVER = `https://${projectId}.supabase.co/functions/v1/make-server-a98fb753/portal`;

function TeamLogo({ url, name, size = 32 }: { url?: string; name: string; size?: number }) {
  const [err, setErr] = useState(false);
  if (!url || err) {
    return (
      <div className="rounded-full bg-muted flex items-center justify-center text-foreground font-bold shrink-0"
        style={{ width: size, height: size, fontFamily: 'var(--font-heading)', fontSize: size * 0.3 }}>
        {name.slice(0, 2)}
      </div>
    );
  }
  return <img src={logoUrl(url, size)} alt={name} width={size} height={size} loading="lazy" decoding="async" onError={() => setErr(true)} className="object-contain shrink-0" />;
}

interface PlayerData {
  id: string;
  name: string;
  number: string;
  position: string;
  photo_url: string | null;
  team_id: string;
  teams: any;
  bio: string;
  instagram: string;
  phone: string;
  height_cm: number | null;
  weight_kg: number | null;
  dominant_foot: string;
  birth_date: string;
  total_goals: number;
  total_assists: number;
  total_yellow_cards: number;
  total_red_cards: number;
  total_games: number;
  total_minutes: number;
  avg_rating: number;
  is_suspended: boolean;
}

export function PlayerPortalPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [lineups, setLineups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Editable fields
  const [bio, setBio] = useState('');
  const [instagram, setInstagram] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [dominantFoot, setDominantFoot] = useState('');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    if (!token) return;
    fetch(`${SERVER}/profile/${token}`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setPlayer(data.player);
          setEvents(data.events || []);
          setLineups(data.lineups || []);
          // Initialize edit fields
          setBio(data.player.bio || '');
          setInstagram(data.player.instagram || '');
          setHeightCm(data.player.height_cm ? String(data.player.height_cm) : '');
          setWeightKg(data.player.weight_kg ? String(data.player.weight_kg) : '');
          setDominantFoot(data.player.dominant_foot || '');
          setBirthDate(data.player.birth_date || '');
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('[Portal]', err);
        setError('Erro ao carregar perfil');
        setLoading(false);
      });
  }, [token]);

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);
    try {
      const res = await fetch(`${SERVER}/profile/${token}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          bio,
          instagram,
          height_cm: heightCm ? parseInt(heightCm) : null,
          weight_kg: weightKg ? parseInt(weightKg) : null,
          dominant_foot: dominantFoot,
          birth_date: birthDate,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setEditing(false);
        setTimeout(() => setSaved(false), 3000);
        // Update local state
        if (player) {
          setPlayer({
            ...player,
            bio,
            instagram,
            height_cm: heightCm ? parseInt(heightCm) : null,
            weight_kg: weightKg ? parseInt(weightKg) : null,
            dominant_foot: dominantFoot,
            birth_date: birthDate,
          });
        }
      }
    } catch (err) {
      console.error('[Portal] Save error:', err);
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${SERVER}/photo/${token}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${publicAnonKey}` },
        body: formData,
      });
      const data = await res.json();
      if (data.photo_url && player) {
        setPlayer({ ...player, photo_url: data.photo_url });
      }
    } catch (err) {
      console.error('[Portal] Photo upload error:', err);
    }
    setUploadingPhoto(false);
  };

  const handleShare = () => {
    if (!player) return;
    const team = player.teams;
    const text = `${player.name} | #${player.number} ${getPositionLabel(player.position)}\n${team?.short_name || team?.name || ''}\n\n${player.total_goals || 0} gols · ${player.total_assists || 0} assists · ${player.total_games || 0} jogos\n\nVeja meu perfil no Power Sports:`;
    shareContent(text, `${player.name} - Power Sports`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-4">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">Carregando seu perfil...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
          Link invalido
        </h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          {error || 'Este link de perfil nao foi encontrado. Verifique com a organizacao do campeonato.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="text-primary text-sm font-semibold hover:text-primary/80"
        >
          Ir para a pagina inicial
        </button>
      </div>
    );
  }

  const team = player.teams;
  const teamColor = team?.color || '#3B82F6';
  const age = player.birth_date ? differenceInYears(new Date(), new Date(player.birth_date)) : null;

  const goals = events.filter(e => e.event_type === 'goal' || e.event_type === 'penalty_scored').length;
  const assists = events.filter(e => e.event_type === 'assist').length;
  const yellows = events.filter(e => e.event_type === 'yellow_card').length;
  const reds = events.filter(e => e.event_type === 'red_card').length;

  return (
    <PageTransition>
      <div className="pb-8">
        {/* Back */}
        <div className="px-4 pt-4">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm mb-3 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Inicio
          </button>
        </div>

        {/* Hero */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${teamColor}25 0%, ${teamColor}08 50%, transparent 100%)` }} />
          <div className="relative px-4 py-6">
            <div className="flex items-start gap-4">
              {/* Photo with upload */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative shrink-0"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border bg-muted">
                  {player.photo_url ? (
                    <img src={photoUrl(player.photo_url, 192)} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                </div>
                {/* Camera button */}
                <button
                  onClick={() => fileRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                {/* Number badge */}
                {player.number && (
                  <div
                    className="absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: teamColor, fontFamily: 'var(--font-mono)' }}
                  >
                    {player.number}
                  </div>
                )}
              </motion.div>

              <div className="flex-1 min-w-0 pt-1">
                <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">
                  MEU PERFIL
                </p>
                <h1 className="text-xl font-black text-foreground leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>
                  {player.name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <TeamLogo url={team?.logo_url} name={team?.short_name || ''} size={20} />
                  <span className="text-xs text-muted-foreground font-semibold">{team?.short_name || team?.name}</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs font-bold" style={{ color: teamColor }}>{getPositionLabel(player.position)}</span>
                </div>
                {/* Quick actions */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setEditing(!editing)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${editing ? 'bg-primary text-white' : 'bg-card border border-border text-foreground'}`}
                  >
                    <Edit3 className="w-3 h-3" />
                    {editing ? 'Editando' : 'Editar perfil'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-card border border-border text-foreground"
                  >
                    <Share2 className="w-3 h-3" />
                    Compartilhar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 space-y-5">
          {/* Saved toast */}
          {saved && (
            <motion.div
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5"
            >
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-sm font-semibold text-green-600">Perfil salvo com sucesso!</span>
            </motion.div>
          )}

          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Jogos', value: player.total_games || 0, icon: Calendar, color: 'text-blue-500' },
              { label: 'Gols', value: player.total_goals || 0, icon: Zap, color: 'text-green-500' },
              { label: 'Assists', value: player.total_assists || 0, icon: Target, color: 'text-purple-500' },
              { label: 'Cartoes', value: (player.total_yellow_cards || 0) + (player.total_red_cards || 0), icon: AlertTriangle, color: 'text-yellow-500' },
            ].map((stat, i) => (
              <div key={i} className="bg-card rounded-xl border border-border p-3 text-center">
                <stat.icon className={`w-4 h-4 mx-auto mb-1 ${stat.color}`} />
                <p className="text-lg font-black text-foreground" style={{ fontFamily: 'var(--font-mono)' }}>
                  {stat.value}
                </p>
                <p className="text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Edit form */}
          {editing && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              className="bg-card rounded-xl border border-primary/20 p-4 space-y-4"
            >
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Editar informacoes
              </h3>

              {/* Bio */}
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
                  Bio / Sobre voce
                </label>
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Ex: Apaixonado por futebol, jogando desde os 8 anos..."
                  maxLength={200}
                  rows={3}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder-muted-foreground resize-none"
                />
              </div>

              {/* Instagram */}
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
                  Instagram
                </label>
                <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-3 py-2.5">
                  <Instagram className="w-4 h-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value.replace('@', ''))}
                    placeholder="seu_usuario"
                    className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                  />
                </div>
              </div>

              {/* Physical */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> Altura
                  </label>
                  <div className="flex items-center gap-1 bg-secondary border border-border rounded-xl px-3 py-2.5">
                    <input
                      type="number"
                      value={heightCm}
                      onChange={e => setHeightCm(e.target.value)}
                      placeholder="175"
                      className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">cm</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Weight className="w-3 h-3" /> Peso
                  </label>
                  <div className="flex items-center gap-1 bg-secondary border border-border rounded-xl px-3 py-2.5">
                    <input
                      type="number"
                      value={weightKg}
                      onChange={e => setWeightKg(e.target.value)}
                      placeholder="75"
                      className="w-full bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                    />
                    <span className="text-[10px] text-muted-foreground shrink-0">kg</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 flex items-center gap-1">
                    <Footprints className="w-3 h-3" /> Pe
                  </label>
                  <select
                    value={dominantFoot}
                    onChange={e => setDominantFoot(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                  >
                    <option value="">--</option>
                    <option value="right">Destro</option>
                    <option value="left">Canhoto</option>
                    <option value="both">Ambos</option>
                  </select>
                </div>
              </div>

              {/* Birth date */}
              <div>
                <label className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-1 block">
                  Data de nascimento
                </label>
                <input
                  type="date"
                  value={birthDate}
                  onChange={e => setBirthDate(e.target.value)}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none"
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary text-white font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors active:scale-[0.97] disabled:opacity-50"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Salvar alteracoes
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Bio display (when not editing) */}
          {!editing && bio && (
            <div className="bg-card rounded-xl border border-border px-4 py-3">
              <p className="text-xs text-foreground leading-relaxed">{bio}</p>
              {instagram && (
                <a
                  href={`https://instagram.com/${instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 mt-2 text-[11px] text-primary font-semibold"
                >
                  <Instagram className="w-3.5 h-3.5" /> @{instagram}
                </a>
              )}
            </div>
          )}

          {/* Physical info */}
          {!editing && (player.height_cm || player.weight_kg || player.dominant_foot || age) && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {age && (
                <div className="flex items-center gap-1.5 bg-card rounded-lg border border-border px-3 py-2 shrink-0">
                  <Calendar className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-foreground font-semibold">{age} anos</span>
                </div>
              )}
              {player.height_cm && (
                <div className="flex items-center gap-1.5 bg-card rounded-lg border border-border px-3 py-2 shrink-0">
                  <Ruler className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-foreground font-semibold">{player.height_cm} cm</span>
                </div>
              )}
              {player.weight_kg && (
                <div className="flex items-center gap-1.5 bg-card rounded-lg border border-border px-3 py-2 shrink-0">
                  <Weight className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-foreground font-semibold">{player.weight_kg} kg</span>
                </div>
              )}
              {player.dominant_foot && (
                <div className="flex items-center gap-1.5 bg-card rounded-lg border border-border px-3 py-2 shrink-0">
                  <Footprints className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-foreground font-semibold">
                    {player.dominant_foot === 'right' ? 'Destro' : player.dominant_foot === 'left' ? 'Canhoto' : 'Ambidestro'}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Match history */}
          {events.length > 0 && (
            <section>
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2" style={{ fontFamily: 'var(--font-heading)' }}>
                <BarChart3 className="w-4 h-4 text-primary" />
                Seus eventos no campeonato
              </h3>
              <div className="space-y-2">
                {events.slice(0, 20).map((ev: any, i: number) => {
                  const match = ev.matches;
                  const isGoal = ev.event_type === 'goal' || ev.event_type === 'penalty_scored';
                  const isAssist = ev.event_type === 'assist';
                  const isYellow = ev.event_type === 'yellow_card';
                  const isRed = ev.event_type === 'red_card';

                  return (
                    <button
                      key={ev.id || i}
                      onClick={() => match?.id && navigate(`/jogo/${match.id}`)}
                      className="w-full bg-card rounded-xl border border-border px-3.5 py-2.5 text-left hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {isGoal && <span className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center text-green-500 text-[10px] font-bold">G</span>}
                        {isAssist && <span className="w-6 h-6 rounded-full bg-blue-500/15 flex items-center justify-center text-blue-500 text-[10px] font-bold">A</span>}
                        {isYellow && <span className="w-3 h-4 rounded-[1px] bg-yellow-400" />}
                        {isRed && <span className="w-3 h-4 rounded-[1px] bg-red-500" />}
                        {!isGoal && !isAssist && !isYellow && !isRed && (
                          <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground text-[10px] font-bold">
                            {ev.event_type?.[0]?.toUpperCase() || '?'}
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {ev.event_type === 'goal' ? 'Gol' : ev.event_type === 'assist' ? 'Assistencia' : ev.event_type === 'yellow_card' ? 'Cartao amarelo' : ev.event_type === 'red_card' ? 'Cartao vermelho' : ev.event_type === 'penalty_scored' ? 'Gol de penalti' : ev.event_type}
                          </p>
                          {match && (
                            <p className="text-[10px] text-muted-foreground">
                              Rod. {match.round_number} · {match.score_home}-{match.score_away}
                              {ev.minute ? ` · ${ev.minute}'` : ''}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* CTA: view public profile */}
          <button
            onClick={() => navigate(`/jogador/${player.id}`)}
            className="w-full bg-card rounded-xl border border-border px-4 py-3.5 flex items-center gap-3 hover:bg-muted transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs font-bold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Ver meu perfil publico
              </p>
              <p className="text-[10px] text-muted-foreground">Como os torcedores veem voce</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Footer note */}
          <p className="text-[10px] text-center text-subtle px-4 leading-relaxed">
            Seu link pessoal e exclusivo. Nao compartilhe o link com outros jogadores.
            Para ajuda, entre em contato com a organizacao.
          </p>
        </div>
      </div>
    </PageTransition>
  );
}