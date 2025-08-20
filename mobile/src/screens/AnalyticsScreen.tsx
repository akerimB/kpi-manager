import React, { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native'
import {
  Card,
  Text,
  Button,
  ActivityIndicator,
  Chip,
  Surface,
  Divider,
} from 'react-native-paper'
import { LineChart, BarChart } from 'react-native-chart-kit'
import { Ionicons } from '@expo/vector-icons'

import { theme, spacing, typography } from '../theme'
import apiService from '../services/api'

const screenWidth = Dimensions.get('window').width

interface ForecastData {
  predictions: Array<{
    period: string
    predicted: number
    confidence: { low: number; high: number }
    probability: number
  }>
  modelAccuracy: number
  modelType: string
}

interface AnalyticsData {
  themes: Array<{
    name: string
    score: number
    trend: number
  }>
  factories: Array<{
    name: string
    score: number
    kpiCount: number
  }>
  timeline: Array<{
    period: string
    achievement: number
  }>
}

export default function AnalyticsScreen() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [forecastData, setForecastData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [forecastLoading, setForecastLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedKPI, setSelectedKPI] = useState('')

  useEffect(() => {
    loadAnalyticsData()
  }, [])

  const loadAnalyticsData = async () => {
    try {
      const response = await apiService.getAnalyticsOverview()
      setAnalyticsData(response.data)
    } catch (error) {
      console.error('Failed to load analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const generateForecast = async () => {
    if (!selectedKPI) return
    
    setForecastLoading(true)
    try {
      const response = await apiService.generateForecast({
        kpiId: selectedKPI,
        periodsAhead: 4,
        includeSeasonality: true
      })
      setForecastData(response.forecast)
    } catch (error) {
      console.error('Failed to generate forecast:', error)
    } finally {
      setForecastLoading(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadAnalyticsData()
  }

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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={styles.loadingText}>Analitik veriler yükleniyor...</Text>
      </View>
    )
  }

  if (!analyticsData) {
    return (
      <View style={styles.centered}>
        <Text>Analitik verisi bulunamadı</Text>
      </View>
    )
  }

  const timelineChartData = {
    labels: analyticsData.timeline.map(t => t.period),
    datasets: [{
      data: analyticsData.timeline.map(t => t.achievement),
      color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
      strokeWidth: 2
    }]
  }

  const themeChartData = {
    labels: analyticsData.themes.map(t => t.name.substring(0, 8)),
    datasets: [{
      data: analyticsData.themes.map(t => t.score)
    }]
  }

  const forecastChartData = forecastData ? {
    labels: forecastData.predictions.map(p => p.period),
    datasets: [
      {
        data: forecastData.predictions.map(p => p.predicted),
        color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: forecastData.predictions.map(p => p.confidence.low),
        color: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
        strokeWidth: 1,
        withDots: false
      },
      {
        data: forecastData.predictions.map(p => p.confidence.high),
        color: (opacity = 1) => `rgba(148, 163, 184, ${opacity})`,
        strokeWidth: 1,
        withDots: false
      }
    ]
  } : null

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Performance Timeline */}
      <Card style={styles.chartCard}>
        <Card.Title 
          title="Performans Zaman Çizelgesi" 
          subtitle="Son dönemlerdeki genel başarı oranı"
        />
        <Card.Content>
          <LineChart
            data={timelineChartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </Card.Content>
      </Card>

      {/* Theme Performance */}
      <Card style={styles.chartCard}>
        <Card.Title 
          title="Tema Bazlı Performans" 
          subtitle="Farklı temalardaki başarı durumu"
        />
        <Card.Content>
          <BarChart
            data={themeChartData}
            width={screenWidth - 64}
            height={220}
            chartConfig={chartConfig}
            style={styles.chart}
            yAxisLabel=""
            yAxisSuffix="%"
            showValuesOnTopOfBars
          />
        </Card.Content>
      </Card>

      {/* Theme Details */}
      <Card style={styles.detailCard}>
        <Card.Title title="Tema Detayları" />
        <Card.Content>
          {analyticsData.themes.map((theme, index) => (
            <View key={index}>
              <View style={styles.themeRow}>
                <View style={styles.themeInfo}>
                  <Text style={styles.themeName}>{theme.name}</Text>
                  <Text style={styles.themeScore}>
                    {theme.score.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={theme.trend > 0 ? 'trending-up' : theme.trend < 0 ? 'trending-down' : 'remove'}
                    size={20}
                    color={theme.trend > 0 ? theme.colors.tertiary : theme.trend < 0 ? theme.colors.error : theme.colors.secondary}
                  />
                  <Text style={[
                    styles.trendText,
                    { 
                      color: theme.trend > 0 ? theme.colors.tertiary : 
                             theme.trend < 0 ? theme.colors.error : 
                             theme.colors.secondary 
                    }
                  ]}>
                    {theme.trend > 0 ? '+' : ''}{theme.trend.toFixed(1)}%
                  </Text>
                </View>
              </View>
              {index < analyticsData.themes.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* Factory Performance */}
      <Card style={styles.detailCard}>
        <Card.Title title="Fabrika Performansı" />
        <Card.Content>
          {analyticsData.factories.map((factory, index) => (
            <View key={index}>
              <View style={styles.factoryRow}>
                <View style={styles.factoryInfo}>
                  <Text style={styles.factoryName}>{factory.name}</Text>
                  <Text style={styles.factoryKPIs}>
                    {factory.kpiCount} KPI
                  </Text>
                </View>
                <Chip 
                  mode="outlined"
                  style={[
                    styles.scoreChip,
                    { 
                      backgroundColor: factory.score >= 80 ? 
                        theme.colors.tertiaryContainer : 
                        factory.score >= 60 ? 
                        '#fef3c7' : 
                        theme.colors.errorContainer 
                    }
                  ]}
                >
                  {factory.score.toFixed(1)}%
                </Chip>
              </View>
              {index < analyticsData.factories.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card.Content>
      </Card>

      {/* ML Forecasting */}
      <Card style={styles.forecastCard}>
        <Card.Title 
          title="Makine Öğrenmesi Tahminleri" 
          subtitle="KPI değerleri için gelecek dönem tahminleri"
        />
        <Card.Content>
          <View style={styles.forecastControls}>
            <Text style={styles.controlLabel}>KPI seçin:</Text>
            <Button
              mode="outlined"
              onPress={() => setSelectedKPI('sample-kpi-id')}
              style={styles.selectButton}
            >
              {selectedKPI ? 'KPI Seçildi' : 'KPI Seç'}
            </Button>
            <Button
              mode="contained"
              onPress={generateForecast}
              disabled={!selectedKPI || forecastLoading}
              loading={forecastLoading}
              style={styles.forecastButton}
            >
              Tahmin Oluştur
            </Button>
          </View>

          {forecastData && (
            <>
              <Surface style={styles.forecastMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Model Doğruluğu</Text>
                  <Text style={styles.metricValue}>
                    {forecastData.modelAccuracy}%
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Model Tipi</Text>
                  <Text style={styles.metricValue}>
                    {forecastData.modelType}
                  </Text>
                </View>
              </Surface>

              {forecastChartData && (
                <LineChart
                  data={forecastChartData}
                  width={screenWidth - 64}
                  height={220}
                  chartConfig={{
                    ...chartConfig,
                    color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                  }}
                  bezier
                  style={styles.chart}
                />
              )}

              <View style={styles.predictionsList}>
                <Text style={styles.predictionsTitle}>Detaylı Tahminler</Text>
                {forecastData.predictions.map((pred, index) => (
                  <View key={index} style={styles.predictionItem}>
                    <View style={styles.predictionHeader}>
                      <Text style={styles.predictionPeriod}>{pred.period}</Text>
                      <Text style={styles.predictionValue}>
                        {pred.predicted.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.predictionDetails}>
                      <Text style={styles.confidenceText}>
                        Güven Aralığı: {pred.confidence.low.toFixed(2)} - {pred.confidence.high.toFixed(2)}
                      </Text>
                      <Chip 
                        mode="outlined" 
                        compact
                        style={styles.probabilityChip}
                      >
                        %{Math.round(pred.probability * 100)} güven
                      </Chip>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
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
  chartCard: {
    margin: spacing.md,
    elevation: 2,
  },
  detailCard: {
    margin: spacing.md,
    elevation: 2,
  },
  forecastCard: {
    margin: spacing.md,
    elevation: 2,
  },
  chart: {
    borderRadius: 16,
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  themeInfo: {
    flex: 1,
  },
  themeName: {
    ...typography.body,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  themeScore: {
    ...typography.h3,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  factoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  factoryInfo: {
    flex: 1,
  },
  factoryName: {
    ...typography.body,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  factoryKPIs: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  scoreChip: {
    height: 32,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  forecastControls: {
    marginBottom: spacing.lg,
  },
  controlLabel: {
    ...typography.body,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  selectButton: {
    marginBottom: spacing.md,
  },
  forecastButton: {
    backgroundColor: theme.colors.tertiary,
  },
  forecastMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: spacing.md,
    marginVertical: spacing.md,
    borderRadius: 8,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  metricValue: {
    ...typography.h3,
    fontWeight: 'bold',
    color: theme.colors.tertiary,
  },
  predictionsList: {
    marginTop: spacing.lg,
  },
  predictionsTitle: {
    ...typography.h3,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  predictionItem: {
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  predictionPeriod: {
    ...typography.body,
    fontWeight: '600',
  },
  predictionValue: {
    ...typography.h3,
    fontWeight: 'bold',
    color: theme.colors.tertiary,
  },
  predictionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceText: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  probabilityChip: {
    height: 24,
  },
  bottomSpacing: {
    height: spacing.lg,
  },
})
