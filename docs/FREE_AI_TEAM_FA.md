# حالت رایگان و تیم تخصصی We0

این شاخه یک لایه AI orchestration برای تبدیل We0 به محیط توسعه چندعاملی اضافه می‌کند.

## قابلیت‌های پیاده‌سازی‌شده

- رابط کاربری فارسی با حفظ گرافیک موجود.
- کشف پویا و انتخاب مدل‌های رایگان OpenRouter و مدل‌های رایگان Zhipu.
- provider سفارشی OpenAI-compatible برای endpointهای قانونی و قابل‌دسترسی.
- Model Router و capability profile برای انتخاب مدل متناسب با کار.
- Agent Swarm با نقش‌های معماری، UI/UX، کدنویسی، تحلیل، bug hunting، debug، QA، امنیت، build، deploy، سازگاری و localization.
- Team Leader / Adversarial Reviewer برای جمع‌بندی و رفع تناقض‌ها.
- Project Intelligence: تحلیل فایل‌ها، import/export، entrypoint، hotspot و context pack.
- Autopilot plan و Self-Healing Loop.
- Approval/Risk Policy برای جلوگیری از اجرای ناخواسته عملیات حساس.
- Patch validation primitives برای کنترل تغییرات فایل.
- Git Intelligence و release gate.
- Provider health checks و telemetry پایه.
- Project Memory با fallback حافظه داخلی و persistence اختیاری MongoDB.
- Skill registry و APIهای orchestration موجود قبلی.
- قرارداد Realtime Voice فارسی: VAD، streaming، interruption و auto language detection؛ اتصال واقعی STT/TTS باید توسط provider runtime پیکربندی شود.
- Browser Agent safety policy برای URL/action validation و درخواست تأیید برای عملیات حساس.

## APIهای اصلی

- `/api/model` — مدل‌های قابل استفاده
- `/api/team` — اجرای تیم تخصصی
- `/api/ai/capabilities` — capability و Model Router
- `/api/ai/intelligence` — Project Intelligence
- `/api/ai/autopilot` — orchestration و plan
- `/api/ai/approval` — approval plan
- `/api/ai/providers` — health check providerها
- `/api/ai/memory` — حافظه پروژه
- `/api/ai/observability` — traceها
- `/api/ai/benchmark` — Arena/benchmark
- `/api/ai/skills` — registry مهارت‌ها
- `/api/ai/git` — Git summary و release gate
- `/api/ai/voice` — voice session contract

## پیکربندی

```env
OPENROUTER_API_KEY=
ZHIPU_API_KEY=
CUSTOM_AI_BASE_URL=
CUSTOM_AI_API_KEY=
CUSTOM_AI_MODELS=
MONGODB_URI=
MONGODB_DB=
```

## محدودیت فنی مهم

Autopilot فعلی «برنامه‌ریزی، تحلیل، اجرای agentها و تولید خروجی» را انجام می‌دهد؛ اعمال مستقیم فایل‌ها، اجرای shell، screenshot-based visual QA، browser automation و deployment واقعی باید به executor موجود در runtime/desktop متصل شوند. این تفکیک عمدی است تا API وب به‌تنهایی مجوز اجرای عملیات محلی یا مخرب نداشته باشد.

## رایگان بودن و دسترسی منطقه‌ای

رایگان بودن مدل به معنی نامحدود بودن سرویس‌دهنده نیست و محدودیت نرخ/ظرفیت ارائه‌دهنده باقی می‌ماند. پروژه paywall یا محدودیت شخص ثالث را دور نمی‌زند. همچنین کد VPN را اجباری نمی‌کند، اما هیچ نرم‌افزاری نمی‌تواند دسترسی شبکه‌ای از داخل ایران را برای همه ISPها و همه زمان‌ها تضمین کند.
