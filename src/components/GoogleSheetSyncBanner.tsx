import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  FolderSync, 
  Plus, 
  Settings2,
  HardDrive,
  Key
} from 'lucide-react';
import { GoogleSheetConfig } from '../types';

interface GoogleSheetSyncBannerProps {
  googleConfig: GoogleSheetConfig;
  onConnectGoogle: () => void;
  onSyncNow: () => Promise<void>;
  onCreateNewSheet: () => Promise<void>;
  onUpdateConfig: (config: Partial<GoogleSheetConfig>) => void;
  isSyncing: boolean;
  lang: 'ar' | 'en';
}

export const GoogleSheetSyncBanner: React.FC<GoogleSheetSyncBannerProps> = ({
  googleConfig,
  onConnectGoogle,
  onSyncNow,
  onCreateNewSheet,
  onUpdateConfig,
  isSyncing,
  lang
}) => {
  const isAr = lang === 'ar';
  const [showSettings, setShowSettings] = useState(false);
  const [customSheetId, setCustomSheetId] = useState(googleConfig.spreadsheetId || '');

  return (
    <div className="bg-[#0c0c0c] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Status Info */}
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            googleConfig.isConnected
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : 'bg-[#141414] border border-white/[0.08] text-zinc-400'
          }`}>
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white">
                {googleConfig.isConnected
                  ? (isAr ? 'مزامنة Google Sheets مفعلة ومربوطة' : 'Google Sheets Sync Active')
                  : (isAr ? 'ربط الحفظ التلقائي بـ Google Sheets' : 'Connect Auto-Sync to Google Sheets')}
              </h3>
              {googleConfig.isConnected ? (
                <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  <CheckCircle2 className="w-3 h-3" /> {isAr ? 'متصل' : 'Connected'}
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#141414] text-zinc-400 border border-white/[0.08] font-semibold">
                  {isAr ? 'جاهز للربط' : 'Ready to Connect'}
                </span>
              )}
            </div>

            <p className="text-xs text-zinc-400 mt-0.5">
              {googleConfig.isConnected ? (
                <>
                  {isAr ? 'الملف المرتبط:' : 'Linked Spreadsheet:'}{' '}
                  <span className="font-mono text-zinc-200">{googleConfig.spreadsheetName || 'KeyVault_API_Secrets_DB'}</span>
                  {googleConfig.lastSyncedAt && (
                    <span className="text-zinc-500 ms-2">
                      • {isAr ? 'آخر مزامنة:' : 'Last sync:'} {new Date(googleConfig.lastSyncedAt).toLocaleTimeString(isAr ? 'ar-EG' : 'en-US')}
                    </span>
                  )}
                </>
              ) : (
                isAr
                  ? 'يتم حفظ أي مفتاح أو كلمة مرور تلقائياً في جدول Google Sheets مخصص داخل Google Drive الخاص بك'
                  : 'All saved API keys and passwords will automatically append to a dedicated Google Sheet in your Drive'
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          {googleConfig.isConnected ? (
            <>
              {googleConfig.spreadsheetUrl && (
                <a
                  href={googleConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141414] hover:bg-[#1c1c1c] border border-white/[0.08] text-zinc-200 text-xs font-semibold transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{isAr ? 'عرض في Google Sheets' : 'Open Sheet'}</span>
                </a>
              )}

              <button
                onClick={onSyncNow}
                disabled={isSyncing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (isAr ? 'جاري المزامنة...' : 'Syncing...') : (isAr ? 'مزامنة الآن' : 'Sync Now')}</span>
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-xl border border-white/[0.08] bg-[#141414] text-zinc-300 hover:text-white transition cursor-pointer"
                title={isAr ? 'إعدادات المزامنة' : 'Sync Settings'}
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <button
              onClick={onConnectGoogle}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/20 transition cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{isAr ? 'تفعيل مزامنة Google Sheets' : 'Enable Google Sheets Sync'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Settings Drawer */}
      {showSettings && (
        <div className="mt-4 pt-4 border-t border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-zinc-300 font-semibold mb-1">
              {isAr ? 'معرف Google Sheet ID' : 'Spreadsheet ID'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customSheetId}
                onChange={(e) => setCustomSheetId(e.target.value)}
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                className="flex-1 px-3 py-1.5 rounded-lg bg-[#050505] border border-white/[0.08] text-white font-mono text-[11px]"
              />
              <button
                onClick={() => {
                  onUpdateConfig({
                    spreadsheetId: customSheetId,
                    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${customSheetId}/edit`
                  });
                  alert(isAr ? 'تم حفظ معرف الجدول' : 'Spreadsheet ID updated');
                }}
                className="px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1c1c1c] text-zinc-200 font-semibold border border-white/[0.08] cursor-pointer"
              >
                {isAr ? 'حفظ' : 'Save'}
              </button>
            </div>
          </div>

          <div className="flex items-end justify-between">
            <button
              onClick={onCreateNewSheet}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition font-semibold cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? 'إنشاء جدول Google جديد مخصص' : 'Create Fresh Spreadsheet in Drive'}</span>
            </button>

            <button
              onClick={() => {
                if (confirm(isAr ? 'هل تريد فصل الربط مع Google Sheets؟' : 'Disconnect Google Sheets?')) {
                  onUpdateConfig({ isConnected: false });
                }
              }}
              className="text-rose-400 hover:text-rose-300 underline text-[11px] cursor-pointer"
            >
              {isAr ? 'فصل الربط' : 'Disconnect'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
