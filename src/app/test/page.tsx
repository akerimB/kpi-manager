'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, User, Shield, Database, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser, verifyToken } from '@/lib/user-context'

export default function TestPage() {
  const [userContext, setUserContext] = useState<any>(null)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [apiTests, setApiTests] = useState<any>({})

  // Memoized API test function
  const runApiTests = useCallback(async (context: any) => {
    const tests = {
      kpis: false,
      factories: false,
      dashboard: false,
      themes: false
    }

    try {
      // KPI API test
      const kpiResponse = await fetch(`/api/kpis?userRole=${context.userRole}&userId=${context.user.id}${context.factoryId ? `&factoryId=${context.factoryId}` : ''}`)
      tests.kpis = kpiResponse.ok

      // Factories API test
      const factoryResponse = await fetch(`/api/factories?userRole=${context.userRole}&userId=${context.user.id}${context.factoryId ? `&factoryId=${context.factoryId}` : ''}`)
      tests.factories = factoryResponse.ok

      // Dashboard API test
      const dashboardResponse = await fetch(`/api/dashboard/stats?userRole=${context.userRole}&userId=${context.user.id}${context.factoryId ? `&factoryId=${context.factoryId}` : ''}`)
      tests.dashboard = dashboardResponse.ok

      // Themes API test
      const themesResponse = await fetch(`/api/themes?userRole=${context.userRole}&userId=${context.user.id}${context.factoryId ? `&factoryId=${context.factoryId}` : ''}`)
      tests.themes = themesResponse.ok

    } catch (error) {
      console.error('API test error:', error)
    }

    setApiTests(tests)
  }, [])

  // Memoized auth check function
  const checkAuth = useCallback(async () => {
    const context = getCurrentUser()
    setUserContext(context)
    
    if (context) {
      const isValid = await verifyToken()
      setTokenValid(isValid)
      
      // API testlerini çalıştır
      await runApiTests(context)
    }
    
    setLoading(false)
  }, [runApiTests])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userContext) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Kimlik Doğrulama Gerekli</h2>
          <p className="text-gray-600 mb-4">Bu sayfaya erişmek için giriş yapmalısınız.</p>
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Giriş Yap
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Dashboard'a Dön
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <h1 className="text-xl font-semibold text-gray-900">Sistem Test Sayfası</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Kimlik Doğrulama Durumu</span>
              </CardTitle>
              <CardDescription>
                Mevcut kullanıcı oturumu ve yetkilendirme bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Oturum Durumu:</span>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">Aktif</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Token Geçerliliği:</span>
                <div className="flex items-center space-x-2">
                  {tokenValid ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">Geçerli</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">Geçersiz</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Kullanıcı Bilgileri</span>
              </CardTitle>
              <CardDescription>
                Mevcut kullanıcı profili ve yetkileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">Ad:</span>
                  <p className="text-sm text-gray-900">{userContext.user?.name || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">E-posta:</span>
                  <p className="text-sm text-gray-900">{userContext.user?.email || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Rol:</span>
                  <p className="text-sm text-gray-900">
                    {userContext.userRole === 'MODEL_FACTORY' ? 'Model Fabrika' :
                     userContext.userRole === 'UPPER_MANAGEMENT' ? 'Üst Yönetim' : 'Admin'}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">Fabrika:</span>
                  <p className="text-sm text-gray-900">
                    {userContext.user?.factory?.name || 'Atanmamış'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions */}
          <Card>
            <CardHeader>
              <CardTitle>Kullanıcı Yetkileri</CardTitle>
              <CardDescription>
                Mevcut kullanıcının sistem yetkileri
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(userContext.permissions).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {key === 'canViewAllFactories' ? 'Tüm Fabrikaları Görüntüle' :
                       key === 'canExportData' ? 'Veri Dışa Aktar' :
                       key === 'canManageActions' ? 'Eylem Yönetimi' :
                       key === 'canViewAnalytics' ? 'Analitik Görüntüle' :
                       key === 'canCreateSimulations' ? 'Simülasyon Oluştur' : key}
                    </span>
                    <div className="flex items-center space-x-2">
                      {value ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Var</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">Yok</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* API Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>API Bağlantı Testleri</span>
              </CardTitle>
              <CardDescription>
                Sistem API'lerinin durumu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(apiTests).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">
                      {key === 'kpis' ? 'KPI API' :
                       key === 'factories' ? 'Fabrika API' :
                       key === 'dashboard' ? 'Dashboard API' :
                       key === 'themes' ? 'Tema API' : key}
                    </span>
                    <div className="flex items-center space-x-2">
                      {value ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-green-600">Çalışıyor</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-red-600">Hata</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 