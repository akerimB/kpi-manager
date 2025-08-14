import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const targets = await prisma.strategicTarget.findMany({
      include: {
        strategicGoal: true,
        kpis: {
          select: { number: true, shWeight: true }
        },
        goalWeight: true,
      },
      orderBy: { code: 'asc' }
    })

    const shWeights = targets.map(t => ({
      saCode: t.strategicGoal.code,
      shCode: t.code,
      weight: (t as any).goalWeight ?? null,
      kpiCount: t.kpis.length,
    }))

    const kpiWeights = targets.flatMap(t =>
      t.kpis.map(k => ({
        shCode: t.code,
        kpiNumber: k.number,
        weight: (k as any).shWeight ?? null,
      }))
    )

    return NextResponse.json({ shWeights, kpiWeights })
  } catch (error) {
    console.error('Weights API error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}


