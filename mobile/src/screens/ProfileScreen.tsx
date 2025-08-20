import React, { useState, useEffect } from 'react'
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native'
import {
  Card,
  Text,
  Button,
  List,
  Switch,
  Divider,
  Avatar,
  Surface,
  ActivityIndicator,
} from 'react-native-paper'
import { Ionicons } from '@expo/vector-icons'

import { theme, spacing, typography } from '../theme'
import apiService from '../services/api'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  factory?: {
    id: string
    name: string
  }
  avatar?: string
  lastLogin: string
  createdAt: string
}

interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  weeklyReports: boolean
  alertsEnabled: boolean
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [notifications, setNotifications] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: false,
    alertsEnabled: true,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await apiService.getUserProfile()
      setProfile(response.user)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Alert.alert(
      'Çıkış Yap',
      'Uygulamadan çıkış yapmak istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Çıkış Yap', 
          style: 'destructive',
          onPress: async () => {
            await apiService.logout()
            // Navigate to login screen
            console.log('Logout completed')
          }
        },
      ]
    )
  }

  const updateNotificationSetting = (key: keyof NotificationSettings) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'ADMIN': return 'Yönetici'
      case 'UPPER_MANAGEMENT': return 'Üst Yönetim'
      case 'MODEL_FACTORY': return 'Model Fabrika'
      default: return 'Kullanıcı'
    }
  }

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'ADMIN': return theme.colors.error
      case 'UPPER_MANAGEMENT': return theme.colors.primary
      case 'MODEL_FACTORY': return theme.colors.tertiary
      default: return theme.colors.secondary
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator animating={true} size="large" />
        <Text style={styles.loadingText}>Profil yükleniyor...</Text>
      </View>
    )
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text>Profil bilgisi bulunamadı</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <Surface style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Avatar.Text 
            size={80} 
            label={profile.name.charAt(0).toUpperCase()}
            style={{ backgroundColor: getRoleColor(profile.role) }}
          />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>
          <View style={styles.roleContainer}>
            <Ionicons 
              name="shield-checkmark" 
              size={16} 
              color={getRoleColor(profile.role)} 
            />
            <Text style={[styles.roleText, { color: getRoleColor(profile.role) }]}>
              {getRoleDisplayName(profile.role)}
            </Text>
          </View>
          {profile.factory && (
            <View style={styles.factoryContainer}>
              <Ionicons name="business" size={16} color={theme.colors.onSurfaceVariant} />
              <Text style={styles.factoryText}>{profile.factory.name}</Text>
            </View>
          )}
        </View>
      </Surface>

      {/* Account Information */}
      <Card style={styles.card}>
        <Card.Title title="Hesap Bilgileri" />
        <Card.Content>
          <List.Item
            title="Son Giriş"
            description={new Date(profile.lastLogin).toLocaleString('tr-TR')}
            left={(props) => <List.Icon {...props} icon="clock-time-four" />}
          />
          <Divider />
          <List.Item
            title="Hesap Oluşturma"
            description={new Date(profile.createdAt).toLocaleDateString('tr-TR')}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
          <Divider />
          <List.Item
            title="Kullanıcı ID"
            description={profile.id}
            left={(props) => <List.Icon {...props} icon="identifier" />}
          />
        </Card.Content>
      </Card>

      {/* Notification Settings */}
      <Card style={styles.card}>
        <Card.Title title="Bildirim Ayarları" />
        <Card.Content>
          <List.Item
            title="E-posta Bildirimleri"
            description="Önemli güncellemeler için e-posta al"
            left={(props) => <List.Icon {...props} icon="email" />}
            right={() => (
              <Switch
                value={notifications.emailNotifications}
                onValueChange={() => updateNotificationSetting('emailNotifications')}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Push Bildirimleri"
            description="Mobil bildirimler"
            left={(props) => <List.Icon {...props} icon="bell" />}
            right={() => (
              <Switch
                value={notifications.pushNotifications}
                onValueChange={() => updateNotificationSetting('pushNotifications')}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Haftalık Raporlar"
            description="Haftalık performans özeti"
            left={(props) => <List.Icon {...props} icon="chart-line" />}
            right={() => (
              <Switch
                value={notifications.weeklyReports}
                onValueChange={() => updateNotificationSetting('weeklyReports')}
              />
            )}
          />
          <Divider />
          <List.Item
            title="Uyarı Bildirimleri"
            description="KPI uyarıları ve risk bildirimleri"
            left={(props) => <List.Icon {...props} icon="alert" />}
            right={() => (
              <Switch
                value={notifications.alertsEnabled}
                onValueChange={() => updateNotificationSetting('alertsEnabled')}
              />
            )}
          />
        </Card.Content>
      </Card>

      {/* Application Settings */}
      <Card style={styles.card}>
        <Card.Title title="Uygulama Ayarları" />
        <Card.Content>
          <List.Item
            title="Tema"
            description="Açık tema"
            left={(props) => <List.Icon {...props} icon="palette" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Navigate to theme settings
              console.log('Navigate to theme settings')
            }}
          />
          <Divider />
          <List.Item
            title="Dil"
            description="Türkçe"
            left={(props) => <List.Icon {...props} icon="translate" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Navigate to language settings
              console.log('Navigate to language settings')
            }}
          />
          <Divider />
          <List.Item
            title="Veri Kullanımı"
            description="Veri kullanım ayarları"
            left={(props) => <List.Icon {...props} icon="cloud-download" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Navigate to data usage settings
              console.log('Navigate to data usage settings')
            }}
          />
        </Card.Content>
      </Card>

      {/* Support and Help */}
      <Card style={styles.card}>
        <Card.Title title="Destek ve Yardım" />
        <Card.Content>
          <List.Item
            title="Yardım Merkezi"
            description="SSS ve kullanım kılavuzu"
            left={(props) => <List.Icon {...props} icon="help-circle" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Navigate to help center
              console.log('Navigate to help center')
            }}
          />
          <Divider />
          <List.Item
            title="Geri Bildirim Gönder"
            description="Uygulamayı değerlendirin"
            left={(props) => <List.Icon {...props} icon="message-text" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Navigate to feedback
              console.log('Navigate to feedback')
            }}
          />
          <Divider />
          <List.Item
            title="Hakkında"
            description="Uygulama sürümü ve bilgileri"
            left={(props) => <List.Icon {...props} icon="information" />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => {
              // Navigate to about
              console.log('Navigate to about')
            }}
          />
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={() => {
            // Navigate to edit profile
            console.log('Navigate to edit profile')
          }}
          style={styles.editButton}
          icon="account-edit"
        >
          Profili Düzenle
        </Button>
        
        <Button
          mode="contained"
          onPress={handleLogout}
          style={styles.logoutButton}
          buttonColor={theme.colors.error}
          icon="logout"
        >
          Çıkış Yap
        </Button>
      </View>

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
  profileHeader: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...typography.h2,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  profileEmail: {
    ...typography.body,
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.sm,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  roleText: {
    ...typography.caption,
    fontWeight: '600',
    marginLeft: spacing.xs,
  },
  factoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  factoryText: {
    ...typography.caption,
    color: theme.colors.onSurfaceVariant,
    marginLeft: spacing.xs,
  },
  card: {
    margin: spacing.md,
    elevation: 2,
  },
  actionButtons: {
    padding: spacing.md,
    gap: spacing.md,
  },
  editButton: {
    borderColor: theme.colors.primary,
  },
  logoutButton: {
    // Custom styles applied via buttonColor prop
  },
  bottomSpacing: {
    height: spacing.lg,
  },
})
