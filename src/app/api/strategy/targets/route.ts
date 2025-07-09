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
      let trend = 'stable'

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
            if (currentValue > previousValue * 1.05) trend = 'up'
            else if (currentValue < previousValue * 0.95) trend = 'down'
          }
        }
      })

      // Eylem tamamlanma oranı
      const totalActions = sh.actions.length
      const avgActionCompletion = totalActions > 0 
        ? sh.actions.reduce((sum, action) => sum + action.completionPercent, 0) / totalActions
        : 0

      const averageScore = kpisWithValues > 0 ? totalScore / kpisWithValues : 0
      const dataCompletion = totalKpis > 0 ? (kpisWithValues / totalKpis) * 100 : 0

      return {
        code: sh.code,
        title: sh.title || `Stratejik Hedef ${sh.code}`,
        saCode: sh.strategicGoal.code,
        saTitle: sh.strategicGoal.title,
        totalKpis,
        kpisWithValues,
        dataCompletion: Math.round(dataCompletion),
        averageScore: Math.round(averageScore),
        totalActions,
        avgActionCompletion: Math.round(avgActionCompletion),
        trend,
        status: averageScore >= 80 ? 'excellent' : 
                averageScore >= 60 ? 'good' : 
                averageScore >= 40 ? 'warning' : 'poor'
      }
    })

    return NextResponse.json(targetDetails)
  } catch (error) {
    console.error('Strategy targets error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 