import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const factoryId = searchParams.get('factory') || searchParams.get('factoryId') // Her iki parametreyi de destekle
    const period = searchParams.get('period')

    if (!factoryId || !period) {
      return NextResponse.json({ error: 'Factory ID and period are required' }, { status: 400 })
    }

    // Mevcut dönem değerlerini al
    const kpiValues = await prisma.kpiValue.findMany({
      where: {
        factoryId,
        period
      },
      include: {
        kpi: true
      }
    })

    // Önceki dönem hesapla
    const [yearStr, quarterStr] = period.split('-Q')
    const year = parseInt(yearStr)
    const quarter = parseInt(quarterStr)
    
    let prevYear = year
    let prevQuarter = quarter - 1
    
    if (prevQuarter < 1) {
      prevYear = year - 1
      prevQuarter = 4
    }
    
    const previousPeriod = `${prevYear}-Q${prevQuarter}`

    // Önceki dönem değerlerini al
    const previousValues = await prisma.kpiValue.findMany({
      where: {
        factoryId,
        period: previousPeriod
      }
    })

    // Önceki değerleri map'e çevir
    const previousMap = new Map()
    previousValues.forEach(pv => {
      previousMap.set(pv.kpiId, pv.value)
    })

    // Sonuçları birleştir
    const result = kpiValues.map(kv => ({
      kpiId: kv.kpiId,
      value: kv.value,
      previousValue: previousMap.get(kv.kpiId) || null,
      previousPeriod: previousMap.has(kv.kpiId) ? previousPeriod : null
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('KPI values fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { values } = body // Yeni format: { values: [{ kpiId, value, period, factoryId }] }

    if (!values || !Array.isArray(values)) {
      return NextResponse.json({ error: 'Values array is required' }, { status: 400 })
    }

    // Batch işlem için transaction kullan
    const result = await prisma.$transaction(async (tx) => {
      const operations = []

      for (const item of values) {
        const { kpiId, value, period, factoryId } = item
        
        if (!kpiId || !period || !factoryId || typeof value !== 'number') {
          continue // Geçersiz veriyi atla
        }

        // Dönem bilgisini parse et
        const [yearStr, quarterStr] = period.split('-Q')
        const year = parseInt(yearStr)
        const quarter = parseInt(quarterStr)

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