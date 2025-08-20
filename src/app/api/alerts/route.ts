/**
 * Alert Management API
 * Manage alert rules and active alerts
 */

import { NextRequest, NextResponse } from 'next/server'
import { AlertEngine } from '@/lib/alert-engine'

const alertEngine = AlertEngine.getInstance()

/**
 * GET - Get active alerts and rules
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type') || 'alerts'

    switch (type) {
      case 'alerts':
        const alerts = alertEngine.getActiveAlerts()
        return NextResponse.json({
          success: true,
          alerts,
          count: alerts.length
        })

      case 'rules':
        const rules = alertEngine.getRules()
        return NextResponse.json({
          success: true,
          rules,
          count: rules.length
        })

      case 'summary':
        const activeAlerts = alertEngine.getActiveAlerts()
        const allRules = alertEngine.getRules()
        
        const summary = {
          activeAlerts: activeAlerts.length,
          criticalAlerts: activeAlerts.filter(a => a.priority === 'critical').length,
          highAlerts: activeAlerts.filter(a => a.priority === 'high').length,
          totalRules: allRules.length,
          activeRules: allRules.filter(r => r.isActive).length,
          recentAlerts: activeAlerts.slice(0, 5).map(alert => ({
            id: alert.id,
            title: alert.title,
            priority: alert.priority,
            triggeredAt: alert.triggeredAt,
            status: alert.status
          }))
        }

        return NextResponse.json({
          success: true,
          summary
        })

      default:
        return NextResponse.json(
          { error: 'Invalid type parameter' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Alerts API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create alert rule or trigger manual evaluation
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ruleId, rule } = body

    switch (action) {
      case 'create_rule':
        if (!rule) {
          return NextResponse.json(
            { error: 'Rule data required' },
            { status: 400 }
          )
        }

        alertEngine.addRule({
          ...rule,
          id: rule.id || `rule-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })

        return NextResponse.json({
          success: true,
          message: 'Alert rule created successfully'
        })

      case 'evaluate_rule':
        if (!ruleId) {
          return NextResponse.json(
            { error: 'Rule ID required' },
            { status: 400 }
          )
        }

        await alertEngine.evaluateRuleManually(ruleId)

        return NextResponse.json({
          success: true,
          message: 'Rule evaluation completed'
        })

      case 'test_alert':
        // For testing purposes - trigger a sample alert
        const testRule = {
          id: 'test-rule',
          name: 'Test Alert Rule',
          description: 'Test alert for system verification',
          isActive: true,
          priority: 'medium' as const,
          conditions: [
            {
              type: 'threshold' as const,
              operator: '<' as const,
              value: 75,
              comparison: 'percentage' as const
            }
          ],
          actions: [
            { type: 'email', enabled: true, settings: {} },
            { type: 'dashboard', enabled: true, settings: {} }
          ],
          cooldownMinutes: 5,
          targetUsers: [],
          targetRoles: ['ADMIN'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }

        alertEngine.addRule(testRule)
        await alertEngine.evaluateRuleManually('test-rule')

        return NextResponse.json({
          success: true,
          message: 'Test alert triggered'
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Alert creation error:', error)
    return NextResponse.json(
      { error: 'Failed to process alert request' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update alert status (acknowledge, resolve)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, action, userId } = body

    if (!alertId || !action) {
      return NextResponse.json(
        { error: 'Alert ID and action required' },
        { status: 400 }
      )
    }

    let success = false

    switch (action) {
      case 'acknowledge':
        success = alertEngine.acknowledgeAlert(alertId, userId || 'system')
        break

      case 'resolve':
        success = alertEngine.resolveAlert(alertId, userId || 'system')
        break

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Alert ${action}d successfully`
      })
    } else {
      return NextResponse.json(
        { error: 'Alert not found or action failed' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Alert update error:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}
