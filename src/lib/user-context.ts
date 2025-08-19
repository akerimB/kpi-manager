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

// Session monitoring
let sessionCheckInterval: NodeJS.Timeout | null = null
let lastLoginTime = ''

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
      
      // Login time'ı güncelle
      const loginTime = localStorage.getItem('loginTime')
      if (loginTime && loginTime !== lastLoginTime) {
        lastLoginTime = loginTime
        // Session monitoring başlat (eğer çalışmıyorsa)
        if (!sessionCheckInterval) {
          startSessionMonitoring()
        }
      }
      
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

// Session monitoring başlat
export function startSessionMonitoring(): void {
  if (typeof window === 'undefined') return
  
  // Mevcut interval'ı temizle
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
  }
  
  // Her 5 saniyede bir session kontrol et (daha sık kontrol)
  sessionCheckInterval = setInterval(async () => {
    const token = localStorage.getItem('authToken')
    const currentLoginTime = localStorage.getItem('loginTime')
    
    if (!token) {
      console.log('Token bulunamadı, session temizleniyor...')
      clearSession()
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
      return
    }
    
    // Eğer login time değişmişse (başka yerde giriş yapılmış), logout yap
    if (lastLoginTime && currentLoginTime && currentLoginTime !== lastLoginTime) {
      console.log('Başka yerden giriş yapıldı, otomatik çıkış yapılıyor...')
      alert('Güvenlik uyarısı: Hesabınıza başka bir yerden giriş yapıldı. Otomatik olarak çıkış yapılıyor.')
      await forceLogout()
      return
    }
    
    // Login time güncelle
    if (currentLoginTime && currentLoginTime !== lastLoginTime) {
      lastLoginTime = currentLoginTime
    }
    
    // Token'ı doğrula (daha az sıklıkta - her 30 sn)
    const now = Date.now()
    const lastCheck = parseInt(sessionStorage.getItem('lastTokenCheck') || '0')
    if (now - lastCheck > 30000) { // 30 saniye
      const isValid = await verifyToken()
      if (!isValid) {
        console.log('Token geçersiz, otomatik çıkış yapılıyor...')
        await forceLogout()
        return
      }
      sessionStorage.setItem('lastTokenCheck', now.toString())
    }
  }, 5000) // 5 saniye
}

// Session monitoring durdur
export function stopSessionMonitoring(): void {
  if (sessionCheckInterval) {
    clearInterval(sessionCheckInterval)
    sessionCheckInterval = null
  }
}

// Session temizle
function clearSession(): void {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
  localStorage.removeItem('loginTime')
  sessionStorage.removeItem('lastTokenCheck')
  cachedUserContext = null
  lastTokenCheck = ''
  lastLoginTime = ''
  stopSessionMonitoring()
}

// Zorla logout (session monitoring'den çağrılır)
async function forceLogout(): Promise<void> {
  try {
    await fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    })
  } catch (error) {
    console.error('Force logout error:', error)
  } finally {
    clearSession()
    // Sadece login sayfasında değilsek redirect et
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
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
      // Önce tüm diğer sekmelerdeki session'ları geçersiz kıl
      const currentLoginTime = localStorage.getItem('loginTime')
      
      // Önceki session'ı temizle
      clearSession()
      
      // Yeni session başlat (unique ID ile)
      const loginTime = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('loginTime', loginTime)
      lastLoginTime = loginTime
      
      // Cache'i temizle
      cachedUserContext = null
      lastTokenCheck = ''
      
      // Session monitoring başlat
      startSessionMonitoring()
      
      console.log(`Yeni giriş: ${data.user.email} - LoginTime: ${loginTime}`)
      
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
    // Session monitoring durdur
    stopSessionMonitoring()
    
    // Session temizle
    clearSession()
    
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