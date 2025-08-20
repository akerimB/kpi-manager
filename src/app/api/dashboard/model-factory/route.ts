import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factoryId')

    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID is required' }, { status: 400 })
    }

    // Get factory information
    const factory = await prisma.modelFactory.findUnique({
      where: { id: factoryId },
      include: {
        kpiValues: {
          include: {
            kpi: true
          }
        }
      }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Factory not found' }, { status: 404 })
    }

    // Calculate KPI statistics
    const kpiCount = factory.kpiValues.length
    const completedKPIs = factory.kpiValues.filter(kv => kv.value > 0).length
    const pendingKPIs = kpiCount - completedKPIs
    const overdueKPIs = factory.kpiValues.filter(kv => {
      // Simple logic: if KPI has no value and it's past Q4 2024, consider it overdue
      return kv.value === 0 && kv.period === '2024-Q4'
    }).length

    // Calculate average score
    const validKPIs = factory.kpiValues.filter(kv => kv.value > 0)
    const avgScore = validKPIs.length > 0 
      ? validKPIs.reduce((sum, kv) => sum + (kv.value / (kv.kpi.targetValue || 1) * 100), 0) / validKPIs.length
      : 0

    // Determine trend (simplified logic)
    const trend = avgScore > 75 ? 'up' : avgScore < 50 ? 'down' : 'stable'

    // Get recent activities (mock data for now)
    const recentActivities = [
      {
        id: '1',
        type: 'kpi_entry' as const,
        title: 'KPI-001 değeri güncellendi',
        timestamp: new Date().toISOString()
      },
      {
        id: '2',
        type: 'evidence_upload' as const,
        title: 'Yeni kanıt dosyası yüklendi',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      }
    ]

    // Get upcoming deadlines (mock data for now)
    const upcomingDeadlines = [
      {
        id: '1',
        kpiName: 'KPI-003 Eğitim Katılım Oranı',
        deadline: new Date(Date.now() + 86400000).toISOString(),
        priority: 'high' as const
      }
    ]

    // Calculate sector ranking (mock data for now)
    const sectorRanking = {
      position: 3,
      totalFactories: 15,
      score: Math.round(avgScore * 10) / 10
    }

    const dashboardData = {
      kpiCount,
      completedKPIs,
      pendingKPIs,
      overdueKPIs,
      avgScore: Math.round(avgScore * 10) / 10,
      trend,
      recentActivities,
      upcomingDeadlines,
      sectorRanking
    }

    return NextResponse.json(dashboardData)
  } catch (error) {
    console.error('Model factory dashboard error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
