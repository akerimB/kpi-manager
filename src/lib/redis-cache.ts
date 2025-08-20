/**
 * Redis Cache Manager
 * Analytics ve KPI verileri için gelişmiş cache stratejisi
 */

import Redis from 'ioredis'

// Cache configuration
interface CacheConfig {
  enabled: boolean
  redis?: {
    host: string
    port: number
    password?: string
    db: number
    maxRetriesPerRequest: number
    retryDelayOnFailover: number
    connectTimeout: number
    commandTimeout: number
  }
  defaultTTL: number
  keyPrefix: string
  compression: boolean
  serialization: 'json' | 'msgpack'
}

// Cache entry metadata
interface CacheEntry<T = any> {
  data: T
  metadata: {
    key: string
    createdAt: number
    expiresAt: number
    version: string
    tags: string[]
    size?: number
    hitCount: number
    lastAccessed: number
  }
}

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  hitRate: number
  totalKeys: number
  memoryUsage: number
  lastReset: number
}

/**
 * Redis Cache Manager
 */
export class RedisCacheManager {
  private static instance: RedisCacheManager
  private redis: Redis | null = null
  private config: CacheConfig
  private stats: CacheStats
  private isConnected = false
  private memoryCache: Map<string, { data: any; expiry: number }> = new Map()

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      enabled: process.env.REDIS_ENABLED === 'true',
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
        db: parseInt(process.env.REDIS_DB || '0'),
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        connectTimeout: 10000,
        commandTimeout: 5000
      },
      defaultTTL: 300, // 5 minutes
      keyPrefix: 'kpi:',
      compression: true,
      serialization: 'json',
      ...config
    }

    this.stats = this.initializeStats()
    
    if (this.config.enabled) {
      this.connect()
    }
  }

  static getInstance(config?: Partial<CacheConfig>): RedisCacheManager {
    if (!RedisCacheManager.instance) {
      RedisCacheManager.instance = new RedisCacheManager(config)
    }
    return RedisCacheManager.instance
  }

  private initializeStats(): CacheStats {
    return {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0,
      totalKeys: 0,
      memoryUsage: 0,
      lastReset: Date.now()
    }
  }

  /**
   * Redis connection
   */
  private async connect(): Promise<void> {
    try {
      this.redis = new Redis({
        ...this.config.redis,
        lazyConnect: true,
        enableReadyCheck: true,
        showFriendlyErrorStack: true
      })

      this.redis.on('connect', () => {
        console.log('🔗 Redis connected')
        this.isConnected = true
      })

      this.redis.on('error', (error) => {
        console.error('❌ Redis error:', error)
        this.isConnected = false
      })

      this.redis.on('close', () => {
        console.log('💔 Redis connection closed')
        this.isConnected = false
      })

      await this.redis.connect()
      
    } catch (error) {
      console.error('Redis connection failed:', error)
      this.isConnected = false
    }
  }

  /**
   * Build cache key
   */
  private buildKey(key: string): string {
    return `${this.config.keyPrefix}${key}`
  }

  /**
   * Serialize data
   */
  private serialize(data: any): string {
    if (this.config.serialization === 'json') {
      return JSON.stringify(data)
    }
    // msgpack implementation would go here
    return JSON.stringify(data)
  }

  /**
   * Deserialize data
   */
  private deserialize<T>(data: string): T {
    if (this.config.serialization === 'json') {
      return JSON.parse(data)
    }
    // msgpack implementation would go here
    return JSON.parse(data)
  }

  /**
   * Get from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.config.enabled || !this.isConnected || !this.redis) {
      // Fallback to local memory cache
      return this.getFromMemory<T>(key)
    }

    try {
      const fullKey = this.buildKey(key)
      const data = await this.redis.get(fullKey)
      
      if (!data) {
        this.stats.misses++
        return null
      }

      const entry: CacheEntry<T> = this.deserialize(data)
      
      // Check expiration
      if (Date.now() > entry.metadata.expiresAt) {
        await this.delete(key)
        this.stats.misses++
        return null
      }

      // Update metadata
      entry.metadata.hitCount++
      entry.metadata.lastAccessed = Date.now()
      
      // Update in Redis (async, don't wait)
      this.redis.set(fullKey, this.serialize(entry), 'EX', Math.floor((entry.metadata.expiresAt - Date.now()) / 1000))
      
      this.stats.hits++
      this.updateHitRate()
      
      return entry.data

    } catch (error) {
      console.error('Redis get error:', error)
      this.stats.misses++
      
      // Fallback to local memory cache
      return this.getFromMemory<T>(key)
    }
  }

  /**
   * Set to cache
   */
  async set<T>(key: string, data: T, ttlSeconds?: number, tags?: string[]): Promise<boolean> {
    if (!this.config.enabled) {
      // Fallback to local memory cache
      this.setToMemory(key, data, ttlSeconds || this.config.defaultTTL)
      return true
    }

    try {
      const ttl = ttlSeconds || this.config.defaultTTL
      const now = Date.now()
      
      const entry: CacheEntry<T> = {
        data,
        metadata: {
          key,
          createdAt: now,
          expiresAt: now + (ttl * 1000),
          version: '1.0',
          tags: tags || [],
          hitCount: 0,
          lastAccessed: now
        }
      }

      const serialized = this.serialize(entry)
      entry.metadata.size = serialized.length

      if (this.isConnected && this.redis) {
        await this.redis.set(this.buildKey(key), serialized, 'EX', ttl)
      } else {
        // Fallback to local memory cache
        this.setToMemory(key, data, ttl)
      }

      this.stats.sets++
      return true

    } catch (error) {
      console.error('Redis set error:', error)
      
      // Fallback to local memory cache
      this.setToMemory(key, data, ttlSeconds || this.config.defaultTTL)
      return false
    }
  }

  /**
   * Delete from cache
   */
  async delete(key: string): Promise<boolean> {
    if (!this.config.enabled) {
      this.deleteFromMemory(key)
      return true
    }

    try {
      if (this.isConnected && this.redis) {
        const result = await this.redis.del(this.buildKey(key))
        this.stats.deletes++
        return result > 0
      } else {
        this.deleteFromMemory(key)
        return true
      }
    } catch (error) {
      console.error('Redis delete error:', error)
      return false
    }
  }

  /**
   * Delete by pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    if (!this.config.enabled || !this.isConnected || !this.redis) {
      return this.deletePatternFromMemory(pattern)
    }

    try {
      const fullPattern = this.buildKey(pattern)
      const keys = await this.redis.keys(fullPattern)
      
      if (keys.length === 0) {
        return 0
      }

      const result = await this.redis.del(...keys)
      this.stats.deletes += result
      return result

    } catch (error) {
      console.error('Redis delete pattern error:', error)
      return 0
    }
  }

  /**
   * Delete by tags
   */
  async deleteByTags(tags: string[]): Promise<number> {
    if (!this.config.enabled || !this.isConnected || !this.redis) {
      return 0
    }

    try {
      // This would require a tag index in a real implementation
      // For now, we'll scan all keys and check their tags
      const pattern = this.buildKey('*')
      const keys = await this.redis.keys(pattern)
      let deletedCount = 0

      for (const key of keys) {
        try {
          const data = await this.redis.get(key)
          if (data) {
            const entry: CacheEntry = this.deserialize(data)
            const hasTag = tags.some(tag => entry.metadata.tags.includes(tag))
            
            if (hasTag) {
              await this.redis.del(key)
              deletedCount++
            }
          }
        } catch (error) {
          // Skip invalid entries
        }
      }

      this.stats.deletes += deletedCount
      return deletedCount

    } catch (error) {
      console.error('Redis delete by tags error:', error)
      return 0
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    if (!this.config.enabled) {
      this.memoryCache.clear()
      return
    }

    try {
      if (this.isConnected && this.redis) {
        const pattern = this.buildKey('*')
        const keys = await this.redis.keys(pattern)
        
        if (keys.length > 0) {
          await this.redis.del(...keys)
        }
      }
      
      this.stats = this.initializeStats()
      this.memoryCache.clear()

    } catch (error) {
      console.error('Redis clear error:', error)
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    this.updateHitRate()
    
    if (this.isConnected && this.redis) {
      try {
        const info = await this.redis.info('memory')
        const memoryMatch = info.match(/used_memory:(\d+)/)
        if (memoryMatch) {
          this.stats.memoryUsage = parseInt(memoryMatch[1])
        }

        const pattern = this.buildKey('*')
        const keys = await this.redis.keys(pattern)
        this.stats.totalKeys = keys.length

      } catch (error) {
        console.error('Redis stats error:', error)
      }
    }

    return { ...this.stats }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<{ healthy: boolean; latency?: number; error?: string }> {
    if (!this.config.enabled) {
      return { healthy: true }
    }

    if (!this.isConnected || !this.redis) {
      return { healthy: false, error: 'Not connected' }
    }

    try {
      const start = Date.now()
      await this.redis.ping()
      const latency = Date.now() - start

      return { healthy: true, latency }

    } catch (error) {
      return { healthy: false, error: String(error) }
    }
  }

  /**
   * Local memory cache helpers
   */
  private getFromMemory<T>(key: string): T | null {
    const cached = this.memoryCache.get(key)
    if (!cached) return null
    
    if (Date.now() > cached.expiry) {
      this.memoryCache.delete(key)
      return null
    }
    
    return cached.data as T
  }

  private setToMemory(key: string, data: any, ttlSeconds: number): void {
    this.memoryCache.set(key, {
      data,
      expiry: Date.now() + (ttlSeconds * 1000)
    })
  }

  private deleteFromMemory(key: string): void {
    this.memoryCache.delete(key)
  }

  private deletePatternFromMemory(pattern: string): number {
    let count = 0
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    
    for (const [key] of this.memoryCache) {
      if (regex.test(key)) {
        this.memoryCache.delete(key)
        count++
      }
    }
    
    return count
  }

  /**
   * Update hit rate
   */
  private updateHitRate(): void {
    const totalRequests = this.stats.hits + this.stats.misses
    this.stats.hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0
  }

  /**
   * Close connection
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit()
      this.isConnected = false
    }
  }
}

/**
 * Cache decorators and utilities
 */
export class CacheDecorator {
  /**
   * Method caching decorator
   */
  static cache(ttlSeconds: number = 300, keyGenerator?: (args: any[]) => string) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value
      const cache = RedisCacheManager.getInstance()

      descriptor.value = async function (...args: any[]) {
        const cacheKey = keyGenerator 
          ? keyGenerator(args)
          : `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`

        // Try to get from cache
        const cached = await cache.get(cacheKey)
        if (cached !== null) {
          return cached
        }

        // Execute method and cache result
        const result = await method.apply(this, args)
        await cache.set(cacheKey, result, ttlSeconds)
        
        return result
      }

      return descriptor
    }
  }
}

/**
 * Specialized cache strategies for KPI analytics
 */
export class AnalyticsCache {
  private cache = RedisCacheManager.getInstance()

  /**
   * Cache KPI overview data
   */
  async cacheOverview(userRole: string, factoryIds: string[], periods: string[], data: any): Promise<void> {
    const key = `overview:${userRole}:${factoryIds.sort().join(',')}:${periods.sort().join(',')}`
    await this.cache.set(key, data, 300, ['analytics', 'overview', userRole]) // 5 minutes
  }

  async getOverview(userRole: string, factoryIds: string[], periods: string[]): Promise<any> {
    const key = `overview:${userRole}:${factoryIds.sort().join(',')}:${periods.sort().join(',')}`
    return await this.cache.get(key)
  }

  /**
   * Cache factory performance data
   */
  async cacheFactoryPerformance(factoryId: string, period: string, data: any): Promise<void> {
    const key = `factory:${factoryId}:${period}`
    await this.cache.set(key, data, 600, ['analytics', 'factory', factoryId]) // 10 minutes
  }

  async getFactoryPerformance(factoryId: string, period: string): Promise<any> {
    const key = `factory:${factoryId}:${period}`
    return await this.cache.get(key)
  }

  /**
   * Invalidate cache when KPI values are updated
   */
  async invalidateKPIUpdate(factoryId: string, period: string, kpiId: string): Promise<void> {
    // Invalidate all related caches
    await Promise.all([
      this.cache.deletePattern(`overview:*:*${factoryId}*:*${period}*`),
      this.cache.deletePattern(`factory:${factoryId}:${period}`),
      this.cache.deletePattern(`kpi:${kpiId}:*`),
      this.cache.deleteByTags(['analytics', factoryId, period])
    ])
  }

  /**
   * Warm up cache with common queries
   */
  async warmUp(): Promise<void> {
    console.log('🔥 Warming up analytics cache...')
    
    // This would be implemented with common query patterns
    // For now, just a placeholder
  }
}

// Export singleton instance
export const redisCache = RedisCacheManager.getInstance()
export const analyticsCache = new AnalyticsCache()
