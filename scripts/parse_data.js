import fs from 'fs';
import path from 'path';

const txtPath = 'c:/Users/User/Downloads/Kafedralarga ajratilgan fanlar.txt';
const raw = fs.readFileSync(txtPath, 'utf-8');
const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('-----------------------'));

// Official mudirlar & contacts from "O'quv auditoriyalar fondi"
const officialDeptContacts = {
  'Akusherlik va ginekologiya': { head: 'Suyarqulova Madxiya Erkinovna', phone: '90-581-47-46' },
  'Ichki kasalliklar propedevtikasi': { head: 'Kattaxanova Robiya Yo\'ldashevna', phone: '91-206-95-30' },
  'Terapiya yo\'nalishidagi fanlar (UASH)': { head: 'Shamsutdinova Guzel Baxodirovna', phone: '90-786-00-66' },
  'Gospital terapiya': { head: 'Mahmudov Nurillo Ismoilovich', phone: '90-562-11-11' },
  'Travmatologiya va ortopediya': { head: 'Xaydarov Azizjon Kosimovich', phone: '90-927-60-66' },
  'Stomatologiya va otorinolaringologiya': { head: 'Umarov Odiljon Maxmudovich', phone: '90-562-34-68' },
  'Nevrologiya va psixiatriya': { head: 'Muradimova Alfiya Rashidovna', phone: '91-608-42-89' },
  'Pediatriya': { head: 'Shermatov Rasuljon Mamasiddiqovich', phone: '99-605-77-08' },
  'Pediatriya 2': { head: 'Axmadaliyev Shoxrux Shuxratovich', phone: '90-563-30-06' },
  'Fakultet va gospital jarrohlik': { head: 'Fattaxov Nusratullo Xamidullayevich', phone: '90-560-90-09' },
  'Umumiy jarrohlik': { head: 'Saydaliyev Sultangazi Satvoldiyevich', phone: '91-674-65-00' },
  'Endokrinologiya, gematologiya va ftiziatriya': { head: 'Karimova Muqimaxon Muxamadsadikovna', phone: '94-135-75-55' },
  'Urologiya va onkologiya': { head: 'Yuldashov Fayzulla Yuldashevich', phone: '90-277-00-88' },
  'Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi': { head: 'Boltaboyev Ulug\'bek Abdusalimovich', phone: '90-659-23-60' },
  'Mikrobiologiya, virusologiya va immunologiya': { head: 'Rasulov Fozil Hasanovich', phone: '91-283-39-58' },
  'Xalq tabobati va farmakologiya': { head: 'Xoliqova Oyista Yuldashevna', phone: '91-650-19-73' },
  'Dermatovenerologiya va allergologiya': { head: 'Sidikov Akmal Abdikaxarovich', phone: '73-245-59-07' }
};

// Department name canonical mapping / cleanups
function cleanDeptName(rawName) {
  let name = rawName
    .replace(/^(\d+[\.\s]+)+/, '')
    .replace(/\s+/g, ' ')
    .replace(/kafedrasi$/i, '')
    .replace(/[/\\$_\d\(\)\'\"j]+.*$/, '')
    .trim();
  
  if (name.includes('Kommunal va mehnat gigiyenasi')) return 'Kommunal va mehnat gigiyenasi';
  if (name.includes('Ovqatlanish, bolalar')) return 'Ovqatlanish, bolalar va o‘smirlar gigiyenasi';
  if (name.includes('Preventiv tibbiyot asoslari')) return 'Preventiv tibbiyot asoslari, jamoat salomatligi, jismoniy tarbiya va sport';
  if (name.includes('Epidemiologiya va yuqumli')) return 'Epidemiologiya va yuqumli kasalliklar, hamshiralik ishi';
  if (name.includes('Mikrobiologiya')) return 'Mikrobiologiya, virusologiya va immunologiya';
  if (name.includes('Xalq tabobati')) return 'Xalq tabobati va farmakologiya';
  if (name.includes('Biotibbiyot muhandisligi')) return 'Biotibbiyot muhandisligi, biofizika va axborot texnologiyalari';
  if (name.includes('Ichki kasalliklar propedevtikasi')) return 'Ichki kasalliklar propedevtikasi';
  if (name.includes('Terapiya yo‘nalishidagi fanlar') || name.includes('Terapiya yo\'nalishidagi fanlar')) return 'Terapiya yo‘nalishidagi fanlar (UASH)';
  if (name.includes('Travmatologiya')) return 'Travmatologiya va ortopediya';
  if (name.includes('Normal anatomiya')) return 'Normal anatomiya, operativ jarrohlik va topografik anatomiya';
  if (name.includes('Gospital terapiya')) return 'Gospital terapiya';
  if (name.includes('Umumiy jarohlik') || name.includes('Umumiy jarrohlik')) return 'Umumiy jarrohlik';
  if (name.includes('Fakultativ va gospital jarrohlik') || name.includes('Fakultet va gospital jarrohlik')) return 'Fakultet va gospital jarrohlik';
  if (name.includes('Akusherlik va ginekologiya')) return 'Akusherlik va ginekologiya';
  if (name.includes('Urologiya va onkologiya')) return 'Urologiya va onkologiya';
  if (name.includes('Nevrologiya va psixatriya') || name.includes('Nevrologiya va psixiatriya')) return 'Nevrologiya va psixiatriya';
  if (name.includes('Pediatriya 2')) return 'Pediatriya 2';
  if (name === 'Pediatriya' || name.startsWith('Pediatriya')) return 'Pediatriya';
  if (name.includes('Stomatologiya va otorinolaringologiya')) return 'Stomatologiya va otorinolaringologiya';
  if (name.includes('Dermatovenerologiva') || name.includes('Dermatovenerologiya')) return 'Dermatovenerologiya va allergologiya';
  if (name.includes('Endokrinologiya')) return 'Endokrinologiya, gematologiya va ftiziatriya';
  if (name.includes('0 ‘zbek va xorijiy tillar') || name.includes('zbek va xorijiy tillar')) return 'O‘zbek va xorijiy tillar';
  if (name.includes('Lotin')) return 'Lotin tili, pedagogika va psixologiya';
  if (name.includes('Tibbiy va biologik kimyo')) return 'Tibbiy va biologik kimyo';
  if (name.includes('Ijtimoiy fanlar')) return 'Ijtimoiy fanlar';
  if (name.includes('Gistologiya va biologiya')) return 'Gistologiya va biologiya';
  if (name.includes('Fiziologiya')) return 'Fiziologiya';
  if (name.includes('Patologik flziologiya') || name.includes('Patologik fiziologiya')) return 'Patologik fiziologiya va patologik anatomiya';

  return name;
}

const departments = [];
let currentDept = null;
let currentLevel = 'bakalavriat';

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('Magistratura bo\'limi') || line.includes('Magistratura bolimi')) {
    currentLevel = 'magistratura';
    continue;
  }
  if (line.includes('Fakultet dekanlariga:')) break;

  // Check if department heading
  const isDeptHeader = (/^\d+\.\s+/.test(line) || /^[A-Z0‘ʻ\'].*kafedrasi/i.test(line)) &&
    (line.toLowerCase().includes('kafedra') ||
     line.toLowerCase().includes('tillar') ||
     line.toLowerCase().includes('fanlar') ||
     line.toLowerCase().includes('kimyo') ||
     line.toLowerCase().includes('fiziologiya') ||
     line.toLowerCase().includes('anatomiya') ||
     line.toLowerCase().includes('pediatriya') ||
     line.toLowerCase().includes('terapiya') ||
     line.toLowerCase().includes('gigiyenasi') ||
     line.toLowerCase().includes('jarrohlik') ||
     line.toLowerCase().includes('jarohlik') ||
     line.toLowerCase().includes('ginekologiya') ||
     line.toLowerCase().includes('stomatologiya') ||
     line.toLowerCase().includes('onkologiya') ||
     line.toLowerCase().includes('psixatriya') ||
     line.toLowerCase().includes('psixiatriya') ||
     line.toLowerCase().includes('psixologiya') ||
     line.toLowerCase().includes('ftizatriya') ||
     line.toLowerCase().includes('biologiya') ||
     line.toLowerCase().includes('texnologiyalari') ||
     line.toLowerCase().includes('allergialogiya') ||
     line.toLowerCase().includes('allergologiya') ||
     line.toLowerCase().includes('farmakologiya'));

  if (isDeptHeader && !line.includes('O\'zbekiston') && !line.includes('BUYURAMAN')) {
    const rawName = line.replace(/^\d+\.\s+/, '').trim();
    const cleanName = cleanDeptName(rawName);
    
    // Find if already exists in this level
    let existing = departments.find(d => d.name === cleanName && d.level === currentLevel);
    if (!existing) {
      const contact = officialDeptContacts[cleanName] || {};
      existing = {
        name: cleanName,
        level: currentLevel,
        headName: contact.head || null,
        contactPhone: contact.phone || null,
        subjects: []
      };
      departments.push(existing);
    }
    currentDept = existing;
    continue;
  }

  // Parse subject lines
  // Standard format: `1  1  Subject Name  2-3  4/5` or `142 1 Ichki kasalliklar propdevtikasi 3 5/6`
  const singleLineMatch = line.match(/^(\d+)\s+(\d+)\s+(.+?)\s+(\d+(?:-\d+)*|\d+)\s+([\d\s\/]+)$/);
  if (singleLineMatch && currentDept) {
    const subjName = singleLineMatch[3].trim().replace(/\s+/g, ' ');
    const courses = singleLineMatch[4].trim();
    const semesters = singleLineMatch[5].trim().replace(/\s+/g, '');
    currentDept.subjects.push({
      name: subjName,
      courses,
      semesters,
      level: currentLevel
    });
    continue;
  }

  // Two-column or wrapped pattern: e.g. line has numbers and next line has course/sem
  const partialMatch = line.match(/^(\d+)\s+(\d+)\s+(.+)$/);
  if (partialMatch && currentDept && !/^\d+$/.test(partialMatch[3])) {
    let namePart = partialMatch[3].trim();
    // Look ahead to next lines for course & semester
    let courses = '';
    let semesters = '';
    
    // Check if courses & semesters are at the end of namePart
    const endMatch = namePart.match(/^(.+?)\s+(\d+(?:-\d+)*|\d+)\s+([\d\s\/]+)$/);
    if (endMatch) {
      currentDept.subjects.push({
        name: endMatch[1].trim(),
        courses: endMatch[2].trim(),
        semesters: endMatch[3].trim().replace(/\s+/g, ''),
        level: currentLevel
      });
      continue;
    }

    if (i + 1 < lines.length) {
      const nextLine = lines[i + 1];
      const nextMatch = nextLine.match(/^(.+?)\s+(\d+(?:-\d+)*|\d+)\s+([\d\s\/]+)$/);
      if (nextMatch && !/^\d+\s+\d+/.test(nextLine)) {
        namePart += ' ' + nextMatch[1].trim();
        courses = nextMatch[2].trim();
        semesters = nextMatch[3].trim().replace(/\s+/g, '');
        i++; // consumed next line
        currentDept.subjects.push({
          name: namePart.replace(/\s+/g, ' '),
          courses,
          semesters,
          level: currentLevel
        });
        continue;
      }
    }
  }
}

console.log('Total parsed departments:', departments.length);
const totalSubjects = departments.reduce((acc, d) => acc + d.subjects.length, 0);
console.log('Total parsed subjects:', totalSubjects);

const outPath = 'src/data/verified_departments.json';
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(departments, null, 2), 'utf-8');
console.log('Wrote verified departments to', outPath);
