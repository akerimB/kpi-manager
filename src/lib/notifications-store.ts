// Simple in-memory notification store shared across routes

type NotificationItem = any

const store: Record<string, NotificationItem[]> = {}

export function getNotifications(factoryId?: string): NotificationItem[] {
  if (factoryId) return store[factoryId] || []
  return Object.values(store).flat()
}

export function addNotifications(factoryId: string, notifications: NotificationItem[]): void {
  if (!store[factoryId]) store[factoryId] = []
  store[factoryId].push(...notifications)
  // keep recent 200
  store[factoryId] = store[factoryId]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 200)
}

export function updateNotification(factoryId: string, notificationId: string, action: 'read'|'unread'|'delete'): boolean {
  const list = store[factoryId] || []
  const idx = list.findIndex(n => n.id === notificationId)
  if (idx === -1) return false
  switch (action) {
    case 'read':
      list[idx].isRead = true
      break
    case 'unread':
      list[idx].isRead = false
      break
    case 'delete':
      list[idx].isActive = false
      break
  }
  return true
}

export function getStats(factoryId?: string) {
  const all = getNotifications(factoryId)
  return {
    total: all.filter(n => n.isActive).length,
    unread: all.filter(n => n.isActive && !n.isRead).length,
    critical: all.filter(n => n.isActive && n.priority === 'critical').length,
    high: all.filter(n => n.isActive && n.priority === 'high').length,
    medium: all.filter(n => n.isActive && n.priority === 'medium').length,
    low: all.filter(n => n.isActive && n.priority === 'low').length
  }
}


