'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  Bell, 
  CheckCircle, 
  Clock, 
  Mail, 
  MessageSquare, 
  Settings,
  RefreshCw,
  Plus,
  Eye,
  UserCheck,
  XCircle
} from 'lucide-react'

interface Alert {
  id: string
  ruleId: string
  ruleName: string
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed'
  triggeredAt: string
  acknowledgedAt?: string
  resolvedAt?: string
  acknowledgedBy?: string
  data: {
    kpiId?: string
    kpiName?: string
    factoryId?: string
    factoryName?: string
    currentValue?: number
    targetValue?: number
    period?: string
  }
  actions: Array<{
    type: string
    status: 'pending' | 'sent' | 'failed' | 'skipped'
    sentAt?: string
    error?: string
  }>
}

interface AlertRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  cooldownMinutes: number
  targetRoles: string[]
  lastTriggered?: string
}

export default function AlertDashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [rules, setRules] = useState<AlertRule[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'alerts' | 'rules' | 'settings'>('alerts')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [alertsRes, rulesRes, summaryRes] = await Promise.all([
        fetch('/api/alerts?type=alerts'),
        fetch('/api/alerts?type=rules'),
        fetch('/api/alerts?type=summary')
      ])

      const [alertsData, rulesData, summaryData] = await Promise.all([
        alertsRes.json(),
        rulesRes.json(),
        summaryRes.json()
      ])

      if (alertsData.success) setAlerts(alertsData.alerts)
      if (rulesData.success) setRules(rulesData.rules)
      if (summaryData.success) setSummary(summaryData.summary)
    } catch (error) {
      console.error('Failed to load alert data:', error)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'acknowledge',
          userId: 'current-user'
        })
      })

      if (response.ok) {
        loadData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to acknowledge alert:', error)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alertId,
          action: 'resolve',
          userId: 'current-user'
        })
      })

      if (response.ok) {
        loadData() // Refresh data
      }
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    }
  }

  const testAlert = async () => {
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_alert'
        })
      })

      if (response.ok) {
        setTimeout(loadData, 1000) // Refresh after a delay
      }
    } catch (error) {
      console.error('Failed to test alert:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800'
      case 'acknowledged': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertTriangle className="w-4 h-4" />
      case 'acknowledged': return <UserCheck className="w-4 h-4" />
      case 'resolved': return <CheckCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Alert Management</h1>
          <p className="text-gray-600">Monitor and manage KPI alerts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={testAlert}>
            <Bell className="w-4 h-4 mr-1" />
            Test Alert
          </Button>
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Alerts</p>
                  <p className="text-2xl font-bold text-gray-900">{summary.activeAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Critical</p>
                  <p className="text-2xl font-bold text-red-600">{summary.criticalAlerts}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">High Priority</p>
                  <p className="text-2xl font-bold text-orange-600">{summary.highAlerts}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Rules</p>
                  <p className="text-2xl font-bold text-blue-600">{summary.activeRules}</p>
                </div>
                <Settings className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'alerts', label: 'Active Alerts', icon: Bell },
            { id: 'rules', label: 'Alert Rules', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Alerts</h3>
                <p className="text-gray-600">All KPIs are within normal ranges</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id} className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getPriorityColor(alert.priority)}>
                          {alert.priority.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(alert.status)}>
                          {getStatusIcon(alert.status)}
                          <span className="ml-1">{alert.status.toUpperCase()}</span>
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{alert.title}</CardTitle>
                      <p className="text-sm text-gray-600">{alert.ruleName}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {alert.status === 'active' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Acknowledge
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => resolveAlert(alert.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Resolve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {/* Alert Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">KPI Information</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">KPI:</span> {alert.data.kpiName}</p>
                        <p><span className="font-medium">Factory:</span> {alert.data.factoryName}</p>
                        <p><span className="font-medium">Current Value:</span> {alert.data.currentValue}</p>
                        {alert.data.targetValue && (
                          <p><span className="font-medium">Target:</span> {alert.data.targetValue}</p>
                        )}
                        <p><span className="font-medium">Period:</span> {alert.data.period}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Alert Timeline</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Triggered:</span> {new Date(alert.triggeredAt).toLocaleString()}</p>
                        {alert.acknowledgedAt && (
                          <p><span className="font-medium">Acknowledged:</span> {new Date(alert.acknowledgedAt).toLocaleString()}</p>
                        )}
                        {alert.resolvedAt && (
                          <p><span className="font-medium">Resolved:</span> {new Date(alert.resolvedAt).toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Status */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Notification Status</h4>
                    <div className="flex items-center space-x-4">
                      {alert.actions.map((action, index) => (
                        <div key={index} className="flex items-center space-x-1">
                          {action.type === 'email' && <Mail className="w-4 h-4" />}
                          {action.type === 'sms' && <MessageSquare className="w-4 h-4" />}
                          {action.type === 'dashboard' && <Bell className="w-4 h-4" />}
                          <span className="text-sm">{action.type}</span>
                          <Badge 
                            className={`text-xs ${
                              action.status === 'sent' ? 'bg-green-100 text-green-800' :
                              action.status === 'failed' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {action.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Alert Rules</h2>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Add Rule
            </Button>
          </div>

          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{rule.name}</CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(rule.priority)}>
                      {rule.priority.toUpperCase()}
                    </Badge>
                    <Badge className={rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Target Roles:</span>
                    <p>{rule.targetRoles.join(', ')}</p>
                  </div>
                  <div>
                    <span className="font-medium">Cooldown:</span>
                    <p>{rule.cooldownMinutes} minutes</p>
                  </div>
                  <div>
                    <span className="font-medium">Last Triggered:</span>
                    <p>{rule.lastTriggered ? new Date(rule.lastTriggered).toLocaleString() : 'Never'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
