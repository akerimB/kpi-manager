import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  try {
    const kpis = await prisma.kpi.findMany({
      include: {
        strategicTarget: {
          include: {
            strategicGoal: true
          }
        },
        kpiValues: {
          orderBy: {
            period: 'desc'
          }
        }
      },
      orderBy: {
        number: 'asc'
      }
    })

    // Frontend'in beklediği formata dönüştür
    const formattedKpis = kpis.map(kpi => ({
      id: kpi.id,
      name: `KPI ${kpi.number}`,
      description: kpi.description,
      themes: kpi.themes,
      shCode: kpi.strategicTarget.code,
      unit: kpi.unit,
      targetValue: kpi.targetValue,
      strategicTarget: kpi.strategicTarget,
      kpiValues: kpi.kpiValues
    }))

    return NextResponse.json(formattedKpis)
  } catch (error) {
    console.error('KPIs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 