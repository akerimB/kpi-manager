/**
 * WebSocket API Endpoint
 * Next.js API Route olarak WebSocket desteği
 */

import { NextRequest } from 'next/server'
import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer } from 'socket.io'
import { RealtimeEventManager, RealtimeEventType, ConnectionInfo } from '@/lib/realtime-events'
import { getCurrentUser } from '@/lib/user-context'

// Global socket server instance
let io: SocketIOServer | null = null

/**
 * Socket.IO server'ını başlat
 */
export function initializeSocketServer(httpServer: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(httpServer, {
    path: '/api/websocket',
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://yourdomain.com'] 
        : ['http://localhost:3000'],
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  })

  const eventManager = RealtimeEventManager.getInstance()

  io.on('connection', (socket) => {
    console.log(`🔌 New WebSocket connection: ${socket.id}`)

    // Authentication
    socket.on('authenticate', async (data: { token: string }) => {
      try {
        // Token doğrulama (user-context'ten)
        const userContext = getCurrentUser() // Bu client-side function, server'da adaptation gerekli
        
        if (!userContext) {
          socket.emit('authentication_error', { message: 'Invalid token' })
          socket.disconnect()
          return
        }

        const connectionInfo: ConnectionInfo = {
          id: socket.id,
          userId: userContext.user?.id || 'unknown',
          userRole: userContext.userRole,
          factoryId: userContext.factoryId || undefined,
          connectedAt: new Date(),
          lastActivity: new Date(),
          subscriptions: new Set()
        }

        // Connection'ı kaydet
        eventManager.addConnection(connectionInfo)
        socket.join(`user:${connectionInfo.userId}`)
        
        if (connectionInfo.factoryId) {
          socket.join(`factory:${connectionInfo.factoryId}`)
        }
        
        if (connectionInfo.userRole === 'UPPER_MANAGEMENT' || connectionInfo.userRole === 'ADMIN') {
          socket.join('management')
        }

        socket.emit('authenticated', {
          userId: connectionInfo.userId,
          userRole: connectionInfo.userRole,
          factoryId: connectionInfo.factoryId
        })

        console.log(`✅ User ${connectionInfo.userId} authenticated`)

      } catch (error) {
        console.error('Authentication error:', error)
        socket.emit('authentication_error', { message: 'Authentication failed' })
        socket.disconnect()
      }
    })

    // Subscription management
    socket.on('subscribe', (data: { channel: string }) => {
      const { channel } = data
      socket.join(channel)
      eventManager.addSubscription(socket.id, channel)
      eventManager.updateActivity(socket.id)
      
      socket.emit('subscribed', { channel })
      console.log(`📡 Socket ${socket.id} subscribed to ${channel}`)
    })

    socket.on('unsubscribe', (data: { channel: string }) => {
      const { channel } = data
      socket.leave(channel)
      socket.emit('unsubscribed', { channel })
    })

    // Activity tracking
    socket.on('ping', () => {
      eventManager.updateActivity(socket.id)
      socket.emit('pong')
    })

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      console.log(`💔 Socket ${socket.id} disconnected: ${reason}`)
      eventManager.removeConnection(socket.id)
    })
  })

  // Event listeners from RealtimeEventManager
  eventManager.on(RealtimeEventType.KPI_VALUE_UPDATED, (data) => {
    const { payload, targetConnections } = data
    
    // Specific connections'a gönder
    targetConnections.forEach((connectionId: string) => {
      io?.to(connectionId).emit('kpi_value_updated', payload)
    })
    
    // Factory room'a da gönder
    io?.to(`factory:${payload.factoryId}`).emit('kpi_value_updated', payload)
    
    // Management room'a gönder
    io?.to('management').emit('kpi_value_updated', payload)
  })

  eventManager.on(RealtimeEventType.ANALYTICS_REFRESH_NEEDED, (data) => {
    const { affectedFactories, affectedPeriods } = data
    
    // Affected factories'e gönder
    affectedFactories.forEach((factoryId: string) => {
      io?.to(`factory:${factoryId}`).emit('analytics_refresh_needed', data)
    })
    
    // Management'a gönder
    io?.to('management').emit('analytics_refresh_needed', data)
  })

  eventManager.on(RealtimeEventType.NOTIFICATION_CREATED, (data) => {
    const { payload, targetConnections } = data
    
    targetConnections.forEach((connectionId: string) => {
      io?.to(connectionId).emit('notification_created', payload)
    })
    
    // Factory room'a da gönder
    io?.to(`factory:${payload.factoryId}`).emit('notification_created', payload)
  })

  eventManager.on(RealtimeEventType.BULK_UPDATE_COMPLETED, (data) => {
    const { affectedFactories, targetConnections } = data
    
    targetConnections.forEach((connectionId: string) => {
      io?.to(connectionId).emit('bulk_update_completed', data)
    })
    
    // Affected factories'e gönder
    affectedFactories.forEach((factoryId: string) => {
      io?.to(`factory:${factoryId}`).emit('bulk_update_completed', data)
    })
  })

  eventManager.on(RealtimeEventType.CACHE_INVALIDATED, (data) => {
    const { targetConnections } = data
    
    targetConnections.forEach((connectionId: string) => {
      io?.to(connectionId).emit('cache_invalidated', data)
    })
  })

  // Health check - her 5 dakikada inactive connections'ları temizle
  setInterval(() => {
    eventManager.cleanupInactiveConnections(30) // 30 dakika timeout
  }, 5 * 60 * 1000) // 5 dakika

  console.log('🚀 Socket.IO server initialized')
  return io
}

/**
 * WebSocket stats endpoint
 */
export async function GET(request: NextRequest) {
  const eventManager = RealtimeEventManager.getInstance()
  const stats = eventManager.getConnectionStats()
  
  return Response.json({
    success: true,
    stats,
    serverInfo: {
      socketIOInitialized: !!io,
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Manual event trigger (development/testing)
 */
export async function POST(request: NextRequest) {
  try {
    const { eventType, payload } = await request.json()
    const eventManager = RealtimeEventManager.getInstance()
    
    switch (eventType) {
      case 'test_kpi_update':
        eventManager.onKPIValueUpdated({
          id: 'test-123',
          kpiId: 'test-kpi',
          factoryId: payload.factoryId || 'test-factory',
          period: '2024-Q4',
          previousValue: 50,
          newValue: 75,
          achievementRate: 75,
          userId: 'test-user',
          timestamp: new Date().toISOString()
        })
        break
        
      case 'test_notification':
        eventManager.onNotificationCreated({
          id: 'test-notif-123',
          type: 'KPI_ACHIEVEMENT',
          priority: 'medium',
          title: 'Test Notification',
          message: 'This is a test notification',
          factoryId: payload.factoryId || 'test-factory',
          targetUsers: [payload.userId || 'test-user'],
          timestamp: new Date().toISOString()
        })
        break
        
      default:
        return Response.json({ error: 'Unknown event type' }, { status: 400 })
    }
    
    return Response.json({ success: true, message: 'Event triggered' })
    
  } catch (error) {
    console.error('Event trigger error:', error)
    return Response.json({ error: 'Failed to trigger event' }, { status: 500 })
  }
}

/**
 * Get current socket server instance
 */
export function getSocketServer(): SocketIOServer | null {
  return io
}

/**
 * Broadcast to all connected clients
 */
export function broadcastToAll(event: string, data: any) {
  if (io) {
    io.emit(event, data)
  }
}

/**
 * Broadcast to specific factory
 */
export function broadcastToFactory(factoryId: string, event: string, data: any) {
  if (io) {
    io.to(`factory:${factoryId}`).emit(event, data)
  }
}

/**
 * Broadcast to management
 */
export function broadcastToManagement(event: string, data: any) {
  if (io) {
    io.to('management').emit(event, data)
  }
}
