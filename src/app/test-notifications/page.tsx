'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestNotifications() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)
  
  const factoryId = 'cmebmec090004gpveghxdwyuw' // Kayseri

  const testGenerateAndSave = async () => {
    setLoading(true)
    setResult('Testing...')
    
    try {
      // 1. Bildirimler oluştur
      console.log('🔔 Step 1: Generating notifications...')
      const generateResponse = await fetch('/api/notifications/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ factoryId, period: '2024-Q4' })
      })
      
      if (!generateResponse.ok) {
        throw new Error(`Generate failed: ${generateResponse.status}`)
      }
      
      const generateData = await generateResponse.json()
      console.log('✅ Generated:', generateData.summary)
      
      // 2. Bildirimleri kaydet
      console.log('💾 Step 2: Saving notifications...')
      const saveResponse = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          factoryId, 
          notifications: generateData.notifications 
        })
      })
      
      if (!saveResponse.ok) {
        throw new Error(`Save failed: ${saveResponse.status}`)
      }
      
      const saveData = await saveResponse.json()
      console.log('✅ Saved:', saveData)
      
      // 3. Bildirimleri oku
      console.log('📖 Step 3: Reading notifications...')
      const readResponse = await fetch(`/api/notifications?factoryId=${factoryId}&limit=5`)
      
      if (!readResponse.ok) {
        throw new Error(`Read failed: ${readResponse.status}`)
      }
      
      const readData = await readResponse.json()
      console.log('✅ Read:', readData.stats)
      
      setResult(`✅ Başarılı! 
Generated: ${generateData.summary.total} bildirim
Saved: ${saveData.count} bildirim  
Retrieved: ${readData.stats.total} bildirim (${readData.stats.unread} okunmamış)`)
      
    } catch (error) {
      console.error('❌ Test failed:', error)
      setResult(`❌ Hata: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testRead = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/notifications?factoryId=${factoryId}&limit=10`)
      const data = await response.json()
      console.log('📖 Current notifications:', data)
      setResult(`📖 Mevcut: ${data.stats.total} bildirim (${data.stats.unread} okunmamış)`)
    } catch (error) {
      console.error('❌ Read failed:', error)
      setResult(`❌ Okuma hatası: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔔 Bildirim Sistemi Test</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-4">
              <button
                onClick={testGenerateAndSave}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Test Ediliyor...' : '🚀 Bildirim Oluştur ve Kaydet'}
              </button>
              
              <button
                onClick={testRead}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                📖 Mevcut Bildirimleri Oku
              </button>
            </div>
            
            {result && (
              <div className="p-4 bg-gray-100 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm">{result}</pre>
              </div>
            )}
            
            <div className="text-sm text-gray-600">
              <p><strong>Factory ID:</strong> {factoryId}</p>
              <p><strong>Konsolu açın</strong> detaylı log'lar için (F12)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
