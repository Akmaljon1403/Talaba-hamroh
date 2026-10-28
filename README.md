# 🏛 FJSTI Talaba Hamrohi — Telegram Bot

**Farg‘ona jamoat salomatligi tibbiyot instituti (FJSTI)** talabalari, abituriyentlar va professor-o‘qituvchilar uchun institut haqidagi barcha rasmiy, tekshirilgan va zarur ma’lumotlarni Telegram orqali 24/7 tezkor, sodda va ishonchli taqdim etuvchi professional Telegram bot.

Loyiha **Render Background Worker** (Telegram Long Polling) va **Neon PostgreSQL** bulutli ma’lumotlar bazasi arxitekturasida ishlab chiqilgan.

---

## 📌 Asosiy Xususiyatlar va Imkoniyatlar

1. **🏛 Institut haqida:**
   - Rektorat, rahbariyat, qabul vaqtlari va rasmiy kontaktlar;
   - Fakultetlar (Davolash, Pediatriya, Tibbiy profilaktika va jamoat salomatligi, Xalqaro fakultet) va ta’lim yo‘nalishlari;
   - Rasmiy manbalar: [fjsti.uz](https://fjsti.uz), HEMIS, ARM kutubxona, Moodle.

2. **📍 Manzil va Auditoriyalar Fondi (100% Tasdiqlangan):**
   - Institutga biriktirilgan **28 ta klinik baza** va tibbiyot muassasalari;
   - **120+ ta o‘quv auditoriyasi** (Amaliy va Ma’ruza xonalari, umumiy sig‘imi 2300+ talaba o‘rni);
   - Xona raqamlari, qavatlar, biriktirilgan kafedra mudirlari va mas’ul telefon raqamlari.

3. **👨‍🏫 Kafedralar va O‘qituvchilar:**
   - 29 ta bakalavriat va magistratura kafedralari to‘liq ro‘yxati;
   - Rasmiy buyruq asosida kafedralarga biriktirilgan barcha fanlar ro‘yxati (kurs va semestrlar bo‘yicha);
   - O‘qituvchilar va kafedra mudirlari bo‘yicha qidiruv.

4. **📅 O‘quv Jarayoni Grafigi (2026/2027 o‘quv yili):**
   - 1-kursdan 6-kursgacha barcha kunduzgi bakalavriat yo‘nalishlari bo‘yicha tasdiqlangan jadval;
   - Nazariy ta’lim, attestatsiyalar, malakaviy amaliyot, kredit tizimiga kirish, ta’tillar, GPA hisoblash va Yakuniy Davlat attestatsiyalari haftalari soni.

5. **📚 Elektron Kutubxona va ARM:**
   - Kurslar va fanlar kesimida darsliklar va o‘quv materiallari;
   - Axborot-resurs markazining rasmiy elektron bazasi havolalari ([library.fjsti.uz](https://library.fjsti.uz));
   - Mualliflik huquqlariga qat’iy rioya qilingan holda faqat rasmiy ochiq manbalar.

6. **💡 Talaba Xizmatlari va Yo‘riqnomalar:**
   - HEMIS talaba axborot tizimidan foydalanish yo‘riqnomasi;
   - Kredit-modul (ECTS) tizimi qoidalari va GPA hisoblash tartibi;
   - To‘lov-kontrakt shartnomasini olish va ta’lim krediti tartibi;
   - Davlat, bazaviy va nomdor (Prezident, Ibn Sino, Navoiy) stipendiyalari;
   - Yotoqxona (TTJ) uchun my.gov.uz orqali ariza topshirish tartibi;
   - O‘qish joyidan QR-kodli rasmiy ma’lumotnoma (spravka) olish.

7. **🔍 Universal Aqlli Qidiruv:**
   - O‘zbek tili lotin va kirill alifbolari (sh/sh, ch/ch, o‘/o', g‘/g') imlosiga chidamli qidiruv;
   - Fan, kafedra, mudir, auditoriya raqami yoki shifoxona nomi bo‘yicha ko‘p tarmoqli izlash;
   - Javobi topilmagan savollarni avtomatik tarzda `unanswered_questions` jadvaliga qayd etish.

8. **⚙️ Telegram Ichidagi To‘liq Admin Boshqaruvi:**
   - Server tomonda qat’iy Telegram ID tekshiruvi;
   - **📊 Statistika:** Talabalar soni, so‘nggi 7 kundagi faol foydalanuvchilar, eng ko‘p izlangan so‘rovlar va eng mashhur bo‘limlar;
   - **❓ Javobsiz so‘rovlar:** Talabalar topa olmagan so‘rovlarni ko‘rish va «Hal qilindi» deb belgilash;
   - **💬 Fikrlar:** Foydalanuvchilar qoldirgan mulohaza va takliflarni o‘qish;
   - **📢 E’lon tarqatish (Broadcast):** Barcha talabalarga bitta xabar orqali muhim e’lonlarni yetkazish;
   - **➕ Kontent qo‘shish:** Yangi kitob va o‘qituvchilarni Telegram ichidan to‘g‘ridan-to‘g‘ri qo‘shish.
   - **✏️ Ma’lumotlarni tahrirlash:** Fakultetlar, kafedralar, fanlar, klinik bazalar, auditoriyalar, o‘quv jadvali, o‘qituvchilar, kitoblar va talaba xizmatlarining mavjud yozuvlarini admin panelidan maydonma-maydon yangilash.
   - **💾 Tahrirlarni saqlash:** Boshlang‘ich rasmiy ma’lumotlar birinchi seed vaqtida yuklanadi; keyingi ishga tushishlarda admin kiritgan tahrirlar eski JSON qiymatlari bilan avtomatik ustidan yozilmaydi.

---

## 🏗 Arxitektura va Texnologiyalar

- **Dasturlash tili va platforma:** Node.js (v18+) ES Modules
- **Telegram Bot Framework:** [grammY](https://grammy.dev/) (zamonaviy, yuqori tezlikdagi bot freymvorki)
- **Ma’lumotlar bazasi:** [Neon PostgreSQL](https://neon.tech/) (Serverless Postgres with SSL)
- **Database Client:** `pg` (node-postgres) bilan connection pooling
- **Hosting / Deploy:** [Render](https://render.com/) — **Background Worker** (24/7 uzluksiz long polling, veb-server porti talab qilinmaydi)
- **Avtomatlashtirilgan testlar:** Node.js native test runner (`node --test`)

---

## 📁 Loyiha Strukturasi

```
fjsti-talaba-hamroh/
├── src/
│   ├── config/
│   │   └── env.js                 # Muhit o'zgaruvchilari tekshiruvi va admin huquqlari
│   ├── db/
│   │   ├── pool.js                # Neon PostgreSQL pool va SSL aloqa
│   │   ├── schema.sql             # SQL sxema (jadvallar va indekslar)
│   │   ├── migrate.js             # Avtomatik tranzaksiyali migratsiya
│   │   ├── seed.js                # Rasmiy PDF/TXT ma'lumotlarini bazaga yuklash
│   │   └── queries/               # Modulli SQL so'rovlar
│   │       ├── users.js
│   │       ├── faculties.js
│   │       ├── departments.js
│   │       ├── subjects.js
│   │       ├── teachers.js
│   │       ├── locations.js
│   │       ├── rooms.js
│   │       ├── books.js
│   │       ├── academicCalendar.js
│   │       ├── studentServices.js
│   │       ├── announcements.js
│   │       ├── feedback.js
│   │       ├── unanswered.js
│   │       └── stats.js
│   ├── bot/
│   │   ├── index.js               # grammY boti va barcha marshrutlar
│   │   ├── middlewares/           # Auth, logging va xatoliklar ushlagichi
│   │   ├── keyboards/             # Reply va Inline tugmalar
│   │   ├── handlers/              # Har bir bo'lim ishlovchilari
│   │   └── utils/                 # Lotin/Kirill normalizatsiya va formatlash
│   ├── data/                      # 100% Tasdiqlangan JSON ma'lumotlar
│   │   ├── verified_departments.json
│   │   ├── verified_rooms.json
│   │   ├── verified_calendar.json
│   │   ├── verified_institute.json
│   │   └── verified_services.json
│   └── index.js                   # Asosiy ishga tushirish fayli
├── tests/                         # Avtomatlashtirilgan unit/integratsiya testlari
│   ├── normalize.test.js
│   ├── formatters.test.js
│   ├── config.test.js
│   └── data_integrity.test.js
├── render.yaml                    # Render avtomatlashtirish konfiguratsiyasi
├── .env.example                   # Muhit o'zgaruvchilari namunasi
├── .gitignore
├── package.json
└── README.md
```

---

## 🛠 Mahalliy O‘rnatish va Ishga Tushirish

### 1. Repository'ni klonlash:
```bash
git clone https://github.com/Akmaljon1403/Talaba-hamroh.git
cd Talaba-hamroh
```

### 2. Bog‘liqliklarni o‘rnatish:
```bash
npm install
```

### 3. `.env` faylini yaratish:
`.env.example` faylidan nusxa olib `.env` yarating:
```bash
cp .env.example .env
```

Fayl ichidagi qiymatlarni to‘ldiring:
```env
BOT_TOKEN=telegram_bot_token_bu_yerda
DATABASE_URL=postgresql://neondb_owner:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require
ADMIN_TELEGRAM_IDS=123456789,987654321
NODE_ENV=development
```

### 4. Testlarni ishga tushirish:
```bash
npm test
```
*Barcha 15 ta unit va ma’lumotlar yaxlitligi testlari muvaffaqiyatli o‘tadi.*

### 5. Ma’lumotlar bazasini tayyorlash (Migrate & Seed):
```bash
npm run migrate
npm run seed
```
*Baza yaratiladi va tasdiqlangan barcha kafedralar, auditoriyalar, fanlar va o‘quv jadvali avtomatik yuklanadi.*

### 6. Botni ishga tushirish:
```bash
npm start
```
Yoki o‘zgarishlarni kuzatib boruvchi dev rejimida:
```bash
npm run dev
```

---

## 🐘 Neon PostgreSQL Bazasini Sozlash

1. [Neon.tech](https://neon.tech/) saytiga kiring va bepul hisob oching.
2. Yangi loyiha (Project) yarating: masalan, `fjsti-talaba-db`.
3. Dashboard’da berilgan **Connection string** (Postgres URL) nusxasini oling.
   - Shakli: `postgresql://username:password@ep-xyz.eu-central-1.aws.neon.tech/neondb?sslmode=require`
4. Ushbu havolani Render yoki mahalliy muhitda `DATABASE_URL` sifatida ko‘rsating.
5. Bot ishga tushganda dastur avtomatik ravishda jadvallarni yaratadi va ma’lumotlarni kiritadi (qo‘lda SQL yozish talab etilmaydi).

---

## 🚀 Render Platformasida Deploy Qilish (24/7 Background Worker)

Render platformasida botning to‘xtovsiz 24/7 ishlashi uchun **Background Worker** xizmat turi tanlanadi:

1. [Render.com](https://render.com/) boshqaruv paneliga kiring.
2. **New +** tugmasini bosing va **Background Worker** ni tanlang.
3. GitHub hisobingizdagi `Akmaljon1403/Talaba-hamroh` repository’sini tanlang.
4. Xizmat parametrlarini quyidagicha to‘ldiring:
   - **Name:** `fjsti-talaba-hamroh`
   - **Region:** `Frankfurt (EU Central)`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. **Environment Variables** (Muhit o‘zgaruvchilari) bo‘limiga quyidagilarni kiriting:
   - `BOT_TOKEN`: Telegram bot tokeni (@BotFather dan olingan)
   - `DATABASE_URL`: Neon PostgreSQL ulanish havolasi (`?sslmode=require` bilan)
   - `ADMIN_TELEGRAM_IDS`: Adminlarning Telegram ID raqamlari (vergul bilan)
   - `NODE_ENV`: `production`
6. **Create Background Worker** tugmasini bosing.

Render bir necha daqiqada botni yig‘adi, migratsiyalarni bajaradi va 24/7 uzluksiz long polling rejimida ishga tushiradi!

---

## 🔒 Xavfsizlik Qoidalari

- Hech qanday token, parol yoki maxfiy URL kod ichiga yozilmagan.
- `.env` fayli `.gitignore` orqali GitHub’ga chiqib ketishdan to‘liq himoyalangan.
- Barcha SQL so‘rovlar parametrlangan (`$1, $2, ...`) bo‘lib, SQL Injection hujumlariga yo‘l qo‘ymaydi.
- Admin amallarining har birida Telegram ID bo‘yicha server-side tekshiruv mavjud.
- Barcha Telegram HTML xabarlari maxsus `escapeHtml` yordamida himoyalangan.

---

## 📜 Rasmiy Manbalar va Tasdiqlangan Hujjatlar

Ushbu botdagi barcha ma’lumotlar quyidagi rasmiy manbalarga asoslangan:
1. **O‘zbekiston Respublikasi Sog‘liqni saqlash vazirligi** va institut rektori A.A. Sidikov tomonidan tasdiqlangan institut o‘quv rejalari;
2. **O‘quv ishlari bo‘yicha prorektor U.A. Boltaboyev** tasdiqlagan 2026/2027 o‘quv yili Bakalavriat o‘quv jarayoni grafigi;
3. Institutning **O‘quv auditoriyalar fondi rasmiy buyrug‘i** (28 ta tibbiyot bazasi, 120+ auditoriya);
4. Institutning rasmiy portali: [https://fjsti.uz](https://fjsti.uz).
