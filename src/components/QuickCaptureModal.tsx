import React, { useState, useEffect, useRef } from 'react';
import { 
  Key, 
  Lock, 
  FileCode, 
  Ticket, 
  Database, 
  FileText, 
  Sparkles, 
  RefreshCw, 
  Copy, 
  Check, 
  X, 
  FileSpreadsheet, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Tag, 
  Layers,
  ArrowRight
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SecretItem, SecretType, EnvironmentType, GoogleSheetConfig } from '../types';
import { SERVICE_PRESETS } from '../data/presets';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (secret: Omit<SecretItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onUpdate?: (id: string, secret: Partial<SecretItem>) => Promise<void>;
  initialData?: Partial<SecretItem> | null;
  isEditMode?: boolean;
  googleConfig: GoogleSheetConfig;
  lang: 'ar' | 'en';
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  initialData,
  isEditMode = false,
  googleConfig,
  lang
}) => {
  const isAr = lang === 'ar';
  const serviceInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<SecretType>(initialData?.type || 'api_key');
  const [serviceName, setServiceName] = useState(initialData?.serviceName || '');
  const [secretValue, setSecretValue] = useState(initialData?.secretValue || '');
  const [usernameOrEmail, setUsernameOrEmail] = useState(initialData?.usernameOrEmail || '');
  const [environment, setEnvironment] = useState<EnvironmentType>(initialData?.environment || 'production');
  const [tagsInput, setTagsInput] = useState((initialData?.tags || []).join(', '));
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [project, setProject] = useState(initialData?.project || '');
  const [showSecret, setShowSecret] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [genLength, setGenLength] = useState(24);

  // Sync state whenever initialData or isOpen changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || 'api_key');
        setServiceName(initialData.serviceName || '');
        setSecretValue(initialData.secretValue || '');
        setUsernameOrEmail(initialData.usernameOrEmail || '');
        setEnvironment(initialData.environment || 'production');
        setTagsInput((initialData.tags || []).join(', '));
        setNotes(initialData.notes || '');
        setProject(initialData.project || '');
      } else {
        setType('api_key');
        setServiceName('');
        setSecretValue('');
        setUsernameOrEmail('');
        setEnvironment('production');
        setTagsInput('');
        setNotes('');
        setProject('');
      }
      setTimeout(() => {
        serviceInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, initialData]);

  // Handle ESC and Ctrl+Enter keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, serviceName, secretValue, type, usernameOrEmail, environment, tagsInput, notes, project]);

  if (!isOpen) return null;

  const generateSecret = (len = genLength) => {
    let chars = '';
    if (type === 'api_key') {
      chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_';
    } else {
      chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~';
    }
    let res = '';
    const cryptoObj = window.crypto || (window as any).msCrypto;
    if (cryptoObj && cryptoObj.getRandomValues) {
      const values = new Uint32Array(len);
      cryptoObj.getRandomValues(values);
      for (let i = 0; i < len; i++) {
        res += chars[values[i] % chars.length];
      }
    } else {
      for (let i = 0; i < len; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    if (type === 'api_key' && serviceName.toLowerCase().includes('openai')) {
      res = `sk-proj-${res}`;
    } else if (type === 'api_key' && serviceName.toLowerCase().includes('stripe')) {
      res = `sk_live_${res}`;
    }

    setSecretValue(res);
  };

  const selectPreset = (preset: typeof SERVICE_PRESETS[0]) => {
    setServiceName(preset.name);
    setType(preset.type);
    if (!tagsInput) {
      setTagsInput(preset.category);
    }
  };

  const copyToClipboard = async () => {
    if (!secretValue) return;
    await navigator.clipboard.writeText(secretValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!serviceName.trim() || !secretValue.trim()) return;

    setIsSaving(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      if (isEditMode && initialData?.id && onUpdate) {
        await onUpdate(initialData.id, {
          type,
          serviceName: serviceName.trim(),
          secretValue: secretValue.trim(),
          usernameOrEmail: usernameOrEmail.trim() || undefined,
          environment,
          tags,
          notes: notes.trim() || undefined,
          project: project.trim() || undefined,
        });
      } else {
        await onSave({
          type,
          serviceName: serviceName.trim(),
          secretValue: secretValue.trim(),
          usernameOrEmail: usernameOrEmail.trim() || undefined,
          environment,
          tags,
          notes: notes.trim() || undefined,
          project: project.trim() || undefined,
          isFavorite: false
        });

        // Confetti celebration for new additions
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch {}
      }

      // Reset form
      setServiceName('');
      setSecretValue('');
      setUsernameOrEmail('');
      setTagsInput('');
      setNotes('');
      setProject('');
      onClose();
    } catch (err) {
      console.error('Error saving secret:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const typeOptions: { id: SecretType; label: string; icon: any; color: string }[] = [
    { id: 'api_key', label: isAr ? 'مفتاح API Key' : 'API Key', icon: Key, color: 'text-indigo-400' },
    { id: 'password', label: isAr ? 'كلمة مرور Password' : 'Password', icon: Lock, color: 'text-amber-400' },
    { id: 'env_var', label: isAr ? 'متغير بيئة .env' : 'Env Variable', icon: FileCode, color: 'text-emerald-400' },
    { id: 'token', label: isAr ? 'رمز Token / سر' : 'Token / Secret', icon: Ticket, color: 'text-cyan-400' },
    { id: 'database_url', label: isAr ? 'قاعدة بيانات DB URI' : 'Database URI', icon: Database, color: 'text-purple-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-xl bg-[#0c0c0c] border border-white/[0.08] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0c0c0c]/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {isEditMode 
                  ? (isAr ? 'تعديل السجل المخزن' : 'Edit Secret')
                  : (isAr ? 'حفظ سريع لمفتاح أو كلمة مرور' : 'Quick Capture Secret')}
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#141414] border border-white/[0.08] text-zinc-400 font-mono">
                  {isEditMode ? (isAr ? 'تعديل' : 'Edit') : 'Ctrl+Shift+K'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {isAr ? 'سيتم الحفظ والمزامنة مباشرة مع Google Sheets' : 'Saves & syncs directly to your Google Sheet'}
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Secret Type Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              {isAr ? 'نوع البيانات المطلوب حفظها' : 'Select Secret Type'}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {typeOptions.map((opt) => {
                const IconComponent = opt.icon;
                const active = type === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setType(opt.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium border transition text-start cursor-pointer ${
                      active
                        ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-sm shadow-emerald-500/10'
                        : 'bg-[#141414] border-white/[0.08] text-zinc-400 hover:bg-[#1c1c1c] hover:text-zinc-200'
                    }`}
                  >
                    <IconComponent className={`w-4 h-4 ${opt.color}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Presets Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] text-zinc-400">
                {isAr ? 'خدمات شائعة بنقرة واحدة:' : 'Popular Service Presets:'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto py-1">
              {SERVICE_PRESETS.slice(0, 8).map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => selectPreset(preset)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#141414] hover:bg-[#1c1c1c] border border-white/[0.08] text-zinc-300 transition flex items-center gap-1 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Service / Website Name */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              {isAr ? 'اسم الخدمة / الموقع / التطبيق' : 'Service / Website / App Name'} <span className="text-rose-400">*</span>
            </label>
            <input
              ref={serviceInputRef}
              type="text"
              required
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder={isAr ? 'مثال: OpenAI, Stripe, AWS Console, Supabase' : 'e.g. OpenAI, Stripe, AWS Console, Supabase'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#050505] border border-white/[0.08] text-white placeholder:text-zinc-500 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>

          {/* Secret / Key / Password Value Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-300">
                {type === 'password'
                  ? (isAr ? 'كلمة المرور' : 'Password Value')
                  : (isAr ? 'مفتاح API أو القيمة السرية' : 'API Key / Secret Value')}{' '}
                <span className="text-rose-400">*</span>
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => generateSecret()}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  {isAr ? 'توليد تلقائي' : 'Generate'}
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showSecret ? 'text' : 'password'}
                required
                value={secretValue}
                onChange={(e) => setSecretValue(e.target.value)}
                placeholder={
                  type === 'api_key'
                    ? 'sk-proj-... أو sk_live_...'
                    : type === 'password'
                    ? '••••••••••••••••'
                    : 'القيمة السرية'
                }
                className="w-full px-3.5 py-2.5 pe-24 rounded-xl bg-[#050505] border border-white/[0.08] text-white placeholder:text-zinc-500 text-sm font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />

              <div className="absolute inset-y-0 end-2 flex items-center gap-1">
                {secretValue && (
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-[#141414] transition cursor-pointer"
                    title={isAr ? 'نسخ' : 'Copy'}
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-[#141414] transition cursor-pointer"
                  title={showSecret ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Username / Email & Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {isAr ? 'البريد أو الحساب المرتبط (اختياري)' : 'Associated Email / Account'}
              </label>
              <input
                type="text"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder="dev@example.com"
                className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.08] text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {isAr ? 'بيئة العمل (Environment)' : 'Environment'}
              </label>
              <select
                value={environment}
                onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}
                className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.08] text-zinc-300 text-xs focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="production">Production (الإنتاج)</option>
                <option value="staging">Staging (المعاينة)</option>
                <option value="development">Development (التطوير المحلي)</option>
                <option value="testing">Testing (الاختبار)</option>
                <option value="personal">Personal (شخصي)</option>
              </select>
            </div>
          </div>

          {/* Project & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {isAr ? 'اسم المشروع (Project)' : 'Project Name'}
              </label>
              <input
                type="text"
                value={project}
                onChange={(e) => setProject(e.target.value)}
                placeholder={isAr ? 'مثال: تطبيق المتجر v2' : 'e.g. Ecommerce App'}
                className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.08] text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                {isAr ? 'وسوم (مفصولة بفواصل)' : 'Tags (comma-separated)'}
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="AI, GPT-4, Backend"
                className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.08] text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              {isAr ? 'ملاحظات وتفاصيل إضافية' : 'Notes & Details'}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={isAr ? 'ملاحظات حول تاريخ انتهاء الصلاحية أو طريقة الاستخدام...' : 'Expiry dates, scope, or usage guidelines...'}
              className="w-full px-3 py-2 rounded-xl bg-[#050505] border border-white/[0.08] text-white placeholder:text-zinc-500 text-xs focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          {/* Google Sheets Sync Badge indicator */}
          <div className="p-3 rounded-xl bg-[#050505]/60 border border-white/[0.08] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-zinc-400">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>
                {googleConfig.isConnected
                  ? (isAr ? 'ستتم المزامنة التلقائية مع Google Sheet الخاص بك' : 'Auto-syncing to your Google Sheet')
                  : (isAr ? 'حفظ محلي فوري (ويمكن مزامنته مع Google Sheet لاحقاً)' : 'Saved locally (connect Sheet to sync)')}
              </span>
            </div>
            {googleConfig.isConnected && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium border border-emerald-500/20">
                {isAr ? 'متصل' : 'Active'}
              </span>
            )}
          </div>

          {/* Submit Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-xs font-semibold hover:bg-[#141414] transition cursor-pointer"
            >
              {isAr ? 'إلغاء (Esc)' : 'Cancel (Esc)'}
            </button>

            <button
              type="submit"
              disabled={isSaving || !serviceName || !secretValue}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>{isAr ? 'جاري الحفظ والمزامنة...' : 'Saving & Syncing...'}</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                  <span>
                    {isEditMode
                      ? (isAr ? 'حفظ التعديلات' : 'Save Changes')
                      : (isAr ? 'حفظ ومزامنة إلى Google Sheets' : 'Save & Sync to Sheet')}
                  </span>
                  <span className="text-[10px] opacity-70 font-mono bg-black/10 px-1 rounded">↵ Enter</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
