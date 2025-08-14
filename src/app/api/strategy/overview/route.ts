import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factory')
    const period = searchParams.get('period') || '2024-Q4'
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'

    // Tüm stratejik amaçları getir
    const strategicGoals = await prisma.strategicGoal.findMany({
      include: {
        strategicTargets: {
          include: {
            kpis: {
              include: {
                kpiValues: {
                  where: factoryId ? { period, factoryId } : { period },
                  include: {
                    factory: {
                      select: {
                        id: true,
                        code: true,
                        name: true
                      }
                    }
                  },
                  orderBy: {
                    period: 'desc'
                  }
                }
              }
            },
            goalWeight: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Önceki dönem verilerini de al (trend için)
    const previousPeriod = period === '2024-Q4' ? '2024-Q3' : 
                          period === '2024-Q3' ? '2024-Q2' : 
                          period === '2024-Q2' ? '2024-Q1' : '2023-Q4'

    const previousKpiValues = await prisma.kpiValue.findMany({
      where: factoryId ? { period: previousPeriod, factoryId } : { period: previousPeriod },
      include: {
        factory: {
          select: {
            id: true,
            code: true,
            name: true
          }
        }
      }
    })

    // Her SA için başarım hesapla (ağırlıklı)
    const strategicOverview = strategicGoals.map(sa => {
      // SH bazında KPI ağırlıklarıyla (kpi.shWeight) skor
      let saWeightedScore = 0
      let saWeightSum = 0
      let saPrevWeightedScore = 0
      
      sa.strategicTargets.forEach(sh => {
        // KPI başına fabrikanın ortalaması -> KPI skoru
        let shScoreWeightedSum = 0
        let shWeightSum = 0
        let shPrevScoreWeightedSum = 0

        sh.kpis.forEach(kpi => {
          const tv = kpi.targetValue || 100
          // Mevcut dönem KPI skoru: kpiValues ortalaması
          let kpiScore = 0
          if (kpi.kpiValues.length > 0) {
            const avgVal = kpi.kpiValues.reduce((s, kv) => s + kv.value, 0) / kpi.kpiValues.length
            kpiScore = Math.min(100, (avgVal / tv) * 100)
          }
          // Önceki dönem KPI skoru
          const prevVals = previousKpiValues.filter(pv => pv.kpiId === kpi.id)
          let kpiPrevScore = 0
          if (prevVals.length > 0) {
            const avgPrev = prevVals.reduce((s, kv) => s + kv.value, 0) / prevVals.length
            kpiPrevScore = Math.min(100, (avgPrev / tv) * 100)
          }
          const w = (kpi as any).shWeight ?? 0 // Prisma type doesn't include field unless selected; cast any
          const weight = w > 0 ? w : 0
          shScoreWeightedSum += kpiScore * weight
          shPrevScoreWeightedSum += kpiPrevScore * weight
          shWeightSum += weight
        })

        const shScore = shWeightSum > 0 ? shScoreWeightedSum / shWeightSum : 0
        const shPrev = shWeightSum > 0 ? shPrevScoreWeightedSum / shWeightSum : 0
        const shW = (sh as any).goalWeight ?? 0
        const shWeight = shW > 0 ? shW : 0
        saWeightedScore += shScore * shWeight
        saPrevWeightedScore += shPrev * shWeight
        saWeightSum += shWeight
      })

      const averageScore = saWeightSum > 0 ? Math.round(saWeightedScore / saWeightSum) : 0
      const previousAverageScore = saWeightSum > 0 ? Math.round(saPrevWeightedScore / saWeightSum) : 0
      const trend = averageScore - previousAverageScore

      // Eğer belirli bir fabrika seçiliyse, o fabrika için ayrı hesaplama (zaten factoryId ile filtreli)
      let factorySpecificScore = null
      if (factoryId) factorySpecificScore = averageScore

      return {
        id: sa.id,
        code: sa.code,
        title: sa.title,
        description: sa.description || '',
        successRate: averageScore,
        factorySpecificScore, // Seçili fabrika skoru (varsa)
        trend,
        totalFactories: new Set(
          sa.strategicTargets.flatMap(sh => 
            sh.kpis.flatMap(kpi => 
              kpi.kpiValues.map(kv => kv.factory.id)
            )
          )
        ).size,
        status: averageScore >= 80 ? 'excellent' : 
                averageScore >= 60 ? 'good' : 
                averageScore >= 40 ? 'at-risk' : 'critical'
      }
    })

    return NextResponse.json(strategicOverview)
  } catch (error) {
    console.error('Strategy overview error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
} 