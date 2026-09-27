export type HadithBook = {
  id: string;
  folder: string;
  nameBn: string;
  nameEn: string;
  totalHadith: number;
  chapters: number;
  description: string;
  source: "bangla" | "extended";
  translationLanguage: "bn" | "en";
};

export const HADITH_BOOKS: HadithBook[] = [
  { id:"bukhari",folder:"Bukhari",nameBn:"সহীহ বুখারী",nameEn:"Sahih al-Bukhari",totalHadith:7563,chapters:97,description:"কুতুবে সিত্তার সর্বাধিক প্রসিদ্ধ সহীহ সংকলন।",source:"bangla",translationLanguage:"bn" },
  { id:"muslim",folder:"Muslim",nameBn:"সহীহ মুসলিম",nameEn:"Sahih Muslim",totalHadith:7453,chapters:56,description:"ইমাম মুসলিম (রহ.) সংকলিত প্রসিদ্ধ সহীহ গ্রন্থ।",source:"bangla",translationLanguage:"bn" },
  { id:"abudawud",folder:"AbuDaud",nameBn:"সুনানে আবু দাউদ",nameEn:"Sunan Abi Dawud",totalHadith:5274,chapters:43,description:"আহকাম ও ফিকহ বিষয়ক গুরুত্বপূর্ণ হাদীস সংকলন।",source:"bangla",translationLanguage:"bn" },
  { id:"tirmidhi",folder:"At-tirmizi",nameBn:"জামে আত-তিরমিযী",nameEn:"Jami at-Tirmidhi",totalHadith:3956,chapters:49,description:"হাদীসের মান ও ফিকহী মতামতসহ গুরুত্বপূর্ণ সংকলন।",source:"bangla",translationLanguage:"bn" },
  { id:"nasai",folder:"Al-Nasai",nameBn:"সুনানে নাসাঈ",nameEn:"Sunan an-Nasa'i",totalHadith:5761,chapters:51,description:"সুনান ধারার নির্ভরযোগ্য প্রধান গ্রন্থ।",source:"bangla",translationLanguage:"bn" },
  { id:"ibnmajah",folder:"Ibne-Mazah",nameBn:"সুনানে ইবনে মাজাহ",nameEn:"Sunan Ibn Majah",totalHadith:4341,chapters:37,description:"কুতুবে সিত্তার অন্যতম প্রসিদ্ধ সুনান গ্রন্থ।",source:"bangla",translationLanguage:"bn" },
  { id:"riyad",folder:"riyad_assalihin",nameBn:"রিয়াদুস সালিহীন",nameEn:"Riyad as-Salihin",totalHadith:1896,chapters:19,description:"আখলাক, আদব ও দৈনন্দিন আমলের নির্বাচিত হাদীসের প্রসিদ্ধ সংকলন।",source:"extended",translationLanguage:"en" },
  { id:"adab",folder:"aladab_almufrad",nameBn:"আল-আদাবুল মুফরাদ",nameEn:"Al-Adab al-Mufrad",totalHadith:1326,chapters:57,description:"ইমাম বুখারী (রহ.) সংকলিত ইসলামী আদব ও চরিত্রবিষয়ক গ্রন্থ।",source:"extended",translationLanguage:"en" },
  { id:"bulugh",folder:"bulugh_almaram",nameBn:"বুলুগুল মারাম",nameEn:"Bulugh al-Maram",totalHadith:1767,chapters:16,description:"ইবন হাজর আসকালানী (রহ.) সংকলিত আহকামের হাদীসসমূহ।",source:"extended",translationLanguage:"en" },
  { id:"malik",folder:"malik",nameBn:"মুয়াত্তা ইমাম মালিক",nameEn:"Muwatta Malik",totalHadith:1985,chapters:61,description:"ইমাম মালিক (রহ.) সংকলিত প্রাচীন ও গুরুত্বপূর্ণ হাদীস-ফিকহ গ্রন্থ।",source:"extended",translationLanguage:"bn" },
];

export type LiveHadith = {
  hadith_id: number;
  narrator: string;
  bn: string;
  ar: string;
  grade: string;
  note?: string | null;
};