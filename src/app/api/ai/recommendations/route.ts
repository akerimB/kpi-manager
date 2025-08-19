import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface KPIAnalysis {
  kpiNumber: number
  description: string
  currentValue: number
  targetValue: number
  achievementRate: number
  trend: {
    direction: 'increasing' | 'decreasing' | 'stable'
    changePercent: number
    confidence: number
  }
  forecast: {
    nextPeriod: number
    confidence: number
    methodology: string
  }
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    type: 'improvement' | 'maintenance' | 'risk_mitigation'
    title: string
    description: string
    expectedImpact: string
    timeframe: string
    actionItems: string[]
  }[]
  riskFactors: {
    level: 'high' | 'medium' | 'low'
    description: string
    probability: number
    impact: string
  }[]
}

export async function POST(request: NextRequest) {
  try {
    const { factoryId, period } = await request.json()
    
    console.log('🤖 AI Recommendations starting for:', { factoryId, period })

    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Fabrika ve KPI verilerini al
    const factory = await prisma.modelFactory.findUnique({
      where: { id: factoryId },
      include: {
        kpiValues: {
          include: { kpi: true },
          orderBy: { period: 'desc' },
          take: 164 // Son 4 dönem (41 KPI x 4 dönem)
        }
      }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Fabrika bulunamadı' }, { status: 404 })
    }

    // Geçmiş dönemleri al
    const periods = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4']
    const periodIndex = periods.indexOf(period)
    const previousPeriods = periods.slice(Math.max(0, periodIndex - 3), periodIndex + 1)

    // KPI bazında analiz yap
    const analyses: KPIAnalysis[] = []
    
    // Unique KPI'ları al
    const uniqueKpis = Array.from(
      new Map(factory.kpiValues.map(kv => [kv.kpi.number, kv.kpi])).values()
    )

    for (const kpi of uniqueKpis) {
      // Bu KPI için dönemsel verileri al
      const kpiHistory = factory.kpiValues
        .filter(kv => kv.kpi.number === kpi.number)
        .sort((a, b) => a.period.localeCompare(b.period))
        .slice(-4) // Son 4 dönem

      if (kpiHistory.length === 0) continue

      const currentValue = kpiHistory[kpiHistory.length - 1]?.value || 0
      const targetValue = kpi.targetValue || 100
      const achievementRate = (currentValue / targetValue) * 100

      // Trend analizi
      const trend = analyzeTrend(kpiHistory)
      
      // Tahmin modeli (basit linear regression)
      const forecast = forecastNextPeriod(kpiHistory, kpi)
      
      // AI destekli öneriler
      const recommendations = generateRecommendations(kpi, currentValue, targetValue, trend, achievementRate)
      
      // Risk faktörleri
      const riskFactors = assessRiskFactors(kpi, currentValue, targetValue, trend)

      analyses.push({
        kpiNumber: kpi.number,
        description: kpi.description,
        currentValue,
        targetValue,
        achievementRate: Math.round(achievementRate * 100) / 100,
        trend,
        forecast,
        recommendations,
        riskFactors
      })
    }

    // Öncelik sıralaması (en kritik KPI'lar önce)
    analyses.sort((a, b) => {
      const aPriority = getPriorityScore(a)
      const bPriority = getPriorityScore(b)
      return bPriority - aPriority
    })

    // Genel öneriler ve insights
    const overallInsights = generateOverallInsights(analyses, factory)

    return NextResponse.json({
      success: true,
      factory: {
        id: factory.id,
        name: factory.name,
        code: factory.code
      },
      period,
      kpiAnalyses: analyses.slice(0, 15), // Top 15 KPI
      overallInsights,
      summary: {
        totalKpis: analyses.length,
        highRiskKpis: analyses.filter(a => a.riskFactors.some(r => r.level === 'high')).length,
        underperformingKpis: analyses.filter(a => a.achievementRate < 70).length,
        improvingKpis: analyses.filter(a => a.trend.direction === 'increasing').length,
        decreasingKpis: analyses.filter(a => a.trend.direction === 'decreasing').length
      },
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ AI Recommendations error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'AI önerileri oluşturulamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}

// Trend analizi fonksiyonu
function analyzeTrend(history: any[]): KPIAnalysis['trend'] {
  if (history.length < 2) {
    return { direction: 'stable', changePercent: 0, confidence: 0 }
  }

  const values = history.map(h => h.value)
  const first = values[0]
  const last = values[values.length - 1]
  const changePercent = ((last - first) / first) * 100

  // Linear regression for confidence
  const n = values.length
  const sumX = values.reduce((sum, _, i) => sum + i, 0)
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, i) => sum + i * val, 0)
  const sumXX = values.reduce((sum, _, i) => sum + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const confidence = Math.min(Math.abs(slope) * 10, 100) // Basit confidence hesabı

  let direction: 'increasing' | 'decreasing' | 'stable' = 'stable'
  if (Math.abs(changePercent) > 5) {
    direction = changePercent > 0 ? 'increasing' : 'decreasing'
  }

  return {
    direction,
    changePercent: Math.round(changePercent * 100) / 100,
    confidence: Math.round(confidence * 100) / 100
  }
}

// Tahmin fonksiyonu
function forecastNextPeriod(history: any[], kpi: any): KPIAnalysis['forecast'] {
  if (history.length < 2) {
    return { nextPeriod: history[0]?.value || 0, confidence: 0, methodology: 'insufficient_data' }
  }

  const values = history.map(h => h.value)
  
  // Basit moving average
  const movingAvg = values.reduce((sum, val) => sum + val, 0) / values.length
  
  // Linear trend
  const n = values.length
  const sumX = values.reduce((sum, _, i) => sum + i, 0)
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, i) => sum + i * val, 0)
  const sumXX = values.reduce((sum, _, i) => sum + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  const nextPeriod = intercept + slope * n
  const confidence = Math.max(20, Math.min(90, 70 - Math.abs(slope) * 5))

  return {
    nextPeriod: Math.round(Math.max(0, nextPeriod) * 100) / 100,
    confidence: Math.round(confidence),
    methodology: 'linear_regression'
  }
}

// Öneri üretme fonksiyonu
function generateRecommendations(kpi: any, currentValue: number, targetValue: number, trend: any, achievementRate: number): KPIAnalysis['recommendations'] {
  const recommendations: KPIAnalysis['recommendations'] = []
  
  // KPI türüne göre öneriler
  const desc = kpi.description.toLowerCase()
  
  if (achievementRate < 50) {
    recommendations.push({
      priority: 'high',
      type: 'improvement',
      title: 'Kritik Performans İyileştirmesi Gerekli',
      description: 'KPI hedefin yarısının altında performans gösteriyor. Acil eylem planı oluşturulmalı.',
      expectedImpact: 'Hedefin %70\'ine ulaşma potansiyeli',
      timeframe: '1-2 dönem',
      actionItems: [
        'Mevcut süreçleri detaylı analiz edin',
        'Kök neden analizi yapın',
        'Kaynak tahsisini gözden geçirin',
        'Haftalık takip toplantıları düzenleyin'
      ]
    })
  } else if (achievementRate < 80) {
    recommendations.push({
      priority: 'medium',
      type: 'improvement',
      title: 'Performans Optimizasyonu',
      description: 'Hedefe yakın performans gösteriyor ancak iyileştirme alanları mevcut.',
      expectedImpact: 'Hedefin %90\'ına ulaşma potansiyeli',
      timeframe: '2-3 dönem',
      actionItems: [
        'Best practice\'leri uygulayın',
        'Ekip eğitimlerini artırın',
        'Süreç otomasyonunu değerlendirin'
      ]
    })
  }

  if (trend.direction === 'decreasing' && trend.changePercent < -10) {
    recommendations.push({
      priority: 'high',
      type: 'risk_mitigation',
      title: 'Negatif Trend Durdurun',
      description: 'Sürekli düşüş trendi tespit edildi. Acil müdahale gerekli.',
      expectedImpact: 'Trend tersine çevirme',
      timeframe: '1 dönem',
      actionItems: [
        'Düşüşün nedenlerini acilen tespit edin',
        'Corrective action plan uygulayın',
        'Daha sık monitoring yapın'
      ]
    })
  }

  if (achievementRate > 120) {
    recommendations.push({
      priority: 'low',
      type: 'maintenance',
      title: 'Yüksek Performansı Sürdürün',
      description: 'Hedefi aşan mükemmel performans. Bu başarıyı sürdürmeye odaklanın.',
      expectedImpact: 'Sürdürülebilir üstün performans',
      timeframe: 'Sürekli',
      actionItems: [
        'Başarı faktörlerini dokumentedin',
        'Best practice\'i diğer alanlara yayın',
        'Hedefinizi yükselterek challenge yaratın'
      ]
    })
  }

  return recommendations
}

// Risk faktörleri analizi
function assessRiskFactors(kpi: any, currentValue: number, targetValue: number, trend: any): KPIAnalysis['riskFactors'] {
  const risks: KPIAnalysis['riskFactors'] = []
  
  if (trend.direction === 'decreasing' && trend.changePercent < -15) {
    risks.push({
      level: 'high',
      description: 'Güçlü negatif trend',
      probability: 85,
      impact: 'KPI hedefinin ciddi şekilde kaçırılması riski'
    })
  }
  
  if (currentValue < targetValue * 0.6) {
    risks.push({
      level: 'high',
      description: 'Hedeften uzak performans',
      probability: 90,
      impact: 'Dönem sonu hedefine ulaşamama'
    })
  }
  
  if (trend.confidence < 30) {
    risks.push({
      level: 'medium',
      description: 'Volatil performans',
      probability: 60,
      impact: 'Tahmin edilemez sonuçlar'
    })
  }
  
  return risks
}

// Genel öncelik skoru
function getPriorityScore(analysis: KPIAnalysis): number {
  let score = 0
  
  // Achievement rate
  if (analysis.achievementRate < 50) score += 50
  else if (analysis.achievementRate < 80) score += 30
  
  // Trend
  if (analysis.trend.direction === 'decreasing') score += 30
  
  // High risk factors
  score += analysis.riskFactors.filter(r => r.level === 'high').length * 20
  
  return score
}

// Genel insights
function generateOverallInsights(analyses: KPIAnalysis[], factory: any) {
  const insights = []
  
  const criticalKpis = analyses.filter(a => a.achievementRate < 50).length
  const improvingKpis = analyses.filter(a => a.trend.direction === 'increasing').length
  const decreasingKpis = analyses.filter(a => a.trend.direction === 'decreasing').length
  
  if (criticalKpis > 5) {
    insights.push({
      type: 'warning',
      title: 'Sistemik Performans Problemi',
      description: `${criticalKpis} KPI kritik seviyede. Genel strateji gözden geçirilmeli.`,
      priority: 'high'
    })
  }
  
  if (improvingKpis > decreasingKpis * 2) {
    insights.push({
      type: 'success',
      title: 'Pozitif Momentum',
      description: `KPI'ların çoğu iyileşme trendinde. Bu momentumu sürdürün.`,
      priority: 'medium'
    })
  }
  
  return insights
}
