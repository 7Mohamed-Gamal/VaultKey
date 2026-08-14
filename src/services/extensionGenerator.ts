import JSZip from 'jszip';

export async function generateChromeExtensionZip(config: {
  appUrl: string;
  spreadsheetId?: string | null;
  spreadsheetUrl?: string | null;
}): Promise<Blob> {
  const zip = new JSZip();

  // 1. Manifest V3
  const manifest = {
    manifest_version: 3,
    name: "KeyVault & API Quick-Save",
    version: "1.0.0",
    description: "Quickly capture and save API keys, secrets, and passwords directly to Google Sheets with Ctrl+Shift+K shortcut.",
    permissions: [
      "storage",
      "activeTab",
      "clipboardWrite"
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
        description: "Open KeyVault Quick Capture"
      }
    },
    icons: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  };

  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  // 2. popup.html
  const popupHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>KeyVault Quick Save</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Cairo', sans-serif; }
    body { width: 360px; background: #0f172a; color: #f8fafc; padding: 16px; direction: rtl; }
    .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #334155; }
    .title { font-size: 14px; font-weight: 700; color: #6366f1; display: flex; align-items: center; gap: 6px; }
    .types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px; }
    .type-btn { background: #1e293b; border: 1px solid #334155; color: #94a3b8; padding: 6px 4px; border-radius: 6px; font-size: 11px; cursor: pointer; text-align: center; font-weight: 600; }
    .type-btn.active { background: #4f46e5; border-color: #6366f1; color: #fff; }
    .field { margin-bottom: 10px; }
    .label { font-size: 11px; color: #94a3b8; margin-bottom: 4px; display: block; }
    .input { width: 100%; background: #1e293b; border: 1px solid #334155; border-radius: 6px; color: #fff; padding: 8px 10px; font-size: 12px; outline: none; }
    .input:focus { border-color: #6366f1; }
    .secret-wrap { position: relative; }
    .gen-btn { position: absolute; left: 6px; top: 6px; background: #334155; border: none; color: #cbd5e1; font-size: 10px; padding: 2px 6px; border-radius: 4px; cursor: pointer; }
    .save-btn { width: 100%; background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff; border: none; padding: 10px; border-radius: 6px; font-weight: 700; font-size: 13px; cursor: pointer; margin-top: 6px; transition: opacity 0.2s; }
    .save-btn:hover { opacity: 0.9; }
    .status { margin-top: 8px; font-size: 11px; text-align: center; display: none; padding: 6px; border-radius: 4px; }
    .status.success { display: block; background: #064e3b; color: #6ee7b7; }
    .status.error { display: block; background: #7f1d1d; color: #fca5a5; }
    .footer { margin-top: 12px; text-align: center; font-size: 10px; color: #64748b; }
    .footer a { color: #818cf8; text-decoration: none; }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">🔑 KeyVault Quick Save</div>
    <span style="font-size: 10px; background: #1e293b; padding: 2px 6px; border-radius: 4px; color: #94a3b8;">Ctrl+Shift+K</span>
  </div>

  <div class="types">
    <button class="type-btn active" data-type="api_key">API Key</button>
    <button class="type-btn" data-type="password">كلمة مرور</button>
    <button class="type-btn" data-type="token">Token / سر</button>
  </div>

  <div class="field">
    <label class="label">اسم الخدمة / الموقع</label>
    <input type="text" id="serviceName" class="input" placeholder="مثال: OpenAI, Stripe, AWS..." />
  </div>

  <div class="field">
    <label class="label">المفتاح / القيمة السرية</label>
    <div class="secret-wrap">
      <input type="text" id="secretValue" class="input" placeholder="sk-... أو كلمة المرور" />
      <button type="button" id="genBtn" class="gen-btn">توليد كلمة سر</button>
    </div>
  </div>

  <div class="field">
    <label class="label">الحساب / البريد (اختياري)</label>
    <input type="text" id="userEmail" class="input" placeholder="dev@example.com" />
  </div>

  <div class="field">
    <label class="label">البيئة والوسوم</label>
    <div style="display: flex; gap: 6px;">
      <select id="envSelect" class="input" style="width: 50%;">
        <option value="production">Production</option>
        <option value="staging">Staging</option>
        <option value="development">Development</option>
      </select>
      <input type="text" id="tagsInput" class="input" placeholder="وسوم: AI, Prod" style="width: 50%;" />
    </div>
  </div>

  <button id="saveBtn" class="save-btn">💾 حفظ ومزامنة إلى Google Sheets</button>
  <div id="status" class="status"></div>

  <div class="footer">
    <a href="${config.appUrl}" target="_blank">فتح لوحة التحكم الكاملة ↗</a>
  </div>

  <script src="popup.js"></script>
</body>
</html>`;

  zip.file("popup.html", popupHtml);

  // 3. popup.js
  const popupJs = `let selectedType = 'api_key';

// Auto detect current tab domain
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs && tabs[0] && tabs[0].url) {
    try {
      const url = new URL(tabs[0].url);
      const domain = url.hostname.replace('www.', '');
      const parts = domain.split('.');
      if (parts.length > 1) {
        const name = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        document.getElementById('serviceName').value = name;
      }
    } catch(e) {}
  }
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
  for(let i=0; i<20; i++) {
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
    id: 'sec_' + Date.now(),
    type: selectedType,
    serviceName,
    secretValue,
    usernameOrEmail: userEmail,
    environment,
    tags,
    createdAt: new Date().toISOString()
  };

  // Save to Chrome local storage
  chrome.storage.local.get(['keyvault_secrets'], (res) => {
    const list = res.keyvault_secrets || [];
    list.unshift(newSecret);
    chrome.storage.local.set({ keyvault_secrets: list }, () => {
      statusDiv.className = 'status success';
      statusDiv.innerText = '✅ تم الحفظ بنجاح وجاهز للمزامنة مع Google Sheets!';
      setTimeout(() => {
        window.close();
      }, 1200);
    });
  });
});
`;

  zip.file("popup.js", popupJs);

  // 4. background.js
  const backgroundJs = `chrome.runtime.onInstalled.addListener(() => {
  console.log('KeyVault Extension installed successfully');
});

// Shortcut command listener
chrome.commands.onCommand.addListener((command) => {
  if (command === '_execute_action') {
    // Action will be automatically executed by Chrome
  }
});
`;

  zip.file("background.js", backgroundJs);

  // 5. Create basic icons folder with Canvas-drawn icons
  const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 2-2 2m-1.5 1.5L10 13l-4 4-2-2 4-4 7.5-7.5M15.5 7.5l3 3M11 12l2 2m-5 1 2 2"/><circle cx="7.5" cy="16.5" r="3.5"/></svg>`;
  zip.file("icons/icon.svg", iconSvg);

  // Helper canvas base64 png for Chrome manifest icons
  const createIconDataUrl = (size: number): string => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#4f46e5';
      ctx.beginPath();
      ctx.roundRect(0, 0, size, size, size * 0.2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
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

  // 6. README.md
  const readmeMd = `# 🚀 تثبيت إضافة KeyVault Quick-Save في متصفح جوجل كروم

## خطوات التثبيت في دقيقة واحدة:

1. **فك الضغط** عن ملف ZIP هذا في أي مجلد على جهازك.
2. افتح متصفح **Google Chrome** أو **Brave** أو **Edge**.
3. ادخل إلى الرابط: \`chrome://extensions/\`
4. فعّل **وضع المطور (Developer mode)** في الزاوية العلوية اليمنى.
5. اضغط على زر **تحميل إضافة تم فك حزمتها (Load unpacked)**.
6. اختر المجلد الذي قمت بفك الضغط إليه.

🎉 **مبروك!** الآن كلما كنت تتصفح أي موقع وتريد حفظ مفتاح API أو كلمة مرور:
- اضغط على الاختصار: **\`Ctrl + Shift + K\`** (أو \`Cmd + Shift + K\` على الماك)
- ستفتح لك نافذة سريعة لحفظ المفتاح فوراً ومزامنته مع Google Sheets!

---
رابط تطبيق الويب المتصل: ${config.appUrl}
`;

  zip.file("README.md", readmeMd);

  return await zip.generateAsync({ type: "blob" });
}
