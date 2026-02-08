/**
 * BHUTAN PREDEFINED DATA
 *
 * Contains all 20 districts of Bhutan and predefined schools data.
 * This data will be seeded into the database during initial setup.
 */

export const bhutanDistricts = [
  {
    id: "district-thimphu",
    name: "Thimphu",
    nameDzongkha: "ཐིམ་ཕུ་",
    code: "TH",
    isCity: true,
    isActive: true,
  },
  {
    id: "district-paro",
    name: "Paro",
    nameDzongkha: "སྤ་རོ་",
    code: "PA",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-punakha",
    name: "Punakha",
    nameDzongkha: "སྤུ་ན་ཁ་",
    code: "PU",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-wangdue-phodrang",
    name: "Wangdue Phodrang",
    nameDzongkha: "དབང་འདུས་ཕོ་བྲང་",
    code: "WP",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-gasa",
    name: "Gasa",
    nameDzongkha: "མགར་ས་",
    code: "GA",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-dagana",
    name: "Dagana",
    nameDzongkha: "ལྡག་ན་",
    code: "DG",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-tsirang",
    name: "Tsirang",
    nameDzongkha: "རྩི་རང་",
    code: "TR",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-sarpang",
    name: "Sarpang",
    nameDzongkha: "གསར་སྤང་",
    code: "SP",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-zhemgang",
    name: "Zhemgang",
    nameDzongkha: "གཞམས་སྒང་",
    code: "ZH",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-trongsa",
    name: "Trongsa",
    nameDzongkha: "ཀྲོང་གསར་",
    code: "TY",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-bumthang",
    name: "Bumthang",
    nameDzongkha: "བུམ་ཐང་",
    code: "BU",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-mongar",
    name: "Mongar",
    nameDzongkha: "མོང་སྒར་",
    code: "MO",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-lhuentse",
    name: "Lhuentse",
    nameDzongkha: "ལྷུན་ཙེ་",
    code: "LH",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-trashigang",
    name: "Trashigang",
    nameDzongkha: "བཀྲ་ཤིས་སྒང་",
    code: "TT",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-trashiyangtse",
    name: "Trashiyangtse",
    nameDzongkha: "བཀྲ་ཤིས་གཡང་རྩེ་",
    code: "TY",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-samdrup-jongkhar",
    name: "Samdrup Jongkhar",
    nameDzongkha: "བསམ་གྲུབ་ལྗོངས་མཁར་",
    code: "SJ",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-pema-gatshel",
    name: "Pema Gatshel",
    nameDzongkha: "པདྨ་གདྲེལ་",
    code: "PG",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-samtse",
    name: "Samtse",
    nameDzongkha: "སམཚ་རྩེ་",
    code: "SA",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-chukha",
    name: "Chukha",
    nameDzongkha: "ཆུ་ཁ་",
    code: "CH",
    isCity: false,
    isActive: true,
  },
  {
    id: "district-haa",
    name: "Haa",
    nameDzongkha: "ཧ་ཨ",
    code: "HA",
    isCity: false,
    isActive: true,
  },
] as const;

/**
 * Major Schools in Bhutan
 * This is a representative list. In production, this should include all schools.
 */
export const bhutanSchools = [
  // THIMPHU DISTRICT
  {
    id: "school-thimphu-hss",
    districtId: "district-thimphu",
    name: "Thimphu Higher Secondary School",
    code: "THIMPHU-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Thimphu, Bhutan",
  },
  {
    id: "school-yangchenphug-hss",
    districtId: "district-thimphu",
    name: "Yangchenphug Higher Secondary School",
    code: "YANGCHENPHUG-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Yangchenphug, Thimphu",
  },
  {
    id: "school-motithang-hss",
    districtId: "district-thimphu",
    name: "Motithang Higher Secondary School",
    code: "MOTITHANG-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Motithang, Thimphu",
  },
  {
    id: "school-losel-kyetsal",
    districtId: "district-thimphu",
    name: "Losel Kyetsal MSS",
    code: "LOSEL-KYETSAL-MSS",
    schoolType: "MSS",
    level: "VII-X",
    address: "Thimphu, Bhutan",
  },
  {
    id: "school-zilukha-mss",
    districtId: "district-thimphu",
    name: "Zilukha Middle Secondary School",
    code: "ZILUKHA-MSS",
    schoolType: "MSS",
    level: "VII-X",
    address: "Zilukha, Thimphu",
  },

  // PARO DISTRICT
  {
    id: "school-paro-hss",
    districtId: "district-paro",
    name: "Paro Higher Secondary School",
    code: "PARO-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Paro, Bhutan",
  },
  {
    id: "school-shaba-hss",
    districtId: "district-paro",
    name: "Shaba Higher Secondary School",
    code: "SHABA-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Shaba, Paro",
  },
  {
    id: "school-lungtenphug-mss",
    districtId: "district-paro",
    name: "Lungtenphug Middle Secondary School",
    code: "LUNGTENPHUG-MSS",
    schoolType: "MSS",
    level: "VII-X",
    address: "Paro, Bhutan",
  },

  // PUNAKHA DISTRICT
  {
    id: "school-punakha-hss",
    districtId: "district-punakha",
    name: "Punakha Higher Secondary School",
    code: "PUNAKHA-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Punakha, Bhutan",
  },
  {
    id: "school-khuruthang-mss",
    districtId: "district-punakha",
    name: "Khuruthang Middle Secondary School",
    code: "KHURUTHANG-MSS",
    schoolType: "MSS",
    level: "VII-X",
    address: "Khuruthang, Punakha",
  },

  // WANGDUE PHODRANG DISTRICT
  {
    id: "school-wangdue-hss",
    districtId: "district-wangdue-phodrang",
    name: "Wangdue Higher Secondary School",
    code: "WANGDUE-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Wangdue Phodrang, Bhutan",
  },
  {
    id: "school-bajothang-hss",
    districtId: "district-wangdue-phodrang",
    name: "Bajothang Higher Secondary School",
    code: "BAJOTHANG-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Wangdue Phodrang, Bhutan",
  },

  // TRONGSA DISTRICT
  {
    id: "school-trongsa-hss",
    districtId: "district-trongsa",
    name: "Trongsa Higher Secondary School",
    code: "TRONGSA-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Trongsa, Bhutan",
  },

  // BUMTHANG DISTRICT
  {
    id: "school-jakar-hss",
    districtId: "district-bumthang",
    name: "Jakar Higher Secondary School",
    code: "JAKAR-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Jakar, Bumthang",
  },
  {
    id: "school-urmchen-mss",
    districtId: "district-bumthang",
    name: "Urmchen Middle Secondary School",
    code: "URMCHEN-MSS",
    schoolType: "MSS",
    level: "VII-X",
    address: "Bumthang, Bhutan",
  },

  // MONGAR DISTRICT
  {
    id: "school-mongar-hss",
    districtId: "district-mongar",
    name: "Mongar Higher Secondary School",
    code: "MONGAR-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Mongar, Bhutan",
  },
  {
    id: "school-yurung-kash-hss",
    districtId: "district-mongar",
    name: "Yurungkash Higher Secondary School",
    code: "YURUNGKASH-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Mongar, Bhutan",
  },

  // TRASHIGANG DISTRICT
  {
    id: "school-trashigang-hss",
    districtId: "district-trashigang",
    name: "Trashigang Higher Secondary School",
    code: "TRASHIGANG-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Trashigang, Bhutan",
  },
  {
    id: "school-kanglung-hss",
    districtId: "district-trashigang",
    name: "Kanglung Higher Secondary School",
    code: "KANGLUNG-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Kanglung, Trashigang",
  },
  {
    id: "school-rising-star-mss",
    districtId: "district-trashigang",
    name: "Rising Star Middle Secondary School",
    code: "RISING-STAR-MSS",
    schoolType: "MSS",
    level: "VII-X",
    address: "Trashigang, Bhutan",
  },

  // SAMDRUP JONGKHAR DISTRICT
  {
    id: "school-samdrup-jongkhar-hss",
    districtId: "district-samdrup-jongkhar",
    name: "Samdrup Jongkhar Higher Secondary School",
    code: "SAMDRUP-JONGKHAR-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Samdrup Jongkhar, Bhutan",
  },
  {
    id: "school-jomotsangkha-mss",
    districtId: "district-samdrup-jongkhar",
    name: "Jomotsangkha Middle Secondary School",
    code: "JOMOTSANGKHA-MSS",
    schoolType: "MSS",
    level: "VII-X",
    address: "Samdrup Jongkhar, Bhutan",
  },

  // SARPANG DISTRICT
  {
    id: "school-sarpang-hss",
    districtId: "district-sarpang",
    name: "Sarpang Higher Secondary School",
    code: "SARPANG-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Sarpang, Bhutan",
  },
  {
    id: "school-gelephu-hss",
    districtId: "district-sarpang",
    name: "Gelephu Higher Secondary School",
    code: "GELEPHU-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Gelephu, Sarpang",
  },

  // CHUKHA DISTRICT
  {
    id: "school-phuentsholing-hss",
    districtId: "district-chukha",
    name: "Phuentsholing Higher Secondary School",
    code: "PHUENTSHOLING-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Phuentsholing, Chukha",
  },
  {
    id: "school-chukha-hss",
    districtId: "district-chukha",
    name: "Chukha Higher Secondary School",
    code: "CHUKHA-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Chukha, Bhutan",
  },

  // SAMTSE DISTRICT
  {
    id: "school-samtse-hss",
    districtId: "district-samtse",
    name: "Samtse Higher Secondary School",
    code: "SAMTSE-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Samtse, Bhutan",
  },
  {
    id: "school-yoeseltse-mss",
    districtId: "district-samtse",
    name: "Yoeseltse Middle Secondary School",
    code: "YOESELTSE-MSS",
    schoolType: "MSS",
    level: "VII-X",
    address: "Samtse, Bhutan",
  },

  // TSIRANG DISTRICT
  {
    id: "school-tsirang-hss",
    districtId: "district-tsirang",
    name: "Tsirang Higher Secondary School",
    code: "TSIRANG-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Tsirang, Bhutan",
  },
  {
    id: "school-damphu-hss",
    districtId: "district-tsirang",
    name: "Damphu Higher Secondary School",
    code: "DAMPHU-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Damphu, Tsirang",
  },

  // DAGANA DISTRICT
  {
    id: "school-dagana-hss",
    districtId: "district-dagana",
    name: "Dagana Higher Secondary School",
    code: "DAGANA-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Dagana, Bhutan",
  },

  // ZHEMGANG DISTRICT
  {
    id: "school-zhemgang-hss",
    districtId: "district-zhemgang",
    name: "Zhemgang Higher Secondary School",
    code: "ZHEMGANG-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Zhemgang, Bhutan",
  },

  // TRASHIYANGTSE DISTRICT
  {
    id: "school-trashiyangtse-hss",
    districtId: "district-trashiyangtse",
    name: "Trashiyangtse Higher Secondary School",
    code: "TRASHIYANGTSE-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Trashiyangtse, Bhutan",
  },

  // LHUENTSE DISTRICT
  {
    id: "school-lhuentse-hss",
    districtId: "district-lhuentse",
    name: "Lhuentse Higher Secondary School",
    code: "LHUENTSE-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Lhuentse, Bhutan",
  },

  // PEMA GATSHEL DISTRICT
  {
    id: "school-pema-gatshel-hss",
    districtId: "district-pema-gatshel",
    name: "Pema Gatshel Higher Secondary School",
    code: "PEMA-GATSHEL-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Pema Gatshel, Bhutan",
  },

  // HAA DISTRICT
  {
    id: "school-haa-hss",
    districtId: "district-haa",
    name: "Haa Higher Secondary School",
    code: "HAA-HSS",
    schoolType: "HSS",
    level: "PP-XII",
    address: "Haa, Bhutan",
  },

  // GASA DISTRICT
  {
    id: "school-gasa-mss",
    districtId: "district-gasa",
    name: "Gasa Middle Secondary School",
    code: "GASA-MSS",
    schoolType: "MSS",
    level: "VII-X",
    address: "Gasa, Bhutan",
  },

  // PRIVATE SCHOOLS
  {
    id: "school-rtc-bhutan",
    districtId: "district-thimphu",
    name: "Royal Thimphu College",
    code: "RTC",
    schoolType: "Private",
    level: "XI-XII",
    address: "Thimphu, Bhutan",
  },
  {
    id: "school-yeshey-privat",
    districtId: "district-paro",
    name: "Yeshey Private Higher Secondary School",
    code: "YESHEY-PRIVATE",
    schoolType: "Private",
    level: "PP-XII",
    address: "Paro, Bhutan",
  },
  {
    id: "school-druk-school",
    districtId: "district-thimphu",
    name: "Druk School",
    code: "DRUK-SCHOOL",
    schoolType: "Private",
    level: "PP-X",
    address: "Thimphu, Bhutan",
  },
  {
    id: "school-ulo-academy",
    districtId: "district-paro",
    name: "Utpal Academy",
    code: "UTPAL-ACADEMY",
    schoolType: "Private",
    level: "PP-XII",
    address: "Paro, Bhutan",
  },
] as const;

/**
 * RUB (Royal University of Bhutan) Colleges
 */
export const rubColleges = [
  {
    id: "college-cn",
    name: "College of Natural Resources",
    code: "CNR",
    location: "Lobesa, Punakha",
    programs: ["BSc in Agriculture", "BSc in Animal Science", "BSc in Forestry"],
  },
  {
    id: "college-ce",
    name: "College of Science and Technology",
    code: "CST",
    location: "Rinchending, Chukha",
    programs: ["B.E in Civil Engineering", "B.E in Electrical Engineering", "B.E in Electronics & Communication", "B.E in Information Technology", "B.E in Power Engineering"],
  },
  {
    id: "college-shbb",
    name: "Sherubtse College",
    code: "SC",
    location: "Kanglung, Trashigang",
    programs: ["BSc in Life Sciences", "BSc in Physical Sciences", "BA in English & Dzongkha", "BA in History", "BA in Economics & Political Science"],
  },
  {
    id: "college-gaed",
    name: "Gedu College of Business Studies",
    code: "GCBS",
    location: "Gedu, Chukha",
    programs: ["BBA", "B.Com"],
  },
  {
    id: "college-sce",
    name: "Samtse College of Education",
    code: "SCE",
    location: "Samtse",
    programs: ["B.Ed in Primary", "B.Ed in Secondary", "PGDE"],
  },
  {
    id: "college-pce",
    name: "Paro College of Education",
    code: "PCE",
    location: "Paro",
    programs: ["B.Ed in Primary", "B.Ed in Secondary", "PGDE"],
  },
  {
    id: "college-jc",
    name: "Jigme Singye Wangchuck School of Law",
    code: "JSWSL",
    location: "Pangbisa, Paro",
    programs: ["LL.B"],
  },
  {
    id: "college-yoezer",
    name: "Yoezer Drukchuma College of Language and Cultural Studies",
    code: "YCCLCS",
    location: "Taktse, Trongsa",
    programs: ["BA in Language and Culture", "Diploma in Language and Culture"],
  },
] as const;

/**
 * Seed function to initialize database with Bhutan data
 */
export async function seedBhutanData(db: any) {
  const now = Date.now();

  // Seed districts
  for (const district of bhutanDistricts) {
    await db.insert(districts).values({
      ...district,
      createdAt: now,
    }).onConflictDoNothing();
  }

  // Seed schools
  for (const school of bhutanSchools) {
    await db.insert(schools).values({
      ...school,
      tenantId: "default-tenant", // Should be replaced with actual tenant
      createdAt: now,
    }).onConflictDoNothing();
  }
}

// Export types for use in other files
export type BhutanDistrict = typeof bhutanDistricts[number];
export type BhutanSchool = typeof bhutanSchools[number];
export type RubCollege = typeof rubColleges[number];
