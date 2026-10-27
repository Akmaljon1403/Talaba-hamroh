import fs from 'fs';

const clinicalBases = [
  {
    id: 1,
    name: "Respublika ixtisoslashtirilgan ona va bola salomatligi ilmiy amaliy tibbiyot markazi Farg'ona viloyati filiali",
    department: "Akusherlik va ginekologiya",
    head: "Suyarqulova Madxiya Erkinovna",
    phone: "90-581-47-46",
    totalRooms: 7,
    totalCapacity: 194,
    rooms: [
      { roomNumber: "1", type: "Amaliy", capacity: 20 },
      { roomNumber: "2", type: "Amaliy", capacity: 16 },
      { roomNumber: "3", type: "Amaliy", capacity: 16 },
      { roomNumber: "4", type: "Amaliy", capacity: 16 },
      { roomNumber: "5", type: "Ma'ruza", capacity: 50 },
      { roomNumber: "6", type: "Ma'ruza", capacity: 60 },
      { roomNumber: "7", type: "Amaliy", capacity: 16 }
    ]
  },
  {
    id: 2,
    name: "Farg'ona shahar 3-Oilaviy poliklinika (Ichki kasalliklar)",
    department: "Ichki kasalliklar propedevtikasi",
    head: "Kattaxanova Robiya Yo'ldashevna",
    phone: "91-206-95-30",
    totalRooms: 6,
    totalCapacity: 72,
    rooms: [
      { roomNumber: "1", type: "Amaliy", capacity: 12 },
      { roomNumber: "2", type: "Amaliy", capacity: 12 },
      { roomNumber: "3", type: "Amaliy", capacity: 12 },
      { roomNumber: "4", type: "Amaliy", capacity: 12 },
      { roomNumber: "5", type: "Amaliy", capacity: 12 },
      { roomNumber: "6", type: "Amaliy", capacity: 12 }
    ]
  },
  {
    id: 3,
    name: "Farg'ona shahar 3-Oilaviy poliklinika (Terapiya)",
    department: "Terapiya yo'nalishidagi fanlar (UASH)",
    head: "Shamsutdinova Guzel Baxodirovna",
    phone: "90-786-00-66",
    totalRooms: 6,
    totalCapacity: 96,
    rooms: [
      { roomNumber: "1", type: "Amaliy", capacity: 16 },
      { roomNumber: "2", type: "Amaliy", capacity: 16 },
      { roomNumber: "3", type: "Amaliy", capacity: 16 },
      { roomNumber: "4", type: "Amaliy", capacity: 16 },
      { roomNumber: "5", type: "Amaliy", capacity: 16 },
      { roomNumber: "6", type: "Amaliy", capacity: 16 }
    ]
  },
  {
    id: 4,
    name: "Respublika shoshilinch tez yordam ilmiy markazi Farg'ona filiali",
    department: "Gospital terapiya",
    head: "Mahmudov Nurillo Ismoilovich",
    phone: "90-562-11-11",
    totalRooms: 9,
    totalCapacity: 188,
    rooms: [
      { roomNumber: "1", type: "Amaliy", capacity: 16 },
      { roomNumber: "2", type: "Amaliy", capacity: 16 },
      { roomNumber: "3", type: "Amaliy", capacity: 16 },
      { roomNumber: "4", type: "Amaliy", capacity: 16 },
      { roomNumber: "5", type: "Amaliy", capacity: 16 },
      { roomNumber: "6", type: "Amaliy", capacity: 16 },
      { roomNumber: "7", type: "Amaliy", capacity: 16 },
      { roomNumber: "8", type: "Amaliy", capacity: 16 },
      { roomNumber: "9", type: "Ma'ruza", capacity: 60 }
    ]
  },
  {
    id: 5,
    name: "Farg'ona viloyat ko'p tarmoqli tibbiyot markazi (Travmatologiya)",
    department: "Travmatologiya va ortopediya",
    head: "Xaydarov Azizjon Kosimovich",
    phone: "90-927-60-66",
    totalRooms: 3,
    totalCapacity: 54,
    rooms: [
      { roomNumber: "1", type: "Amaliy", capacity: 18 },
      { roomNumber: "2", type: "Amaliy", capacity: 18 },
      { roomNumber: "3", type: "Amaliy", capacity: 18 }
    ]
  },
  {
    id: 6,
    name: "Farg'ona viloyat ko'p tarmoqli tibbiyot markazi (konsultativ poliklinikasi 4-qavat)",
    department: "Stomatologiya va otorinolaringologiya",
    head: "Umarov Odiljon Maxmudovich",
    phone: "90-562-34-68",
    totalRooms: 7,
    totalCapacity: 169,
    rooms: [
      { roomNumber: "310", type: "Amaliy", capacity: 15 },
      { roomNumber: "410", type: "Amaliy", capacity: 32 },
      { roomNumber: "411", type: "Amaliy", capacity: 20 },
      { roomNumber: "412", type: "Amaliy", capacity: 12 },
      { roomNumber: "416", type: "Amaliy", capacity: 15 },
      { roomNumber: "417", type: "Amaliy", capacity: 15 },
      { roomNumber: "418", type: "Ma'ruza", capacity: 60 }
    ]
  },
  {
    id: 7,
    name: "Farg'ona viloyati davlat ixtiyoridagi stomatologik poliklinika",
    department: "Stomatologiya va otorinolaringologiya",
    head: "Umarov Odiljon Maxmudovich",
    phone: "90-562-34-68",
    totalRooms: 3,
    totalCapacity: 53,
    rooms: [
      { roomNumber: "Raqamsiz (1)", type: "Amaliy", capacity: 14 },
      { roomNumber: "Raqamsiz (2)", type: "Amaliy", capacity: 14 },
      { roomNumber: "Raqamsiz (3)", type: "Amaliy", capacity: 25 }
    ]
  },
  {
    id: 8,
    name: "Premium xususiy klinikasi",
    department: "Klinik amaliyot",
    head: null,
    phone: null,
    totalRooms: 1,
    totalCapacity: 15,
    rooms: [{ roomNumber: "1", type: "Amaliy", capacity: 15 }]
  },
  {
    id: 9,
    name: "Invivo xususiy klinikasi",
    department: "Klinik amaliyot",
    head: null,
    phone: null,
    totalRooms: 1,
    totalCapacity: 15,
    rooms: [{ roomNumber: "1", type: "Amaliy", capacity: 15 }]
  },
  {
    id: 10,
    name: "Madad-shifo xususiy klinikasi",
    department: "Klinik amaliyot",
    head: null,
    phone: null,
    totalRooms: 1,
    totalCapacity: 15,
    rooms: [{ roomNumber: "1", type: "Amaliy", capacity: 15 }]
  },
  {
    id: 11,
    name: "Ziyodil-shifo xususiy klinikasi",
    department: "Klinik amaliyot",
    head: null,
    phone: null,
    totalRooms: 2,
    totalCapacity: 30,
    rooms: [
      { roomNumber: "1", type: "Amaliy", capacity: 15 },
      { roomNumber: "2", type: "Amaliy", capacity: 15 }
    ]
  },
  {
    id: 12,
    name: "FJSTI klinik bazasi (2-qavati va reanimatsiyasi)",
    department: "Ko'p tarmoqli jarrohlik va terapiya",
    head: "Shamsutdinova G. / Muradimova A. / Fattaxov N. / Saydaliyev S.",
    phone: "90-786-00-66 / 91-608-42-89",
    totalRooms: 7,
    totalCapacity: 112,
    rooms: [
      { roomNumber: "2-qavat (Terapiya)", type: "Amaliy", capacity: 16 },
      { roomNumber: "2-qavat (Nevrologiya 1)", type: "Amaliy", capacity: 16 },
      { roomNumber: "2-qavat (Nevrologiya 2)", type: "Amaliy", capacity: 16 },
      { roomNumber: "Reanimatsiya (Pediatriya)", type: "Amaliy", capacity: 16 },
      { roomNumber: "2-qavat (Gospital jarrohlik)", type: "Amaliy", capacity: 16 },
      { roomNumber: "2-qavat (Umumiy jarrohlik 1)", type: "Amaliy", capacity: 16 },
      { roomNumber: "2-qavat (Umumiy jarrohlik 2)", type: "Amaliy", capacity: 16 }
    ]
  },
  {
    id: 13,
    name: "Farovon klinikasi",
    department: "Endokrinologiya, Pediatriya 2, Urologiya, Terapiya",
    head: "Karimova M. (94-135-75-55) / Axmadaliyev Sh. (90-563-30-06)",
    phone: "94-135-75-55",
    totalRooms: 5,
    totalCapacity: 78,
    rooms: [
      { roomNumber: "6", type: "Amaliy", capacity: 16, department: "Endokrinologiya, gematologiya va ftiziatriya" },
      { roomNumber: "Klinika podvali", type: "Ma'ruza", capacity: 16, department: "Pediatriya 2" },
      { roomNumber: "Raqamsiz (Urologiya 1)", type: "Amaliy", capacity: 10, department: "Urologiya va onkologiya" },
      { roomNumber: "Raqamsiz (Urologiya 2)", type: "Amaliy", capacity: 20, department: "Urologiya va onkologiya" },
      { roomNumber: "Raqamsiz (Terapiya)", type: "Amaliy", capacity: 16, department: "Terapiya yo'nalishidagi fanlar (UASH)" }
    ]
  },
  {
    id: 14,
    name: "Uromed klinikasi",
    department: "Urologiya va onkologiya",
    head: "Yuldashov Fayzulla Yuldashevich",
    phone: "90-277-00-89",
    totalRooms: 5,
    totalCapacity: 65,
    rooms: [
      { roomNumber: "1-qavat 1/1", type: "Amaliy", capacity: 10 },
      { roomNumber: "1-qavat 1/2", type: "Amaliy", capacity: 10 },
      { roomNumber: "3-qavat 3/3", type: "Amaliy", capacity: 10 },
      { roomNumber: "3-qavat 3/4", type: "Amaliy", capacity: 10 },
      { roomNumber: "3-qavat 3/5", type: "Ma'ruza", capacity: 25 }
    ]
  },
  {
    id: 15,
    name: "Viloyat urologiya markazining 1 va 3-qavatlari",
    department: "Urologiya",
    head: "Yuldashov Fayzulla Yuldashevich",
    phone: "90-277-00-89",
    totalRooms: 3,
    totalCapacity: 64,
    rooms: [
      { roomNumber: "1-qavat (Amaliy 1)", type: "Amaliy", capacity: 12 },
      { roomNumber: "1-qavat (Amaliy 2)", type: "Amaliy", capacity: 12 },
      { roomNumber: "3-qavat (Ma'ruza)", type: "Ma'ruza", capacity: 40 }
    ]
  },
  {
    id: 16,
    name: "Ibn Sino klinikasi",
    department: "Terapiya yo'nalishidagi fanlar (UASH)",
    head: "Shamsutdinova Guzel Baxodirovna",
    phone: "90-786-00-66",
    totalRooms: 1,
    totalCapacity: 16,
    rooms: [{ roomNumber: "3", type: "Amaliy", capacity: 16 }]
  },
  {
    id: 17,
    name: "Yuqumli kasalliklar shifoxonasi",
    department: "Epidemiologiya, Mikrobiologiya, Xalq tabobati",
    head: "Boltaboyev U. / Rasulov F. / Xoliqova O.",
    phone: "90-659-23-60 / 91-283-39-58 / 91-650-19-73",
    totalRooms: 29,
    totalCapacity: 551,
    rooms: [
      // Epidemiologiya
      { roomNumber: "101", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "102", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "103", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "104", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "105", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "117", type: "Ma'ruza", capacity: 45, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "201", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "202", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "203", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "204", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "205", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "206", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "207", type: "Amaliy", capacity: 16, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      { roomNumber: "219", type: "Ma'ruza", capacity: 45, department: "Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi" },
      // Mikrobiologiya
      { roomNumber: "106", type: "Amaliy", capacity: 16, department: "Mikrobiologiya, virusologiya va immunologiya" },
      { roomNumber: "107", type: "Amaliy", capacity: 16, department: "Mikrobiologiya, virusologiya va immunologiya" },
      { roomNumber: "108", type: "Amaliy", capacity: 16, department: "Mikrobiologiya, virusologiya va immunologiya" },
      { roomNumber: "109", type: "Ma'ruza", capacity: 45, department: "Mikrobiologiya, virusologiya va immunologiya" },
      { roomNumber: "110", type: "Amaliy", capacity: 16, department: "Mikrobiologiya, virusologiya va immunologiya" },
      { roomNumber: "111", type: "Amaliy", capacity: 16, department: "Mikrobiologiya, virusologiya va immunologiya" },
      { roomNumber: "112", type: "Amaliy", capacity: 16, department: "Mikrobiologiya, virusologiya va immunologiya" },
      // Xalq tabobati va farmakologiya
      { roomNumber: "208", type: "Amaliy", capacity: 16, department: "Xalq tabobati va farmakologiya" },
      { roomNumber: "209", type: "Amaliy", capacity: 16, department: "Xalq tabobati va farmakologiya" },
      { roomNumber: "210", type: "Amaliy", capacity: 16, department: "Xalq tabobati va farmakologiya" },
      { roomNumber: "211", type: "Amaliy", capacity: 16, department: "Xalq tabobati va farmakologiya" },
      { roomNumber: "212", type: "Amaliy", capacity: 16, department: "Xalq tabobati va farmakologiya" },
      { roomNumber: "214", type: "Amaliy", capacity: 16, department: "Xalq tabobati va farmakologiya" },
      { roomNumber: "215", type: "Amaliy", capacity: 16, department: "Xalq tabobati va farmakologiya" },
      { roomNumber: "218", type: "Amaliy", capacity: 16, department: "Xalq tabobati va farmakologiya" }
    ]
  },
  {
    id: 18,
    name: "Respublika ixtisoslashtirilgan ruhiy salomatlik ilmiy amaliy tibbiyot markazi Farg'ona viloyati filiali",
    department: "Nevrologiya va psixiatriya",
    head: "Muradimova Alfiya Rashidovna",
    phone: "91-608-42-89",
    totalRooms: 4,
    totalCapacity: 144,
    rooms: [
      { roomNumber: "Raqamsiz (1)", type: "Amaliy", capacity: 18 },
      { roomNumber: "Raqamsiz (2)", type: "Amaliy", capacity: 18 },
      { roomNumber: "Raqamsiz (3)", type: "Amaliy", capacity: 18 },
      { roomNumber: "Faollar zali", type: "Ma'ruza", capacity: 90 }
    ]
  },
  {
    id: 19,
    name: "Neuro Care Klinik klinikasi",
    department: "Nevrologiya",
    head: null,
    phone: null,
    totalRooms: 2,
    totalCapacity: 32,
    rooms: [
      { roomNumber: "Raqamsiz (1)", type: "Amaliy", capacity: 16 },
      { roomNumber: "Raqamsiz (2)", type: "Amaliy", capacity: 16 }
    ]
  },
  {
    id: 20,
    name: "Viloyat bolalar ko'p tarmoqli tibbiyot markazining 2 va 3-qavatlari",
    department: "Pediatriya",
    head: "Shermatov Rasuljon Mamasiddiqovich",
    phone: "99-605-77-08",
    totalRooms: 7,
    totalCapacity: 130,
    rooms: [
      { roomNumber: "201", type: "Amaliy", capacity: 16 },
      { roomNumber: "202", type: "Amaliy", capacity: 40 },
      { roomNumber: "203", type: "Amaliy", capacity: 10 },
      { roomNumber: "301", type: "Amaliy", capacity: 16 },
      { roomNumber: "302", type: "Amaliy", capacity: 16 },
      { roomNumber: "303", type: "Amaliy", capacity: 16 },
      { roomNumber: "304", type: "Amaliy", capacity: 16 }
    ]
  },
  {
    id: 21,
    name: "Farg'ona shahar bolalar shifoxonasining 1 va 2-binolari",
    department: "Pediatriya 2",
    head: "Axmadaliyev Shoxrux Shuxratovich",
    phone: "90-563-30-06",
    totalRooms: 8,
    totalCapacity: 128,
    rooms: [
      { roomNumber: "1", type: "Amaliy", capacity: 16 },
      { roomNumber: "2", type: "Amaliy", capacity: 16 },
      { roomNumber: "3", type: "Amaliy", capacity: 16 },
      { roomNumber: "4", type: "Amaliy", capacity: 16 },
      { roomNumber: "5", type: "Amaliy", capacity: 16 },
      { roomNumber: "6", type: "Amaliy", capacity: 16 },
      { roomNumber: "7", type: "Amaliy", capacity: 16 },
      { roomNumber: "8", type: "Amaliy", capacity: 16 }
    ]
  },
  {
    id: 22,
    name: "Farg'ona viloyati teri-tanosil dispanseri (1-qavat)",
    department: "Dermatovenerologiya va allergologiya",
    head: "Sidikov Akmal Abdikaxarovich",
    phone: "73-245-59-07",
    totalRooms: 1,
    totalCapacity: 16,
    rooms: [{ roomNumber: "1-qavat", type: "Amaliy", capacity: 16 }]
  },
  {
    id: 23,
    name: "Viloyat endokrinologiya dispanseri",
    department: "Endokrinologiya",
    head: null,
    phone: null,
    totalRooms: 1,
    totalCapacity: 16,
    rooms: [{ roomNumber: "1", type: "Amaliy", capacity: 16 }]
  },
  {
    id: 24,
    name: "Obi-hayot klinikasi",
    department: "Klinik amaliyot",
    head: null,
    phone: null,
    totalRooms: 1,
    totalCapacity: 16,
    rooms: [{ roomNumber: "2", type: "Amaliy", capacity: 16 }]
  },
  {
    id: 25,
    name: "Nodir shifo klinikasi",
    department: "Endokrinologiya, gematologiya va ftiziatriya",
    head: "Karimova Muqimaxon Muhamadsodiqovna",
    phone: "90-533-09-49",
    totalRooms: 1,
    totalCapacity: 16,
    rooms: [{ roomNumber: "5", type: "Amaliy", capacity: 16 }]
  },
  {
    id: 26,
    name: "Farmed xususiy klinikasi",
    department: "Klinik amaliyot",
    head: null,
    phone: null,
    totalRooms: 2,
    totalCapacity: 32,
    rooms: [
      { roomNumber: "7", type: "Amaliy", capacity: 16 },
      { roomNumber: "8", type: "Amaliy", capacity: 16 }
    ]
  },
  {
    id: 27,
    name: "Doctor Fatxullo klinikasi",
    department: "Klinik amaliyot",
    head: null,
    phone: null,
    totalRooms: 1,
    totalCapacity: 16,
    rooms: [{ roomNumber: "1", type: "Amaliy", capacity: 16 }]
  },
  {
    id: 28,
    name: "Farg'ona tibbiy diagnostikasi",
    department: "Stomatologiya va otorinolaringologiya",
    head: "Umarov Odiljon Maxmudovich",
    phone: "90-562-34-68",
    totalRooms: 3,
    totalCapacity: 42,
    rooms: [
      { roomNumber: "3", type: "Amaliy", capacity: 16 },
      { roomNumber: "4", type: "Amaliy", capacity: 16 },
      { roomNumber: "9", type: "Amaliy", capacity: 10 }
    ]
  }
];

const totalRooms = clinicalBases.reduce((acc, b) => acc + b.rooms.length, 0);
const totalCapacity = clinicalBases.reduce((acc, b) => acc + b.rooms.reduce((rAcc, r) => rAcc + r.capacity, 0), 0);
console.log('Total clinical bases:', clinicalBases.length);
console.log('Total rooms:', totalRooms);
console.log('Total capacity:', totalCapacity);

fs.writeFileSync('src/data/verified_rooms.json', JSON.stringify(clinicalBases, null, 2), 'utf-8');
console.log('Wrote verified rooms to src/data/verified_rooms.json');
