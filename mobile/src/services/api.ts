/**
 * API Service for KPI Manager Mobile App
 */

import * as SecureStore from 'expo-secure-store'

const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api'  // Development
  : 'https://your-domain.com/api' // Production

interface AuthTokens {
  accessToken: string
  refreshToken?: string
}

class APIService {
  private baseURL: string
  private accessToken: string | null = null

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
    this.loadTokens()
  }

  /**
   * Load authentication tokens from secure storage
   */
  private async loadTokens(): Promise<void> {
    try {
      const token = await SecureStore.getItemAsync('accessToken')
      if (token) {
        this.accessToken = token
      }
    } catch (error) {
      console.error('Failed to load tokens:', error)
    }
  }

  /**
   * Save authentication tokens to secure storage
   */
  private async saveTokens(tokens: AuthTokens): Promise<void> {
    try {
      await SecureStore.setItemAsync('accessToken', tokens.accessToken)
      if (tokens.refreshToken) {
        await SecureStore.setItemAsync('refreshToken', tokens.refreshToken)
      }
      this.accessToken = tokens.accessToken
    } catch (error) {
      console.error('Failed to save tokens:', error)
    }
  }

  /**
   * Clear authentication tokens
   */
  private async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync('accessToken')
      await SecureStore.deleteItemAsync('refreshToken')
      this.accessToken = null
    } catch (error) {
      console.error('Failed to clear tokens:', error)
    }
  }

  /**
   * Make authenticated API request
   */
  private async request(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, clear tokens
          await this.clearTokens()
          throw new Error('Authentication required')
        }
        
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error)
      throw error
    }
  }

  /**
   * Authentication
   */
  async login(email: string, password: string): Promise<any> {
    const response = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    if (response.accessToken) {
      await this.saveTokens({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      })
    }

    return response
  }

  async logout(): Promise<void> {
    await this.clearTokens()
  }

  /**
   * Dashboard data
   */
  async getDashboardData(): Promise<any> {
    return this.request('/analytics/overview')
  }

  /**
   * KPI data
   */
  async getKPIs(): Promise<any> {
    return this.request('/kpis')
  }

  async getKPIValues(kpiId: string, factoryId?: string): Promise<any> {
    const params = new URLSearchParams()
    if (factoryId) params.append('factoryId', factoryId)
    
    const query = params.toString()
    return this.request(`/kpis/${kpiId}/values${query ? `?${query}` : ''}`)
  }

  async submitKPIValue(data: {
    kpiId: string
    period: string
    value: number
    factoryId?: string
    evidences?: string[]
  }): Promise<any> {
    return this.request('/kpi-values', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * Analytics data
   */
  async getAnalyticsOverview(params: {
    factoryId?: string
    period?: string
    startDate?: string
    endDate?: string
  } = {}): Promise<any> {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value) query.append(key, value)
    })

    const queryString = query.toString()
    return this.request(`/analytics/overview${queryString ? `?${queryString}` : ''}`)
  }

  async getExecutiveSummary(): Promise<any> {
    return this.request('/analytics/executive-summary')
  }

  async getFactoryPerformance(factoryId?: string): Promise<any> {
    const params = factoryId ? `?factoryId=${factoryId}` : ''
    return this.request(`/analytics/factory-specific/performance-summary${params}`)
  }

  /**
   * ML Analytics
   */
  async generateForecast(data: {
    kpiId: string
    factoryId?: string
    periodsAhead?: number
    includeSeasonality?: boolean
  }): Promise<any> {
    return this.request('/ml?action=forecast', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getMLModels(): Promise<any> {
    return this.request('/ml?action=models')
  }

  /**
   * User profile
   */
  async getUserProfile(): Promise<any> {
    return this.request('/user/profile')
  }

  async updateUserProfile(data: any): Promise<any> {
    return this.request('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  /**
   * Notifications
   */
  async getNotifications(): Promise<any> {
    return this.request('/notifications')
  }

  async markNotificationRead(notificationId: string): Promise<any> {
    return this.request(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
  }

  /**
   * Real-time updates
   */
  async getRealtimeUpdates(): Promise<any> {
    return this.request('/realtime/updates')
  }

  /**
   * Utility methods
   */
  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  setBaseURL(url: string): void {
    this.baseURL = url
  }
}

// Export singleton instance
export const apiService = new APIService()
export default apiService
