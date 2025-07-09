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
            code: true,
            description: true,
            completionPercent: true
          }
        }
      }
    })

    const phaseStats = phases.map((phase: Phase & { actions: Array<{ id: string, code: string, description: string, completionPercent: number }> }) => {
      const totalActions = phase.actions.length
      const completedActions = phase.actions.filter(action => action.completionPercent >= 100).length
      const inProgressActions = phase.actions.filter(action => action.completionPercent > 0 && action.completionPercent < 100).length
      const pendingActions = phase.actions.filter(action => action.completionPercent === 0).length

      return {
        id: phase.id,
        name: phase.name,
        description: phase.description,
        startDate: phase.startDate,
        endDate: phase.endDate,
        stats: {
          total: totalActions,
          completed: completedActions,
          inProgress: inProgressActions,
          pending: pendingActions,
          completionRate: totalActions > 0 ? (completedActions / totalActions) * 100 : 0
        }
      }
    })

    return NextResponse.json(phaseStats)
  } catch (error) {
    console.error('Error fetching phase stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 