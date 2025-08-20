// Analitik API'leri için ortak yardımcı fonksiyonlar

export function getPeriodsFromRequest(searchParams: URLSearchParams): string[] {
  const periodsParam = searchParams.getAll('periods')
  return periodsParam.length > 0 ? periodsParam : [searchParams.get('period') || '2024-Q4']
}

export function getCurrentPeriod(periods: string[]): string {
  return periods[periods.length - 1]
}

export function getPreviousPeriod(currentPeriod: string): string {
  const [year, quarter] = currentPeriod.split('-')
  const currentYear = parseInt(year)
  const currentQuarter = parseInt(quarter.replace('Q', ''))

  if (currentQuarter === 1) {
    return `${currentYear - 1}-Q4`
  } else {
    return `${currentYear}-Q${currentQuarter - 1}`
  }
}

export function calculateKpiAverages(kpiValues: any[]): Record<string, { totalScore: number; count: number; periods: string[] }> {
  const kpiAverages: Record<string, { totalScore: number; count: number; periods: string[] }> = {}
  
  kpiValues.forEach(kv => {
    const kpiKey = kv.kpi.id
    if (!kpiAverages[kpiKey]) {
      kpiAverages[kpiKey] = { totalScore: 0, count: 0, periods: [] }
    }
    
    const target = kv.kpi.targetValue || 100
    const score = Math.min(100, (kv.value / target) * 100)
    
    kpiAverages[kpiKey].totalScore += score
    kpiAverages[kpiKey].count++
    kpiAverages[kpiKey].periods.push(kv.period)
  })
  
  return kpiAverages
}

export function calculateAverageScore(kpiAverages: Record<string, { totalScore: number; count: number; periods: string[] }>): number {
  const totalScore = Object.values(kpiAverages).reduce((sum, avg) => sum + (avg.totalScore / avg.count), 0)
  const totalCount = Object.keys(kpiAverages).length
  return totalCount > 0 ? totalScore / totalCount : 0
}

export function logApiCall(apiName: string, periods: string[], additionalInfo?: any) {
  console.log(`📊 ${apiName} API called:`, { periods, ...additionalInfo })
}
