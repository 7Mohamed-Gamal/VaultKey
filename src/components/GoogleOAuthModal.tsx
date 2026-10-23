import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Key, 
  ExternalLink, 
  HelpCircle, 
  Check, 
  Copy, 
  ShieldCheck, 
  X, 
  Lock,
  Globe,
  Sparkles,
  Zap,
  Code2
} from 'lucide-react';
import { GoogleSheetConfig } from '../types';

interface GoogleOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectOAuth: (clientId: string) => void;
  onManualConnect: (spreadsheetId: string, accessToken?: string, apiKey?: string, webhookUrl?: string) => void;
  currentClientId: string;
  lang: 'ar' | 'en';
}

export const GoogleOAuthModal: React.FC<GoogleOAuthModalProps> = ({
  isOpen,
  onClose,
  onConnectOAuth,
  onManualConnect,
  currentClientId,
  lang
}) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'webhook' | 'oauth' | 'manual' | 'guide'>('webhook');
  const [clientIdInput, setClientIdInput] = useState(currentClientId || '');
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [webhookUrlInput, setWebhookUrlInput] = useState('');
  const [customTokenInput, setCustomTokenInput] = useState('');
  const [customApiKeyInput, setCustomApiKeyInput] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;

  const APPS_SCRIPT_CODE = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Vault_Secrets') || ss.getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  if (data.action === 'sync_all') {
    sheet.clear();
    if (data.headers) sheet.appendRow(data.headers);
    if (data.secrets && data.secrets.length > 0) {
      data.secrets.forEach(function(s) {
        sheet.appendRow([
          s.id,
          (s.type || '').toUpperCase(),
          s.serviceName,
          s.usernameOrEmail || '',
          s.secretValue,
          s.environment || 'production',
          s.project || 'General',
          (s.tags || []).join(', '),
          s.notes || '',
          s.createdAt || new Date().toISOString(),
          s.updatedAt || new Date().toISOString()
        ]);
      });
    }
  } else {
    var s = data.secret;
    sheet.appendRow([
      s.id,
      (s.type || '').toUpperCase(),
      s.serviceName,
      s.usernameOrEmail || '',
      s.secretValue,
      s.environment || 'production',
      s.project || 'General',
      (s.tags || []).join(', '),
      s.notes || '',
      s.createdAt || new Date().toISOString(),
      s.updatedAt || new Date().toISOString()
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleSubmitWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!webhookUrlInput.trim()) return;
    onManualConnect(
      spreadsheetIdInput.trim(),
      customTokenInput.trim() || undefined,
      customApiKeyInput.trim() || undefined,
      webhookUrlInput.trim()
    );
    onClose();
  };

  const handleSubmitOAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientIdInput.trim()) return;
    onConnectOAuth(clientIdInput.trim());
    onClose();
  };

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    onManualConnect(
      spreadsheetIdInput.trim(),
      customTokenInput.trim() || undefined,
      customApiKeyInput.trim() || undefined,
      webhookUrlInput.trim() || undefined
    );
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
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {isAr ? 'إعداد ربط مزامنة Google Sheets' : 'Google Sheets Sync Setup'}
              </h2>
              <p className="text-xs text-zinc-400">
                {isAr ? 'اختر الطريقة الأنسب لحفظ ومزامنة المفاتيح مع جدولك' : 'Choose the best method to synchronize with your sheet'}
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/[0.06] bg-[#090909] overflow-x-auto">
          <button
            onClick={() => setActiveTab('webhook')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'webhook'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{isAr ? 'Webhook دائم (موصى به جداً)' : 'Permanent Webhook (Recommended)'}</span>
          </button>

          <button
            onClick={() => setActiveTab('oauth')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'oauth'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Google OAuth</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'manual'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isAr ? 'ربط مباشر (Sheet ID & Token)' : 'Direct Sheet ID'}</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل الإعداد' : 'Setup Guide'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Tab 1: Webhook (Permanent, No Expiration) */}
          {activeTab === 'webhook' && (
            <form onSubmit={handleSubmitWebhook} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>{isAr ? 'لماذا هذه الطريقة هي الأفضل والأسهل 100%؟' : 'Why is Webhook the best method?'}</span>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  {isAr 
                    ? 'تعمل مباشرة عبر Google Apps Script بدون الحاجة لإنشاء مشروع في Google Cloud، وبدون صلاحيات تنتهي بعد ساعة (لا تنتهي صلاحيتها أبداً)، وتتيح حفظ كل المفاتيح من الإضافة والتطبيق فورياً في جدولك!'
                    : 'Works via Google Apps Script with zero Google Cloud project setup, zero token expiration, and instant sync 24/7!'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  {isAr ? 'رابط Webhook (Google Apps Script URL):' : 'Google Apps Script Webhook URL:'}
                </label>
                <input
                  type="url"
                  required
                  value={webhookUrlInput}
                  onChange={(e) => setWebhookUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="w-full p-3 rounded-xl bg-[#050505] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  {isAr ? 'رابط جدول Google Sheet (اختياري للفتح المباشر من التطبيق):' : 'Google Sheet URL (Optional):'}
                </label>
                <input
                  type="text"
                  value={spreadsheetIdInput}
                  onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5.../edit"
                  className="w-full p-3 rounded-xl bg-[#050505] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              {/* Instructions on how to deploy script in 1 minute */}
              <div className="p-3.5 rounded-xl bg-[#141414] border border-white/[0.08] space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Code2 className="w-4 h-4" />
                    {isAr ? 'خطوات إضافة الكود في جدولك (دقيقة واحدة):' : 'How to set up Apps Script (1 min):'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyScript}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-500/30 transition"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? (isAr ? 'تم نسخ الكود!' : 'Copied!') : (isAr ? 'نسخ كود Apps Script' : 'Copy Script')}</span>
                  </button>
                </div>

                <ol className="list-decimal list-inside space-y-1.5 text-zinc-300 text-[11px] leading-relaxed">
                  <li>{isAr ? 'افتح جدول Google Sheet الخاص بك واضغط من القائمة العلوية على: الإضافات (Extensions) > Apps Script.' : 'Open your Google Sheet and click: Extensions > Apps Script.'}</li>
                  <li>{isAr ? 'امسح أي كود موجود والصق الكود المنسوخ أعلاه.' : 'Delete existing code and paste the copied snippet above.'}</li>
                  <li>{isAr ? 'اضغط زر نشر (Deploy) > نشر جديد (New deployment) واختر نوع: تطبيق ويب (Web app).' : 'Click Deploy > New deployment > select "Web app".'}</li>
                  <li>
                    {isAr ? (
                      <span>اضبط الخيار <strong>من يمكنه الوصول (Who has access)</strong> على: <strong>أي شخص (Anyone)</strong> ثم اضغط Deploy.</span>
                    ) : (
                      <span>Set <strong>Who has access</strong> to: <strong>Anyone</strong>, then Deploy.</span>
                    )}
                  </li>
                  <li>{isAr ? 'انسخ رابط تطبيق الويب (Web app URL) الناتج وضعه في الحقل أعلاه واضغط حفظ!' : 'Copy the generated Web app URL, paste it above, and click Save!'}</li>
                </ol>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-xs font-semibold hover:bg-[#141414] transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'حفظ وتفعيل المزامنة الدائمة' : 'Save & Enable Webhook Sync'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 2: Google OAuth Client ID */}
          {activeTab === 'oauth' && (
            <form onSubmit={handleSubmitOAuth} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">
                    {isAr ? 'ربط OAuth الرسمي مع حساب Google الخاص بك' : 'Official Google OAuth Connection'}
                  </p>
                  <p className="text-zinc-300">
                    {isAr 
                      ? 'يتطلب إدخال Google OAuth Client ID مسجل عليه عنوانك المحلي http://localhost:3000. يوفر صلاحية لمدة 60 دقيقة في كل مرة تسجل فيها الدخول.'
                      : 'Requires a Google Cloud OAuth Client ID authorized for your origin.'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  {isAr ? 'Google OAuth Client ID (معرف العميل):' : 'Google OAuth Client ID:'}
                </label>
                <input
                  type="text"
                  required
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  placeholder="مثال: 123456789-xxxxxx.apps.googleusercontent.com"
                  className="w-full p-3 rounded-xl bg-[#050505] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#141414] border border-white/[0.06] flex items-center justify-between gap-3 text-xs">
                <div className="truncate">
                  <span className="text-zinc-400 block text-[11px]">{isAr ? 'العنوان المحلي المصرّح له (Authorized JavaScript Origin):' : 'Authorized JavaScript Origin:'}</span>
                  <span className="font-mono text-emerald-400 font-bold">{currentOrigin}</span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyOrigin}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1c1c1c] hover:bg-[#252525] border border-white/[0.08] text-zinc-200 text-[11px] flex items-center gap-1 shrink-0 transition cursor-pointer"
                >
                  {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUrl ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}</span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-xs font-semibold hover:bg-[#141414] transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>{isAr ? 'تسجيل الدخول وربط الحساب' : 'Connect via Google'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 3: Direct Sheet ID & Token */}
          {activeTab === 'manual' && (
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/[0.08] text-xs text-zinc-300 space-y-1">
                <p className="font-semibold text-white">
                  {isAr ? 'الربط المباشر عبر معرف الجدول ورمز الدخول' : 'Direct Link to Spreadsheet & Token'}
                </p>
                <p className="text-zinc-400">
                  {isAr 
                    ? 'ملاحظة هامة: الكتابة في Google Sheets تتطلب توفير Access Token صالح من Google (وليس فقط معرف الجدول).'
                    : 'Important: Writing to Google Sheets requires a valid OAuth Access Token.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  {isAr ? 'معرف جدول البيانات (Spreadsheet ID أو الرابط الكامل):' : 'Spreadsheet ID or URL:'}
                </label>
                <input
                  type="text"
                  required
                  value={spreadsheetIdInput}
                  onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full p-3 rounded-xl bg-[#050505] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  {isAr ? 'Google OAuth Access Token (مطلوب لحفظ البيانات في الجدول):' : 'Google Access Token (Required for writing):'}
                </label>
                <input
                  type="password"
                  value={customTokenInput}
                  onChange={(e) => setCustomTokenInput(e.target.value)}
                  placeholder="ya29.a0AfH6SM..."
                  className="w-full p-3 rounded-xl bg-[#050505] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  {isAr ? 'Google Sheets API Key (اختياري للقراءة فقط):' : 'Google Sheets API Key (Read-only):'}
                </label>
                <input
                  type="password"
                  value={customApiKeyInput}
                  onChange={(e) => setCustomApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full p-3 rounded-xl bg-[#050505] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-zinc-300 text-xs font-semibold hover:bg-[#141414] transition cursor-pointer"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isAr ? 'حفظ وتفعيل الجدول' : 'Save & Link Sheet'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Tab 4: Guide */}
          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-3 rounded-xl bg-[#141414] border border-white/[0.08] space-y-2">
                <h4 className="font-bold text-emerald-400 text-sm">
                  {isAr ? 'مقارنة بين طرق الربط مع Google Sheets:' : 'Google Sheets Connection Comparison:'}
                </h4>
                <div className="space-y-3 pt-2">
                  <div className="p-2.5 rounded-lg bg-[#050505] border border-white/[0.06]">
                    <span className="font-bold text-amber-400 block mb-1">⚡ 1. طريقة Webhook (Apps Script) - الموصى بها:</span>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      {isAr
                        ? 'أسهل طريقة لا تتطلب إعدادات معقدة في Google Cloud. تنسخ كود من 10 أسطر في جدولك، وتحصل على رابط يظل فعالاً للأبد بدون أي انتهاء للصلاحية.'
                        : 'Easiest setup with zero token expiration, 24/7 reliability.'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#050505] border border-white/[0.06]">
                    <span className="font-bold text-emerald-400 block mb-1">🔑 2. طريقة Google OAuth Client ID:</span>
                    <p className="text-zinc-300 leading-relaxed text-[11px]">
                      {isAr
                        ? 'تتيح تسجيل الدخول المباشر بنافذة منبثقة من جوجل. تتطلب إنشاء OAuth Client ID في Google Cloud Console وتصريح الرابط المحلي http://localhost:3000.'
                        : 'Standard Google sign-in popup. Requires Google Cloud Console credentials.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('webhook')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition cursor-pointer"
                >
                  {isAr ? 'الانتقال لربط Webhook' : 'Go to Webhook Setup'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
