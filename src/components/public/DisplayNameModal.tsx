// ============================================================
// DISPLAY NAME MODAL — Forces users to set a public name
// Triggers for: no display_name, empty, or "Torcedor" (default)
// Includes fun anonymous name suggestions
// ============================================================
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, CheckCircle, Sparkles, Shuffle, EyeOff, User } from 'lucide-react';
import { getProfile, saveProfile, getCachedDisplayName } from '../../lib/galera-api';

// ============================
// ANONYMOUS NAME GENERATOR
// Football-themed fun names
// ============================
const ADJECTIVES = [
  'Misterioso', 'Ninja', 'Secreto', 'Incógnito', 'Anônimo',
  'Relâmpago', 'Lendário', 'Invisível', 'Silencioso', 'Veloz',
  'Certeiro', 'Implacável', 'Sagaz', 'Astuto', 'Destemido',
];

const NOUNS = [
  'Craque', 'Boleiro', 'Artilheiro', 'Paredão', 'Camisa10',
  'Goleador', 'Driblador', 'Zagueirão', 'Goleiro', 'Capitão',
  'Meia', 'Atacante', 'Lateral', 'Volante', 'Ponta',
];

const THEMED = [
  'Gol de Placa', 'Pé de Ouro', 'Torcida Raiz', 'Craque da Galera',
  'Bola Murcha', 'Fominha de Gol', 'Pé Quente', 'Caneta Mágica',
  'Chapéu de Couro', 'Bicicleta Voadora', 'Chute Cruzado',
  'Drible Seco', 'Firula Master', 'Corta-Luz', 'Elástico Perfeito',
];

function generateAnonNames(count = 5): string[] {
  const names = new Set<string>();
  
  // Mix random adjective+noun combos
  while (names.size < Math.min(count - 1, 3)) {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    names.add(`${noun} ${adj}`);
  }
  
  // Add themed names
  const shuffledThemed = [...THEMED].sort(() => Math.random() - 0.5);
  for (const t of shuffledThemed) {
    if (names.size >= count) break;
    names.add(t);
  }

  return [...names].slice(0, count);
}

/** Names that should trigger the "set your name" prompt */
const PLACEHOLDER_NAMES = ['torcedor', 'torcedora', ''];

function needsNameChange(displayName: string | undefined | null): boolean {
  if (!displayName) return true;
  const normalized = displayName.trim().toLowerCase();
  if (PLACEHOLDER_NAMES.includes(normalized)) return true;
  // Also catch "Torcedor" with numbers like "Torcedor123"
  if (/^torcedor[a]?\s*\d*$/i.test(normalized)) return true;
  return false;
}

// ============================
// COMPONENT
// ============================
interface DisplayNameModalProps {
  isOpen: boolean;
  onClose: (name: string) => void;
  /** User email to suggest a name from */
  email?: string;
  /** If true, this is a returning user being asked to change from "Torcedor" */
  isNameChange?: boolean;
}

export { needsNameChange };

export function DisplayNameModal({ isOpen, onClose, email, isNameChange }: DisplayNameModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [anonSuggestions, setAnonSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const refreshSuggestions = useCallback(() => {
    setAnonSuggestions(generateAnonNames(5));
  }, []);

  // Check if user already has a valid display name
  useEffect(() => {
    if (!isOpen) return;
    setChecking(true);
    refreshSuggestions();

    // First check local cache (instant)
    const cached = getCachedDisplayName();
    if (cached && !needsNameChange(cached)) {
      setChecking(false);
      onClose(cached);
      return;
    }

    // Then check server
    getProfile()
      .then((profile) => {
        if (profile?.display_name && !needsNameChange(profile.display_name)) {
          onClose(profile.display_name);
        } else {
          // Suggest name from email
          if (email) {
            const suggested = email.split('@')[0]
              .replace(/[._-]/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase())
              .trim();
            // Only pre-fill if it looks like a real name (not just numbers/garbage)
            if (suggested.length >= 3 && /[a-zA-Z]/.test(suggested)) {
              setName(suggested);
            }
          }
          setTimeout(() => inputRef.current?.focus(), 300);
        }
      })
      .catch(() => {
        if (email) {
          const suggested = email.split('@')[0]
            .replace(/[._-]/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase())
            .trim();
          if (suggested.length >= 3 && /[a-zA-Z]/.test(suggested)) {
            setName(suggested);
          }
        }
      })
      .finally(() => setChecking(false));
  }, [isOpen]);

  if (!isOpen || checking) return null;

  const handleSave = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Nome precisa ter pelo menos 2 caracteres');
      return;
    }
    if (trimmed.length > 30) {
      setError('Nome muito longo (máx. 30 caracteres)');
      return;
    }
    if (needsNameChange(trimmed)) {
      setError('Escolha um nome diferente de "Torcedor"');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await saveProfile({ display_name: trimmed, phone: phone.trim() || undefined });
      onClose(trimmed);
    } catch (err: any) {
      setError('Erro ao salvar. Tente novamente.');
      console.error('[DisplayName] Save error:', err);
    }
    setLoading(false);
  };

  const selectSuggestion = (suggestion: string) => {
    setName(suggestion);
    setError('');
    inputRef.current?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-sm mx-4 bg-popover border border-border rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-lg font-extrabold text-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
              {isNameChange ? 'Atualize seu nome' : 'Como quer ser chamado?'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed" style={{ fontFamily: 'var(--font-body)' }}>
              {isNameChange
                ? 'Seu nome aparece como "Torcedor" nos rankings. Escolha um nome de verdade ou um apelido anônimo!'
                : 'Escolha um nome público para os rankings do Bolão e Seleção da Galera'}
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mb-3">
          <label className="text-xs text-muted-foreground mb-1.5 block" style={{ fontFamily: 'var(--font-heading)' }}>
            Nome público
          </label>
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(''); }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder="Digite seu nome ou escolha abaixo"
            maxLength={30}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground text-base"
            style={{ fontFamily: 'var(--font-body)' }}
          />
          <p className="text-[10px] text-muted-foreground mt-1 text-right">
            {name.length}/30
          </p>
        </div>

        {/* Phone / WhatsApp */}
        <div className="mb-3">
          <label className="text-xs text-muted-foreground mb-1.5 block" style={{ fontFamily: 'var(--font-heading)' }}>
            WhatsApp <span className="text-[9px] opacity-60">(opcional)</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            placeholder="(51) 99999-9999"
            maxLength={20}
            className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground text-sm"
            style={{ fontFamily: 'var(--font-body)' }}
          />
        </div>

        {/* Anonymous suggestions */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <EyeOff className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] font-bold text-muted-foreground" style={{ fontFamily: 'var(--font-heading)' }}>
                Prefere um apelido anônimo?
              </span>
            </div>
            <button
              onClick={refreshSuggestions}
              className="flex items-center gap-1 text-[10px] text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              <Shuffle className="w-3 h-3" />
              Sortear
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {anonSuggestions.map((s, i) => (
              <button
                key={`${s}-${i}`}
                onClick={() => selectSuggestion(s)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all active:scale-95 ${
                  name === s
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                    : 'bg-secondary text-foreground border border-border hover:border-primary/30 hover:bg-primary/5'
                }`}
                style={{ fontFamily: 'var(--font-body)' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 mb-3 text-destructive text-xs" style={{ fontFamily: 'var(--font-body)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={loading || name.trim().length < 2}
          className="w-full disabled:opacity-40 bg-primary text-primary-foreground font-bold rounded-xl py-3.5 transition-colors flex items-center justify-center gap-2 active:scale-[0.97]"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Confirmar nome
            </>
          )}
        </button>

        <p className="text-[10px] text-muted-foreground text-center mt-3 leading-relaxed">
          Você pode alterar depois nas configurações
        </p>
      </div>
    </div>
  );
}