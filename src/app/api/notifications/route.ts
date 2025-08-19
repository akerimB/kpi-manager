import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Bildirimler için basit in-memory store (production'da Redis kullanılabilir)
let notificationStore: Record<string, any[]> = {}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factoryId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const onlyUnread = searchParams.get('unread') === 'true'
    
    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Store'dan bildirimleri al
    const allNotifications = notificationStore[factoryId] || []
    
    // Filtreleme
    let filteredNotifications = allNotifications.filter(n => n.isActive)
    
    if (onlyUnread) {
      filteredNotifications = filteredNotifications.filter(n => !n.isRead)
    }
    
    // Sıralama ve limit
    const notifications = filteredNotifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
    
    // İstatistikler
    const stats = {
      total: allNotifications.filter(n => n.isActive).length,
      unread: allNotifications.filter(n => n.isActive && !n.isRead).length,
      critical: allNotifications.filter(n => n.isActive && n.priority === 'critical').length,
      high: allNotifications.filter(n => n.isActive && n.priority === 'high').length,
      medium: allNotifications.filter(n => n.isActive && n.priority === 'medium').length,
      low: allNotifications.filter(n => n.isActive && n.priority === 'low').length
    }

    return NextResponse.json({
      success: true,
      notifications,
      stats,
      factoryId,
      retrievedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ Notifications GET error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bildirimler alınamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { factoryId, notifications } = body
    
    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Bildirimleri store'a ekle
    if (!notificationStore[factoryId]) {
      notificationStore[factoryId] = []
    }
    
    if (notifications && Array.isArray(notifications)) {
      notificationStore[factoryId].push(...notifications)
      
      // Eski bildirimleri temizle (son 100 bildirimi sakla)
      notificationStore[factoryId] = notificationStore[factoryId]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 100)
    }

    return NextResponse.json({
      success: true,
      message: 'Bildirimler kaydedildi',
      count: notifications?.length || 0,
      factoryId
    })

  } catch (error) {
    console.error('❌ Notifications POST error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bildirimler kaydedilemedi',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factoryId')
    const notificationId = searchParams.get('notificationId')
    const action = searchParams.get('action') // 'read', 'unread', 'delete'
    
    if (!factoryId || !notificationId) {
      return NextResponse.json({ error: 'Factory ID ve Notification ID gerekli' }, { status: 400 })
    }

    const notifications = notificationStore[factoryId] || []
    const notificationIndex = notifications.findIndex(n => n.id === notificationId)
    
    if (notificationIndex === -1) {
      return NextResponse.json({ error: 'Bildirim bulunamadı' }, { status: 404 })
    }

    // İşlemi uygula
    switch (action) {
      case 'read':
        notifications[notificationIndex].isRead = true
        break
      case 'unread':
        notifications[notificationIndex].isRead = false
        break
      case 'delete':
        notifications[notificationIndex].isActive = false
        break
      default:
        return NextResponse.json({ error: 'Geçersiz işlem' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Bildirim güncellendi',
      action,
      notificationId
    })

  } catch (error) {
    console.error('❌ Notifications PATCH error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Bildirim güncellenemedi',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}
