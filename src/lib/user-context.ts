import { User } from './auth'

// Simulated user context - gerçek uygulamada authentication service'den gelecek
export interface UserContext {
  user: User | null
  isAuthenticated: boolean
  userRole: 'MODEL_FACTORY' | 'UPPER_MANAGEMENT' | 'ADMIN'
  factoryId: string | null
  permissions: {
    canViewAllFactories: boolean
    canExportData: boolean
    canManageActions: boolean
    canViewAnalytics: boolean
    canCreateSimulations: boolean
  }
}

// Global state for switching between users for testing
let currentUserType: 'MODEL_FACTORY' | 'UPPER_MANAGEMENT' = 'MODEL_FACTORY'

// Simulated current user - gerçek uygulamada authentication service'den gelecek
export function getCurrentUser(): UserContext {
  // Bu fonksiyon gerçek uygulamada JWT token'dan veya session'dan gelecek
  
  if (currentUserType === 'UPPER_MANAGEMENT') {
    return getUpperManagementUser()
  }
  
  return {
    user: {
      id: 'user-1',
      email: 'fabrika1@example.com',
      name: 'Fabrika 1 Kullanıcısı',
      role: 'MODEL_FACTORY',
      factoryId: 'cmcwg5ap9000klvzdbgbxzfqr', // İlk fabrikanın ID'si
      isActive: true,
      permissions: {
        canViewAllFactories: false,
        canExportData: false,
        canManageActions: false,
        canViewAnalytics: false,
        canCreateSimulations: false
      }
    },
    isAuthenticated: true,
    userRole: 'MODEL_FACTORY',
    factoryId: 'cmcwg5ap9000klvzdbgbxzfqr',
    permissions: {
      canViewAllFactories: false,
      canExportData: false,
      canManageActions: false,
      canViewAnalytics: false,
      canCreateSimulations: false
    }
  }
}

// Test için rol değiştirme fonksiyonu
export function switchUserRole(role: 'MODEL_FACTORY' | 'UPPER_MANAGEMENT') {
  currentUserType = role
  // Sayfayı yenile
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

// Üst yönetim kullanıcısı için simulated context
export function getUpperManagementUser(): UserContext {
  return {
    user: {
      id: 'user-2',
      email: 'yonetim@example.com',
      name: 'Üst Yönetim Kullanıcısı',
      role: 'UPPER_MANAGEMENT',
      factoryId: null,
      isActive: true,
      permissions: {
        canViewAllFactories: true,
        canExportData: true,
        canManageActions: true,
        canViewAnalytics: true,
        canCreateSimulations: true
      }
    },
    isAuthenticated: true,
    userRole: 'UPPER_MANAGEMENT',
    factoryId: null,
    permissions: {
      canViewAllFactories: true,
      canExportData: true,
      canManageActions: true,
      canViewAnalytics: true,
      canCreateSimulations: true
    }
  }
}

// URL parametrelerini oluştur
export function getUserApiParams(userContext: UserContext): string {
  const params = new URLSearchParams({
    userRole: userContext.userRole,
    userId: userContext.user?.id || ''
  })
  
  if (userContext.factoryId) {
    params.set('factoryId', userContext.factoryId)
  }
  
  return params.toString()
} 