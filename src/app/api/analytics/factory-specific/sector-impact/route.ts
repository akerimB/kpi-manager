import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// NACE kod eşleme fonksiyonu
function mapNaceToSector(nace?: string | null): string | null {
  if (!nace) return null
  const code = parseInt(nace.toString().substring(0, 2))
  
  const sectorMap: Record<number, string> = {
    1: 'Tarım, Ormancılık ve Balıkçılık',
    2: 'Tarım, Ormancılık ve Balıkçılık', 
    3: 'Tarım, Ormancılık ve Balıkçılık',
    5: 'Madencilik',
    6: 'Madencilik',
    7: 'Madencilik',
    8: 'Madencilik',
    9: 'Madencilik',
    10: 'İmalat',
    11: 'İmalat',
    12: 'İmalat',
    13: 'İmalat',
    14: 'İmalat',
    15: 'İmalat',
    16: 'İmalat',
    17: 'İmalat',
    18: 'İmalat',
    19: 'İmalat',
    20: 'İmalat',
    21: 'İmalat',
    22: 'İmalat',
    23: 'İmalat',
    24: 'İmalat',
    25: 'İmalat',
    26: 'İmalat',
    27: 'İmalat',
    28: 'İmalat',
    29: 'İmalat',
    30: 'İmalat',
    31: 'İmalat',
    32: 'İmalat',
    33: 'İmalat',
    35: 'Elektrik, Gaz, Buhar',
    36: 'Su Temini',
    37: 'Atık Su Yönetimi',
    38: 'Atık Yönetimi',
    39: 'İyileştirme Faaliyetleri',
    41: 'İnşaat',
    42: 'İnşaat',
    43: 'İnşaat',
    45: 'Motorlu Taşıt Ticareti',
    46: 'Toptan Ticaret',
    47: 'Perakende Ticaret',
    49: 'Kara ve Boru Hattı Taşımacılığı',
    50: 'Su Yolu Taşımacılığı',
    51: 'Hava Yolu Taşımacılığı',
    52: 'Depolama ve Taşımacılık',
    53: 'Posta ve Kurye',
    55: 'Konaklama',
    56: 'Yiyecek ve İçecek Hizmeti',
    58: 'Yayıncılık',
    59: 'Sinema, Video ve Televizyon',
    60: 'Radyo ve Televizyon',
    61: 'Telekomünikasyon',
    62: 'Bilgisayar Programlama',
    63: 'Bilgi Hizmeti',
    64: 'Finansal Hizmetler',
    65: 'Sigorta ve Emeklilik',
    66: 'Finansal Hizmetlere Yardımcı',
    68: 'Gayrimenkul',
    69: 'Hukuki ve Muhasebe',
    70: 'Genel Müdürlük; Yönetim Danışmanlığı',
    71: 'Mimarlık ve Mühendislik',
    72: 'Bilimsel Araştırma ve Geliştirme',
    73: 'Reklamcılık ve Pazar Araştırması',
    74: 'Diğer Mesleki, Bilimsel ve Teknik',
    75: 'Veterinerlik',
    77: 'Kiralama ve Leasing',
    78: 'İstihdam',
    79: 'Seyahat Acentesi',
    80: 'Güvenlik ve Soruşturma',
    81: 'Hizmet Binalarına Bakım',
    82: 'İdari ve Destek Hizmetleri',
    84: 'Kamu Yönetimi ve Savunma',
    85: 'Eğitim',
    86: 'İnsan Sağlığı Hizmetleri',
    87: 'Yatılı Bakım',
    88: 'Barınacak Yer Sağlanmayan Sosyal Hizmetler',
    90: 'Yaratıcı, Sanat ve Eğlence',
    91: 'Kütüphane, Arşiv, Müze',
    92: 'Kumar ve Bahis',
    93: 'Spor, Eğlence ve Dinlence',
    94: 'Üye Olunan Kuruluşlar',
    95: 'Bilgisayar ve Kişisel Eşya Tamiri',
    96: 'Diğer Kişisel Hizmetler'
  }
  
  return sectorMap[code] || 'Diğer'
}

// KPI türünü strategik hedef kodundan çıkar
function getKPIType(shCode: string): string {
  if (shCode.startsWith('SH1.1') || shCode.startsWith('SH1.2')) {
    return 'training_education' // Eğitim/farkındalık - sadece katılımcılar etkilenir
  }
  if (shCode.startsWith('SH1.3') || shCode.startsWith('SH1.4') || shCode.startsWith('SH1.5') || shCode.startsWith('SH1.6')) {
    return 'project_based' // Proje bazlı - katılımcı firmalar etkilenir
  }
  if (shCode.startsWith('SH2')) {
    return 'financial' // Finansal - tüm firma etkilenir
  }
  if (shCode.startsWith('SH3')) {
    return 'operational' // Operasyonel - belli kısımlar etkilenir
  }
  if (shCode.startsWith('SH4')) {
    return 'outreach' // Paydaş etkisi - hedef gruplar etkilenir
  }
  return 'general'
}

// Gerçek etki hesaplama - KPI türüne göre
function calculateActualImpact(evidence: any, kpiType: string) {
  const totalEmployees = evidence.employees || 0
  const totalRevenue = evidence.revenue || 0
  
  // Dosya adından veya içeriğinden participant sayısını çıkarmaya çalış
  const participantInfo = extractParticipantCount(evidence.fileName, evidence.description)
  
  switch (kpiType) {
    case 'training_education':
      // Eğitim/farkındalık: Sadece eğitime katılanlar etkilenir
      const trainingParticipants = participantInfo.participants || Math.min(50, totalEmployees * 0.1) // %10 varsayım veya max 50
      return {
        employees: trainingParticipants,
        revenue: totalRevenue * (trainingParticipants / Math.max(totalEmployees, 1)), // Oransal
        hasRealImpact: true
      }
    
    case 'project_based':
      // Proje bazlı: Projeye dahil olanlar etkilenir  
      const projectParticipants = participantInfo.participants || Math.min(100, totalEmployees * 0.2) // %20 varsayım
      return {
        employees: projectParticipants,
        revenue: totalRevenue * (projectParticipants / Math.max(totalEmployees, 1)),
        hasRealImpact: true
      }
    
    case 'financial':
      // Finansal: Tüm firma etkilenir
      return {
        employees: totalEmployees,
        revenue: totalRevenue,
        hasRealImpact: true
      }
    
    case 'operational':
      // Operasyonel: Müdahale edilen bölüm etkilenir
      const operationalImpact = participantInfo.participants || Math.min(200, totalEmployees * 0.3) // %30 varsayım
      return {
        employees: operationalImpact,
        revenue: totalRevenue * (operationalImpact / Math.max(totalEmployees, 1)),
        hasRealImpact: true
      }
    
    case 'outreach':
      // Paydaş etkisi: Hedef grup etkilenir
      const outreachImpact = participantInfo.participants || Math.min(30, totalEmployees * 0.05) // %5 varsayım
      return {
        employees: outreachImpact,
        revenue: totalRevenue * (outreachImpact / Math.max(totalEmployees, 1)),
        hasRealImpact: true
      }
    
    default:
      // Genel: Konservatif yaklaşım
      return {
        employees: Math.min(20, totalEmployees * 0.05),
        revenue: totalRevenue * 0.05,
        hasRealImpact: false
      }
  }
}

// Dosya adı/açıklamasından katılımcı sayısını çıkarmaya çalış
function extractParticipantCount(fileName: string, description?: string): { participants?: number } {
  const text = `${fileName} ${description || ''}`.toLowerCase()
  
  // Sayı pattern'leri ara
  const patterns = [
    /(\d+)[\s_-]*(kişi|person|participant|katılımcı)/,
    /(\d+)[\s_-]*(worker|çalışan|employee)/,
    /(\d+)[\s_-]*(student|öğrenci|trainee)/,
    /katılımcı[\s_-]*(\d+)/,
    /toplam[\s_-]*(\d+)/
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      const count = parseInt(match[1])
      if (count > 0 && count < 10000) { // Makul sınırlar
        return { participants: count }
      }
    }
  }
  
  return {}
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const factoryId = searchParams.get('factoryId')
    const period = searchParams.get('period') || '2024-Q4'
    
    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Fabrika ve sektör ağırlıkları
    const factory = await prisma.modelFactory.findUnique({
      where: { id: factoryId },
      include: {
        sectorWeights: true
      }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Fabrika bulunamadı' }, { status: 404 })
    }

    // Fabrikaya ait kanıtları al (sektör analizi için)
    const evidences = await prisma.kpiEvidence.findMany({
      where: {
        factoryId,
        period
      },
      select: {
        id: true,
        nace4d: true,
        nace2d: true,
        employees: true,
        revenue: true,
        hasExport: true,
        firmIdHash: true,
        province: true,
        zoneType: true,
        fileSize: true,
        kpi: {
          select: {
            number: true,
            description: true,
            strategicTarget: {
              select: {
                title: true,
                strategicGoal: {
                  select: { title: true }
                }
              }
            }
          }
        }
      }
    })

    // KPI değerleri ile sektörel etki analizi
    const kpiValues = await prisma.kpiValue.findMany({
      where: {
        factoryId,
        period
      },
      include: {
        kpi: {
          include: {
            strategicTarget: {
              include: {
                strategicGoal: true
              }
            }
          }
        }
      }
    })

    // Sektör bazında gruplandırma
    const sectorImpact: Record<string, {
      sectorName: string,
      evidenceCount: number,
      firmCount: number,
      totalEmployees: number,
      totalRevenue: number,
      exportCount: number,
      kpiScores: number[],
      avgKpiScore: number,
      factoryWeight: number,
      provinces: Set<string>,
      zoneTypes: Set<string>
    }> = {}

    // Evidence'lardan sektör çıkarma ve fabrika sektör ağırlıklarını birleştirme
    const allSectors = new Set<string>()
    
    // Evidence'lardan sektörleri çıkar
    evidences.forEach(evidence => {
      const naceCode = evidence.nace4d || evidence.nace2d
      if (naceCode) {
        const sector = mapNaceToSector(naceCode)
        if (sector) {
          allSectors.add(sector)
        }
      }
    })
    
    // Factory sector weights'dan sektörleri ekle
    factory.sectorWeights.forEach(sw => {
      allSectors.add(sw.sector)
    })
    
    // Tüm sektörler için başlangıç değerleri
    allSectors.forEach(sectorName => {
      const factoryWeight = factory.sectorWeights.find(sw => sw.sector === sectorName)?.share || 0
      sectorImpact[sectorName] = {
        sectorName,
        evidenceCount: 0,
        firmCount: 0,
        totalEmployees: 0,
        totalRevenue: 0,
        exportCount: 0,
        kpiScores: [],
        avgKpiScore: 0,
        factoryWeight,
        provinces: new Set(),
        zoneTypes: new Set()
      }
    })

    // Kanıtları sektörlere göre grupla - KPI türüne göre etki hesaplama
    evidences.forEach(evidence => {
      const naceCode = evidence.nace4d || evidence.nace2d
      const sector = mapNaceToSector(naceCode)
      
      if (sector && sectorImpact[sector]) {
        const si = sectorImpact[sector]
        si.evidenceCount++
        
        // KPI türüne göre etki hesaplama
        const shCode = evidence.kpi.strategicTarget?.code || 'SH0.0'
        const kpiType = getKPIType(shCode)
        const impact = calculateActualImpact(evidence, kpiType)
        
        si.totalEmployees += impact.employees
        si.totalRevenue += impact.revenue
        if (evidence.hasExport && impact.hasRealImpact) si.exportCount++
        if (evidence.province) si.provinces.add(evidence.province)
        if (evidence.zoneType) si.zoneTypes.add(evidence.zoneType)
        
        // Unique firma sayısı - sadece gerçek etki varsa
        if (evidence.firmIdHash && impact.hasRealImpact) {
          si.firmCount++
        }
      }
    })

    // KPI skorlarını sektörlere ekle
    kpiValues.forEach(kv => {
      // Bu implementation için NACE kodu KPI value'da yok, 
      // evidence'lardan çıkarım yapıyoruz
      const relatedEvidence = evidences.find(e => e.kpi.number === kv.kpi.number)
      if (relatedEvidence) {
        const naceCode = relatedEvidence.nace4d || relatedEvidence.nace2d
        const sector = mapNaceToSector(naceCode)
        
        if (sector && sectorImpact[sector]) {
          const target = kv.kpi.targetValue || 100
          const score = Math.min(100, (kv.value / target) * 100)
          sectorImpact[sector].kpiScores.push(score)
        }
      }
    })

    // Ortalama KPI skorlarını hesapla
    Object.values(sectorImpact).forEach(si => {
      if (si.kpiScores.length > 0) {
        si.avgKpiScore = Math.round(
          si.kpiScores.reduce((a, b) => a + b, 0) / si.kpiScores.length
        )
      }
    })

    // Sonuçları formatla
    const sectorResults = Object.values(sectorImpact)
      .filter(si => si.evidenceCount > 0 || si.factoryWeight > 0)
      .sort((a, b) => b.factoryWeight - a.factoryWeight)
      .map(si => ({
        sectorName: si.sectorName,
        metrics: {
          evidenceCount: si.evidenceCount,
          firmCount: si.firmCount,
          totalEmployees: si.totalEmployees,
          totalRevenue: si.totalRevenue,
          exportCount: si.exportCount,
          avgKpiScore: si.avgKpiScore,
          factoryWeight: Math.round(si.factoryWeight * 100) / 100
        },
        geographic: {
          provinces: Array.from(si.provinces),
          zoneTypes: Array.from(si.zoneTypes)
        }
      }))

    // Özet istatistikler
    const summary = {
      totalSectors: sectorResults.length,
      totalEvidences: evidences.length,
      totalFirms: new Set(evidences.map(e => e.firmIdHash).filter(Boolean)).size,
      totalEmployees: evidences.reduce((sum, e) => sum + (e.employees || 0), 0),
      totalRevenue: evidences.reduce((sum, e) => sum + (e.revenue || 0), 0),
      exportingFirms: evidences.filter(e => e.hasExport).length,
      avgFactoryWeight: factory.sectorWeights.reduce((sum, sw) => sum + sw.share, 0)
    }

    return NextResponse.json({
      factory: {
        id: factory.id,
        name: factory.name,
        code: factory.code
      },
      summary,
      sectorImpact: sectorResults,
      metadata: {
        period,
        calculatedAt: new Date().toISOString(),
        dataPoints: evidences.length + kpiValues.length
      }
    })

  } catch (error) {
    console.error('❌ Sector impact analysis error:', error)
    return NextResponse.json({ 
      error: 'Sektörel etki analizi hatası', 
      detail: String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
