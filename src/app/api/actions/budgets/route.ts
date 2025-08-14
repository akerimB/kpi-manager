import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Listeleme: actionId ile tek kayıt, ya da tüm eylemler için özet
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const actionId = searchParams.get('actionId')
    if (actionId) {
      const budget = await prisma.actionBudget.findUnique({ where: { actionId } })
      return NextResponse.json(budget)
    }
    const budgets = await prisma.actionBudget.findMany()
    return NextResponse.json(budgets)
  } catch (error) {
    console.error('Budget fetch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}

// Oluştur/Güncelle
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { actionId, plannedAmount, actualAmount, currency, capexOpex } = body
    if (!actionId) return NextResponse.json({ error: 'actionId gerekli' }, { status: 400 })

    const budget = await prisma.actionBudget.upsert({
      where: { actionId },
      update: {
        plannedAmount: typeof plannedAmount === 'number' ? plannedAmount : undefined,
        actualAmount: typeof actualAmount === 'number' ? actualAmount : undefined,
        currency: currency || undefined,
        capexOpex: capexOpex || undefined,
      },
      create: {
        actionId,
        plannedAmount: typeof plannedAmount === 'number' ? plannedAmount : 0,
        actualAmount: typeof actualAmount === 'number' ? actualAmount : 0,
        currency: currency || 'TRY',
        capexOpex: capexOpex || 'OPEX',
      }
    })
    return NextResponse.json(budget)
  } catch (error) {
    console.error('Budget upsert error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}



