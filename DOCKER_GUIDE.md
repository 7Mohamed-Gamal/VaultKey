# 🐳 دليل تشغيل المشروع بواسطة Docker (Docker Guide)

يوضح هذا الدليل كيفية تشغيل تطبيق **KeyVault & API Sync** محلياً داخل حاوية Docker معزولة وسريعة.

---

## 📋 المتطلبات المسبقة
- تثبيت **Docker Desktop** على نظامك (Windows / macOS / Linux).
- التأكد من تشغيل Docker Desktop قبل تنفيذ الأوامر.

---

## 🚀 الخيار 1: التشغيل السريع باستخدام Docker Compose (الموصى به)

افتح موجه الأوامر (CMD / PowerShell / Terminal) في مجلد المشروع ونفّذ الأمر التالي:

```bash
docker compose up -d --build
```

- سيقوم هذا الأمر ببناء الصورة وتشغيل الحاوية في الخلفية.
- افتح المتصفح وتوجه إلى:
  ```
  http://localhost:3000
  ```

### لإيقاف الحاوية:
```bash
docker compose down
```

---

## 🛠️ الخيار 2: التشغيل اليدوي باستخدام Docker CLI

### 1. بناء صورة Docker (Build Image):
```bash
docker build -t keyvault-app .
```

### 2. تشغيل الحاوية (Run Container):
```bash
docker run -d -p 3000:3000 --name keyvault-container keyvault-app
```

### 3. إيقاف وإزالة الحاوية عند الحاجة:
```bash
docker stop keyvault-container
docker rm keyvault-container
```

---

## 🌟 مميزات إعداد Docker المدمج:
1. **Multi-Stage Build**: استخدام تقنية البناء متعدد المراحل (Node 20 Alpine للبناء ثم Nginx Alpine فائق السرعة للتشغيل) لتقليل حجم الصورة لأقل من 30MB فقط.
2. **SPA Routing**: ضبط Nginx مع دعم كامل لمسارات تطبيقات الصفحة الواحدة (Single Page Application).
3. **Gzip & Security Headers**: تفعيل ضغط الملفات وعناوين الحماية بشكل افتراضي.
