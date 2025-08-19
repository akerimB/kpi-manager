import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const factoryId = searchParams.get('factoryId')
    const period = searchParams.get('period') || '2024-Q4'
    
    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Fabrika bilgilerini al
    const factory = await prisma.modelFactory.findUnique({
      where: { id: factoryId },
      include: {
        sectorWeights: true,
        targetWeights: true
      }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Fabrika bulunamadı' }, { status: 404 })
    }

    // Son 6 dönem için performans verisi
    const periods = [
      '2024-Q4', '2024-Q3', '2024-Q2', 
      '2024-Q1', '2023-Q4', '2023-Q3'
    ]

    // KPI değerleri ve hedefler
    const kpiData = await prisma.kpi.findMany({
      include: {
        kpiValues: {
          where: {
            factoryId,
            period: { in: periods }
          },
          orderBy: { period: 'desc' }
        },
        strategicTarget: {
          include: {
            strategicGoal: true
          }
        }
      }
    })

    // Performans hesaplamaları
    let currentPeriodScore = 0
    let previousPeriodScore = 0
    let totalKPIs = 0
    const performanceByPeriod: Record<string, number[]> = {}
    const criticalKPIs: any[] = []
    const topPerformingKPIs: any[] = []

    periods.forEach(p => performanceByPeriod[p] = [])

    kpiData.forEach(kpi => {
      const target = kpi.targetValue || 100
      const weight = kpi.shWeight || 1
      
      // Mevcut dönem değeri
      const currentValue = kpi.kpiValues.find(v => v.period === period)
      if (currentValue) {
        const score = Math.min(100, (currentValue.value / target) * 100)
        currentPeriodScore += score * weight
        totalKPIs += weight

        // Kritik KPI kontrolü (hedefin %80'inden düşük)
        if (score < 80) {
          criticalKPIs.push({
            number: kpi.number,
            name: kpi.name,
            current: currentValue.value,
            target,
            score: Math.round(score),
            strategicGoal: kpi.strategicTarget?.strategicGoal?.title,
            strategicTarget: kpi.strategicTarget?.name
          })
        }

        // En iyi performans gösteren KPI'lar (hedefin %110'u üstü)
        if (score >= 110) {
          topPerformingKPIs.push({
            number: kpi.number,
            name: kpi.name,
            current: currentValue.value,
            target,
            score: Math.round(score),
            strategicGoal: kpi.strategicTarget?.strategicGoal?.title
          })
        }
      }

      // Önceki dönem değeri
      const prevPeriod = periods[1] // 2024-Q3
      const previousValue = kpi.kpiValues.find(v => v.period === prevPeriod)
      if (previousValue) {
        const score = Math.min(100, (previousValue.value / target) * 100)
        previousPeriodScore += score * weight
      }

      // Dönem bazında skorlar
      periods.forEach(p => {
        const value = kpi.kpiValues.find(v => v.period === p)
        if (value) {
          const score = Math.min(100, (value.value / target) * 100)
          performanceByPeriod[p].push(score)
        }
      })
    })

    // Ortalama skorlar
    const currentAverage = totalKPIs > 0 ? Math.round(currentPeriodScore / totalKPIs) : 0
    const previousAverage = totalKPIs > 0 ? Math.round(previousPeriodScore / totalKPIs) : 0
    const trend = currentAverage - previousAverage

    // Dönem bazında ortalamalar
    const periodAverages = periods.map(p => ({
      period: p,
      average: performanceByPeriod[p].length > 0 
        ? Math.round(performanceByPeriod[p].reduce((a, b) => a + b, 0) / performanceByPeriod[p].length)
        : 0,
      kpiCount: performanceByPeriod[p].length
    }))

    // Sektörel ağırlık toplamı
    const totalSectorWeight = factory.sectorWeights.reduce((sum, sw) => sum + sw.share, 0)
    const topSectors = factory.sectorWeights
      .sort((a, b) => b.share - a.share)
      .slice(0, 3)
      .map(sw => ({ sector: sw.sector, weight: sw.share }))

    // Son güncelleme zamanı
    const lastUpdate = await prisma.kpiValue.findFirst({
      where: { factoryId },
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    })

    return NextResponse.json({
      factory: {
        id: factory.id,
        name: factory.name,
        code: factory.code,
        city: factory.city,
        region: factory.region,
        isActive: factory.isActive
      },
      performance: {
        currentScore: currentAverage,
        previousScore: previousAverage,
        trend,
        trendDirection: trend > 0 ? 'up' : trend < 0 ? 'down' : 'stable',
        totalKPIs: kpiData.length,
        periodsTracked: periods.length
      },
      timeline: periodAverages,
      highlights: {
        critical: criticalKPIs.slice(0, 5), // En kritik 5 KPI
        topPerforming: topPerformingKPIs.slice(0, 5), // En başarılı 5 KPI
        sectorFocus: topSectors,
        totalSectorWeight: Math.round(totalSectorWeight * 100) / 100
      },
      metadata: {
        period,
        lastUpdate: lastUpdate?.updatedAt,
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Factory performance summary error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
