import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { factoryId, period, reportType } = await request.json()
    
    console.log('📄 PDF export starting:', { factoryId, period, reportType })

    if (!factoryId) {
      return NextResponse.json({ error: 'Factory ID gerekli' }, { status: 400 })
    }

    // Fabrika bilgilerini al
    const factory = await prisma.modelFactory.findUnique({
      where: { id: factoryId }
    })

    if (!factory) {
      return NextResponse.json({ error: 'Fabrika bulunamadı' }, { status: 404 })
    }

    // KPI verilerini al
    const kpiData = await prisma.kpiValue.findMany({
      where: { factoryId, period },
      include: { 
        kpi: {
          include: {
            strategicTarget: {
              include: {
                strategicGoal: true
              }
            }
          }
        }
      },
      orderBy: { kpi: { number: 'asc' } }
    })

    // HTML raporu oluştur
    const htmlContent = generateHTMLReport(factory, kpiData, period, reportType)

    // Basit PDF response (HTML as PDF simulation)
    // Production'da puppeteer veya benzeri kullanılabilir
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${factory.code}_${reportType || 'report'}_${period}_${timestamp}.html`

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      }
    })

  } catch (error) {
    console.error('❌ PDF export error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'PDF raporu oluşturulamadı',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}

function generateHTMLReport(factory: any, kpiData: any[], period: string, reportType: string): string {
  const timestamp = new Date().toLocaleDateString('tr-TR')
  const totalKpis = kpiData.length
  const achievedKpis = kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) >= 1).length
  const criticalKpis = kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) < 0.5).length
  const avgSuccess = (kpiData.reduce((sum, k) => sum + (k.value / (k.kpi.targetValue || 100)), 0) / totalKpis * 100).toFixed(1)

  return `
<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${factory.name} - KPI Performans Raporu</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: #f8f9fa;
            padding: 20px;
        }
        .container { 
            max-width: 1200px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 10px; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { font-size: 1.2em; opacity: 0.9; }
        .content { padding: 30px; }
        .summary { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px; 
        }
        .summary-card { 
            background: #f8f9fa; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center; 
            border-left: 4px solid #667eea; 
        }
        .summary-card h3 { color: #667eea; font-size: 2em; margin-bottom: 5px; }
        .summary-card p { color: #666; font-weight: 500; }
        .table-container { margin-top: 30px; }
        table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 20px; 
            background: white; 
            border-radius: 8px; 
            overflow: hidden; 
            box-shadow: 0 2px 4px rgba(0,0,0,0.1); 
        }
        th { 
            background: #667eea; 
            color: white; 
            padding: 15px 10px; 
            text-align: left; 
            font-weight: 600; 
        }
        td { 
            padding: 12px 10px; 
            border-bottom: 1px solid #eee; 
        }
        tr:nth-child(even) { background: #f8f9fa; }
        tr:hover { background: #e3f2fd; }
        .status { 
            padding: 4px 8px; 
            border-radius: 20px; 
            font-size: 0.85em; 
            font-weight: 600; 
            text-align: center; 
        }
        .status.excellent { background: #d4edda; color: #155724; }
        .status.good { background: #cce5ff; color: #004085; }
        .status.average { background: #fff3cd; color: #856404; }
        .status.critical { background: #f8d7da; color: #721c24; }
        .footer { 
            background: #f8f9fa; 
            padding: 20px 30px; 
            border-top: 1px solid #eee; 
            text-align: center; 
            color: #666; 
        }
        .chart-container { 
            margin: 20px 0; 
            padding: 20px; 
            background: #f8f9fa; 
            border-radius: 8px; 
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${factory.name} KPI Raporu</h1>
            <p>${period} Dönemi Performans Analizi</p>
            <p style="margin-top: 10px; font-size: 1em;">Rapor Tarihi: ${timestamp}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="summary-card">
                    <h3>${totalKpis}</h3>
                    <p>Toplam KPI</p>
                </div>
                <div class="summary-card">
                    <h3>${achievedKpis}</h3>
                    <p>Hedef Aşan</p>
                </div>
                <div class="summary-card">
                    <h3>${criticalKpis}</h3>
                    <p>Kritik Durum</p>
                </div>
                <div class="summary-card">
                    <h3>%${avgSuccess}</h3>
                    <p>Ortalama Başarı</p>
                </div>
            </div>

            <div class="chart-container">
                <h3 style="margin-bottom: 15px; color: #667eea;">📊 Performans Dağılımı</h3>
                <div style="display: flex; gap: 10px; align-items: end; height: 200px; padding: 20px; background: white; border-radius: 6px;">
                    ${generateSimpleChart(kpiData)}
                </div>
            </div>
            
            <div class="table-container">
                <h3 style="color: #667eea; margin-bottom: 15px;">📋 KPI Detay Analizi</h3>
                <table>
                    <thead>
                        <tr>
                            <th>KPI No</th>
                            <th>Açıklama</th>
                            <th>Mevcut</th>
                            <th>Hedef</th>
                            <th>Başarı %</th>
                            <th>Durum</th>
                            <th>Stratejik Hedef</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${kpiData.map(item => {
                          const achievementRate = ((item.value / (item.kpi.targetValue || 100)) * 100)
                          const status = achievementRate >= 100 ? 'excellent' :
                                        achievementRate >= 80 ? 'good' :
                                        achievementRate >= 50 ? 'average' : 'critical'
                          const statusText = achievementRate >= 100 ? 'Mükemmel' :
                                           achievementRate >= 80 ? 'İyi' :
                                           achievementRate >= 50 ? 'Orta' : 'Kritik'
                          
                          return `
                            <tr>
                                <td><strong>${item.kpi.number}</strong></td>
                                <td>${item.kpi.description.substring(0, 80)}${item.kpi.description.length > 80 ? '...' : ''}</td>
                                <td>${item.value.toFixed(2)}</td>
                                <td>${item.kpi.targetValue || 100}</td>
                                <td><strong>${achievementRate.toFixed(1)}%</strong></td>
                                <td><span class="status ${status}">${statusText}</span></td>
                                <td>${item.kpi.strategicTarget?.name || '-'}</td>
                            </tr>
                          `
                        }).join('')}
                    </tbody>
                </table>
            </div>

            <div style="margin-top: 30px; padding: 20px; background: #e3f2fd; border-radius: 8px; border-left: 4px solid #2196f3;">
                <h3 style="color: #1976d2; margin-bottom: 10px;">💡 Önemli Notlar</h3>
                <ul style="color: #1565c0; line-height: 1.8;">
                    <li><strong>Kritik KPI'lar:</strong> %50'nin altındaki KPI'lar için acil eylem planı gereklidir.</li>
                    <li><strong>Trend Takibi:</strong> Düzenli olarak performans takibi yapılması önerilir.</li>
                    <li><strong>Benchmark:</strong> Diğer fabrikalarla karşılaştırma için benchmark raporunu inceleyin.</li>
                    <li><strong>AI Önerileri:</strong> Detaylı iyileştirme önerileri için AI analiz raporunu kontrol edin.</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>${factory.name}</strong> • ${factory.code} • KPI Yönetim Sistemi</p>
            <p style="margin-top: 5px; font-size: 0.9em;">Bu rapor otomatik olarak oluşturulmuştur • ${timestamp}</p>
        </div>
    </div>
</body>
</html>
  `
}

function generateSimpleChart(kpiData: any[]): string {
  const categories = [
    { name: 'Kritik (<50%)', color: '#f44336', count: kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) < 0.5).length },
    { name: 'Orta (50-80%)', color: '#ff9800', count: kpiData.filter(k => { const r = (k.value / (k.kpi.targetValue || 100)); return r >= 0.5 && r < 0.8; }).length },
    { name: 'İyi (80-100%)', color: '#2196f3', count: kpiData.filter(k => { const r = (k.value / (k.kpi.targetValue || 100)); return r >= 0.8 && r < 1; }).length },
    { name: 'Mükemmel (≥100%)', color: '#4caf50', count: kpiData.filter(k => (k.value / (k.kpi.targetValue || 100)) >= 1).length }
  ]
  
  const maxCount = Math.max(...categories.map(c => c.count), 1)
  
  return categories.map(cat => `
    <div style="flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;">
      <div style="
        width: 100%; 
        height: ${(cat.count / maxCount) * 150}px; 
        background: ${cat.color}; 
        border-radius: 4px 4px 0 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 1.2em;
      ">${cat.count}</div>
      <div style="font-size: 0.85em; text-align: center; color: #666; line-height: 1.3;">
        ${cat.name}
      </div>
    </div>
  `).join('')
}
