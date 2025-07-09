import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [
      kpiCount,
      actionCount,
      factoryCount,
      strategicGoalCount,
    ] = await Promise.all([
      prisma.kpi.count(),
      prisma.action.count(),
      prisma.modelFactory.count(),
      prisma.strategicGoal.count(),
    ])

    // Calculate success rate and trend (mock data for now)
    const successRate = 75 // 75%
    const successTrend = 5 // +5%

    return NextResponse.json({
      kpiCount,
      actionCount,
      factoryCount,
      strategicGoalCount,
      successRate,
      successTrend,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'İstatistikler alınırken bir hata oluştu.' },
      { status: 500 }
    )
  }
} 