import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factory')
    const period = searchParams.get('period') || '2024-Q4'
    const userRole = searchParams.get('userRole') || 'UPPER_MANAGEMENT'

    // KPI değerleri için filtre oluştur
    const kpiValueFilter: any = {
      period: period
    }

    // Fabrika filtresi ekle
    if (factoryId) {
      kpiValueFilter.factoryId = factoryId
    }

    // Tüm stratejik amaçları getir
    const strategicGoals = await prisma.strategicGoal.findMany({
      include: {
        strategicTargets: {
          include: {
            kpis: {
              include: {
                kpiValues: {
                  where: kpiValueFilter,
                  orderBy: {
                    period: 'desc'
                  },
                  take: 2 // Mevcut ve önceki dönem için
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
      let previousScore = 0 // Trend hesabı için önceki dönem skoru

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
            
            // Önceki dönem değeri varsa trend için kullan
            if (kpi.kpiValues.length > 1) {
              const prevValue = kpi.kpiValues[1].value
              const prevScore = Math.min(100, (prevValue / targetValue) * 100)
              previousScore += prevScore
            }
          }
        })
      })

      const averageScore = kpisWithValues > 0 ? totalScore / kpisWithValues : 0
      const previousAverageScore = kpisWithValues > 0 ? previousScore / kpisWithValues : 0
      const trend = averageScore - previousAverageScore
      const completionRate = totalKpis > 0 ? (kpisWithValues / totalKpis) * 100 : 0

      return {
        id: sa.id,
        code: sa.code,
        title: sa.title,
        description: sa.description || '',
        successRate: Math.round(averageScore),
        trend: Math.round(trend),
        status: averageScore >= 80 ? 'excellent' : 
                averageScore >= 60 ? 'good' : 
                averageScore >= 40 ? 'at-risk' : 'critical'
      }
    })

    return NextResponse.json(strategicOverview)
  } catch (error) {
    console.error('Strategy overview error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
} 