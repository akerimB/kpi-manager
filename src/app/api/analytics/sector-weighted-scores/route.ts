import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateWeightedKPIScore, getTopKPIsForSector, getSectorKPIWeight } from '../../../../lib/sector-kpi-weighting'

// NACE kodunu sektöre çevir
function mapNaceToSector(nace: string | null): string {
  if (!nace) return 'Diğer'
  
  const code = parseInt(nace.substring(0, 2))
  const sectorMap: { [key: number]: string } = {
    10: 'Gıda', 11: 'Gıda', 12: 'Gıda',
    13: 'Tekstil', 14: 'Tekstil', 15: 'Tekstil',
    16: 'Mobilya', 17: 'Mobilya', 18: 'Mobilya',
    20: 'Kimya', 21: 'Kimya', 22: 'Plastik',
    24: 'Metal', 25: 'Metal',
    26: 'Bilgisayar', 27: 'Elektrikli', 28: 'Makine',
    29: 'Otomotiv', 30: 'Otomotiv',
    31: 'Mobilya', 32: 'Diğer'
  }
  
  return sectorMap[code] || 'Diğer'
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const factoryId = searchParams.get('factoryId')
    const period = searchParams.get('period') || '2024-Q4'

    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Factory bilgisi
    const factory = await prisma.factory.findUnique({
      where: { id: factoryId },
      select: { id: true, name: true, code: true }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Factory bulunamadı' }, { status: 404 })
    }

    // KPI değerlerini al
    const kpiValues = await prisma.kpiValue.findMany({
      where: {
        factoryId,
        period
      },
      include: {
        kpi: {
          select: {
            id: true,
            number: true,
            description: true,
            strategicTarget: {
              select: {
                code: true,
                title: true
              }
            }
          }
        }
      }
    })

    // Factory'nin ana sektörünü belirle (evidence'lardan)
    const evidences = await prisma.kpiEvidence.findMany({
      where: { factoryId, period },
      select: { nace4d: true, nace2d: true }
    })

    const sectorCounts: { [sector: string]: number } = {}
    evidences.forEach(evidence => {
      const sector = mapNaceToSector(evidence.nace4d || evidence.nace2d)
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1
    })

    // En yaygın sektörü belirle
    const primarySector = Object.entries(sectorCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Metal' // Default Metal

    // KPI skorlarını hazırla
    const kpiScores: { [kpiNumber: number]: number } = {}
    kpiValues.forEach(kv => {
      const successRate = kv.targetValue > 0 ? (kv.value / kv.targetValue) * 100 : 0
      kpiScores[kv.kpi.number] = Math.min(100, Math.max(0, successRate))
    })

    // Ağırlıklı skor hesapla
    const weightedScore = calculateWeightedKPIScore(kpiScores, primarySector)
    const simpleAverage = Object.values(kpiScores).length > 0 ?
      Object.values(kpiScores).reduce((a, b) => a + b, 0) / Object.values(kpiScores).length : 0

    // Sektör için top KPI'ları al
    const topKPIs = getTopKPIsForSector(primarySector, 10)

    // KPI'ları ağırlıklarına göre sınıflandır
    const kpiAnalysis = kpiValues.map(kv => {
      const weight = getSectorKPIWeight(primarySector, kv.kpi.number)
      const score = kpiScores[kv.kpi.number] || 0
      const contribution = score * weight
      
      return {
        kpiNumber: kv.kpi.number,
        kpiDescription: kv.kpi.description,
        shCode: kv.kpi.strategicTarget.code,
        score,
        weight,
        contribution,
        weightedScore: contribution,
        importance: weight >= 0.8 ? 'critical' : 
                   weight >= 0.6 ? 'high' :
                   weight >= 0.4 ? 'medium' : 'low',
        performance: score >= 90 ? 'excellent' :
                    score >= 80 ? 'good' :
                    score >= 70 ? 'adequate' :
                    score >= 60 ? 'needs_improvement' : 'critical'
      }
    }).sort((a, b) => b.contribution - a.contribution)

    // Sektör karşılaştırması (diğer sektörlerle)
    const otherSectors = ['Metal', 'Gıda', 'Otomotiv', 'Tekstil', 'Makine'].filter(s => s !== primarySector)
    const sectorComparison = otherSectors.map(sector => ({
      sector,
      weightedScore: calculateWeightedKPIScore(kpiScores, sector),
      difference: calculateWeightedKPIScore(kpiScores, sector) - weightedScore
    })).sort((a, b) => b.weightedScore - a.weightedScore)

    // Performance insights
    const criticalKPIs = kpiAnalysis.filter(k => k.importance === 'critical')
    const underperformingCritical = criticalKPIs.filter(k => k.score < 80)
    const excellentPerformance = kpiAnalysis.filter(k => k.performance === 'excellent')

    const response = {
      factory,
      period,
      primarySector,
      sectorEvidence: sectorCounts,
      scoreAnalysis: {
        simpleAverage: Math.round(simpleAverage * 10) / 10,
        weightedScore: Math.round(weightedScore * 10) / 10,
        improvement: Math.round((weightedScore - simpleAverage) * 10) / 10,
        interpretation: weightedScore > simpleAverage ? 
          'Sektörel ağırlıklandırma performansı artırıyor' :
          'Sektörel ağırlıklandırma performansı düşürüyor'
      },
      kpiAnalysis,
      topKPIsForSector: topKPIs,
      sectorComparison,
      insights: {
        totalKPIs: kpiAnalysis.length,
        criticalKPIs: criticalKPIs.length,
        underperformingCritical: underperformingCritical.length,
        excellentPerformance: excellentPerformance.length,
        overallStatus: weightedScore >= 85 ? 'excellent' :
                      weightedScore >= 75 ? 'good' :
                      weightedScore >= 65 ? 'adequate' : 'needs_improvement'
      },
      recommendations: [
        ...(underperformingCritical.length > 0 ? 
          [`${primarySector} sektörü için kritik olan ${underperformingCritical.length} KPI'da iyileştirme gerekli`] : []),
        ...(weightedScore < simpleAverage ? 
          [`Sektörel odaklanma gerekiyor: ${primarySector} için önemli KPI'lara yoğunlaşın`] : []),
        ...(excellentPerformance.length > 5 ? 
          ['Güçlü performans: Bu başarıları diğer alanlara transfer edin'] : [])
      ],
      metadata: {
        calculatedAt: new Date().toISOString(),
        kpiCount: kpiValues.length,
        evidenceCount: evidences.length,
        weightingModel: `${primarySector} Sektör Ağırlıklandırması`
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Sector weighted scores analysis error:', error)
    return NextResponse.json({ 
      error: 'Sektörel ağırlıklı skor analizi hatası',
      detail: error instanceof Error ? error.message : 'Bilinmeyen hata',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
