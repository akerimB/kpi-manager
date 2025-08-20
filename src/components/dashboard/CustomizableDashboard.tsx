'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Responsive, WidthProvider, Layout } from 'react-grid-layout'
import { DashboardManager, WidgetConfig, WidgetType, WIDGET_TEMPLATES, DashboardLayout } from '@/lib/dashboard-widgets'
import DashboardWidget from './DashboardWidget'
import WidgetGallery from './WidgetGallery'
import { Button } from '@/components/ui/button'
import { Plus, Edit3, Save, X, Grid } from 'lucide-react'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const ResponsiveGridLayout = WidthProvider(Responsive)

interface CustomizableDashboardProps {
  userId: string
  userRole: string
}

export default function CustomizableDashboard({ userId, userRole }: CustomizableDashboardProps) {
  const [dashboard, setDashboard] = useState<DashboardLayout | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showWidgetGallery, setShowWidgetGallery] = useState(false)
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({})
  
  const dashboardManager = DashboardManager.getInstance()

  useEffect(() => {
    loadDashboard()
  }, [userId, userRole])

  const loadDashboard = () => {
    let existingDashboard = dashboardManager.getLayoutByUser(userId)
    
    if (!existingDashboard) {
      existingDashboard = dashboardManager.createDefaultLayout(userId, userRole)
    }
    
    setDashboard(existingDashboard)
    
    // Convert widgets to grid layout format
    const gridLayouts = {
      lg: existingDashboard.widgets.map(widget => ({
        i: widget.id,
        x: widget.position.x,
        y: widget.position.y,
        w: widget.size.width,
        h: widget.size.height,
        minW: WIDGET_TEMPLATES[widget.type]?.minSize.width || 1,
        minH: WIDGET_TEMPLATES[widget.type]?.minSize.height || 1,
        maxW: WIDGET_TEMPLATES[widget.type]?.maxSize.width || 12,
        maxH: WIDGET_TEMPLATES[widget.type]?.maxSize.height || 8
      }))
    }
    
    setLayouts(gridLayouts)
  }

  const handleLayoutChange = useCallback((layout: Layout[], layouts: { [key: string]: Layout[] }) => {
    if (!dashboard || !isEditing) return

    setLayouts(layouts)

    // Update widget positions in dashboard
    const updatedWidgets = dashboard.widgets.map(widget => {
      const layoutItem = layout.find(item => item.i === widget.id)
      if (layoutItem) {
        return {
          ...widget,
          position: { x: layoutItem.x, y: layoutItem.y },
          size: { width: layoutItem.w, height: layoutItem.h }
        }
      }
      return widget
    })

    setDashboard({
      ...dashboard,
      widgets: updatedWidgets
    })
  }, [dashboard, isEditing])

  const addWidget = (widgetType: WidgetType) => {
    if (!dashboard) return

    const template = WIDGET_TEMPLATES[widgetType]
    if (!template) return

    // Find available position
    const existingPositions = dashboard.widgets.map(w => ({ x: w.position.x, y: w.position.y, w: w.size.width, h: w.size.height }))
    let newX = 0
    let newY = 0

    // Simple placement algorithm - find first available slot
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x <= 12 - template.defaultSize.width; x++) {
        const wouldOverlap = existingPositions.some(pos => 
          !(x >= pos.x + pos.w || x + template.defaultSize.width <= pos.x || 
            y >= pos.y + pos.h || y + template.defaultSize.height <= pos.y)
        )
        
        if (!wouldOverlap) {
          newX = x
          newY = y
          break
        }
      }
      if (newX !== 0 || newY !== 0) break
    }

    const newWidget: WidgetConfig = {
      id: `widget-${Date.now()}`,
      type: widgetType,
      title: template.name,
      position: { x: newX, y: newY },
      size: template.defaultSize,
      settings: {},
      isVisible: true
    }

    dashboardManager.addWidget(dashboard.id, newWidget)
    loadDashboard()
    setShowWidgetGallery(false)
  }

  const removeWidget = (widgetId: string) => {
    if (!dashboard) return
    
    dashboardManager.removeWidget(dashboard.id, widgetId)
    loadDashboard()
  }

  const editWidget = (widget: WidgetConfig) => {
    // Open widget configuration modal
    console.log('Edit widget:', widget)
  }

  const saveDashboard = () => {
    if (!dashboard) return
    
    dashboardManager.saveLayout(dashboard)
    setIsEditing(false)
  }

  const cancelEditing = () => {
    setIsEditing(false)
    loadDashboard() // Reload to reset changes
  }

  if (!dashboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Dashboard Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-2">
          <Grid className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">{dashboard.name}</h2>
          <span className="text-sm text-gray-500">
            {dashboard.widgets.length} widgets
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowWidgetGallery(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Widget
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditing}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveDashboard}
              >
                <Save className="w-4 h-4 mr-1" />
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 className="w-4 h-4 mr-1" />
              Customize
            </Button>
          )}
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className={`${isEditing ? 'border-2 border-dashed border-blue-300 rounded-lg p-4' : ''}`}>
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          onLayoutChange={handleLayoutChange}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={60}
          isDraggable={isEditing}
          isResizable={isEditing}
          margin={[16, 16]}
          containerPadding={[0, 0]}
        >
          {dashboard.widgets
            .filter(widget => widget.isVisible)
            .map(widget => (
              <div key={widget.id} className="widget-container">
                <DashboardWidget
                  widget={widget}
                  onEdit={editWidget}
                  onRemove={removeWidget}
                  isEditing={isEditing}
                />
              </div>
            ))}
        </ResponsiveGridLayout>
      </div>

      {/* Widget Gallery Modal */}
      {showWidgetGallery && (
        <WidgetGallery
          userRole={userRole}
          onAddWidget={addWidget}
          onClose={() => setShowWidgetGallery(false)}
        />
      )}

      {/* Editing Instructions */}
      {isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Grid className="w-5 h-5 text-blue-600 mt-0.5" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Editing Mode</h3>
              <div className="mt-1 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Drag widgets to reposition them</li>
                  <li>Resize widgets by dragging the corners</li>
                  <li>Click the + button to add new widgets</li>
                  <li>Use the gear icon to configure widgets</li>
                  <li>Use the X icon to remove widgets</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom CSS for React Grid Layout */}
      <style jsx global>{`
        .react-grid-layout {
          position: relative;
        }
        
        .react-grid-item {
          transition: all 200ms ease;
          transition-property: left, top;
        }
        
        .react-grid-item.cssTransforms {
          transition-property: transform;
        }
        
        .react-grid-item > .react-resizable-handle {
          position: absolute;
          width: 20px;
          height: 20px;
          bottom: 0;
          right: 0;
          background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNiIgaGVpZ2h0PSI2IiB2aWV3Qm94PSIwIDAgNiA2IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZG90cyBmaWxsPSIjOTk5IiBkPSJtMTUgMTJjMC0xLjEwNS0uODk1LTItMi0ycy0yIC44OTUtMiAyIC44OTUgMiAyIDIgMi0uODk1IDItMnptMCA0YzAtMS4xMDUtLjg5NS0yLTItMnMtMiAuODk1LTIgMiAuODk1IDIgMiAyIDItLjg5NSAyLTJ6bTQtNGMwLTEuMTA1LS44OTUtMi0yLTJzLTIgLjg5NS0yIDIgLjg5NSAyIDIgMiAyLS44OTUgMi0yem0wIDRjMC0xLjEwNS0uODk1LTItMi0ycy0yIC44OTUtMiAyIC44OTUgMiAyIDIgMi0uODk1IDItMnoiLz4KPHN2Zz4=');
          background-position: bottom right;
          padding: 0 3px 3px 0;
          background-repeat: no-repeat;
          background-origin: content-box;
          box-sizing: border-box;
          cursor: se-resize;
        }
        
        .react-grid-item.react-grid-placeholder {
          background: rgb(59 130 246 / 0.1);
          border: 2px dashed rgb(59 130 246 / 0.4);
          opacity: 0.7;
          transition-duration: 100ms;
          z-index: 2;
          -webkit-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          -o-user-select: none;
          user-select: none;
        }
        
        .widget-container {
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  )
}
