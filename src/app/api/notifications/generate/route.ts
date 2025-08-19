import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Bildirim türleri
type NotificationType = 
  | 'PERFORMANCE_ALERT'     // Performans uyarısı
  | 'SUCCESS_ACHIEVEMENT'   // Başarı bildirimi
  | 'KPI_ENTRY_REMINDER'    // KPI giriş hatırlatması
  | 'TREND_CHANGE'          // Trend değişikliği
  | 'BENCHMARK_UPDATE'      // Sıralama değişikliği

interface NotificationRule {
  type: NotificationType
  condition: (data: any) => boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  actionUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const { factoryId, period } = await request.json()
    
    console.log('🔔 Generating notifications for:', { factoryId, period })

    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Fabrika verilerini al
    const factory = await prisma.modelFactory.findUnique({
      where: { id: factoryId },
      include: {
        kpiValues: {
          where: { period },
          include: { kpi: true },
          orderBy: { enteredAt: 'desc' }
        }
      }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Fabrika bulunamadı' }, { status: 404 })
    }

    // Önceki dönem verilerini al (karşılaştırma için)
    const previousPeriod = getPreviousPeriod(period)
    const previousData = await prisma.kpiValue.findMany({
      where: { 
        factoryId,
        period: previousPeriod 
      },
      include: { kpi: true }
    })

    // Bildirim kuralları
    const rules: NotificationRule[] = [
      // 1. Performans Uyarısı - KPI hedefin %50'sinin altında
      {
        type: 'PERFORMANCE_ALERT',
        condition: (kpiValue) => {
          const target = kpiValue.kpi.targetValue || 100
          const achievement = (kpiValue.value / target) * 100
          return achievement < 50
        },
        priority: 'high',
        title: '⚠️ Performans Uyarısı',
        message: 'KPI hedefin %50\'sinin altında performans gösteriyor',
        actionUrl: '/kpi-entry'
      },

      // 2. Başarı Bildirimi - KPI hedefi aştı
      {
        type: 'SUCCESS_ACHIEVEMENT',
        condition: (kpiValue) => {
          const target = kpiValue.kpi.targetValue || 100
          const achievement = (kpiValue.value / target) * 100
          return achievement >= 100
        },
        priority: 'medium',
        title: '🎉 Hedef Başarısı',
        message: 'KPI hedefini başarıyla aştınız!',
        actionUrl: '/analytics'
      },

      // 3. Kritik Düşüş - Önceki döneme göre %20+ düşüş
      {
        type: 'TREND_CHANGE',
        condition: (kpiValue) => {
          const previous = previousData.find(p => p.kpiId === kpiValue.kpiId)
          if (!previous) return false
          const changePercent = ((kpiValue.value - previous.value) / previous.value) * 100
          return changePercent <= -20
        },
        priority: 'critical',
        title: '📉 Kritik Düşüş',
        message: 'KPI değerinde önceki döneme göre %20+ düşüş tespit edildi',
        actionUrl: '/analytics'
      },

      // 4. Güçlü İyileşme - Önceki döneme göre %30+ artış
      {
        type: 'TREND_CHANGE',
        condition: (kpiValue) => {
          const previous = previousData.find(p => p.kpiId === kpiValue.kpiId)
          if (!previous) return false
          const changePercent = ((kpiValue.value - previous.value) / previous.value) * 100
          return changePercent >= 30
        },
        priority: 'medium',
        title: '📈 Güçlü İyileşme',
        message: 'KPI değerinde önceki döneme göre %30+ artış kaydedildi',
        actionUrl: '/analytics'
      }
    ]

    // Bildirimleri oluştur
    const notifications: any[] = []
    
    for (const kpiValue of factory.kpiValues) {
      for (const rule of rules) {
        if (rule.condition(kpiValue)) {
          const notification = {
            id: `${rule.type}_${kpiValue.kpiId}_${Date.now()}`,
            type: rule.type,
            priority: rule.priority,
            title: rule.title,
            message: `${kpiValue.kpi.description}: ${rule.message}`,
            actionUrl: rule.actionUrl,
            kpiNumber: kpiValue.kpi.number,
            kpiDescription: kpiValue.kpi.description,
            currentValue: kpiValue.value,
            targetValue: kpiValue.kpi.targetValue,
            period,
            factoryId,
            factoryName: factory.name,
            createdAt: new Date().toISOString(),
            isRead: false,
            isActive: true
          }

          // Önceki dönemle karşılaştırma bilgisi ekle
          const previous = previousData.find(p => p.kpiId === kpiValue.kpiId)
          if (previous) {
            const changePercent = ((kpiValue.value - previous.value) / previous.value) * 100
            notification.changePercent = Math.round(changePercent * 100) / 100
            notification.previousValue = previous.value
          }

          notifications.push(notification)
        }
      }
    }

    // KPI giriş hatırlatması (eğer eksik girişler varsa)
    const totalKpis = await prisma.kpi.count()
    const enteredKpis = factory.kpiValues.length
    
    if (enteredKpis < totalKpis) {
      notifications.push({
        id: `KPI_ENTRY_REMINDER_${factoryId}_${Date.now()}`,
        type: 'KPI_ENTRY_REMINDER',
        priority: 'medium',
        title: '📝 KPI Giriş Hatırlatması',
        message: `${totalKpis - enteredKpis} KPI için ${period} dönemi verisi eksik`,
        actionUrl: '/kpi-entry',
        period,
        factoryId,
        factoryName: factory.name,
        missingKpiCount: totalKpis - enteredKpis,
        createdAt: new Date().toISOString(),
        isRead: false,
        isActive: true
      })
    }

    // Bildirimleri önceliğe göre sırala
    notifications.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      return priorityOrder[b.priority] - priorityOrder[a.priority]
    })

    return NextResponse.json({
      success: true,
      notifications,
      summary: {
        total: notifications.length,
        critical: notifications.filter(n => n.priority === 'critical').length,
        high: notifications.filter(n => n.priority === 'high').length,
        medium: notifications.filter(n => n.priority === 'medium').length,
        low: notifications.filter(n => n.priority === 'low').length
      },
      factoryName: factory.name,
      period,
      generatedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Notification generation error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bildirimler oluşturulamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}

function getPreviousPeriod(period: string): string {
  const [year, quarter] = period.split('-')
  const yearNum = parseInt(year)
  const quarterNum = parseInt(quarter.substring(1))
  
  if (quarterNum === 1) {
    return `${yearNum - 1}-Q4`
  } else {
    return `${year}-Q${quarterNum - 1}`
  }
}
