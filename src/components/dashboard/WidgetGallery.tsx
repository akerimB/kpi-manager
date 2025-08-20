'use client'

import React from 'react'
import { WidgetType, WIDGET_TEMPLATES } from '@/lib/dashboard-widgets'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus } from 'lucide-react'

interface WidgetGalleryProps {
  userRole: string
  onAddWidget: (widgetType: WidgetType) => void
  onClose: () => void
}

export default function WidgetGallery({ userRole, onAddWidget, onClose }: WidgetGalleryProps) {
  const availableWidgets = Object.values(WIDGET_TEMPLATES).filter(template => {
    // Filter based on user role
    if (userRole === 'MODEL_FACTORY') {
      return template.type !== WidgetType.FACTORY_RANKING &&
             template.type !== WidgetType.EXECUTIVE_SUMMARY
    }
    return true
  })

  const categorizedWidgets = availableWidgets.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = []
    }
    acc[template.category].push(template)
    return acc
  }, {} as Record<string, typeof availableWidgets>)

  const categoryLabels = {
    overview: 'Overview',
    performance: 'Performance',
    trends: 'Trends & Analysis',
    alerts: 'Alerts & Monitoring',
    advanced: 'Advanced Analytics'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Widget Gallery</h2>
            <p className="text-sm text-gray-600">Choose widgets to add to your dashboard</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {Object.entries(categorizedWidgets).map(([category, widgets]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {widgets.map(widget => (
                  <WidgetCard
                    key={widget.type}
                    widget={widget}
                    onAdd={() => onAddWidget(widget.type)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface WidgetCardProps {
  widget: any
  onAdd: () => void
}

function WidgetCard({ widget, onAdd }: WidgetCardProps) {
  const renderPreview = () => {
    // Simple preview based on widget type
    switch (widget.type) {
      case WidgetType.KPI_METRIC:
        return (
          <div className="text-center p-4">
            <div className="text-2xl font-bold text-blue-600">85</div>
            <div className="text-sm text-gray-500">Target: 100</div>
            <div className="text-green-600 text-sm">85%</div>
          </div>
        )
      
      case WidgetType.TREND_CHART:
        return (
          <div className="p-4">
            <svg viewBox="0 0 100 40" className="w-full h-10">
              <polyline
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                points="0,30 20,25 40,20 60,15 80,10 100,5"
              />
            </svg>
          </div>
        )
      
      case WidgetType.PERFORMANCE_GAUGE:
        return (
          <div className="flex justify-center p-4">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-600 rounded-full"></div>
          </div>
        )
      
      case WidgetType.FACTORY_RANKING:
        return (
          <div className="p-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span>🥇 Factory A</span>
              <span>95</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>🥈 Factory B</span>
              <span>88</span>
            </div>
            <div className="flex justify-between text-xs">
              <span>🥉 Factory C</span>
              <span>82</span>
            </div>
          </div>
        )
      
      case WidgetType.ALERT_LIST:
        return (
          <div className="p-4 space-y-2">
            <div className="text-xs bg-red-50 text-red-700 p-2 rounded">
              🚨 Critical Alert
            </div>
            <div className="text-xs bg-yellow-50 text-yellow-700 p-2 rounded">
              ⚠️ Warning
            </div>
          </div>
        )
      
      default:
        return (
          <div className="flex items-center justify-center p-4 text-gray-400">
            <span className="text-2xl">{widget.icon}</span>
          </div>
        )
    }
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow group">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{widget.icon}</span>
            <div>
              <CardTitle className="text-sm">{widget.name}</CardTitle>
              <CardDescription className="text-xs">{widget.description}</CardDescription>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onAdd}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Widget Preview */}
        <div className="bg-gray-50 rounded border h-24 overflow-hidden">
          {renderPreview()}
        </div>
        
        {/* Widget Info */}
        <div className="mt-3 space-y-1">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Size:</span>
            <span>{widget.defaultSize.width}×{widget.defaultSize.height}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>Category:</span>
            <span className="capitalize">{widget.category}</span>
          </div>
        </div>
        
        {/* Add Button */}
        <Button
          className="w-full mt-3"
          size="sm"
          onClick={onAdd}
        >
          <Plus className="w-4 h-4 mr-1" />
          Add to Dashboard
        </Button>
      </CardContent>
    </Card>
  )
}
