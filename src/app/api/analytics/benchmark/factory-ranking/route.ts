import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Çoklu periyot desteği
    const periodsParam = searchParams.getAll('periods')
    const periods = periodsParam.length > 0 ? periodsParam : [searchParams.get('period') || '2024-Q4']
    const currentPeriod = periods[periods.length - 1] // En son dönem
    
    const kpiId = searchParams.get('kpiId')
    const theme = searchParams.get('theme') // LEAN, DIGITAL, GREEN, RESILIENCE
    
    console.log('🏆 Factory Ranking API called:', { periods, currentPeriod, kpiId, theme })

    // KPI filtresi oluştur
    let kpiFilter: any = {}
    if (kpiId) {
      kpiFilter.id = kpiId
    }
    if (theme) {
      kpiFilter.themes = { contains: theme }
    }

    // Fabrika performans verilerini al (çoklu periyot)
    const factoryPerformance = await prisma.modelFactory.findMany({
      include: {
        kpiValues: {
          where: {
            period: { in: periods },
            kpi: kpiFilter
          },
          include: {
            kpi: {
              select: {
                id: true,
                number: true,
                description: true,
                unit: true,
                targetValue: true,
                themes: true
              }
            }
          }
        }
      }
    })

    // Benchmark hesaplamaları (çoklu periyot ortalaması)
    const benchmarkData = factoryPerformance.map(factory => {
      const values = factory.kpiValues
      
      // KPI bazında periyot ortalamaları hesapla
      const kpiAverages: Record<string, { totalScore: number; count: number; periods: string[] }> = {}
      
      values.forEach(kpiValue => {
        const kpiKey = kpiValue.kpi.id
        if (!kpiAverages[kpiKey]) {
          kpiAverages[kpiKey] = { totalScore: 0, count: 0, periods: [] }
        }
        
        const target = kpiValue.kpi.targetValue || 100
        const achievementRate = Math.min((kpiValue.value / target) * 100, 100)
        
        kpiAverages[kpiKey].totalScore += achievementRate
        kpiAverages[kpiKey].count++
        kpiAverages[kpiKey].periods.push(kpiValue.period)
      })
      
      // KPI ortalamalarını hesapla
      let totalScore = 0
      let achievedKpis = 0
      let totalKpis = Object.keys(kpiAverages).length
      
      const kpiScores = Object.entries(kpiAverages).map(([kpiId, avg]) => {
        const kpiValue = values.find(v => v.kpi.id === kpiId)
        if (!kpiValue) return null
        
        const averageAchievementRate = avg.totalScore / avg.count
        
        totalScore += averageAchievementRate
        if (averageAchievementRate >= 80) achievedKpis++
        
        return {
          kpiNumber: kpiValue.kpi.number,
          description: kpiValue.kpi.description,
          current: Math.round((avg.totalScore / avg.count) * 100) / 100,
          target: kpiValue.kpi.targetValue || 100,
          achievementRate: Math.round(averageAchievementRate * 100) / 100,
          unit: kpiValue.kpi.unit,
          themes: kpiValue.kpi.themes?.split(',') || [],
          periods: avg.periods
        }
      }).filter(Boolean)

      const averageScore = totalKpis > 0 ? totalScore / totalKpis : 0
      
      // Performans seviyesi belirleme
      let performanceLevel = 'bronze'
      if (averageScore >= 90) performanceLevel = 'platinum'
      else if (averageScore >= 80) performanceLevel = 'gold'
      else if (averageScore >= 70) performanceLevel = 'silver'

      return {
        factoryId: factory.id,
        factoryCode: factory.code,
        factoryName: factory.name,
        averageScore: Math.round(averageScore * 100) / 100,
        achievedKpis,
        totalKpis,
        achievementRate: totalKpis > 0 ? Math.round((achievedKpis / totalKpis) * 100) : 0,
        performanceLevel,
        kpiScores,
        region: factory.region || 'Türkiye'
      }
    })

    // Benchmark sıralaması (en yüksek skordan en düşüğe)
    benchmarkData.sort((a, b) => b.averageScore - a.averageScore)
    
    // Sıralama ve yüzdelik dilim hesaplaması
    const rankedData = benchmarkData.map((factory, index) => ({
      ...factory,
      rank: index + 1,
      percentile: Math.round((1 - index / benchmarkData.length) * 100)
    }))

    // İstatistikler
    const stats = {
      totalFactories: benchmarkData.length,
      averageScore: benchmarkData.reduce((sum, f) => sum + f.averageScore, 0) / benchmarkData.length,
      topPerformers: benchmarkData.filter(f => f.performanceLevel === 'platinum' || f.performanceLevel === 'gold').length,
      period,
      theme: theme || 'all',
      kpiCount: rankedData[0]?.totalKpis || 0
    }

    return NextResponse.json({
      success: true,
      ranking: rankedData,
      stats,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Factory ranking API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Fabrika sıralama verisi alınamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}
