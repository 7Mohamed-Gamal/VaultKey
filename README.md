# 🔐 KeyVault & API Sync - إدارة ومزامنة المفاتيح وكلمات المرور

تطبيق ويب حديث ومتطور لإدارة مفاتيح الـ API، كلمات المرور، المتغيرات البيئية (`.env`)، والمفاتيح السرية مع دعم المزامنة اللحظية مع جداول بيانات جوجل (**Google Sheets**) وتوليد حزمة إضافة متصفح **Google Chrome** الجاهزة للتثبيت.

---

## ✨ المميزات الرئيسية (Features)

1. **الالتقاط السريع (Quick Capture)**:
   - نافذة منبثقة سريعة واختصار عالمي `Ctrl + Shift + K` (أو `Cmd + Shift + K` على Mac).
   - قوالب جاهزة (Presets) لأشهر الخدمات مثل: OpenAI, Stripe, GitHub, Supabase, Google, AWS وغيرها.
2. **المزامنة اللحظية مع Google Sheets**:
   - إمكانية إنشاء جدول تلقائي جديد أو الربط بجدول قائم عبر الـ `Spreadsheet ID`.
   - مزامنة آلية لجميع الإضافات والتعديلات والحذف.
3. **الاستيراد والتصدير المتعدد (Import & Export)**:
   - استيراد ملفات `.env` أو جداول `CSV` من جهازك أو باللصق المباشر مع معاينة فورية.
   - تصدير بضغطة زر إلى `.env` و `CSV` و `JSON`.
4. **تعديل وإدارة السجلات (Full Vault Management)**:
   - بحث فوري، فلترة حسب البيئة (`Production`, `Staging`, `Development`) أو نوع المفتاح.
   - تعديل كافة الحقول مع الحفظ الفوري.
5. **مولد كلمات المرور المتقدم (Password Generator)**:
   - خيارات تخصيص متعددة ومقياس أمان ونقل مباشر لكلمة المرور إلى نافذة الحفظ.
6. **حزمة إضافة المتصفح (Chrome Extension Package)**:
   - تنزيل ملف `.ZIP` يحتوي على إضافة Chrome جاهزة (Manifest V3) تعمل في متصفحك.
7. **واجهة مستخدم احترافية بالكامل**:
   - تصميم داكن فائق الأناقة (Dark Charcoal & Emerald).
   - دعم كامل للغتين **العربية (RTL)** و **الإنجليزية (LTR)**.

---

## 💻 متطلبات التشغيل على نظام ويندوز (System Requirements)

- **نظام التشغيل**: Windows 10 أو Windows 11 (64-bit)
- **Node.js**: الإصدار `18.x` أو `20.x` أو أحدث (يُفضل تحميل نسخة LTS من [nodejs.org](https://nodejs.org/))
- **npm**: يأتي تلقائياً مع Node.js (أو استخدام `yarn` / `pnpm`)
- **متصفح حديث**: Google Chrome / Microsoft Edge / Brave / Firefox

---

## 🚀 خطوات التشغيل السريع على جهازك (Windows Setup)

### 1. فك ضغط المشروع
قم بفك ضغط المجلد الذي تم تحميله إلى أي مكان على جهازك (مثلاً: `C:\Projects\KeyVault`).

### 2. فتح موجه الأوامر (Terminal / PowerShell)
- افتح المجلد في **VS Code** واضغط `Ctrl + ~` لفتح الـ Terminal الداخلي.
- أو افتح **PowerShell / CMD** وانتقل إلى مسار المجلد:
  ```powershell
  cd C:\Projects\KeyVault
  ```

### 3. تثبيت الحزم والمكتبات (Dependencies)
قم بتشغيل الأمر التالي:
```bash
npm install
```

### 4. تشغيل السيرفر المحلي في وضع التطوير (Development Mode)
قم بتشغيل الأمر التالي:
```bash
npm run dev
```

### 5. فتح التطبيق
افتح المتصفح وتوجه إلى العنوان المحلي المطبوع في الـ Terminal:
```
http://localhost:3000
```
(أو `http://localhost:5173` إذا قمت بتغيير المنفذ في الإعدادات).

---

## 🛠️ الأوامر المتاحة في المشروع (Available Scripts)

| الأمر | الوصف |
| :--- | :--- |
| `npm run dev` | تشغيل سيرفر التطوير المحلي مع خاصية التحديث الفوري |
| `npm run build` | بناء المشروع وتجهيز ملفات الإنتاج داخل مجلد `dist/` |
| `npm run preview` | معاينة نسخة الإنتاج المبنية محلياً |
| `npm run lint` | فحص الأكواد والتحقق من سلامة أنواع TypeScript |

---

## 📊 ربط ومزامنة Google Sheets (Google Sheets Integration)

### ⚡ الخيار الأفضل والموصى به (Webhook دائم بدون أي انتهاء صلاحية):
هذا الخيار هو الأسهل والأسرع؛ لا يتطلب إنشاء مشروع في Google Cloud Console، ولا تنتهي صلاحيته بعد 60 دقيقة، ويعمل 24/7 للمزامنة المباشرة من التطبيق والإضافة.

#### كود Google Apps Script:
```javascript
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
```

#### خطوات التفعيل في دقيقة واحدة:
1. افتح جدول **Google Sheet** الخاص بك.
2. من القائمة العلوية اضغط على **الإضافات (Extensions) > Apps Script**.
3. احذف أي كود موجود والصق الكود أعلاه واضغط على زر الحفظ (أيقونة القرص 💾).
4. اضغط على زر **نشر (Deploy) > نشر جديد (New deployment)**.
5. اختر نوع النشر: **تطبيق ويب (Web app)**.
6. في إعدادات النشر:
   - **تنفيذ باسم (Execute as)**: `حسابي (Me)`
   - **من لديه حق الوصول (Who has access)**: **أي شخص (Anyone)**
7. اضغط **نشر (Deploy)** ثم انسخ **رابط تطبيق الويب (Web app URL)**.
8. في تطبيق KeyVault، اضغط على **تفعيل مزامنة Google Sheets**، والصق الرابط في تبويب **Webhook دائم** واضغط حفظ.

## 🐳 التشغيل باستخدام Docker (Docker Run)

لتشغيل المشروع كحاوية معزولة فائقة السرعة بضغطة زر:
```bash
docker compose up -d --build
```
ثم افتح: `http://localhost:3000`  
(راجع ملف `DOCKER_GUIDE.md` لمزيد من التفاصيل).

---

## 🧩 تثبيت إضافة Chrome محلياً في متصفحك

1. افتح التطبيق واضغط على زر **"إضافة Chrome"** من الشريط العلوي.
2. اضغط على **"تحميل الإضافة (.ZIP)"** لحفظ الحزمة.
3. فك ضغط ملف الـ ZIP في مجلد على جهازك.
4. في متصفح Chrome أو Edge، اذهب إلى: `chrome://extensions/`
5. فعّل **وضع المطور (Developer Mode)** في الزاوية العلوية.
6. اضغط على **"تحميل إضافة تم فك حزمتها (Load Unpacked)"** واختر المجلد المفكوك.
7. مبروك! أصبحت إضافة الحفظ السريع مثبتة في متصفحك.

---

## 📄 الترخيص والدعم
تم تطوير المشروع ليكون أداة إنتاجية مفتوحة وسريعة لإدارة أسرارك البرمجية بأعلى درجات الأمان والخصوصية.
جميع البيانات تُحفظ محلياً على جهازك ومزامنة اختيارية مشفرة في حساب Google الخاص بك.
