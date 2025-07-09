import { User } from './auth'

// Gerçek kullanıcı context'i - authentication'dan gelecek
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

// Cache for memoization
let cachedUserContext: UserContext | null = null
let lastTokenCheck = ''

// Gerçek authentication sistemi
export function getCurrentUser(): UserContext | null {
  // Client-side'da çalışıyorsa
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken')
    const userStr = localStorage.getItem('user')
    
    if (!token || !userStr) {
      cachedUserContext = null
      lastTokenCheck = ''
      return null
    }
    
    // Eğer token değişmemişse cached değeri döndür
    if (lastTokenCheck === token && cachedUserContext) {
      return cachedUserContext
    }
    
    try {
      const user = JSON.parse(userStr)
      
      // Rol bazlı yetkiler
      const permissions = getPermissionsByRole(user.role)
      
      const userContext = {
        user,
        isAuthenticated: true,
        userRole: user.role,
        factoryId: user.factoryId,
        permissions
      }
      
      // Cache'i güncelle
      cachedUserContext = userContext
      lastTokenCheck = token
      
      return userContext
    } catch (error) {
      console.error('Error parsing user data:', error)
      cachedUserContext = null
      lastTokenCheck = ''
      return null
    }
  }
  
  // Server-side'da null döndür
  return null
}

// Rol bazlı yetkiler
function getPermissionsByRole(role: string) {
  const DEFAULT_PERMISSIONS = {
    MODEL_FACTORY: {
      canViewAllFactories: false,
      canExportData: false,
      canManageActions: false,
      canViewAnalytics: false,
      canCreateSimulations: false
    },
    UPPER_MANAGEMENT: {
      canViewAllFactories: true,
      canExportData: true,
      canManageActions: true,
      canViewAnalytics: true,
      canCreateSimulations: true
    },
    ADMIN: {
      canViewAllFactories: true,
      canExportData: true,
      canManageActions: true,
      canViewAnalytics: true,
      canCreateSimulations: true
    }
  }
  
  return DEFAULT_PERMISSIONS[role as keyof typeof DEFAULT_PERMISSIONS] || DEFAULT_PERMISSIONS.MODEL_FACTORY
}

// Giriş yapma fonksiyonu
export async function login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    const data = await response.json()

    if (response.ok) {
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Cache'i temizle
      cachedUserContext = null
      lastTokenCheck = ''
      
      return { success: true }
    } else {
      return { success: false, error: data.error }
    }
  } catch (error) {
    return { success: false, error: 'Bir hata oluştu' }
  }
}

// Çıkış yapma fonksiyonu
export async function logout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    
    // Cache'i temizle
    cachedUserContext = null
    lastTokenCheck = ''
    
    window.location.href = '/login'
  }
}

// Token doğrulama fonksiyonu
export async function verifyToken(): Promise<boolean> {
  const token = localStorage.getItem('authToken')
  
  if (!token) {
    return false
  }
  
  try {
    const response = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ token }),
    })

    if (response.ok) {
      const data = await response.json()
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // Cache'i temizle ki yeni data ile güncellensin
      cachedUserContext = null
      lastTokenCheck = ''
      
      return true
    } else {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      
      // Cache'i temizle
      cachedUserContext = null
      lastTokenCheck = ''
      
      return false
    }
  } catch (error) {
    console.error('Token verification error:', error)
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
    
    // Cache'i temizle
    cachedUserContext = null
    lastTokenCheck = ''
    
    return false
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

// Authentication guard hook
export function useAuthGuard() {
  if (typeof window !== 'undefined') {
    const userContext = getCurrentUser()
    
    if (!userContext) {
      window.location.href = '/login'
      return null
    }
    
    return userContext
  }
  
  return null
} 