// Core types and basic templates only

export interface EvidenceTemplate {
  kpiNumber: number
  shCode: string
  kpiTitle: string
  requiredEvidences: {
    type: 'required' | 'optional' | 'recommended'
    fileName: string
    fileType: string[]
    description: string
    category: string
  }[]
  aiAnalysisMethods: string[]
  sampleNaming: string[]
  validationRules: {
    requiredFields: string[]
    fileSize: { min: number; max: number }
    timeframe: string
  }
}

// Basic templates for first 10 KPIs
export const CORE_EVIDENCE_TEMPLATES: EvidenceTemplate[] = [
  // SH1.1 - Farkındalık artış oranı
  {
    kpiNumber: 1,
    shCode: 'SH1.1',
    kpiTitle: 'Farkındalık artış oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.1_on_anket_ham_verisi',
        fileType: ['CSV', 'XLSX'],
        description: 'Ön anket ham verisi',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH1.1_son_anket_ham_verisi',
        fileType: ['CSV', 'XLSX'],
        description: 'Son anket ham verisi',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Örneklem/yanıt yanlılığını kontrol',
      'Ön-son t-testi',
      'Etki büyüklüğü (Cohen d)'
    ],
    sampleNaming: [
      'SH1.1_on_anket_2024Q4.csv',
      'SH1.1_son_anket_2024Q4.csv'
    ],
    validationRules: {
      requiredFields: ['firmIdHash', 'nace4d', 'province'],
      fileSize: { min: 1024, max: 10 * 1024 * 1024 },
      timeframe: 'Ön ve son anket arasında min 3 ay fark olmalı'
    }
  },

  // SH1.1 - Ortak farkındalık etkinliği
  {
    kpiNumber: 2,
    shCode: 'SH1.1',
    kpiTitle: 'Ortak farkındalık etkinliği düzenlenen kilit kurum sayısı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH1.1_etkinlik_takvimi',
        fileType: ['XLSX', 'CSV'],
        description: 'Takvim/etkinlik kayıtları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH1.1_protokoller_mou',
        fileType: ['PDF'],
        description: 'Protokoller/MoU belgeleri',
        category: 'CERTIFICATE'
      }
    ],
    aiAnalysisMethods: [
      'Kurum eşleşmesi (ad eşleme)',
      'Çift kayıt temizliği',
      'Benzersiz kurum sayımı'
    ],
    sampleNaming: [
      'SH1.1_etkinlik_takvimi_2024Q4.xlsx',
      'SH1.1_protokoller_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['kurumAdi', 'sektorKodu', 'etkinlikTarihi'],
      fileSize: { min: 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Etkinlikler dönem içinde gerçekleşmiş olmalı'
    }
  },

  // SH2.1 - Kârlılık oranı
  {
    kpiNumber: 11,
    shCode: 'SH2.1',
    kpiTitle: 'Kârlılık oranı',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH2.1_gelir_tablosu',
        fileType: ['XLSX', 'PDF'],
        description: 'Gelir tablosu (aylık/çeyreklik)',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH2.1_faaliyet_raporu',
        fileType: ['PDF', 'DOCX'],
        description: 'Faaliyet raporu',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Net/operasyonel kârlılık hesabı',
      'Mevsimsellik arındırma',
      'Sektör bazlı benchmark'
    ],
    sampleNaming: [
      'SH2.1_gelir_tablosu_2024Q4.xlsx',
      'SH2.1_faaliyet_raporu_2024Q4.pdf'
    ],
    validationRules: {
      requiredFields: ['donem', 'gelir', 'gider', 'netKar'],
      fileSize: { min: 10 * 1024, max: 10 * 1024 * 1024 },
      timeframe: 'Son 4 çeyrek verisi gerekli'
    }
  },

  // SH3.3 - OEE
  {
    kpiNumber: 22,
    shCode: 'SH3.3',
    kpiTitle: 'Genel Ekipman Etkinliği (OEE)',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH3.3_mes_scada_logs',
        fileType: ['CSV', 'JSON'],
        description: 'MES/SCADA logları',
        category: 'LOG'
      },
      {
        type: 'required',
        fileName: 'SH3.3_vardiya_durus',
        fileType: ['XLSX', 'CSV'],
        description: 'Vardiya duruş kayıtları',
        category: 'LOG'
      }
    ],
    aiAnalysisMethods: [
      'OEE=K×P×K hesabı',
      'Kayıp ağacı analizi',
      'Sektör referanslarıyla gap analizi'
    ],
    sampleNaming: [
      'SH3.3_mes_logs_2024Q4.csv',
      'SH3.3_vardiya_durus_2024Q4.xlsx'
    ],
    validationRules: {
      requiredFields: ['makineId', 'tarih', 'planlananSure', 'calisanSure'],
      fileSize: { min: 10 * 1024, max: 100 * 1024 * 1024 },
      timeframe: 'Günlük veri, minimum 1 ay'
    }
  },

  // SH4.3 - Müdahale sonrası verimlilik artışı
  {
    kpiNumber: 32,
    shCode: 'SH4.3',
    kpiTitle: 'Müdahale sonrası ortalama verimlilik artışı (%)',
    requiredEvidences: [
      {
        type: 'required',
        fileName: 'SH4.3_on_uretkenlik',
        fileType: ['XLSX', 'CSV'],
        description: 'Ön üretkenlik ölçümleri',
        category: 'REPORT'
      },
      {
        type: 'required',
        fileName: 'SH4.3_son_uretkenlik',
        fileType: ['XLSX', 'CSV'],
        description: 'Son üretkenlik ölçümleri',
        category: 'REPORT'
      }
    ],
    aiAnalysisMethods: [
      'Ön-son fark (bağlam değişkenleriyle normalize)',
      'Sektörel kıyas',
      'İstatistiksel anlamlılık testi'
    ],
    sampleNaming: [
      'SH4.3_on_uretkenlik_2024Q3.xlsx',
      'SH4.3_son_uretkenlik_2024Q4.xlsx'
    ],
    validationRules: {
      requiredFields: ['olcumTarihi', 'saatBasiCikti'],
      fileSize: { min: 5 * 1024, max: 25 * 1024 * 1024 },
      timeframe: 'Müdahale öncesi/sonrası min 4 hafta veri'
    }
  }
]

// KPI numarasına göre template al
export function getCoreEvidenceTemplate(kpiNumber: number): EvidenceTemplate | undefined {
  return CORE_EVIDENCE_TEMPLATES.find(template => template.kpiNumber === kpiNumber)
}

// Dosya adı önerisi oluştur
export function generateEvidenceFileName(
  shCode: string, 
  evidenceType: string, 
  period: string, 
  extension: string = 'xlsx'
): string {
  const sanitizedType = evidenceType.toLowerCase().replace(/[^a-z0-9]/g, '_')
  return `${shCode}_${sanitizedType}_${period}.${extension}`
}

// Validasyon kurallarını kontrol et
export function validateEvidenceFile(
  file: File, 
  template: EvidenceTemplate, 
  metadata: any
): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Dosya boyutu kontrolü
  if (file.size < template.validationRules.fileSize.min) {
    errors.push(`Dosya boyutu çok küçük (min: ${template.validationRules.fileSize.min} bytes)`)
  }
  if (file.size > template.validationRules.fileSize.max) {
    errors.push(`Dosya boyutu çok büyük (max: ${template.validationRules.fileSize.max} bytes)`)
  }
  
  // Gerekli alanlar kontrolü
  for (const field of template.validationRules.requiredFields) {
    if (!metadata[field] || metadata[field] === '') {
      errors.push(`Gerekli alan eksik: ${field}`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
