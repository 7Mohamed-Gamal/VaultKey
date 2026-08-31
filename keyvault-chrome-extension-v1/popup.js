let selectedType = 'api_key';

// Auto detect current tab domain
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs && tabs[0] && tabs[0].url) {
    try {
      const url = new URL(tabs[0].url);
      const domain = url.hostname.replace('www.', '');
      const parts = domain.split('.');
      if (parts.length > 0 && parts[0]) {
        const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        document.getElementById('serviceName').value = name;
      }
    } catch(e) {}
  }
});

// Load settings into inputs
chrome.storage.local.get(['spreadsheetId', 'accessToken', 'appUrl'], (res) => {
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
  const spreadsheetId = document.getElementById('cfgSpreadsheetId').value.trim();
  const accessToken = document.getElementById('cfgAccessToken').value.trim();
  const appUrl = document.getElementById('cfgAppUrl').value.trim();
  const cfgStatus = document.getElementById('cfgStatus');

  chrome.storage.local.set({ spreadsheetId, accessToken, appUrl }, () => {
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

        const fetchRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Vault_Secrets!A:K:append?valueInputOption=USER_ENTERED`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
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
