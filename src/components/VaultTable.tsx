import React, { useState } from 'react';
import { 
  Key, 
  Lock, 
  FileCode, 
  Ticket, 
  Database, 
  Search, 
  Filter, 
  Copy, 
  Check, 
  Eye, 
  EyeOff, 
  Star, 
  Trash2, 
  ExternalLink, 
  Download, 
  Upload,
  FileSpreadsheet, 
  Plus, 
  Terminal, 
  Calendar, 
  ShieldAlert,
  Tag,
  Layers,
  Sparkles,
  Edit2
} from 'lucide-react';
import { SecretItem, SecretType, EnvironmentType } from '../types';
import { exportToCSV, exportToDotEnv, exportToJSON } from '../services/storage';

interface VaultTableProps {
  secrets: SecretItem[];
  onDeleteSecret: (id: string) => void;
  onEditSecret: (secret: SecretItem) => void;
  onToggleFavorite: (id: string) => void;
  onOpenQuickCapture: () => void;
  onOpenImport: () => void;
  spreadsheetUrl?: string | null;
  lang: 'ar' | 'en';
}

export const VaultTable: React.FC<VaultTableProps> = ({
  secrets,
  onDeleteSecret,
  onEditSecret,
  onToggleFavorite,
  onOpenQuickCapture,
  onOpenImport,
  spreadsheetUrl,
  lang
}) => {
  const isAr = lang === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<SecretType | 'all' | 'favorites'>('all');
  const [selectedEnv, setSelectedEnv] = useState<EnvironmentType | 'all'>('all');
  const [revealedIds, setRevealedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedEnvId, setCopiedEnvId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedIds(prev => {
      const next = { ...prev, [id]: !prev[id] };
      // Auto-hide after 15 seconds for security
      if (next[id]) {
        setTimeout(() => {
          setRevealedIds(p => ({ ...p, [id]: false }));
        }, 15000);
      }
      return next;
    });
  };

  const handleCopy = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyEnvFormat = async (secret: SecretItem) => {
    let keyName = secret.serviceName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '_')
      .replace(/_+/g, '_');
    
    if (secret.type === 'api_key' && !keyName.includes('KEY') && !keyName.includes('API')) {
      keyName += '_API_KEY';
    }
    const envLine = `${keyName}="${secret.secretValue}"`;
    await navigator.clipboard.writeText(envLine);
    setCopiedEnvId(secret.id);
    setTimeout(() => setCopiedEnvId(null), 2000);
  };

  const handleDownloadFile = (type: 'env' | 'csv' | 'json') => {
    let content = '';
    let filename = '';
    let mimeType = '';

    if (type === 'env') {
      content = exportToDotEnv(filteredSecrets);
      filename = '.env';
      mimeType = 'text/plain';
    } else if (type === 'csv') {
      content = exportToCSV(filteredSecrets);
      filename = `keyvault-export-${new Date().toISOString().slice(0, 10)}.csv`;
      mimeType = 'text/csv';
    } else {
      content = exportToJSON(filteredSecrets);
      filename = `keyvault-export-${new Date().toISOString().slice(0, 10)}.json`;
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter secrets
  const filteredSecrets = secrets.filter(item => {
    if (selectedType === 'favorites' && !item.isFavorite) return false;
    if (selectedType !== 'all' && selectedType !== 'favorites' && item.type !== selectedType) return false;
    if (selectedEnv !== 'all' && item.environment !== selectedEnv) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = item.serviceName.toLowerCase().includes(q);
      const matchEmail = (item.usernameOrEmail || '').toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      const matchProject = (item.project || '').toLowerCase().includes(q);
      const matchTags = (item.tags || []).some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchEmail && !matchNotes && !matchProject && !matchTags) return false;
    }

    return true;
  });

  const getTypeBadge = (type: SecretType) => {
    switch (type) {
      case 'api_key':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Key className="w-3 h-3" /> API Key
          </span>
        );
      case 'password':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Lock className="w-3 h-3" /> Password
          </span>
        );
      case 'env_var':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20">
            <FileCode className="w-3 h-3" /> .env
          </span>
        );
      case 'token':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Ticket className="w-3 h-3" /> Token
          </span>
        );
      case 'database_url':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Database className="w-3 h-3" /> Database
          </span>
        );
      default:
        return null;
    }
  };

  const getEnvBadge = (env: EnvironmentType) => {
    switch (env) {
      case 'production':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">Prod</span>;
      case 'staging':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">Staging</span>;
      case 'development':
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-sky-500/10 text-sky-300 border border-sky-500/20">Dev</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#141414] text-zinc-400 border border-white/[0.08]">{env}</span>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters, Exports */}
      <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isAr ? 'بحث بالخدمة، الوسوم، الملاحظات أو البريد...' : 'Search by service, tags, project or email...'}
            className="w-full ps-10 pe-4 py-2 rounded-xl bg-[#050505] border border-white/[0.08] text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Environment Filter & Type Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedEnv}
            onChange={(e) => setSelectedEnv(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.08] text-zinc-300 text-xs focus:outline-none focus:border-emerald-500 transition"
          >
            <option value="all">{isAr ? 'جميع البيئات (Environments)' : 'All Environments'}</option>
            <option value="production">Production</option>
            <option value="staging">Staging</option>
            <option value="development">Development</option>
            <option value="testing">Testing</option>
          </select>

          {/* Export Dropdown & Import Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onOpenImport}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition cursor-pointer"
              title={isAr ? 'استيراد من .env أو CSV' : 'Import from .env or CSV'}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isAr ? 'استيراد' : 'Import'}</span>
            </button>

            <button
              onClick={() => handleDownloadFile('env')}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-white/[0.08] bg-[#141414] hover:bg-[#1c1c1c] text-zinc-300 text-xs font-medium transition cursor-pointer"
              title={isAr ? 'تصدير كملف .env' : 'Export as .env'}
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>.env</span>
            </button>

            <button
              onClick={() => handleDownloadFile('csv')}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-white/[0.08] bg-[#141414] hover:bg-[#1c1c1c] text-zinc-300 text-xs font-medium transition cursor-pointer"
              title={isAr ? 'تصدير CSV' : 'Export CSV'}
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => handleDownloadFile('json')}
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-white/[0.08] bg-[#141414] hover:bg-[#1c1c1c] text-zinc-300 text-xs font-medium transition cursor-pointer"
              title={isAr ? 'تصدير JSON' : 'Export JSON'}
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>JSON</span>
            </button>

            {spreadsheetUrl && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isAr ? 'فتح في Google Sheets' : 'Open in Sheets'}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Type Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: isAr ? `الكل (${secrets.length})` : `All (${secrets.length})`, icon: Layers },
          { id: 'favorites', label: isAr ? 'المفضلة' : 'Favorites', icon: Star },
          { id: 'api_key', label: isAr ? 'مفاتيح API' : 'API Keys', icon: Key },
          { id: 'password', label: isAr ? 'كلمات المرور' : 'Passwords', icon: Lock },
          { id: 'env_var', label: isAr ? 'متغيرات .env' : '.env Vars', icon: FileCode },
          { id: 'token', label: isAr ? 'رموز Tokens' : 'Tokens', icon: Ticket },
          { id: 'database_url', label: isAr ? 'قواعد البيانات' : 'Databases', icon: Database },
        ].map((tab) => {
          const IconComp = tab.icon;
          const active = selectedType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedType(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                active
                  ? 'bg-emerald-500 text-black font-bold shadow-sm shadow-emerald-500/20'
                  : 'bg-[#0c0c0c] border border-white/[0.08] text-zinc-400 hover:text-zinc-200 hover:bg-[#141414]'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Secrets List / Cards Grid */}
      {filteredSecrets.length === 0 ? (
        <div className="bg-[#0c0c0c] border border-dashed border-white/[0.12] rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <Key className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">
            {isAr ? 'لا توجد مفاتيح أو بيانات مطابقة' : 'No matching secrets found'}
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto mb-4">
            {isAr
              ? 'اضغط على زر الحفظ السريع أو اختصار Ctrl+Shift+K لحفظ أول مفتاح أو كلمة مرور في حساب Google Sheets الخاص بك.'
              : 'Press Ctrl+Shift+K or click Quick Capture to save your first API key or password.'}
          </p>
          <button
            onClick={onOpenQuickCapture}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black stroke-[2.5]" />
            <span>{isAr ? 'إضافة مفتاح جديد الآن' : 'Add New Secret Now'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredSecrets.map((secret) => {
            const isRevealed = revealedIds[secret.id];
            const isCopied = copiedId === secret.id;
            const isEnvCopied = copiedEnvId === secret.id;

            return (
              <div
                key={secret.id}
                className="bg-[#0c0c0c] border border-white/[0.08] hover:border-white/[0.18] rounded-2xl p-4 transition-all shadow-sm group flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Service name, Type, Environment, Favorite */}
                  <div className="flex items-start justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-[#141414] border border-white/[0.08] flex items-center justify-center font-bold text-white text-sm">
                        {secret.serviceName.slice(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition flex items-center gap-1.5">
                          {secret.serviceName}
                          {secret.project && (
                            <span className="text-[10px] text-zinc-400 font-normal">
                              • {secret.project}
                            </span>
                          )}
                        </h4>
                        {secret.usernameOrEmail && (
                          <p className="text-[11px] text-zinc-400">{secret.usernameOrEmail}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {getTypeBadge(secret.type)}
                      {getEnvBadge(secret.environment)}
                      <button
                        onClick={() => onToggleFavorite(secret.id)}
                        className={`p-1 rounded-lg transition cursor-pointer ${
                          secret.isFavorite ? 'text-amber-400' : 'text-zinc-600 hover:text-zinc-400'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>

                  {/* Secret Value Display Box */}
                  <div className="p-2.5 rounded-xl bg-[#050505] border border-white/[0.08] flex items-center justify-between gap-2 mb-2">
                    <div className="flex-1 font-mono text-xs text-emerald-400 overflow-x-auto select-all">
                      {isRevealed ? (
                        <span>{secret.secretValue}</span>
                      ) : (
                        <span className="tracking-widest text-zinc-600">
                          ••••••••••••••••••••••••
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => toggleReveal(secret.id)}
                        className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-[#141414] transition cursor-pointer"
                        title={isRevealed ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Reveal')}
                      >
                        {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={() => handleCopy(secret.id, secret.secretValue)}
                        className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-[#141414] transition cursor-pointer"
                        title={isAr ? 'نسخ القيمة' : 'Copy value'}
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {secret.notes && (
                    <p className="text-[11px] text-zinc-400 bg-[#050505]/60 p-2 rounded-lg border border-white/[0.05] mb-2">
                      {secret.notes}
                    </p>
                  )}

                  {/* Tags */}
                  {secret.tags && secret.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {secret.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-[#141414] text-zinc-400 border border-white/[0.06]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer: Date & Quick Actions */}
                <div className="pt-2 mt-1 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(secret.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Copy as .env variable */}
                    <button
                      onClick={() => handleCopyEnvFormat(secret)}
                      className="text-[10px] px-2 py-1 rounded bg-[#141414] hover:bg-[#1c1c1c] text-zinc-300 flex items-center gap-1 transition cursor-pointer border border-white/[0.06]"
                      title={isAr ? 'نسخ بتنسيق متغير .env' : 'Copy as .env line'}
                    >
                      <Terminal className="w-3 h-3 text-emerald-400" />
                      <span>{isEnvCopied ? (isAr ? 'تم النسخ!' : 'Copied!') : '.env'}</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => onEditSecret(secret)}
                      className="p-1 text-zinc-400 hover:text-emerald-400 rounded transition cursor-pointer"
                      title={isAr ? 'تعديل السجل' : 'Edit secret'}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (confirm(isAr ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Delete this secret?')) {
                          onDeleteSecret(secret.id);
                        }
                      }}
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded transition cursor-pointer"
                      title={isAr ? 'حذف' : 'Delete'}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
