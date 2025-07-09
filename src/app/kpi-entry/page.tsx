'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, TrendingUp, TrendingDown, Calendar, Factory, Search, AlertCircle, CheckCircle } from 'lucide-react';

interface KPI {
  id: string;
  name: string;
  description: string;
  themes: string;
  shCode: string;
  unit?: string;
  targetValue?: number;
  strategicTarget: {
    id: string;
    code: string;
    title?: string;
    strategicGoal: {
      id: string;
      code: string;
      title: string;
    }
  };
  kpiValues: Array<{
    id: string;
    value: number;
    period: string;
  }>;
}

interface Factory {
  id: string;
  name: string;
  code: string;
}

interface KPIValue {
  id: string;
  kpiId: string;
  period: string;
  value: number;
  target: number;
  previousValue?: number;
}

export default function KPIEntryPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [factories, setFactories] = useState<Factory[]>([]);
  const [kpiValues, setKpiValues] = useState<KPIValue[]>([]);
  const [selectedFactory, setSelectedFactory] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('2024-Q4');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('Starting data fetch...');
        const baseUrl = window.location.origin;
        
        const [kpisRes, factoriesRes] = await Promise.all([
          fetch(`${baseUrl}/api/kpis`),
          fetch(`${baseUrl}/api/factories`)
        ]);
        
        console.log('Got responses:', { kpisStatus: kpisRes.status, factoriesStatus: factoriesRes.status });
        
        const kpisData = await kpisRes.json();
        const factoriesData = await factoriesRes.json();
        
        console.log('Parsed data:', { kpisCount: kpisData.length, factoriesCount: factoriesData.length });
        
        setKpis(kpisData);
        setFactories(factoriesData);
        
        if (factoriesData.length > 0) {
          setSelectedFactory(factoriesData[0].code);
          console.log('Selected factory:', factoriesData[0].code);
        }
        
        console.log('Setting loading to false');
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchKPIValues = useCallback(async () => {
    try {
      // Factory code'unu factory ID'ye çevir
      const selectedFactoryData = factories.find(f => f.code === selectedFactory);
      if (!selectedFactoryData) {
        console.error('Selected factory not found');
        setKpiValues([]);
        return;
      }
      
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/kpi-values?factory=${selectedFactoryData.id}&period=${selectedPeriod}`);
      const data = await response.json();
      setKpiValues(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching KPI values:', error);
      setKpiValues([]);
    }
  }, [selectedFactory, selectedPeriod, factories]);

  // Fetch KPI values when factory or period changes
  useEffect(() => {
    if (selectedFactory && selectedPeriod && factories.length > 0) {
      fetchKPIValues();
    }
  }, [selectedFactory, selectedPeriod, factories, fetchKPIValues]);

  const handleValueChange = (kpiId: string, value: number) => {
    setKpiValues(prev => {
      const existing = prev.find(kv => kv.kpiId === kpiId);
      if (existing) {
        return prev.map(kv => 
          kv.kpiId === kpiId ? { ...kv, value } : kv
        );
      } else {
        const newValue: KPIValue = {
          id: `temp-${kpiId}`,
          kpiId,
          period: selectedPeriod,
          value,
          target: 100, // Default target
        };
        return [...prev, newValue];
      }
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      // Factory code'unu factory ID'ye çevir
      const selectedFactoryData = factories.find(f => f.code === selectedFactory);
      if (!selectedFactoryData) {
        console.error('Selected factory not found');
        setSaveStatus('error');
        setSaving(false);
        return;
      }

      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/kpi-values`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: kpiValues.map(kv => ({
            kpiId: kv.kpiId,
            value: kv.value,
            period: selectedPeriod,
            factoryId: selectedFactoryData.id
          }))
        }),
      });

      if (response.ok) {
        setSaveStatus('success');
        await fetchKPIValues(); // Refresh data
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Error saving KPI values:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const getKPIValue = (kpiId: string) => {
    const kpiValue = kpiValues.find(kv => kv.kpiId === kpiId);
    return kpiValue?.value || 0;
  };

  const getPreviousValue = (kpiId: string) => {
    const kpiValue = kpiValues.find(kv => kv.kpiId === kpiId);
    return kpiValue?.previousValue;
  };

  const getPercentageChange = (current: number, previous?: number) => {
    if (!previous || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const getThemeColor = (themes: string) => {
    if (!themes) return 'bg-gray-100 text-gray-800';
    if (themes.includes('LEAN')) return 'bg-blue-100 text-blue-800';
    if (themes.includes('DIGITAL')) return 'bg-purple-100 text-purple-800';
    if (themes.includes('GREEN')) return 'bg-green-100 text-green-800';
    if (themes.includes('RESILIENCE')) return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  const filteredKpis = kpis.filter(kpi =>
    kpi && kpi.name && kpi.description && kpi.shCode && (
      kpi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      kpi.shCode.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const selectedFactoryName = factories.find(f => f.code === selectedFactory)?.name || selectedFactory;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Dashboard'a Dön</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="text-2xl font-bold text-gray-900">KPI Girişi</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <span className="sr-only">Bildirimler</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">U</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Kullanıcı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Toplam KPI</p>
                <p className="text-2xl font-bold text-gray-900">{kpis?.length || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Girilen Değer</p>
                <p className="text-2xl font-bold text-gray-900">{kpiValues.filter(kv => kv.value > 0).length}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tamamlanma</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpis?.length ? Math.round((kpiValues.filter(kv => kv.value > 0).length / kpis.length) * 100) : 0}%
                </p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Factory className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ortalama Değer</p>
                <p className="text-2xl font-bold text-gray-900">
                  {kpiValues.length > 0 ? Math.round(kpiValues.reduce((sum, kv) => sum + kv.value, 0) / kpiValues.length) : 0}
                </p>
              </div>
              <div className="h-12 w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Veri Giriş Parametreleri</h2>
          <p className="text-sm text-gray-600 mb-6">Lütfen KPI girişi yapacağınız fabrika ve dönemi seçin</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Model Fabrika
              </label>
              <select
                value={selectedFactory}
                onChange={(e) => setSelectedFactory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {factories.map((factory) => (
                  <option key={factory.id} value={factory.code}>
                    {factory.name} ({factory.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dönem
              </label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="2024-Q4">2024 - 4. Çeyrek</option>
                <option value="2024-Q3">2024 - 3. Çeyrek</option>
                <option value="2024-Q2">2024 - 2. Çeyrek</option>
                <option value="2024-Q1">2024 - 1. Çeyrek</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                KPI Ara
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="KPI adı, açıklama veya SH kodu..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* KPI Card Grid Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              KPI Değerleri - {selectedFactoryName} - {selectedPeriod} dönemi
            </h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Kaydediliyor...' : 'Kaydet'}</span>
            </button>
          </div>
          
          {/* Save Status */}
          {saveStatus === 'success' && (
            <div className="mt-3 flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">KPI değerleri başarıyla kaydedildi!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="mt-3 flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">Kaydetme sırasında bir hata oluştu!</span>
            </div>
          )}
        </div>

        {/* KPI Cards Grid */}
        {filteredKpis.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">KPI Bulunamadı</h3>
            <p className="text-gray-500">Arama kriterlerinize uygun KPI bulunamadı. Lütfen arama terimini değiştirin.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredKpis.map((kpi, index) => {
              if (!kpi || !kpi.id) return null;
              
              const currentValue = getKPIValue(kpi.id);
              const previousValue = getPreviousValue(kpi.id);
              const percentageChange = getPercentageChange(currentValue, previousValue);

              return (
                <div key={kpi.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  {/* Card Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-blue-600 font-semibold text-sm">#{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 text-sm leading-tight">
                          {kpi.name || 'KPI'}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${getThemeColor(kpi.themes || '')}`}>
                          {kpi.themes || 'N/A'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-1">SH Kodu</div>
                      <div className="font-semibold text-gray-900 text-sm">{kpi.shCode || 'N/A'}</div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                    {kpi.description || 'Açıklama mevcut değil'}
                  </p>

                  {/* Values Section */}
                  <div className="space-y-4">
                    {/* Previous Value */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Önceki Dönem</div>
                        <div className="font-semibold text-gray-700">
                          {previousValue !== undefined ? previousValue.toLocaleString() : '0'}
                        </div>
                      </div>
                      {percentageChange !== null && (
                        <div className="flex items-center space-x-1">
                          {percentageChange >= 0 ? (
                            <TrendingUp className="h-4 w-4 text-green-500" />
                          ) : (
                            <TrendingDown className="h-4 w-4 text-red-500" />
                          )}
                          <span className={`text-sm font-medium ${
                            percentageChange >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Current Value Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mevcut Dönem Değeri
                      </label>
                      <input
                        type="number"
                        value={currentValue}
                        onChange={(e) => handleValueChange(kpi.id, Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                        step="0.01"
                        min="0"
                        placeholder="Değer girin"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 