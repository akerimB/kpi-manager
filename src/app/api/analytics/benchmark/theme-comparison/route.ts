import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factoryId')
    const period = searchParams.get('period') || '2024-Q4'
    const periodsParam = searchParams.getAll('periods')
    const periods = periodsParam.length > 0 ? periodsParam : [period]
    const selectedThemes = searchParams.getAll('themes')
    const selectedFactoryIds = searchParams.getAll('factoryIds')
    
    console.log('🎨 Theme Comparison API called:', { factoryId, periods, selectedFactoryIds, selectedThemes })

    // Temaları tanımla
    const allThemes = [
      { code: 'LEAN', name: 'Yalın Dönüşüm', color: '#3B82F6' },
      { code: 'DIGITAL', name: 'Dijital Dönüşüm', color: '#8B5CF6' },
      { code: 'GREEN', name: 'Yeşil Dönüşüm', color: '#10B981' },
      { code: 'RESILIENCE', name: 'Dirençlilik', color: '#F59E0B' }
    ]
    const themes = selectedThemes.length ? allThemes.filter(t => selectedThemes.includes(t.code)) : allThemes

    // Tüm fabrikaların (ve varsa belirli fabrikanın) tema bazlı performansını al
    const allFactoriesData = await prisma.modelFactory.findMany({
      include: {
        kpiValues: {
          where: { period: { in: periods } },
          include: {
            kpi: {
              select: {
                themes: true,
                targetValue: true,
                number: true,
                description: true
              }
            }
          }
        }
      }
    })

    // Gerçek matematiksel analiz - Tema bazlı performans hesaplama
    const themeComparison = themes.map(theme => {
      // Tema bazlı KPI kategorileri ve ağırlıkları
      const themeKPICategories = {
        'Teknoloji Transferi': { weight: 0.30, values: [] },
        'Eğitim Katılımı': { weight: 0.25, values: [] },
        'Sürdürülebilirlik': { weight: 0.20, values: [] },
        'İnovasyon': { weight: 0.15, values: [] },
        'Verimlilik': { weight: 0.10, values: [] }
      }
      
      // Tüm fabrikaların bu temadaki ağırlıklı performansı
      let allFactoriesWeightedTotal = 0
      let allFactoriesTotalWeight = 0
      
      // Seçili cohort'un ağırlıklı performansı
      let cohortWeightedTotal = 0
      let cohortTotalWeight = 0

      allFactoriesData.forEach(factory => {
        const factoryThemeKPIs: any[] = []
        
        factory.kpiValues.forEach(kpiValue => {
          const kpiThemes = kpiValue.kpi.themes?.split(',') || []
          
          if (kpiThemes.includes(theme.code)) {
            const target = kpiValue.kpi.targetValue || 1
            const achievement = Math.min(100, Math.max(0, (kpiValue.value / target) * 100))
            
            factoryThemeKPIs.push({ ...kpiValue, achievement })
          }
        })
        
        // Fabrika bazında ağırlıklı tema skoru hesapla
        if (factoryThemeKPIs.length > 0) {
          // KPI'ları kategorilere dağıt
          factoryThemeKPIs.forEach(kv => {
            const description = kv.kpi.description?.toLowerCase() || ''
            
            if (description.includes('teknoloji') || description.includes('transfer')) {
              themeKPICategories['Teknoloji Transferi'].values.push(kv)
            } else if (description.includes('eğitim') || description.includes('katılım')) {
              themeKPICategories['Eğitim Katılımı'].values.push(kv)
            } else if (description.includes('sürdürülebilir') || description.includes('çevre')) {
              themeKPICategories['Sürdürülebilirlik'].values.push(kv)
            } else if (description.includes('inovasyon') || description.includes('araştırma')) {
              themeKPICategories['İnovasyon'].values.push(kv)
            } else {
              themeKPICategories['Verimlilik'].values.push(kv)
            }
          })
          
          // Ağırlıklı fabrika skoru hesapla
          let factoryWeightedScore = 0
          let factoryTotalWeight = 0
          
          Object.entries(themeKPICategories).forEach(([category, data]) => {
            if (data.values.length > 0) {
              const categoryAvg = data.values.reduce((sum, kv) => sum + kv.achievement, 0) / data.values.length
              factoryWeightedScore += categoryAvg * data.weight
              factoryTotalWeight += data.weight
            }
          })
          
          const finalFactoryScore = factoryTotalWeight > 0 ? factoryWeightedScore / factoryTotalWeight : 0
          
          // Genel toplam ve cohort hesaplama
          allFactoriesWeightedTotal += finalFactoryScore
          allFactoriesTotalWeight += 1
          
          const inCohort = factoryId 
            ? factory.id === factoryId 
            : (selectedFactoryIds.length > 0 ? selectedFactoryIds.includes(factory.id) : true)
          if (inCohort) {
            cohortWeightedTotal += finalFactoryScore
            cohortTotalWeight += 1
          }
        }
      })

      const industryAverage = allFactoriesTotalWeight > 0 ? allFactoriesWeightedTotal / allFactoriesTotalWeight : 0
      const cohortAverage = cohortTotalWeight > 0 ? cohortWeightedTotal / cohortTotalWeight : 0
      const factoryScore = cohortAverage
      
      // Gerçek matematiksel percentile hesaplama
      const factoryScores = allFactoriesData.map(factory => {
        const factoryThemeKPIs: any[] = []
        
        factory.kpiValues.forEach(kpiValue => {
          const kpiThemes = kpiValue.kpi.themes?.split(',') || []
          if (kpiThemes.includes(theme.code)) {
            const target = kpiValue.kpi.targetValue || 1
            const achievement = Math.min(100, Math.max(0, (kpiValue.value / target) * 100))
            factoryThemeKPIs.push({ ...kpiValue, achievement })
          }
        })
        
        if (factoryThemeKPIs.length === 0) return 0
        
        // Aynı ağırlıklı hesaplama
        const factoryThemeCategories = {
          'Teknoloji Transferi': { weight: 0.30, values: [] },
          'Eğitim Katılımı': { weight: 0.25, values: [] },
          'Sürdürülebilirlik': { weight: 0.20, values: [] },
          'İnovasyon': { weight: 0.15, values: [] },
          'Verimlilik': { weight: 0.10, values: [] }
        }
        
        factoryThemeKPIs.forEach(kv => {
          const description = kv.kpi.description?.toLowerCase() || ''
          
          if (description.includes('teknoloji') || description.includes('transfer')) {
            factoryThemeCategories['Teknoloji Transferi'].values.push(kv)
          } else if (description.includes('eğitim') || description.includes('katılım')) {
            factoryThemeCategories['Eğitim Katılımı'].values.push(kv)
          } else if (description.includes('sürdürülebilir') || description.includes('çevre')) {
            factoryThemeCategories['Sürdürülebilirlik'].values.push(kv)
          } else if (description.includes('inovasyon') || description.includes('araştırma')) {
            factoryThemeCategories['İnovasyon'].values.push(kv)
          } else {
            factoryThemeCategories['Verimlilik'].values.push(kv)
          }
        })
        
        let factoryWeightedScore = 0
        let factoryTotalWeight = 0
        
        Object.entries(factoryThemeCategories).forEach(([category, data]) => {
          if (data.values.length > 0) {
            const categoryAvg = data.values.reduce((sum, kv) => sum + kv.achievement, 0) / data.values.length
            factoryWeightedScore += categoryAvg * data.weight
            factoryTotalWeight += data.weight
          }
        })
        
        return factoryTotalWeight > 0 ? factoryWeightedScore / factoryTotalWeight : 0
      }).sort((a, b) => a - b)

      const betterThanCount = factoryScores.filter(score => score < factoryScore).length
      const percentile = factoryScores.length > 1 ? Math.round((betterThanCount / (factoryScores.length - 1)) * 100) : 50

      return {
        theme: theme.code,
        themeName: theme.name,
        color: theme.color,
        factoryScore: Math.round(factoryScore * 100) / 100,
        industryAverage: Math.round(industryAverage * 100) / 100,
        percentile,
        kpiCount: cohortCount,
        performance: factoryScore > industryAverage ? 'above' : (factoryScore < industryAverage ? 'below' : 'equal'),
        gap: Math.round((factoryScore - industryAverage) * 100) / 100
      }
    })

    // Genel skor hesaplama
    const overallFactoryScore = themeComparison.reduce((sum, t) => sum + t.factoryScore, 0) / themes.length
    const overallIndustryAverage = themeComparison.reduce((sum, t) => sum + t.industryAverage, 0) / themes.length

    // En güçlü ve en zayıf temalar
    const strongestTheme = themeComparison.reduce((best, current) => 
      current.factoryScore > best.factoryScore ? current : best
    )
    const weakestTheme = themeComparison.reduce((worst, current) => 
      current.factoryScore < worst.factoryScore ? current : worst
    )

    return NextResponse.json({
      success: true,
      factoryId,
      period,
      themeComparison,
      summary: {
        overallScore: Math.round(overallFactoryScore * 100) / 100,
        industryAverage: Math.round(overallIndustryAverage * 100) / 100,
        overallPerformance: overallFactoryScore > overallIndustryAverage ? 'above' : (overallFactoryScore < overallIndustryAverage ? 'below' : 'equal'),
        strongestTheme: {
          code: strongestTheme.theme,
          name: strongestTheme.themeName,
          score: strongestTheme.factoryScore
        },
        weakestTheme: {
          code: weakestTheme.theme,
          name: weakestTheme.themeName,
          score: weakestTheme.factoryScore
        }
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Theme comparison API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Tema karşılaştırma verisi alınamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}
