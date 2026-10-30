export type Surah = {
  number: number;
  name: string;
  englishName: string;
  banglaName: string;
  englishMeaning: string;
  banglaMeaning: string;
  numberOfAyahs: number;
  revelationType: "Meccan" | "Medinan";
};

export type Ayah = {
  numberInSurah: number;
  textArabic: string;
  textBangla: string;
  audioUrl?: string;
};

export const SURAH_LIST: Surah[] = [
  {
    "number": 1,
    "name": "سُورَةُ ٱلْفَاتِحَةِ",
    "englishName": "Al-Faatiha",
    "banglaName": "সূরা আল-ফাতিহা",
    "englishMeaning": "The Opening",
    "banglaMeaning": "সূচনা",
    "numberOfAyahs": 7,
    "revelationType": "Meccan"
  },
  {
    "number": 2,
    "name": "سُورَةُ البَقَرَةِ",
    "englishName": "Al-Baqara",
    "banglaName": "সূরা আল-বাকারা",
    "englishMeaning": "The Cow",
    "banglaMeaning": "গাভী",
    "numberOfAyahs": 286,
    "revelationType": "Medinan"
  },
  {
    "number": 3,
    "name": "سُورَةُ آلِ عِمۡرَانَ",
    "englishName": "Aal-i-Imraan",
    "banglaName": "সূরা আলে ইমরান",
    "englishMeaning": "The Family of Imraan",
    "banglaMeaning": "ইমরানের পরিবার",
    "numberOfAyahs": 200,
    "revelationType": "Medinan"
  },
  {
    "number": 4,
    "name": "سُورَةُ النِّسَاءِ",
    "englishName": "An-Nisaa",
    "banglaName": "সূরা আন-নিসা",
    "englishMeaning": "The Women",
    "banglaMeaning": "নারী",
    "numberOfAyahs": 176,
    "revelationType": "Medinan"
  },
  {
    "number": 5,
    "name": "سُورَةُ المَائـِدَةِ",
    "englishName": "Al-Maaida",
    "banglaName": "সূরা আল-মায়েদা",
    "englishMeaning": "The Table",
    "banglaMeaning": "খাদ্য পরিবেশিত টেবিল",
    "numberOfAyahs": 120,
    "revelationType": "Medinan"
  },
  {
    "number": 6,
    "name": "سُورَةُ الأَنۡعَامِ",
    "englishName": "Al-An'aam",
    "banglaName": "সূরা আল-আনআম",
    "englishMeaning": "The Cattle",
    "banglaMeaning": "গৃহপালিত পশু",
    "numberOfAyahs": 165,
    "revelationType": "Meccan"
  },
  {
    "number": 7,
    "name": "سُورَةُ الأَعۡرَافِ",
    "englishName": "Al-A'raaf",
    "banglaName": "সূরা আল-আরাফ",
    "englishMeaning": "The Heights",
    "banglaMeaning": "উঁচু স্থানসমূহ",
    "numberOfAyahs": 206,
    "revelationType": "Meccan"
  },
  {
    "number": 8,
    "name": "سُورَةُ الأَنفَالِ",
    "englishName": "Al-Anfaal",
    "banglaName": "সূরা আল-আনফাল",
    "englishMeaning": "The Spoils of War",
    "banglaMeaning": "যুদ্ধলব্ধ সম্পদ",
    "numberOfAyahs": 75,
    "revelationType": "Medinan"
  },
  {
    "number": 9,
    "name": "سُورَةُ التَّوۡبَةِ",
    "englishName": "At-Tawba",
    "banglaName": "সূরা আত-তাওবাহ",
    "englishMeaning": "The Repentance",
    "banglaMeaning": "তওবা",
    "numberOfAyahs": 129,
    "revelationType": "Medinan"
  },
  {
    "number": 10,
    "name": "سُورَةُ يُونُسَ",
    "englishName": "Yunus",
    "banglaName": "সূরা ইউনুস",
    "englishMeaning": "Jonas",
    "banglaMeaning": "ইউনুস (আ.)",
    "numberOfAyahs": 109,
    "revelationType": "Meccan"
  },
  {
    "number": 11,
    "name": "سُورَةُ هُودٍ",
    "englishName": "Hud",
    "banglaName": "সূরা হূদ",
    "englishMeaning": "Hud",
    "banglaMeaning": "হূদ (আ.)",
    "numberOfAyahs": 123,
    "revelationType": "Meccan"
  },
  {
    "number": 12,
    "name": "سُورَةُ يُوسُفَ",
    "englishName": "Yusuf",
    "banglaName": "সূরা ইউসুফ",
    "englishMeaning": "Joseph",
    "banglaMeaning": "ইউসুফ (আ.)",
    "numberOfAyahs": 111,
    "revelationType": "Meccan"
  },
  {
    "number": 13,
    "name": "سُورَةُ الرَّعۡدِ",
    "englishName": "Ar-Ra'd",
    "banglaName": "সূরা আর-রাদ",
    "englishMeaning": "The Thunder",
    "banglaMeaning": "বজ্রধ্বনি",
    "numberOfAyahs": 43,
    "revelationType": "Medinan"
  },
  {
    "number": 14,
    "name": "سُورَةُ إِبۡرَاهِيمَ",
    "englishName": "Ibrahim",
    "banglaName": "সূরা ইব্রাহীম",
    "englishMeaning": "Abraham",
    "banglaMeaning": "ইবরাহীম (আ.)",
    "numberOfAyahs": 52,
    "revelationType": "Meccan"
  },
  {
    "number": 15,
    "name": "سُورَةُ الحِجۡرِ",
    "englishName": "Al-Hijr",
    "banglaName": "সূরা আল-হিজর",
    "englishMeaning": "The Rock",
    "banglaMeaning": "পাথুরে পাহাড়",
    "numberOfAyahs": 99,
    "revelationType": "Meccan"
  },
  {
    "number": 16,
    "name": "سُورَةُ النَّحۡلِ",
    "englishName": "An-Nahl",
    "banglaName": "সূরা আন-নাহল",
    "englishMeaning": "The Bee",
    "banglaMeaning": "মৌমাছি",
    "numberOfAyahs": 128,
    "revelationType": "Meccan"
  },
  {
    "number": 17,
    "name": "سُورَةُ الإِسۡرَاءِ",
    "englishName": "Al-Israa",
    "banglaName": "সূরা বনি ইসরাঈল",
    "englishMeaning": "The Night Journey",
    "banglaMeaning": "রাত্রিকালীন ভ্রমণ",
    "numberOfAyahs": 111,
    "revelationType": "Meccan"
  },
  {
    "number": 18,
    "name": "سُورَةُ الكَهۡفِ",
    "englishName": "Al-Kahf",
    "banglaName": "সূরা আল-কাহফ",
    "englishMeaning": "The Cave",
    "banglaMeaning": "গুহা",
    "numberOfAyahs": 110,
    "revelationType": "Meccan"
  },
  {
    "number": 19,
    "name": "سُورَةُ مَرۡيَمَ",
    "englishName": "Maryam",
    "banglaName": "সূরা মারইয়াম",
    "englishMeaning": "Mary",
    "banglaMeaning": "মারইয়াম (আ.)",
    "numberOfAyahs": 98,
    "revelationType": "Meccan"
  },
  {
    "number": 20,
    "name": "سُورَةُ طه",
    "englishName": "Taa-Haa",
    "banglaName": "সূরা ত্ব-হা",
    "englishMeaning": "Taa-Haa",
    "banglaMeaning": "ত্বা-হা",
    "numberOfAyahs": 135,
    "revelationType": "Meccan"
  },
  {
    "number": 21,
    "name": "سُورَةُ الأَنبِيَاءِ",
    "englishName": "Al-Anbiyaa",
    "banglaName": "সূরা আল-আম্বিয়া",
    "englishMeaning": "The Prophets",
    "banglaMeaning": "নবীগণ",
    "numberOfAyahs": 112,
    "revelationType": "Meccan"
  },
  {
    "number": 22,
    "name": "سُورَةُ الحَجِّ",
    "englishName": "Al-Hajj",
    "banglaName": "সূরা আল-হাজ্জ",
    "englishMeaning": "The Pilgrimage",
    "banglaMeaning": "হজ্জ",
    "numberOfAyahs": 78,
    "revelationType": "Medinan"
  },
  {
    "number": 23,
    "name": "سُورَةُ المُؤۡمِنُونَ",
    "englishName": "Al-Muminoon",
    "banglaName": "সূরা আল-মুমিনূন",
    "englishMeaning": "The Believers",
    "banglaMeaning": "মুমিনগণ",
    "numberOfAyahs": 118,
    "revelationType": "Meccan"
  },
  {
    "number": 24,
    "name": "سُورَةُ النُّورِ",
    "englishName": "An-Noor",
    "banglaName": "সূরা আন-নূর",
    "englishMeaning": "The Light",
    "banglaMeaning": "আলো",
    "numberOfAyahs": 64,
    "revelationType": "Medinan"
  },
  {
    "number": 25,
    "name": "سُورَةُ الفُرۡقَانِ",
    "englishName": "Al-Furqaan",
    "banglaName": "সূরা আল-ফুরকান",
    "englishMeaning": "The Criterion",
    "banglaMeaning": "সত্য-মিথ্যার পার্থক্যকারী",
    "numberOfAyahs": 77,
    "revelationType": "Meccan"
  },
  {
    "number": 26,
    "name": "سُورَةُ الشُّعَرَاءِ",
    "englishName": "Ash-Shu'araa",
    "banglaName": "সূরা আশ-শুআরা",
    "englishMeaning": "The Poets",
    "banglaMeaning": "কবিগণ",
    "numberOfAyahs": 227,
    "revelationType": "Meccan"
  },
  {
    "number": 27,
    "name": "سُورَةُ النَّمۡلِ",
    "englishName": "An-Naml",
    "banglaName": "সূরা আন-নামল",
    "englishMeaning": "The Ant",
    "banglaMeaning": "পিপীলিকা",
    "numberOfAyahs": 93,
    "revelationType": "Meccan"
  },
  {
    "number": 28,
    "name": "سُورَةُ القَصَصِ",
    "englishName": "Al-Qasas",
    "banglaName": "সূরা আল-কাসাস",
    "englishMeaning": "The Stories",
    "banglaMeaning": "কাহিনী",
    "numberOfAyahs": 88,
    "revelationType": "Meccan"
  },
  {
    "number": 29,
    "name": "سُورَةُ العَنكَبُوتِ",
    "englishName": "Al-Ankaboot",
    "banglaName": "সূরা আল-আনকাবূত",
    "englishMeaning": "The Spider",
    "banglaMeaning": "মাকড়সা",
    "numberOfAyahs": 69,
    "revelationType": "Meccan"
  },
  {
    "number": 30,
    "name": "سُورَةُ الرُّومِ",
    "englishName": "Ar-Room",
    "banglaName": "সূরা আর-রূম",
    "englishMeaning": "The Romans",
    "banglaMeaning": "রোমান জাতি",
    "numberOfAyahs": 60,
    "revelationType": "Meccan"
  },
  {
    "number": 31,
    "name": "سُورَةُ لُقۡمَانَ",
    "englishName": "Luqman",
    "banglaName": "সূরা লুকমান",
    "englishMeaning": "Luqman",
    "banglaMeaning": "লুকমান (আ.)",
    "numberOfAyahs": 34,
    "revelationType": "Meccan"
  },
  {
    "number": 32,
    "name": "سُورَةُ السَّجۡدَةِ",
    "englishName": "As-Sajda",
    "banglaName": "সূরা আস-সাজদাহ",
    "englishMeaning": "The Prostration",
    "banglaMeaning": "সিজদা",
    "numberOfAyahs": 30,
    "revelationType": "Meccan"
  },
  {
    "number": 33,
    "name": "سُورَةُ الأَحۡزَابِ",
    "englishName": "Al-Ahzaab",
    "banglaName": "সূরা আল-আহযাব",
    "englishMeaning": "The Clans",
    "banglaMeaning": "সম্মিলিত বাহিনী",
    "numberOfAyahs": 73,
    "revelationType": "Medinan"
  },
  {
    "number": 34,
    "name": "سُورَةُ سَبَإٍ",
    "englishName": "Saba",
    "banglaName": "সূরা সাবা",
    "englishMeaning": "Sheba",
    "banglaMeaning": "সাবা জাতি",
    "numberOfAyahs": 54,
    "revelationType": "Meccan"
  },
  {
    "number": 35,
    "name": "سُورَةُ فَاطِرٍ",
    "englishName": "Faatir",
    "banglaName": "সূরা ফাতির",
    "englishMeaning": "The Originator",
    "banglaMeaning": "আদি স্রষ্টা",
    "numberOfAyahs": 45,
    "revelationType": "Meccan"
  },
  {
    "number": 36,
    "name": "سُورَةُ يسٓ",
    "englishName": "Yaseen",
    "banglaName": "সূরা ইয়া-সীন",
    "englishMeaning": "Yaseen",
    "banglaMeaning": "ইয়া-সীন",
    "numberOfAyahs": 83,
    "revelationType": "Meccan"
  },
  {
    "number": 37,
    "name": "سُورَةُ الصَّافَّاتِ",
    "englishName": "As-Saaffaat",
    "banglaName": "সূরা আস-সাফফাত",
    "englishMeaning": "Those drawn up in Ranks",
    "banglaMeaning": "সারিবদ্ধভাবে দণ্ডায়মান",
    "numberOfAyahs": 182,
    "revelationType": "Meccan"
  },
  {
    "number": 38,
    "name": "سُورَةُ صٓ",
    "englishName": "Saad",
    "banglaName": "সূরা সোয়াদ",
    "englishMeaning": "The letter Saad",
    "banglaMeaning": "সোয়াদ",
    "numberOfAyahs": 88,
    "revelationType": "Meccan"
  },
  {
    "number": 39,
    "name": "سُورَةُ الزُّمَرِ",
    "englishName": "Az-Zumar",
    "banglaName": "সূরা আজ-জুমার",
    "englishMeaning": "The Groups",
    "banglaMeaning": "দলসমূহ",
    "numberOfAyahs": 75,
    "revelationType": "Meccan"
  },
  {
    "number": 40,
    "name": "سُورَةُ غَافِرٍ",
    "englishName": "Ghafir",
    "banglaName": "সূরা গাফির",
    "englishMeaning": "The Forgiver",
    "banglaMeaning": "ক্ষমাশীল",
    "numberOfAyahs": 85,
    "revelationType": "Meccan"
  },
  {
    "number": 41,
    "name": "سُورَةُ فُصِّلَتۡ",
    "englishName": "Fussilat",
    "banglaName": "সূরা ফুসসিলাত",
    "englishMeaning": "Explained in detail",
    "banglaMeaning": "সুস্পষ্ট বিবরণ",
    "numberOfAyahs": 54,
    "revelationType": "Meccan"
  },
  {
    "number": 42,
    "name": "سُورَةُ الشُّورَىٰ",
    "englishName": "Ash-Shura",
    "banglaName": "সূরা আশ-শূরা",
    "englishMeaning": "Consultation",
    "banglaMeaning": "পরামর্শ",
    "numberOfAyahs": 53,
    "revelationType": "Meccan"
  },
  {
    "number": 43,
    "name": "سُورَةُ الزُّخۡرُفِ",
    "englishName": "Az-Zukhruf",
    "banglaName": "সূরা আজ-জুখরুফ",
    "englishMeaning": "Ornaments of gold",
    "banglaMeaning": "স্বর্ণালংকার",
    "numberOfAyahs": 89,
    "revelationType": "Meccan"
  },
  {
    "number": 44,
    "name": "سُورَةُ الدُّخَانِ",
    "englishName": "Ad-Dukhaan",
    "banglaName": "সূরা আদ-দুখান",
    "englishMeaning": "The Smoke",
    "banglaMeaning": "ধোঁয়া",
    "numberOfAyahs": 59,
    "revelationType": "Meccan"
  },
  {
    "number": 45,
    "name": "سُورَةُ الجَاثِيَةِ",
    "englishName": "Al-Jaathiya",
    "banglaName": "সূরা আল-জাসিয়াহ",
    "englishMeaning": "Crouching",
    "banglaMeaning": "নতজানু",
    "numberOfAyahs": 37,
    "revelationType": "Meccan"
  },
  {
    "number": 46,
    "name": "سُورَةُ الأَحۡقَافِ",
    "englishName": "Al-Ahqaf",
    "banglaName": "সূরা আল-আহকাফ",
    "englishMeaning": "The Dunes",
    "banglaMeaning": "বালুর পাহাড়",
    "numberOfAyahs": 35,
    "revelationType": "Meccan"
  },
  {
    "number": 47,
    "name": "سُورَةُ مُحَمَّدٍ",
    "englishName": "Muhammad",
    "banglaName": "সূরা মুহাম্মদ",
    "englishMeaning": "Muhammad",
    "banglaMeaning": "মুহাম্মাদ (সা.)",
    "numberOfAyahs": 38,
    "revelationType": "Medinan"
  },
  {
    "number": 48,
    "name": "سُورَةُ الفَتۡحِ",
    "englishName": "Al-Fath",
    "banglaName": "সূরা আল-ফাতহ",
    "englishMeaning": "The Victory",
    "banglaMeaning": "বিজয়",
    "numberOfAyahs": 29,
    "revelationType": "Medinan"
  },
  {
    "number": 49,
    "name": "سُورَةُ الحُجُرَاتِ",
    "englishName": "Al-Hujuraat",
    "banglaName": "সূরা আল-হুজুরাত",
    "englishMeaning": "The Inner Apartments",
    "banglaMeaning": "কক্ষসমূহ",
    "numberOfAyahs": 18,
    "revelationType": "Medinan"
  },
  {
    "number": 50,
    "name": "سُورَةُ قٓ",
    "englishName": "Qaaf",
    "banglaName": "সূরা ক্বাফ",
    "englishMeaning": "The letter Qaaf",
    "banglaMeaning": "ক্বাফ",
    "numberOfAyahs": 45,
    "revelationType": "Meccan"
  },
  {
    "number": 51,
    "name": "سُورَةُ الذَّارِيَاتِ",
    "englishName": "Adh-Dhaariyat",
    "banglaName": "সূরা আজ-জারিয়াত",
    "englishMeaning": "The Winnowing Winds",
    "banglaMeaning": "বিক্ষেপকারী বাতাস",
    "numberOfAyahs": 60,
    "revelationType": "Meccan"
  },
  {
    "number": 52,
    "name": "سُورَةُ الطُّورِ",
    "englishName": "At-Tur",
    "banglaName": "সূরা আত-তূর",
    "englishMeaning": "The Mount",
    "banglaMeaning": "তূর পাহাড়",
    "numberOfAyahs": 49,
    "revelationType": "Meccan"
  },
  {
    "number": 53,
    "name": "سُورَةُ النَّجۡمِ",
    "englishName": "An-Najm",
    "banglaName": "সূরা আন-নাজম",
    "englishMeaning": "The Star",
    "banglaMeaning": "নক্ষত্র",
    "numberOfAyahs": 62,
    "revelationType": "Meccan"
  },
  {
    "number": 54,
    "name": "سُورَةُ القَمَرِ",
    "englishName": "Al-Qamar",
    "banglaName": "সূরা আল-কামার",
    "englishMeaning": "The Moon",
    "banglaMeaning": "চন্দ্র",
    "numberOfAyahs": 55,
    "revelationType": "Meccan"
  },
  {
    "number": 55,
    "name": "سُورَةُ الرَّحۡمَٰن",
    "englishName": "Ar-Rahmaan",
    "banglaName": "সূরা আর-রহমান",
    "englishMeaning": "The Beneficent",
    "banglaMeaning": "পরম করুণাময়",
    "numberOfAyahs": 78,
    "revelationType": "Medinan"
  },
  {
    "number": 56,
    "name": "سُورَةُ الوَاقِعَةِ",
    "englishName": "Al-Waaqia",
    "banglaName": "সূরা আল-ওয়াকিআহ",
    "englishMeaning": "The Inevitable",
    "banglaMeaning": "অবশ্যম্ভাবী ঘটনা",
    "numberOfAyahs": 96,
    "revelationType": "Meccan"
  },
  {
    "number": 57,
    "name": "سُورَةُ الحَدِيدِ",
    "englishName": "Al-Hadid",
    "banglaName": "সূরা আল-হাদীদ",
    "englishMeaning": "The Iron",
    "banglaMeaning": "লোহা",
    "numberOfAyahs": 29,
    "revelationType": "Medinan"
  },
  {
    "number": 58,
    "name": "سُورَةُ المُجَادلَةِ",
    "englishName": "Al-Mujaadila",
    "banglaName": "সূরা আল-মুজাদালাহ",
    "englishMeaning": "The Pleading Woman",
    "banglaMeaning": "বাদানুবাদকারিণী",
    "numberOfAyahs": 22,
    "revelationType": "Medinan"
  },
  {
    "number": 59,
    "name": "سُورَةُ الحَشۡرِ",
    "englishName": "Al-Hashr",
    "banglaName": "সূরা আল-হাশর",
    "englishMeaning": "The Exile",
    "banglaMeaning": "সমাবেশ",
    "numberOfAyahs": 24,
    "revelationType": "Medinan"
  },
  {
    "number": 60,
    "name": "سُورَةُ المُمۡتَحنَةِ",
    "englishName": "Al-Mumtahana",
    "banglaName": "সূরা আল-মুমতাহিনাহ",
    "englishMeaning": "She that is to be examined",
    "banglaMeaning": "পরীক্ষিতা নারী",
    "numberOfAyahs": 13,
    "revelationType": "Medinan"
  },
  {
    "number": 61,
    "name": "سُورَةُ الصَّفِّ",
    "englishName": "As-Saff",
    "banglaName": "সূরা আস-সফ",
    "englishMeaning": "The Ranks",
    "banglaMeaning": "সারিবদ্ধ সৈন্যদল",
    "numberOfAyahs": 14,
    "revelationType": "Medinan"
  },
  {
    "number": 62,
    "name": "سُورَةُ الجُمُعَةِ",
    "englishName": "Al-Jumu'a",
    "banglaName": "সূরা আল-জুমুআহ",
    "englishMeaning": "Friday",
    "banglaMeaning": "জুমুআ",
    "numberOfAyahs": 11,
    "revelationType": "Medinan"
  },
  {
    "number": 63,
    "name": "سُورَةُ المُنَافِقُونَ",
    "englishName": "Al-Munaafiqoon",
    "banglaName": "সূরা আল-মুনাফিকুন",
    "englishMeaning": "The Hypocrites",
    "banglaMeaning": "মুনাফিকগণ",
    "numberOfAyahs": 11,
    "revelationType": "Medinan"
  },
  {
    "number": 64,
    "name": "سُورَةُ التَّغَابُنِ",
    "englishName": "At-Taghaabun",
    "banglaName": "সূরা আত-তাগাবুন",
    "englishMeaning": "Mutual Disillusion",
    "banglaMeaning": "মোহমুক্তি",
    "numberOfAyahs": 18,
    "revelationType": "Medinan"
  },
  {
    "number": 65,
    "name": "سُورَةُ الطَّلَاقِ",
    "englishName": "At-Talaaq",
    "banglaName": "সূরা আত-ত্বলাক",
    "englishMeaning": "Divorce",
    "banglaMeaning": "তালাক",
    "numberOfAyahs": 12,
    "revelationType": "Medinan"
  },
  {
    "number": 66,
    "name": "سُورَةُ التَّحۡرِيمِ",
    "englishName": "At-Tahrim",
    "banglaName": "সূরা আত-তাহরীম",
    "englishMeaning": "The Prohibition",
    "banglaMeaning": "নিষিদ্ধকরণ",
    "numberOfAyahs": 12,
    "revelationType": "Medinan"
  },
  {
    "number": 67,
    "name": "سُورَةُ المُلۡكِ",
    "englishName": "Al-Mulk",
    "banglaName": "সূরা আল-মুলক",
    "englishMeaning": "The Sovereignty",
    "banglaMeaning": "সার্বভৌম কর্তৃত্ব",
    "numberOfAyahs": 30,
    "revelationType": "Meccan"
  },
  {
    "number": 68,
    "name": "سُورَةُ القَلَمِ",
    "englishName": "Al-Qalam",
    "banglaName": "সূরা আল-কলম",
    "englishMeaning": "The Pen",
    "banglaMeaning": "কলম",
    "numberOfAyahs": 52,
    "revelationType": "Meccan"
  },
  {
    "number": 69,
    "name": "سُورَةُ الحَاقَّةِ",
    "englishName": "Al-Haaqqa",
    "banglaName": "সূরা আল-হাক্কাহ",
    "englishMeaning": "The Reality",
    "banglaMeaning": "সুনিশ্চিত সত্য",
    "numberOfAyahs": 52,
    "revelationType": "Meccan"
  },
  {
    "number": 70,
    "name": "سُورَةُ المَعَارِجِ",
    "englishName": "Al-Ma'aarij",
    "banglaName": "সূরা আল-মাআরিজ",
    "englishMeaning": "The Ascending Stairways",
    "banglaMeaning": "উর্ধ্বারোহণের সোপান",
    "numberOfAyahs": 44,
    "revelationType": "Meccan"
  },
  {
    "number": 71,
    "name": "سُورَةُ نُوحٍ",
    "englishName": "Nooh",
    "banglaName": "সূরা নূহ",
    "englishMeaning": "Noah",
    "banglaMeaning": "নূহ (আ.)",
    "numberOfAyahs": 28,
    "revelationType": "Meccan"
  },
  {
    "number": 72,
    "name": "سُورَةُ الجِنِّ",
    "englishName": "Al-Jinn",
    "banglaName": "সূরা আল-জিন",
    "englishMeaning": "The Jinn",
    "banglaMeaning": "জিন জাতি",
    "numberOfAyahs": 28,
    "revelationType": "Meccan"
  },
  {
    "number": 73,
    "name": "سُورَةُ المُزَّمِّلِ",
    "englishName": "Al-Muzzammil",
    "banglaName": "সূরা আল-মুজ্জাম্মিল",
    "englishMeaning": "The Enshrouded One",
    "banglaMeaning": "বস্ত্রাবৃত",
    "numberOfAyahs": 20,
    "revelationType": "Meccan"
  },
  {
    "number": 74,
    "name": "سُورَةُ المُدَّثِّرِ",
    "englishName": "Al-Muddaththir",
    "banglaName": "সূরা আল-মুদ্দাসসির",
    "englishMeaning": "The Cloaked One",
    "banglaMeaning": "চাদরাবৃত",
    "numberOfAyahs": 56,
    "revelationType": "Meccan"
  },
  {
    "number": 75,
    "name": "سُورَةُ القِيَامَةِ",
    "englishName": "Al-Qiyaama",
    "banglaName": "সূরা আল-কিয়ামাহ",
    "englishMeaning": "The Resurrection",
    "banglaMeaning": "কিয়ামত",
    "numberOfAyahs": 40,
    "revelationType": "Meccan"
  },
  {
    "number": 76,
    "name": "سُورَةُ الإِنسَانِ",
    "englishName": "Al-Insaan",
    "banglaName": "সূরা আল-ইনসান",
    "englishMeaning": "Man",
    "banglaMeaning": "মানুষ",
    "numberOfAyahs": 31,
    "revelationType": "Medinan"
  },
  {
    "number": 77,
    "name": "سُورَةُ المُرۡسَلَاتِ",
    "englishName": "Al-Mursalaat",
    "banglaName": "সূরা আল-মুরসালাত",
    "englishMeaning": "The Emissaries",
    "banglaMeaning": "প্রেরিত বাতাস",
    "numberOfAyahs": 50,
    "revelationType": "Meccan"
  },
  {
    "number": 78,
    "name": "سُورَةُ النَّبَإِ",
    "englishName": "An-Naba",
    "banglaName": "সূরা আন-নাবা",
    "englishMeaning": "The Announcement",
    "banglaMeaning": "মহাসংবাদ",
    "numberOfAyahs": 40,
    "revelationType": "Meccan"
  },
  {
    "number": 79,
    "name": "سُورَةُ النَّازِعَاتِ",
    "englishName": "An-Naazi'aat",
    "banglaName": "সূরা আন-নাযিয়াত",
    "englishMeaning": "Those who drag forth",
    "banglaMeaning": "প্রাণ হরণকারী",
    "numberOfAyahs": 46,
    "revelationType": "Meccan"
  },
  {
    "number": 80,
    "name": "سُورَةُ عَبَسَ",
    "englishName": "Abasa",
    "banglaName": "সূরা আবাসা",
    "englishMeaning": "He frowned",
    "banglaMeaning": "তিনি ভ্রূকুটি করলেন",
    "numberOfAyahs": 42,
    "revelationType": "Meccan"
  },
  {
    "number": 81,
    "name": "سُورَةُ التَّكۡوِيرِ",
    "englishName": "At-Takwir",
    "banglaName": "সূরা আত-তাকভীর",
    "englishMeaning": "The Overthrowing",
    "banglaMeaning": "আলোহীনকরণ",
    "numberOfAyahs": 29,
    "revelationType": "Meccan"
  },
  {
    "number": 82,
    "name": "سُورَةُ الانفِطَارِ",
    "englishName": "Al-Infitaar",
    "banglaName": "সূরা আল-ইনফিতার",
    "englishMeaning": "The Cleaving",
    "banglaMeaning": "বিদীর্ণ হওয়া",
    "numberOfAyahs": 19,
    "revelationType": "Meccan"
  },
  {
    "number": 83,
    "name": "سُورَةُ المُطَفِّفِينَ",
    "englishName": "Al-Mutaffifin",
    "banglaName": "সূরা আল-মুতাফফিফীন",
    "englishMeaning": "Defrauding",
    "banglaMeaning": "মাপে কম দানকারী",
    "numberOfAyahs": 36,
    "revelationType": "Meccan"
  },
  {
    "number": 84,
    "name": "سُورَةُ الانشِقَاقِ",
    "englishName": "Al-Inshiqaaq",
    "banglaName": "সূরা আল-ইনশিকাক",
    "englishMeaning": "The Splitting Open",
    "banglaMeaning": "খণ্ডিত হওয়া",
    "numberOfAyahs": 25,
    "revelationType": "Meccan"
  },
  {
    "number": 85,
    "name": "سُورَةُ البُرُوجِ",
    "englishName": "Al-Burooj",
    "banglaName": "সূরা আল-বুরূজ",
    "englishMeaning": "The Constellations",
    "banglaMeaning": "নক্ষত্রপুঞ্জ",
    "numberOfAyahs": 22,
    "revelationType": "Meccan"
  },
  {
    "number": 86,
    "name": "سُورَةُ الطَّارِقِ",
    "englishName": "At-Taariq",
    "banglaName": "সূরা আত-তারিক",
    "englishMeaning": "The Morning Star",
    "banglaMeaning": "রাতের আগন্তুক",
    "numberOfAyahs": 17,
    "revelationType": "Meccan"
  },
  {
    "number": 87,
    "name": "سُورَةُ الأَعۡلَىٰ",
    "englishName": "Al-A'laa",
    "banglaName": "সূরা আল-আলা",
    "englishMeaning": "The Most High",
    "banglaMeaning": "সর্বোচ্চ",
    "numberOfAyahs": 19,
    "revelationType": "Meccan"
  },
  {
    "number": 88,
    "name": "سُورَةُ الغَاشِيَةِ",
    "englishName": "Al-Ghaashiya",
    "banglaName": "সূরা আল-গাশিয়াহ",
    "englishMeaning": "The Overwhelming",
    "banglaMeaning": "আচ্ছন্নকারী",
    "numberOfAyahs": 26,
    "revelationType": "Meccan"
  },
  {
    "number": 89,
    "name": "سُورَةُ الفَجۡرِ",
    "englishName": "Al-Fajr",
    "banglaName": "সূরা আল-ফজর",
    "englishMeaning": "The Dawn",
    "banglaMeaning": "ভোর",
    "numberOfAyahs": 30,
    "revelationType": "Meccan"
  },
  {
    "number": 90,
    "name": "سُورَةُ البَلَدِ",
    "englishName": "Al-Balad",
    "banglaName": "সূরা আল-বালাদ",
    "englishMeaning": "The City",
    "banglaMeaning": "নগর",
    "numberOfAyahs": 20,
    "revelationType": "Meccan"
  },
  {
    "number": 91,
    "name": "سُورَةُ الشَّمۡسِ",
    "englishName": "Ash-Shams",
    "banglaName": "সূরা আশ-শামস",
    "englishMeaning": "The Sun",
    "banglaMeaning": "সূর্য",
    "numberOfAyahs": 15,
    "revelationType": "Meccan"
  },
  {
    "number": 92,
    "name": "سُورَةُ اللَّيۡلِ",
    "englishName": "Al-Lail",
    "banglaName": "সূরা আল-লাইল",
    "englishMeaning": "The Night",
    "banglaMeaning": "রাত্রি",
    "numberOfAyahs": 21,
    "revelationType": "Meccan"
  },
  {
    "number": 93,
    "name": "سُورَةُ الضُّحَىٰ",
    "englishName": "Ad-Dhuhaa",
    "banglaName": "সূরা আদ-দুহা",
    "englishMeaning": "The Morning Hours",
    "banglaMeaning": "পূর্বাহ্ণের আলো",
    "numberOfAyahs": 11,
    "revelationType": "Meccan"
  },
  {
    "number": 94,
    "name": "سُورَةُ الشَّرۡحِ",
    "englishName": "Ash-Sharh",
    "banglaName": "সূরা আলাম নাশরাহ",
    "englishMeaning": "The Consolation",
    "banglaMeaning": "বক্ষ প্রশস্তকরণ",
    "numberOfAyahs": 8,
    "revelationType": "Meccan"
  },
  {
    "number": 95,
    "name": "سُورَةُ التِّينِ",
    "englishName": "At-Tin",
    "banglaName": "সূরা আত-তীন",
    "englishMeaning": "The Fig",
    "banglaMeaning": "ডুমুর",
    "numberOfAyahs": 8,
    "revelationType": "Meccan"
  },
  {
    "number": 96,
    "name": "سُورَةُ العَلَقِ",
    "englishName": "Al-Alaq",
    "banglaName": "সূরা আল-আলাক",
    "englishMeaning": "The Clot",
    "banglaMeaning": "জমাট রক্ত",
    "numberOfAyahs": 19,
    "revelationType": "Meccan"
  },
  {
    "number": 97,
    "name": "سُورَةُ القَدۡرِ",
    "englishName": "Al-Qadr",
    "banglaName": "সূরা আল-কদর",
    "englishMeaning": "The Power, Fate",
    "banglaMeaning": "মহিমান্বিত রাত",
    "numberOfAyahs": 5,
    "revelationType": "Meccan"
  },
  {
    "number": 98,
    "name": "سُورَةُ البَيِّنَةِ",
    "englishName": "Al-Bayyina",
    "banglaName": "সূরা আল-বাইয়্যিনাহ",
    "englishMeaning": "The Evidence",
    "banglaMeaning": "সুস্পষ্ট প্রমাণ",
    "numberOfAyahs": 8,
    "revelationType": "Medinan"
  },
  {
    "number": 99,
    "name": "سُورَةُ الزَّلۡزَلَةِ",
    "englishName": "Az-Zalzala",
    "banglaName": "সূরা আজ-জিলজাল",
    "englishMeaning": "The Earthquake",
    "banglaMeaning": "ভূমিকম্প",
    "numberOfAyahs": 8,
    "revelationType": "Medinan"
  },
  {
    "number": 100,
    "name": "سُورَةُ العَادِيَاتِ",
    "englishName": "Al-Aadiyaat",
    "banglaName": "সূরা আল-আদিয়াত",
    "englishMeaning": "The Chargers",
    "banglaMeaning": "অভিযানকারী অশ্বদল",
    "numberOfAyahs": 11,
    "revelationType": "Meccan"
  },
  {
    "number": 101,
    "name": "سُورَةُ القَارِعَةِ",
    "englishName": "Al-Qaari'a",
    "banglaName": "সূরা আল-কারিয়াহ",
    "englishMeaning": "The Calamity",
    "banglaMeaning": "মহাসংকট",
    "numberOfAyahs": 11,
    "revelationType": "Meccan"
  },
  {
    "number": 102,
    "name": "سُورَةُ التَّكَاثُرِ",
    "englishName": "At-Takaathur",
    "banglaName": "সূরা আত-তাকাসুর",
    "englishMeaning": "Competition",
    "banglaMeaning": "প্রাচুর্যের প্রতিযোগিতা",
    "numberOfAyahs": 8,
    "revelationType": "Meccan"
  },
  {
    "number": 103,
    "name": "سُورَةُ العَصۡرِ",
    "englishName": "Al-Asr",
    "banglaName": "সূরা আল-আসর",
    "englishMeaning": "The Declining Day, Epoch",
    "banglaMeaning": "সময়",
    "numberOfAyahs": 3,
    "revelationType": "Meccan"
  },
  {
    "number": 104,
    "name": "سُورَةُ الهُمَزَةِ",
    "englishName": "Al-Humaza",
    "banglaName": "সূরা আল-হুমাযাহ",
    "englishMeaning": "The Traducer",
    "banglaMeaning": "পশ্চাতে নিন্দাকারী",
    "numberOfAyahs": 9,
    "revelationType": "Meccan"
  },
  {
    "number": 105,
    "name": "سُورَةُ الفِيلِ",
    "englishName": "Al-Fil",
    "banglaName": "সূরা আল-ফীল",
    "englishMeaning": "The Elephant",
    "banglaMeaning": "হাতি",
    "numberOfAyahs": 5,
    "revelationType": "Meccan"
  },
  {
    "number": 106,
    "name": "سُورَةُ قُرَيۡشٍ",
    "englishName": "Quraish",
    "banglaName": "সূরা কুরাইশ",
    "englishMeaning": "Quraysh",
    "banglaMeaning": "কুরাইশ",
    "numberOfAyahs": 4,
    "revelationType": "Meccan"
  },
  {
    "number": 107,
    "name": "سُورَةُ المَاعُونِ",
    "englishName": "Al-Maa'un",
    "banglaName": "সূরা আল-মাউন",
    "englishMeaning": "Almsgiving",
    "banglaMeaning": "সাধারণ সাহায্য",
    "numberOfAyahs": 7,
    "revelationType": "Meccan"
  },
  {
    "number": 108,
    "name": "سُورَةُ الكَوۡثَرِ",
    "englishName": "Al-Kawthar",
    "banglaName": "সূরা আল-কাউসার",
    "englishMeaning": "Abundance",
    "banglaMeaning": "প্রাচুর্য",
    "numberOfAyahs": 3,
    "revelationType": "Meccan"
  },
  {
    "number": 109,
    "name": "سُورَةُ الكَافِرُونَ",
    "englishName": "Al-Kaafiroon",
    "banglaName": "সূরা আল-কাফিরুন",
    "englishMeaning": "The Disbelievers",
    "banglaMeaning": "কাফিরগণ",
    "numberOfAyahs": 6,
    "revelationType": "Meccan"
  },
  {
    "number": 110,
    "name": "سُورَةُ النَّصۡرِ",
    "englishName": "An-Nasr",
    "banglaName": "সূরা আন-নসর",
    "englishMeaning": "Divine Support",
    "banglaMeaning": "সাহায্য",
    "numberOfAyahs": 3,
    "revelationType": "Medinan"
  },
  {
    "number": 111,
    "name": "سُورَةُ المَسَدِ",
    "englishName": "Al-Masad",
    "banglaName": "সূরা আল-মাসাদ",
    "englishMeaning": "The Palm Fibre",
    "banglaMeaning": "খেজুর আঁশের রশি",
    "numberOfAyahs": 5,
    "revelationType": "Meccan"
  },
  {
    "number": 112,
    "name": "سُورَةُ الإِخۡلَاصِ",
    "englishName": "Al-Ikhlaas",
    "banglaName": "সূরা আল-ইখলাস",
    "englishMeaning": "Sincerity",
    "banglaMeaning": "একনিষ্ঠতা",
    "numberOfAyahs": 4,
    "revelationType": "Meccan"
  },
  {
    "number": 113,
    "name": "سُورَةُ الفَلَقِ",
    "englishName": "Al-Falaq",
    "banglaName": "সূরা আল-ফালাক",
    "englishMeaning": "The Dawn",
    "banglaMeaning": "প্রভাত",
    "numberOfAyahs": 5,
    "revelationType": "Meccan"
  },
  {
    "number": 114,
    "name": "سُورَةُ النَّاسِ",
    "englishName": "An-Naas",
    "banglaName": "সূরা আন-নাস",
    "englishMeaning": "Mankind",
    "banglaMeaning": "মানবজাতি",
    "numberOfAyahs": 6,
    "revelationType": "Meccan"
  }
];

/* ── Bismillah handling ─────────────────────────────────────────────────
   The quran-uthmani edition prefixes ayah 1 of every surah (except 1 and 9)
   with the bismillah, but its diacritics are not stable (shadda/fatha order
   varies; surah 95 even has "بِّسْمِ"), so a literal regex silently misses
   and the reader showed the bismillah TWICE. We compare the first four words
   with every diacritic removed instead. */

export const BISMILLAH = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
const BISMILLAH_PLAIN = "بسم الله الرحمن الرحيم";

/** Arabic letters only: harakat, Quranic marks, tatweel and BOM removed; ٱ → ا. */
export function plainArabic(text: string): string {
  return text
    .replace(/[﻿ـً-ٰٟۖ-ۭ]/g, "")
    .replace(/ٱ/g, "ا")
    .replace(/\s+/g, " ")
    .trim();
}

/** Surah 1's ayah 1 IS the bismillah; surah 9 has none; all others get one header. */
export function hasBismillahHeader(surahNumber: number): boolean {
  return surahNumber !== 1 && surahNumber !== 9;
}

/**
 * Removes a leading bismillah from ayah 1 (surahs other than 1 and 9).
 * Safe to call on already-clean text (no-op), so client renderers can apply
 * it to cached/offline payloads too.
 */
export function stripBismillah(text: string, surahNumber: number, numberInSurah: number): string {
  const clean = text.replace(/^﻿/, "");
  if (numberInSurah !== 1 || !hasBismillahHeader(surahNumber)) return clean;
  const words = clean.trim().split(/\s+/);
  if (words.length < 4 || plainArabic(words.slice(0, 4).join(" ")) !== BISMILLAH_PLAIN) return clean;
  return words.slice(4).join(" ");
}

/** First ayah of every juz (para): [surah, ayah]. */
export const JUZ_STARTS: ReadonlyArray<readonly [number, number]> = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];

/** Bengali digits: 114 → "১১৪". */
export function bnNum(value: number): string {
  return String(value).replace(/\d/g, (digit) => "০১২৩৪৫৬৭৮৯"[Number(digit)]);
}

/** "সূরা আল-বাকারা" → "আল-বাকারা". */
export function shortBanglaName(surah: Pick<Surah, "banglaName">): string {
  return surah.banglaName.replace(/^সূরা\s+/, "");
}
