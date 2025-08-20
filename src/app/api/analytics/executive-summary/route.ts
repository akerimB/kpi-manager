import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    
    // Çoklu periyot desteği
    const periodsParam = searchParams.getAll('periods')
    const periods = periodsParam.length > 0 ? periodsParam : [searchParams.get('period') || '2024-Q4']
    const currentPeriod = periods[periods.length - 1] // En son dönem
    
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'

    // Sadece üst yönetim erişebilir
    if (userRole !== 'UPPER_MANAGEMENT') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
    }

    // Önceki dönem hesapla (trend için)
    const previousPeriod = currentPeriod === '2024-Q4' ? '2024-Q3' :
                          currentPeriod === '2024-Q3' ? '2024-Q2' :
                          currentPeriod === '2024-Q2' ? '2024-Q1' : '2023-Q4'
    
    console.log('👔 Executive Summary API called with periods:', periods)

    // Tüm fabrikalar ve KPI değerleri
    const [factories, kpiValues, previousKpiValues, strategicGoals] = await Promise.all([
      prisma.modelFactory.findMany({
        select: { id: true, name: true, city: true }
      }),
      prisma.kpiValue.findMany({
        where: { period: { in: periods } },
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

    // Veri kontrolü
    if (!factories || factories.length === 0) {
      return NextResponse.json({
        overallHealth: { score: 0, status: 'critical', trend: 0 },
        keyFindings: [],
        strategicAlignment: {},
        riskAreas: [],
        topPerformers: []
      })
    }

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
      if (sa.code) {
        saScores[sa.code] = { current: 0, previous: 0, count: 0, name: sa.title || 'Bilinmeyen SA' }
      }
    })

    // Gerçek matematiksel analiz - Ağırlıklı KPI hesaplama
    const kpiCategories = {
      'Teknoloji Transferi': { weight: 0.25, values: [] },
      'Eğitim Katılımı': { weight: 0.20, values: [] },
      'Sürdürülebilirlik': { weight: 0.20, values: [] },
      'İnovasyon': { weight: 0.15, values: [] },
      'Verimlilik': { weight: 0.10, values: [] },
      'Kalite': { weight: 0.10, values: [] }
    }
    
    // KPI'ları kategorilere dağıt ve ağırlıklı hesapla
    kpiValues.forEach(kv => {
      if (!kv.kpi || !kv.kpi.strategicTarget || !kv.kpi.strategicTarget.strategicGoal) {
        return // Skip invalid entries
      }
      
      const target = kv.kpi.targetValue || 1 // Avoid division by zero
      const achievement = Math.min(100, Math.max(0, (kv.value / target) * 100))
      
      // KPI'yı kategorilere dağıt
      const description = kv.kpi.description?.toLowerCase() || ''
      
      if (description.includes('teknoloji') || description.includes('transfer')) {
        kpiCategories['Teknoloji Transferi'].values.push({ ...kv, achievement })
      } else if (description.includes('eğitim') || description.includes('katılım')) {
        kpiCategories['Eğitim Katılımı'].values.push({ ...kv, achievement })
      } else if (description.includes('sürdürülebilir') || description.includes('çevre')) {
        kpiCategories['Sürdürülebilirlik'].values.push({ ...kv, achievement })
      } else if (description.includes('inovasyon') || description.includes('araştırma')) {
        kpiCategories['İnovasyon'].values.push({ ...kv, achievement })
      } else if (description.includes('verimlilik') || description.includes('üretim')) {
        kpiCategories['Verimlilik'].values.push({ ...kv, achievement })
      } else {
        kpiCategories['Kalite'].values.push({ ...kv, achievement })
      }
      
      // Factory breakdown
      if (kv.factoryId && factoryScores[kv.factoryId]) {
        factoryScores[kv.factoryId].score += achievement
        factoryScores[kv.factoryId].count++
      }
      
      // SA breakdown
      if (kv.kpi.strategicTarget?.strategicGoal?.code) {
        const saCode = kv.kpi.strategicTarget.strategicGoal.code
        if (saScores[saCode]) {
          saScores[saCode].current += achievement
          saScores[saCode].count++
        }
      }
    })
    
    // Ağırlıklı genel skor hesapla
    Object.entries(kpiCategories).forEach(([category, data]) => {
      if (data.values.length > 0) {
        const categoryAvg = data.values.reduce((sum, kv) => sum + kv.achievement, 0) / data.values.length
        totalScore += categoryAvg * data.weight
        valueCount += data.weight
      }
    })

    // Önceki dönem için aynı ağırlıklı hesaplama
    const prevKpiCategories = {
      'Teknoloji Transferi': { weight: 0.25, values: [] },
      'Eğitim Katılımı': { weight: 0.20, values: [] },
      'Sürdürülebilirlik': { weight: 0.20, values: [] },
      'İnovasyon': { weight: 0.15, values: [] },
      'Verimlilik': { weight: 0.10, values: [] },
      'Kalite': { weight: 0.10, values: [] }
    }
    
    previousKpiValues.forEach(kv => {
      if (!kv.kpi || !kv.kpi.strategicTarget || !kv.kpi.strategicTarget.strategicGoal) {
        return // Skip invalid entries
      }
      
      const target = kv.kpi.targetValue || 1
      const achievement = Math.min(100, Math.max(0, (kv.value / target) * 100))
      
      // KPI'yı kategorilere dağıt
      const description = kv.kpi.description?.toLowerCase() || ''
      
      if (description.includes('teknoloji') || description.includes('transfer')) {
        prevKpiCategories['Teknoloji Transferi'].values.push({ ...kv, achievement })
      } else if (description.includes('eğitim') || description.includes('katılım')) {
        prevKpiCategories['Eğitim Katılımı'].values.push({ ...kv, achievement })
      } else if (description.includes('sürdürülebilir') || description.includes('çevre')) {
        prevKpiCategories['Sürdürülebilirlik'].values.push({ ...kv, achievement })
      } else if (description.includes('inovasyon') || description.includes('araştırma')) {
        prevKpiCategories['İnovasyon'].values.push({ ...kv, achievement })
      } else if (description.includes('verimlilik') || description.includes('üretim')) {
        prevKpiCategories['Verimlilik'].values.push({ ...kv, achievement })
      } else {
        prevKpiCategories['Kalite'].values.push({ ...kv, achievement })
      }
      
      // SA breakdown for previous period
      if (kv.kpi.strategicTarget?.strategicGoal?.code) {
        const saCode = kv.kpi.strategicTarget.strategicGoal.code
        if (saScores[saCode]) {
          saScores[saCode].previous += achievement
        }
      }
    })
    
    // Önceki dönem ağırlıklı skor hesapla
    Object.entries(prevKpiCategories).forEach(([category, data]) => {
      if (data.values.length > 0) {
        const categoryAvg = data.values.reduce((sum, kv) => sum + kv.achievement, 0) / data.values.length
        totalPrevScore += categoryAvg * data.weight
        prevValueCount += data.weight
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
          trend: data.count > 0 ? Math.round((data.current / data.count) - ((data.previous ?? 0) / data.count)) : 0
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json({ 
      error: 'Sunucu hatası', 
      detail: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
