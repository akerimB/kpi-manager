import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factoryId')
    const period = searchParams.get('period') || '2024-Q4'
    
    console.log('🎨 Theme Comparison API called:', { factoryId, period })

    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Temaları tanımla
    const themes = [
      { code: 'LEAN', name: 'Yalın Dönüşüm', color: '#3B82F6' },
      { code: 'DIGITAL', name: 'Dijital Dönüşüm', color: '#8B5CF6' },
      { code: 'GREEN', name: 'Yeşil Dönüşüm', color: '#10B981' },
      { code: 'RESILIENCE', name: 'Dirençlilik', color: '#F59E0B' }
    ]

    // Bu fabrika ve tüm fabrikaların tema bazlı performansını al
    const allFactoriesData = await prisma.modelFactory.findMany({
      include: {
        kpiValues: {
          where: { period },
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

    // Tema bazlı performans hesaplama
    const themeComparison = themes.map(theme => {
      // Tüm fabrikaların bu temadaki ortalama performansı
      let allFactoriesTotal = 0
      let allFactoriesCount = 0
      
      // Bu fabrikanın bu temadaki performansı
      let currentFactoryTotal = 0
      let currentFactoryCount = 0

      allFactoriesData.forEach(factory => {
        factory.kpiValues.forEach(kpiValue => {
          const kpiThemes = kpiValue.kpi.themes?.split(',') || []
          
          if (kpiThemes.includes(theme.code)) {
            const target = kpiValue.kpi.targetValue || 100
            const achievement = Math.min((kpiValue.value / target) * 100, 100)
            
            allFactoriesTotal += achievement
            allFactoriesCount++
            
            if (factory.id === factoryId) {
              currentFactoryTotal += achievement
              currentFactoryCount++
            }
          }
        })
      })

      const industryAverage = allFactoriesCount > 0 ? allFactoriesTotal / allFactoriesCount : 0
      const factoryScore = currentFactoryCount > 0 ? currentFactoryTotal / currentFactoryCount : 0
      
      // Percentile hesaplama (bu fabrika kaç fabrikadan daha iyi)
      const factoryScores = allFactoriesData.map(factory => {
        let total = 0
        let count = 0
        
        factory.kpiValues.forEach(kpiValue => {
          const kpiThemes = kpiValue.kpi.themes?.split(',') || []
          if (kpiThemes.includes(theme.code)) {
            const target = kpiValue.kpi.targetValue || 100
            total += Math.min((kpiValue.value / target) * 100, 100)
            count++
          }
        })
        
        return count > 0 ? total / count : 0
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
        kpiCount: currentFactoryCount,
        performance: factoryScore >= industryAverage ? 'above' : 'below',
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
        overallPerformance: overallFactoryScore >= overallIndustryAverage ? 'above' : 'below',
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
