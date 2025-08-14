import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Phase } from '@/generated/prisma'

export async function GET() {
  try {
    const phases = await prisma.phase.findMany({
      include: {
        actions: {
          select: {
            id: true,
            completionPercent: true,
            priority: true,
          }
        }
      }
    })

    const phaseStats = phases.map((phase: Phase & { actions: Array<{ id: string, completionPercent: number, priority: string }> }) => {
      const totalActions = phase.actions.length
      const completedActions = phase.actions.filter(action => action.completionPercent >= 100).length
      const inProgressActions = phase.actions.filter(action => action.completionPercent > 0 && action.completionPercent < 100).length
      const notStartedActions = phase.actions.filter(action => action.completionPercent === 0).length
      const highPriorityActions = phase.actions.filter(action => action.priority === 'HIGH').length
      const criticalActions = phase.actions.filter(action => action.priority === 'CRITICAL').length
      const avgCompletion = totalActions > 0
        ? Math.round(phase.actions.reduce((sum, a) => sum + (a.completionPercent || 0), 0) / totalActions)
        : 0
      const completionRate = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0
      const status: 'completed' | 'on-track' | 'at-risk' | 'behind' =
        avgCompletion >= 95 ? 'completed' :
        avgCompletion >= 70 ? 'on-track' :
        avgCompletion >= 40 ? 'at-risk' : 'behind'

      return {
        id: phase.id,
        name: phase.name,
        description: phase.description,
        totalActions,
        completedActions,
        inProgressActions,
        notStartedActions,
        avgCompletion,
        completionRate,
        highPriorityActions,
        criticalActions,
        status,
      }
    })

    return NextResponse.json(phaseStats)
  } catch (error) {
    console.error('Error fetching phase stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 