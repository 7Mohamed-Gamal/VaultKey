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
  Sparkles
} from 'lucide-react';
import { GoogleSheetConfig } from '../types';

interface GoogleOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnectOAuth: (clientId: string) => void;
  onManualConnect: (spreadsheetId: string, accessToken?: string, apiKey?: string) => void;
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
  const [activeTab, setActiveTab] = useState<'oauth' | 'manual' | 'guide'>('oauth');
  const [clientIdInput, setClientIdInput] = useState(currentClientId || '');
  const [spreadsheetIdInput, setSpreadsheetIdInput] = useState('');
  const [customTokenInput, setCustomTokenInput] = useState('');
  const [customApiKeyInput, setCustomApiKeyInput] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = window.location.origin;

  const handleCopyOrigin = () => {
    navigator.clipboard.writeText(currentOrigin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
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
      customApiKeyInput.trim() || undefined
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
                {isAr ? 'اختر طريقة الربط المحلية أو ربط OAuth عبر Google Cloud' : 'Configure Local Client ID or Direct Sheet ID for synchronization'}
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
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-white/[0.06] bg-[#090909]">
          <button
            onClick={() => setActiveTab('oauth')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'oauth'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>{isAr ? 'Google OAuth Client ID (الموصى به)' : 'Google OAuth Client ID'}</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'manual'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isAr ? 'ربط جدول مباشر (Sheet ID)' : 'Direct Sheet ID'}</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 text-xs font-bold transition border-b-2 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{isAr ? 'دليل استخراج Client ID مجاناً' : 'How to get Client ID'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {activeTab === 'oauth' && (
            <form onSubmit={handleSubmitOAuth} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-white">
                    {isAr ? 'لماذا يظهر خطأ 401 invalid_client على جهازك المحلي؟' : 'Why did Error 401 invalid_client appear?'}
                  </p>
                  <p className="text-zinc-300">
                    {isAr 
                      ? 'جوجل تتطلب أن يكون معرف العميل (OAuth Client ID) مسجلاً ومصرّحاً للعنوان المحلي (http://localhost:3000). يمكنك وضع Client ID الخاص بك أدناه، أو الانتقال لتبويب الدليل لمعرفة كيفية إنشائه في دقيقة.'
                      : 'Google requires your local URL (http://localhost:3000) to be whitelisted in your Google Cloud OAuth Client ID.'}
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
                  <span>{isAr ? 'حفظ وتفعيل المزامنة الفورية' : 'Save & Connect'}</span>
                </button>
              </div>
            </form>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleSubmitManual} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#141414] border border-white/[0.08] text-xs text-zinc-300 space-y-1">
                <p className="font-semibold text-white">
                  {isAr ? 'الربط المباشر بجدول قائم' : 'Direct Link to Spreadsheet'}
                </p>
                <p className="text-zinc-400">
                  {isAr 
                    ? 'يمكنك ربط أي جدول Google Sheet موجود لديك عبر إدخال معرف الجدول (Spreadsheet ID) الموجود في رابط الجدول.'
                    : 'Enter the Spreadsheet ID from your Google Sheet URL.'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  {isAr ? 'معرف جدول البيانات (Spreadsheet ID):' : 'Spreadsheet ID:'}
                </label>
                <input
                  type="text"
                  required
                  value={spreadsheetIdInput}
                  onChange={(e) => setSpreadsheetIdInput(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="w-full p-3 rounded-xl bg-[#050505] border border-white/[0.08] text-white font-mono text-xs focus:outline-none focus:border-emerald-500 transition"
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  {isAr ? 'ملاحظة: يمكنك إيجاده في رابط الجدول: https://docs.google.com/spreadsheets/d/<b>ID</b>/edit' : 'Find it inside the URL: docs.google.com/spreadsheets/d/[ID]/edit'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-200 mb-1.5">
                  {isAr ? 'Google OAuth Access Token (اختياري للقراءة والكتابة):' : 'Google Access Token (Optional):'}
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
                  {isAr ? 'Google Sheets API Key (اختياري لجلب ومزامنة البيانات):' : 'Google Sheets API Key (Optional):'}
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

          {activeTab === 'guide' && (
            <div className="space-y-4 text-xs text-zinc-300">
              <div className="p-3 rounded-xl bg-[#141414] border border-white/[0.08] space-y-2">
                <h4 className="font-bold text-emerald-400 text-sm">
                  {isAr ? 'خطوات إنشاء Google OAuth Client ID في 3 خطوات:' : 'How to create Google OAuth Client ID:'}
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-zinc-300 leading-relaxed">
                  <li>
                    {isAr ? 'افتح ' : 'Go to '}
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 underline inline-flex items-center gap-0.5 font-mono"
                    >
                      Google Cloud Console Credentials <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    {isAr 
                      ? 'اضغط على "+ Create Credentials" ثم اختر "OAuth client ID".' 
                      : 'Click "+ Create Credentials" and select "OAuth client ID".'}
                  </li>
                  <li>
                    {isAr 
                      ? 'اختر نوع التطبيق: "Web application".' 
                      : 'Choose Application type: "Web application".'}
                  </li>
                  <li>
                    {isAr ? 'في خانة ' : 'Under '}
                    <strong className="text-white">Authorized JavaScript origins</strong>
                    {isAr ? ' أضف الرابط المحلي لجهازك:' : ' add your local origin:'}
                    <div className="mt-1 p-2 rounded bg-[#050505] font-mono text-emerald-400 flex items-center justify-between">
                      <span>{currentOrigin}</span>
                      <button
                        onClick={handleCopyOrigin}
                        className="text-zinc-400 hover:text-white text-[11px] underline"
                      >
                        {copiedUrl ? (isAr ? 'تم النسخ' : 'Copied') : (isAr ? 'نسخ' : 'Copy')}
                      </button>
                    </div>
                  </li>
                  <li>
                    {isAr 
                      ? 'اضغط Create، ثم انسخ الـ Client ID وضعه في التطبيق بالتبويب الأول!'
                      : 'Click Create, then copy the Client ID and paste it in the first tab!'}
                  </li>
                </ol>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveTab('oauth')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-black font-bold text-xs hover:bg-emerald-400 transition cursor-pointer"
                >
                  {isAr ? 'العودة لإدخال Client ID' : 'Back to enter Client ID'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
