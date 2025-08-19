import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '2024-Q4'
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'

    // Sadece üst yönetim erişebilir
    if (userRole !== 'UPPER_MANAGEMENT') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    const previousPeriod = period === '2024-Q4' ? '2024-Q3' :
                          period === '2024-Q3' ? '2024-Q2' :
                          period === '2024-Q2' ? '2024-Q1' : '2023-Q4'

    // Tüm fabrikalar ve KPI değerleri
    const [factories, kpiValues, previousKpiValues, strategicGoals] = await Promise.all([
      prisma.modelFactory.findMany({
        select: { id: true, name: true, province: true }
      }),
      prisma.kpiValue.findMany({
        where: { period },
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
      }),
      prisma.kpiValue.findMany({
        where: { period: previousPeriod },
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
      }),
      prisma.strategicGoal.findMany({
        include: {
          strategicTargets: {
            include: {
              kpis: true
            }
          }
        }
      })
    ])

    // Genel sağlık durumu hesapla
    let totalScore = 0
    let valueCount = 0
    let totalPrevScore = 0
    let prevValueCount = 0

    const factoryScores: Record<string, { score: number; count: number; name: string }> = {}
    const saScores: Record<string, { current: number; previous: number; count: number; name: string }> = {}

    // Initialize factory scores
    factories.forEach(factory => {
      factoryScores[factory.id] = { score: 0, count: 0, name: factory.name }
    })

    // Initialize SA scores
    strategicGoals.forEach(sa => {
      saScores[sa.code] = { current: 0, previous: 0, count: 0, name: sa.title }
    })

    // Current period calculation
    kpiValues.forEach(kv => {
      const target = kv.kpi.targetValue || 100
      const score = Math.min(100, (kv.value / target) * 100)
      totalScore += score
      valueCount++

      // Factory level
      if (factoryScores[kv.factoryId]) {
        factoryScores[kv.factoryId].score += score
        factoryScores[kv.factoryId].count++
      }

      // SA level
      const saCode = kv.kpi.strategicTarget.strategicGoal.code
      if (saScores[saCode]) {
        saScores[saCode].current += score
        saScores[saCode].count++
      }
    })

    // Previous period calculation
    previousKpiValues.forEach(kv => {
      const target = kv.kpi.targetValue || 100
      const score = Math.min(100, (kv.value / target) * 100)
      totalPrevScore += score
      prevValueCount++

      // SA level previous
      const saCode = kv.kpi.strategicTarget.strategicGoal.code
      if (saScores[saCode]) {
        saScores[saCode].previous += score
      }
    })

    const overallScore = valueCount > 0 ? Math.round(totalScore / valueCount) : 0
    const prevOverallScore = prevValueCount > 0 ? Math.round(totalPrevScore / prevValueCount) : 0
    const overallTrend = overallScore - prevOverallScore

    // Health status
    let healthStatus: 'excellent' | 'good' | 'warning' | 'critical' = 'critical'
    if (overallScore >= 85) healthStatus = 'excellent'
    else if (overallScore >= 70) healthStatus = 'good'
    else if (overallScore >= 50) healthStatus = 'warning'

    // Calculate factory averages and find top performers
    const factoryPerformance = Object.entries(factoryScores)
      .map(([id, data]) => ({
        factoryId: id,
        factory: data.name,
        score: data.count > 0 ? Math.round(data.score / data.count) : 0,
        improvement: 0 // Will calculate below
      }))
      .sort((a, b) => b.score - a.score)

    // Calculate SA averages
    const strategicAlignment = Object.fromEntries(
      Object.entries(saScores).map(([code, data]) => [
        code.toLowerCase().replace('.', ''),
        {
          name: data.name,
          score: data.count > 0 ? Math.round(data.current / data.count) : 0,
          trend: data.count > 0 ? Math.round((data.current / data.count) - (data.previous / data.count || 0)) : 0
        }
      ])
    )

    // Generate key findings
    const keyFindings = [
      {
        category: 'Genel Performans',
        finding: `Sistem geneli performans %${overallScore} seviyesinde, önceki döneme göre %${overallTrend >= 0 ? '+' : ''}${overallTrend} değişim gösterdi.`,
        impact: overallTrend < -10 ? 'high' : overallTrend < 0 ? 'medium' : 'low' as 'high' | 'medium' | 'low',
        recommendation: overallTrend < 0 
          ? 'Performans düşüşüne neden olan faktörlerin analiz edilmesi ve düzeltici aksiyonlar alınması önerilir.'
          : 'Mevcut pozitif trendin sürdürülmesi için en iyi uygulamaların yaygınlaştırılması önerilir.'
      },
      {
        category: 'Fabrika Dağılımı',
        finding: `${factoryPerformance.filter(f => f.score >= 70).length} fabrika hedef performansın üzerinde, ${factoryPerformance.filter(f => f.score < 50).length} fabrika kritik seviyede.`,
        impact: factoryPerformance.filter(f => f.score < 50).length > 3 ? 'high' : 'medium' as 'high' | 'medium' | 'low',
        recommendation: 'Düşük performanslı fabrikalar için mentörlük programı ve best practice paylaşımı yapılması önerilir.'
      }
    ]

    // Risk areas
    const riskAreas = [
      {
        area: 'Düşük Performanslı Fabrikalar',
        risk: `${factoryPerformance.filter(f => f.score < 50).length} fabrika kritik performans seviyesinde`,
        factories: factoryPerformance.filter(f => f.score < 50).slice(0, 3).map(f => f.factory),
        severity: factoryPerformance.filter(f => f.score < 50).length > 3 ? 'high' : 'medium' as 'high' | 'medium' | 'low'
      }
    ]

    // Top performers (top 3)
    const topPerformers = factoryPerformance.slice(0, 3).map(factory => ({
      factory: factory.factory,
      score: factory.score,
      improvement: Math.max(0, factory.score - 60) // Simplified improvement calculation
    }))

    return NextResponse.json({
      overallHealth: {
        score: overallScore,
        status: healthStatus,
        trend: overallTrend
      },
      keyFindings,
      strategicAlignment,
      riskAreas,
      topPerformers
    })

  } catch (error) {
    console.error('Executive summary error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
