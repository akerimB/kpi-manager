import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const periods = searchParams.getAll('periods')
    const period = searchParams.get('period') || '2024-Q4'
    const periodsToUse = periods.length > 0 ? periods : [period]
    const factoryId = searchParams.get('factoryId') || undefined

    // Fetch KPI values for selected scope
    const kpiValues = await prisma.kpiValue.findMany({
      where: {
        period: { in: periodsToUse },
        ...(factoryId ? { factoryId } : {})
      },
      include: {
        kpi: {
          include: {
            strategicTarget: {
              include: { strategicGoal: true }
            }
          }
        }
      },
      orderBy: [{ kpi: { number: 'asc' } }]
    })

    // Group by KPI
    type KPIAgg = {
      kpiId: string
      number: number
      description: string
      unit: string | null
      themes: string
      targetValue: number | null
      strategicGoal?: string
      strategicTarget?: string
      byPeriod: Record<string, { total: number; count: number }>
      total: number
      count: number
    }

    const map = new Map<string, KPIAgg>()

    for (const kv of kpiValues) {
      const kpi = kv.kpi
      if (!kpi) continue
      const target = kpi.targetValue || 100
      const ach = Math.min(100, (kv.value / target) * 100)
      let agg = map.get(kpi.id)
      if (!agg) {
        agg = {
          kpiId: kpi.id,
          number: kpi.number || 0,
          description: kpi.description || '',
          unit: kpi.unit || null,
          themes: typeof kpi.themes === 'string' ? kpi.themes : (Array.isArray(kpi.themes) ? kpi.themes.join(',') : ''),
          targetValue: kpi.targetValue,
          strategicGoal: kpi.strategicTarget?.strategicGoal?.title,
          strategicTarget: kpi.strategicTarget?.title,
          byPeriod: {},
          total: 0,
          count: 0
        }
        map.set(kpi.id, agg)
      }
      if (!agg.byPeriod[kv.period]) agg.byPeriod[kv.period] = { total: 0, count: 0 }
      agg.byPeriod[kv.period].total += ach
      agg.byPeriod[kv.period].count += 1
      agg.total += ach
      agg.count += 1
    }

    // Build rows with averages and trend between first and last selected period
    const firstPeriod = periodsToUse[0]
    const lastPeriod = periodsToUse[periodsToUse.length - 1]

    const rows = Array.from(map.values()).map(r => {
      const current = r.count > 0 ? r.total / r.count : 0
      const firstAvg = r.byPeriod[firstPeriod] ? (r.byPeriod[firstPeriod].total / r.byPeriod[firstPeriod].count) : current
      const lastAvg = r.byPeriod[lastPeriod] ? (r.byPeriod[lastPeriod].total / r.byPeriod[lastPeriod].count) : current
      const trend = lastAvg - firstAvg
      const perPeriod = periodsToUse.map(p => ({ period: p, value: r.byPeriod[p] ? (r.byPeriod[p].total / r.byPeriod[p].count) : 0 }))
      return {
        id: r.kpiId,
        number: r.number,
        description: r.description,
        unit: r.unit,
        themes: r.themes,
        strategicGoal: r.strategicGoal,
        strategicTarget: r.strategicTarget,
        achievement: Number(current.toFixed(1)),
        trend: Number(trend.toFixed(1)),
        byPeriod: perPeriod
      }
    }).sort((a, b) => a.number - b.number)

    return NextResponse.json({ success: true, count: rows.length, periods: periodsToUse, rows })
  } catch (error) {
    console.error('❌ KPI performance API error:', error)
    return NextResponse.json({ success: false, error: 'KPI performans verisi alınamadı', detail: String(error) }, { status: 500 })
  }
}


