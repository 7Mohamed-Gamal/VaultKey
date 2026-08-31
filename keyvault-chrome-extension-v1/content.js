// KeyVault In-Page Content Script
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

  // Auto-detect service from domain
  let detectedName = '';
  try {
    const domain = window.location.hostname.replace('www.', '');
    const parts = domain.split('.');
    if (parts.length > 0 && parts[0]) {
      detectedName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    }
  } catch(e) {}

  const host = document.createElement('div');
  host.id = 'keyvault-overlay-host';

  host.innerHTML = `
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
          <label class="kv-label">اسم الخدمة / المنصة</label>
          <input type="text" id="kv-serviceName" class="kv-input rtl-text" value="${detectedName}" placeholder="مثال: OpenAI, GitHub, Stripe..." />
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
            <input type="text" id="kv-userEmail" class="kv-input" placeholder="dev@example.com" />
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
  `;

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
    if (detectedName) {
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

          const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Vault_Secrets!A:K:append?valueInputOption=USER_ENTERED`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
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
