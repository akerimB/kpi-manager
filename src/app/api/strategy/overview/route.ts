import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Tüm stratejik amaçları getir
    const strategicGoals = await prisma.strategicGoal.findMany({
      include: {
        strategicTargets: {
          include: {
            kpis: {
              include: {
                kpiValues: {
                  orderBy: {
                    period: 'desc'
                  },
                  take: 1 // En son değer
                }
              }
            }
          }
        }
      },
      orderBy: {
        code: 'asc'
      }
    })

    // Her SA için başarım hesapla
    const strategicOverview = strategicGoals.map(sa => {
      let totalKpis = 0
      let kpisWithValues = 0
      let totalScore = 0

      sa.strategicTargets.forEach(sh => {
        sh.kpis.forEach(kpi => {
          totalKpis++
          if (kpi.kpiValues.length > 0) {
            kpisWithValues++
            // Basit başarım skoru hesaplama (0-100)
            const value = kpi.kpiValues[0].value
            const targetValue = kpi.targetValue || 100
            const score = Math.min(100, (value / targetValue) * 100)
            totalScore += score
          }
        })
      })

      const averageScore = kpisWithValues > 0 ? totalScore / kpisWithValues : 0
      const completionRate = totalKpis > 0 ? (kpisWithValues / totalKpis) * 100 : 0

      return {
        code: sa.code,
        title: sa.title,
        totalTargets: sa.strategicTargets.length,
        totalKpis,
        kpisWithValues,
        completionRate: Math.round(completionRate),
        averageScore: Math.round(averageScore),
        status: averageScore >= 80 ? 'excellent' : 
                averageScore >= 60 ? 'good' : 
                averageScore >= 40 ? 'warning' : 'poor'
      }
    })

    return NextResponse.json(strategicOverview)
  } catch (error) {
    console.error('Strategy overview error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 