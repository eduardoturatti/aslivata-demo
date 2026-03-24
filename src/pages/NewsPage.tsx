import React, { useState, useEffect, useCallback } from 'react';
import { ExternalLink, RefreshCw, Newspaper, ChevronRight, Clock } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { PageTransition } from '../components/public/PageTransition';
import { SectionHeader } from '../components/public/SectionHeader';
import { NewsSkeleton } from '../components/public/Skeletons';
import { newsImageUrl } from '../lib/image-utils';

interface Article {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  link: string;
  image: string | null;
  author: string;
  categories: string[];
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
}

export function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = useCallback(async (pageNum: number, append = false) => {
    try {
      if (pageNum === 1) setLoading(true);
      else setLoadingMore(true);
      setError(null);

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-a98fb753/news?page=${pageNum}&per_page=10`,
        { headers: { Authorization: `Bearer ${publicAnonKey}` } }
      );

      if (!res.ok) throw new Error(`Erro ${res.status}`);
      const data = await res.json();

      if (data.error && (!data.articles || data.articles.length === 0)) {
        throw new Error(data.error);
      }

      const arts = data.articles || [];
      setArticles(prev => append ? [...prev, ...arts] : arts);
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);
    } catch (e: any) {
      console.error('[News] Fetch error:', e);
      setError(e.message);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchNews(1);
  }, [fetchNews]);

  const loadMore = () => {
    if (page < totalPages && !loadingMore) {
      fetchNews(page + 1, true);
    }
  };

  return (
    <PageTransition>
      <div className="px-4 py-5">
        {/* Header */}
        <SectionHeader
          title="Notícias"
          icon={Newspaper}
          variant="page"
          trailing={
            <button
              onClick={() => fetchNews(1)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-full bg-secondary"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          }
        />

        <p className="text-[11px] text-muted-foreground mb-4 flex items-center gap-1.5">
          <ExternalLink className="w-3 h-3" />
          Via <a href="https://jornalforcadovale.com.br/esporte/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">Jornal Forca do Vale</a>
        </p>

        {/* Loading skeleton */}
        {loading && (
          <NewsSkeleton count={4} />
        )}

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground mb-3">Erro ao carregar notícias</p>
            <p className="text-[10px] text-muted-foreground/60 mb-4">{error}</p>
            <button
              onClick={() => fetchNews(1)}
              className="text-xs text-primary hover:underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Articles */}
        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-12">
            <Newspaper className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma notícia encontrada</p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="space-y-4">
            {/* Featured article (first) */}
            {articles[0] && (
              <a
                href={articles[0].link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl overflow-hidden bg-card border border-border hover:border-primary/30 transition-all active:scale-[0.98]"
              >
                {articles[0].image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={newsImageUrl(articles[0].image, 640)}
                      alt=""
                      loading="eager"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h2
                        className="text-sm font-bold text-white leading-snug line-clamp-3"
                        style={{ fontFamily: 'var(--font-heading)' }}
                        dangerouslySetInnerHTML={{ __html: articles[0].title }}
                      />
                    </div>
                  </div>
                )}
                {!articles[0].image && (
                  <div className="p-4">
                    <h2
                      className="text-sm font-bold text-foreground leading-snug line-clamp-3"
                      style={{ fontFamily: 'var(--font-heading)' }}
                      dangerouslySetInnerHTML={{ __html: articles[0].title }}
                    />
                  </div>
                )}
                <div className="px-3 pb-3 pt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{formatDistanceToNow(new Date(articles[0].date), { addSuffix: true, locale: ptBR })}</span>
                  {articles[0].categories.length > 0 && (
                    <>
                      <span className="text-muted-foreground/30">|</span>
                      <span className="text-primary font-medium">{articles[0].categories[0]}</span>
                    </>
                  )}
                  <ChevronRight className="w-3 h-3 ml-auto text-primary" />
                </div>
              </a>
            )}

            {/* Rest of articles */}
            {articles.slice(1).map(article => (
              <a
                key={article.id}
                href={article.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 bg-card rounded-xl border border-border p-3 hover:border-primary/30 transition-all active:scale-[0.98]"
              >
                {article.image && (
                  <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0">
                    <img
                      src={newsImageUrl(article.image, 192)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-xs font-bold text-foreground leading-snug line-clamp-2 mb-1"
                    style={{ fontFamily: 'var(--font-heading)' }}
                    dangerouslySetInnerHTML={{ __html: article.title }}
                  />
                  <p className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed mb-1.5">
                    {stripHtml(article.excerpt).slice(0, 120)}
                  </p>
                  <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/60">
                    <Clock className="w-2.5 h-2.5" />
                    <span>{formatDistanceToNow(new Date(article.date), { addSuffix: true, locale: ptBR })}</span>
                    {article.categories.length > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-primary/70">{article.categories[0]}</span>
                      </>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0 self-center" />
              </a>
            ))}

            {/* Load more */}
            {page < totalPages && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full py-3 text-xs text-primary font-semibold hover:bg-primary/5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Carregar mais'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </PageTransition>
  );
}