import { NextRequest, NextResponse } from 'next/server'
import { getNotifications as storeGet, addNotifications as storeAdd, updateNotification as storeUpdate, getStats as storeStats } from '@/lib/notifications-store'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const factoryId = searchParams.get('factoryId')
    const limit = parseInt(searchParams.get('limit') || '20')
    const onlyUnread = searchParams.get('unread') === 'true'
    
    // If no factoryId provided, aggregate for all factories

    const allNotifications = storeGet(factoryId || undefined)
    

    
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
    const stats = storeStats(factoryId || undefined)

    return NextResponse.json({
      success: true,
      notifications,
      stats,
      factoryId: factoryId || 'ALL',
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

    if (notifications && Array.isArray(notifications)) {
      storeAdd(factoryId, notifications)
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

    const ok = storeUpdate(factoryId, notificationId, action as any)
    if (!ok) {
      return NextResponse.json({ error: 'Bildirim bulunamadı' }, { status: 404 })
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
