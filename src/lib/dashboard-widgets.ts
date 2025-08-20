/**
 * Dashboard Widgets System
 * Drag & Drop customizable analytics widgets
 */

export interface WidgetConfig {
  id: string
  type: WidgetType
  title: string
  position: { x: number; y: number }
  size: { width: number; height: number }
  settings: Record<string, any>
  isVisible: boolean
  refreshInterval?: number // seconds
  lastUpdated?: string
  dataSource?: string
  filters?: Record<string, any>
}

export enum WidgetType {
  KPI_METRIC = 'kpi_metric',
  TREND_CHART = 'trend_chart',
  PERFORMANCE_GAUGE = 'performance_gauge',
  FACTORY_RANKING = 'factory_ranking',
  ALERT_LIST = 'alert_list',
  FORECAST_CHART = 'forecast_chart',
  CORRELATION_MATRIX = 'correlation_matrix',
  ANOMALY_DETECTOR = 'anomaly_detector',
  EXECUTIVE_SUMMARY = 'executive_summary',
  REAL_TIME_FEED = 'real_time_feed',
  THEME_BREAKDOWN = 'theme_breakdown',
  ACTION_TRACKER = 'action_tracker'
}

export interface WidgetTemplate {
  type: WidgetType
  name: string
  description: string
  defaultSize: { width: number; height: number }
  minSize: { width: number; height: number }
  maxSize: { width: number; height: number }
  category: 'overview' | 'performance' | 'trends' | 'alerts' | 'advanced'
  icon: string
  configurable: string[]
  requiredData: string[]
}

export interface DashboardLayout {
  id: string
  userId: string
  userRole: string
  name: string
  isDefault: boolean
  widgets: WidgetConfig[]
  gridSize: { columns: number; rows: number }
  createdAt: string
  updatedAt: string
}

/**
 * Widget Templates Registry
 */
export const WIDGET_TEMPLATES: Record<WidgetType, WidgetTemplate> = {
  [WidgetType.KPI_METRIC]: {
    type: WidgetType.KPI_METRIC,
    name: 'KPI Metric',
    description: 'Single KPI value with target comparison',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 1, height: 1 },
    maxSize: { width: 4, height: 3 },
    category: 'overview',
    icon: '📊',
    configurable: ['kpiId', 'factoryId', 'period', 'showTrend', 'showTarget'],
    requiredData: ['kpi_values']
  },
  [WidgetType.TREND_CHART]: {
    type: WidgetType.TREND_CHART,
    name: 'Trend Chart',
    description: 'Time series chart showing KPI trends',
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 4 },
    category: 'trends',
    icon: '📈',
    configurable: ['kpiIds', 'factoryIds', 'periods', 'chartType', 'showForecast'],
    requiredData: ['kpi_values', 'trend_analysis']
  },
  [WidgetType.PERFORMANCE_GAUGE]: {
    type: WidgetType.PERFORMANCE_GAUGE,
    name: 'Performance Gauge',
    description: 'Circular gauge showing achievement rate',
    defaultSize: { width: 2, height: 2 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 3, height: 3 },
    category: 'performance',
    icon: '🎯',
    configurable: ['kpiId', 'factoryId', 'thresholds', 'colors'],
    requiredData: ['kpi_values']
  },
  [WidgetType.FACTORY_RANKING]: {
    type: WidgetType.FACTORY_RANKING,
    name: 'Factory Ranking',
    description: 'Ranked list of factory performance',
    defaultSize: { width: 3, height: 4 },
    minSize: { width: 2, height: 3 },
    maxSize: { width: 4, height: 6 },
    category: 'performance',
    icon: '🏆',
    configurable: ['kpiIds', 'period', 'sortBy', 'showCount'],
    requiredData: ['factory_performance']
  },
  [WidgetType.ALERT_LIST]: {
    type: WidgetType.ALERT_LIST,
    name: 'Alert List',
    description: 'List of current alerts and anomalies',
    defaultSize: { width: 3, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 5 },
    category: 'alerts',
    icon: '🚨',
    configurable: ['severity', 'categories', 'maxItems'],
    requiredData: ['anomalies', 'notifications']
  },
  [WidgetType.FORECAST_CHART]: {
    type: WidgetType.FORECAST_CHART,
    name: 'Forecast Chart',
    description: 'Predictive chart with confidence intervals',
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 6, height: 4 },
    category: 'advanced',
    icon: '🔮',
    configurable: ['kpiId', 'factoryId', 'forecastPeriods', 'showConfidence'],
    requiredData: ['forecasting']
  },
  [WidgetType.CORRELATION_MATRIX]: {
    type: WidgetType.CORRELATION_MATRIX,
    name: 'Correlation Matrix',
    description: 'Heatmap showing KPI correlations',
    defaultSize: { width: 4, height: 4 },
    minSize: { width: 3, height: 3 },
    maxSize: { width: 6, height: 6 },
    category: 'advanced',
    icon: '🔗',
    configurable: ['kpiIds', 'factoryIds', 'threshold'],
    requiredData: ['correlation_analysis']
  },
  [WidgetType.ANOMALY_DETECTOR]: {
    type: WidgetType.ANOMALY_DETECTOR,
    name: 'Anomaly Detector',
    description: 'Real-time anomaly detection display',
    defaultSize: { width: 3, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 4 },
    category: 'alerts',
    icon: '⚠️',
    configurable: ['sensitivity', 'kpiIds', 'alertThreshold'],
    requiredData: ['anomaly_detection']
  },
  [WidgetType.EXECUTIVE_SUMMARY]: {
    type: WidgetType.EXECUTIVE_SUMMARY,
    name: 'Executive Summary',
    description: 'High-level overview for management',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 4, height: 2 },
    maxSize: { width: 8, height: 4 },
    category: 'overview',
    icon: '📋',
    configurable: ['period', 'metrics', 'showTrends'],
    requiredData: ['executive_summary']
  },
  [WidgetType.REAL_TIME_FEED]: {
    type: WidgetType.REAL_TIME_FEED,
    name: 'Real-time Feed',
    description: 'Live feed of KPI updates',
    defaultSize: { width: 3, height: 4 },
    minSize: { width: 2, height: 3 },
    maxSize: { width: 4, height: 6 },
    category: 'overview',
    icon: '🔄',
    configurable: ['maxItems', 'factoryFilter', 'kpiFilter'],
    requiredData: ['real_time_updates']
  },
  [WidgetType.THEME_BREAKDOWN]: {
    type: WidgetType.THEME_BREAKDOWN,
    name: 'Theme Breakdown',
    description: 'Performance breakdown by themes',
    defaultSize: { width: 3, height: 3 },
    minSize: { width: 2, height: 2 },
    maxSize: { width: 4, height: 4 },
    category: 'performance',
    icon: '🎨',
    configurable: ['themes', 'chartType', 'period'],
    requiredData: ['theme_analysis']
  },
  [WidgetType.ACTION_TRACKER]: {
    type: WidgetType.ACTION_TRACKER,
    name: 'Action Tracker',
    description: 'Track action items and completion',
    defaultSize: { width: 4, height: 3 },
    minSize: { width: 3, height: 2 },
    maxSize: { width: 5, height: 4 },
    category: 'overview',
    icon: '✅',
    configurable: ['status', 'priority', 'assignee'],
    requiredData: ['actions']
  }
}

/**
 * Dashboard Manager
 */
export class DashboardManager {
  private static instance: DashboardManager
  private layouts: Map<string, DashboardLayout> = new Map()
  
  static getInstance(): DashboardManager {
    if (!DashboardManager.instance) {
      DashboardManager.instance = new DashboardManager()
    }
    return DashboardManager.instance
  }

  /**
   * Create default layout for user role
   */
  createDefaultLayout(userId: string, userRole: string): DashboardLayout {
    const defaultWidgets: WidgetConfig[] = []

    switch (userRole) {
      case 'UPPER_MANAGEMENT':
        defaultWidgets.push(
          {
            id: 'exec-summary',
            type: WidgetType.EXECUTIVE_SUMMARY,
            title: 'Executive Summary',
            position: { x: 0, y: 0 },
            size: { width: 6, height: 3 },
            settings: { period: '2024-Q4' },
            isVisible: true
          },
          {
            id: 'factory-ranking',
            type: WidgetType.FACTORY_RANKING,
            title: 'Factory Performance',
            position: { x: 6, y: 0 },
            size: { width: 3, height: 4 },
            settings: { sortBy: 'performance' },
            isVisible: true
          },
          {
            id: 'trend-chart',
            type: WidgetType.TREND_CHART,
            title: 'Overall Trends',
            position: { x: 0, y: 3 },
            size: { width: 4, height: 3 },
            settings: { chartType: 'line', showForecast: true },
            isVisible: true
          },
          {
            id: 'alert-list',
            type: WidgetType.ALERT_LIST,
            title: 'Critical Alerts',
            position: { x: 4, y: 3 },
            size: { width: 2, height: 3 },
            settings: { severity: 'high' },
            isVisible: true
          }
        )
        break

      case 'MODEL_FACTORY':
        defaultWidgets.push(
          {
            id: 'performance-gauge',
            type: WidgetType.PERFORMANCE_GAUGE,
            title: 'Overall Performance',
            position: { x: 0, y: 0 },
            size: { width: 2, height: 2 },
            settings: {},
            isVisible: true
          },
          {
            id: 'trend-chart',
            type: WidgetType.TREND_CHART,
            title: 'KPI Trends',
            position: { x: 2, y: 0 },
            size: { width: 4, height: 3 },
            settings: { chartType: 'line' },
            isVisible: true
          },
          {
            id: 'theme-breakdown',
            type: WidgetType.THEME_BREAKDOWN,
            title: 'Theme Performance',
            position: { x: 0, y: 2 },
            size: { width: 3, height: 3 },
            settings: {},
            isVisible: true
          },
          {
            id: 'real-time-feed',
            type: WidgetType.REAL_TIME_FEED,
            title: 'Live Updates',
            position: { x: 6, y: 0 },
            size: { width: 2, height: 4 },
            settings: { maxItems: 10 },
            isVisible: true
          }
        )
        break
    }

    const layout: DashboardLayout = {
      id: `default-${userId}`,
      userId,
      userRole,
      name: 'Default Dashboard',
      isDefault: true,
      widgets: defaultWidgets,
      gridSize: { columns: 12, rows: 8 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    this.layouts.set(layout.id, layout)
    return layout
  }

  /**
   * Save layout
   */
  saveLayout(layout: DashboardLayout): void {
    layout.updatedAt = new Date().toISOString()
    this.layouts.set(layout.id, layout)
  }

  /**
   * Get layout by user
   */
  getLayoutByUser(userId: string): DashboardLayout | null {
    for (const layout of this.layouts.values()) {
      if (layout.userId === userId) {
        return layout
      }
    }
    return null
  }

  /**
   * Add widget to layout
   */
  addWidget(layoutId: string, widget: WidgetConfig): boolean {
    const layout = this.layouts.get(layoutId)
    if (!layout) return false

    layout.widgets.push(widget)
    layout.updatedAt = new Date().toISOString()
    return true
  }

  /**
   * Remove widget from layout
   */
  removeWidget(layoutId: string, widgetId: string): boolean {
    const layout = this.layouts.get(layoutId)
    if (!layout) return false

    layout.widgets = layout.widgets.filter(w => w.id !== widgetId)
    layout.updatedAt = new Date().toISOString()
    return true
  }

  /**
   * Update widget position/size
   */
  updateWidget(layoutId: string, widgetId: string, updates: Partial<WidgetConfig>): boolean {
    const layout = this.layouts.get(layoutId)
    if (!layout) return false

    const widget = layout.widgets.find(w => w.id === widgetId)
    if (!widget) return false

    Object.assign(widget, updates)
    layout.updatedAt = new Date().toISOString()
    return true
  }

  /**
   * Get available widgets for user role
   */
  getAvailableWidgets(userRole: string): WidgetTemplate[] {
    const templates = Object.values(WIDGET_TEMPLATES)
    
    // Filter based on user role
    if (userRole === 'MODEL_FACTORY') {
      return templates.filter(t => 
        t.type !== WidgetType.FACTORY_RANKING &&
        t.type !== WidgetType.EXECUTIVE_SUMMARY
      )
    }
    
    return templates
  }

  /**
   * Validate widget configuration
   */
  validateWidget(widget: WidgetConfig): { valid: boolean; errors: string[] } {
    const template = WIDGET_TEMPLATES[widget.type]
    if (!template) {
      return { valid: false, errors: ['Unknown widget type'] }
    }

    const errors: string[] = []

    // Size validation
    if (widget.size.width < template.minSize.width || widget.size.height < template.minSize.height) {
      errors.push(`Widget size too small. Minimum: ${template.minSize.width}x${template.minSize.height}`)
    }

    if (widget.size.width > template.maxSize.width || widget.size.height > template.maxSize.height) {
      errors.push(`Widget size too large. Maximum: ${template.maxSize.width}x${template.maxSize.height}`)
    }

    // Required settings validation
    for (const required of template.configurable) {
      if (required.includes('Id') && !widget.settings[required]) {
        errors.push(`Required setting missing: ${required}`)
      }
    }

    return { valid: errors.length === 0, errors }
  }
}

/**
 * Widget Data Provider
 */
export class WidgetDataProvider {
  private static cache = new Map<string, { data: any; expiry: number }>()

  /**
   * Get data for widget
   */
  static async getWidgetData(widget: WidgetConfig): Promise<any> {
    const cacheKey = `widget-${widget.id}-${JSON.stringify(widget.settings)}`
    const cached = this.cache.get(cacheKey)

    if (cached && Date.now() < cached.expiry) {
      return cached.data
    }

    let data: any

    try {
      switch (widget.type) {
        case WidgetType.KPI_METRIC:
          data = await this.fetchKPIMetric(widget.settings)
          break
        case WidgetType.TREND_CHART:
          data = await this.fetchTrendData(widget.settings)
          break
        case WidgetType.PERFORMANCE_GAUGE:
          data = await this.fetchPerformanceData(widget.settings)
          break
        case WidgetType.FACTORY_RANKING:
          data = await this.fetchFactoryRanking(widget.settings)
          break
        case WidgetType.ALERT_LIST:
          data = await this.fetchAlerts(widget.settings)
          break
        default:
          data = { error: 'Widget type not implemented' }
      }

      // Cache for 5 minutes
      this.cache.set(cacheKey, {
        data,
        expiry: Date.now() + (5 * 60 * 1000)
      })

      return data

    } catch (error) {
      return { error: 'Failed to fetch widget data', detail: String(error) }
    }
  }

  /**
   * Fetch KPI metric data
   */
  private static async fetchKPIMetric(settings: any): Promise<any> {
    // Implementation would call the actual API
    return {
      value: 75,
      target: 100,
      achievementRate: 75,
      trend: { direction: 'increasing', change: 5 },
      period: settings.period || '2024-Q4'
    }
  }

  /**
   * Fetch trend data
   */
  private static async fetchTrendData(settings: any): Promise<any> {
    // Implementation would call the trend analysis API
    return {
      periods: ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'],
      values: [65, 70, 72, 75],
      forecast: [78, 80, 82],
      trend: { direction: 'increasing', strength: 'moderate' }
    }
  }

  /**
   * Fetch performance data
   */
  private static async fetchPerformanceData(settings: any): Promise<any> {
    return {
      current: 75,
      target: 100,
      previous: 70,
      status: 'improving',
      color: 'green'
    }
  }

  /**
   * Fetch factory ranking
   */
  private static async fetchFactoryRanking(settings: any): Promise<any> {
    return {
      rankings: [
        { id: '1', name: 'Factory A', score: 85, rank: 1 },
        { id: '2', name: 'Factory B', score: 78, rank: 2 },
        { id: '3', name: 'Factory C', score: 72, rank: 3 }
      ]
    }
  }

  /**
   * Fetch alerts
   */
  private static async fetchAlerts(settings: any): Promise<any> {
    return {
      alerts: [
        {
          id: '1',
          severity: 'high',
          message: 'KPI 15 below threshold',
          timestamp: new Date().toISOString()
        }
      ]
    }
  }

  /**
   * Clear cache
   */
  static clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear()
      return
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
}
