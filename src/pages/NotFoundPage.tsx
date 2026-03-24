import { useNavigate } from 'react-router';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
        <span className="text-4xl font-black text-emerald-500" style={{ fontFamily: 'JetBrains Mono' }}>404</span>
      </div>
      <h1 className="text-2xl font-black text-white mb-2">Página não encontrada</h1>
      <p className="text-sm text-slate-400 mb-8 max-w-xs">
        O conteúdo que você procura não existe ou foi movido.
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 transition-colors"
        >
          <Home className="w-4 h-4" /> Início
        </button>
      </div>
    </div>
  );
}
