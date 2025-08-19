// Her sektör için KPI önem ağırlıklandırması sistemi

export interface SectorKPIWeight {
  sector: string
  kpiWeights: {
    [kpiNumber: number]: {
      weight: number // 0-1 arası, sektör için bu KPI'nın önem ağırlığı
      importance: 'critical' | 'high' | 'medium' | 'low' | 'minimal'
      reasoning: string
    }
  }
  totalWeight: number // Normalizasyon kontrolü için
}

export const SECTOR_KPI_WEIGHTS: SectorKPIWeight[] = [
  // Metal Sektörü - Sürekli üretim, OEE odaklı
  {
    sector: 'Metal',
    kpiWeights: {
      // Farkındalık/Eğitim - Orta öncelik
      1: { weight: 0.6, importance: 'medium', reasoning: 'Metal sektöründe işçi eğitimi güvenlik açısından kritik' },
      2: { weight: 0.7, importance: 'high', reasoning: 'Teknik beceri geliştirme metal işlemede çok önemli' },
      3: { weight: 0.5, importance: 'medium', reasoning: 'İstihdam programları sektörde orta öncelik' },
      4: { weight: 0.8, importance: 'high', reasoning: 'Sürekli iyileştirme metal sektörü için kritik' },
      5: { weight: 0.6, importance: 'medium', reasoning: 'Proje yönlendirmesi orta öncelik' },
      
      // Finansal - Yüksek öncelik
      11: { weight: 0.9, importance: 'critical', reasoning: 'Kârlılık metal sektöründe hayati' },
      12: { weight: 0.8, importance: 'high', reasoning: 'Gelir büyümesi sürdürülebilirlik için kritik' },
      13: { weight: 0.7, importance: 'high', reasoning: 'Bütçe kontrolü yüksek maliyetler nedeniyle önemli' },
      14: { weight: 0.6, importance: 'medium', reasoning: 'Müşteri kazanımı önemli ama B2B odaklı' },
      15: { weight: 0.7, importance: 'high', reasoning: 'Hizmet geliri değer katma için kritik' },
      
      // Operasyonel - En yüksek öncelik  
      20: { weight: 0.9, importance: 'critical', reasoning: 'Teknik eğitim metal işlemede vazgeçilmez' },
      22: { weight: 1.0, importance: 'critical', reasoning: 'OEE metal sektörünün en kritik metriği' },
      23: { weight: 0.8, importance: 'high', reasoning: 'Kalite denetimi güvenlik ve standat için kritik' },
      24: { weight: 0.7, importance: 'high', reasoning: 'Stratejik hedeflere ulaşım önemli' },
      25: { weight: 0.8, importance: 'high', reasoning: 'ISO sertifikaları metal sektöründe zorunlu' },
      
      // Paydaş - Düşük-orta öncelik
      30: { weight: 0.4, importance: 'low', reasoning: 'Paydaş etkisi B2B odaklı sektörde düşük' },
      32: { weight: 0.6, importance: 'medium', reasoning: 'Süreç iyileştirme önerisi orta önemde' },
      33: { weight: 0.3, importance: 'low', reasoning: 'NPS B2B müşteri ilişkilerinde az kritik' },
      35: { weight: 0.7, importance: 'high', reasoning: 'Çalışan memnuniyeti güvenlik kültürü için önemli' },
      38: { weight: 0.5, importance: 'medium', reasoning: 'AR-GE işbirlikleri metal sektöründe faydalı' }
    },
    totalWeight: 0 // Hesaplanacak
  },
  
  // Gıda Sektörü - Kalite, hijyen, compliance odaklı
  {
    sector: 'Gıda',
    kpiWeights: {
      // Farkındalık/Eğitim - Yüksek öncelik (HACCP, hijyen)
      1: { weight: 0.8, importance: 'high', reasoning: 'Gıda güvenliği farkındalığı kritik' },
      2: { weight: 0.9, importance: 'critical', reasoning: 'HACCP eğitimleri yasal zorunluluk' },
      3: { weight: 0.6, importance: 'medium', reasoning: 'İstihdam programları orta öncelik' },
      4: { weight: 0.7, importance: 'high', reasoning: 'Sürekli iyileştirme kalite için önemli' },
      5: { weight: 0.5, importance: 'medium', reasoning: 'Proje yönlendirmesi düşük öncelik' },
      
      // Finansal - Orta-yüksek öncelik
      11: { weight: 0.8, importance: 'high', reasoning: 'Gıda sektöründe marj yönetimi kritik' },
      12: { weight: 0.7, importance: 'high', reasoning: 'Gelir çeşitlendirmesi önemli' },
      13: { weight: 0.9, importance: 'critical', reasoning: 'Maliyet kontrolü dar marjlar nedeniyle hayati' },
      14: { weight: 0.8, importance: 'high', reasoning: 'Yeni müşteri B2C odaklılık nedeniyle kritik' },
      15: { weight: 0.6, importance: 'medium', reasoning: 'Hizmet geliri üretim odaklı model için orta' },
      
      // Operasyonel - Kalite odaklı
      20: { weight: 0.9, importance: 'critical', reasoning: 'Hijyen ve kalite eğitimleri zorunlu' },
      22: { weight: 0.5, importance: 'medium', reasoning: 'OEE gıda sektöründe orta öncelik (batch üretim)' },
      23: { weight: 1.0, importance: 'critical', reasoning: 'Kalite denetimi gıda güvenliği için vazgeçilmez' },
      24: { weight: 0.7, importance: 'high', reasoning: 'Stratejik hedeflere ulaşım önemli' },
      25: { weight: 1.0, importance: 'critical', reasoning: 'ISO 22000, BRC gibi sertifikalar zorunlu' },
      
      // Paydaş - Yüksek öncelik (tüketici odaklı)
      30: { weight: 0.8, importance: 'high', reasoning: 'Medya etkisi gıda sektöründe kritik' },
      32: { weight: 0.5, importance: 'medium', reasoning: 'İyileştirme önerileri orta öncelik' },
      33: { weight: 0.9, importance: 'critical', reasoning: 'Müşteri memnuniyeti B2C için hayati' },
      35: { weight: 0.8, importance: 'high', reasoning: 'Çalışan memnuniyeti kalite kültürü için kritik' },
      38: { weight: 0.3, importance: 'low', reasoning: 'AR-GE işbirlikleri gıda sektöründe az öncelik' }
    },
    totalWeight: 0
  },
  
  // Otomotiv Sektörü - Teknoloji, innovation, sürekli iyileştirme
  {
    sector: 'Otomotiv',
    kpiWeights: {
      // Farkındalık/Eğitim - Yüksek öncelik (teknoloji transferi)
      1: { weight: 0.7, importance: 'high', reasoning: 'Dijital dönüşüm farkındalığı otomotivde kritik' },
      2: { weight: 0.9, importance: 'critical', reasoning: 'Teknik beceri geliştirme otomotiv için hayati' },
      3: { weight: 0.6, importance: 'medium', reasoning: 'İstihdam programları orta öncelik' },
      4: { weight: 0.9, importance: 'critical', reasoning: 'Lean manufacturing otomotivde zorunlu' },
      5: { weight: 0.8, importance: 'high', reasoning: 'İnovasyon projeleri sektörde çok önemli' },
      
      // Finansal - Yüksek öncelik (R&D yatırımları)
      11: { weight: 0.8, importance: 'high', reasoning: 'Otomotiv sektöründe yüksek yatırım gereksinimleri' },
      12: { weight: 0.9, importance: 'critical', reasoning: 'Gelir büyümesi AR-GE finansmanı için kritik' },
      13: { weight: 0.7, importance: 'high', reasoning: 'Bütçe planlaması uzun vadeli projeler için önemli' },
      14: { weight: 0.7, importance: 'high', reasoning: 'Yeni müşteri tier yapısında önemli' },
      15: { weight: 0.8, importance: 'high', reasoning: 'Değer katma hizmetleri kritik' },
      
      // Operasyonel - En yüksek öncelik
      20: { weight: 0.9, importance: 'critical', reasoning: 'Sürekli teknik eğitim zorunlu' },
      22: { weight: 1.0, importance: 'critical', reasoning: 'OEE otomotiv üretiminde en kritik metrik' },
      23: { weight: 0.9, importance: 'critical', reasoning: 'TS 16949 gibi otomotiv standartları zorunlu' },
      24: { weight: 0.8, importance: 'high', reasoning: 'Stratejik hedeflere ulaşım rekabet için kritik' },
      25: { weight: 0.9, importance: 'critical', reasoning: 'Otomotiv kalite sertifikaları vazgeçilmez' },
      
      // Paydaş - Orta-yüksek öncelik (OEM ilişkileri)
      30: { weight: 0.6, importance: 'medium', reasoning: 'Medya etkisi B2B odaklı sektörde orta' },
      32: { weight: 0.8, importance: 'high', reasoning: 'Kaizen kültürü otomotivde çok önemli' },
      33: { weight: 0.7, importance: 'high', reasoning: 'OEM müşteri memnuniyeti kritik' },
      35: { weight: 0.8, importance: 'high', reasoning: 'Çalışan memnuniyeti kalite ve verimlilik için kritik' },
      38: { weight: 0.9, importance: 'critical', reasoning: 'AR-GE işbirlikleri otomotiv inovasyonu için hayati' }
    },
    totalWeight: 0
  },
  
  // Tekstil Sektörü - Moda, sürdürülebilirlik, müşteri odaklı
  {
    sector: 'Tekstil',
    kpiWeights: {
      // Farkındalık/Eğitim - Orta öncelik
      1: { weight: 0.6, importance: 'medium', reasoning: 'Sürdürülebilirlik farkındalığı tekstilde önemli' },
      2: { weight: 0.7, importance: 'high', reasoning: 'Kalite ve tasarım eğitimleri kritik' },
      3: { weight: 0.7, importance: 'high', reasoning: 'İstihdam tekstil sektöründe sosyal sorumluluk' },
      4: { weight: 0.6, importance: 'medium', reasoning: 'Sürekli iyileştirme orta öncelik' },
      5: { weight: 0.5, importance: 'medium', reasoning: 'Proje yönlendirmesi düşük öncelik' },
      
      // Finansal - Yüksek öncelik (margin pressure)
      11: { weight: 0.9, importance: 'critical', reasoning: 'Tekstilde dar marjlar nedeniyle kârlılık kritik' },
      12: { weight: 0.8, importance: 'high', reasoning: 'Gelir artışı rekabet için gerekli' },
      13: { weight: 0.8, importance: 'high', reasoning: 'Maliyet kontrolü emek yoğun sektörde kritik' },
      14: { weight: 0.9, importance: 'critical', reasoning: 'Yeni müşteri fast fashion için hayati' },
      15: { weight: 0.7, importance: 'high', reasoning: 'Hizmet geliri değer katma için önemli' },
      
      // Operasyonel - Kalite ve sürdürülebilirlik odaklı
      20: { weight: 0.7, importance: 'high', reasoning: 'Kalite ve sürdürülebilirlik eğitimleri önemli' },
      22: { weight: 0.4, importance: 'low', reasoning: 'OEE tekstilde batch üretim nedeniyle düşük öncelik' },
      23: { weight: 0.8, importance: 'high', reasoning: 'Kalite denetimi müşteri memnuniyeti için kritik' },
      24: { weight: 0.6, importance: 'medium', reasoning: 'Stratejik hedeflere ulaşım orta öncelik' },
      25: { weight: 0.8, importance: 'high', reasoning: 'OEKO-TEX, GOTS gibi sürdürülebilirlik sertifikaları kritik' },
      
      // Paydaş - Yüksek öncelik (marka imajı)
      30: { weight: 0.9, importance: 'critical', reasoning: 'Medya etkisi moda sektöründe hayati' },
      32: { weight: 0.6, importance: 'medium', reasoning: 'İyileştirme önerileri orta öncelik' },
      33: { weight: 0.9, importance: 'critical', reasoning: 'Müşteri memnuniyeti moda sektöründe en kritik' },
      35: { weight: 0.8, importance: 'high', reasoning: 'Çalışan memnuniyeti sosyal sorumluluk için kritik' },
      38: { weight: 0.4, importance: 'low', reasoning: 'AR-GE işbirlikleri tekstilde düşük öncelik' }
    },
    totalWeight: 0
  },
  
  // Makine Sektörü - Mühendislik, precision, teknoloji
  {
    sector: 'Makine',
    kpiWeights: {
      // Farkındalık/Eğitim - Yüksek öncelik (teknik expertise)
      1: { weight: 0.7, importance: 'high', reasoning: 'Teknik farkındalık makine sektöründe kritik' },
      2: { weight: 0.9, importance: 'critical', reasoning: 'Mühendislik eğitimleri makine için hayati' },
      3: { weight: 0.6, importance: 'medium', reasoning: 'İstihdam programları orta öncelik' },
      4: { weight: 0.8, importance: 'high', reasoning: 'Sürekli iyileştirme hassas üretim için kritik' },
      5: { weight: 0.7, importance: 'high', reasoning: 'Teknoloji projeleri makine sektöründe önemli' },
      
      // Finansal - Yüksek öncelik (yüksek yatırım)
      11: { weight: 0.8, importance: 'high', reasoning: 'Makine sektöründe yüksek sabit maliyetler' },
      12: { weight: 0.8, importance: 'high', reasoning: 'Gelir büyümesi teknoloji yatırımları için kritik' },
      13: { weight: 0.7, importance: 'high', reasoning: 'Bütçe planlaması uzun vadeli projeler için önemli' },
      14: { weight: 0.6, importance: 'medium', reasoning: 'Yeni müşteri B2B odaklı yapıda orta öncelik' },
      15: { weight: 0.8, importance: 'high', reasoning: 'Servis geliri makine sektöründe çok önemli' },
      
      // Operasyonel - Hassasiyet ve kalite odaklı
      20: { weight: 0.9, importance: 'critical', reasoning: 'Teknik eğitim hassas üretim için zorunlu' },
      22: { weight: 0.9, importance: 'critical', reasoning: 'OEE hassas makine üretiminde kritik' },
      23: { weight: 0.9, importance: 'critical', reasoning: 'Kalite denetimi hassasiyet için vazgeçilmez' },
      24: { weight: 0.7, importance: 'high', reasoning: 'Stratejik hedeflere ulaşım önemli' },
      25: { weight: 0.8, importance: 'high', reasoning: 'ISO 9001, CE gibi sertifikalar kritik' },
      
      // Paydaş - Orta öncelik (B2B odaklı)
      30: { weight: 0.5, importance: 'medium', reasoning: 'Medya etkisi B2B sektöründe orta' },
      32: { weight: 0.8, importance: 'high', reasoning: 'Teknik iyileştirme önerileri çok değerli' },
      33: { weight: 0.6, importance: 'medium', reasoning: 'Müşteri memnuniyeti B2B ilişkilerde önemli' },
      35: { weight: 0.7, importance: 'high', reasoning: 'Çalışan memnuniyeti teknik kalite için kritik' },
      38: { weight: 0.8, importance: 'high', reasoning: 'AR-GE işbirlikleri makine inovasyonu için kritik' }
    },
    totalWeight: 0
  }
]

// Toplam ağırlıkları hesapla (normalizasyon kontrolü)
SECTOR_KPI_WEIGHTS.forEach(sectorWeight => {
  sectorWeight.totalWeight = Object.values(sectorWeight.kpiWeights)
    .reduce((sum, kpi) => sum + kpi.weight, 0)
})

export function getSectorKPIWeight(sector: string, kpiNumber: number): number {
  const sectorWeights = SECTOR_KPI_WEIGHTS.find(sw => sw.sector === sector)
  if (!sectorWeights) return 0.5 // Default orta ağırlık
  
  const kpiWeight = sectorWeights.kpiWeights[kpiNumber]
  return kpiWeight ? kpiWeight.weight : 0.3 // Default düşük ağırlık
}

export function getSectorKPIImportance(sector: string, kpiNumber: number): {
  importance: string
  reasoning: string
} {
  const sectorWeights = SECTOR_KPI_WEIGHTS.find(sw => sw.sector === sector)
  if (!sectorWeights) return { importance: 'medium', reasoning: 'Varsayılan orta öncelik' }
  
  const kpiWeight = sectorWeights.kpiWeights[kpiNumber]
  return kpiWeight ? 
    { importance: kpiWeight.importance, reasoning: kpiWeight.reasoning } :
    { importance: 'low', reasoning: 'Bu sektör için tanımlanmamış KPI' }
}

export function getTopKPIsForSector(sector: string, limit: number = 10): Array<{
  kpiNumber: number
  weight: number
  importance: string
  reasoning: string
}> {
  const sectorWeights = SECTOR_KPI_WEIGHTS.find(sw => sw.sector === sector)
  if (!sectorWeights) return []
  
  return Object.entries(sectorWeights.kpiWeights)
    .map(([kpiNumber, data]) => ({
      kpiNumber: parseInt(kpiNumber),
      weight: data.weight,
      importance: data.importance,
      reasoning: data.reasoning
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
}

export function calculateWeightedKPIScore(
  kpiScores: { [kpiNumber: number]: number },
  sector: string
): number {
  const sectorWeights = SECTOR_KPI_WEIGHTS.find(sw => sw.sector === sector)
  if (!sectorWeights) return 0
  
  let weightedSum = 0
  let totalWeight = 0
  
  Object.entries(kpiScores).forEach(([kpiNumber, score]) => {
    const weight = getSectorKPIWeight(sector, parseInt(kpiNumber))
    weightedSum += score * weight
    totalWeight += weight
  })
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0
}
