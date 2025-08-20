/**
 * Query Optimization Utilities
 * N+1 query problemlerini önlemek ve performansı artırmak için
 */

import { prisma } from './prisma'

// Cache interface
interface QueryCache {
  key: string
  data: any
  expiry: number
}

// In-memory cache (production'da Redis kullanılacak)
const memoryCache = new Map<string, QueryCache>()

/**
 * Cache utilities
 */
export const CacheUtils = {
  /**
   * Cache'den veri al (Redis öncelikli)
   */
  async get<T>(key: string): Promise<T | null> {
    // Memory cache'den al (Redis bağımlılığını kaldırıyoruz)
    const cached = memoryCache.get(key)
    if (!cached) return null
    
    if (Date.now() > cached.expiry) {
      memoryCache.delete(key)
      return null
    }
    
    return cached.data as T
  },

  /**
   * Cache'e veri koy (Redis + Memory)
   */
  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    // Memory cache'e kaydet (Redis bağımlılığını kaldırıyoruz)
    memoryCache.set(key, {
      key,
      data,
      expiry: Date.now() + (ttlSeconds * 1000)
    })
  },

  /**
   * Cache'i temizle (Redis + Memory)
   */
  async clear(pattern?: string): Promise<void> {
    if (!pattern) {
      memoryCache.clear()
      return
    }
    
    // Memory cache pattern delete
    for (const key of memoryCache.keys()) {
      if (key.includes(pattern)) {
        memoryCache.delete(key)
      }
    }
  },

  /**
   * Cache key oluştur
   */
  createKey(prefix: string, params: Record<string, any>): string {
    const sorted = Object.keys(params)
      .sort()
      .map(key => `${key}:${params[key]}`)
      .join('|')
    return `${prefix}:${sorted}`
  }
}

/**
 * Optimized KPI data loader
 */
export class OptimizedKPILoader {
  private static instance: OptimizedKPILoader
  
  static getInstance(): OptimizedKPILoader {
    if (!OptimizedKPILoader.instance) {
      OptimizedKPILoader.instance = new OptimizedKPILoader()
    }
    return OptimizedKPILoader.instance
  }

  /**
   * Tek sorguda tüm KPI verilerini yükle
   */
  async loadKPIData(options: {
    periods: string[]
    factoryIds?: string[]
    kpiIds?: string[]
    includeTargets?: boolean
    includeFactoryInfo?: boolean
  }) {
    const cacheKey = CacheUtils.createKey('kpi_data', options)
    const cached = await CacheUtils.get(cacheKey)
    if (cached) return cached

    const { periods, factoryIds, kpiIds, includeTargets = true, includeFactoryInfo = true } = options

    // Ana KPI sorgusu - tek seferde everything
    const whereClause: any = {}
    if (kpiIds) whereClause.id = { in: kpiIds }

    const kpis = await prisma.kpi.findMany({
      where: whereClause,
      include: {
        kpiValues: {
          where: {
            period: { in: periods },
            ...(factoryIds && { factoryId: { in: factoryIds } })
          },
          include: includeFactoryInfo ? {
            factory: {
              select: { id: true, name: true, code: true, city: true }
            }
          } : false
        },
        ...(includeTargets && {
          strategicTarget: {
            include: {
              strategicGoal: {
                select: { id: true, title: true, code: true }
              }
            }
          }
        })
      }
    })

    // Data transformation - normalize edilmiş format
    const result = {
      kpis: kpis.map(kpi => ({
        id: kpi.id,
        number: kpi.number,
        name: kpi.name,
        description: kpi.description,
        unit: kpi.unit,
        targetValue: kpi.targetValue,
        themes: kpi.themes?.split(',').map(t => t.trim()).filter(Boolean) || [],
        strategicGoal: kpi.strategicTarget?.strategicGoal || null,
        strategicTarget: kpi.strategicTarget || null
      })),
      kpiValues: kpis.flatMap(kpi => 
        kpi.kpiValues.map(value => ({
          id: value.id,
          kpiId: kpi.id,
          kpiNumber: kpi.number,
          value: value.value,
          period: value.period,
          factoryId: value.factoryId,
          factory: value.factory || null,
          targetValue: kpi.targetValue,
          createdAt: value.createdAt,
          updatedAt: value.updatedAt
        }))
      ),
      metadata: {
        totalKPIs: kpis.length,
        totalValues: kpis.reduce((sum, kpi) => sum + kpi.kpiValues.length, 0),
        periods,
        factoryIds: factoryIds || [],
        loadedAt: new Date().toISOString()
      }
    }

    // Cache'e kaydet (5 dakika)
    await CacheUtils.set(cacheKey, result, 300)
    
    return result
  }

  /**
   * Factory bilgilerini optimize edilmiş şekilde yükle
   */
  async loadFactoryInfo(factoryIds?: string[]) {
    const cacheKey = CacheUtils.createKey('factory_info', { factoryIds: factoryIds || 'all' })
    const cached = await CacheUtils.get(cacheKey)
    if (cached) return cached

    const where = factoryIds ? { id: { in: factoryIds } } : {}
    
    const factories = await prisma.modelFactory.findMany({
      where,
      select: {
        id: true,
        name: true,
        code: true,
        city: true,
        region: true,
        isActive: true
      }
    })

    const result = {
      factories,
      factoryMap: Object.fromEntries(factories.map(f => [f.id, f])),
      count: factories.length
    }

    // Cache'e kaydet (10 dakika)
    await CacheUtils.set(cacheKey, result, 600)
    
    return result
  }

  /**
   * Aggregate queries - multiple API calls için optimize
   */
  async loadAggregateData(options: {
    periods: string[]
    factoryIds?: string[]
    userRole: string
  }) {
    const cacheKey = CacheUtils.createKey('aggregate_data', options)
    const cached = await CacheUtils.get(cacheKey)
    if (cached) return cached

    const { periods, factoryIds, userRole } = options

    // Paralel sorgular
    const [kpiData, factoryInfo, actionCount] = await Promise.all([
      this.loadKPIData({ periods, factoryIds, includeFactoryInfo: true, includeTargets: true }),
      userRole !== 'MODEL_FACTORY' ? this.loadFactoryInfo(factoryIds) : null,
      this.loadActionCount()
    ])

    const result = {
      kpiData,
      factoryInfo,
      actionCount,
      metadata: {
        userRole,
        periods,
        factoryIds: factoryIds || [],
        loadedAt: new Date().toISOString()
      }
    }

    // Cache'e kaydet (3 dakika)
    await CacheUtils.set(cacheKey, result, 180)
    
    return result
  }

  /**
   * Action count cache
   */
  private async loadActionCount() {
    const cacheKey = 'action_count'
    const cached = await CacheUtils.get<number>(cacheKey)
    if (cached !== null) return cached

    const count = await prisma.action.count()
    await CacheUtils.set(cacheKey, count, 600) // 10 dakika cache
    return count
  }

  /**
   * Period-based data loader
   */
  async loadPeriodData(periods: string[], factoryIds?: string[]) {
    const cacheKey = CacheUtils.createKey('period_data', { periods, factoryIds: factoryIds || 'all' })
    const cached = await CacheUtils.get(cacheKey)
    if (cached) return cached

    // Batch query - tek sorguda tüm dönemler
    const whereClause: any = {
      period: { in: periods }
    }
    if (factoryIds) {
      whereClause.factoryId = { in: factoryIds }
    }

    const kpiValues = await prisma.kpiValue.findMany({
      where: whereClause,
      include: {
        kpi: {
          select: {
            id: true,
            number: true,
            targetValue: true,
            themes: true
          }
        },
        factory: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { period: 'desc' },
        { kpi: { number: 'asc' } }
      ]
    })

    // Period bazında gruplandırma
    const periodGroups = kpiValues.reduce((groups, value) => {
      if (!groups[value.period]) {
        groups[value.period] = []
      }
      groups[value.period].push(value)
      return groups
    }, {} as Record<string, typeof kpiValues>)

    const result = {
      raw: kpiValues,
      byPeriod: periodGroups,
      metadata: {
        totalValues: kpiValues.length,
        periods: Object.keys(periodGroups).sort(),
        uniqueKPIs: new Set(kpiValues.map(v => v.kpiId)).size,
        uniqueFactories: new Set(kpiValues.map(v => v.factoryId)).size
      }
    }

    // Cache'e kaydet (5 dakika)
    await CacheUtils.set(cacheKey, result, 300)
    
    return result
  }
}

/**
 * Batch data processor
 */
export class BatchProcessor {
  /**
   * KPI hesaplamalarını batch olarak işle
   */
  static async processPeriodCalculations(
    kpiValues: any[],
    options: {
      batchSize?: number
      calculateAchievementRates?: boolean
    } = {}
  ) {
    const { batchSize = 1000, calculateAchievementRates = true } = options
    const results = []

    // Batch'lere böl
    for (let i = 0; i < kpiValues.length; i += batchSize) {
      const batch = kpiValues.slice(i, i + batchSize)
      
      const processedBatch = batch.map(value => {
        const result: any = {
          id: value.id,
          kpiId: value.kpiId,
          value: value.value,
          period: value.period,
          factoryId: value.factoryId
        }

        if (calculateAchievementRates && value.kpi?.targetValue) {
          result.achievementRate = Math.min(100, (value.value / value.kpi.targetValue) * 100)
        }

        return result
      })

      results.push(...processedBatch)
    }

    return results
  }

  /**
   * Theme calculations batch processing
   */
  static processThemeCalculations(kpiValues: any[]) {
    const themeGroups: Record<string, any[]> = {}

    kpiValues.forEach(value => {
      if (value.kpi?.themes) {
        const themes = value.kpi.themes.split(',').map((t: string) => t.trim()).filter(Boolean)
        
        themes.forEach((theme: string) => {
          if (!themeGroups[theme]) {
            themeGroups[theme] = []
          }
          themeGroups[theme].push(value)
        })
      }
    })

    return themeGroups
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private static timers = new Map<string, number>()

  static start(label: string): void {
    this.timers.set(label, Date.now())
  }

  static end(label: string): number {
    const start = this.timers.get(label)
    if (!start) return 0
    
    const duration = Date.now() - start
    this.timers.delete(label)
    
    console.log(`⚡ Performance [${label}]: ${duration}ms`)
    return duration
  }

  static async measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
    this.start(label)
    try {
      const result = await fn()
      this.end(label)
      return result
    } catch (error) {
      this.end(label)
      throw error
    }
  }
}

/**
 * Database connection optimization
 */
export class DatabaseOptimizer {
  /**
   * Connection pool monitoring
   */
  static async getConnectionStats() {
    // Prisma connection pool bilgileri
    // Production'da pg_stat_activity sorguları eklenebilir
    return {
      activeConnections: 'Not implemented',
      totalConnections: 'Not implemented',
      idleConnections: 'Not implemented'
    }
  }

  /**
   * Query analysis
   */
  static analyzeQuery(query: string) {
    // Query analysis implementation
    // EXPLAIN ANALYZE sonuçları burada işlenebilir
    return {
      estimatedCost: 'Not implemented',
      estimatedRows: 'Not implemented',
      indexes: 'Not implemented'
    }
  }
}
