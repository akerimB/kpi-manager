import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userRole = searchParams.get('userRole') || 'MODEL_FACTORY'
    const factoryId = searchParams.get('factoryId')
    const periods = searchParams.getAll('periods')

    // Filtre koşulları
    const whereConditions: any = {}
    
    // Dönem filtresi
    if (periods.length > 0) {
      whereConditions.period = { in: periods }
    } else {
      whereConditions.period = '2024-Q4' // Default
    }

    // Fabrika filtresi
    if (userRole === 'MODEL_FACTORY' && factoryId) {
      whereConditions.factoryId = factoryId
    } else if (userRole === 'UPPER_MANAGEMENT' && factoryId) {
      whereConditions.factoryId = factoryId
    }

    // KPI değerlerini tema bazında al
    const kpiValues = await prisma.kpiValue.findMany({
      where: whereConditions,
      include: {
        kpi: {
          include: {
            strategicTarget: {
              include: {
                strategicGoal: true
              }
            }
          }
        },
        factory: {
          select: { name: true, id: true }
        }
      }
    })

    // Tema mapping
    const themeMapping: Record<string, string> = {
      'SA1': 'LEAN',
      'SA2': 'DIGITAL', 
      'SA3': 'GREEN',
      'SA4': 'RESILIENCE'
    }

    // Tema bazında performans hesaplama
    const themePerformance: Record<string, {
      totalScore: number
      count: number
      kpiIds: string[]
      periods: Set<string>
      factories: Set<string>
    }> = {}

    const factoryThemeScores: Record<string, Record<string, {
      score: number
      count: number
      factoryName: string
    }>> = {}

    // Initialize tema performance
    Object.values(themeMapping).forEach(theme => {
      themePerformance[theme] = {
        totalScore: 0,
        count: 0,
        kpiIds: [],
        periods: new Set(),
        factories: new Set()
      }
    })

    // KPI değerlerini işle
    kpiValues.forEach(kv => {
      const saCode = kv.kpi.strategicTarget?.strategicGoal?.code
      if (!saCode) return

      const theme = themeMapping[saCode]
      if (!theme) return

      const score = Math.min(100, (kv.value / (kv.kpi.targetValue || 100)) * 100)

      // Tema performance
      themePerformance[theme].totalScore += score
      themePerformance[theme].count++
      themePerformance[theme].kpiIds.push(kv.kpi.id)
      themePerformance[theme].periods.add(kv.period)
      themePerformance[theme].factories.add(kv.factoryId)

      // Fabrika tema scores
      if (!factoryThemeScores[kv.factoryId]) {
        factoryThemeScores[kv.factoryId] = {}
      }
      if (!factoryThemeScores[kv.factoryId][theme]) {
        factoryThemeScores[kv.factoryId][theme] = {
          score: 0,
          count: 0,
          factoryName: kv.factory.name
        }
      }
      factoryThemeScores[kv.factoryId][theme].score += score
      factoryThemeScores[kv.factoryId][theme].count++
    })

    // Tema trend analizi için önceki dönem verisi
    const previousPeriods = periods.map(p => {
      const [year, quarter] = p.split('-')
      const quarterNum = parseInt(quarter.replace('Q', ''))
      if (quarterNum === 1) {
        return `${parseInt(year) - 1}-Q4`
      } else {
        return `${year}-Q${quarterNum - 1}`
      }
    })

    const previousKpiValues = await prisma.kpiValue.findMany({
      where: {
        ...whereConditions,
        period: { in: previousPeriods }
      },
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
    })

    // Önceki dönem tema performansı
    const previousThemePerformance: Record<string, { totalScore: number; count: number }> = {}
    Object.values(themeMapping).forEach(theme => {
      previousThemePerformance[theme] = { totalScore: 0, count: 0 }
    })

    previousKpiValues.forEach(kv => {
      const saCode = kv.kpi.strategicTarget?.strategicGoal?.code
      if (!saCode) return

      const theme = themeMapping[saCode]
      if (!theme) return

      const score = Math.min(100, (kv.value / (kv.kpi.targetValue || 100)) * 100)
      previousThemePerformance[theme].totalScore += score
      previousThemePerformance[theme].count++
    })

    // Tema trendleri hesapla
    const trends = Object.entries(themePerformance).map(([theme, data]) => {
      const currentScore = data.count > 0 ? Math.round(data.totalScore / data.count) : 0
      const previousScore = previousThemePerformance[theme].count > 0 
        ? Math.round(previousThemePerformance[theme].totalScore / previousThemePerformance[theme].count) 
        : 0
      
      return {
        theme,
        currentScore,
        previousScore,
        change: currentScore - previousScore,
        kpiCount: data.count,
        periods: Array.from(data.periods),
        factoryCount: data.factories.size
      }
    })

    // Fabrika karşılaştırması
    const factoryComparison = Object.entries(factoryThemeScores).map(([factoryId, themes]) => {
      const themeScores = Object.entries(themes).map(([theme, data]) => ({
        theme,
        score: data.count > 0 ? Math.round(data.score / data.count) : 0
      }))

      const overallThemeScore = themeScores.length > 0 
        ? Math.round(themeScores.reduce((sum, t) => sum + t.score, 0) / themeScores.length)
        : 0

      const strongestTheme = themeScores.reduce((max, current) => 
        current.score > max.score ? current : max, { theme: 'N/A', score: 0 }
      )

      return {
        factoryId,
        factoryName: Object.values(themes)[0]?.factoryName || 'Bilinmeyen',
        overallThemeScore,
        strongestTheme: strongestTheme.theme,
        completedThemes: themeScores.filter(t => t.score >= 70).length,
        themeBreakdown: themeScores
      }
    }).sort((a, b) => b.overallThemeScore - a.overallThemeScore)

    // Tema hedefleri (sabit hedefler - gelecekte dinamik hale getirilebilir)
    const targets = Object.entries(themePerformance).map(([theme, data]) => {
      const currentScore = data.count > 0 ? Math.round(data.totalScore / data.count) : 0
      const targetValue = 85 // Hedef %85
      const achievement = Math.round((currentScore / targetValue) * 100)

      // Risk faktörleri
      const riskFactors = []
      if (currentScore < 50) riskFactors.push('Kritik düşük performans')
      if (data.count < 3) riskFactors.push('Yetersiz KPI sayısı')
      if (data.factories.size < 2) riskFactors.push('Sınırlı fabrika katılımı')

      return {
        theme,
        targetValue,
        actualValue: currentScore,
        achievement,
        riskFactors,
        kpiCount: data.count,
        factoryCount: data.factories.size
      }
    })

    // AI destekli öneriler
    const recommendations = trends.map(trend => {
      let priority: 'high' | 'medium' | 'low' = 'low'
      let recommendation = ''
      let expectedImprovement = 5

      if (trend.currentScore < 50) {
        priority = 'high'
        recommendation = `${trend.theme} temasında kritik seviyede performans düşüklüğü. Acil eylem planı gerekiyor.`
        expectedImprovement = 25
      } else if (trend.change < -10) {
        priority = 'high'
        recommendation = `${trend.theme} temasında önemli düşüş trendi. Kök neden analizi yapılmalı.`
        expectedImprovement = 20
      } else if (trend.currentScore < 70) {
        priority = 'medium'
        recommendation = `${trend.theme} temasında iyileştirme potansiyeli var. Best practice paylaşımı önerilir.`
        expectedImprovement = 15
      } else if (trend.change > 10) {
        priority = 'low'
        recommendation = `${trend.theme} temasında başarılı trend devam ediyor. Bu başarı diğer temalara aktarılabilir.`
        expectedImprovement = 10
      } else {
        recommendation = `${trend.theme} teması stabil performans gösteriyor. Sürekli iyileştirme programları uygulanabilir.`
        expectedImprovement = 8
      }

      return {
        theme: trend.theme,
        priority,
        recommendation,
        expectedImprovement,
        currentScore: trend.currentScore,
        targetScore: Math.min(100, trend.currentScore + expectedImprovement)
      }
    }).sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    return NextResponse.json({
      trends,
      factoryComparison,
      targets,
      recommendations,
      summary: {
        totalFactories: factoryComparison.length,
        avgOverallScore: factoryComparison.length > 0 
          ? Math.round(factoryComparison.reduce((sum, f) => sum + f.overallThemeScore, 0) / factoryComparison.length)
          : 0,
        strongestTheme: trends.reduce((max, current) => 
          current.currentScore > max.currentScore ? current : max, trends[0] || { theme: 'N/A', currentScore: 0 }
        ).theme,
        weakestTheme: trends.reduce((min, current) => 
          current.currentScore < min.currentScore ? current : min, trends[0] || { theme: 'N/A', currentScore: 100 }
        ).theme
      }
    })

  } catch (error) {
    console.error('Theme analytics error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
