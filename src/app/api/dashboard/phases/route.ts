import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all phases with their actions
    const phases = await prisma.phase.findMany({
      include: {
        actions: {
          select: {
            completionPercent: true,
          },
        },
      },
    })

    // Calculate phase statistics
    const phaseData = phases.map((phase) => {
      const actionCount = phase.actions.length
      const totalCompletion = phase.actions.reduce(
        (sum, action) => sum + action.completionPercent,
        0
      )
      const averageCompletion = actionCount > 0 ? totalCompletion / actionCount : 0

      return {
        name: phase.name,
        completion: Math.round(averageCompletion),
        actionCount,
      }
    })

    return NextResponse.json(phaseData)
  } catch (error) {
    console.error('Error fetching phase stats:', error)
    return NextResponse.json(
      { error: 'Faz istatistikleri alınırken bir hata oluştu.' },
      { status: 500 }
    )
  }
} 