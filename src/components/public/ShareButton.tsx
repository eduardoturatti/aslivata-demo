import React from 'react';
import { Share2, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// ============================
// Botao universal de compartilhar link
// Usa navigator.share quando disponivel, senao copia para clipboard
// ============================
interface ShareButtonProps {
  text: string;
  url: string;
  title?: string;
  label?: string;
  variant?: 'default' | 'compact' | 'pill';
  className?: string;
}

export function ShareButton({ text, url, title, label = 'Compartilhar', variant = 'default', className = '' }: ShareButtonProps) {
  const [copied, setCopied] = React.useState(false);

  const handleShare = async () => {
    // Build share text (without URL embedded - navigator.share handles url separately)
    const shareTitle = title || 'Power Sports';

    // Try native share first
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: shareTitle,
          text: text,
          url: url,
        });
        // User completed the share (didn't cancel)
        return;
      } catch (err: any) {
        // AbortError = user cancelled the share dialog, that's fine
        if (err?.name === 'AbortError') return;
        // For other errors (NotAllowedError, TypeError), fall through to clipboard
        console.log('navigator.share nao disponivel, usando clipboard:', err?.message);
      }
    }

    // Fallback: copy text + url to clipboard
    const clipboardText = `${text}\n\n${url}`;
    let success = false;

    try {
      await navigator.clipboard.writeText(clipboardText);
      success = true;
    } catch {
      // Final fallback: textarea hack for older browsers
      try {
        const ta = document.createElement('textarea');
        ta.value = clipboardText;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        success = document.execCommand('copy');
        document.body.removeChild(ta);
      } catch { /* */ }
    }

    if (success) {
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Nao foi possivel copiar o link');
    }
  };

  const baseClasses = {
    default: 'flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-muted active:scale-[0.97] transition-all',
    compact: 'flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-card border border-border text-[10px] text-muted-foreground hover:text-foreground active:scale-[0.97] transition-all',
    pill: 'flex items-center justify-center gap-1.5 py-2 px-4 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary hover:bg-primary/15 active:scale-[0.97] transition-all',
  };

  return (
    <button onClick={handleShare} className={`${baseClasses[variant]} ${className}`}>
      {copied
        ? <Check className={variant === 'compact' ? 'w-3 h-3 text-green-500' : 'w-3.5 h-3.5 text-green-500'} />
        : <Share2 className={variant === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      }
      {copied ? 'Copiado!' : label}
    </button>
  );
}

// Helper para gerar texto de compartilhamento
export function buildShareText(subject: string, detail?: string): string {
  const parts = [subject];
  if (detail) parts.push(detail);
  parts.push('Confira no Power Sports - 26ª Regional Certel/Sicredi 2025');
  return parts.join('\n');
}