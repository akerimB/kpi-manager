import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factoryId')
    const userRole = searchParams.get('userRole') || 'MODEL_FACTORY'
    const currentUserId = searchParams.get('userId')

    // Rol bazlı erişim kontrolü
    if (userRole === 'MODEL_FACTORY' && !factoryId) {
      return NextResponse.json({ error: 'Factory ID required for factory users' }, { status: 400 })
    }

    const kpis = await prisma.kpi.findMany({
      include: {
        strategicTarget: {
          include: {
            strategicGoal: true
          }
        },
        kpiValues: {
          where: userRole === 'MODEL_FACTORY' && factoryId ? 
            { factoryId: factoryId } : {}, // Model fabrika sadece kendi değerlerini görsün
          include: {
            factory: true
          },
          orderBy: {
            period: 'desc'
          },
          take: 10
        }
      },
      orderBy: {
        number: 'asc'
      }
    })

    // KPI'ları dönüştür
    const transformedKpis = kpis.map(kpi => ({
      id: kpi.id,
      name: `KPI ${kpi.number}`,
      description: kpi.description,
      themes: kpi.themes,
      unit: kpi.unit,
      targetValue: kpi.targetValue,
      shCode: kpi.strategicTarget.code,
      strategicTarget: {
        id: kpi.strategicTarget.id,
        code: kpi.strategicTarget.code,
        title: kpi.strategicTarget.title,
        strategicGoal: {
          id: kpi.strategicTarget.strategicGoal.id,
          code: kpi.strategicTarget.strategicGoal.code,
          title: kpi.strategicTarget.strategicGoal.title
        }
      },
      kpiValues: kpi.kpiValues.map(value => ({
        id: value.id,
        value: value.value,
        period: value.period,
        year: value.year,
        quarter: value.quarter,
        month: value.month,
        factory: {
          id: value.factory.id,
          code: value.factory.code,
          name: value.factory.name
        },
        enteredAt: value.enteredAt,
        updatedAt: value.updatedAt
      }))
    }))

    return NextResponse.json(transformedKpis)
  } catch (error) {
    console.error('Error fetching KPIs:', error)
    return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 })
  }
} 