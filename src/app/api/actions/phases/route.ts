import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const phases = await prisma.phase.findMany({
      include: {
        actions: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    const phaseStats = phases.map(phase => {
      const totalActions = phase.actions.length
      const completedActions = phase.actions.filter(action => action.completionPercent >= 100).length
      const inProgressActions = phase.actions.filter(action => action.completionPercent > 0 && action.completionPercent < 100).length
      const notStartedActions = phase.actions.filter(action => action.completionPercent === 0).length
      
      const avgCompletion = totalActions > 0 
        ? phase.actions.reduce((sum, action) => sum + action.completionPercent, 0) / totalActions
        : 0

      const highPriorityActions = phase.actions.filter(action => action.priority === 'HIGH').length
      const criticalActions = phase.actions.filter(action => action.priority === 'CRITICAL').length

      return {
        id: phase.id,
        name: phase.name,
        description: phase.description,
        totalActions,
        completedActions,
        inProgressActions,
        notStartedActions,
        avgCompletion: Math.round(avgCompletion),
        completionRate: totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0,
        highPriorityActions,
        criticalActions,
        status: avgCompletion >= 90 ? 'completed' :
                avgCompletion >= 70 ? 'on-track' :
                avgCompletion >= 40 ? 'at-risk' : 'behind'
      }
    })

    return NextResponse.json(phaseStats)
  } catch (error) {
    console.error('Phase stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 