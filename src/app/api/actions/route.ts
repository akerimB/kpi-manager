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
  actionKpis: {
    id: string
    impactScore: number | null
    impactCategory: string | null
    kpi: {
      id: string
      number: number
      description: string
      unit: string | null
    }
  }[]
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userRole = searchParams.get('userRole') || 'MODEL_FACTORY'
    const userId = searchParams.get('userId')
    
    // Rol kontrolü - sadece üst yönetim ve admin erişebilir
    if (userRole === 'MODEL_FACTORY') {
      return NextResponse.json({ error: 'Bu API\'ye erişim yetkiniz bulunmamaktadır' }, { status: 403 })
    }
    
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
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            period: true,
            plannedCost: true,
            actualCost: true,
            currency: true,
            capexOpex: true
          }
        },
        actionKpis: {
          include: {
            kpi: {
              select: {
                id: true,
                number: true,
                description: true,
                unit: true
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { code: 'asc' }
      ]
    })

    // Frontend'in beklediği formata dönüştür
    const enrichedActions = actions.map((action: any) => {
      const totalSteps = action.actionSteps.length
      const completedSteps = action.actionSteps.filter((step: { status: string }) => step.status === 'COMPLETED').length
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
        steps: action.actionSteps,
        isOverdue: action.actionSteps.some((step: { status: string; dueDate: Date | string | null }) => 
          step.status !== 'COMPLETED' && step.dueDate && new Date(step.dueDate) < new Date()
        ),
        impactedKpis: action.actionKpis.map(ak => ({
          id: ak.kpi.id,
          number: ak.kpi.number,
          description: ak.kpi.description,
          unit: ak.kpi.unit,
          impactScore: ak.impactScore,
          impactCategory: ak.impactCategory === 'HIGH' ? 'YÜKSEK' :
                         ak.impactCategory === 'MEDIUM' ? 'ORTA' :
                         ak.impactCategory === 'LOW' ? 'DÜŞÜK' : 'BELİRSİZ'
        }))
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
        strategicTarget: { include: { strategicGoal: true } },
        phase: true,
        actionSteps: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            dueDate: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            period: true,
            plannedCost: true,
            actualCost: true,
            currency: true,
            capexOpex: true
          }
        }
      }
    }) as any

    // Güncellenmiş eylemi frontend formatına dönüştür
    const totalSteps = updatedAction.actionSteps.length
    const completedSteps = updatedAction.actionSteps.filter((step: { status: string }) => step.status === 'COMPLETED').length
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
      steps: updatedAction.actionSteps,
      isOverdue: updatedAction.actionSteps.some((step: { status: string; dueDate: Date | string | null }) => 
        step.status !== 'COMPLETED' && step.dueDate && new Date(step.dueDate) < new Date()
      )
    }

    return NextResponse.json(formattedAction)
  } catch (error) {
    console.error('Action update error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
} 

// Create action with optional KPI links and default steps
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { shCode, saCode, description, priority, responsibleUnit, kpiIds, defaultSteps, userRole } = body || {}

    // Role guard: only upper management and admin
    if (userRole === 'MODEL_FACTORY') {
      return NextResponse.json({ error: 'Bu API\'ye erişim yetkiniz bulunmamaktadır' }, { status: 403 })
    }

    if ((!shCode && !saCode) || !description) {
      return NextResponse.json({ error: 'shCode veya saCode ve description gereklidir' }, { status: 400 })
    }

    // Resolve SH (preferred) or fallback via SA to first SH
    let sh = null as any
    if (shCode) {
      sh = await prisma.strategicTarget.findUnique({ where: { code: shCode } })
    }
    if (!sh && saCode) {
      const goal = await prisma.strategicGoal.findUnique({ where: { code: saCode } })
      if (goal) {
        sh = await prisma.strategicTarget.findFirst({ where: { strategicGoalId: goal.id }, orderBy: { code: 'asc' } })
      }
    }
    if (!sh) {
      return NextResponse.json({ error: 'Geçersiz SH/SA kodu' }, { status: 400 })
    }

    // Generate action code: E<SA>.<SHIndex>.<seq>
    const sa = await prisma.strategicGoal.findUnique({ where: { id: sh.strategicGoalId } })
    const shIndexMatch = sh.code.match(/SH\d+\.(\d+)/)
    const shIndex = shIndexMatch ? shIndexMatch[1] : '1'
    const existingCount = await prisma.action.count({ where: { strategicTargetId: sh.id } })
    const seq = existingCount + 1
    const code = `E${(sa?.code || 'SA')}.${shIndex}.${seq}`

    // Create action
    const created = await prisma.action.create({
      data: {
        code,
        description,
        strategicTargetId: sh.id,
        priority: (priority as string) || 'MEDIUM',
        responsibleUnit: responsibleUnit || null
      }
    })

    // Link KPIs if provided
    if (Array.isArray(kpiIds) && kpiIds.length) {
      await prisma.$transaction(
        kpiIds.map((kpiId: string) =>
          prisma.actionKpi.upsert({
            where: { actionId_kpiId: { actionId: created.id, kpiId } },
            update: {},
            create: { actionId: created.id, kpiId }
          })
        )
      )
    }

    // Create default steps
    const stepsToCreate: Array<{ title: string; description?: string; dueDate?: Date | null }> =
      Array.isArray(defaultSteps) && defaultSteps.length
        ? defaultSteps.map((s: any) => ({
            title: s.title,
            description: s.description || null,
            dueDate: s.dueDate ? new Date(s.dueDate) : null
          }))
        : [
            { title: 'Kickoff & hedef netleştirme', description: 'SA/SH bağlamında kapsam', dueDate: null },
            { title: 'Atölye/mentörlük planı', description: '90-gün sprint planı', dueDate: null },
            { title: 'A3/Kaizen uygulama turu', description: 'Saha uygulaması', dueDate: null }
          ]

    await prisma.$transaction(
      stepsToCreate.map(s =>
        prisma.actionStep.create({
          data: { actionId: created.id, title: s.title, description: s.description || null, dueDate: s.dueDate || null }
        })
      )
    )

    // Return enriched action
    const enriched = await prisma.action.findUnique({
      where: { id: created.id },
      include: {
        strategicTarget: { include: { strategicGoal: true } },
        phase: true,
        actionSteps: { orderBy: { createdAt: 'asc' } },
        actionKpis: { include: { kpi: { select: { id: true, number: true, description: true, unit: true } } } }
      }
    })

    return NextResponse.json(enriched)
  } catch (error) {
    console.error('Action create error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}