import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const phases = await prisma.phase.findMany({
      include: {
        actions: {
          select: {
            completionPercent: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const phaseProgress = phases.map(phase => {
      const totalActions = phase.actions.length
      let averageCompletion = 0

      if (totalActions > 0) {
        const totalCompletion = phase.actions.reduce(
          (sum, action) => sum + action.completionPercent, 
          0
        )
        averageCompletion = Math.round(totalCompletion / totalActions)
      }

      return {
        name: phase.name,
        completion: averageCompletion,
        actionCount: totalActions
      }
    })

    return NextResponse.json(phaseProgress)
  } catch (error) {
    console.error('Phase progress error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 