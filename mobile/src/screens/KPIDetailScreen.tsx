import React, { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
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
  TextInput,
  Modal,
  Portal,
} from 'react-native-paper'
import { LineChart } from 'react-native-chart-kit'
import { Ionicons } from '@expo/vector-icons'

import { theme, spacing, typography } from '../theme'
import apiService from '../services/api'

const screenWidth = Dimensions.get('window').width

interface KPIDetail {
  id: string
  name: string
  description: string
  unit: string
  targetValue: number
  currentValue: number
  achievement: number
  trend: 'up' | 'down' | 'stable'
  category: string
  lastUpdated: string
  history: Array<{
    period: string
    value: number
    target: number
  }>
}

interface KPIDetailScreenProps {
  kpiId: string
  onClose: () => void
}

export default function KPIDetailScreen({ kpiId, onClose }: KPIDetailScreenProps) {
  const [kpiDetail, setKPIDetail] = useState<KPIDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddValue, setShowAddValue] = useState(false)
  const [newValue, setNewValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadKPIDetail()
  }, [kpiId])

  const loadKPIDetail = async () => {
    try {
      const response = await apiService.getKPIValues(kpiId)
      setKPIDetail(response.kpi)
    } catch (error) {
      console.error('Failed to load KPI detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const submitNewValue = async () => {
    if (!newValue || !kpiDetail) return

    setSubmitting(true)
    try {
      await apiService.submitKPIValue({
        kpiId: kpiDetail.id,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM format
        value: parseFloat(newValue),
      })
      
      setShowAddValue(false)
      setNewValue('')
      loadKPIDetail() // Refresh data
    } catch (error) {
      console.error('Failed to submit KPI value:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const getAchievementColor = (achievement: number): string => {
    if (achievement >= 100) return theme.colors.tertiary
    if (achievement >= 80) return '#d97706'
    return theme.colors.error
  }

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'up': return 'trending-up'
      case 'down': return 'trending-down'
      case 'stable': return 'remove'
      default: return 'help'
    }
  }

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'up': return theme.colors.tertiary
      case 'down': return theme.colors.error
      case 'stable': return theme.colors.secondary
      default: return theme.colors.secondary
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={styles.loadingText}>KPI detayları yükleniyor...</Text>
      </View>
    )
  }

  if (!kpiDetail) {
    return (
      <View style={styles.centered}>
        <Text>KPI detayı bulunamadı</Text>
        <Button onPress={onClose} style={styles.backButton}>
          Geri Dön
        </Button>
      </View>
    )
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

  const historyChartData = {
    labels: kpiDetail.history.map(h => h.period).slice(-6), // Last 6 periods
    datasets: [
      {
        data: kpiDetail.history.map(h => h.value).slice(-6),
        color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
        strokeWidth: 2
      },
      {
        data: kpiDetail.history.map(h => h.target).slice(-6),
        color: (opacity = 1) => `rgba(220, 38, 38, ${opacity})`,
        strokeWidth: 2,
        withDots: false
      }
    ]
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <Surface style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerInfo}>
              <Text style={styles.kpiName}>{kpiDetail.name}</Text>
              <Text style={styles.kpiDescription}>{kpiDetail.description}</Text>
              <Chip mode="outlined" style={styles.categoryChip}>
                {kpiDetail.category}
              </Chip>
            </View>
            <View style={styles.headerMetrics}>
              <View style={styles.trendContainer}>
                <Ionicons
                  name={getTrendIcon(kpiDetail.trend) as any}
                  size={24}
                  color={getTrendColor(kpiDetail.trend)}
                />
              </View>
              <Text 
                style={[
                  styles.achievementText,
                  { color: getAchievementColor(kpiDetail.achievement) }
                ]}
              >
                {kpiDetail.achievement.toFixed(1)}%
              </Text>
            </View>
          </View>
        </Surface>

        {/* Current Values */}
        <View style={styles.valuesRow}>
          <Card style={styles.valueCard}>
            <Card.Content style={styles.valueContent}>
              <Text style={styles.valueLabel}>Mevcut Değer</Text>
              <Text style={styles.currentValue}>
                {kpiDetail.currentValue} {kpiDetail.unit}
              </Text>
            </Card.Content>
          </Card>
          
          <Card style={styles.valueCard}>
            <Card.Content style={styles.valueContent}>
              <Text style={styles.valueLabel}>Hedef Değer</Text>
              <Text style={styles.targetValue}>
                {kpiDetail.targetValue} {kpiDetail.unit}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Progress Bar */}
        <Card style={styles.progressCard}>
          <Card.Content>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Hedef Gerçekleşme</Text>
              <Text style={[
                styles.progressPercentage,
                { color: getAchievementColor(kpiDetail.achievement) }
              ]}>
                {kpiDetail.achievement.toFixed(1)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min(100, kpiDetail.achievement)}%`,
                    backgroundColor: getAchievementColor(kpiDetail.achievement)
                  }
                ]}
              />
            </View>
          </Card.Content>
        </Card>

        {/* History Chart */}
        <Card style={styles.chartCard}>
          <Card.Title title="Geçmiş Performans" subtitle="Son 6 dönem" />
          <Card.Content>
            {kpiDetail.history.length > 0 ? (
              <LineChart
                data={historyChartData}
                width={screenWidth - 64}
                height={220}
                chartConfig={chartConfig}
                bezier
                style={styles.chart}
                legend={['Gerçekleşen', 'Hedef']}
              />
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>Geçmiş veri bulunmuyor</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* History Table */}
        <Card style={styles.historyCard}>
          <Card.Title title="Detaylı Geçmiş" />
          <Card.Content>
            {kpiDetail.history.map((item, index) => (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyPeriod}>
                  <Text style={styles.periodText}>{item.period}</Text>
                </View>
                <View style={styles.historyValues}>
                  <Text style={styles.historyValue}>
                    {item.value} {kpiDetail.unit}
                  </Text>
                  <Text style={styles.historyTarget}>
                    / {item.target} {kpiDetail.unit}
                  </Text>
                </View>
                <View style={styles.historyAchievement}>
                  <Text style={[
                    styles.historyPercentage,
                    { color: getAchievementColor((item.value / item.target) * 100) }
                  ]}>
                    {((item.value / item.target) * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Last Updated */}
        <Surface style={styles.lastUpdated}>
          <View style={styles.updateInfo}>
            <Ionicons name="time" size={16} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.updateText}>
              Son güncelleme: {new Date(kpiDetail.lastUpdated).toLocaleString('tr-TR')}
            </Text>
          </View>
        </Surface>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={onClose}
          style={styles.backButton}
          icon="arrow-left"
        >
          Geri
        </Button>
        <Button
          mode="contained"
          onPress={() => setShowAddValue(true)}
          style={styles.addButton}
          icon="plus"
        >
          Değer Ekle
        </Button>
      </View>

      {/* Add Value Modal */}
      <Portal>
        <Modal
          visible={showAddValue}
          onDismiss={() => setShowAddValue(false)}
          contentContainerStyle={styles.modalContent}
        >
          <Text style={styles.modalTitle}>Yeni Değer Ekle</Text>
          <Text style={styles.modalSubtitle}>
            {kpiDetail.name} için değer girin ({kpiDetail.unit})
          </Text>
          
          <TextInput
            mode="outlined"
            label={`Değer (${kpiDetail.unit})`}
            value={newValue}
            onChangeText={setNewValue}
            keyboardType="numeric"
            style={styles.valueInput}
          />

          <View style={styles.modalActions}>
            <Button
              mode="outlined"
              onPress={() => setShowAddValue(false)}
              disabled={submitting}
            >
              İptal
            </Button>
            <Button
              mode="contained"
              onPress={submitNewValue}
              loading={submitting}
              disabled={!newValue || submitting}
            >
              Kaydet
            </Button>
          </View>
        </Modal>
      </Portal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
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
  header: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  kpiName: {
    ...typography.h2,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  kpiDescription: {
    ...typography.body,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
  },
  categoryChip: {
    alignSelf: 'flex-start',
  },
  headerMetrics: {
    alignItems: 'center',
  },
  trendContainer: {
    marginBottom: spacing.sm,
  },
  achievementText: {
    ...typography.h1,
    fontWeight: 'bold',
  },
  valuesRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  valueCard: {
    flex: 1,
    marginHorizontal: spacing.xs,
    elevation: 1,
  },
  valueContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  valueLabel: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  currentValue: {
    ...typography.h2,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  targetValue: {
    ...typography.h2,
    fontWeight: 'bold',
    color: theme.colors.secondary,
  },
  progressCard: {
    margin: spacing.md,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressLabel: {
    ...typography.body,
    fontWeight: '600',
  },
  progressPercentage: {
    ...typography.h3,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartCard: {
    margin: spacing.md,
    elevation: 2,
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  noDataText: {
    ...typography.body,
    color: theme.colors.onSurfaceVariant,
  },
  historyCard: {
    margin: spacing.md,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  historyPeriod: {
    flex: 1,
  },
  periodText: {
    ...typography.body,
    fontWeight: '600',
  },
  historyValues: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyValue: {
    ...typography.body,
    color: theme.colors.onSurface,
  },
  historyTarget: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  historyAchievement: {
    flex: 1,
    alignItems: 'flex-end',
  },
  historyPercentage: {
    ...typography.body,
    fontWeight: 'bold',
  },
  lastUpdated: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateText: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  backButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    padding: spacing.lg,
    margin: spacing.lg,
    borderRadius: 16,
  },
  modalTitle: {
    ...typography.h2,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  modalSubtitle: {
    ...typography.body,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  valueInput: {
    marginBottom: spacing.lg,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
})
