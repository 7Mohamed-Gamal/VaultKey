import React from 'react';
import { Key, Plus, Chrome, FileSpreadsheet, Sparkles, Globe, Command, ShieldCheck } from 'lucide-react';
import { GoogleSheetConfig } from '../types';

interface HeaderProps {
  onOpenQuickCapture: () => void;
  onOpenExtensionModal: () => void;
  onOpenGoogleConfig: () => void;
  googleConfig: GoogleSheetConfig;
  lang: 'ar' | 'en';
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenQuickCapture,
  onOpenExtensionModal,
  onOpenGoogleConfig,
  googleConfig,
  lang,
  onToggleLang
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="border-b border-white/[0.08] bg-[#080808]/90 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10 text-emerald-400 font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                KeyVault <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">Sync</span>
              </h1>
            </div>
            <p className="text-xs text-zinc-400">
              {isAr ? 'حفظ ومزامنة مفاتيح API وكلمات المرور في Google Sheets' : 'Instant API Key & Password capture to Google Sheets'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-white/[0.08] bg-[#111111] text-zinc-300 text-xs hover:bg-[#1a1a1a] transition cursor-pointer"
            title={isAr ? 'تغيير إلى الإنجليزية' : 'Switch to Arabic'}
          >
            <Globe className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold">{isAr ? 'EN' : 'عربي'}</span>
          </button>

          {/* Chrome Extension Button */}
          <button
            onClick={onOpenExtensionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/[0.08] bg-[#111111] text-zinc-300 hover:bg-[#1a1a1a] hover:text-white text-xs font-medium transition group cursor-pointer"
          >
            <Chrome className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
            <span className="hidden sm:inline">{isAr ? 'إضافة كروم (Extension)' : 'Chrome Extension'}</span>
          </button>

          {/* Google Sheets Connection Pill */}
          <button
            onClick={onOpenGoogleConfig}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              googleConfig.isConnected
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-[#141414] border-white/[0.08] text-zinc-400 hover:bg-[#1c1c1c] hover:text-zinc-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">
              {googleConfig.isConnected
                ? (isAr ? 'متصل بـ Google Sheets' : 'Google Sheets Connected')
                : (isAr ? 'ربط Google Sheets' : 'Connect Google Sheets')}
            </span>
            <span className={`w-2 h-2 rounded-full ${googleConfig.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
          </button>

          {/* Quick Capture Button with Keyboard Shortcut Badge */}
          <button
            onClick={onOpenQuickCapture}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-black stroke-[2.5]" />
            <span>{isAr ? 'حفظ سريع' : 'Quick Capture'}</span>
            <span className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-black/20 rounded border border-black/20 text-black font-semibold">
              <Command className="w-2.5 h-2.5" /> Shift+K
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
