import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Provider as PaperProvider } from 'react-native-paper'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'

// Screens
import DashboardScreen from './src/screens/DashboardScreen'
import KPIListScreen from './src/screens/KPIListScreen'
import KPIDetailScreen from './src/screens/KPIDetailScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import AnalyticsScreen from './src/screens/AnalyticsScreen'

// Theme
import { theme } from './src/theme'

const Tab = createBottomTabNavigator()

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              tabBarIcon: ({ focused, color, size }) => {
                let iconName: keyof typeof Ionicons.glyphMap

                if (route.name === 'Dashboard') {
                  iconName = focused ? 'speedometer' : 'speedometer-outline'
                } else if (route.name === 'KPIs') {
                  iconName = focused ? 'stats-chart' : 'stats-chart-outline'
                } else if (route.name === 'Analytics') {
                  iconName = focused ? 'analytics' : 'analytics-outline'
                } else if (route.name === 'Profile') {
                  iconName = focused ? 'person' : 'person-outline'
                } else {
                  iconName = 'ellipse'
                }

                return <Ionicons name={iconName} size={size} color={color} />
              },
              tabBarActiveTintColor: theme.colors.primary,
              tabBarInactiveTintColor: 'gray',
              headerStyle: {
                backgroundColor: theme.colors.primary,
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            })}
          >
            <Tab.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Ana Sayfa' }}
            />
            <Tab.Screen 
              name="KPIs" 
              component={KPIListScreen}
              options={{ title: 'KPI Listesi' }}
            />
            <Tab.Screen 
              name="Analytics" 
              component={AnalyticsScreen}
              options={{ title: 'Analitik' }}
            />
            <Tab.Screen 
              name="Profile" 
              component={ProfileScreen}
              options={{ title: 'Profil' }}
            />
          </Tab.Navigator>
        </NavigationContainer>
        <StatusBar style="light" />
      </PaperProvider>
    </SafeAreaProvider>
  )
}
