'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Target, Save, RefreshCw, Download, Bell, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useEffect, useState } from "react"
import Link from "next/link"

interface KPI {
  id: string
  code: string
  name: string
  description: string
  theme: string
  strategicTarget: {
    code: string
    name: string
  }
}

interface KPIValue {
  id?: string
  kpiId: string
  value: number | null
  period: string
  factoryId: string
}

interface Factory {
  id: string
  name: string
  code: string
}

interface PreviousValue {
  value: number
  period: string
}

export default function KPIEntryPage() {
  const [kpis, setKpis] = useState<KPI[]>([])
  const [factories, setFactories] = useState<Factory[]>([])
  const [values, setValues] = useState<{ [key: string]: number | null }>({})
  const [previousValues, setPreviousValues] = useState<{ [key: string]: PreviousValue }>({})
  const [selectedFactory, setSelectedFactory] = useState('')
  const [selectedPeriod, setSelectedPeriod] = useState('2024-Q1')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpisRes, factoriesRes] = await Promise.all([
          fetch('/api/kpis'),
          fetch('/api/factories')
        ])

        const [kpisData, factoriesData] = await Promise.all([
          kpisRes.json(),
          factoriesRes.json()
        ])

        setKpis(kpisData)
        setFactories(factoriesData)
        
        if (factoriesData.length > 0) {
          setSelectedFactory(factoriesData[0].id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    if (selectedFactory && selectedPeriod) {
      fetchKPIValues()
    }
  }, [selectedFactory, selectedPeriod])

  const fetchKPIValues = async () => {
    try {
      const response = await fetch(`/api/kpi-values?factory=${selectedFactory}&period=${selectedPeriod}`)
      const data = await response.json()
      
      const valuesMap: { [key: string]: number | null } = {}
      const previousMap: { [key: string]: PreviousValue } = {}
      
      data.forEach((item: any) => {
        valuesMap[item.kpiId] = item.value
        if (item.previousValue) {
          previousMap[item.kpiId] = {
            value: item.previousValue,
            period: item.previousPeriod
          }
        }
      })
      
      setValues(valuesMap)
      setPreviousValues(previousMap)
    } catch (error) {
      console.error('Error fetching KPI values:', error)
    }
  }

  const handleValueChange = (kpiId: string, value: string) => {
    const numValue = value === '' ? null : parseFloat(value)
    setValues(prev => ({ ...prev, [kpiId]: numValue }))
  }

  const saveValues = async () => {
    setSaving(true)
    try {
      const valuesToSave = Object.entries(values)
        .filter(([_, value]) => value !== null)
        .map(([kpiId, value]) => ({
          kpiId,
          value: value!,
          period: selectedPeriod,
          factoryId: selectedFactory
        }))

      const response = await fetch('/api/kpi-values', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ values: valuesToSave })
      })

      if (response.ok) {
        alert('KPI değerleri başarıyla kaydedildi!')
        fetchKPIValues() // Refresh data
      } else {
        alert('Kaydetme işleminde hata oluştu!')
      }
    } catch (error) {
      console.error('Error saving values:', error)
      alert('Kaydetme işleminde hata oluştu!')
    } finally {
      setSaving(false)
    }
  }

  const getThemeColor = (theme: string) => {
    switch (theme) {
      case 'Yalın': return 'bg-blue-50 text-blue-600 border-blue-200'
      case 'Dijital': return 'bg-green-50 text-green-600 border-green-200'
      case 'Yeşil': return 'bg-yellow-50 text-yellow-600 border-yellow-200'
      case 'Dirençlilik': return 'bg-red-50 text-red-600 border-red-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const getChangeIndicator = (current: number | null, previous: PreviousValue | undefined) => {
    if (!current || !previous) return null
    
    const change = current - previous.value
    const changePercent = Math.round((change / previous.value) * 100)
    
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600 text-xs">
          <TrendingUp className="h-3 w-3 mr-1" />
          +{changePercent}%
        </div>
      )
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600 text-xs">
          <TrendingDown className="h-3 w-3 mr-1" />
          {changePercent}%
        </div>
      )
    } else {
      return (
        <div className="flex items-center text-gray-600 text-xs">
          <Minus className="h-3 w-3 mr-1" />
          0%
        </div>
      )
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">KPI verileri yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard'a Dön</span>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Target className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">KPI Girişi</h1>
                  <p className="text-sm text-gray-500">Model Fabrika performans verileri</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Fabrika:</span>
                <select 
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white"
                  value={selectedFactory}
                  onChange={(e) => setSelectedFactory(e.target.value)}
                >
                  {factories.map(factory => (
                    <option key={factory.id} value={factory.id}>
                      {factory.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Dönem:</span>
                <select 
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="2024-Q1">2024 Q1</option>
                  <option value="2024-Q2">2024 Q2</option>
                  <option value="2024-Q3">2024 Q3</option>
                  <option value="2024-Q4">2024 Q4</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Yenile
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Dışa Aktar
                </Button>
                <Button 
                  onClick={saveValues}
                  disabled={saving}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">AY</span>
                </div>
                <span className="text-sm font-medium text-gray-900">Ahmet Yılmaz</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">KPI Veri Girişi</h2>
              <p className="text-gray-600">
                {factories.find(f => f.id === selectedFactory)?.name} - {selectedPeriod} dönemi
              </p>
            </div>
            <div className="flex space-x-4">
              <select className="px-4 py-2 border border-gray-300 rounded-md bg-white">
                <option>Tüm Temalar</option>
                <option>Yalın</option>
                <option>Dijital</option>
                <option>Yeşil</option>
                <option>Dirençlilik</option>
              </select>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Toplam KPI</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">{kpis.length}</div>
                  <div className="text-xs text-blue-600 mt-1">Veri giriş listesi</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Doldurulmuş</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {Object.values(values).filter(v => v !== null).length}
                  </div>
                  <div className="text-xs text-green-600 mt-1">Veri girildi</div>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Bekleyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {kpis.length - Object.values(values).filter(v => v !== null).length}
                  </div>
                  <div className="text-xs text-yellow-600 mt-1">Girilmedi</div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Tamamlanma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {Math.round((Object.values(values).filter(v => v !== null).length / kpis.length) * 100)}%
                  </div>
                  <div className="text-xs text-blue-600 mt-1">Genel ilerleme</div>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Data Entry Table */}
        <Card>
          <CardHeader>
            <CardTitle>KPI Veri Girişi</CardTitle>
            <CardDescription>
              Aşağıdaki tabloda her KPI için değer girebilirsiniz. Önceki dönem ile karşılaştırma otomatik hesaplanır.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">KPI Kodu</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">KPI Adı</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Tema</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">SH</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Önceki Dönem</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Güncel Değer</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Değişim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kpis.map((kpi) => (
                    <tr key={kpi.id} className="hover:bg-gray-50">
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm">{kpi.code}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{kpi.name}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{kpi.description}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full border ${getThemeColor(kpi.theme)}`}>
                          {kpi.theme}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-sm text-gray-600">{kpi.strategicTarget.code}</span>
                      </td>
                      <td className="py-4 px-4">
                        {previousValues[kpi.id] ? (
                          <div className="text-sm">
                            <span className="font-medium">{previousValues[kpi.id].value}</span>
                            <div className="text-xs text-gray-500">{previousValues[kpi.id].period}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <input
                          type="number"
                          step="0.01"
                          className="w-24 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          value={values[kpi.id] || ''}
                          onChange={(e) => handleValueChange(kpi.id, e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="py-4 px-4">
                        {getChangeIndicator(values[kpi.id], previousValues[kpi.id])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 