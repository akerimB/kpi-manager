import React, { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native'
import {
  Surface,
  Text,
  Card,
  ActivityIndicator,
  Chip,
  IconButton,
} from 'react-native-paper'
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit'
import { Ionicons } from '@expo/vector-icons'

import { theme, spacing, typography } from '../theme'
import apiService from '../services/api'

const screenWidth = Dimensions.get('window').width

interface DashboardData {
  overallScore: number
  kpiSummary: {
    total: number
    achieved: number
    at_risk: number
  }
  timeline: Array<{
    period: string
    achievement: number
  }>
  themes: Array<{
    name: string
    score: number
    color: string
  }>
  risks: Array<{
    kpiName: string
    value: number
    target: number
    risk_level: string
  }>
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setError(null)
      const response = await apiService.getDashboardData()
      setData(response.data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Veri yüklenirken hata oluştu')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadDashboardData()
  }

  const getScoreColor = (score: number): string => {
    if (score >= 80) return theme.colors.tertiary
    if (score >= 60) return '#d97706'
    return theme.colors.error
  }

  const getRiskIcon = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'high': return 'alert-circle'
      case 'medium': return 'warning'
      case 'low': return 'checkmark-circle'
      default: return 'help-circle'
    }
  }

  const getRiskColor = (riskLevel: string): string => {
    switch (riskLevel) {
      case 'high': return theme.colors.error
      case 'medium': return '#d97706'
      case 'low': return theme.colors.tertiary
      default: return theme.colors.secondary
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={styles.loadingText}>Dashboard yükleniyor...</Text>
      </View>
    )
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Ionicons name="alert-circle-outline" size={48} color={theme.colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <IconButton
          icon="refresh"
          size={24}
          onPress={loadDashboardData}
        />
      </View>
    )
  }

  if (!data) {
    return (
      <View style={styles.centered}>
        <Text>Veri bulunamadı</Text>
      </View>
    )
  }

  // Chart configurations
  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(30, 41, 59, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: "6",
      strokeWidth: "2",
      stroke: theme.colors.primary
    }
  }

  const timelineData = {
    labels: data.timeline.map(t => t.period),
    datasets: [{
      data: data.timeline.map(t => t.achievement),
      color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
      strokeWidth: 2
    }]
  }

  const themeData = data.themes.map((theme, index) => ({
    name: theme.name,
    population: theme.score,
    color: `hsl(${index * 360 / data.themes.length}, 70%, 50%)`,
    legendFontColor: "#1e293b",
    legendFontSize: 12,
  }))

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Overall Score */}
      <Surface style={styles.scoreCard}>
        <View style={styles.scoreHeader}>
          <Text style={styles.scoreTitle}>Genel Performans</Text>
          <Text 
            style={[
              styles.scoreValue, 
              { color: getScoreColor(data.overallScore) }
            ]}
          >
            {data.overallScore.toFixed(1)}%
          </Text>
        </View>
        <View style={styles.scoreBar}>
          <View 
            style={[
              styles.scoreProgress, 
              { 
                width: `${data.overallScore}%`,
                backgroundColor: getScoreColor(data.overallScore)
              }
            ]} 
          />
        </View>
      </Surface>

      {/* KPI Summary */}
      <View style={styles.summaryRow}>
        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <Text style={styles.summaryNumber}>{data.kpiSummary.total}</Text>
            <Text style={styles.summaryLabel}>Toplam KPI</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <Text style={[styles.summaryNumber, { color: theme.colors.tertiary }]}>
              {data.kpiSummary.achieved}
            </Text>
            <Text style={styles.summaryLabel}>Başarılı</Text>
          </Card.Content>
        </Card>
        
        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <Text style={[styles.summaryNumber, { color: theme.colors.error }]}>
              {data.kpiSummary.at_risk}
            </Text>
            <Text style={styles.summaryLabel}>Risk Altında</Text>
          </Card.Content>
        </Card>
      </View>

      {/* Timeline Chart */}
      <Card style={styles.chartCard}>
        <Card.Title title="Zaman İçindeki Performans" />
        <Card.Content>
          <LineChart
            data={timelineData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Themes Chart */}
      <Card style={styles.chartCard}>
        <Card.Title title="Tema Bazlı Performans" />
        <Card.Content>
          <PieChart
            data={themeData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 50]}
            absolute
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Risk Analysis */}
      <Card style={styles.riskCard}>
        <Card.Title title="Risk Analizi" />
        <Card.Content>
          {data.risks.map((risk, index) => (
            <View key={index} style={styles.riskItem}>
              <View style={styles.riskHeader}>
                <Ionicons
                  name={getRiskIcon(risk.risk_level) as any}
                  size={20}
                  color={getRiskColor(risk.risk_level)}
                />
                <Text style={styles.riskKPI}>{risk.kpiName}</Text>
                <Chip 
                  mode="outlined"
                  textStyle={{ fontSize: 10 }}
                  style={{ height: 24 }}
                >
                  {risk.risk_level.toUpperCase()}
                </Chip>
              </View>
              <View style={styles.riskValues}>
                <Text style={styles.riskValue}>
                  Mevcut: {risk.value}
                </Text>
                <Text style={styles.riskTarget}>
                  Hedef: {risk.target}
                </Text>
                <Text style={[
                  styles.riskAchievement,
                  { color: getRiskColor(risk.risk_level) }
                ]}>
                  %{((risk.value / risk.target) * 100).toFixed(1)}
                </Text>
              </View>
            </View>
          ))}
        </Card.Content>
      </Card>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
    ...typography.body,
    color: theme.colors.onSurfaceVariant,
  },
  errorText: {
    marginVertical: spacing.md,
    ...typography.body,
    color: theme.colors.error,
    textAlign: 'center',
  },
  scoreCard: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreTitle: {
    ...typography.h3,
    color: theme.colors.onSurface,
  },
  scoreValue: {
    ...typography.h1,
    fontWeight: 'bold',
  },
  scoreBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  scoreProgress: {
    height: '100%',
    borderRadius: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  summaryCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    elevation: 1,
  },
  summaryContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  summaryNumber: {
    ...typography.h2,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  summaryLabel: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  chartCard: {
    margin: spacing.md,
    elevation: 2,
  },
  chart: {
    borderRadius: 16,
  },
  riskCard: {
    margin: spacing.md,
    elevation: 2,
  },
  riskItem: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  riskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  riskKPI: {
    ...typography.body,
    fontWeight: '600',
    flex: 1,
    marginLeft: spacing.sm,
  },
  riskValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskValue: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  riskTarget: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  riskAchievement: {
    ...typography.caption,
    fontWeight: 'bold',
  },
  bottomSpacing: {
    height: spacing.lg,
  },
})
