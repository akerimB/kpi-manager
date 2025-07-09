import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get recent actions
    const recentActions = await prisma.action.findMany({
      take: 5,
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        description: true,
        completionPercent: true,
        updatedAt: true,
        strategicTarget: {
          select: {
            code: true,
          },
        },
      },
    })

    // Get recent KPI values
    const recentKpiValues = await prisma.kpiValue.findMany({
      take: 5,
      orderBy: {
        enteredAt: 'desc',
      },
      select: {
        value: true,
        enteredAt: true,
        kpi: {
          select: {
            description: true,
            unit: true,
            strategicTarget: {
              select: {
                code: true,
              },
            },
          },
        },
      },
    })

    // Format activities for frontend
    const activities = [
      ...recentActions.map((action) => ({
        type: 'action' as const,
        title: `Eylem Güncellendi`,
        description: action.description,
        target: action.strategicTarget.code,
        time: action.updatedAt.toISOString(),
        progress: action.completionPercent,
      })),
      ...recentKpiValues.map((kpiValue) => ({
        type: 'kpi' as const,
        title: 'KPI Değeri Girildi',
        description: kpiValue.kpi.description,
        target: kpiValue.kpi.strategicTarget.code,
        time: kpiValue.enteredAt.toISOString(),
        value: kpiValue.value,
        unit: kpiValue.kpi.unit,
      })),
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json(activities.slice(0, 5))
  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Aktiviteler alınırken bir hata oluştu.' },
      { status: 500 }
    )
  }
} 