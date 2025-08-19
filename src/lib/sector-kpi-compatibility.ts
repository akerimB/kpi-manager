// Sektör-KPI uyumluluk kontrolü sistemi
// Hangi KPI'ların hangi sektörlerde mantıklı olduğunu kontrol eder

export interface SectorKPICompatibility {
  kpiNumbers: number[]
  shCodes: string[]
  compatibleSectors: string[]
  incompatibleSectors: string[]
  reasoning: string
  warningThreshold: number // 0-1, bu sektörde kaç oran evidence olunca uyarı ver
}

export const SECTOR_KPI_COMPATIBILITY_RULES: SectorKPICompatibility[] = [
  // OEE ve Makine Verimliliği - Sürekli üretim sektörlerinde mantıklı
  {
    kpiNumbers: [22, 23], // OEE, performans
    shCodes: ['SH3.3', 'SH3.4'],
    compatibleSectors: ['Metal', 'Otomotiv', 'Makine', 'Plastik', 'Kimya', 'Elektrikli'],
    incompatibleSectors: ['Gıda', 'Giyim', 'Mobilya', 'Tekstil'],
    reasoning: 'OEE sürekli makine üretimi yapan sektörlerde kritik. Gıda/tekstilde batch üretim daha yaygın.',
    warningThreshold: 0.3 // %30\'dan fazla gıda sektörü evidence varsa uyar
  },

  // Finansal KPI'lar - Yüksek cirolu sektörlerde daha kritik
  {
    kpiNumbers: [11, 12, 13, 15],
    shCodes: ['SH2.1', 'SH2.2', 'SH2.3'],
    compatibleSectors: ['Metal', 'Kimya', 'Otomotiv', 'Makine', 'Elektrikli', 'Plastik'],
    incompatibleSectors: [], // Tüm sektörlerde geçerli ama bazıları daha kritik
    reasoning: 'Finansal metrikler tüm sektörlerde önemli ama imalat yoğun sektörlerde daha kritik.',
    warningThreshold: 0.7 // %70 düşük cirolu sektör varsa uyar
  },

  // Eğitim/Farkındalık - Çok sektörlü olması normal
  {
    kpiNumbers: [1, 2, 3, 4, 5],
    shCodes: ['SH1.1', 'SH1.2'],
    compatibleSectors: ['*'], // Tüm sektörler
    incompatibleSectors: [],
    reasoning: 'Farkındalık ve eğitim KPI\'ları tüm sektörlerde uygulanabilir.',
    warningThreshold: 1.0 // Hiç uyarı verme
  },

  // Dijital Dönüşüm - Teknoloji sektörlerinde daha yoğun
  {
    kpiNumbers: [27], // Dijital platform kullanımı  
    shCodes: ['SH3.7'],
    compatibleSectors: ['Bilgisayar', 'Elektrikli', 'Otomotiv', 'Makine'],
    incompatibleSectors: ['Gıda', 'Tekstil', 'Giyim', 'Mobilya'],
    reasoning: 'Dijital platformlar teknik imalat sektörlerinde daha yaygın.',
    warningThreshold: 0.4
  },

  // Çevre/Yeşil KPI'lar - Enerji yoğun sektörlerde kritik
  {
    kpiNumbers: [7], // Karbon emisyonu azalışı
    shCodes: ['SH1.4'],
    compatibleSectors: ['Kimya', 'Metal', 'Plastik', 'Elektrikli'],
    incompatibleSectors: ['Giyim', 'Mobilya'],
    reasoning: 'Karbon emisyonu enerji/kimyasal yoğun sektörlerde daha kritik.',
    warningThreshold: 0.3
  },

  // AR-GE ve İnovasyon - Teknoloji yoğun sektörlerde mantıklı
  {
    kpiNumbers: [38, 39], // Üniversite işbirliği, ürün geliştirme
    shCodes: ['SH4.7'],
    compatibleSectors: ['Bilgisayar', 'Elektrikli', 'Kimya', 'Makine', 'Otomotiv'],
    incompatibleSectors: ['Gıda', 'Tekstil', 'Mobilya'],
    reasoning: 'AR-GE teknoloji geliştirme sektörlerinde daha yoğun.',
    warningThreshold: 0.5
  }
]

export interface SectorCompatibilityResult {
  isCompatible: boolean
  compatibilityScore: number // 0-100
  warnings: string[]
  suggestions: string[]
  sectorDistribution: {
    sector: string
    evidenceCount: number
    percentage: number
    compatibility: 'compatible' | 'neutral' | 'incompatible'
  }[]
}

export function analyzeSectorKPICompatibility(
  kpiNumber: number,
  shCode: string,
  sectorDistribution: { [sector: string]: number }
): SectorCompatibilityResult {
  
  const result: SectorCompatibilityResult = {
    isCompatible: true,
    compatibilityScore: 100,
    warnings: [],
    suggestions: [],
    sectorDistribution: []
  }

  // İlgili kuralı bul
  const rule = SECTOR_KPI_COMPATIBILITY_RULES.find(r => 
    r.kpiNumbers.includes(kpiNumber) || r.shCodes.includes(shCode)
  )

  if (!rule) {
    // Kural yoksa genel uyumluluk varsay
    result.compatibilityScore = 80
    return result
  }

  const totalEvidence = Object.values(sectorDistribution).reduce((sum, count) => sum + count, 0)
  
  if (totalEvidence === 0) {
    result.compatibilityScore = 50
    result.warnings.push('Henüz evidence bulunmuyor')
    return result
  }

  // Sektör dağılımını analiz et
  Object.entries(sectorDistribution).forEach(([sector, count]) => {
    const percentage = count / totalEvidence
    let compatibility: 'compatible' | 'neutral' | 'incompatible' = 'neutral'
    
    if (rule.compatibleSectors.includes('*') || rule.compatibleSectors.includes(sector)) {
      compatibility = 'compatible'
    } else if (rule.incompatibleSectors.includes(sector)) {
      compatibility = 'incompatible'
    }
    
    result.sectorDistribution.push({
      sector,
      evidenceCount: count,
      percentage: Math.round(percentage * 100),
      compatibility
    })
  })

  // Uyumsuzluk oranını hesapla
  const incompatibleEvidence = result.sectorDistribution
    .filter(s => s.compatibility === 'incompatible')
    .reduce((sum, s) => sum + s.evidenceCount, 0)
  
  const incompatibleRatio = incompatibleEvidence / totalEvidence

  // Skor hesaplama
  if (incompatibleRatio > rule.warningThreshold) {
    result.compatibilityScore = Math.max(30, 100 - (incompatibleRatio * 100))
    result.isCompatible = false
    
    result.warnings.push(
      `KPI ${kpiNumber} için %${Math.round(incompatibleRatio * 100)} uyumsuz sektör evidence var`
    )
    result.warnings.push(rule.reasoning)
    
    const incompatibleSectors = result.sectorDistribution
      .filter(s => s.compatibility === 'incompatible' && s.evidenceCount > 0)
      .map(s => s.sector)
    
    if (incompatibleSectors.length > 0) {
      result.warnings.push(
        `Uyumsuz sektörler: ${incompatibleSectors.join(', ')}`
      )
    }
    
    // Öneriler
    const compatibleSectors = rule.compatibleSectors.filter(s => s !== '*')
    if (compatibleSectors.length > 0) {
      result.suggestions.push(
        `Bu KPI için daha uygun sektörler: ${compatibleSectors.join(', ')}`
      )
    }
    
    if (kpiNumber === 22 && incompatibleSectors.includes('Gıda')) {
      result.suggestions.push(
        'Gıda sektörü için OEE yerine "Batch Verimliliği" veya "Proses Etkinliği" KPI\'ları daha uygun'
      )
    }
    
    if (kpiNumber === 27 && incompatibleSectors.some(s => ['Gıda', 'Tekstil'].includes(s))) {
      result.suggestions.push(
        'Geleneksel sektörler için önce temel dijitalleşme KPI\'ları (ERP, CRM) sonra gelişmiş platformlar'
      )
    }
  }

  return result
}

export function getSectorKPIRecommendations(sector: string): {
  recommendedKPIs: number[]
  avoidKPIs: number[]
  reasoning: string
} {
  const sectorProfiles: { [sector: string]: {
    recommended: number[]
    avoid: number[]
    reasoning: string
  }} = {
    'Metal': {
      recommended: [22, 23, 11, 12, 7], // OEE, performans, finansal, çevre
      avoid: [],
      reasoning: 'Metal sektörü sürekli üretim, OEE ve çevre KPI\'ları kritik'
    },
    'Gıda': {
      recommended: [1, 2, 3, 25, 26], // Farkındalık, eğitim, kalite, belge
      avoid: [22, 27], // OEE, dijital platform
      reasoning: 'Gıda sektörü kalite/hijyen odaklı, batch üretim yaygın'
    },
    'Otomotiv': {
      recommended: [22, 23, 27, 38, 39], // OEE, dijital, AR-GE
      avoid: [],
      reasoning: 'Otomotiv teknoloji yoğun, verimlilik ve inovasyon kritik'
    },
    'Tekstil': {
      recommended: [1, 2, 7, 34], // Farkındalık, çevre, müşteri odaklı
      avoid: [22, 27], // OEE, dijital platform
      reasoning: 'Tekstil müşteri odaklı, sürdürülebilirlik önemli'
    }
  }
  
  return sectorProfiles[sector] || {
    recommended: [1, 2, 3, 11, 12],
    avoid: [],
    reasoning: 'Genel sektör profili - temel KPI\'lar öneriliyor'
  }
}
