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
              where: {
                period: period
                // Fabrika filtresi kaldırıldı - tüm fabrikalar dahil
              },
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
        actions: {
          select: {
            id: true,
            code: true,
            completionPercent: true
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
      where: {
        period: previousPeriod
      },
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
      let totalKpis = sh.kpis.length
      let totalScore = 0
      let totalPreviousScore = 0
      let totalFactoryKpiCombinations = 0

      // KPI başarım hesaplama - tüm fabrikalar
      sh.kpis.forEach(kpi => {
        // Mevcut dönem - tüm fabrika değerleri
        kpi.kpiValues.forEach(kpiValue => {
          totalFactoryKpiCombinations++
          const targetValue = kpi.targetValue || 100
          const score = Math.min(100, (kpiValue.value / targetValue) * 100)
          totalScore += score
        })

        // Önceki dönem - trend hesabı için
        const previousValues = previousKpiValues.filter(pv => pv.kpiId === kpi.id)
        previousValues.forEach(prevValue => {
          const targetValue = kpi.targetValue || 100
          const prevScore = Math.min(100, (prevValue.value / targetValue) * 100)
          totalPreviousScore += prevScore
        })
      })

      const averageScore = totalFactoryKpiCombinations > 0 ? totalScore / totalFactoryKpiCombinations : 0
      const previousAverageScore = totalFactoryKpiCombinations > 0 ? totalPreviousScore / totalFactoryKpiCombinations : 0
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
        kpiCount: totalKpis,
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