import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'

type ActionWithRelations = {
  id: string
  code: string
  description: string | null
  completionPercent: number
  priority: string
  strategicTarget: {
    code: string
    title: string | null
    strategicGoal: {
      code: string
      title: string | null
    }
  }
  phase: {
    id: string
    name: string
  } | null
  actionSteps: {
    id: string
    status: string
    dueDate: Date | null
  }[]
}

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

    // Frontend'in beklediği formata dönüştür
    const enrichedActions = actions.map((action: ActionWithRelations) => {
      const totalSteps = action.actionSteps.length
      const completedSteps = action.actionSteps.filter(step => step.status === 'COMPLETED').length
      const stepCompletion = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

      // Tema bilgisini SH'den al ve array olarak döndür
      const themes = []
      if (action.strategicTarget.code.startsWith('SH1')) themes.push('YALIN')
      if (action.strategicTarget.code.startsWith('SH2')) themes.push('DİJİTAL')
      if (action.strategicTarget.code.startsWith('SH3')) themes.push('YEŞİL')
      if (action.strategicTarget.code.startsWith('SH4')) themes.push('DİRENÇLİLİK')

      return {
        id: action.id,
        code: action.code,
        title: action.description,
        description: action.description,
        completionPercent: action.completionPercent,
        priority: action.priority === 'HIGH' ? 'YÜKSEK' :
                 action.priority === 'MEDIUM' ? 'ORTA' :
                 action.priority === 'LOW' ? 'DÜŞÜK' : 'KRİTİK',
        strategicTarget: {
          code: action.strategicTarget.code,
          title: action.strategicTarget.title,
          strategicGoal: {
            code: action.strategicTarget.strategicGoal.code,
            title: action.strategicTarget.strategicGoal.title
          }
        },
        phase: action.phase && {
          id: action.phase.id,
          name: action.phase.name
        },
        themes,
        stepCompletion: Math.round(stepCompletion),
        totalSteps,
        completedSteps,
        isOverdue: action.actionSteps.some(step => 
          step.status !== 'COMPLETED' && step.dueDate && new Date(step.dueDate) < new Date()
        )
      }
    })

    return NextResponse.json(enrichedActions)
  } catch (error) {
    console.error('Actions fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { actionId, completionPercent } = body

    if (!actionId || completionPercent === undefined) {
      return NextResponse.json({ error: 'Eylem ID ve tamamlanma yüzdesi gerekli' }, { status: 400 })
    }

    const updatedAction = await prisma.action.update({
      where: { id: actionId },
      data: {
        completionPercent: Math.max(0, Math.min(100, completionPercent)),
        updatedAt: new Date()
      },
      include: {
        strategicTarget: {
          include: {
            strategicGoal: true
          }
        },
        phase: true,
        actionSteps: true
      }
    }) as ActionWithRelations

    // Güncellenmiş eylemi frontend formatına dönüştür
    const totalSteps = updatedAction.actionSteps.length
    const completedSteps = updatedAction.actionSteps.filter(step => step.status === 'COMPLETED').length
    const stepCompletion = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

    const themes = []
    if (updatedAction.strategicTarget.code.startsWith('SH1')) themes.push('YALIN')
    if (updatedAction.strategicTarget.code.startsWith('SH2')) themes.push('DİJİTAL')
    if (updatedAction.strategicTarget.code.startsWith('SH3')) themes.push('YEŞİL')
    if (updatedAction.strategicTarget.code.startsWith('SH4')) themes.push('DİRENÇLİLİK')

    const formattedAction = {
      id: updatedAction.id,
      code: updatedAction.code,
      title: updatedAction.description,
      description: updatedAction.description,
      completionPercent: updatedAction.completionPercent,
      priority: updatedAction.priority === 'HIGH' ? 'YÜKSEK' :
               updatedAction.priority === 'MEDIUM' ? 'ORTA' :
               updatedAction.priority === 'LOW' ? 'DÜŞÜK' : 'KRİTİK',
      strategicTarget: {
        code: updatedAction.strategicTarget.code,
        title: updatedAction.strategicTarget.title,
        strategicGoal: {
          code: updatedAction.strategicTarget.strategicGoal.code,
          title: updatedAction.strategicTarget.strategicGoal.title
        }
      },
      phase: updatedAction.phase && {
        id: updatedAction.phase.id,
        name: updatedAction.phase.name
      },
      themes,
      stepCompletion: Math.round(stepCompletion),
      totalSteps,
      completedSteps,
      isOverdue: updatedAction.actionSteps.some(step => 
        step.status !== 'COMPLETED' && step.dueDate && new Date(step.dueDate) < new Date()
      )
    }

    return NextResponse.json(formattedAction)
  } catch (error) {
    console.error('Action update error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
} 