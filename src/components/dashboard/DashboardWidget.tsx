'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WidgetConfig, WidgetType, WidgetDataProvider } from '@/lib/dashboard-widgets'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { AlertTriangle, TrendingUp, TrendingDown, Minus, MoreVertical, Settings, X } from 'lucide-react'

interface DashboardWidgetProps {
  widget: WidgetConfig
  onEdit?: (widget: WidgetConfig) => void
  onRemove?: (widgetId: string) => void
  isEditing?: boolean
}

export default function DashboardWidget({ widget, onEdit, onRemove, isEditing }: DashboardWidgetProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadWidgetData()
    
    // Auto-refresh if interval is set
    if (widget.refreshInterval) {
      const interval = setInterval(loadWidgetData, widget.refreshInterval * 1000)
      return () => clearInterval(interval)
    }
  }, [widget])

  const loadWidgetData = async () => {
    try {
      setLoading(true)
      const widgetData = await WidgetDataProvider.getWidgetData(widget)
      setData(widgetData)
      setError(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const renderWidgetContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full text-red-500">
          <AlertTriangle className="w-8 h-8 mr-2" />
          <span>Error loading data</span>
        </div>
      )
    }

    switch (widget.type) {
      case WidgetType.KPI_METRIC:
        return renderKPIMetric()
      case WidgetType.TREND_CHART:
        return renderTrendChart()
      case WidgetType.PERFORMANCE_GAUGE:
        return renderPerformanceGauge()
      case WidgetType.FACTORY_RANKING:
        return renderFactoryRanking()
      case WidgetType.ALERT_LIST:
        return renderAlertList()
      case WidgetType.THEME_BREAKDOWN:
        return renderThemeBreakdown()
      case WidgetType.REAL_TIME_FEED:
        return renderRealTimeFeed()
      default:
        return <div className="p-4 text-gray-500">Widget type not implemented</div>
    }
  }

  const renderKPIMetric = () => {
    if (!data) return null

    const { value, target, achievementRate, trend } = data
    const TrendIcon = trend?.direction === 'increasing' ? TrendingUp : 
                     trend?.direction === 'decreasing' ? TrendingDown : Minus

    return (
      <div className="p-4 text-center">
        <div className="text-3xl font-bold text-gray-900 mb-2">
          {value?.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600 mb-2">
          Target: {target?.toLocaleString()}
        </div>
        <div className={`text-lg font-semibold mb-2 ${
          achievementRate >= 100 ? 'text-green-600' : 
          achievementRate >= 80 ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {achievementRate}%
        </div>
        {trend && (
          <div className={`flex items-center justify-center text-sm ${
            trend.direction === 'increasing' ? 'text-green-600' : 
            trend.direction === 'decreasing' ? 'text-red-600' : 'text-gray-600'
          }`}>
            <TrendIcon className="w-4 h-4 mr-1" />
            <span>{Math.abs(trend.change)}%</span>
          </div>
        )}
      </div>
    )
  }

  const renderTrendChart = () => {
    if (!data || !data.periods) return null

    const chartData = data.periods.map((period: string, index: number) => ({
      period,
      value: data.values[index] || 0,
      forecast: data.forecast && data.forecast[index - data.values.length] || null
    }))

    return (
      <div className="p-2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} />
            {data.forecast && (
              <Line type="monotone" dataKey="forecast" stroke="#94a3b8" strokeDasharray="5 5" />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderPerformanceGauge = () => {
    if (!data) return null

    const { current, target, status } = data
    const percentage = target > 0 ? (current / target) * 100 : 0
    const radius = 50
    const circumference = 2 * Math.PI * radius
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`

    const getColor = () => {
      if (percentage >= 100) return '#10b981'
      if (percentage >= 80) return '#f59e0b'
      return '#ef4444'
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-32 h-32 transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke="#e5e7eb"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="64"
              cy="64"
              r={radius}
              stroke={getColor()}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold">{Math.round(percentage)}%</span>
          </div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold">{current}</div>
          <div className="text-sm text-gray-600">Target: {target}</div>
          <div className={`text-sm font-medium ${
            status === 'improving' ? 'text-green-600' : 
            status === 'declining' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {status}
          </div>
        </div>
      </div>
    )
  }

  const renderFactoryRanking = () => {
    if (!data || !data.rankings) return null

    return (
      <div className="p-4">
        <div className="space-y-3">
          {data.rankings.map((factory: any, index: number) => (
            <div key={factory.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold mr-3 ${
                  index === 0 ? 'bg-yellow-500 text-white' :
                  index === 1 ? 'bg-gray-400 text-white' :
                  index === 2 ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}>
                  {factory.rank}
                </div>
                <div>
                  <div className="font-medium">{factory.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">{factory.score}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderAlertList = () => {
    if (!data || !data.alerts) return null

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'critical': return 'text-red-600 bg-red-50'
        case 'high': return 'text-orange-600 bg-orange-50'
        case 'medium': return 'text-yellow-600 bg-yellow-50'
        default: return 'text-blue-600 bg-blue-50'
      }
    }

    return (
      <div className="p-4">
        <div className="space-y-2">
          {data.alerts.map((alert: any) => (
            <div key={alert.id} className={`p-3 rounded-lg ${getSeverityColor(alert.severity)}`}>
              <div className="flex items-start">
                <AlertTriangle className="w-4 h-4 mr-2 mt-0.5" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{alert.message}</div>
                  <div className="text-xs opacity-75">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderThemeBreakdown = () => {
    const themeData = [
      { name: 'LEAN', value: 75, color: '#3b82f6' },
      { name: 'ÇEVRE', value: 68, color: '#10b981' },
      { name: 'KALİTE', value: 82, color: '#f59e0b' },
      { name: 'DİJİTAL', value: 71, color: '#8b5cf6' }
    ]

    return (
      <div className="p-4 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={themeData}
              cx="50%"
              cy="50%"
              innerRadius={40}
              outerRadius={80}
              dataKey="value"
            >
              {themeData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderRealTimeFeed = () => {
    const feedItems = [
      { id: 1, message: 'KPI 15 updated: 78 → 82', time: '2 min ago', type: 'improvement' },
      { id: 2, message: 'Factory B target achieved', time: '5 min ago', type: 'success' },
      { id: 3, message: 'Alert: KPI 23 below threshold', time: '8 min ago', type: 'warning' }
    ]

    return (
      <div className="p-4">
        <div className="space-y-3">
          {feedItems.map((item) => (
            <div key={item.id} className="text-sm">
              <div className={`font-medium ${
                item.type === 'success' ? 'text-green-600' :
                item.type === 'warning' ? 'text-orange-600' :
                item.type === 'improvement' ? 'text-blue-600' : 'text-gray-600'
              }`}>
                {item.message}
              </div>
              <div className="text-xs text-gray-500">{item.time}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="h-full relative group">
      {isEditing && (
        <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit?.(widget)}
              className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRemove?.(widget.id)}
              className="p-1 bg-white rounded shadow-sm hover:bg-gray-50 text-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
      </CardHeader>
      
      <CardContent className="p-0 h-[calc(100%-60px)]">
        {renderWidgetContent()}
      </CardContent>
    </Card>
  )
}
