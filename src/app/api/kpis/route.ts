import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

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

    return NextResponse.json(kpis)
  } catch (error) {
    console.error('KPIs fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 