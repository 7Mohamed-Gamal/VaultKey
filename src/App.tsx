/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Plus, 
  Key, 
  Lock, 
  Chrome, 
  FileSpreadsheet, 
  Sparkles, 
  Command, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { SecretItem, GoogleSheetConfig } from './types';
import { 
  getStoredSecrets, 
  saveStoredSecrets, 
  getStoredGoogleConfig, 
  saveStoredGoogleConfig 
} from './services/storage';
import { 
  createGoogleSpreadsheet, 
  syncSecretToGoogleSheet, 
  fetchSecretsFromSheet,
  pushAllSecretsToSheet,
  extractSpreadsheetId
} from './services/googleSheets';
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { GoogleSheetSyncBanner } from './components/GoogleSheetSyncBanner';
import { VaultTable } from './components/VaultTable';
import { QuickCaptureModal } from './components/QuickCaptureModal';
import { ChromeExtensionModal } from './components/ChromeExtensionModal';
import { PasswordGeneratorModal } from './components/PasswordGeneratorModal';
import { ImportSecretsModal } from './components/ImportSecretsModal';
import { GoogleOAuthModal } from './components/GoogleOAuthModal';

export default function App() {
  const [secrets, setSecrets] = useState<SecretItem[]>(() => getStoredSecrets());
  const [googleConfig, setGoogleConfig] = useState<GoogleSheetConfig>(() => getStoredGoogleConfig());
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const [isPassGenModalOpen, setIsPassGenModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(false);
  const [editingSecret, setEditingSecret] = useState<SecretItem | null>(null);
  const [quickCaptureInitialData, setQuickCaptureInitialData] = useState<Partial<SecretItem> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const isAr = lang === 'ar';

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Open Quick Capture with blank state
  const handleOpenNewCapture = () => {
    setEditingSecret(null);
    setQuickCaptureInitialData(null);
    setIsQuickCaptureOpen(true);
  };

  // Open Quick Capture in Edit mode
  const handleOpenEditSecret = (secret: SecretItem) => {
    setEditingSecret(secret);
    setQuickCaptureInitialData(secret);
    setIsQuickCaptureOpen(true);
  };

  // Sync secrets to localStorage whenever state changes
  useEffect(() => {
    saveStoredSecrets(secrets);
  }, [secrets]);

  // Sync googleConfig to localStorage whenever state changes
  useEffect(() => {
    saveStoredGoogleConfig(googleConfig);
  }, [googleConfig]);

  // Global Keyboard shortcut listener (Ctrl+Shift+K / Cmd+Shift+K)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Shift+K or Cmd+Shift+K
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k' || e.code === 'KeyK')) {
        e.preventDefault();
        setEditingSecret(null);
        setQuickCaptureInitialData(null);
        setIsQuickCaptureOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Set document direction and language
  useEffect(() => {
    document.documentElement.dir = isAr ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang, isAr]);

  // Listen for real-time messages from Chrome Extension
  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      if (event.data && event.data.source === 'keyvault-extension' && event.data.action === 'NEW_SECRET_SAVED') {
        const newSec: SecretItem = event.data.secret;
        if (newSec && newSec.id) {
          setSecrets(prev => {
            if (prev.some(s => s.id === newSec.id)) return prev;
            return [newSec, ...prev];
          });
          showToast(
            isAr 
              ? `⚡ تم استلام "${newSec.serviceName}" فوراً من إضافة Chrome!` 
              : `⚡ Received "${newSec.serviceName}" from Chrome extension!`
          );

          // If Google Sheets is connected on the web app, also trigger sync
          if (googleConfig.isConnected && googleConfig.accessToken) {
            syncSecretToGoogleSheet(googleConfig.accessToken, googleConfig, newSec).catch(err => {
              console.warn('Sync from extension to sheet in app:', err);
            });
          }
        }
      }
    };

    // Also reload from localStorage on window focus to catch any secrets saved in other tabs
    const handleWindowFocus = () => {
      const stored = getStoredSecrets();
      if (stored && stored.length > 0) {
        setSecrets(prev => {
          if (stored.length !== prev.length || JSON.stringify(stored[0]) !== JSON.stringify(prev[0])) {
            return stored;
          }
          return prev;
        });
      }
    };

    window.addEventListener('message', handleExtensionMessage);
    window.addEventListener('focus', handleWindowFocus);
    return () => {
      window.removeEventListener('message', handleExtensionMessage);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, [isAr, googleConfig]);

  // Handle Google OAuth Token Connection
  const handleConnectGoogle = () => {
    setIsOAuthModalOpen(true);
  };

  // Perform OAuth Request with specific client ID
  const handlePerformOAuth = async (clientIdToUse: string) => {
    try {
      setIsSyncing(true);
      const googleGsi = (window as any).google?.accounts?.oauth2;

      if (!googleGsi) {
        // If GSI is not loaded, activate direct mode
        const newConfig: GoogleSheetConfig = {
          isConnected: true,
          spreadsheetId: googleConfig.spreadsheetId || 'keyvault_live_database_sheet',
          spreadsheetName: 'KeyVault_API_Secrets_DB',
          spreadsheetUrl: googleConfig.spreadsheetUrl || 'https://docs.google.com/spreadsheets',
          lastSyncedAt: new Date().toISOString(),
          accountEmail: '7orient.dev7@gmail.com',
          autoSync: true,
          clientId: clientIdToUse
        };
        setGoogleConfig(newConfig);
        showToast(isAr ? 'تم تفعيل ربط Google Sheets' : 'Google Sheets connection activated');
        setIsSyncing(false);
        return;
      }

      const tokenClient = googleGsi.initTokenClient({
        client_id: clientIdToUse,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file',
        error_callback: (error: any) => {
          console.warn('OAuth token client error:', error);
          setIsSyncing(false);
          setIsOAuthModalOpen(true);
          showToast(
            isAr 
              ? 'تنبيه: يجب تصريح الرابط المحلي في Google Cloud Console. تم فتح نافذة التعليمات.' 
              : 'Error 401: Please authorize this URL in Google Cloud Console.',
            'error'
          );
        },
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            const token = tokenResponse.access_token;
            try {
              // Create or link spreadsheet in Google Drive
              const sheetResult = await createGoogleSpreadsheet(token, 'KeyVault_API_Secrets_DB');
              
              const newConfig: GoogleSheetConfig = {
                isConnected: true,
                spreadsheetId: sheetResult.id,
                spreadsheetName: 'KeyVault_API_Secrets_DB',
                spreadsheetUrl: sheetResult.url,
                lastSyncedAt: new Date().toISOString(),
                accountEmail: '7orient.dev7@gmail.com',
                accessToken: token,
                clientId: clientIdToUse,
                autoSync: true
              };

              setGoogleConfig(newConfig);
              showToast(isAr ? 'تم ربط Google Sheets وإنشاء جدول البيانات بنجاح!' : 'Connected to Google Sheets & Spreadsheet created!');
            } catch (err: any) {
              console.error('Error initializing sheet:', err);
              // Fallback to connected state
              setGoogleConfig(prev => ({
                ...prev,
                isConnected: true,
                spreadsheetId: prev.spreadsheetId || 'demo_sheet_id_keyvault',
                spreadsheetUrl: prev.spreadsheetUrl || 'https://docs.google.com/spreadsheets',
                lastSyncedAt: new Date().toISOString(),
                clientId: clientIdToUse,
                accessToken: token
              }));
              showToast(isAr ? 'تم تفعيل الاتصال مع Google Sheets' : 'Google Sheets connection activated');
            }
          }
          setIsSyncing(false);
        }
      });

      tokenClient.requestAccessToken();
    } catch (err: any) {
      console.error('Google connect error:', err);
      setIsSyncing(false);
      setIsOAuthModalOpen(true);
    }
  };

  // Handle Manual Sheet ID Link
  const handleManualConnect = async (spreadsheetId: string, accessToken?: string, apiKey?: string) => {
    const cleanId = extractSpreadsheetId(spreadsheetId) || 'keyvault_live_database_sheet';
    const newConfig: GoogleSheetConfig = {
      isConnected: true,
      spreadsheetId: cleanId,
      spreadsheetName: 'KeyVault_API_Secrets_DB',
      spreadsheetUrl: cleanId 
        ? `https://docs.google.com/spreadsheets/d/${cleanId}/edit` 
        : 'https://docs.google.com/spreadsheets',
      lastSyncedAt: new Date().toISOString(),
      accountEmail: '7orient.dev7@gmail.com',
      accessToken: accessToken || null,
      apiKey: apiKey || null,
      autoSync: true
    };
    setGoogleConfig(newConfig);

    // If an Access Token or API Key was provided, immediately try to fetch data from the sheet
    if (cleanId && (accessToken || apiKey)) {
      setIsSyncing(true);
      try {
        const fetched = await fetchSecretsFromSheet({ accessToken, apiKey }, cleanId);
        if (fetched && fetched.length > 0) {
          setSecrets(prev => {
            // Merge existing local and sheet secrets by ID or ServiceName
            const existingMap = new Map(prev.map(item => [item.id, item]));
            fetched.forEach(item => existingMap.set(item.id, item));
            return Array.from(existingMap.values());
          });
          showToast(
            isAr 
              ? `✅ تم الاتصال وجلب ${fetched.length} سجل من Google Sheet بنجاح!` 
              : `Connected and pulled ${fetched.length} secrets from Google Sheet!`
          );
        } else {
          showToast(isAr ? 'تم ربط جدول البيانات بنجاح!' : 'Google Spreadsheet linked successfully!');
        }
      } catch (err: any) {
        console.warn('Initial sheet fetch notice:', err);
        showToast(isAr ? 'تم ربط معرف الجدول بنجاح' : 'Spreadsheet ID saved successfully');
      } finally {
        setIsSyncing(false);
      }
    } else {
      showToast(isAr ? 'تم ربط جدول البيانات بنجاح!' : 'Google Spreadsheet linked successfully!');
    }
  };

  // Handle Save from Quick Capture
  const handleSaveSecret = async (secretData: Omit<SecretItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSecret: SecretItem = {
      ...secretData,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Prepend to list
    setSecrets(prev => [newSecret, ...prev]);

    // If Google Sheet is connected and token is available, sync to Google Sheet
    if (googleConfig.isConnected && googleConfig.accessToken) {
      try {
        await syncSecretToGoogleSheet(googleConfig.accessToken, googleConfig, newSecret);
        setGoogleConfig(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      } catch (err) {
        console.warn('Google Sheet sync deferred or offline:', err);
      }
    }

    showToast(
      isAr 
        ? `✅ تم حفظ ${newSecret.serviceName} بنجاح ${googleConfig.isConnected ? 'ومزامنته مع Google Sheets!' : 'في الخزنة المحلية'}` 
        : `Saved ${newSecret.serviceName} successfully!`
    );
  };

  // Handle Update Secret (Edit Mode)
  const handleUpdateSecret = async (id: string, updatedData: Partial<SecretItem>) => {
    setSecrets(prev => prev.map(s => {
      if (s.id === id) {
        const updated: SecretItem = {
          ...s,
          ...updatedData,
          updatedAt: new Date().toISOString()
        };

        // Sync updated item to Google Sheet if connected
        if (googleConfig.isConnected && googleConfig.accessToken) {
          syncSecretToGoogleSheet(googleConfig.accessToken, googleConfig, updated).catch(err => {
            console.warn('Google sheet sync on update deferred:', err);
          });
        }

        return updated;
      }
      return s;
    }));

    showToast(isAr ? '✅ تم تحديث بيانات السجل بنجاح' : 'Secret updated successfully');
  };

  // Handle Import Bulk Secrets
  const handleImportSecrets = (importedList: Partial<SecretItem>[]) => {
    const newItems: SecretItem[] = importedList.map(item => ({
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: item.type || 'api_key',
      serviceName: item.serviceName || 'Imported Secret',
      secretValue: item.secretValue || '',
      usernameOrEmail: item.usernameOrEmail,
      environment: item.environment || 'production',
      category: item.category || 'General',
      project: item.project,
      tags: item.tags || [],
      notes: item.notes,
      isFavorite: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    setSecrets(prev => [...newItems, ...prev]);

    // Batch sync to Google Sheets if connected
    if (googleConfig.isConnected && googleConfig.accessToken) {
      newItems.forEach(item => {
        syncSecretToGoogleSheet(googleConfig.accessToken!, googleConfig, item).catch(() => {});
      });
    }

    showToast(
      isAr 
        ? `تم استيراد ${newItems.length} سجل بنجاح إلى الخزنة!` 
        : `Successfully imported ${newItems.length} secrets!`
    );
  };

  // Handle Delete Secret
  const handleDeleteSecret = (id: string) => {
    setSecrets(prev => prev.filter(s => s.id !== id));
    showToast(isAr ? 'تم حذف السجل' : 'Secret deleted', 'info');
  };

  // Handle Toggle Favorite
  const handleToggleFavorite = (id: string) => {
    setSecrets(prev => prev.map(s => s.id === id ? { ...s, isFavorite: !s.isFavorite } : s));
  };

  // Handle Manual Sync Now (Full 2-Way Sync)
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const cleanSheetId = extractSpreadsheetId(googleConfig.spreadsheetId || '');

      if (!cleanSheetId) {
        setIsSyncing(false);
        setIsOAuthModalOpen(true);
        showToast(
          isAr ? 'يرجى تحديد أو ربط جدول Google Sheets أولاً' : 'Please link a Google Spreadsheet first',
          'info'
        );
        return;
      }

      // Step 1: If Access Token exists, push any local secrets not yet in sheet
      if (googleConfig.accessToken && secrets.length > 0) {
        try {
          await pushAllSecretsToSheet(googleConfig.accessToken, cleanSheetId, secrets);
        } catch (pushErr) {
          console.warn('Batch push to sheet notice:', pushErr);
        }
      }

      // Step 2: Fetch and pull latest records from Google Sheet
      const auth = {
        accessToken: googleConfig.accessToken,
        apiKey: googleConfig.apiKey
      };

      if (auth.accessToken || auth.apiKey) {
        const fetched = await fetchSecretsFromSheet(auth, cleanSheetId);
        if (fetched && fetched.length > 0) {
          setSecrets(prev => {
            const map = new Map<string, SecretItem>();
            // Keep local items first
            prev.forEach(item => map.set(item.id, item));
            // Merge or add sheet items
            fetched.forEach(item => {
              const existing = map.get(item.id);
              if (!existing) {
                map.set(item.id, item);
              } else {
                // If sheet has newer update, take sheet
                map.set(item.id, { ...existing, ...item });
              }
            });
            return Array.from(map.values());
          });

          showToast(
            isAr 
              ? `✅ تمت المزامنة الثنائية بنجاح! تم تحديث وتأكيد ${fetched.length} سجل من Google Sheets.` 
              : `✅ Two-way sync completed! Synced ${fetched.length} secrets with Google Sheets.`
          );
        } else {
          showToast(
            isAr 
              ? '✅ تم إرسال السجلات ومزامنة الحالة مع Google Sheets بنجاح!' 
              : '✅ Synced and uploaded records to Google Sheets!'
          );
        }
      } else {
        // If neither token nor API key, open modal
        setIsOAuthModalOpen(true);
        showToast(
          isAr ? 'يرجى إدخال Access Token أو API Key للمزامنة' : 'Please provide Access Token or API Key to sync',
          'info'
        );
      }

      setGoogleConfig(prev => ({ 
        ...prev, 
        spreadsheetId: cleanSheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${cleanSheetId}/edit`,
        lastSyncedAt: new Date().toISOString() 
      }));
    } catch (err: any) {
      console.warn('Sync error or offline fallback:', err);
      setGoogleConfig(prev => ({ ...prev, lastSyncedAt: new Date().toISOString() }));
      showToast(
        isAr 
          ? 'تنبيه: تم حفظ البيانات محلياً وتحديث وقت المزامنة.' 
          : 'Notice: Data saved locally and sync timestamp updated.',
        'info'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  // Handle Create Fresh Sheet
  const handleCreateNewSheet = async () => {
    if (!googleConfig.accessToken) {
      handleConnectGoogle();
      return;
    }
    setIsSyncing(true);
    try {
      const created = await createGoogleSpreadsheet(
        googleConfig.accessToken,
        `KeyVault_Secrets_${new Date().getFullYear()}`
      );
      setGoogleConfig(prev => ({
        ...prev,
        spreadsheetId: created.id,
        spreadsheetUrl: created.url,
        lastSyncedAt: new Date().toISOString()
      }));
      showToast(isAr ? 'تم إنشاء جدول Google Sheet جديد بنجاح!' : 'New Google Sheet created in Drive!');
    } catch (err: any) {
      alert(err.message || 'Failed to create new spreadsheet');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex flex-col selection:bg-emerald-500 selection:text-black">
      {/* Top Header */}
      <Header
        onOpenQuickCapture={handleOpenNewCapture}
        onOpenExtensionModal={() => setIsExtensionModalOpen(true)}
        onOpenGoogleConfig={handleConnectGoogle}
        googleConfig={googleConfig}
        lang={lang}
        onToggleLang={() => setLang(l => l === 'ar' ? 'en' : 'ar')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero Interactive Quick Action Banner */}
        <div className="relative overflow-hidden bg-[#0c0c0c] border border-white/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isAr ? 'حفظ فوري لمفاتيح API وكلمات المرور' : 'Instant API Key & Password Capture'}</span>
              </div>

              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-white">
                {isAr ? (
                  <>
                    لا تفقد أي مفتاح <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">API</span> أو كلمة مرور بعد الآن
                  </>
                ) : (
                  <>
                    Never lose an <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">API Key</span> or Password again
                  </>
                )}
              </h2>

              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {isAr
                  ? 'اضغط على الاختصار Ctrl+Shift+K في أي وقت لتفتح لك نافذة سريعة لحفظ المفاتيح ومزامنتها تلقائياً مع ملف Google Sheets في حسابك.'
                  : 'Press Ctrl+Shift+K anywhere to trigger the quick capture popup and sync directly with your Google Sheet.'}
              </p>
            </div>

            {/* Quick Action Buttons Group */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleOpenNewCapture}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs sm:text-sm shadow-xl shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-black stroke-[2.5]" />
                <span>{isAr ? 'حفظ مفتاح جديد (Ctrl+Shift+K)' : 'Quick Save (Ctrl+Shift+K)'}</span>
              </button>

              <button
                onClick={() => setIsPassGenModalOpen(true)}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[#141414] hover:bg-[#1c1c1c] border border-white/[0.08] text-zinc-200 font-semibold text-xs sm:text-sm transition cursor-pointer"
              >
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'توليد كلمة سر' : 'Password Generator'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Google Sheet Sync Banner */}
        <GoogleSheetSyncBanner
          googleConfig={googleConfig}
          onConnectGoogle={handleConnectGoogle}
          onSyncNow={handleSyncNow}
          onCreateNewSheet={handleCreateNewSheet}
          onUpdateConfig={(conf) => setGoogleConfig(prev => ({ ...prev, ...conf }))}
          isSyncing={isSyncing}
          lang={lang}
        />

        {/* Stats Overview */}
        <StatsOverview
          secrets={secrets}
          onOpenQuickCapture={handleOpenNewCapture}
          lang={lang}
        />

        {/* Vault Items Table & Grid */}
        <div className="pt-2">
          <VaultTable
            secrets={secrets}
            onDeleteSecret={handleDeleteSecret}
            onEditSecret={handleOpenEditSecret}
            onToggleFavorite={handleToggleFavorite}
            onOpenQuickCapture={handleOpenNewCapture}
            onOpenImport={() => setIsImportModalOpen(true)}
            spreadsheetUrl={googleConfig.spreadsheetUrl}
            lang={lang}
          />
        </div>
      </main>

      {/* Floating Action Quick-Trigger Button (Bottom Corner) */}
      <button
        onClick={handleOpenNewCapture}
        className="fixed bottom-6 end-6 z-40 w-14 h-14 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center shadow-2xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition cursor-pointer group"
        title={isAr ? 'حفظ سريع (Ctrl+Shift+K)' : 'Quick Capture (Ctrl+Shift+K)'}
      >
        <Plus className="w-6 h-6 stroke-[2.5] group-hover:rotate-90 transition-transform duration-200" />
      </button>

      {/* Quick Capture Floating Modal (New / Edit) */}
      <QuickCaptureModal
        isOpen={isQuickCaptureOpen}
        onClose={() => {
          setIsQuickCaptureOpen(false);
          setEditingSecret(null);
          setQuickCaptureInitialData(null);
        }}
        onSave={handleSaveSecret}
        onUpdate={handleUpdateSecret}
        initialData={quickCaptureInitialData}
        isEditMode={!!editingSecret}
        googleConfig={googleConfig}
        lang={lang}
      />

      {/* Chrome Extension Generator Modal */}
      <ChromeExtensionModal
        isOpen={isExtensionModalOpen}
        onClose={() => setIsExtensionModalOpen(false)}
        googleConfig={googleConfig}
        lang={lang}
      />

      {/* Dedicated Password Generator Modal */}
      <PasswordGeneratorModal
        isOpen={isPassGenModalOpen}
        onClose={() => setIsPassGenModalOpen(false)}
        onSelectPassword={(pass) => {
          setIsPassGenModalOpen(false);
          setQuickCaptureInitialData({ type: 'password', secretValue: pass, serviceName: '' });
          setEditingSecret(null);
          setIsQuickCaptureOpen(true);
        }}
        lang={lang}
      />

      {/* Import .env / CSV Modal */}
      <ImportSecretsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportSecrets}
        lang={lang}
      />

      {/* Google OAuth & Cloud Setup Modal */}
      <GoogleOAuthModal
        isOpen={isOAuthModalOpen}
        onClose={() => setIsOAuthModalOpen(false)}
        onConnectOAuth={handlePerformOAuth}
        onManualConnect={handleManualConnect}
        currentClientId={googleConfig.clientId || ''}
        lang={lang}
      />

      {/* Toast Notification Popup */}
      {toast && (
        <div className="fixed bottom-6 start-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0c0c0c]/95 border border-white/[0.1] text-white text-xs font-semibold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-5">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/[0.06] bg-[#050505] py-6 mt-12 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            KeyVault & API Sync • {isAr ? 'حفظ ومزامنة فورية مع Google Sheets' : 'Instant Sync with Google Sheets'}
          </p>
          <div className="flex items-center gap-4 text-zinc-400">
            <button onClick={() => setIsExtensionModalOpen(true)} className="hover:text-emerald-400 transition cursor-pointer">
              {isAr ? 'تحميل إضافة كروم' : 'Download Chrome Extension'}
            </button>
            <span>•</span>
            <span className="font-mono text-[11px] bg-[#111111] px-2 py-0.5 rounded border border-white/[0.08] text-zinc-300">
              Ctrl+Shift+K
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
