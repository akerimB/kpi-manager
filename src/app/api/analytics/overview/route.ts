import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Basit analytics overview: genel başarı, tema dağılımı, riskli KPI'lar, zaman çizgisi
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'
    const factoryId = searchParams.get('factoryId') || searchParams.get('factory') || undefined
    const period = searchParams.get('period') || '2024-Q4'

    const previousPeriod = period === '2024-Q4' ? '2024-Q3' :
                          period === '2024-Q3' ? '2024-Q2' :
                          period === '2024-Q2' ? '2024-Q1' : '2023-Q4'

    // KPI'lar ve değerleri (mevcut ve önceki dönem)
    const kpis = await prisma.kpi.findMany({
      include: {
        kpiValues: {
          where: {
            OR: [
              { period },
              { period: previousPeriod }
            ],
            ...(factoryId ? { factoryId } : {})
          },
          orderBy: { period: 'desc' }
        }
      }
    })

    // Genel metrikler
    const factoriesCount = await prisma.modelFactory.count()
    const actionsCount = await prisma.action.count()
    const kpiCount = kpis.length

    let totalScore = 0
    let totalPrevScore = 0
    let valueCount = 0
    const themeAccumulator: Record<string, { sum: number; count: number }> = {}

    kpis.forEach(kpi => {
      const target = kpi.targetValue ?? 100
      const themes = (kpi.themes || '').split(',').map(t => t.trim()).filter(Boolean)
      const curr = kpi.kpiValues.find(v => v.period === period)
      const prev = kpi.kpiValues.find(v => v.period === previousPeriod)
      if (curr) {
        const score = Math.min(100, (curr.value / target) * 100)
        totalScore += score
        valueCount++
        themes.forEach(t => {
          themeAccumulator[t] = themeAccumulator[t] || { sum: 0, count: 0 }
          themeAccumulator[t].sum += score
          themeAccumulator[t].count += 1
        })
      }
      if (prev) {
        const prevScore = Math.min(100, (prev.value / target) * 100)
        totalPrevScore += prevScore
      }
    })

    const avgSuccess = valueCount > 0 ? Math.round(totalScore / valueCount) : 0
    const avgPrevSuccess = valueCount > 0 ? Math.round(totalPrevScore / valueCount) : 0
    const trend = avgSuccess - avgPrevSuccess

    const themes = Object.entries(themeAccumulator).map(([name, { sum, count }]) => ({
      name,
      avg: count > 0 ? Math.round(sum / count) : 0,
      count
    }))

    // Riskli KPI'lar (skoru düşük olanlar)
    const risks = kpis.map(kpi => {
      const target = kpi.targetValue ?? 100
      const curr = kpi.kpiValues.find(v => v.period === period)
      const score = curr ? Math.min(100, (curr.value / target) * 100) : 0
      return {
        id: kpi.id,
        number: kpi.number,
        description: kpi.description,
        success: Math.round(score),
        targetValue: target,
      }
    }).sort((a, b) => a.success - b.success).slice(0, 10)

    // Basit zaman çizgisi: son 4 dönem ortalaması (eldeki kurala göre)
    const periods = [period, previousPeriod]
    const timeline = await Promise.all(periods.map(async (p) => {
      const values = await prisma.kpiValue.findMany({ where: { period: p, ...(factoryId ? { factoryId } : {}) } })
      // hedefler için tekrar query yerine yaklaşık ortalama (target 100 vars.)
      const avg = values.length > 0 ? Math.round(values.reduce((s, v) => s + v.value, 0) / values.length) : 0
      return { period: p, avgSuccess: avg }
    }))

    return NextResponse.json({
      overall: { avgSuccess, trend, kpiCount, actionCount: actionsCount, factoryCount: factoriesCount },
      themes,
      topRisks: risks,
      timeline,
    })
  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}



