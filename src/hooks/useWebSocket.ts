/**
 * WebSocket Hook for Real-time Updates
 * Analytics sayfaları için real-time data updates
 */

'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { getCurrentUser } from '@/lib/user-context'
import { 
  RealtimeEventType, 
  KPIValueUpdatedPayload, 
  AnalyticsRefreshPayload,
  NotificationCreatedPayload 
} from '@/lib/realtime-events'

export interface WebSocketHookOptions {
  autoConnect?: boolean
  reconnectAttempts?: number
  reconnectInterval?: number
  debug?: boolean
}

export interface WebSocketState {
  connected: boolean
  connecting: boolean
  error: string | null
  lastEvent: any
  eventCount: number
}

export interface WebSocketHook {
  state: WebSocketState
  connect: () => void
  disconnect: () => void
  subscribe: (channel: string) => void
  unsubscribe: (channel: string) => void
  emit: (event: string, data: any) => void
  onKPIValueUpdated: (callback: (payload: KPIValueUpdatedPayload) => void) => () => void
  onAnalyticsRefreshNeeded: (callback: (payload: AnalyticsRefreshPayload) => void) => () => void
  onNotificationCreated: (callback: (payload: NotificationCreatedPayload) => void) => () => void
  onBulkUpdateCompleted: (callback: (payload: any) => void) => () => void
  onCacheInvalidated: (callback: (payload: any) => void) => () => void
}

export function useWebSocket(options: WebSocketHookOptions = {}): WebSocketHook {
  const {
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectInterval = 3000,
    debug = false
  } = options

  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null,
    lastEvent: null,
    eventCount: 0
  })

  const socketRef = useRef<Socket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const callbacksRef = useRef<Map<string, Set<Function>>>(new Map())

  // Event callback management
  const addEventListener = useCallback((event: string, callback: Function) => {
    if (!callbacksRef.current.has(event)) {
      callbacksRef.current.set(event, new Set())
    }
    callbacksRef.current.get(event)!.add(callback)

    // Return cleanup function
    return () => {
      const callbacks = callbacksRef.current.get(event)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          callbacksRef.current.delete(event)
        }
      }
    }
  }, [])

  const triggerCallbacks = useCallback((event: string, payload: any) => {
    const callbacks = callbacksRef.current.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(payload)
        } catch (error) {
          console.error(`Error in WebSocket callback for ${event}:`, error)
        }
      })
    }
  }, [])

  // Connection management
  const connect = useCallback(() => {
    if (socketRef.current?.connected) {
      if (debug) console.log('🔗 Already connected to WebSocket')
      return
    }

    const user = getCurrentUser()
    if (!user) {
      setState(prev => ({ ...prev, error: 'User not authenticated' }))
      return
    }

    setState(prev => ({ ...prev, connecting: true, error: null }))

    try {
      const socket = io({
        path: '/api/websocket',
        transports: ['websocket', 'polling'],
        autoConnect: false,
        reconnection: true,
        reconnectionAttempts: reconnectAttempts,
        reconnectionDelay: reconnectInterval
      })

      socketRef.current = socket

      // Connection events
      socket.on('connect', () => {
        if (debug) console.log('🔗 WebSocket connected')
        setState(prev => ({ ...prev, connected: true, connecting: false, error: null }))
        reconnectAttemptsRef.current = 0

        // Authenticate
        socket.emit('authenticate', { 
          token: localStorage.getItem('authToken') 
        })
      })

      socket.on('authenticated', (data) => {
        if (debug) console.log('✅ WebSocket authenticated:', data)
        
        // Auto-subscribe to relevant channels
        if (user.userRole === 'MODEL_FACTORY' && user.factoryId) {
          socket.emit('subscribe', { channel: `factory:${user.factoryId}` })
        }
        
        if (user.userRole === 'UPPER_MANAGEMENT' || user.userRole === 'ADMIN') {
          socket.emit('subscribe', { channel: 'management' })
        }
      })

      socket.on('authentication_error', (error) => {
        console.error('❌ WebSocket authentication failed:', error)
        setState(prev => ({ ...prev, error: error.message, connecting: false }))
      })

      socket.on('disconnect', (reason) => {
        if (debug) console.log('💔 WebSocket disconnected:', reason)
        setState(prev => ({ ...prev, connected: false, connecting: false }))
      })

      socket.on('connect_error', (error) => {
        console.error('🚫 WebSocket connection error:', error)
        setState(prev => ({ ...prev, error: error.message, connecting: false }))
        reconnectAttemptsRef.current++
      })

      // Real-time events
      socket.on('kpi_value_updated', (payload: KPIValueUpdatedPayload) => {
        if (debug) console.log('📊 KPI value updated:', payload)
        setState(prev => ({ 
          ...prev, 
          lastEvent: { type: 'kpi_value_updated', payload }, 
          eventCount: prev.eventCount + 1 
        }))
        triggerCallbacks('kpi_value_updated', payload)
      })

      socket.on('analytics_refresh_needed', (payload: AnalyticsRefreshPayload) => {
        if (debug) console.log('🔄 Analytics refresh needed:', payload)
        setState(prev => ({ 
          ...prev, 
          lastEvent: { type: 'analytics_refresh_needed', payload }, 
          eventCount: prev.eventCount + 1 
        }))
        triggerCallbacks('analytics_refresh_needed', payload)
      })

      socket.on('notification_created', (payload: NotificationCreatedPayload) => {
        if (debug) console.log('🔔 Notification created:', payload)
        setState(prev => ({ 
          ...prev, 
          lastEvent: { type: 'notification_created', payload }, 
          eventCount: prev.eventCount + 1 
        }))
        triggerCallbacks('notification_created', payload)
      })

      socket.on('bulk_update_completed', (payload: any) => {
        if (debug) console.log('📦 Bulk update completed:', payload)
        setState(prev => ({ 
          ...prev, 
          lastEvent: { type: 'bulk_update_completed', payload }, 
          eventCount: prev.eventCount + 1 
        }))
        triggerCallbacks('bulk_update_completed', payload)
      })

      socket.on('cache_invalidated', (payload: any) => {
        if (debug) console.log('🗑️ Cache invalidated:', payload)
        setState(prev => ({ 
          ...prev, 
          lastEvent: { type: 'cache_invalidated', payload }, 
          eventCount: prev.eventCount + 1 
        }))
        triggerCallbacks('cache_invalidated', payload)
      })

      // Heartbeat
      const heartbeat = setInterval(() => {
        if (socket.connected) {
          socket.emit('ping')
        }
      }, 30000) // 30 seconds

      socket.on('pong', () => {
        if (debug) console.log('💓 Heartbeat pong received')
      })

      // Connect
      socket.connect()

      // Cleanup function
      return () => {
        clearInterval(heartbeat)
        socket.disconnect()
      }

    } catch (error) {
      console.error('WebSocket setup error:', error)
      setState(prev => ({ ...prev, error: String(error), connecting: false }))
    }
  }, [debug, reconnectAttempts, reconnectInterval, triggerCallbacks])

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }
    setState(prev => ({ ...prev, connected: false, connecting: false }))
  }, [])

  const subscribe = useCallback((channel: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('subscribe', { channel })
    }
  }, [])

  const unsubscribe = useCallback((channel: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('unsubscribe', { channel })
    }
  }, [])

  const emit = useCallback((event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data)
    }
  }, [])

  // Specific event listeners
  const onKPIValueUpdated = useCallback((callback: (payload: KPIValueUpdatedPayload) => void) => {
    return addEventListener('kpi_value_updated', callback)
  }, [addEventListener])

  const onAnalyticsRefreshNeeded = useCallback((callback: (payload: AnalyticsRefreshPayload) => void) => {
    return addEventListener('analytics_refresh_needed', callback)
  }, [addEventListener])

  const onNotificationCreated = useCallback((callback: (payload: NotificationCreatedPayload) => void) => {
    return addEventListener('notification_created', callback)
  }, [addEventListener])

  const onBulkUpdateCompleted = useCallback((callback: (payload: any) => void) => {
    return addEventListener('bulk_update_completed', callback)
  }, [addEventListener])

  const onCacheInvalidated = useCallback((callback: (payload: any) => void) => {
    return addEventListener('cache_invalidated', callback)
  }, [addEventListener])

  // Auto-connect effect
  useEffect(() => {
    if (autoConnect) {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [autoConnect, connect, disconnect])

  // Window visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !state.connected && !state.connecting) {
        if (debug) console.log('🔄 Page became visible, reconnecting WebSocket')
        connect()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [connect, state.connected, state.connecting, debug])

  return {
    state,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    emit,
    onKPIValueUpdated,
    onAnalyticsRefreshNeeded,
    onNotificationCreated,
    onBulkUpdateCompleted,
    onCacheInvalidated
  }
}

/**
 * Hook for analytics-specific real-time updates
 */
export function useAnalyticsWebSocket() {
  const webSocket = useWebSocket({ debug: process.env.NODE_ENV === 'development' })
  const [analyticsData, setAnalyticsData] = useState<any>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Listen for analytics refresh events
  useEffect(() => {
    const cleanup = webSocket.onAnalyticsRefreshNeeded((payload) => {
      console.log('📊 Analytics refresh triggered:', payload)
      setRefreshTrigger(prev => prev + 1)
    })

    return cleanup
  }, [webSocket])

  // Listen for KPI updates
  useEffect(() => {
    const cleanup = webSocket.onKPIValueUpdated((payload) => {
      console.log('📈 KPI updated, refreshing analytics:', payload)
      setRefreshTrigger(prev => prev + 1)
    })

    return cleanup
  }, [webSocket])

  return {
    ...webSocket,
    analyticsData,
    refreshTrigger, // Use this to trigger data refetch in components
    setAnalyticsData
  }
}
