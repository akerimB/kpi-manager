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

    // Gerçek matematiksel analiz - Ağırlıklı fabrika performans hesaplama
    const benchmarkData = factoryPerformance.map(factory => {
      const values = factory.kpiValues
      
      // KPI kategorileri ve ağırlıkları
      const kpiCategories = {
        'Teknoloji Transferi': { weight: 0.25, values: [] },
        'Eğitim Katılımı': { weight: 0.20, values: [] },
        'Sürdürülebilirlik': { weight: 0.20, values: [] },
        'İnovasyon': { weight: 0.15, values: [] },
        'Verimlilik': { weight: 0.10, values: [] },
        'Kalite': { weight: 0.10, values: [] }
      }
      
      // KPI'ları kategorilere dağıt
      values.forEach(kpiValue => {
        const target = kpiValue.kpi.targetValue || 1
        const achievement = Math.min(100, Math.max(0, (kpiValue.value / target) * 100))
        
        const description = kpiValue.kpi.description?.toLowerCase() || ''
        
        if (description.includes('teknoloji') || description.includes('transfer')) {
          kpiCategories['Teknoloji Transferi'].values.push({ ...kpiValue, achievement })
        } else if (description.includes('eğitim') || description.includes('katılım')) {
          kpiCategories['Eğitim Katılımı'].values.push({ ...kpiValue, achievement })
        } else if (description.includes('sürdürülebilir') || description.includes('çevre')) {
          kpiCategories['Sürdürülebilirlik'].values.push({ ...kpiValue, achievement })
        } else if (description.includes('inovasyon') || description.includes('araştırma')) {
          kpiCategories['İnovasyon'].values.push({ ...kpiValue, achievement })
        } else if (description.includes('verimlilik') || description.includes('üretim')) {
          kpiCategories['Verimlilik'].values.push({ ...kpiValue, achievement })
        } else {
          kpiCategories['Kalite'].values.push({ ...kpiValue, achievement })
        }
      })
      
      // Ağırlıklı performans hesapla
      let totalWeightedScore = 0
      let totalWeight = 0
      let achievedKpis = 0
      let totalKpis = 0
      
      const kpiScores = Object.entries(kpiCategories).map(([category, data]) => {
        if (data.values.length === 0) return null
        
        const categoryAvg = data.values.reduce((sum, kv) => sum + kv.achievement, 0) / data.values.length
        totalWeightedScore += categoryAvg * data.weight
        totalWeight += data.weight
        totalKpis += data.values.length
        
        if (categoryAvg >= 80) achievedKpis += data.values.length
        
        return {
          category,
          averageScore: Math.round(categoryAvg * 100) / 100,
          kpiCount: data.values.length,
          weight: data.weight,
          kpis: data.values.map(kv => ({
            kpiNumber: kv.kpi.number,
            description: kv.kpi.description,
            current: Math.round(kv.achievement * 100) / 100,
            target: kv.kpi.targetValue || 1,
            achievementRate: Math.round(kv.achievement * 100) / 100,
            unit: kv.kpi.unit,
            themes: kv.kpi.themes?.split(',') || [],
            period: kv.period
          }))
        }
      }).filter(Boolean)

      const averageScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0
      
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
      averageScore: benchmarkData.length > 0 ? benchmarkData.reduce((sum, f) => sum + f.averageScore, 0) / benchmarkData.length : 0,
      topPerformers: benchmarkData.filter(f => f.performanceLevel === 'platinum' || f.performanceLevel === 'gold').length,
      period: periods.length > 1 ? `${periods[0]} - ${currentPeriod}` : currentPeriod,
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
