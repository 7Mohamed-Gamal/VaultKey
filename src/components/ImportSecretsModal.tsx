import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  FileCode, 
  Check, 
  AlertCircle, 
  X, 
  Sparkles, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { SecretItem } from '../types';
import { parseDotEnv, parseCSV } from '../services/storage';

interface ImportSecretsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (secrets: Partial<SecretItem>[]) => void;
  lang: 'ar' | 'en';
}

export const ImportSecretsModal: React.FC<ImportSecretsModalProps> = ({
  isOpen,
  onClose,
  onImport,
  lang
}) => {
  const isAr = lang === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'paste' | 'file'>('paste');
  const [format, setFormat] = useState<'env' | 'csv'>('env');
  const [textContent, setTextContent] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<SecretItem>[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleParse = (text: string, fmt: 'env' | 'csv') => {
    let results: Partial<SecretItem>[] = [];
    if (fmt === 'env') {
      results = parseDotEnv(text);
    } else {
      results = parseCSV(text);
    }
    setParsedPreview(results);
  };

  const handleTextChange = (val: string) => {
    setTextContent(val);
    handleParse(val, format);
  };

  const handleFormatChange = (fmt: 'env' | 'csv') => {
    setFormat(fmt);
    handleParse(textContent, fmt);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const isCsv = file.name.endsWith('.csv');
    const autoFmt = isCsv ? 'csv' : 'env';
    setFormat(autoFmt);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setTextContent(content);
      handleParse(content, autoFmt);
    };
    reader.readAsText(file);
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImport(parsedPreview);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-[#0c0c0c] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0c0c0c]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {isAr ? 'استيراد مفاتيح وبيانات (.env أو CSV)' : 'Import Secrets (.env or CSV)'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isAr ? 'قم بتحميل ملف أو لصق محتوى لإضافته فوراً إلى الخزنة' : 'Upload or paste secrets to import into your Vault'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-[#141414] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Format selector */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleFormatChange('env')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  format === 'env'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-[#141414] border border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>ملف .env (KEY=VALUE)</span>
              </button>

              <button
                type="button"
                onClick={() => handleFormatChange('csv')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                  format === 'csv'
                    ? 'bg-emerald-500 text-black font-bold'
                    : 'bg-[#141414] border border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>ملف جدول CSV</span>
              </button>
            </div>

            {/* File upload hidden input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".env,.txt,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141414] hover:bg-[#1c1c1c] border border-white/[0.08] text-zinc-200 text-xs font-semibold transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isAr ? 'اختيار ملف من جهازك' : 'Browse File'}</span>
            </button>
          </div>

          {fileName && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 flex items-center justify-between">
              <span>{isAr ? 'الملف المحدد:' : 'Loaded file:'} <strong>{fileName}</strong></span>
              <button onClick={() => { setFileName(null); setTextContent(''); setParsedPreview([]); }} className="text-zinc-400 hover:text-white">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Paste textarea */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
              {isAr ? 'أو الصق النص هنا مباشرة:' : 'Or paste content directly:'}
            </label>
            <textarea
              rows={5}
              value={textContent}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={
                format === 'env'
                  ? `OPENAI_API_KEY="sk-proj-..."\nSTRIPE_SECRET_KEY="sk_live_..."\nDATABASE_URL="postgres://..."`
                  : `ID,Type,Service Name,Category,Username/Email,Secret,Env\n1,api_key,OpenAI,AI,me@test.com,sk-123,production`
              }
              className="w-full p-3 rounded-xl bg-[#050505] border border-white/[0.08] text-emerald-400 font-mono text-xs focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Parsed Preview Table */}
          {parsedPreview.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
                <span>{isAr ? `معاينة السجلات المكتشفة (${parsedPreview.length})` : `Discovered items (${parsedPreview.length}):`}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> {isAr ? 'جاهز للاستيراد' : 'Ready to import'}
                </span>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-xl border border-white/[0.08] bg-[#050505] divide-y divide-white/[0.06]">
                {parsedPreview.map((item, idx) => (
                  <div key={idx} className="p-2.5 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {item.type}
                      </span>
                      <strong className="text-zinc-200 truncate">{item.serviceName}</strong>
                    </div>
                    <span className="font-mono text-zinc-500 text-[11px] truncate max-w-[200px]">
                      {item.secretValue?.slice(0, 10)}•••••
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/[0.08] bg-[#0c0c0c] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-xs font-semibold hover:bg-[#141414] transition cursor-pointer"
          >
            {isAr ? 'إلغاء' : 'Cancel'}
          </button>

          <button
            type="button"
            disabled={parsedPreview.length === 0}
            onClick={handleConfirmImport}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-black stroke-[2.5]" />
            <span>
              {isAr
                ? `استيراد ${parsedPreview.length} سجل إلى الخزنة`
                : `Import ${parsedPreview.length} Secrets`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
