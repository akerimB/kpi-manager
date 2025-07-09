import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Temel istatistikleri çekme
    const [kpiCount, actionCount, factoryCount, strategicGoalCount] = await Promise.all([
      prisma.kpi.count(),
      prisma.action.count(),
      prisma.modelFactory.count(),
      prisma.strategicGoal.count()
    ])

    // Örnek başarı oranı hesaplama (gerçek KPI verilerine göre)
    const successRate = 78 // Şimdilik sabit, sonra gerçek hesaplama yapılacak

    return NextResponse.json({
      kpiCount,
      actionCount,
      factoryCount,
      strategicGoalCount,
      successRate,
      successTrend: 12 // Önceki döneme göre artış %
    })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 