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
    
    const [
      kpiCount,
      actionCount,
      factoryCount,
      strategicGoalCount,
    ] = await Promise.all([
      prisma.kpi.count(),
      prisma.action.count(),
      userRole === 'MODEL_FACTORY' ? 1 : prisma.modelFactory.count(), // Model fabrika sadece 1 görsün
      prisma.strategicGoal.count(),
    ])

    // KPI değerlerini al (rol bazlı)
    const kpiValues = await prisma.kpiValue.findMany({
      where: whereCondition,
      include: {
        kpi: true
      }
    })

    // Başarı oranını hesapla (basit mock hesaplama)
    const successRate = userRole === 'MODEL_FACTORY' ? 
      (kpiValues.length > 0 ? Math.round(75 + Math.random() * 20) : 75) : 
      75 // Genel başarı oranı
    
    const successTrend = Math.round(Math.random() * 10) // Rastgele trend

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