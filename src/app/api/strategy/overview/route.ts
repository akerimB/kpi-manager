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
            }
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

    // Her SA için başarım hesapla (tüm fabrikalar bazında)
    const strategicOverview = strategicGoals.map(sa => {
      let totalKpis = 0
      let totalScore = 0
      let totalPreviousScore = 0
      let totalFactoryKpiCombinations = 0

      sa.strategicTargets.forEach(sh => {
        sh.kpis.forEach(kpi => {
          totalKpis++
          
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
      })

      const averageScore = totalFactoryKpiCombinations > 0 ? totalScore / totalFactoryKpiCombinations : 0
      const previousAverageScore = totalFactoryKpiCombinations > 0 ? totalPreviousScore / totalFactoryKpiCombinations : 0
      const trend = averageScore - previousAverageScore

      // Eğer belirli bir fabrika seçiliyse, o fabrika için ayrı hesaplama
      let factorySpecificScore = null
      if (factoryId) {
        let factoryScore = 0
        let factoryKpiCount = 0
        
        sa.strategicTargets.forEach(sh => {
          sh.kpis.forEach(kpi => {
            const factoryKpiValue = kpi.kpiValues.find(kv => kv.factory.id === factoryId)
            if (factoryKpiValue) {
              factoryKpiCount++
              const targetValue = kpi.targetValue || 100
              const score = Math.min(100, (factoryKpiValue.value / targetValue) * 100)
              factoryScore += score
            }
          })
        })
        
        factorySpecificScore = factoryKpiCount > 0 ? Math.round(factoryScore / factoryKpiCount) : 0
      }

      return {
        id: sa.id,
        code: sa.code,
        title: sa.title,
        description: sa.description || '',
        successRate: Math.round(averageScore), // Tüm fabrikalar ortalaması
        factorySpecificScore, // Seçili fabrika skoru (varsa)
        trend: Math.round(trend),
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