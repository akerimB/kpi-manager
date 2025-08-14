import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const saCode = searchParams.get('sa')
    const factoryId = searchParams.get('factory')
    const period = searchParams.get('period') || '2024-Q4'
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'

    let whereCondition = {}
    if (saCode) {
      whereCondition = {
        strategicGoal: {
          code: saCode
        }
      }
    }

    const strategicTargets = await prisma.strategicTarget.findMany({
      where: whereCondition,
      include: {
        strategicGoal: true,
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
            },
            shWeight: true
          }
        },
        actions: {
          select: {
            id: true,
            code: true,
            completionPercent: true
          }
        },
        goalWeight: true
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

    // Her SH için başarım hesapla (tüm fabrikalar bazında)
    const targetDetails = strategicTargets.map(sh => {
      // Ağırlıklı KPI ortalaması
      let shScoreWeightedSum = 0
      let shWeightSum = 0
      let shPrevWeightedSum = 0

      sh.kpis.forEach(kpi => {
        const tv = kpi.targetValue || 100
        let kpiScore = 0
        if (kpi.kpiValues.length > 0) {
          const avgVal = kpi.kpiValues.reduce((s, kv) => s + kv.value, 0) / kpi.kpiValues.length
          kpiScore = Math.min(100, (avgVal / tv) * 100)
        }
        const prevVals = previousKpiValues.filter(pv => pv.kpiId === kpi.id)
        let kpiPrevScore = 0
        if (prevVals.length > 0) {
          const avgPrev = prevVals.reduce((s, kv) => s + kv.value, 0) / prevVals.length
          kpiPrevScore = Math.min(100, (avgPrev / tv) * 100)
        }
        const w = (kpi as any).shWeight ?? 0
        const weight = w > 0 ? w : 0
        shScoreWeightedSum += kpiScore * weight
        shPrevWeightedSum += kpiPrevScore * weight
        shWeightSum += weight
      })

      const averageScore = shWeightSum > 0 ? Math.round(shScoreWeightedSum / shWeightSum) : 0
      const previousAverageScore = shWeightSum > 0 ? Math.round(shPrevWeightedSum / shWeightSum) : 0
      const trend = averageScore - previousAverageScore

      // Eğer belirli bir fabrika seçiliyse, o fabrika için ayrı hesaplama
      let factorySpecificScore = null
      if (factoryId) {
        let factoryScore = 0
        let factoryKpiCount = 0
        
        sh.kpis.forEach(kpi => {
          const factoryKpiValue = kpi.kpiValues.find(kv => kv.factory.id === factoryId)
          if (factoryKpiValue) {
            factoryKpiCount++
            const targetValue = kpi.targetValue || 100
            const score = Math.min(100, (factoryKpiValue.value / targetValue) * 100)
            factoryScore += score
          }
        })
        
        factorySpecificScore = factoryKpiCount > 0 ? Math.round(factoryScore / factoryKpiCount) : 0
      }

      return {
        id: sh.id,
        code: sh.code,
        name: sh.title || `Stratejik Hedef ${sh.code}`,
        description: sh.description || '',
        strategicGoalId: sh.strategicGoal.id,
        successRate: Math.round(averageScore), // Tüm fabrikalar ortalaması
        factorySpecificScore, // Seçili fabrika skoru (varsa)
        kpiCount: sh.kpis.length,
        trend: Math.round(trend),
        totalFactories: new Set(
          sh.kpis.flatMap(kpi => 
            kpi.kpiValues.map(kv => kv.factory.id)
          )
        ).size,
        status: averageScore >= 80 ? 'excellent' : 
                averageScore >= 60 ? 'good' : 
                averageScore >= 40 ? 'at-risk' : 'critical'
      }
    })

    return NextResponse.json(targetDetails)
  } catch (error) {
    console.error('Strategy targets error:', error)
    return NextResponse.json({ error: 'Stratejik hedefler alınırken bir hata oluştu.' }, { status: 500 })
  }
} 