import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const saCode = searchParams.get('sa')

    let whereCondition = {}
    if (saCode) {
      whereCondition = {
        strategicGoal: {
          code: saCode
        }
      }
    }

    const strategicTargets = await prisma.strategicTarget.findMany({
      where: whereCondition,
      include: {
        strategicGoal: true,
        kpis: {
          include: {
            kpiValues: {
              orderBy: {
                period: 'desc'
              },
              take: 2 // Son 2 dönem için trend
            }
          }
        },
        actions: {
          select: {
            id: true,
            code: true,
            completionPercent: true
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Her SH için başarım hesapla
    const targetDetails = strategicTargets.map(sh => {
      let totalKpis = sh.kpis.length
      let kpisWithValues = 0
      let totalScore = 0
      let trend = 0

      // KPI başarım hesaplama
      sh.kpis.forEach(kpi => {
        if (kpi.kpiValues.length > 0) {
          kpisWithValues++
          const currentValue = kpi.kpiValues[0].value
          const targetValue = kpi.targetValue || 100
          const score = Math.min(100, (currentValue / targetValue) * 100)
          totalScore += score

          // Trend hesaplama
          if (kpi.kpiValues.length > 1) {
            const previousValue = kpi.kpiValues[1].value
            const previousScore = Math.min(100, (previousValue / targetValue) * 100)
            trend += score - previousScore
          }
        }
      })

      const averageScore = kpisWithValues > 0 ? totalScore / kpisWithValues : 0
      const averageTrend = kpisWithValues > 0 ? trend / kpisWithValues : 0

      return {
        id: sh.id,
        code: sh.code,
        name: sh.title || `Stratejik Hedef ${sh.code}`,
        description: sh.description || '',
        strategicGoalId: sh.strategicGoal.id,
        successRate: Math.round(averageScore),
        kpiCount: totalKpis,
        trend: Math.round(averageTrend),
        status: averageScore >= 80 ? 'excellent' : 
                averageScore >= 60 ? 'good' : 
                averageScore >= 40 ? 'at-risk' : 'critical'
      }
    })

    return NextResponse.json(targetDetails)
  } catch (error) {
    console.error('Strategy targets error:', error)
    return NextResponse.json({ error: 'Stratejik hedefler alınırken bir hata oluştu.' }, { status: 500 })
  }
} 