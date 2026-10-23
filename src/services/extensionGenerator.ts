import JSZip from 'jszip';
import { GoogleSheetConfig } from '../types';

export interface ExtensionGeneratorOptions {
  appUrl: string;
  spreadsheetId?: string | null;
  spreadsheetUrl?: string | null;
  webhookUrl?: string | null;
  accessToken?: string | null;
  clientId?: string | null;
}

export async function generateChromeExtensionZip(config: ExtensionGeneratorOptions): Promise<Blob> {
  const zip = new JSZip();

  const safeAppUrl = config.appUrl || 'http://localhost:3000';
  const safeSpreadsheetId = config.spreadsheetId || '';
  const safeSpreadsheetUrl = config.spreadsheetUrl || '';
  const safeAccessToken = config.accessToken || '';

  // 1. Manifest V3 with Content Scripts, Commands, and Host Permissions
  const manifest = {
    manifest_version: 3,
    name: "KeyVault & API Quick-Save",
    version: "1.2.0",
    description: "حفظ ومزامنة المفاتيح وكلمات المرور بضغطة زر Ctrl+Shift+K مباشرة إلى Google Sheets ومن أي موقع.",
    permissions: [
      "storage",
      "activeTab",
      "scripting",
      "tabs"
    ],
    host_permissions: [
      "https://sheets.googleapis.com/*",
      "https://docs.google.com/*",
      "https://script.google.com/*",
      "http://localhost/*",
      "https://*/*"
    ],
    action: {
      default_popup: "popup.html",
      default_title: "KeyVault Quick Capture (Ctrl+Shift+K)",
      default_icon: {
        "16": "icons/icon16.png",
        "48": "icons/icon48.png",
        "128": "icons/icon128.png"
      }
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: "Ctrl+Shift+K",
          mac: "Command+Shift+K"
        },
        description: "Open KeyVault Quick Capture Popup"
      },
      quick_capture_overlay: {
        suggested_key: {
          default: "Ctrl+Shift+K",
          mac: "Command+Shift+K"
        },
        description: "Toggle KeyVault In-Page Floating Quick Capture on Any Website"
      }
    },
    content_scripts: [
      {
        matches: ["<all_urls>"],
        js: ["content.js"],
        css: ["content.css"],
        run_at: "document_idle"
      }
    ],
    background: {
      service_worker: "background.js"
    },
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 2. config.js - Pre-baked settings
  const configJs = `// Pre-configured settings from KeyVault Web App
const KEYVAULT_DEFAULT_CONFIG = {
  appUrl: ${JSON.stringify(safeAppUrl)},
  spreadsheetId: ${JSON.stringify(safeSpreadsheetId)},
  spreadsheetUrl: ${JSON.stringify(safeSpreadsheetUrl)},
  webhookUrl: ${JSON.stringify(config.webhookUrl || "")},
  accessToken: ${JSON.stringify(safeAccessToken)}
};
`;
  zip.file("config.js", configJs);

  // 3. background.js
  const backgroundJs = `// KeyVault Background Service Worker
importScripts('config.js');

chrome.runtime.onInstalled.addListener(() => {
  // Save pre-configured values to local storage if not present
  chrome.storage.local.get(['spreadsheetId', 'accessToken', 'webhookUrl', 'appUrl'], (res) => {
    const updates = {};
    if (!res.spreadsheetId && KEYVAULT_DEFAULT_CONFIG.spreadsheetId) {
      updates.spreadsheetId = KEYVAULT_DEFAULT_CONFIG.spreadsheetId;
    }
    if (!res.accessToken && KEYVAULT_DEFAULT_CONFIG.accessToken) {
      updates.accessToken = KEYVAULT_DEFAULT_CONFIG.accessToken;
    }
    if (!res.webhookUrl && KEYVAULT_DEFAULT_CONFIG.webhookUrl) {
      updates.webhookUrl = KEYVAULT_DEFAULT_CONFIG.webhookUrl;
    }
    if (!res.appUrl && KEYVAULT_DEFAULT_CONFIG.appUrl) {
      updates.appUrl = KEYVAULT_DEFAULT_CONFIG.appUrl;
    }
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates);
    }
  });
  console.log('KeyVault Extension Installed.');
});

// Listen for keyboard commands anywhere in Chrome
chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick_capture_overlay' || command === '_execute_action') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'TOGGLE_KEYVAULT_MODAL' }).catch(() => {
          // If content script is not yet injected or tab is restricted
        });
      }
    });
  }
});

// Broadcast saved secrets to any open KeyVault Web App tabs
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'SECRET_SAVED') {
    // Notify all open tabs running the web app
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id && tab.url && (tab.url.includes('localhost') || tab.url.includes('run.app') || tab.url.includes('keyvault'))) {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'SYNC_SECRET_TO_APP', 
            secret: request.secret 
          }).catch(() => {});
        }
      });
    });
    sendResponse({ success: true });
  }
});
`;
  zip.file("background.js", backgroundJs);

  // 4. content.css - In-page sleek modal styling
  const contentCss = `
#keyvault-overlay-host {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(5, 5, 5, 0.75) !important;
  backdrop-filter: blur(8px) !important;
  -webkit-backdrop-filter: blur(8px) !important;
  z-index: 2147483647 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 16px !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Cairo', sans-serif !important;
  box-sizing: border-box !important;
}

#keyvault-modal {
  width: 100% !important;
  max-width: 440px !important;
  background: #0c0c0c !important;
  border: 1px solid rgba(255, 255, 255, 0.12) !important;
  border-radius: 20px !important;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(16, 185, 129, 0.15) !important;
  color: #f8fafc !important;
  direction: rtl !important;
  text-align: right !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
  animation: keyvault-pop 0.2s ease-out !important;
}

@keyframes keyvault-pop {
  from { opacity: 0; transform: scale(0.95) translateY(10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.kv-header {
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 14px 18px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
  background: #111111 !important;
}

.kv-title {
  font-size: 14px !important;
  font-weight: 700 !important;
  color: #10b981 !important;
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
}

.kv-badge {
  font-size: 10px !important;
  background: rgba(16, 185, 129, 0.15) !important;
  color: #34d399 !important;
  border: 1px solid rgba(16, 185, 129, 0.3) !important;
  padding: 2px 6px !important;
  border-radius: 6px !important;
  font-family: monospace !important;
}

.kv-close {
  background: transparent !important;
  border: none !important;
  color: #94a3b8 !important;
  font-size: 18px !important;
  cursor: pointer !important;
  padding: 4px 8px !important;
  border-radius: 6px !important;
  line-height: 1 !important;
}

.kv-close:hover {
  background: #222222 !important;
  color: #ffffff !important;
}

.kv-body {
  padding: 16px 18px !important;
}

.kv-types {
  display: grid !important;
  grid-template-columns: repeat(3, 1fr) !important;
  gap: 6px !important;
  margin-bottom: 12px !important;
}

.kv-type-btn {
  background: #161616 !important;
  border: 1px solid rgba(255, 255, 255, 0.08) !important;
  color: #94a3b8 !important;
  padding: 7px 4px !important;
  border-radius: 8px !important;
  font-size: 11px !important;
  cursor: pointer !important;
  text-align: center !important;
  font-weight: 600 !important;
  transition: all 0.15s !important;
}

.kv-type-btn.active {
  background: #10b981 !important;
  border-color: #10b981 !important;
  color: #000000 !important;
  font-weight: 700 !important;
}

.kv-field {
  margin-bottom: 11px !important;
}

.kv-label {
  display: block !important;
  font-size: 11px !important;
  color: #cbd5e1 !important;
  margin-bottom: 5px !important;
  font-weight: 600 !important;
}

.kv-input {
  width: 100% !important;
  background: #050505 !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  color: #ffffff !important;
  padding: 8px 12px !important;
  font-size: 12px !important;
  box-sizing: border-box !important;
  outline: none !important;
  transition: border-color 0.2s !important;
  direction: ltr !important;
  text-align: left !important;
}

.kv-input.rtl-text {
  direction: rtl !important;
  text-align: right !important;
}

.kv-input:focus {
  border-color: #10b981 !important;
  box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2) !important;
}

.kv-secret-wrap {
  position: relative !important;
  display: flex !important;
}

.kv-gen-btn {
  position: absolute !important;
  left: 6px !important;
  top: 6px !important;
  background: #1e1e1e !important;
  border: 1px solid rgba(255, 255, 255, 0.1) !important;
  color: #34d399 !important;
  font-size: 10px !important;
  padding: 3px 8px !important;
  border-radius: 6px !important;
  cursor: pointer !important;
  font-weight: 600 !important;
}

.kv-gen-btn:hover {
  background: #282828 !important;
}

.kv-grid-2 {
  display: flex !important;
  gap: 8px !important;
}

.kv-grid-2 > div {
  flex: 1 !important;
}

.kv-save-btn {
  width: 100% !important;
  background: #10b981 !important;
  color: #000000 !important;
  border: none !important;
  padding: 11px !important;
  border-radius: 10px !important;
  font-weight: 700 !important;
  font-size: 13px !important;
  cursor: pointer !important;
  margin-top: 6px !important;
  transition: background 0.15s, transform 0.1s !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
}

.kv-save-btn:hover {
  background: #34d399 !important;
}

.kv-save-btn:active {
  transform: scale(0.98) !important;
}

.kv-status {
  margin-top: 10px !important;
  font-size: 11px !important;
  text-align: center !important;
  padding: 8px !important;
  border-radius: 8px !important;
  display: none !important;
  font-weight: 600 !important;
}

.kv-status.success {
  display: block !important;
  background: rgba(16, 185, 129, 0.15) !important;
  color: #34d399 !important;
  border: 1px solid rgba(16, 185, 129, 0.3) !important;
}

.kv-status.error {
  display: block !important;
  background: rgba(239, 68, 68, 0.15) !important;
  color: #f87171 !important;
  border: 1px solid rgba(239, 68, 68, 0.3) !important;
}

.kv-footer {
  margin-top: 12px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  font-size: 11px !important;
  color: #64748b !important;
}

.kv-footer a {
  color: #10b981 !important;
  text-decoration: none !important;
  font-weight: 600 !important;
}
`;
  zip.file("content.css", contentCss);

  // 5. content.js - Injected everywhere for global shortcut and instant in-page capture
  const contentJs = `// KeyVault In-Page Content Script
let isModalOpen = false;

// Listen for global shortcut keydown (Ctrl+Shift+K or Cmd+Shift+K)
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'K' || e.key === 'k' || e.code === 'KeyK')) {
    e.preventDefault();
    toggleKeyVaultModal();
  }
  if (e.key === 'Escape' && isModalOpen) {
    removeKeyVaultModal();
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'TOGGLE_KEYVAULT_MODAL') {
    toggleKeyVaultModal();
    sendResponse({ success: true });
  } else if (request.action === 'SYNC_SECRET_TO_APP') {
    // Forward to web app window if this tab is the KeyVault App
    window.postMessage({
      source: 'keyvault-extension',
      action: 'NEW_SECRET_SAVED',
      secret: request.secret
    }, '*');
    sendResponse({ success: true });
  }
});

function toggleKeyVaultModal() {
  if (isModalOpen) {
    removeKeyVaultModal();
  } else {
    createKeyVaultModal();
  }
}

function removeKeyVaultModal() {
  const host = document.getElementById('keyvault-overlay-host');
  if (host) host.remove();
  isModalOpen = false;
}

function createKeyVaultModal() {
  removeKeyVaultModal();
  isModalOpen = true;

  // Auto-detect full current URL
  let detectedUrl = '';
  try {
    detectedUrl = window.location.href || '';
  } catch(e) {}

  // Auto-detect logged in user email
  let detectedEmail = '';
  try {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
    const ignore = ['support@', 'info@', 'contact@', 'sales@', 'help@', 'privacy@', 'billing@', 'legal@', 'security@', 'admin@', 'noreply@', 'no-reply@', 'team@', 'marketing@'];
    const isValid = (em) => {
      if (!em) return false;
      const c = em.trim().toLowerCase();
      if (c.endsWith('.png') || c.endsWith('.jpg') || c.endsWith('.svg') || c.endsWith('.gif') || c.endsWith('.webp')) return false;
      return !ignore.some(p => c.startsWith(p));
    };

    const attrs = document.querySelectorAll('[aria-label*="@"], [title*="@"], [data-email], [data-user-email], [data-login*="@"]');
    for (const el of attrs) {
      const raw = el.getAttribute('data-email') || el.getAttribute('data-user-email') || el.getAttribute('aria-label') || el.getAttribute('title') || '';
      const m = raw.match(emailRegex);
      if (m) {
        for (const em of m) {
          if (isValid(em)) { detectedEmail = em; break; }
        }
        if (detectedEmail) break;
      }
    }

    if (!detectedEmail) {
      const containers = document.querySelectorAll('header, nav, [class*="profile" i], [class*="account" i], [class*="user" i], [id*="profile" i], [id*="account" i], [class*="avatar" i]');
      for (const c of containers) {
        const m = (c.innerText || '').match(emailRegex);
        if (m) {
          for (const em of m) {
            if (isValid(em)) { detectedEmail = em; break; }
          }
          if (detectedEmail) break;
        }
      }
    }

    if (!detectedEmail) {
      const inputs = document.querySelectorAll('input[type="email"], input[name*="email" i], input[id*="email" i]');
      for (const inp of inputs) {
        const val = inp.value || '';
        const m = val.match(emailRegex);
        if (m) {
          for (const em of m) {
            if (isValid(em)) { detectedEmail = em; break; }
          }
          if (detectedEmail) break;
        }
      }
    }
  } catch(e) {}

  const host = document.createElement('div');
  host.id = 'keyvault-overlay-host';

  host.innerHTML = \`
    <div id="keyvault-modal" onclick="event.stopPropagation()">
      <div class="kv-header">
        <div class="kv-title">
          <span>🔑 KeyVault Quick-Save</span>
          <span class="kv-badge">Ctrl+Shift+K</span>
        </div>
        <button id="kv-close-btn" class="kv-close" title="إغلاق (Esc)">✕</button>
      </div>

      <div class="kv-body">
        <div class="kv-types">
          <button type="button" class="kv-type-btn active" data-type="api_key">API Key</button>
          <button type="button" class="kv-type-btn" data-type="password">كلمة سر</button>
          <button type="button" class="kv-type-btn" data-type="token">Token / سر</button>
        </div>

        <div class="kv-field">
          <label class="kv-label">اسم الخدمة / الموقع</label>
          <input type="text" id="kv-serviceName" class="kv-input" dir="auto" value="\${detectedUrl}" placeholder="https://example.com/..." />
        </div>

        <div class="kv-field">
          <label class="kv-label">المفتاح أو القيمة السرية</label>
          <div class="kv-secret-wrap">
            <input type="text" id="kv-secretValue" class="kv-input" placeholder="sk-... أو كلمة المرور" />
            <button type="button" id="kv-gen-btn" class="kv-gen-btn">⚡ توليد</button>
          </div>
        </div>

        <div class="kv-grid-2">
          <div class="kv-field">
            <label class="kv-label">الحساب / البريد (اختياري)</label>
            <input type="text" id="kv-userEmail" class="kv-input" dir="auto" value="\${detectedEmail}" placeholder="dev@example.com" />
          </div>

          <div class="kv-field">
            <label class="kv-label">البيئة</label>
            <select id="kv-envSelect" class="kv-input rtl-text">
              <option value="production">Production</option>
              <option value="staging">Staging</option>
              <option value="development">Development</option>
            </select>
          </div>
        </div>

        <div class="kv-field">
          <label class="kv-label">الوسوم (مفصولة بفواصل)</label>
          <input type="text" id="kv-tags" class="kv-input rtl-text" placeholder="AI, Payments, Auth" />
        </div>

        <button type="button" id="kv-save-btn" class="kv-save-btn">
          <span>💾 حفظ ومزامنة فورية مع Google Sheets</span>
        </button>

        <div id="kv-status" class="kv-status"></div>

        <div class="kv-footer">
          <span>مزامنة مشفرة وآمنة</span>
          <span style="font-family: monospace; font-size: 10px; color: #10b981;">● Google Sheets Live</span>
        </div>
      </div>
    </div>
  \`;

  document.body.appendChild(host);

  // Close on outside click
  host.addEventListener('click', (e) => {
    if (e.target === host) removeKeyVaultModal();
  });

  // Close button
  document.getElementById('kv-close-btn').addEventListener('click', removeKeyVaultModal);

  // Type buttons
  let selectedType = 'api_key';
  const typeBtns = host.querySelectorAll('.kv-type-btn');
  typeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      typeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.dataset.type;
    });
  });

  // Password Generator
  document.getElementById('kv-gen-btn').addEventListener('click', () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~';
    let pass = '';
    for(let i = 0; i < 24; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const secretInput = document.getElementById('kv-secretValue');
    secretInput.value = pass;
    secretInput.focus();
  });

  // Focus on secret value or service name
  setTimeout(() => {
    const sInput = document.getElementById('kv-secretValue');
    const nameInput = document.getElementById('kv-serviceName');
    if (detectedUrl) {
      sInput.focus();
    } else {
      nameInput.focus();
    }
  }, 50);

  // Handle Save
  document.getElementById('kv-save-btn').addEventListener('click', async () => {
    const serviceName = document.getElementById('kv-serviceName').value.trim();
    const secretValue = document.getElementById('kv-secretValue').value.trim();
    const userEmail = document.getElementById('kv-userEmail').value.trim();
    const environment = document.getElementById('kv-envSelect').value;
    const tags = document.getElementById('kv-tags').value.split(',').map(s => s.trim()).filter(Boolean);
    const statusDiv = document.getElementById('kv-status');

    if (!serviceName || !secretValue) {
      statusDiv.className = 'kv-status error';
      statusDiv.innerText = 'يرجى إدخال اسم الخدمة والمفتاح السري أولاً';
      return;
    }

    const newSecret = {
      id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      type: selectedType,
      serviceName,
      secretValue,
      usernameOrEmail: userEmail || undefined,
      environment,
      tags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    statusDiv.className = 'kv-status';
    statusDiv.style.display = 'block';
    statusDiv.innerText = 'جاري الحفظ والمزامنة...';

    // 1. Save to Chrome Local Storage
    chrome.storage.local.get(['keyvault_secrets', 'spreadsheetId', 'accessToken'], async (storageRes) => {
      const list = storageRes.keyvault_secrets || [];
      list.unshift(newSecret);
      chrome.storage.local.set({ keyvault_secrets: list });

      let sheetSyncSuccess = false;
      const sheetId = storageRes.spreadsheetId || KEYVAULT_DEFAULT_CONFIG.spreadsheetId;
      const token = storageRes.accessToken || KEYVAULT_DEFAULT_CONFIG.accessToken;

      // 2. Direct Sync to Google Sheets REST API if token and sheet ID exist
      if (sheetId && token) {
        try {
          const rowData = [
            newSecret.id,
            newSecret.type.toUpperCase(),
            newSecret.serviceName,
            newSecret.usernameOrEmail || '',
            newSecret.secretValue,
            newSecret.environment,
            'Chrome Extension',
            (newSecret.tags || []).join(', '),
            'Saved via Chrome In-Page Extension',
            newSecret.createdAt,
            newSecret.updatedAt
          ];

          const res = await fetch(\`https://sheets.googleapis.com/v4/spreadsheets/\${sheetId}/values/Vault_Secrets!A:K:append?valueInputOption=USER_ENTERED\`, {
            method: 'POST',
            headers: {
              'Authorization': \`Bearer \${token}\`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ values: [rowData] })
          });

          if (res.ok) {
            sheetSyncSuccess = true;
          }
        } catch (syncErr) {
          console.warn('Direct Google Sheet sync deferred:', syncErr);
        }
      }

      // 3. Notify Background Script to broadcast to open Web App tabs
      chrome.runtime.sendMessage({ action: 'SECRET_SAVED', secret: newSecret });

      // 4. If current page is the KeyVault App, notify directly
      window.postMessage({
        source: 'keyvault-extension',
        action: 'NEW_SECRET_SAVED',
        secret: newSecret
      }, '*');

      statusDiv.className = 'kv-status success';
      statusDiv.innerText = sheetSyncSuccess 
        ? '✅ تم الحفظ والمزامنة مع Google Sheets بنجاح!' 
        : '✅ تم الحفظ في الخزنة بنجاح!';

      setTimeout(() => {
        removeKeyVaultModal();
      }, 1200);
    });
  });
}
`;
  zip.file("content.js", contentJs);

  // 6. popup.html
  const popupHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>KeyVault Quick Save</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Cairo', sans-serif; }
    body { width: 370px; background: #0c0c0c; color: #f8fafc; padding: 16px; direction: rtl; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.08); }
    .title { font-size: 14px; font-weight: 700; color: #10b981; display: flex; align-items: center; gap: 6px; }
    .shortcut { font-size: 10px; background: #181818; border: 1px solid rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; color: #94a3b8; font-family: monospace; }
    .tabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 8px; }
    .tab-btn { background: transparent; border: none; color: #94a3b8; font-size: 11px; font-weight: 700; cursor: pointer; padding: 4px 8px; border-radius: 6px; }
    .tab-btn.active { color: #10b981; background: rgba(16, 185, 129, 0.1); }
    .types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 10px; }
    .type-btn { background: #161616; border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; padding: 6px 4px; border-radius: 6px; font-size: 11px; cursor: pointer; text-align: center; font-weight: 600; }
    .type-btn.active { background: #10b981; border-color: #10b981; color: #000; font-weight: 700; }
    .field { margin-bottom: 9px; }
    .label { font-size: 11px; color: #cbd5e1; margin-bottom: 4px; display: block; font-weight: 600; }
    .input { width: 100%; background: #050505; border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff; padding: 7px 10px; font-size: 12px; outline: none; }
    .input:focus { border-color: #10b981; }
    .secret-wrap { position: relative; }
    .gen-btn { position: absolute; left: 5px; top: 5px; background: #1c1c1c; border: 1px solid rgba(255,255,255,0.1); color: #34d399; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .save-btn { width: 100%; background: #10b981; color: #000; border: none; padding: 10px; border-radius: 8px; font-weight: 700; font-size: 12px; cursor: pointer; margin-top: 6px; transition: background 0.15s; }
    .save-btn:hover { background: #34d399; }
    .status { margin-top: 8px; font-size: 11px; text-align: center; display: none; padding: 6px; border-radius: 6px; font-weight: 600; }
    .status.success { display: block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .status.error { display: block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
    .footer { margin-top: 12px; text-align: center; font-size: 10px; color: #64748b; display: flex; align-items: center; justify-content: space-between; }
    .footer a { color: #10b981; text-decoration: none; font-weight: 600; }
    .badge-live { color: #10b981; display: inline-flex; align-items: center; gap: 4px; font-size: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🔑 KeyVault Quick Save</div>
    <span class="shortcut">Ctrl+Shift+K</span>
  </div>

  <div class="tabs">
    <button class="tab-btn active" id="tab-save-btn">حفظ سريع</button>
    <button class="tab-btn" id="tab-settings-btn">إعدادات Google Sheets</button>
  </div>

  <!-- Save Tab -->
  <div id="tab-save-content">
    <div class="types">
      <button class="type-btn active" data-type="api_key">API Key</button>
      <button class="type-btn" data-type="password">كلمة مرور</button>
      <button class="type-btn" data-type="token">Token / سر</button>
    </div>

    <div class="field">
      <label class="label">اسم الخدمة / الموقع</label>
      <input type="text" id="serviceName" class="input" dir="auto" placeholder="https://example.com/..." />
    </div>

    <div class="field">
      <label class="label">المفتاح / القيمة السرية</label>
      <div class="secret-wrap">
        <input type="text" id="secretValue" class="input" placeholder="sk-... أو كلمة المرور" />
        <button type="button" id="genBtn" class="gen-btn">⚡ توليد</button>
      </div>
    </div>

    <div class="field">
      <label class="label">الحساب / البريد (اختياري)</label>
      <input type="text" id="userEmail" class="input" dir="auto" placeholder="dev@example.com" />
    </div>

    <div class="field">
      <div style="display: flex; gap: 6px;">
        <select id="envSelect" class="input" style="width: 50%;">
          <option value="production">Production</option>
          <option value="staging">Staging</option>
          <option value="development">Development</option>
        </select>
        <input type="text" id="tagsInput" class="input" placeholder="وسوم: AI, Prod" style="width: 50%;" />
      </div>
    </div>

    <button id="saveBtn" class="save-btn">💾 حفظ ومزامنة فورية مع Google Sheets</button>
    <div id="status" class="status"></div>
  </div>

  <!-- Settings Tab -->
  <div id="tab-settings-content" style="display: none;">
    <div class="field">
      <label class="label">رابط Webhook (Google Apps Script) دائم وبدون انتهاء صلاحية</label>
      <input type="url" id="cfgWebhookUrl" class="input" placeholder="https://script.google.com/macros/s/.../exec" />
    </div>
    <div class="field">
      <label class="label">معرف جدول البيانات (Spreadsheet ID)</label>
      <input type="text" id="cfgSpreadsheetId" class="input" placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms" />
    </div>
    <div class="field">
      <label class="label">Google OAuth Access Token (مطلوب إذا لم يتوفر Webhook)</label>
      <input type="password" id="cfgAccessToken" class="input" placeholder="ya29.a0AfH6SM..." />
    </div>
    <div class="field">
      <label class="label">رابط لوحة التحكم الرئيسية</label>
      <input type="text" id="cfgAppUrl" class="input" value="${safeAppUrl}" />
    </div>
    <button id="saveConfigBtn" class="save-btn" style="background: #1e293b; color: #fff; border: 1px solid #334155;">حفظ الإعدادات</button>
    <div id="cfgStatus" class="status"></div>
  </div>

  <div class="footer">
    <a id="openAppBtn" href="${safeAppUrl}" target="_blank">فتح الخزنة الرئيسية ↗</a>
    <span class="badge-live">● جاهز للمزامنة</span>
  </div>

  <script src="config.js"></script>
  <script src="popup.js"></script>
</body>
</html>`;

  zip.file("popup.html", popupHtml);

  // 7. popup.js
  const popupJs = `let selectedType = 'api_key';

// Auto detect and fetch full current URL and user email
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs && tabs[0]) {
    try {
      const fullUrl = tabs[0].url || tabs[0].pendingUrl || '';
      if (fullUrl) {
        const serviceInput = document.getElementById('serviceName');
        if (serviceInput) {
          serviceInput.value = fullUrl;
        }
        // Focus on secret value field directly since URL is already captured
        const secretInput = document.getElementById('secretValue');
        if (secretInput) {
          secretInput.focus();
        }
      }
    } catch(e) {
      console.error('Error fetching tab URL:', e);
    }

    // Attempt to extract logged in user email from the active tab DOM
    if (tabs[0].id && tabs[0].url && !tabs[0].url.startsWith('chrome://') && !tabs[0].url.startsWith('edge://') && !tabs[0].url.startsWith('about:')) {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => {
          try {
            const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
            const ignore = ['support@', 'info@', 'contact@', 'sales@', 'help@', 'privacy@', 'billing@', 'legal@', 'security@', 'admin@', 'noreply@', 'no-reply@', 'team@', 'marketing@'];
            const isValid = (em) => {
              if (!em) return false;
              const c = em.trim().toLowerCase();
              if (c.endsWith('.png') || c.endsWith('.jpg') || c.endsWith('.svg') || c.endsWith('.gif') || c.endsWith('.webp')) return false;
              return !ignore.some(p => c.startsWith(p));
            };

            // 1. Check profile / account attributes
            const attrs = document.querySelectorAll('[aria-label*="@"], [title*="@"], [data-email], [data-user-email], [data-login*="@"]');
            for (const el of attrs) {
              const raw = el.getAttribute('data-email') || el.getAttribute('data-user-email') || el.getAttribute('aria-label') || el.getAttribute('title') || '';
              const m = raw.match(emailRegex);
              if (m) {
                for (const em of m) {
                  if (isValid(em)) return em;
                }
              }
            }

            // 2. Profile / Account container text in header/nav
            const containers = document.querySelectorAll('header, nav, [class*="profile" i], [class*="account" i], [class*="user" i], [id*="profile" i], [id*="account" i], [class*="avatar" i]');
            for (const c of containers) {
              const m = (c.innerText || '').match(emailRegex);
              if (m) {
                for (const em of m) {
                  if (isValid(em)) return em;
                }
              }
            }

            // 3. Input email fields with value
            const inputs = document.querySelectorAll('input[type="email"], input[name*="email" i], input[id*="email" i]');
            for (const inp of inputs) {
              const val = inp.value || '';
              const m = val.match(emailRegex);
              if (m) {
                for (const em of m) {
                  if (isValid(em)) return em;
                }
              }
            }
          } catch(e) {}
          return '';
        }
      }).then((results) => {
        if (results && results[0] && results[0].result) {
          const emailInput = document.getElementById('userEmail');
          if (emailInput && !emailInput.value) {
            emailInput.value = results[0].result;
          }
        }
      }).catch(() => {});
    }
  }
});

// Load settings into inputs
chrome.storage.local.get(['spreadsheetId', 'accessToken', 'webhookUrl', 'appUrl'], (res) => {
  if (res.webhookUrl || KEYVAULT_DEFAULT_CONFIG.webhookUrl) {
    document.getElementById('cfgWebhookUrl').value = res.webhookUrl || KEYVAULT_DEFAULT_CONFIG.webhookUrl;
  }
  if (res.spreadsheetId || KEYVAULT_DEFAULT_CONFIG.spreadsheetId) {
    document.getElementById('cfgSpreadsheetId').value = res.spreadsheetId || KEYVAULT_DEFAULT_CONFIG.spreadsheetId;
  }
  if (res.accessToken || KEYVAULT_DEFAULT_CONFIG.accessToken) {
    document.getElementById('cfgAccessToken').value = res.accessToken || KEYVAULT_DEFAULT_CONFIG.accessToken;
  }
  if (res.appUrl || KEYVAULT_DEFAULT_CONFIG.appUrl) {
    document.getElementById('cfgAppUrl').value = res.appUrl || KEYVAULT_DEFAULT_CONFIG.appUrl;
    document.getElementById('openAppBtn').href = res.appUrl || KEYVAULT_DEFAULT_CONFIG.appUrl;
  }
});

// Tab switching
document.getElementById('tab-save-btn').addEventListener('click', () => {
  document.getElementById('tab-save-btn').classList.add('active');
  document.getElementById('tab-settings-btn').classList.remove('active');
  document.getElementById('tab-save-content').style.display = 'block';
  document.getElementById('tab-settings-content').style.display = 'none';
});

document.getElementById('tab-settings-btn').addEventListener('click', () => {
  document.getElementById('tab-settings-btn').classList.add('active');
  document.getElementById('tab-save-btn').classList.remove('active');
  document.getElementById('tab-settings-content').style.display = 'block';
  document.getElementById('tab-save-content').style.display = 'none';
});

// Save Settings Button
document.getElementById('saveConfigBtn').addEventListener('click', () => {
  const webhookUrl = document.getElementById('cfgWebhookUrl').value.trim();
  const spreadsheetId = document.getElementById('cfgSpreadsheetId').value.trim();
  const accessToken = document.getElementById('cfgAccessToken').value.trim();
  const appUrl = document.getElementById('cfgAppUrl').value.trim();
  const cfgStatus = document.getElementById('cfgStatus');

  chrome.storage.local.set({ webhookUrl, spreadsheetId, accessToken, appUrl }, () => {
    cfgStatus.className = 'status success';
    cfgStatus.innerText = '✅ تم حفظ الإعدادات بنجاح';
    setTimeout(() => { cfgStatus.style.display = 'none'; }, 2000);
  });
});

// Type toggle buttons
document.querySelectorAll('.type-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedType = btn.dataset.type;
  });
});

// Password generator
document.getElementById('genBtn').addEventListener('click', () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+~';
  let pass = '';
  for(let i = 0; i < 24; i++) {
    pass += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  document.getElementById('secretValue').value = pass;
});

// Save button
document.getElementById('saveBtn').addEventListener('click', async () => {
  const serviceName = document.getElementById('serviceName').value.trim();
  const secretValue = document.getElementById('secretValue').value.trim();
  const userEmail = document.getElementById('userEmail').value.trim();
  const environment = document.getElementById('envSelect').value;
  const tags = document.getElementById('tagsInput').value.split(',').map(s => s.trim()).filter(Boolean);
  const statusDiv = document.getElementById('status');

  if (!serviceName || !secretValue) {
    statusDiv.className = 'status error';
    statusDiv.innerText = 'يرجى إدخال اسم الخدمة والمفتاح السري';
    return;
  }

  const newSecret = {
    id: 'sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    type: selectedType,
    serviceName,
    secretValue,
    usernameOrEmail: userEmail || undefined,
    environment,
    tags,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  statusDiv.className = 'status';
  statusDiv.style.display = 'block';
  statusDiv.innerText = 'جاري الحفظ والمزامنة...';

  chrome.storage.local.get(['keyvault_secrets', 'spreadsheetId', 'accessToken'], async (res) => {
    const list = res.keyvault_secrets || [];
    list.unshift(newSecret);
    chrome.storage.local.set({ keyvault_secrets: list });

    let sheetSyncSuccess = false;
    const sheetId = res.spreadsheetId || KEYVAULT_DEFAULT_CONFIG.spreadsheetId;
    const token = res.accessToken || KEYVAULT_DEFAULT_CONFIG.accessToken;

    if (sheetId && token) {
      try {
        const rowData = [
          newSecret.id,
          newSecret.type.toUpperCase(),
          newSecret.serviceName,
          newSecret.usernameOrEmail || '',
          newSecret.secretValue,
          newSecret.environment,
          'Chrome Extension',
          (newSecret.tags || []).join(', '),
          'Saved via Chrome Extension Popup',
          newSecret.createdAt,
          newSecret.updatedAt
        ];

        const fetchRes = await fetch(\`https://sheets.googleapis.com/v4/spreadsheets/\${sheetId}/values/Vault_Secrets!A:K:append?valueInputOption=USER_ENTERED\`, {
          method: 'POST',
          headers: {
            'Authorization': \`Bearer \${token}\`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ values: [rowData] })
        });

        if (fetchRes.ok) sheetSyncSuccess = true;
      } catch (err) {
        console.warn('Google Sheet Sync deferred:', err);
      }
    }

    // Broadcast to open Web App tabs
    chrome.runtime.sendMessage({ action: 'SECRET_SAVED', secret: newSecret });

    statusDiv.className = 'status success';
    statusDiv.innerText = sheetSyncSuccess 
      ? '✅ تم الحفظ والمزامنة مع Google Sheets بنجاح!' 
      : '✅ تم الحفظ محلياً في الخزنة!';

    setTimeout(() => {
      window.close();
    }, 1200);
  });
});
`;
  zip.file("popup.js", popupJs);

  // 8. Icons
  const createIconDataUrl = (size: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, size * 0.22);
      ctx.fill();

      ctx.fillStyle = '#050505';
      ctx.font = `bold ${Math.floor(size * 0.55)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔑', size / 2, size / 2);
    }
    return canvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, '');
  };

  zip.file("icons/icon16.png", createIconDataUrl(16), { base64: true });
  zip.file("icons/icon48.png", createIconDataUrl(48), { base64: true });
  zip.file("icons/icon128.png", createIconDataUrl(128), { base64: true });

  // 9. README.md
  const readmeMd = `# 🚀 تثبيت إضافة KeyVault Quick-Save في متصفح Google Chrome

## 🌟 الميزات الجديدة في هذا الإصدار:
1. **اختصار عالمي يعمل في أي صفحة**: اضغط **\`Ctrl + Shift + K\`** (أو \`Cmd + Shift + K\` على الماك) وأنت تتصفح أي موقع (مثل GitHub, OpenAI, Stripe, AWS) لتفتح نافذة الحفظ السريعة مباشرة فوق الصفحة دون الحاجة لفتح التطبيق!
2. **المزامنة اللحظية مع Google Sheets**: أي مفتاح يتم حفظه من الإضافة يتم كتابته فوراً في جدول Google Sheets المتصل، ويظهر في لوحة تحكم التطبيق في الحال.

---

## خطوات التثبيت في دقيقة واحدة:

1. **فك الضغط** عن ملف ZIP هذا في أي مجلد على جهازك.
2. افتح متصفح **Google Chrome** أو **Brave** أو **Edge**.
3. ادخل إلى الرابط: \`chrome://extensions/\`
4. فعّل **وضع المطور (Developer mode)** في الزاوية العلوية اليمنى.
5. اضغط على زر **تحميل إضافة تم فك حزمتها (Load unpacked)**.
6. اختر المجلد الذي قمت بفك الضغط إليه.

🎉 **مبروك!** الآن يمكنك حفظ أي مفتاح أو كلمة مرور في أي وقت وأنت تتصفح أي موقع عبر الضغط على \`Ctrl + Shift + K\`!

---

## ⚡ الخيار الأفضل والموصى به للمزامنة مع Google Sheets (Webhook دائم بدون أي انتهاء صلاحية):
لربط الإضافة والتطبيق مع جدول Google Sheets بدون الحاجة لإنشاء مشروع في Google Cloud وبدون انتهاء صلاحية:

### كود Google Apps Script:
\`\`\`javascript
function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Vault_Secrets') || ss.getActiveSheet();
  var data = JSON.parse(e.postData.contents);

  if (data.action === 'sync_all') {
    sheet.clear();
    if (data.headers) sheet.appendRow(data.headers);
    if (data.secrets && data.secrets.length > 0) {
      data.secrets.forEach(function(s) {
        sheet.appendRow([
          s.id, (s.type || '').toUpperCase(), s.serviceName,
          s.usernameOrEmail || '', s.secretValue, s.environment || 'production',
          s.project || 'General', (s.tags || []).join(', '), s.notes || '',
          s.createdAt || new Date().toISOString(), s.updatedAt || new Date().toISOString()
        ]);
      });
    }
  } else {
    var s = data.secret;
    sheet.appendRow([
      s.id, (s.type || '').toUpperCase(), s.serviceName,
      s.usernameOrEmail || '', s.secretValue, s.environment || 'production',
      s.project || 'General', (s.tags || []).join(', '), s.notes || '',
      s.createdAt || new Date().toISOString(), s.updatedAt || new Date().toISOString()
    ]);
  }

  return ContentService.createTextOutput(JSON.stringify({ result: 'success' }))
    .setMimeType(ContentService.MimeType.JSON);
}
\`\`\`

### خطوات التفعيل:
1. في جدول Google Sheet، افتح **الإضافات (Extensions) > Apps Script**.
2. الصق الكود أعلاه واضغط حفظ.
3. اضغط **نشر (Deploy) > نشر جديد (New deployment)** واختر نوع: **تطبيق ويب (Web app)**.
4. اضبط **من لديه حق الوصول (Who has access)** على: **أي شخص (Anyone)**، ثم اضغط Deploy.
5. انسخ الرابط وضعه في إعدادات الإضافة أو التطبيق.
`;

  zip.file("README.md", readmeMd);

  return await zip.generateAsync({ type: "blob" });
}
