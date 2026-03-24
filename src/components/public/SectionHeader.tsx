import React from 'react';

/**
 * SectionHeader — componente padronizado para títulos de seção.
 * Usado em todas as páginas para manter consistência visual.
 *
 * Variantes:
 *   "section"  → h3, text-sm (padrão, dentro de cards/seções)
 *   "page"     → h2, text-lg (título de página com ícone)
 */
interface SectionHeaderProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: 'section' | 'page';
  /** Conteúdo extra à direita (botões, badges, etc.) */
  trailing?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ title, icon: Icon, variant = 'section', trailing, className = '' }: SectionHeaderProps) {
  const isPage = variant === 'page';

  return (
    <div className={`flex items-center gap-2 ${isPage ? 'mb-5' : 'mb-3'} ${className}`}>
      {Icon && <Icon className={`${isPage ? 'w-5 h-5' : 'w-4 h-4'} text-primary shrink-0`} />}
      {isPage ? (
        <h2 className="text-lg font-extrabold text-foreground flex-1 min-w-0" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h2>
      ) : (
        <h3 className="text-sm font-bold text-foreground flex-1 min-w-0" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h3>
      )}
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}
