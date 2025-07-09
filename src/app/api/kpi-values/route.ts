import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const factoryId = searchParams.get('factoryId')
    const period = searchParams.get('period')

    if (!factoryId || !period) {
      return NextResponse.json({ error: 'Factory ID and period are required' }, { status: 400 })
    }

    const kpiValues = await prisma.kpiValue.findMany({
      where: {
        factoryId,
        period
      },
      include: {
        kpi: true
      }
    })

    return NextResponse.json(kpiValues)
  } catch (error) {
    console.error('KPI values fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { factoryId, period, values } = body

    if (!factoryId || !period || !values) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Dönem bilgisini parse et
    const [yearStr, quarterStr] = period.split('-Q')
    const year = parseInt(yearStr)
    const quarter = parseInt(quarterStr)

    // Batch işlem için transaction kullan
    const result = await prisma.$transaction(async (tx) => {
      const operations = []

      for (const [kpiId, value] of Object.entries(values)) {
        if (typeof value === 'number' && value >= 0) {
          operations.push(
            tx.kpiValue.upsert({
              where: {
                kpiId_factoryId_period: {
                  kpiId,
                  factoryId,
                  period
                }
              },
              update: {
                value,
                updatedAt: new Date()
              },
              create: {
                value,
                period,
                year,
                quarter,
                kpiId,
                factoryId,
                enteredAt: new Date()
              }
            })
          )
        }
      }

      return Promise.all(operations)
    })

    return NextResponse.json({ 
      success: true, 
      message: `${result.length} KPI değeri başarıyla kaydedildi`,
      count: result.length 
    })
  } catch (error) {
    console.error('KPI values save error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 