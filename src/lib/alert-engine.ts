/**
 * Alert Engine System
 * Smart notifications for critical KPI events
 */

import nodemailer from 'nodemailer'
import twilio from 'twilio'
import { prisma } from './prisma'
import { AdvancedAnalyticsEngine } from './advanced-analytics'

export interface AlertRule {
  id: string
  name: string
  description: string
  isActive: boolean
  priority: 'low' | 'medium' | 'high' | 'critical'
  conditions: AlertCondition[]
  actions: AlertAction[]
  cooldownMinutes: number
  targetUsers: string[]
  targetRoles: string[]
  factoryFilter?: string[]
  kpiFilter?: string[]
  createdAt: string
  updatedAt: string
  lastTriggered?: string
}

export interface AlertCondition {
  type: 'threshold' | 'trend' | 'anomaly' | 'target_miss' | 'no_data'
  kpiId?: string
  operator?: '<' | '>' | '=' | '<=' | '>='
  value?: number
  duration?: number // minutes
  comparison?: 'absolute' | 'percentage' | 'trend'
  trendDirection?: 'increasing' | 'decreasing'
  anomalySeverity?: 'medium' | 'high' | 'critical'
}

export interface AlertAction {
  type: 'email' | 'sms' | 'push' | 'webhook' | 'dashboard'
  enabled: boolean
  settings: Record<string, any>
}

export interface Alert {
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
    threshold?: number
    deviation?: number
    period?: string
  }
  actions: AlertActionResult[]
}

export interface AlertActionResult {
  type: string
  status: 'pending' | 'sent' | 'failed' | 'skipped'
  sentAt?: string
  error?: string
  details?: Record<string, any>
}

/**
 * Alert Engine
 */
export class AlertEngine {
  private static instance: AlertEngine
  private rules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private emailTransporter: any = null
  private twilioClient: any = null

  static getInstance(): AlertEngine {
    if (!AlertEngine.instance) {
      AlertEngine.instance = new AlertEngine()
    }
    return AlertEngine.instance
  }

  constructor() {
    this.initializeNotificationServices()
    this.loadDefaultRules()
    this.startMonitoring()
  }

  /**
   * Initialize notification services
   */
  private initializeNotificationServices(): void {
    // Email setup
    if (process.env.SMTP_HOST) {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      })
    }

    // SMS setup
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )
    }
  }

  /**
   * Load default alert rules
   */
  private loadDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'critical-kpi-threshold',
        name: 'Critical KPI Threshold',
        description: 'Alert when KPI falls below critical threshold',
        isActive: true,
        priority: 'critical',
        conditions: [
          {
            type: 'threshold',
            operator: '<',
            value: 50,
            comparison: 'percentage'
          }
        ],
        actions: [
          { type: 'email', enabled: true, settings: {} },
          { type: 'sms', enabled: true, settings: {} },
          { type: 'dashboard', enabled: true, settings: {} }
        ],
        cooldownMinutes: 60,
        targetUsers: [],
        targetRoles: ['UPPER_MANAGEMENT', 'ADMIN'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'anomaly-detection',
        name: 'Anomaly Detection',
        description: 'Alert on statistical anomalies in KPI data',
        isActive: true,
        priority: 'high',
        conditions: [
          {
            type: 'anomaly',
            anomalySeverity: 'high'
          }
        ],
        actions: [
          { type: 'email', enabled: true, settings: {} },
          { type: 'dashboard', enabled: true, settings: {} }
        ],
        cooldownMinutes: 30,
        targetUsers: [],
        targetRoles: ['UPPER_MANAGEMENT', 'MODEL_FACTORY'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'target-miss',
        name: 'Target Miss Alert',
        description: 'Alert when KPI consistently misses target',
        isActive: true,
        priority: 'medium',
        conditions: [
          {
            type: 'target_miss',
            duration: 60, // 1 hour
            value: 80 // 80% of target
          }
        ],
        actions: [
          { type: 'email', enabled: true, settings: {} },
          { type: 'dashboard', enabled: true, settings: {} }
        ],
        cooldownMinutes: 120,
        targetUsers: [],
        targetRoles: ['MODEL_FACTORY'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'negative-trend',
        name: 'Negative Trend Alert',
        description: 'Alert on persistent negative trends',
        isActive: true,
        priority: 'medium',
        conditions: [
          {
            type: 'trend',
            trendDirection: 'decreasing',
            duration: 30 // 30 minutes of data
          }
        ],
        actions: [
          { type: 'email', enabled: true, settings: {} },
          { type: 'dashboard', enabled: true, settings: {} }
        ],
        cooldownMinutes: 180,
        targetUsers: [],
        targetRoles: ['UPPER_MANAGEMENT', 'MODEL_FACTORY'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]

    defaultRules.forEach(rule => {
      this.rules.set(rule.id, rule)
    })
  }

  /**
   * Start monitoring system
   */
  private startMonitoring(): void {
    // Check every 5 minutes
    setInterval(() => {
      this.evaluateRules()
    }, 5 * 60 * 1000)

    console.log('🚨 Alert Engine monitoring started')
  }

  /**
   * Evaluate all active rules
   */
  async evaluateRules(): Promise<void> {
    const activeRules = Array.from(this.rules.values()).filter(rule => rule.isActive)

    for (const rule of activeRules) {
      try {
        await this.evaluateRule(rule)
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error)
      }
    }
  }

  /**
   * Evaluate single rule
   */
  private async evaluateRule(rule: AlertRule): Promise<void> {
    // Check cooldown
    if (rule.lastTriggered) {
      const lastTriggered = new Date(rule.lastTriggered).getTime()
      const cooldownEnd = lastTriggered + (rule.cooldownMinutes * 60 * 1000)
      if (Date.now() < cooldownEnd) {
        return // Still in cooldown
      }
    }

    // Get relevant KPI data
    const kpiData = await this.getKPIDataForEvaluation(rule)

    for (const kpiRecord of kpiData) {
      const shouldTrigger = await this.evaluateConditions(rule.conditions, kpiRecord)
      
      if (shouldTrigger) {
        await this.triggerAlert(rule, kpiRecord)
        // Update last triggered time
        rule.lastTriggered = new Date().toISOString()
        break // Only trigger once per rule evaluation
      }
    }
  }

  /**
   * Get KPI data for rule evaluation
   */
  private async getKPIDataForEvaluation(rule: AlertRule): Promise<any[]> {
    const whereClause: any = {}
    
    if (rule.kpiFilter) {
      whereClause.kpiId = { in: rule.kpiFilter }
    }
    
    if (rule.factoryFilter) {
      whereClause.factoryId = { in: rule.factoryFilter }
    }

    // Get recent KPI values (last 24 hours)
    const recentData = await prisma.kpiValue.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        kpi: {
          select: { id: true, name: true, number: true, targetValue: true }
        },
        factory: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return recentData
  }

  /**
   * Evaluate conditions for a KPI record
   */
  private async evaluateConditions(conditions: AlertCondition[], kpiRecord: any): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, kpiRecord)
      if (result) return true // Any condition match triggers alert
    }
    return false
  }

  /**
   * Evaluate single condition
   */
  private async evaluateCondition(condition: AlertCondition, kpiRecord: any): Promise<boolean> {
    switch (condition.type) {
      case 'threshold':
        return this.evaluateThresholdCondition(condition, kpiRecord)
      
      case 'anomaly':
        return await this.evaluateAnomalyCondition(condition, kpiRecord)
      
      case 'target_miss':
        return this.evaluateTargetMissCondition(condition, kpiRecord)
      
      case 'trend':
        return await this.evaluateTrendCondition(condition, kpiRecord)
      
      case 'no_data':
        return this.evaluateNoDataCondition(condition, kpiRecord)
      
      default:
        return false
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThresholdCondition(condition: AlertCondition, kpiRecord: any): boolean {
    if (!condition.value || !condition.operator) return false

    const { value, operator } = condition
    let compareValue = kpiRecord.value

    if (condition.comparison === 'percentage' && kpiRecord.kpi.targetValue) {
      compareValue = (kpiRecord.value / kpiRecord.kpi.targetValue) * 100
    }

    switch (operator) {
      case '<': return compareValue < value
      case '>': return compareValue > value
      case '<=': return compareValue <= value
      case '>=': return compareValue >= value
      case '=': return Math.abs(compareValue - value) < 0.01
      default: return false
    }
  }

  /**
   * Evaluate anomaly condition
   */
  private async evaluateAnomalyCondition(condition: AlertCondition, kpiRecord: any): Promise<boolean> {
    // Get historical data for anomaly detection
    const historicalData = await prisma.kpiValue.findMany({
      where: {
        kpiId: kpiRecord.kpiId,
        factoryId: kpiRecord.factoryId,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        }
      },
      orderBy: { period: 'asc' }
    })

    if (historicalData.length < 10) return false // Not enough data

    const timeSeriesData = historicalData.map(d => ({
      period: d.period,
      value: d.value
    }))

    const anomalies = AdvancedAnalyticsEngine.detectAnomalies(timeSeriesData)
    
    // Check if current value is an anomaly of required severity
    const currentAnomaly = anomalies.anomalies.find(a => 
      a.period === kpiRecord.period && 
      a.severity === condition.anomalySeverity
    )

    return !!currentAnomaly
  }

  /**
   * Evaluate target miss condition
   */
  private evaluateTargetMissCondition(condition: AlertCondition, kpiRecord: any): boolean {
    if (!kpiRecord.kpi.targetValue || !condition.value) return false

    const achievementRate = (kpiRecord.value / kpiRecord.kpi.targetValue) * 100
    return achievementRate < condition.value
  }

  /**
   * Evaluate trend condition
   */
  private async evaluateTrendCondition(condition: AlertCondition, kpiRecord: any): Promise<boolean> {
    // Get recent data for trend analysis
    const recentData = await prisma.kpiValue.findMany({
      where: {
        kpiId: kpiRecord.kpiId,
        factoryId: kpiRecord.factoryId,
        createdAt: {
          gte: new Date(Date.now() - (condition.duration || 30) * 60 * 1000)
        }
      },
      orderBy: { period: 'asc' }
    })

    if (recentData.length < 3) return false

    const timeSeriesData = recentData.map(d => ({
      period: d.period,
      value: d.value
    }))

    const trend = AdvancedAnalyticsEngine.analyzeTrend(timeSeriesData)
    
    return trend.direction === condition.trendDirection && trend.strength !== 'weak'
  }

  /**
   * Evaluate no data condition
   */
  private evaluateNoDataCondition(condition: AlertCondition, kpiRecord: any): boolean {
    const timeSinceLastUpdate = Date.now() - new Date(kpiRecord.createdAt).getTime()
    const thresholdMs = (condition.duration || 60) * 60 * 1000
    
    return timeSinceLastUpdate > thresholdMs
  }

  /**
   * Trigger alert
   */
  private async triggerAlert(rule: AlertRule, kpiRecord: any): Promise<void> {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      title: this.generateAlertTitle(rule, kpiRecord),
      message: this.generateAlertMessage(rule, kpiRecord),
      priority: rule.priority,
      status: 'active',
      triggeredAt: new Date().toISOString(),
      data: {
        kpiId: kpiRecord.kpiId,
        kpiName: kpiRecord.kpi.name,
        factoryId: kpiRecord.factoryId,
        factoryName: kpiRecord.factory?.name,
        currentValue: kpiRecord.value,
        targetValue: kpiRecord.kpi.targetValue,
        period: kpiRecord.period
      },
      actions: []
    }

    // Execute alert actions
    for (const action of rule.actions) {
      if (action.enabled) {
        try {
          const result = await this.executeAction(action, alert, rule)
          alert.actions.push(result)
        } catch (error) {
          alert.actions.push({
            type: action.type,
            status: 'failed',
            error: String(error)
          })
        }
      }
    }

    // Store alert
    this.activeAlerts.set(alert.id, alert)
    
    console.log(`🚨 Alert triggered: ${alert.title}`)
  }

  /**
   * Execute alert action
   */
  private async executeAction(action: AlertAction, alert: Alert, rule: AlertRule): Promise<AlertActionResult> {
    switch (action.type) {
      case 'email':
        return await this.sendEmailAlert(alert, rule)
      
      case 'sms':
        return await this.sendSMSAlert(alert, rule)
      
      case 'dashboard':
        return this.sendDashboardAlert(alert, rule)
      
      case 'webhook':
        return await this.sendWebhookAlert(alert, rule, action.settings)
      
      default:
        return {
          type: action.type,
          status: 'skipped',
          error: 'Action type not implemented'
        }
    }
  }

  /**
   * Send email alert
   */
  private async sendEmailAlert(alert: Alert, rule: AlertRule): Promise<AlertActionResult> {
    if (!this.emailTransporter) {
      return {
        type: 'email',
        status: 'failed',
        error: 'Email service not configured'
      }
    }

    // Get recipient emails
    const recipients = await this.getRecipientEmails(rule.targetUsers, rule.targetRoles)
    
    if (recipients.length === 0) {
      return {
        type: 'email',
        status: 'skipped',
        error: 'No recipients found'
      }
    }

    const emailHTML = this.generateEmailHTML(alert)

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@kpi-manager.com',
        to: recipients.join(','),
        subject: `🚨 ${alert.priority.toUpperCase()}: ${alert.title}`,
        html: emailHTML
      })

      return {
        type: 'email',
        status: 'sent',
        sentAt: new Date().toISOString(),
        details: { recipients: recipients.length }
      }
    } catch (error) {
      return {
        type: 'email',
        status: 'failed',
        error: String(error)
      }
    }
  }

  /**
   * Send SMS alert
   */
  private async sendSMSAlert(alert: Alert, rule: AlertRule): Promise<AlertActionResult> {
    if (!this.twilioClient) {
      return {
        type: 'sms',
        status: 'failed',
        error: 'SMS service not configured'
      }
    }

    // Get recipient phone numbers
    const phoneNumbers = await this.getRecipientPhones(rule.targetUsers, rule.targetRoles)
    
    if (phoneNumbers.length === 0) {
      return {
        type: 'sms',
        status: 'skipped',
        error: 'No phone numbers found'
      }
    }

    const message = `🚨 KPI Alert: ${alert.title}\n${alert.message}`

    try {
      const promises = phoneNumbers.map(phone =>
        this.twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone
        })
      )

      await Promise.all(promises)

      return {
        type: 'sms',
        status: 'sent',
        sentAt: new Date().toISOString(),
        details: { recipients: phoneNumbers.length }
      }
    } catch (error) {
      return {
        type: 'sms',
        status: 'failed',
        error: String(error)
      }
    }
  }

  /**
   * Send dashboard alert (in-app notification)
   */
  private sendDashboardAlert(alert: Alert, rule: AlertRule): AlertActionResult {
    // This would integrate with the notification system
    // For now, we'll just log it
    console.log('📱 Dashboard alert:', alert.title)

    return {
      type: 'dashboard',
      status: 'sent',
      sentAt: new Date().toISOString()
    }
  }

  /**
   * Send webhook alert
   */
  private async sendWebhookAlert(alert: Alert, rule: AlertRule, settings: any): Promise<AlertActionResult> {
    if (!settings.url) {
      return {
        type: 'webhook',
        status: 'failed',
        error: 'Webhook URL not configured'
      }
    }

    try {
      const response = await fetch(settings.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.headers || {})
        },
        body: JSON.stringify({
          alert,
          rule: {
            id: rule.id,
            name: rule.name,
            priority: rule.priority
          },
          timestamp: new Date().toISOString()
        })
      })

      if (response.ok) {
        return {
          type: 'webhook',
          status: 'sent',
          sentAt: new Date().toISOString(),
          details: { statusCode: response.status }
        }
      } else {
        return {
          type: 'webhook',
          status: 'failed',
          error: `HTTP ${response.status}: ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        type: 'webhook',
        status: 'failed',
        error: String(error)
      }
    }
  }

  /**
   * Generate alert title
   */
  private generateAlertTitle(rule: AlertRule, kpiRecord: any): string {
    const kpiName = kpiRecord.kpi.name
    const factoryName = kpiRecord.factory?.name || 'Unknown Factory'
    
    return `${kpiName} Alert - ${factoryName}`
  }

  /**
   * Generate alert message
   */
  private generateAlertMessage(rule: AlertRule, kpiRecord: any): string {
    const kpiName = kpiRecord.kpi.name
    const currentValue = kpiRecord.value
    const targetValue = kpiRecord.kpi.targetValue
    const factoryName = kpiRecord.factory?.name || 'Unknown Factory'
    
    let message = `KPI "${kpiName}" in ${factoryName} requires attention.\n\n`
    message += `Current Value: ${currentValue}\n`
    
    if (targetValue) {
      const achievementRate = ((currentValue / targetValue) * 100).toFixed(1)
      message += `Target Value: ${targetValue}\n`
      message += `Achievement Rate: ${achievementRate}%\n`
    }
    
    message += `\nRule: ${rule.name}\n`
    message += `Priority: ${rule.priority.toUpperCase()}\n`
    message += `Time: ${new Date().toLocaleString()}`
    
    return message
  }

  /**
   * Generate email HTML
   */
  private generateEmailHTML(alert: Alert): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header { background: ${alert.priority === 'critical' ? '#dc2626' : alert.priority === 'high' ? '#ea580c' : '#d97706'}; color: white; padding: 20px; }
            .content { padding: 20px; }
            .kpi-data { background: #f9fafb; padding: 15px; border-radius: 4px; margin: 15px 0; }
            .footer { background: #f9fafb; padding: 15px; text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚨 KPI Alert</h1>
                <h2>${alert.title}</h2>
            </div>
            <div class="content">
                <p><strong>Priority:</strong> ${alert.priority.toUpperCase()}</p>
                <p><strong>Triggered:</strong> ${new Date(alert.triggeredAt).toLocaleString()}</p>
                
                <div class="kpi-data">
                    <h3>KPI Details</h3>
                    <p><strong>KPI:</strong> ${alert.data.kpiName}</p>
                    <p><strong>Factory:</strong> ${alert.data.factoryName}</p>
                    <p><strong>Current Value:</strong> ${alert.data.currentValue}</p>
                    ${alert.data.targetValue ? `<p><strong>Target Value:</strong> ${alert.data.targetValue}</p>` : ''}
                    <p><strong>Period:</strong> ${alert.data.period}</p>
                </div>
                
                <p>${alert.message}</p>
                
                <p><strong>Immediate Action Required:</strong> Please review the KPI performance and take necessary corrective measures.</p>
            </div>
            <div class="footer">
                <p>This is an automated alert from KPI Management System</p>
                <p>Do not reply to this email</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  /**
   * Get recipient emails
   */
  private async getRecipientEmails(userIds: string[], roles: string[]): Promise<string[]> {
    // This would query the user database
    // For demo purposes, return mock emails
    return ['admin@example.com', 'manager@example.com']
  }

  /**
   * Get recipient phone numbers
   */
  private async getRecipientPhones(userIds: string[], roles: string[]): Promise<string[]> {
    // This would query the user database
    // For demo purposes, return mock numbers
    return ['+1234567890']
  }

  /**
   * Public API methods
   */

  /**
   * Get active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.status === 'active')
      .sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime())
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) return false

    alert.status = 'acknowledged'
    alert.acknowledgedAt = new Date().toISOString()
    alert.acknowledgedBy = userId

    return true
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, userId: string): boolean {
    const alert = this.activeAlerts.get(alertId)
    if (!alert) return false

    alert.status = 'resolved'
    alert.resolvedAt = new Date().toISOString()

    return true
  }

  /**
   * Add custom rule
   */
  addRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule)
  }

  /**
   * Get rules
   */
  getRules(): AlertRule[] {
    return Array.from(this.rules.values())
  }

  /**
   * Manual rule evaluation (for testing)
   */
  async evaluateRuleManually(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId)
    if (rule) {
      await this.evaluateRule(rule)
    }
  }
}
