import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { getAdminToken } from '../lib/admin-token';

const SERVER_URL = `https://${projectId}.supabase.co/functions/v1/make-server-a98fb753`;

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  compact?: boolean;
}

export function ImageUpload({ value, onChange, label, compact = false }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('Máximo 5MB');
      return;
    }
    setIsUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${SERVER_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-Admin-Token': getAdminToken(),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload falhou');
      onChange(data.url);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }, [onChange]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    if (inputRef.current) inputRef.current.value = '';
  }, [handleUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) handleUpload(file);
  }, [handleUpload]);

  if (compact) {
    return (
      <div>
        {label && <label className="text-[10px] text-slate-500 block mb-1">{label}</label>}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isUploading}
            className="w-9 h-9 rounded-lg border border-slate-200 hover:border-emerald-400 flex items-center justify-center overflow-hidden transition-colors flex-shrink-0 bg-white"
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <Loader2 className="w-3.5 h-3.5 text-emerald-500 animate-spin" />
            ) : value ? (
              <img src={value} alt="" className="w-full h-full object-contain p-0.5" />
            ) : (
              <Upload className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="URL ou envie"
            className="flex-1 min-w-0 text-xs rounded-lg bg-white border border-slate-200 text-slate-700 px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500/40 placeholder-slate-400"
          />
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 flex-shrink-0">
              <X className="w-3 h-3" />
            </button>
          )}
          <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
        </div>
        {error && <div className="text-[9px] text-red-500 mt-0.5">{error}</div>}
      </div>
    );
  }

  return (
    <div>
      {label && <label className="text-[10px] text-slate-500 block mb-1">{label}</label>}
      <div className="flex items-start gap-2">
        {/* Preview / Drop zone */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className={`relative w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden transition-all flex-shrink-0 ${
            dragOver
              ? 'border-2 border-emerald-400 bg-emerald-50'
              : value
                ? 'border border-slate-200 bg-white'
                : 'border-2 border-dashed border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              <span className="text-[8px] text-emerald-600 mt-0.5">Enviando...</span>
            </div>
          ) : value ? (
            <img src={value} alt="" className="w-full h-full object-contain p-1" />
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-4 h-4 text-slate-400" />
              <span className="text-[8px] text-slate-400 mt-0.5">Enviar</span>
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0 space-y-1">
          <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder="URL da imagem ou arraste um arquivo"
            className="w-full text-xs rounded-lg bg-white border border-slate-200 text-slate-700 px-3 py-2 outline-none focus:ring-1 focus:ring-emerald-500/40 placeholder-slate-400"
          />
          <div className="flex items-center gap-1.5">
            <button type="button" onClick={() => inputRef.current?.click()} disabled={isUploading}
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-medium hover:bg-slate-200 transition-colors">
              <Upload className="w-3 h-3" /> Escolher arquivo
            </button>
            {value && (
              <button type="button" onClick={() => onChange('')}
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-500 text-[10px] font-medium hover:bg-red-100 transition-colors">
                <X className="w-3 h-3" /> Remover
              </button>
            )}
          </div>
          {error && <div className="text-[9px] text-red-500">{error}</div>}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      </div>
    </div>
  );
}