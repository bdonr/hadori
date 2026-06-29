export interface Region {
  id: string;
  flag: string;
  label: string;
  lang: string; // primary language code
}

export const REGIONS: Region[] = [
  { id: "worldwide", flag: "🌍", label: "Weltweit",        lang: "any" },
  { id: "de",        flag: "🇩🇪", label: "Deutschland",    lang: "de"  },
  { id: "at",        flag: "🇦🇹", label: "Österreich",     lang: "de"  },
  { id: "ch",        flag: "🇨🇭", label: "Schweiz",        lang: "de"  },
  { id: "dach",      flag: "🇩🇪", label: "DACH",           lang: "de"  },
  { id: "us",        flag: "🇺🇸", label: "USA",            lang: "en"  },
  { id: "uk",        flag: "🇬🇧", label: "UK",             lang: "en"  },
  { id: "en_global", flag: "🌐", label: "English-speaking", lang: "en" },
  { id: "fr",        flag: "🇫🇷", label: "Frankreich",     lang: "fr"  },
  { id: "es",        flag: "🇪🇸", label: "Spanien",        lang: "es"  },
  { id: "tr",        flag: "🇹🇷", label: "Türkei",         lang: "tr"  },
  { id: "pl",        flag: "🇵🇱", label: "Polen",          lang: "pl"  },
  { id: "nl",        flag: "🇳🇱", label: "Niederlande",    lang: "nl"  },
  { id: "it",        flag: "🇮🇹", label: "Italien",        lang: "it"  },
  { id: "eu",        flag: "🇪🇺", label: "EU (allgemein)", lang: "any" },
  { id: "jp",        flag: "🇯🇵", label: "Japan",          lang: "ja"  },
  { id: "kr",        flag: "🇰🇷", label: "Südkorea",       lang: "ko"  },
  { id: "cn",        flag: "🇨🇳", label: "China",          lang: "zh"  },
  { id: "ru",        flag: "🇷🇺", label: "Russland",       lang: "ru"  },
  { id: "asia",      flag: "🌏", label: "Asien",           lang: "any" },
];

export const LANGUAGES = [
  { id: "de",  label: "Deutsch" },
  { id: "en",  label: "Englisch" },
  { id: "fr",  label: "Französisch" },
  { id: "es",  label: "Spanisch" },
  { id: "tr",  label: "Türkisch" },
  { id: "pl",  label: "Polnisch" },
  { id: "nl",  label: "Niederländisch" },
  { id: "it",  label: "Italienisch" },
  { id: "any", label: "Egal / Alle" },
];

export function getRegion(id: string): Region | undefined {
  return REGIONS.find(r => r.id === id);
}

/** Returns true if talent's region pref matches the role's region */
export function regionMatches(talentRegions: string[], roleRegion: string): boolean {
  if (talentRegions.includes("worldwide")) return true;
  if (roleRegion === "worldwide") return true;
  // DACH covers de, at, ch
  if (talentRegions.includes("dach") && ["de", "at", "ch"].includes(roleRegion)) return true;
  if (roleRegion === "dach" && talentRegions.some(r => ["dach", "de", "at", "ch"].includes(r))) return true;
  // en_global covers us, uk
  if (talentRegions.includes("en_global") && ["us", "uk"].includes(roleRegion)) return true;
  return talentRegions.includes(roleRegion);
}
