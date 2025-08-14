import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') || '2024-Q4'
    const factoryId = searchParams.get('factory') || searchParams.get('factoryId') || undefined
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'
    const mode = (searchParams.get('mode') || 'gap').toLowerCase() // 'gap' | 'delta'

    // Önceki dönem (delta için)
    const previousPeriod = period === '2024-Q4' ? '2024-Q3'
      : period === '2024-Q3' ? '2024-Q2'
      : period === '2024-Q2' ? '2024-Q1'
      : '2023-Q4'

    // Eylem bütçeleri + ilişkiler
    const actions = await prisma.action.findMany({
      include: {
        strategicTarget: {
          include: {
            strategicGoal: true,
          },
        },
        actionKpis: {
          include: {
            kpi: {
              include: {
                kpiValues: factoryId
                  ? { where: { period: { in: [period, previousPeriod] }, factoryId } }
                  : { where: { period: { in: [period, previousPeriod] } } },
              },
            },
          },
        },
        budgets: true,
        actionSteps: true,
      },
    })

    // SA ve SH bazında özetler
    const goalsMap = new Map<string, { saCode: string; totalPlanned: number; totalActual: number; totalEffectScore: number; efficiency?: number }>()
    const targetsMap = new Map<string, { shCode: string; totalPlanned: number; totalActual: number; effectScore: number; efficiency?: number }>()

    for (const action of actions) {
      const saCode = action.strategicTarget.strategicGoal.code
      const shCode = action.strategicTarget.code
      // Dönem bazlı aktivite maliyetleri öncelikli; yoksa eylem düzeyi bütçe
      const stepPlanned = (action.actionSteps || [])
        .filter((s: any) => s.period ? s.period === period : true)
        .reduce((sum: number, s: any) => sum + Number(s.plannedCost || 0), 0)
      const stepActual = (action.actionSteps || [])
        .filter((s: any) => s.period ? s.period === period : true)
        .reduce((sum: number, s: any) => sum + Number(s.actualCost || 0), 0)
      const planned = stepPlanned > 0 ? stepPlanned : (action.budgets[0]?.plannedAmount || 0)
      const actual = stepActual > 0 ? stepActual : (action.budgets[0]?.actualAmount || 0)

      // Etki skoru:
      // mode=gap  -> impactScore * completionPercent * (1 - currentAchievement)
      // mode=delta-> impactScore * completionPercent * max(0, currentAchievement - prevAchievement)
      let effectScore = 0
      let impactCount = 0
      for (const ak of action.actionKpis) {
        const impactScore = ak.impactScore ?? 0.5
        const completionRate = (action.completionPercent || 0) / 100
        const currentVals = ak.kpi.kpiValues.filter(kv => kv.period === period)
        const prevVals = ak.kpi.kpiValues.filter(kv => kv.period === previousPeriod)
        const target = ak.kpi.targetValue ?? 100
        const currAvg = currentVals.length > 0
          ? currentVals.reduce((s, kv) => s + kv.value, 0) / currentVals.length
          : 0
        const prevAvg = prevVals.length > 0
          ? prevVals.reduce((s, kv) => s + kv.value, 0) / prevVals.length
          : 0
        const currentAchievement = target > 0 ? Math.min(100, (currAvg / target) * 100) / 100 : 0
        const prevAchievement = target > 0 ? Math.min(100, (prevAvg / target) * 100) / 100 : 0

        const potential = mode === 'delta'
          ? impactScore * completionRate * Math.max(0, currentAchievement - prevAchievement)
          : impactScore * completionRate * (1 - currentAchievement)
        effectScore += potential
        impactCount++
      }
      if (impactCount > 0) effectScore = effectScore / impactCount

      const g = goalsMap.get(saCode) || { saCode, totalPlanned: 0, totalActual: 0, totalEffectScore: 0 }
      g.totalPlanned += planned
      g.totalActual += actual
      g.totalEffectScore += effectScore
      goalsMap.set(saCode, g)

      const t = targetsMap.get(shCode) || { shCode, totalPlanned: 0, totalActual: 0, effectScore: 0 }
      t.totalPlanned += planned
      t.totalActual += actual
      t.effectScore += effectScore
      targetsMap.set(shCode, t)
    }

    const goals = Array.from(goalsMap.values()).map((g) => ({
      ...g,
      efficiency: g.totalPlanned > 0 ? g.totalEffectScore / g.totalPlanned : undefined,
    }))
    const targets = Array.from(targetsMap.values()).map((t) => ({
      ...t,
      efficiency: t.totalPlanned > 0 ? t.effectScore / t.totalPlanned : undefined,
    }))

    return NextResponse.json({ period, mode, goals, targets })
  } catch (error) {
    console.error('Budget impact error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


