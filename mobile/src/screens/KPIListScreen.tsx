import React, { useState, useEffect } from 'react'
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native'
import {
  Searchbar,
  Card,
  Text,
  Chip,
  ActivityIndicator,
  FAB,
  Menu,
  Divider,
} from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'

import { theme, spacing, typography } from '../theme'
import apiService from '../services/api'

interface KPI {
  id: string
  name: string
  description: string
  unit: string
  targetValue: number
  currentValue?: number
  achievement?: number
  trend: 'up' | 'down' | 'stable'
  category: string
  lastUpdated?: string
}

export default function KPIListScreen() {
  const [kpis, setKPIs] = useState<KPI[]>([])
  const [filteredKPIs, setFilteredKPIs] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [menuVisible, setMenuVisible] = useState(false)

  useEffect(() => {
    loadKPIs()
  }, [])

  useEffect(() => {
    filterKPIs()
  }, [kpis, searchQuery, selectedFilter])

  const loadKPIs = async () => {
    try {
      const response = await apiService.getKPIs()
      setKPIs(response.kpis || [])
    } catch (error) {
      console.error('Failed to load KPIs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterKPIs = () => {
    let filtered = kpis

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(kpi =>
        kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kpi.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        kpi.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Category filter
    if (selectedFilter !== 'all') {
      if (selectedFilter === 'achieved') {
        filtered = filtered.filter(kpi => (kpi.achievement || 0) >= 100)
      } else if (selectedFilter === 'at_risk') {
        filtered = filtered.filter(kpi => (kpi.achievement || 0) < 80)
      } else if (selectedFilter === 'on_track') {
        filtered = filtered.filter(kpi => 
          (kpi.achievement || 0) >= 80 && (kpi.achievement || 0) < 100
        )
      } else {
        filtered = filtered.filter(kpi => kpi.category === selectedFilter)
      }
    }

    setFilteredKPIs(filtered)
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadKPIs()
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

  const renderKPIItem = ({ item }: { item: KPI }) => (
    <TouchableOpacity
      onPress={() => {
        // Navigate to KPI detail screen
        console.log('Navigate to KPI detail:', item.id)
      }}
    >
      <Card style={styles.kpiCard}>
        <Card.Content>
          <View style={styles.kpiHeader}>
            <View style={styles.kpiInfo}>
              <Text style={styles.kpiName}>{item.name}</Text>
              <Text style={styles.kpiDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <View style={styles.kpiMeta}>
              <Ionicons
                name={getTrendIcon(item.trend) as any}
                size={20}
                color={getTrendColor(item.trend)}
              />
              {item.achievement !== undefined && (
                <Text 
                  style={[
                    styles.achievementText,
                    { color: getAchievementColor(item.achievement) }
                  ]}
                >
                  {item.achievement.toFixed(1)}%
                </Text>
              )}
            </View>
          </View>

          <View style={styles.kpiValues}>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Mevcut</Text>
              <Text style={styles.valueText}>
                {item.currentValue || 0} {item.unit}
              </Text>
            </View>
            <View style={styles.valueItem}>
              <Text style={styles.valueLabel}>Hedef</Text>
              <Text style={styles.valueText}>
                {item.targetValue} {item.unit}
              </Text>
            </View>
          </View>

          <View style={styles.kpiFooter}>
            <Chip mode="outlined" compact>
              {item.category}
            </Chip>
            {item.lastUpdated && (
              <Text style={styles.lastUpdated}>
                Son güncelleme: {new Date(item.lastUpdated).toLocaleDateString('tr-TR')}
              </Text>
            )}
          </View>

          {item.achievement !== undefined && (
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { 
                    width: `${Math.min(100, item.achievement)}%`,
                    backgroundColor: getAchievementColor(item.achievement)
                  }
                ]}
              />
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={styles.loadingText}>KPI'lar yükleniyor...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.header}>
        <Searchbar
          placeholder="KPI ara..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
        />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setMenuVisible(true)}
            >
              <Ionicons name="filter" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          }
        >
          <Menu.Item 
            onPress={() => {
              setSelectedFilter('all')
              setMenuVisible(false)
            }} 
            title="Tümü" 
          />
          <Divider />
          <Menu.Item 
            onPress={() => {
              setSelectedFilter('achieved')
              setMenuVisible(false)
            }} 
            title="Başarılı" 
          />
          <Menu.Item 
            onPress={() => {
              setSelectedFilter('on_track')
              setMenuVisible(false)
            }} 
            title="Hedefte" 
          />
          <Menu.Item 
            onPress={() => {
              setSelectedFilter('at_risk')
              setMenuVisible(false)
            }} 
            title="Risk Altında" 
          />
        </Menu>
      </View>

      {/* KPI List */}
      <FlatList
        data={filteredKPIs}
        renderItem={renderKPIItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Add KPI FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => {
          // Navigate to add KPI screen
          console.log('Navigate to add KPI')
        }}
      />
    </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: theme.colors.surface,
    elevation: 1,
  },
  searchbar: {
    flex: 1,
    marginRight: spacing.md,
  },
  filterButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceVariant,
  },
  listContainer: {
    padding: spacing.md,
  },
  kpiCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  kpiInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  kpiName: {
    ...typography.h3,
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  kpiDescription: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
  },
  kpiMeta: {
    alignItems: 'center',
  },
  achievementText: {
    ...typography.body,
    fontWeight: 'bold',
    marginTop: spacing.xs,
  },
  kpiValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  valueItem: {
    flex: 1,
  },
  valueLabel: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  valueText: {
    ...typography.body,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  kpiFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  lastUpdated: {
    ...typography.small,
    color: theme.colors.onSurfaceVariant,
  },
  progressBar: {
    height: 4,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
})
