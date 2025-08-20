/**
 * Real-time Events System
 * KPI değişiklikleri ve analytics güncellemeleri için WebSocket desteği
 */

import { EventEmitter } from 'events'

// Event types
export enum RealtimeEventType {
  KPI_VALUE_UPDATED = 'kpi_value_updated',
  KPI_VALUE_CREATED = 'kpi_value_created',
  FACTORY_STATUS_CHANGED = 'factory_status_changed',
  ANALYTICS_REFRESH_NEEDED = 'analytics_refresh_needed',
  USER_CONNECTED = 'user_connected',
  USER_DISCONNECTED = 'user_disconnected',
  NOTIFICATION_CREATED = 'notification_created',
  ACTION_STATUS_UPDATED = 'action_status_updated',
  BULK_UPDATE_COMPLETED = 'bulk_update_completed',
  CACHE_INVALIDATED = 'cache_invalidated'
}

// Event payloads
export interface KPIValueUpdatedPayload {
  id: string
  kpiId: string
  factoryId: string
  period: string
  previousValue: number
  newValue: number
  targetValue?: number
  achievementRate: number
  userId: string
  timestamp: string
}

export interface FactoryStatusChangedPayload {
  factoryId: string
  previousStatus: string
  newStatus: string
  affectedKPIs: string[]
  timestamp: string
}

export interface AnalyticsRefreshPayload {
  type: 'kpi_update' | 'factory_change' | 'action_update' | 'bulk_import'
  affectedFactories: string[]
  affectedPeriods: string[]
  affectedKPIs?: string[]
  triggerUserId: string
  timestamp: string
}

export interface NotificationCreatedPayload {
  id: string
  type: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  factoryId: string
  targetUsers: string[]
  timestamp: string
}

export interface UserConnectionPayload {
  userId: string
  userRole: string
  factoryId?: string
  sessionId: string
  timestamp: string
}

// Connection info
export interface ConnectionInfo {
  id: string
  userId: string
  userRole: string
  factoryId?: string
  connectedAt: Date
  lastActivity: Date
  subscriptions: Set<string>
}

/**
 * Realtime Event Manager
 */
export class RealtimeEventManager extends EventEmitter {
  private static instance: RealtimeEventManager
  private connections = new Map<string, ConnectionInfo>()
  private userConnections = new Map<string, Set<string>>() // userId -> Set<connectionId>
  private factorySubscriptions = new Map<string, Set<string>>() // factoryId -> Set<connectionId>
  
  static getInstance(): RealtimeEventManager {
    if (!RealtimeEventManager.instance) {
      RealtimeEventManager.instance = new RealtimeEventManager()
    }
    return RealtimeEventManager.instance
  }

  /**
   * Yeni bağlantı kaydet
   */
  addConnection(connectionInfo: ConnectionInfo): void {
    this.connections.set(connectionInfo.id, connectionInfo)
    
    // User mapping
    if (!this.userConnections.has(connectionInfo.userId)) {
      this.userConnections.set(connectionInfo.userId, new Set())
    }
    this.userConnections.get(connectionInfo.userId)!.add(connectionInfo.id)
    
    // Factory subscription
    if (connectionInfo.factoryId) {
      if (!this.factorySubscriptions.has(connectionInfo.factoryId)) {
        this.factorySubscriptions.set(connectionInfo.factoryId, new Set())
      }
      this.factorySubscriptions.get(connectionInfo.factoryId)!.add(connectionInfo.id)
    }
    
    console.log(`🔗 User ${connectionInfo.userId} connected (${connectionInfo.userRole})`)
    
    this.emit(RealtimeEventType.USER_CONNECTED, {
      userId: connectionInfo.userId,
      userRole: connectionInfo.userRole,
      factoryId: connectionInfo.factoryId,
      sessionId: connectionInfo.id,
      timestamp: new Date().toISOString()
    } as UserConnectionPayload)
  }

  /**
   * Bağlantı kapat
   */
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (!connection) return
    
    // Cleanup user mapping
    const userConnections = this.userConnections.get(connection.userId)
    if (userConnections) {
      userConnections.delete(connectionId)
      if (userConnections.size === 0) {
        this.userConnections.delete(connection.userId)
      }
    }
    
    // Cleanup factory subscription
    if (connection.factoryId) {
      const factoryConnections = this.factorySubscriptions.get(connection.factoryId)
      if (factoryConnections) {
        factoryConnections.delete(connectionId)
        if (factoryConnections.size === 0) {
          this.factorySubscriptions.delete(connection.factoryId)
        }
      }
    }
    
    this.connections.delete(connectionId)
    
    console.log(`❌ User ${connection.userId} disconnected`)
    
    this.emit(RealtimeEventType.USER_DISCONNECTED, {
      userId: connection.userId,
      userRole: connection.userRole,
      factoryId: connection.factoryId,
      sessionId: connectionId,
      timestamp: new Date().toISOString()
    } as UserConnectionPayload)
  }

  /**
   * Subscription ekle
   */
  addSubscription(connectionId: string, subscription: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.subscriptions.add(subscription)
      connection.lastActivity = new Date()
    }
  }

  /**
   * KPI değeri güncellendiğinde
   */
  onKPIValueUpdated(payload: KPIValueUpdatedPayload): void {
    // Factory subscribers'a gönder
    const factoryConnections = this.factorySubscriptions.get(payload.factoryId) || new Set()
    
    // Upper management'a da gönder (tüm fabrikaları görebilir)
    const upperManagementConnections = new Set<string>()
    for (const [connectionId, connection] of this.connections) {
      if (connection.userRole === 'UPPER_MANAGEMENT' || connection.userRole === 'ADMIN') {
        upperManagementConnections.add(connectionId)
      }
    }
    
    const targetConnections = new Set([...factoryConnections, ...upperManagementConnections])
    
    this.emit(RealtimeEventType.KPI_VALUE_UPDATED, {
      payload,
      targetConnections: Array.from(targetConnections)
    })
    
    // Analytics refresh tetikle
    this.emit(RealtimeEventType.ANALYTICS_REFRESH_NEEDED, {
      type: 'kpi_update',
      affectedFactories: [payload.factoryId],
      affectedPeriods: [payload.period],
      affectedKPIs: [payload.kpiId],
      triggerUserId: payload.userId,
      timestamp: payload.timestamp
    } as AnalyticsRefreshPayload)
  }

  /**
   * Factory durumu değiştiğinde
   */
  onFactoryStatusChanged(payload: FactoryStatusChangedPayload): void {
    const factoryConnections = this.factorySubscriptions.get(payload.factoryId) || new Set()
    
    // Üst yönetime de bildir
    const managementConnections = new Set<string>()
    for (const [connectionId, connection] of this.connections) {
      if (connection.userRole === 'UPPER_MANAGEMENT' || connection.userRole === 'ADMIN') {
        managementConnections.add(connectionId)
      }
    }
    
    const targetConnections = new Set([...factoryConnections, ...managementConnections])
    
    this.emit(RealtimeEventType.FACTORY_STATUS_CHANGED, {
      payload,
      targetConnections: Array.from(targetConnections)
    })
  }

  /**
   * Bildirim oluşturulduğunda
   */
  onNotificationCreated(payload: NotificationCreatedPayload): void {
    const targetConnections = new Set<string>()
    
    // Target users'ı bul
    for (const userId of payload.targetUsers) {
      const userConnections = this.userConnections.get(userId) || new Set()
      for (const connectionId of userConnections) {
        targetConnections.add(connectionId)
      }
    }
    
    // Factory users'a da gönder
    const factoryConnections = this.factorySubscriptions.get(payload.factoryId) || new Set()
    for (const connectionId of factoryConnections) {
      targetConnections.add(connectionId)
    }
    
    this.emit(RealtimeEventType.NOTIFICATION_CREATED, {
      payload,
      targetConnections: Array.from(targetConnections)
    })
  }

  /**
   * Bulk update tamamlandığında
   */
  onBulkUpdateCompleted(affectedFactories: string[], affectedPeriods: string[], triggerUserId: string): void {
    // Tüm etkilenen factory subscribers'a bildir
    const targetConnections = new Set<string>()
    
    for (const factoryId of affectedFactories) {
      const factoryConnections = this.factorySubscriptions.get(factoryId) || new Set()
      for (const connectionId of factoryConnections) {
        targetConnections.add(connectionId)
      }
    }
    
    // Üst yönetime de bildir
    for (const [connectionId, connection] of this.connections) {
      if (connection.userRole === 'UPPER_MANAGEMENT' || connection.userRole === 'ADMIN') {
        targetConnections.add(connectionId)
      }
    }
    
    this.emit(RealtimeEventType.BULK_UPDATE_COMPLETED, {
      affectedFactories,
      affectedPeriods,
      triggerUserId,
      targetConnections: Array.from(targetConnections),
      timestamp: new Date().toISOString()
    })
    
    // Analytics refresh tetikle
    this.emit(RealtimeEventType.ANALYTICS_REFRESH_NEEDED, {
      type: 'bulk_import',
      affectedFactories,
      affectedPeriods,
      triggerUserId,
      timestamp: new Date().toISOString()
    } as AnalyticsRefreshPayload)
  }

  /**
   * Cache invalidation
   */
  onCacheInvalidated(cacheKeys: string[], reason: string): void {
    // Tüm bağlı kullanıcılara bildir
    const allConnections = Array.from(this.connections.keys())
    
    this.emit(RealtimeEventType.CACHE_INVALIDATED, {
      cacheKeys,
      reason,
      targetConnections: allConnections,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Connection stats
   */
  getConnectionStats() {
    const stats = {
      totalConnections: this.connections.size,
      uniqueUsers: this.userConnections.size,
      factorySubscriptions: this.factorySubscriptions.size,
      connectionsByRole: {} as Record<string, number>,
      connectionsByFactory: {} as Record<string, number>
    }
    
    // Role breakdown
    for (const connection of this.connections.values()) {
      stats.connectionsByRole[connection.userRole] = (stats.connectionsByRole[connection.userRole] || 0) + 1
      
      if (connection.factoryId) {
        stats.connectionsByFactory[connection.factoryId] = (stats.connectionsByFactory[connection.factoryId] || 0) + 1
      }
    }
    
    return stats
  }

  /**
   * Health check - inactive connections'ları temizle
   */
  cleanupInactiveConnections(timeoutMinutes: number = 30): number {
    const now = new Date()
    const timeout = timeoutMinutes * 60 * 1000
    let cleaned = 0
    
    for (const [connectionId, connection] of this.connections) {
      const inactiveTime = now.getTime() - connection.lastActivity.getTime()
      if (inactiveTime > timeout) {
        this.removeConnection(connectionId)
        cleaned++
      }
    }
    
    console.log(`🧹 Cleaned ${cleaned} inactive connections`)
    return cleaned
  }

  /**
   * Activity update
   */
  updateActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.lastActivity = new Date()
    }
  }
}

/**
 * Event helper functions
 */
export const RealtimeEvents = {
  /**
   * KPI değeri güncellendiğinde event gönder
   */
  notifyKPIValueUpdated(payload: KPIValueUpdatedPayload): void {
    const manager = RealtimeEventManager.getInstance()
    manager.onKPIValueUpdated(payload)
  },

  /**
   * Factory status değiştiğinde event gönder
   */
  notifyFactoryStatusChanged(payload: FactoryStatusChangedPayload): void {
    const manager = RealtimeEventManager.getInstance()
    manager.onFactoryStatusChanged(payload)
  },

  /**
   * Bildirim oluşturulduğunda event gönder
   */
  notifyNotificationCreated(payload: NotificationCreatedPayload): void {
    const manager = RealtimeEventManager.getInstance()
    manager.onNotificationCreated(payload)
  },

  /**
   * Bulk update tamamlandığında event gönder
   */
  notifyBulkUpdateCompleted(affectedFactories: string[], affectedPeriods: string[], triggerUserId: string): void {
    const manager = RealtimeEventManager.getInstance()
    manager.onBulkUpdateCompleted(affectedFactories, affectedPeriods, triggerUserId)
  },

  /**
   * Cache invalidation event gönder
   */
  notifyCacheInvalidated(cacheKeys: string[], reason: string): void {
    const manager = RealtimeEventManager.getInstance()
    manager.onCacheInvalidated(cacheKeys, reason)
  }
}
