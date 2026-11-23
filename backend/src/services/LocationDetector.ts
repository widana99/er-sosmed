/**
 * LocationDetector
 * Automatically infers Indonesian city/region from social media bio, geotags,
 * or business address metadata.
 */

const KNOWN_CITIES: Record<string, string> = {
  // Jabodetabek
  jakarta: 'Jakarta',
  jaksel: 'Jakarta Selatan',
  jaktim: 'Jakarta Timur',
  jakbar: 'Jakarta Barat',
  jakpus: 'Jakarta Pusat',
  jakut: 'Jakarta Utara',
  bogor: 'Bogor',
  depok: 'Depok',
  tangerang: 'Tangerang',
  tangsel: 'Tangerang Selatan',
  bekasi: 'Bekasi',

  // Jawa Barat
  bandung: 'Bandung',
  cirebon: 'Cirebon',
  tasikmalaya: 'Tasikmalaya',
  sukabumi: 'Sukabumi',
  garut: 'Garut',
  karawang: 'Karawang',
  purwakarta: 'Purwakarta',
  cimahi: 'Cimahi',

  // Jawa Tengah & DIY
  semarang: 'Semarang',
  solo: 'Solo',
  surakarta: 'Surakarta',
  yogyakarta: 'Yogyakarta',
  jogja: 'Yogyakarta',
  magelang: 'Magelang',
  salatiga: 'Salatiga',
  pekalongan: 'Pekalongan',
  tegal: 'Tegal',
  purwokerto: 'Purwokerto',
  kudus: 'Kudus',

  // Jawa Timur
  surabaya: 'Surabaya',
  malang: 'Malang',
  batu: 'Batu',
  sidoarjo: 'Sidoarjo',
  gresik: 'Gresik',
  kediri: 'Kediri',
  madiun: 'Madiun',
  jember: 'Jember',
  banyuwangi: 'Banyuwangi',
  pasuruan: 'Pasuruan',
  probolinggo: 'Probolinggo',

  // Bali & Nusa Tenggara
  denpasar: 'Denpasar',
  bali: 'Bali',
  mataram: 'Lombok',
  lombok: 'Lombok',
  kupang: 'Kupang',

  // Sumatra
  medan: 'Medan',
  palembang: 'Palembang',
  padang: 'Padang',
  pekanbaru: 'Pekanbaru',
  batam: 'Batam',
  lampung: 'Lampung',
  bandarlampung: 'Bandar Lampung',
  aceh: 'Banda Aceh',
  jambi: 'Jambi',
  bengkulu: 'Bengkulu',
  bangka: 'Bangka Belitung',

  // Kalimantan
  balikpapan: 'Balikpapan',
  samarinda: 'Samarinda',
  banjarmasin: 'Banjarmasin',
  pontianak: 'Pontianak',
  palangkaraya: 'Palangka Raya',
  tarakan: 'Tarakan',

  // Sulawesi
  makassar: 'Makassar',
  manado: 'Manado',
  palu: 'Palu',
  kendari: 'Kendari',
  gorontalo: 'Gorontalo',

  // Maluku & Papua
  ambon: 'Ambon',
  jayapura: 'Jayapura',
  sorong: 'Sorong',
};

export class LocationDetector {
  /**
   * Infers city from biography text, business address JSON, or geotag strings.
   */
  static detect(params: {
    bio?: string;
    businessAddress?: string | Record<string, unknown>;
    cityName?: string;
    postLocations?: string[];
  }): string | undefined {
    const { bio = '', businessAddress, cityName, postLocations = [] } = params;

    // 1. Direct city_name from business profile
    if (cityName && typeof cityName === 'string' && cityName.trim()) {
      const clean = cityName.trim();
      const lower = clean.toLowerCase();
      for (const [key, val] of Object.entries(KNOWN_CITIES)) {
        if (lower.includes(key)) return val;
      }
      return clean;
    }

    // 2. Business address JSON (Instagram Business / Creator Accounts)
    if (businessAddress) {
      try {
        const parsed =
          typeof businessAddress === 'string'
            ? JSON.parse(businessAddress)
            : businessAddress;
        const bCity = parsed?.city_name || parsed?.city || '';
        if (bCity) {
          const lower = String(bCity).toLowerCase();
          for (const [key, val] of Object.entries(KNOWN_CITIES)) {
            if (lower.includes(key)) return val;
          }
          return String(bCity).trim();
        }
      } catch {
        // non-json address
      }
    }

    // 3. Pin / Location pattern in bio: "📍 Jakarta", "Base: Bandung", "Jakarta, ID"
    if (bio) {
      // Look for pin emoji or location keywords
      const pinMatch = bio.match(/(?:📍|📌|location:|base:|domisili:)\s*([a-zA-Z\s]+)/i);
      if (pinMatch?.[1]) {
        const target = pinMatch[1].trim().toLowerCase();
        for (const [key, val] of Object.entries(KNOWN_CITIES)) {
          if (target.includes(key)) return val;
        }
      }

      // Check whole bio text for known Indonesian cities
      const bioLower = bio.toLowerCase();
      for (const [key, val] of Object.entries(KNOWN_CITIES)) {
        // Word boundary match so "malang" doesn't match accidental substrings
        const regex = new RegExp(`\\b${key}\\b`, 'i');
        if (regex.test(bioLower)) {
          return val;
        }
      }
    }

    // 4. Geotags from recent posts
    for (const loc of postLocations) {
      if (!loc) continue;
      const lowerLoc = loc.toLowerCase();
      for (const [key, val] of Object.entries(KNOWN_CITIES)) {
        if (lowerLoc.includes(key)) return val;
      }
    }

    return undefined;
  }
}
