import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userRole = searchParams.get('userRole') || 'MODEL_FACTORY'
    const factoryId = searchParams.get('factoryId')

    // Rol bazlı istatistik hesaplama
    let whereCondition: any = {}
    
    if (userRole === 'MODEL_FACTORY' && factoryId) {
      // Model fabrika kullanıcıları sadece kendi fabrikalarının istatistiklerini görsün
      whereCondition.factoryId = factoryId
    }
    
    // Mevcut dönem istatistikleri
    const [
      kpiCount,
      actionCount,
      factoryCount,
      strategicGoalCount,
    ] = await Promise.all([
      prisma.kpi.count(),
      prisma.action.count(),
      userRole === 'MODEL_FACTORY' ? 1 : prisma.modelFactory.count(),
      prisma.strategicGoal.count(),
    ])

    // Trend hesaplamaları için geçmiş veriler
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [
      previousKpiCount,
      previousActionCount,
      recentKpiValues,
      recentActions
    ] = await Promise.all([
      // 30 gün önceki KPI sayısı (yaklaşık)
      prisma.kpi.count({
        where: {
          createdAt: {
            lte: thirtyDaysAgo
          }
        }
      }),
      // 30 gün önceki eylem sayısı (yaklaşık)
      prisma.action.count({
        where: {
          createdAt: {
            lte: thirtyDaysAgo
          }
        }
      }),
      // Son 30 gündeki KPI girişleri
      prisma.kpiValue.count({
        where: {
          ...whereCondition,
          enteredAt: {
            gte: thirtyDaysAgo
          }
        }
      }),
      // Son 30 gündeki eylem güncellemeleri
      prisma.action.count({
        where: {
          updatedAt: {
            gte: thirtyDaysAgo
          }
        }
      })
    ])

    // Trend hesaplamaları
    const kpiTrend = kpiCount - previousKpiCount
    const actionTrend = actionCount - previousActionCount
    const factoryTrend = userRole === 'MODEL_FACTORY' ? 0 : Math.max(0, factoryCount - Math.max(1, factoryCount - 1))

    // KPI değerlerini al (rol bazlı)
    const kpiValues = await prisma.kpiValue.findMany({
      where: whereCondition,
      include: {
        kpi: {
          select: {
            targetValue: true,
            unit: true
          }
        }
      },
      orderBy: {
        period: 'desc'
      }
    })

    // Gerçek başarı oranını hesapla
    let successRate = 0
    let successTrend = 0
    
    if (kpiValues.length > 0) {
      // Mevcut dönem başarı oranı
      const currentPeriod = '2024-Q4'
      const previousPeriod = '2024-Q3'
      
      const currentValues = kpiValues.filter(kv => kv.period === currentPeriod)
      const previousValues = kpiValues.filter(kv => kv.period === previousPeriod)
      
      // Hedef değere göre başarı oranı hesapla
      if (currentValues.length > 0) {
        const totalAchievement = currentValues.reduce((sum, kv) => {
          const target = kv.kpi.targetValue || 100
          const achievement = Math.min(100, (kv.value / target) * 100)
          return sum + achievement
        }, 0)
        successRate = Math.round(totalAchievement / currentValues.length)
      }
      
      // Trend hesapla
      if (previousValues.length > 0) {
        const prevTotalAchievement = previousValues.reduce((sum, kv) => {
          const target = kv.kpi.targetValue || 100
          const achievement = Math.min(100, (kv.value / target) * 100)
          return sum + achievement
        }, 0)
        const prevSuccessRate = Math.round(prevTotalAchievement / previousValues.length)
        successTrend = successRate - prevSuccessRate
      }
    }

    // Eğer veri yoksa varsayılan değerler
    if (successRate === 0) {
      successRate = 0 // Gerçek veri yoksa 0 göster
    }

    return NextResponse.json({
      kpiCount,
      actionCount,
      factoryCount,
      strategicGoalCount,
      successRate,
      successTrend,
      trends: {
        kpiTrend,
        actionTrend,
        factoryTrend,
        recentActivity: {
          kpiEntries: recentKpiValues,
          actionUpdates: recentActions
        }
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'İstatistikler alınırken bir hata oluştu.' },
      { status: 500 }
    )
  }
} 