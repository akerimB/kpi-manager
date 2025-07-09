import { prisma } from './prisma'

export interface User {
  id: string
  email: string
  name: string | null
  role: 'MODEL_FACTORY' | 'UPPER_MANAGEMENT' | 'ADMIN'
  factoryId: string | null
  factory?: {
    id: string
    name: string
    code: string
  } | null
  isActive: boolean
  permissions: {
    canViewAllFactories: boolean
    canExportData: boolean
    canManageActions: boolean
    canViewAnalytics: boolean
    canCreateSimulations: boolean
  }
}

export interface AuthContext {
  user: User | null
  isAuthenticated: boolean
}

// Rol bazlı varsayılan yetkiler
export const DEFAULT_PERMISSIONS = {
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

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        factory: true
      }
    })

    if (!user) return null

    const rolePermissions = DEFAULT_PERMISSIONS[user.role as keyof typeof DEFAULT_PERMISSIONS]
    const customPermissions = user.permissions ? JSON.parse(user.permissions) : {}
    
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'MODEL_FACTORY' | 'UPPER_MANAGEMENT' | 'ADMIN',
      factoryId: user.factoryId,
      isActive: user.isActive,
      permissions: {
        ...rolePermissions,
        ...customPermissions
      }
    }
  } catch (error) {
    console.error('Error fetching user:', error)
    return null
  }
}

export function canAccessFactory(user: User, factoryId: string): boolean {
  // Admin ve üst yönetim tüm fabrikaları görebilir
  if (user.role === 'ADMIN' || user.role === 'UPPER_MANAGEMENT') {
    return true
  }
  
  // Model fabrika kullanıcıları sadece kendi fabrikalarını görebilir
  if (user.role === 'MODEL_FACTORY') {
    return user.factoryId === factoryId
  }
  
  return false
}

export function canViewKPIData(user: User, factoryId?: string): boolean {
  if (!user.isActive) return false
  
  // Üst yönetim ve admin hepsini görebilir
  if (user.role === 'UPPER_MANAGEMENT' || user.role === 'ADMIN') {
    return true
  }
  
  // Model fabrika kullanıcıları sadece kendi fabrikalarının KPI'larını görebilir
  if (user.role === 'MODEL_FACTORY' && factoryId) {
    return canAccessFactory(user, factoryId)
  }
  
  return false
}

export function canEnterKPIData(user: User, factoryId: string): boolean {
  if (!user.isActive) return false
  
  // Sadece model fabrika kullanıcıları KPI girişi yapabilir
  if (user.role === 'MODEL_FACTORY') {
    return canAccessFactory(user, factoryId)
  }
  
  return false
}

export function canExportData(user: User): boolean {
  return user.isActive && user.permissions.canExportData
}

export function canManageActions(user: User): boolean {
  return user.isActive && user.permissions.canManageActions
}

export function canCreateSimulations(user: User): boolean {
  return user.isActive && user.permissions.canCreateSimulations
}

// Uygulama.txt'deki kullanıcı hikayelerine göre yetki kontrolü
export function getAccessibleFactories(user: User): string[] | 'ALL' {
  if (user.role === 'UPPER_MANAGEMENT' || user.role === 'ADMIN') {
    return 'ALL'
  }
  
  if (user.role === 'MODEL_FACTORY' && user.factoryId) {
    return [user.factoryId]
  }
  
  return []
} 