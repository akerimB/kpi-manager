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

    // Fabrikanın eylemlerini al
    const actions = await prisma.action.findMany({
      include: {
        phase: true,
        actionSteps: {
          orderBy: { stepOrder: 'asc' }
        },
        budgets: {
          include: {
            actionSteps: true
          }
        },
        kpis: {
          include: {
            kpi: {
              select: {
                number: true,
                name: true,
                targetValue: true,
                kpiValues: {
                  where: {
                    factoryId,
                    period
                  }
                }
              }
            }
          }
        }
      }
    })

    const actionAnalysis = actions.map(action => {
      // Adım analizi
      const totalSteps = action.actionSteps.length
      const completedSteps = action.actionSteps.filter(step => 
        step.completionPercent >= 100
      ).length
      const completionRate = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0

      // Bütçe analizi
      const totalPlannedCost = action.actionSteps.reduce((sum, step) => 
        sum + (step.plannedCost || 0), 0
      )
      const totalActualCost = action.actionSteps.reduce((sum, step) => 
        sum + (step.actualCost || 0), 0
      )
      const budgetUtilization = totalPlannedCost > 0 
        ? Math.round((totalActualCost / totalPlannedCost) * 100) 
        : 0

      // KPI etki analizi
      const kpiImpacts = action.kpis.map(ak => {
        const kpi = ak.kpi
        const currentValue = kpi.kpiValues[0]
        const target = kpi.targetValue || 100
        const achievement = currentValue 
          ? Math.min(100, (currentValue.value / target) * 100)
          : 0

        return {
          kpiNumber: kpi.number,
          kpiName: kpi.name,
          impactScore: ak.impactScore,
          currentAchievement: Math.round(achievement),
          target,
          currentValue: currentValue?.value || 0
        }
      })

      // Durum belirleme
      let status: 'on-track' | 'at-risk' | 'delayed' | 'completed' = 'on-track'
      if (completionRate >= 100) status = 'completed'
      else if (completionRate < 50 && budgetUtilization > 70) status = 'delayed'
      else if (completionRate < 75 && budgetUtilization > 85) status = 'at-risk'

      // Zaman analizi
      const now = new Date()
      const startDate = action.plannedStartDate ? new Date(action.plannedStartDate) : null
      const endDate = action.plannedEndDate ? new Date(action.plannedEndDate) : null
      
      let timeProgress = 0
      if (startDate && endDate) {
        const totalDuration = endDate.getTime() - startDate.getTime()
        const elapsed = now.getTime() - startDate.getTime()
        timeProgress = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100))
      }

      return {
        id: action.id,
        title: action.title,
        description: action.description,
        phase: action.phase?.name || 'Belirsiz',
        status,
        progress: {
          completion: completionRate,
          timeProgress: Math.round(timeProgress),
          totalSteps,
          completedSteps
        },
        budget: {
          planned: totalPlannedCost,
          actual: totalActualCost,
          utilization: budgetUtilization,
          currency: action.actionSteps[0]?.currency || 'TRY'
        },
        kpiImpacts,
        timeline: {
          plannedStart: action.plannedStartDate,
          plannedEnd: action.plannedEndDate,
          actualStart: action.actualStartDate,
          actualEnd: action.actualEndDate
        },
        priority: action.priority || 'MEDIUM'
      }
    })

    // Genel istatistikler
    const totalActions = actionAnalysis.length
    const completedActions = actionAnalysis.filter(a => a.status === 'completed').length
    const atRiskActions = actionAnalysis.filter(a => a.status === 'at-risk').length
    const delayedActions = actionAnalysis.filter(a => a.status === 'delayed').length

    const totalPlannedBudget = actionAnalysis.reduce((sum, a) => sum + a.budget.planned, 0)
    const totalActualBudget = actionAnalysis.reduce((sum, a) => sum + a.budget.actual, 0)
    const overallBudgetUtilization = totalPlannedBudget > 0 
      ? Math.round((totalActualBudget / totalPlannedBudget) * 100)
      : 0

    const avgCompletion = totalActions > 0
      ? Math.round(actionAnalysis.reduce((sum, a) => sum + a.progress.completion, 0) / totalActions)
      : 0

    // Faz bazında gruplandırma
    const phaseGroups = actionAnalysis.reduce((groups: Record<string, any[]>, action) => {
      const phase = action.phase
      if (!groups[phase]) groups[phase] = []
      groups[phase].push(action)
      return groups
    }, {})

    const phaseAnalysis = Object.entries(phaseGroups).map(([phaseName, phaseActions]) => ({
      phaseName,
      actionCount: phaseActions.length,
      avgCompletion: Math.round(
        phaseActions.reduce((sum, a) => sum + a.progress.completion, 0) / phaseActions.length
      ),
      budget: {
        planned: phaseActions.reduce((sum, a) => sum + a.budget.planned, 0),
        actual: phaseActions.reduce((sum, a) => sum + a.budget.actual, 0)
      },
      statusDistribution: {
        completed: phaseActions.filter(a => a.status === 'completed').length,
        onTrack: phaseActions.filter(a => a.status === 'on-track').length,
        atRisk: phaseActions.filter(a => a.status === 'at-risk').length,
        delayed: phaseActions.filter(a => a.status === 'delayed').length
      }
    }))

    // Kritik eylemler (risk altında olanlar)
    const criticalActions = actionAnalysis
      .filter(a => a.status === 'at-risk' || a.status === 'delayed')
      .sort((a, b) => {
        // Öncelik: delayed > at-risk, sonra completion rate'e göre
        if (a.status !== b.status) {
          return a.status === 'delayed' ? -1 : 1
        }
        return a.progress.completion - b.progress.completion
      })
      .slice(0, 5)

    return NextResponse.json({
      summary: {
        totalActions,
        completedActions,
        atRiskActions,
        delayedActions,
        avgCompletion,
        budget: {
          totalPlanned: totalPlannedBudget,
          totalActual: totalActualBudget,
          utilization: overallBudgetUtilization
        }
      },
      actions: actionAnalysis,
      phaseAnalysis,
      criticalActions,
      metadata: {
        period,
        factoryId,
        calculatedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Action tracking error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
