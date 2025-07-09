import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phaseId = searchParams.get('phase')
    const shCode = searchParams.get('sh')
    const priority = searchParams.get('priority')

    let whereCondition: any = {}
    
    if (phaseId) {
      whereCondition.phaseId = phaseId
    }
    
    if (shCode) {
      whereCondition.strategicTarget = {
        code: shCode
      }
    }
    
    if (priority) {
      whereCondition.priority = priority
    }

    const actions = await prisma.action.findMany({
      where: whereCondition,
      include: {
        strategicTarget: {
          include: {
            strategicGoal: true
          }
        },
        phase: true,
        actionSteps: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { code: 'asc' }
      ]
    })

    // Eylemler için ek bilgileri hesapla
    const enrichedActions = actions.map(action => {
      const totalSteps = action.actionSteps.length
      const completedSteps = action.actionSteps.filter(step => step.status === 'COMPLETED').length
      const stepCompletion = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

      // Tema bilgisini SH'den al
      let themes: string[] = []
      if (action.strategicTarget.code.startsWith('SH1')) themes = ['Dönüşüm']
      else if (action.strategicTarget.code.startsWith('SH2')) themes = ['Finansal']
      else if (action.strategicTarget.code.startsWith('SH3')) themes = ['Kurumsal']
      else if (action.strategicTarget.code.startsWith('SH4')) themes = ['Paydaş']

      return {
        ...action,
        stepCompletion: Math.round(stepCompletion),
        totalSteps,
        completedSteps,
        themes,
        isOverdue: action.actionSteps.some(step => 
          step.dueDate && new Date(step.dueDate) < new Date() && step.status !== 'COMPLETED'
        )
      }
    })

    return NextResponse.json(enrichedActions)
  } catch (error) {
    console.error('Actions fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { actionId, completionPercent } = body

    if (!actionId || completionPercent === undefined) {
      return NextResponse.json({ error: 'Action ID and completion percent are required' }, { status: 400 })
    }

    const updatedAction = await prisma.action.update({
      where: { id: actionId },
      data: {
        completionPercent: Math.max(0, Math.min(100, completionPercent)),
        updatedAt: new Date()
      },
      include: {
        strategicTarget: true,
        phase: true
      }
    })

    return NextResponse.json(updatedAction)
  } catch (error) {
    console.error('Action update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 