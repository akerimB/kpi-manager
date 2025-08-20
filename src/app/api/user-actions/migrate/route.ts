import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ensureUserActionsTables } from '@/lib/ensure-user-actions-tables'

// POST /api/user-actions/migrate
// Body: { userId: string, count?: number }
export async function POST(request: NextRequest) {
  try {
    await ensureUserActionsTables()
    const body = await request.json()
    const userId: string | undefined = body?.userId
    const count: number = Math.max(1, Math.min(10, Number(body?.count || 2)))

    if (!userId) {
      return NextResponse.json({ error: 'userId gereklidir' }, { status: 400 })
    }

    // Son oluşturulan plan eylemlerinden al
    const lastActions = await prisma.action.findMany({
      take: count,
      orderBy: { createdAt: 'desc' },
      include: {
        strategicTarget: { include: { strategicGoal: true } },
        actionKpis: { select: { kpiId: true } }
      }
    })

    if (!lastActions.length) {
      return NextResponse.json({ migrated: 0, message: 'Taşınacak plan eylemi bulunamadı' })
    }

    const created = await prisma.$transaction(
      lastActions.map(a =>
        prisma.userAction.create({
          data: {
            userId,
            title: a.description,
            description: `Plan eylem referansı: ${a.code}`,
            saCode: a.strategicTarget?.strategicGoal?.code || null,
            shCode: a.strategicTarget?.code || null,
            kpiIds: a.actionKpis?.length ? JSON.stringify(a.actionKpis.map(k => k.kpiId)) : null,
            priority: a.priority || 'MEDIUM',
            status: 'PLANNED',
            linkedActionId: a.id
          }
        })
      )
    )

    return NextResponse.json({ migrated: created.length, items: created })
  } catch (error) {
    console.error('User action migration error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


