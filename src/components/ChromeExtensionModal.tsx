import React, { useState } from 'react';
import { 
  Chrome, 
  Download, 
  Check, 
  Command, 
  Key, 
  Layers, 
  Lock, 
  Sparkles, 
  FileSpreadsheet, 
  Monitor, 
  ExternalLink, 
  X, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { generateChromeExtensionZip } from '../services/extensionGenerator';
import { GoogleSheetConfig } from '../types';

interface ChromeExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  googleConfig: GoogleSheetConfig;
  lang: 'ar' | 'en';
}

export const ChromeExtensionModal: React.FC<ChromeExtensionModalProps> = ({
  isOpen,
  onClose,
  googleConfig,
  lang
}) => {
  const isAr = lang === 'ar';
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Simulated extension popup state for live preview
  const [simType, setSimType] = useState<'api_key' | 'password' | 'token'>('api_key');
  const [simService, setSimService] = useState('https://platform.openai.com/api-keys');
  const [simEmail, setSimEmail] = useState('developer@company.com');
  const [simSecret, setSimSecret] = useState('sk-proj-78AbCdEfGhIjKlMnOpQrStUv');
  const [simSaved, setSimSaved] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await generateChromeExtensionZip({
        appUrl: window.location.origin,
        spreadsheetId: googleConfig.spreadsheetId,
        spreadsheetUrl: googleConfig.spreadsheetUrl,
        webhookUrl: googleConfig.webhookUrl,
        accessToken: googleConfig.accessToken,
        clientId: googleConfig.clientId
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'keyvault-chrome-extension-v1.zip';
      a.click();
      URL.revokeObjectURL(url);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to generate extension zip:', err);
      alert(isAr ? 'حدث خطأ أثناء إنشاء حزمة الإضافة' : 'Failed to generate extension package');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#050505]/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-[#0c0c0c] border border-white/[0.08] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#0c0c0c]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Chrome className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {isAr ? 'إضافة جوجل كروم الرسمية (Chrome Extension)' : 'Chrome Extension & Desktop Shortcut'}
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                  Manifest V3
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                {isAr ? 'احفظ أي مفتاح أو كلمة مرور بضغطة زر Ctrl+Shift+K مباشرة إلى Google Sheets' : 'Capture any API key or password with Ctrl+Shift+K anywhere'}
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
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Download Hero Box */}
          <div className="bg-[#050505] border border-white/[0.08] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-2 text-center sm:text-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAr ? 'حزمة جاهزة للتثبيت فوراً' : 'Ready to Install in 1 Minute'}</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                {isAr ? 'تحميل إضافة KeyVault Quick-Save' : 'Download KeyVault Chrome Extension'}
              </h3>
              <p className="text-xs text-zinc-400 max-w-md">
                {isAr
                  ? 'ملف مضغوط (.ZIP) يحتوي على ملفات الإضافة كاملة مع اختصار لوحة المفاتيح Ctrl+Shift+K ومزامنة Google Sheets.'
                  : 'Full package with manifest v3, shortcuts, popup interface, and Google Sheets synchronization.'}
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/20 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              {isDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  <span>{isAr ? 'جاري تجهيز الحزمة...' : 'Packaging Extension...'}</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <Check className="w-4 h-4 text-black stroke-[3]" />
                  <span>{isAr ? 'تم التحميل بنجاح!' : 'Downloaded!'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-black stroke-[2.5]" />
                  <span>{isAr ? 'تحميل الإضافة (.ZIP)' : 'Download Extension (.ZIP)'}</span>
                </>
              )}
            </button>
          </div>

          {/* Side by side: Step by Step Guide & Live Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Steps Guide */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {isAr ? 'طريقة تثبيت الإضافة في متصفحك:' : 'How to install in Chrome/Brave/Edge:'}
              </h4>

              <div className="space-y-2.5">
                {[
                  {
                    step: '1',
                    title: isAr ? 'قم بفك ضغط ملف ZIP' : 'Unzip the downloaded file',
                    desc: isAr ? 'استخرج الملفات في أي مجلد تريده على حاسوبك.' : 'Extract the contents to any folder on your computer.'
                  },
                  {
                    step: '2',
                    title: isAr ? 'افتح صفحة الإضافات' : 'Open Extensions page',
                    desc: isAr ? 'اكتب chrome://extensions/ في شريط عنوان المتصفح.' : 'Navigate to chrome://extensions/ in your browser.'
                  },
                  {
                    step: '3',
                    title: isAr ? 'فعّل وضع المطور (Developer Mode)' : 'Enable Developer Mode',
                    desc: isAr ? 'من الزاوية العلوية اليمنى لصفحة الإضافات.' : 'Toggle the switch in the top right corner.'
                  },
                  {
                    step: '4',
                    title: isAr ? 'اختر Load Unpacked' : 'Click "Load unpacked"',
                    desc: isAr ? 'اضغط على زر (تحميل إضافة تم فك حزمتها) واختر المجلد.' : 'Select the extracted extension folder.'
                  }
                ].map((item) => (
                  <div key={item.step} className="p-3 rounded-xl bg-[#050505] border border-white/[0.08] flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center justify-center shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <h5 className="text-xs font-bold text-zinc-200">{item.title}</h5>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hotkey Info */}
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-xs text-emerald-300">
                <Command className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>
                  {isAr
                    ? 'بعد التثبيت، اضغط Ctrl+Shift+K في أي وقت لتفتح لك نافذة الحفظ السريع فوراً!'
                    : 'Once installed, press Ctrl+Shift+K anytime to trigger instant capture!'}
                </span>
              </div>
            </div>

            {/* Live Extension Popup Simulator */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                {isAr ? 'معاينة حية لشاشة الإضافة المنبثقة:' : 'Live Extension Popup Preview:'}
              </h4>

              <div className="p-4 rounded-2xl bg-[#050505] border border-white/[0.08] shadow-xl max-w-sm mx-auto">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">KeyVault Quick Save</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#141414] border border-white/[0.08] text-zinc-400 font-mono">
                    Ctrl+Shift+K
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {[
                    { id: 'api_key', label: 'API Key' },
                    { id: 'password', label: isAr ? 'كلمة سر' : 'Password' },
                    { id: 'token', label: 'Token' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setSimType(t.id as any)}
                      className={`text-[11px] py-1 px-2 rounded-lg font-medium transition cursor-pointer ${
                        simType === t.id
                          ? 'bg-emerald-500 text-black font-bold'
                          : 'bg-[#141414] border border-white/[0.08] text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      {isAr ? 'اسم الخدمة / الموقع' : 'Service / Website'}
                    </label>
                    <input
                      type="text"
                      value={simService}
                      onChange={(e) => setSimService(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0c0c] border border-white/[0.08] text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      {isAr ? 'المفتاح / القيمة السرية' : 'Secret / API Key'}
                    </label>
                    <input
                      type="text"
                      value={simSecret}
                      onChange={(e) => setSimSecret(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0c0c] border border-white/[0.08] text-emerald-400 font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-400 block mb-1">
                      {isAr ? 'الحساب / البريد (يُكتشف تلقائياً)' : 'Account / Email (Auto-detected)'}
                    </label>
                    <input
                      type="text"
                      dir="auto"
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#0c0c0c] border border-white/[0.08] text-zinc-300 text-xs"
                    />
                  </div>

                  <button
                    onClick={() => {
                      setSimSaved(true);
                      setTimeout(() => setSimSaved(false), 2000);
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-md mt-1 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {simSaved ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-black stroke-[3]" />
                        <span>{isAr ? 'تم الحفظ والمزامنة مع Google Sheets!' : 'Synced to Google Sheets!'}</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-3.5 h-3.5 text-black" />
                        <span>{isAr ? 'حفظ ومزامنة إلى Google Sheets' : 'Save to Google Sheets'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
