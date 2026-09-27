export type Surah = {
  number: number;
  name: string;
  englishName: string;
  banglaName: string;
  englishMeaning: string;
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
    "numberOfAyahs": 7,
    "revelationType": "Meccan"
  },
  {
    "number": 2,
    "name": "سُورَةُ البَقَرَةِ",
    "englishName": "Al-Baqara",
    "banglaName": "সূরা আল-বাকারা",
    "englishMeaning": "The Cow",
    "numberOfAyahs": 286,
    "revelationType": "Medinan"
  },
  {
    "number": 3,
    "name": "سُورَةُ آلِ عِمۡرَانَ",
    "englishName": "Aal-i-Imraan",
    "banglaName": "সূরা আলে ইমরান",
    "englishMeaning": "The Family of Imraan",
    "numberOfAyahs": 200,
    "revelationType": "Medinan"
  },
  {
    "number": 4,
    "name": "سُورَةُ النِّسَاءِ",
    "englishName": "An-Nisaa",
    "banglaName": "সূরা আন-নিসা",
    "englishMeaning": "The Women",
    "numberOfAyahs": 176,
    "revelationType": "Medinan"
  },
  {
    "number": 5,
    "name": "سُورَةُ المَائـِدَةِ",
    "englishName": "Al-Maaida",
    "banglaName": "সূরা আল-মায়েদা",
    "englishMeaning": "The Table",
    "numberOfAyahs": 120,
    "revelationType": "Medinan"
  },
  {
    "number": 6,
    "name": "سُورَةُ الأَنۡعَامِ",
    "englishName": "Al-An'aam",
    "banglaName": "সূরা আল-আনআম",
    "englishMeaning": "The Cattle",
    "numberOfAyahs": 165,
    "revelationType": "Meccan"
  },
  {
    "number": 7,
    "name": "سُورَةُ الأَعۡرَافِ",
    "englishName": "Al-A'raaf",
    "banglaName": "সূরা আল-আরাফ",
    "englishMeaning": "The Heights",
    "numberOfAyahs": 206,
    "revelationType": "Meccan"
  },
  {
    "number": 8,
    "name": "سُورَةُ الأَنفَالِ",
    "englishName": "Al-Anfaal",
    "banglaName": "সূরা আল-আনফাল",
    "englishMeaning": "The Spoils of War",
    "numberOfAyahs": 75,
    "revelationType": "Medinan"
  },
  {
    "number": 9,
    "name": "سُورَةُ التَّوۡبَةِ",
    "englishName": "At-Tawba",
    "banglaName": "সূরা আত-তাওবাহ",
    "englishMeaning": "The Repentance",
    "numberOfAyahs": 129,
    "revelationType": "Medinan"
  },
  {
    "number": 10,
    "name": "سُورَةُ يُونُسَ",
    "englishName": "Yunus",
    "banglaName": "সূরা ইউনুস",
    "englishMeaning": "Jonas",
    "numberOfAyahs": 109,
    "revelationType": "Meccan"
  },
  {
    "number": 11,
    "name": "سُورَةُ هُودٍ",
    "englishName": "Hud",
    "banglaName": "সূরা হূদ",
    "englishMeaning": "Hud",
    "numberOfAyahs": 123,
    "revelationType": "Meccan"
  },
  {
    "number": 12,
    "name": "سُورَةُ يُوسُفَ",
    "englishName": "Yusuf",
    "banglaName": "সূরা ইউসুফ",
    "englishMeaning": "Joseph",
    "numberOfAyahs": 111,
    "revelationType": "Meccan"
  },
  {
    "number": 13,
    "name": "سُورَةُ الرَّعۡدِ",
    "englishName": "Ar-Ra'd",
    "banglaName": "সূরা আর-রাদ",
    "englishMeaning": "The Thunder",
    "numberOfAyahs": 43,
    "revelationType": "Medinan"
  },
  {
    "number": 14,
    "name": "سُورَةُ إِبۡرَاهِيمَ",
    "englishName": "Ibrahim",
    "banglaName": "সূরা ইব্রাহীম",
    "englishMeaning": "Abraham",
    "numberOfAyahs": 52,
    "revelationType": "Meccan"
  },
  {
    "number": 15,
    "name": "سُورَةُ الحِجۡرِ",
    "englishName": "Al-Hijr",
    "banglaName": "সূরা আল-হিজর",
    "englishMeaning": "The Rock",
    "numberOfAyahs": 99,
    "revelationType": "Meccan"
  },
  {
    "number": 16,
    "name": "سُورَةُ النَّحۡلِ",
    "englishName": "An-Nahl",
    "banglaName": "সূরা আন-নাহল",
    "englishMeaning": "The Bee",
    "numberOfAyahs": 128,
    "revelationType": "Meccan"
  },
  {
    "number": 17,
    "name": "سُورَةُ الإِسۡرَاءِ",
    "englishName": "Al-Israa",
    "banglaName": "সূরা বনি ইসরাঈল",
    "englishMeaning": "The Night Journey",
    "numberOfAyahs": 111,
    "revelationType": "Meccan"
  },
  {
    "number": 18,
    "name": "سُورَةُ الكَهۡفِ",
    "englishName": "Al-Kahf",
    "banglaName": "সূরা আল-কাহফ",
    "englishMeaning": "The Cave",
    "numberOfAyahs": 110,
    "revelationType": "Meccan"
  },
  {
    "number": 19,
    "name": "سُورَةُ مَرۡيَمَ",
    "englishName": "Maryam",
    "banglaName": "সূরা মারইয়াম",
    "englishMeaning": "Mary",
    "numberOfAyahs": 98,
    "revelationType": "Meccan"
  },
  {
    "number": 20,
    "name": "سُورَةُ طه",
    "englishName": "Taa-Haa",
    "banglaName": "সূরা ত্ব-হা",
    "englishMeaning": "Taa-Haa",
    "numberOfAyahs": 135,
    "revelationType": "Meccan"
  },
  {
    "number": 21,
    "name": "سُورَةُ الأَنبِيَاءِ",
    "englishName": "Al-Anbiyaa",
    "banglaName": "সূরা আল-আম্বিয়া",
    "englishMeaning": "The Prophets",
    "numberOfAyahs": 112,
    "revelationType": "Meccan"
  },
  {
    "number": 22,
    "name": "سُورَةُ الحَجِّ",
    "englishName": "Al-Hajj",
    "banglaName": "সূরা আল-হাজ্জ",
    "englishMeaning": "The Pilgrimage",
    "numberOfAyahs": 78,
    "revelationType": "Medinan"
  },
  {
    "number": 23,
    "name": "سُورَةُ المُؤۡمِنُونَ",
    "englishName": "Al-Muminoon",
    "banglaName": "সূরা আল-মুমিনূন",
    "englishMeaning": "The Believers",
    "numberOfAyahs": 118,
    "revelationType": "Meccan"
  },
  {
    "number": 24,
    "name": "سُورَةُ النُّورِ",
    "englishName": "An-Noor",
    "banglaName": "সূরা আন-নূর",
    "englishMeaning": "The Light",
    "numberOfAyahs": 64,
    "revelationType": "Medinan"
  },
  {
    "number": 25,
    "name": "سُورَةُ الفُرۡقَانِ",
    "englishName": "Al-Furqaan",
    "banglaName": "সূরা আল-ফুরকান",
    "englishMeaning": "The Criterion",
    "numberOfAyahs": 77,
    "revelationType": "Meccan"
  },
  {
    "number": 26,
    "name": "سُورَةُ الشُّعَرَاءِ",
    "englishName": "Ash-Shu'araa",
    "banglaName": "সূরা আশ-শুআরা",
    "englishMeaning": "The Poets",
    "numberOfAyahs": 227,
    "revelationType": "Meccan"
  },
  {
    "number": 27,
    "name": "سُورَةُ النَّمۡلِ",
    "englishName": "An-Naml",
    "banglaName": "সূরা আন-নামল",
    "englishMeaning": "The Ant",
    "numberOfAyahs": 93,
    "revelationType": "Meccan"
  },
  {
    "number": 28,
    "name": "سُورَةُ القَصَصِ",
    "englishName": "Al-Qasas",
    "banglaName": "সূরা আল-কাসাস",
    "englishMeaning": "The Stories",
    "numberOfAyahs": 88,
    "revelationType": "Meccan"
  },
  {
    "number": 29,
    "name": "سُورَةُ العَنكَبُوتِ",
    "englishName": "Al-Ankaboot",
    "banglaName": "সূরা আল-আনকাবূত",
    "englishMeaning": "The Spider",
    "numberOfAyahs": 69,
    "revelationType": "Meccan"
  },
  {
    "number": 30,
    "name": "سُورَةُ الرُّومِ",
    "englishName": "Ar-Room",
    "banglaName": "সূরা আর-রূম",
    "englishMeaning": "The Romans",
    "numberOfAyahs": 60,
    "revelationType": "Meccan"
  },
  {
    "number": 31,
    "name": "سُورَةُ لُقۡمَانَ",
    "englishName": "Luqman",
    "banglaName": "সূরা লুকমান",
    "englishMeaning": "Luqman",
    "numberOfAyahs": 34,
    "revelationType": "Meccan"
  },
  {
    "number": 32,
    "name": "سُورَةُ السَّجۡدَةِ",
    "englishName": "As-Sajda",
    "banglaName": "সূরা আস-সাজদাহ",
    "englishMeaning": "The Prostration",
    "numberOfAyahs": 30,
    "revelationType": "Meccan"
  },
  {
    "number": 33,
    "name": "سُورَةُ الأَحۡزَابِ",
    "englishName": "Al-Ahzaab",
    "banglaName": "সূরা আল-আহযাব",
    "englishMeaning": "The Clans",
    "numberOfAyahs": 73,
    "revelationType": "Medinan"
  },
  {
    "number": 34,
    "name": "سُورَةُ سَبَإٍ",
    "englishName": "Saba",
    "banglaName": "সূরা সাবা",
    "englishMeaning": "Sheba",
    "numberOfAyahs": 54,
    "revelationType": "Meccan"
  },
  {
    "number": 35,
    "name": "سُورَةُ فَاطِرٍ",
    "englishName": "Faatir",
    "banglaName": "সূরা ফাতির",
    "englishMeaning": "The Originator",
    "numberOfAyahs": 45,
    "revelationType": "Meccan"
  },
  {
    "number": 36,
    "name": "سُورَةُ يسٓ",
    "englishName": "Yaseen",
    "banglaName": "সূরা ইয়া-সীন",
    "englishMeaning": "Yaseen",
    "numberOfAyahs": 83,
    "revelationType": "Meccan"
  },
  {
    "number": 37,
    "name": "سُورَةُ الصَّافَّاتِ",
    "englishName": "As-Saaffaat",
    "banglaName": "সূরা আস-সাফফাত",
    "englishMeaning": "Those drawn up in Ranks",
    "numberOfAyahs": 182,
    "revelationType": "Meccan"
  },
  {
    "number": 38,
    "name": "سُورَةُ صٓ",
    "englishName": "Saad",
    "banglaName": "সূরা সোয়াদ",
    "englishMeaning": "The letter Saad",
    "numberOfAyahs": 88,
    "revelationType": "Meccan"
  },
  {
    "number": 39,
    "name": "سُورَةُ الزُّمَرِ",
    "englishName": "Az-Zumar",
    "banglaName": "সূরা আজ-জুমার",
    "englishMeaning": "The Groups",
    "numberOfAyahs": 75,
    "revelationType": "Meccan"
  },
  {
    "number": 40,
    "name": "سُورَةُ غَافِرٍ",
    "englishName": "Ghafir",
    "banglaName": "সূরা গাফির",
    "englishMeaning": "The Forgiver",
    "numberOfAyahs": 85,
    "revelationType": "Meccan"
  },
  {
    "number": 41,
    "name": "سُورَةُ فُصِّلَتۡ",
    "englishName": "Fussilat",
    "banglaName": "সূরা ফুসসিলাত",
    "englishMeaning": "Explained in detail",
    "numberOfAyahs": 54,
    "revelationType": "Meccan"
  },
  {
    "number": 42,
    "name": "سُورَةُ الشُّورَىٰ",
    "englishName": "Ash-Shura",
    "banglaName": "সূরা আশ-শূরা",
    "englishMeaning": "Consultation",
    "numberOfAyahs": 53,
    "revelationType": "Meccan"
  },
  {
    "number": 43,
    "name": "سُورَةُ الزُّخۡرُفِ",
    "englishName": "Az-Zukhruf",
    "banglaName": "সূরা আজ-জুখরুফ",
    "englishMeaning": "Ornaments of gold",
    "numberOfAyahs": 89,
    "revelationType": "Meccan"
  },
  {
    "number": 44,
    "name": "سُورَةُ الدُّخَانِ",
    "englishName": "Ad-Dukhaan",
    "banglaName": "সূরা আদ-দুখান",
    "englishMeaning": "The Smoke",
    "numberOfAyahs": 59,
    "revelationType": "Meccan"
  },
  {
    "number": 45,
    "name": "سُورَةُ الجَاثِيَةِ",
    "englishName": "Al-Jaathiya",
    "banglaName": "সূরা আল-জাসিয়াহ",
    "englishMeaning": "Crouching",
    "numberOfAyahs": 37,
    "revelationType": "Meccan"
  },
  {
    "number": 46,
    "name": "سُورَةُ الأَحۡقَافِ",
    "englishName": "Al-Ahqaf",
    "banglaName": "সূরা আল-আহকাফ",
    "englishMeaning": "The Dunes",
    "numberOfAyahs": 35,
    "revelationType": "Meccan"
  },
  {
    "number": 47,
    "name": "سُورَةُ مُحَمَّدٍ",
    "englishName": "Muhammad",
    "banglaName": "সূরা মুহাম্মদ",
    "englishMeaning": "Muhammad",
    "numberOfAyahs": 38,
    "revelationType": "Medinan"
  },
  {
    "number": 48,
    "name": "سُورَةُ الفَتۡحِ",
    "englishName": "Al-Fath",
    "banglaName": "সূরা আল-ফাতহ",
    "englishMeaning": "The Victory",
    "numberOfAyahs": 29,
    "revelationType": "Medinan"
  },
  {
    "number": 49,
    "name": "سُورَةُ الحُجُرَاتِ",
    "englishName": "Al-Hujuraat",
    "banglaName": "সূরা আল-হুজুরাت",
    "englishMeaning": "The Inner Apartments",
    "numberOfAyahs": 18,
    "revelationType": "Medinan"
  },
  {
    "number": 50,
    "name": "سُورَةُ قٓ",
    "englishName": "Qaaf",
    "banglaName": "সূরা ক্বাফ",
    "englishMeaning": "The letter Qaaf",
    "numberOfAyahs": 45,
    "revelationType": "Meccan"
  },
  {
    "number": 51,
    "name": "سُورَةُ الذَّارِيَاتِ",
    "englishName": "Adh-Dhaariyat",
    "banglaName": "সূরা আজ-জারিয়াত",
    "englishMeaning": "The Winnowing Winds",
    "numberOfAyahs": 60,
    "revelationType": "Meccan"
  },
  {
    "number": 52,
    "name": "سُورَةُ الطُّورِ",
    "englishName": "At-Tur",
    "banglaName": "সূরা আত-তূর",
    "englishMeaning": "The Mount",
    "numberOfAyahs": 49,
    "revelationType": "Meccan"
  },
  {
    "number": 53,
    "name": "سُورَةُ النَّجۡمِ",
    "englishName": "An-Najm",
    "banglaName": "সূরা আন-নাজম",
    "englishMeaning": "The Star",
    "numberOfAyahs": 62,
    "revelationType": "Meccan"
  },
  {
    "number": 54,
    "name": "سُورَةُ القَمَرِ",
    "englishName": "Al-Qamar",
    "banglaName": "সূরা আল-কামার",
    "englishMeaning": "The Moon",
    "numberOfAyahs": 55,
    "revelationType": "Meccan"
  },
  {
    "number": 55,
    "name": "سُورَةُ الرَّحۡمَٰن",
    "englishName": "Ar-Rahmaan",
    "banglaName": "সূরা আর-রহমান",
    "englishMeaning": "The Beneficent",
    "numberOfAyahs": 78,
    "revelationType": "Medinan"
  },
  {
    "number": 56,
    "name": "سُورَةُ الوَاقِعَةِ",
    "englishName": "Al-Waaqia",
    "banglaName": "সূরা আল-ওয়াকিআহ",
    "englishMeaning": "The Inevitable",
    "numberOfAyahs": 96,
    "revelationType": "Meccan"
  },
  {
    "number": 57,
    "name": "سُورَةُ الحَدِيدِ",
    "englishName": "Al-Hadid",
    "banglaName": "সূরা আল-হাদীদ",
    "englishMeaning": "The Iron",
    "numberOfAyahs": 29,
    "revelationType": "Medinan"
  },
  {
    "number": 58,
    "name": "سُورَةُ المُجَادلَةِ",
    "englishName": "Al-Mujaadila",
    "banglaName": "সূরা আল-মুজাদালাহ",
    "englishMeaning": "The Pleading Woman",
    "numberOfAyahs": 22,
    "revelationType": "Medinan"
  },
  {
    "number": 59,
    "name": "سُورَةُ الحَشۡرِ",
    "englishName": "Al-Hashr",
    "banglaName": "সূরা আল-হাশর",
    "englishMeaning": "The Exile",
    "numberOfAyahs": 24,
    "revelationType": "Medinan"
  },
  {
    "number": 60,
    "name": "سُورَةُ المُمۡتَحنَةِ",
    "englishName": "Al-Mumtahana",
    "banglaName": "সূরা আল-মুমতাহিনাহ",
    "englishMeaning": "She that is to be examined",
    "numberOfAyahs": 13,
    "revelationType": "Medinan"
  },
  {
    "number": 61,
    "name": "سُورَةُ الصَّفِّ",
    "englishName": "As-Saff",
    "banglaName": "সূরা আস-সফ",
    "englishMeaning": "The Ranks",
    "numberOfAyahs": 14,
    "revelationType": "Medinan"
  },
  {
    "number": 62,
    "name": "سُورَةُ الجُمُعَةِ",
    "englishName": "Al-Jumu'a",
    "banglaName": "সূরা আল-জুমুআহ",
    "englishMeaning": "Friday",
    "numberOfAyahs": 11,
    "revelationType": "Medinan"
  },
  {
    "number": 63,
    "name": "سُورَةُ المُنَافِقُونَ",
    "englishName": "Al-Munaafiqoon",
    "banglaName": "সূরা আল-মুনাফিকুন",
    "englishMeaning": "The Hypocrites",
    "numberOfAyahs": 11,
    "revelationType": "Medinan"
  },
  {
    "number": 64,
    "name": "سُورَةُ التَّغَابُنِ",
    "englishName": "At-Taghaabun",
    "banglaName": "সূরা আত-তাগাবুন",
    "englishMeaning": "Mutual Disillusion",
    "numberOfAyahs": 18,
    "revelationType": "Medinan"
  },
  {
    "number": 65,
    "name": "سُورَةُ الطَّلَاقِ",
    "englishName": "At-Talaaq",
    "banglaName": "সূরা আত-ত্বলাক",
    "englishMeaning": "Divorce",
    "numberOfAyahs": 12,
    "revelationType": "Medinan"
  },
  {
    "number": 66,
    "name": "سُورَةُ التَّحۡرِيمِ",
    "englishName": "At-Tahrim",
    "banglaName": "সূরা আত-তাহরীম",
    "englishMeaning": "The Prohibition",
    "numberOfAyahs": 12,
    "revelationType": "Medinan"
  },
  {
    "number": 67,
    "name": "سُورَةُ المُلۡكِ",
    "englishName": "Al-Mulk",
    "banglaName": "সূরা আল-মুলক",
    "englishMeaning": "The Sovereignty",
    "numberOfAyahs": 30,
    "revelationType": "Meccan"
  },
  {
    "number": 68,
    "name": "سُورَةُ القَلَمِ",
    "englishName": "Al-Qalam",
    "banglaName": "সূরা আল-কলম",
    "englishMeaning": "The Pen",
    "numberOfAyahs": 52,
    "revelationType": "Meccan"
  },
  {
    "number": 69,
    "name": "سُورَةُ الحَاقَّةِ",
    "englishName": "Al-Haaqqa",
    "banglaName": "সূরা আল-হাক্কাহ",
    "englishMeaning": "The Reality",
    "numberOfAyahs": 52,
    "revelationType": "Meccan"
  },
  {
    "number": 70,
    "name": "سُورَةُ المَعَارِجِ",
    "englishName": "Al-Ma'aarij",
    "banglaName": "সূরা আল-মাআরিজ",
    "englishMeaning": "The Ascending Stairways",
    "numberOfAyahs": 44,
    "revelationType": "Meccan"
  },
  {
    "number": 71,
    "name": "سُورَةُ نُوحٍ",
    "englishName": "Nooh",
    "banglaName": "সূরা নূহ",
    "englishMeaning": "Noah",
    "numberOfAyahs": 28,
    "revelationType": "Meccan"
  },
  {
    "number": 72,
    "name": "سُورَةُ الجِنِّ",
    "englishName": "Al-Jinn",
    "banglaName": "সূরা আল-জিন",
    "englishMeaning": "The Jinn",
    "numberOfAyahs": 28,
    "revelationType": "Meccan"
  },
  {
    "number": 73,
    "name": "سُورَةُ المُزَّمِّلِ",
    "englishName": "Al-Muzzammil",
    "banglaName": "সূরা আল-মুজ্জাম্মিল",
    "englishMeaning": "The Enshrouded One",
    "numberOfAyahs": 20,
    "revelationType": "Meccan"
  },
  {
    "number": 74,
    "name": "سُورَةُ المُدَّثِّرِ",
    "englishName": "Al-Muddaththir",
    "banglaName": "সূরা আল-মুদ্দাসসির",
    "englishMeaning": "The Cloaked One",
    "numberOfAyahs": 56,
    "revelationType": "Meccan"
  },
  {
    "number": 75,
    "name": "سُورَةُ القِيَامَةِ",
    "englishName": "Al-Qiyaama",
    "banglaName": "সূরা আল-কিয়ামাহ",
    "englishMeaning": "The Resurrection",
    "numberOfAyahs": 40,
    "revelationType": "Meccan"
  },
  {
    "number": 76,
    "name": "سُورَةُ الإِنسَانِ",
    "englishName": "Al-Insaan",
    "banglaName": "সূরা আল-ইনসান",
    "englishMeaning": "Man",
    "numberOfAyahs": 31,
    "revelationType": "Medinan"
  },
  {
    "number": 77,
    "name": "سُورَةُ المُرۡسَلَاتِ",
    "englishName": "Al-Mursalaat",
    "banglaName": "সূরা আল-মুরসালাت",
    "englishMeaning": "The Emissaries",
    "numberOfAyahs": 50,
    "revelationType": "Meccan"
  },
  {
    "number": 78,
    "name": "سُورَةُ النَّبَإِ",
    "englishName": "An-Naba",
    "banglaName": "সূরা আন-নাবা",
    "englishMeaning": "The Announcement",
    "numberOfAyahs": 40,
    "revelationType": "Meccan"
  },
  {
    "number": 79,
    "name": "سُورَةُ النَّازِعَاتِ",
    "englishName": "An-Naazi'aat",
    "banglaName": "সূরা আন-নাযিয়াত",
    "englishMeaning": "Those who drag forth",
    "numberOfAyahs": 46,
    "revelationType": "Meccan"
  },
  {
    "number": 80,
    "name": "سُورَةُ عَبَسَ",
    "englishName": "Abasa",
    "banglaName": "সূরা আবাসা",
    "englishMeaning": "He frowned",
    "numberOfAyahs": 42,
    "revelationType": "Meccan"
  },
  {
    "number": 81,
    "name": "سُورَةُ التَّكۡوِيرِ",
    "englishName": "At-Takwir",
    "banglaName": "সূরা আত-তাকভীর",
    "englishMeaning": "The Overthrowing",
    "numberOfAyahs": 29,
    "revelationType": "Meccan"
  },
  {
    "number": 82,
    "name": "سُورَةُ الانفِطَارِ",
    "englishName": "Al-Infitaar",
    "banglaName": "সূরা আল-ইনফিতার",
    "englishMeaning": "The Cleaving",
    "numberOfAyahs": 19,
    "revelationType": "Meccan"
  },
  {
    "number": 83,
    "name": "سُورَةُ المُطَفِّفِينَ",
    "englishName": "Al-Mutaffifin",
    "banglaName": "সূরা আল-মুতাফফিফীন",
    "englishMeaning": "Defrauding",
    "numberOfAyahs": 36,
    "revelationType": "Meccan"
  },
  {
    "number": 84,
    "name": "سُورَةُ الانشِقَاقِ",
    "englishName": "Al-Inshiqaaq",
    "banglaName": "সূরা আল-ইনশিকাক",
    "englishMeaning": "The Splitting Open",
    "numberOfAyahs": 25,
    "revelationType": "Meccan"
  },
  {
    "number": 85,
    "name": "سُورَةُ البُرُوجِ",
    "englishName": "Al-Burooj",
    "banglaName": "সূরা আল-বুরূজ",
    "englishMeaning": "The Constellations",
    "numberOfAyahs": 22,
    "revelationType": "Meccan"
  },
  {
    "number": 86,
    "name": "سُورَةُ الطَّارِقِ",
    "englishName": "At-Taariq",
    "banglaName": "সূরা আত-তারিক",
    "englishMeaning": "The Morning Star",
    "numberOfAyahs": 17,
    "revelationType": "Meccan"
  },
  {
    "number": 87,
    "name": "سُورَةُ الأَعۡلَىٰ",
    "englishName": "Al-A'laa",
    "banglaName": "সূরা আল-আলা",
    "englishMeaning": "The Most High",
    "numberOfAyahs": 19,
    "revelationType": "Meccan"
  },
  {
    "number": 88,
    "name": "سُورَةُ الغَاشِيَةِ",
    "englishName": "Al-Ghaashiya",
    "banglaName": "সূরা আল-গাশিয়াহ",
    "englishMeaning": "The Overwhelming",
    "numberOfAyahs": 26,
    "revelationType": "Meccan"
  },
  {
    "number": 89,
    "name": "سُورَةُ الفَجۡرِ",
    "englishName": "Al-Fajr",
    "banglaName": "সূরা আল-ফজর",
    "englishMeaning": "The Dawn",
    "numberOfAyahs": 30,
    "revelationType": "Meccan"
  },
  {
    "number": 90,
    "name": "سُورَةُ البَلَدِ",
    "englishName": "Al-Balad",
    "banglaName": "সূরা আল-বালাদ",
    "englishMeaning": "The City",
    "numberOfAyahs": 20,
    "revelationType": "Meccan"
  },
  {
    "number": 91,
    "name": "سُورَةُ الشَّمۡسِ",
    "englishName": "Ash-Shams",
    "banglaName": "সূরা আশ-শামস",
    "englishMeaning": "The Sun",
    "numberOfAyahs": 15,
    "revelationType": "Meccan"
  },
  {
    "number": 92,
    "name": "سُورَةُ اللَّيۡلِ",
    "englishName": "Al-Lail",
    "banglaName": "সূরা আল-লাইল",
    "englishMeaning": "The Night",
    "numberOfAyahs": 21,
    "revelationType": "Meccan"
  },
  {
    "number": 93,
    "name": "سُورَةُ الضُّحَىٰ",
    "englishName": "Ad-Dhuhaa",
    "banglaName": "সূরা আদ-দুহা",
    "englishMeaning": "The Morning Hours",
    "numberOfAyahs": 11,
    "revelationType": "Meccan"
  },
  {
    "number": 94,
    "name": "سُورَةُ الشَّرۡحِ",
    "englishName": "Ash-Sharh",
    "banglaName": "সূরা আলাম নাশরাহ",
    "englishMeaning": "The Consolation",
    "numberOfAyahs": 8,
    "revelationType": "Meccan"
  },
  {
    "number": 95,
    "name": "سُورَةُ التِّينِ",
    "englishName": "At-Tin",
    "banglaName": "সূরা আত-তীন",
    "englishMeaning": "The Fig",
    "numberOfAyahs": 8,
    "revelationType": "Meccan"
  },
  {
    "number": 96,
    "name": "سُورَةُ العَلَقِ",
    "englishName": "Al-Alaq",
    "banglaName": "সূরা আল-আলাক",
    "englishMeaning": "The Clot",
    "numberOfAyahs": 19,
    "revelationType": "Meccan"
  },
  {
    "number": 97,
    "name": "سُورَةُ القَدۡرِ",
    "englishName": "Al-Qadr",
    "banglaName": "সূরা আল-কদর",
    "englishMeaning": "The Power, Fate",
    "numberOfAyahs": 5,
    "revelationType": "Meccan"
  },
  {
    "number": 98,
    "name": "سُورَةُ البَيِّنَةِ",
    "englishName": "Al-Bayyina",
    "banglaName": "সূরা আল-বাইয়্যিনাহ",
    "englishMeaning": "The Evidence",
    "numberOfAyahs": 8,
    "revelationType": "Medinan"
  },
  {
    "number": 99,
    "name": "سُورَةُ الزَّلۡزَلَةِ",
    "englishName": "Az-Zalzala",
    "banglaName": "সূরা আজ-জিলজাল",
    "englishMeaning": "The Earthquake",
    "numberOfAyahs": 8,
    "revelationType": "Medinan"
  },
  {
    "number": 100,
    "name": "سُورَةُ العَادِيَاتِ",
    "englishName": "Al-Aadiyaat",
    "banglaName": "সূরা আল-আদিয়াত",
    "englishMeaning": "The Chargers",
    "numberOfAyahs": 11,
    "revelationType": "Meccan"
  },
  {
    "number": 101,
    "name": "سُورَةُ القَارِعَةِ",
    "englishName": "Al-Qaari'a",
    "banglaName": "সূরা আল-কারিয়াহ",
    "englishMeaning": "The Calamity",
    "numberOfAyahs": 11,
    "revelationType": "Meccan"
  },
  {
    "number": 102,
    "name": "سُورَةُ التَّكَاثُرِ",
    "englishName": "At-Takaathur",
    "banglaName": "সূরা আত-তাকাসুর",
    "englishMeaning": "Competition",
    "numberOfAyahs": 8,
    "revelationType": "Meccan"
  },
  {
    "number": 103,
    "name": "سُورَةُ العَصۡرِ",
    "englishName": "Al-Asr",
    "banglaName": "সূরা আল-আসর",
    "englishMeaning": "The Declining Day, Epoch",
    "numberOfAyahs": 3,
    "revelationType": "Meccan"
  },
  {
    "number": 104,
    "name": "سُورَةُ الهُمَزَةِ",
    "englishName": "Al-Humaza",
    "banglaName": "সূরা আল-হুমাযাহ",
    "englishMeaning": "The Traducer",
    "numberOfAyahs": 9,
    "revelationType": "Meccan"
  },
  {
    "number": 105,
    "name": "سُورَةُ الفِيلِ",
    "englishName": "Al-Fil",
    "banglaName": "সূরা আল-ফীল",
    "englishMeaning": "The Elephant",
    "numberOfAyahs": 5,
    "revelationType": "Meccan"
  },
  {
    "number": 106,
    "name": "سُورَةُ قُرَيۡشٍ",
    "englishName": "Quraish",
    "banglaName": "সূরা কুরাইশ",
    "englishMeaning": "Quraysh",
    "numberOfAyahs": 4,
    "revelationType": "Meccan"
  },
  {
    "number": 107,
    "name": "سُورَةُ المَاعُونِ",
    "englishName": "Al-Maa'un",
    "banglaName": "সূরা আল-মাউন",
    "englishMeaning": "Almsgiving",
    "numberOfAyahs": 7,
    "revelationType": "Meccan"
  },
  {
    "number": 108,
    "name": "سُورَةُ الكَوۡثَرِ",
    "englishName": "Al-Kawthar",
    "banglaName": "সূরা আল-কাউসার",
    "englishMeaning": "Abundance",
    "numberOfAyahs": 3,
    "revelationType": "Meccan"
  },
  {
    "number": 109,
    "name": "سُورَةُ الكَافِرُونَ",
    "englishName": "Al-Kaafiroon",
    "banglaName": "সূরা আল-কাফিরুন",
    "englishMeaning": "The Disbelievers",
    "numberOfAyahs": 6,
    "revelationType": "Meccan"
  },
  {
    "number": 110,
    "name": "سُورَةُ النَّصۡرِ",
    "englishName": "An-Nasr",
    "banglaName": "সূরা আন-নসর",
    "englishMeaning": "Divine Support",
    "numberOfAyahs": 3,
    "revelationType": "Medinan"
  },
  {
    "number": 111,
    "name": "سُورَةُ المَسَدِ",
    "englishName": "Al-Masad",
    "banglaName": "সূরা আল-মাসাদ",
    "englishMeaning": "The Palm Fibre",
    "numberOfAyahs": 5,
    "revelationType": "Meccan"
  },
  {
    "number": 112,
    "name": "سُورَةُ الإِخۡلَاصِ",
    "englishName": "Al-Ikhlaas",
    "banglaName": "সূরা আল-ইখলাস",
    "englishMeaning": "Sincerity",
    "numberOfAyahs": 4,
    "revelationType": "Meccan"
  },
  {
    "number": 113,
    "name": "سُورَةُ الفَلَقِ",
    "englishName": "Al-Falaq",
    "banglaName": "সূরা আল-ফালাক",
    "englishMeaning": "The Dawn",
    "numberOfAyahs": 5,
    "revelationType": "Meccan"
  },
  {
    "number": 114,
    "name": "سُورَةُ النَّاسِ",
    "englishName": "An-Naas",
    "banglaName": "সূরা আন-নাস",
    "englishMeaning": "Mankind",
    "numberOfAyahs": 6,
    "revelationType": "Meccan"
  }
];
