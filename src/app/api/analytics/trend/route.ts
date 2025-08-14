import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Period = string

function getPeriods(): Period[] {
  // Seed verisine uygun sabit dönem listesi
  return ['2023-Q4', '2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4']
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const factoryId = searchParams.get('factoryId') || searchParams.get('factory') || undefined
    const periods = getPeriods()

    // SA-SH-KPI yapısını ve ilgili KPI değerlerini çek
    const strategicGoals = await prisma.strategicGoal.findMany({
      include: {
        strategicTargets: {
          include: {
            kpis: {
              include: {
                kpiValues: {
                  where: factoryId ? { period: { in: periods }, factoryId } : { period: { in: periods } },
                }
              }
            }
          }
        }
      },
      orderBy: { code: 'asc' }
    })

    // Yardımcılar: normalize ağırlıklar
    function normalizeWeights(values: number[]): number[] {
      const sum = values.reduce((s, v) => s + (isFinite(v) ? v : 0), 0)
      if (sum <= 0) return values.map(() => 1 / (values.length || 1))
      return values.map(v => v / sum)
    }

    // Her SA için dönem bazında başarı serileri hesapla
    const saSeries = strategicGoals.map(goal => {
      // SH ağırlıkları
      const targetWeights = normalizeWeights(goal.strategicTargets.map(t => t.goalWeight ?? 1))

      const values = periods.map(period => {
        // Her SH için bu dönemdeki skor
        const shScores = goal.strategicTargets.map(target => {
          const kpiWeights = normalizeWeights(target.kpis.map(k => k.shWeight ?? 1))
          if (target.kpis.length === 0) return 0
          // KPI ağırlıklı ortalama
          let sum = 0
          target.kpis.forEach((kpi, idx) => {
            const targetValue = kpi.targetValue ?? 100
            const val = kpi.kpiValues.find(v => v.period === period)
            const ach = val ? Math.min(100, (val.value / targetValue) * 100) : 0
            sum += kpiWeights[idx] * ach
          })
          return Math.round(sum)
        })

        // SH ağırlıklı SA skoru
        const saScore = shScores.reduce((s, sc, idx) => s + targetWeights[idx] * sc, 0)
        return Math.round(saScore)
      })

      return { code: goal.code, title: goal.title, values }
    })

    // SH bazında son iki dönemdeki değişim (en çok iyileşen/gerileyen)
    const lastTwo = periods.slice(-2)
    const shChanges: Array<{ code: string; title: string | null; change: number }> = []
    strategicGoals.forEach(goal => {
      goal.strategicTargets.forEach(target => {
        const kpiWeights = normalizeWeights(target.kpis.map(k => k.shWeight ?? 1))
        const scores = lastTwo.map(period => {
          let sum = 0
          if (target.kpis.length === 0) return 0
          target.kpis.forEach((kpi, idx) => {
            const tVal = kpi.targetValue ?? 100
            const val = kpi.kpiValues.find(v => v.period === period)
            const ach = val ? Math.min(100, (val.value / tVal) * 100) : 0
            sum += kpiWeights[idx] * ach
          })
          return Math.round(sum)
        })
        const change = (scores[1] ?? 0) - (scores[0] ?? 0)
        shChanges.push({ code: target.code, title: target.title ?? null, change })
      })
    })

    const improving = shChanges.sort((a, b) => b.change - a.change).slice(0, 8)
    const declining = shChanges.sort((a, b) => a.change - b.change).slice(0, 8)

    return NextResponse.json({ periods, saSeries, improving, declining })
  } catch (error) {
    console.error('Analytics trend error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


