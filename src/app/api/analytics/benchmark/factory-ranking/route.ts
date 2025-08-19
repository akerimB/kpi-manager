import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '2024-Q4'
    const kpiId = searchParams.get('kpiId')
    const theme = searchParams.get('theme') // LEAN, DIGITAL, GREEN, RESILIENCE
    
    console.log('🏆 Factory Ranking API called:', { period, kpiId, theme })

    // KPI filtresi oluştur
    let kpiFilter: any = {}
    if (kpiId) {
      kpiFilter.id = kpiId
    }
    if (theme) {
      kpiFilter.themes = { contains: theme }
    }

    // Fabrika performans verilerini al
    const factoryPerformance = await prisma.modelFactory.findMany({
      include: {
        kpiValues: {
          where: {
            period,
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

    // Benchmark hesaplamaları
    const benchmarkData = factoryPerformance.map(factory => {
      const values = factory.kpiValues
      
      // KPI başarı oranları hesapla
      let totalScore = 0
      let achievedKpis = 0
      let totalKpis = values.length
      
      const kpiScores = values.map(kpiValue => {
        const target = kpiValue.kpi.targetValue || 100
        const current = kpiValue.value
        const achievementRate = Math.min((current / target) * 100, 100)
        
        totalScore += achievementRate
        if (achievementRate >= 80) achievedKpis++
        
        return {
          kpiNumber: kpiValue.kpi.number,
          description: kpiValue.kpi.description,
          current,
          target,
          achievementRate: Math.round(achievementRate * 100) / 100,
          unit: kpiValue.kpi.unit,
          themes: kpiValue.kpi.themes?.split(',') || []
        }
      })

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
