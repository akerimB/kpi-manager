export interface KnowledgeInsight {
  level: 'portfolio' | 'strategic_goal' | 'factory' | 'cross_factory'
  title: string
  description: string
  priority: 'immediate' | 'high' | 'medium' | 'low'
  strategicGoal?: { code?: string; name?: string }
  strategicTarget?: { code?: string; name?: string }
  kpis?: Array<{ id: string; number?: number; name?: string; achievement?: number; trend?: number }>
  factories?: Array<{ id: string; name: string; achievement?: number; trend?: number }>
  actions?: Array<{ name: string; category: string; owner: string; due: string; effort: 'S' | 'M' | 'L'; expectedImpact: string }>
  pairings?: Array<{ donorFactory: string; receiverFactory: string; kpi?: string; rationale: string }>
}

interface KPIValueLite {
  factoryId: string
  factoryName: string
  kpiId: string
  kpiNumber?: number
  kpiName?: string
  period: string
  value: number
  target?: number
  sa?: { code?: string; title?: string } | null
  sh?: { code?: string; title?: string } | null
}

export function generateKnowledgeInsights(values: KPIValueLite[], periods: string[]): {
  insights: KnowledgeInsight[]
  summaries: { bySA: Array<{ code?: string; name?: string; avg: number; trend: number; factories: number }> }
} {
  if (!values.length) return { insights: [], summaries: { bySA: [] } }

  const firstPeriod = periods[0]
  const lastPeriod = periods[periods.length - 1]

  // Aggregate achievement per KPI/factory
  const key = (f: string, k: string) => `${f}::${k}`
  const agg: Record<string, { sum: number; cnt: number; first?: number; last?: number; meta: KPIValueLite } > = {}
  values.forEach(v => {
    const k = key(v.factoryId, v.kpiId)
    const target = v.target || 100
    const ach = Math.min(100, (v.value / target) * 100)
    if (!agg[k]) agg[k] = { sum: 0, cnt: 0, meta: v }
    agg[k].sum += ach
    agg[k].cnt += 1
    if (v.period === firstPeriod) agg[k].first = ach
    if (v.period === lastPeriod) agg[k].last = ach
  })

  // SA portfolio picture
  const bySA: Record<string, { name?: string; sum: number; cnt: number; first: number; last: number; factories: Set<string> }> = {}
  Object.values(agg).forEach(a => {
    const saCode = a.meta.sa?.code || 'UNKNOWN'
    if (!bySA[saCode]) bySA[saCode] = { name: a.meta.sa?.title, sum: 0, cnt: 0, first: 0, last: 0, factories: new Set() }
    const avg = a.sum / a.cnt
    bySA[saCode].sum += avg
    bySA[saCode].cnt += 1
    if (a.first != null) bySA[saCode].first += a.first
    if (a.last != null) bySA[saCode].last += a.last
    bySA[saCode].factories.add(a.meta.factoryId)
  })

  const saSummary = Object.entries(bySA).map(([code, s]) => {
    const avg = s.cnt ? s.sum / s.cnt : 0
    const first = s.cnt ? s.first / s.cnt : 0
    const last = s.cnt ? s.last / s.cnt : 0
    const trend = last - first
    return { code, name: s.name, avg: round(avg), trend: round(trend), factories: s.factories.size }
  }).sort((a,b)=>a.avg-b.avg)

  const insights: KnowledgeInsight[] = []

  // Portfolio focus: lowest SA with negative trend
  saSummary.slice(0, 2).forEach(sa => {
    insights.push({
      level: 'strategic_goal',
      title: `Odak SA: ${sa.name || sa.code}`,
      description: `Ortalama başarı ${sa.avg}% ve trend ${sa.trend >= 0 ? '+' : ''}${sa.trend} puan. Bu alanda programatik iyileştirme önerilir.`,
      priority: sa.avg < 60 || sa.trend < 0 ? 'high' : 'medium',
      strategicGoal: { code: sa.code, name: sa.name },
      actions: buildProgramActions(sa)
    })
  })

  // Factory ranking within worst SA
  const worstSA = saSummary[0]?.code
  if (worstSA) {
    const factoryScores: Record<string, { name: string; sum: number; cnt: number }> = {}
    Object.values(agg).forEach(a=>{
      if ((a.meta.sa?.code || 'UNKNOWN') !== worstSA) return
      const avg = a.sum / a.cnt
      if (!factoryScores[a.meta.factoryId]) factoryScores[a.meta.factoryId] = { name: a.meta.factoryName, sum: 0, cnt: 0 }
      factoryScores[a.meta.factoryId].sum += avg
      factoryScores[a.meta.factoryId].cnt += 1
    })
    const ranked = Object.entries(factoryScores).map(([id, s])=>({ id, name: s.name, score: s.cnt? s.sum/s.cnt:0 }))
      .sort((a,b)=>a.score-b.score)
    const receivers = ranked.slice(0, Math.max(1, Math.round(ranked.length*0.3)))
    const donors = ranked.slice(-Math.max(1, Math.round(ranked.length*0.2)))
    const pairings = [] as KnowledgeInsight['pairings']
    receivers.forEach(r => {
      const d = donors[Math.floor(Math.random()*donors.length)]
      pairings.push({ donorFactory: d.name, receiverFactory: r.name, rationale: `${worstSA} alanında deneyim transferi` })
    })
    insights.push({
      level: 'cross_factory',
      title: `En zayıf SA (${bySA[worstSA].name || worstSA}) için mentörlük eşleştirmeleri`,
      description: 'En iyi uygulamaların paylaşılarak hızlı iyileştirme sağlanması',
      priority: 'high',
      strategicGoal: { code: worstSA, name: bySA[worstSA].name },
      pairings
    })
  }

  // Factory-level top-3 actions
  const byFactory: Record<string, { name: string; score: number; actions: KnowledgeInsight['actions'] }> = {}
  Object.values(agg).forEach(a => {
    const avg = a.sum / a.cnt
    if (!byFactory[a.meta.factoryId]) byFactory[a.meta.factoryId] = { name: a.meta.factoryName, score: 0, actions: [] }
    byFactory[a.meta.factoryId].score += avg
    const rec = actionForKPI(a.meta, avg, (a.last ?? avg) - (a.first ?? avg))
    if (rec) byFactory[a.meta.factoryId].actions!.push(rec)
  })
  Object.entries(byFactory).forEach(([id, f]) => {
    const actions = (f.actions || []).slice(0, 5)
    insights.push({
      level: 'factory',
      title: `${f.name} için önerilen eylemler`,
      description: 'KPI/SH bağlamında öncelikli aksiyonlar',
      priority: 'medium',
      factories: [{ id, name: f.name }],
      // Fabrika düzeyi öneriler en zayıf SA altında gruplanır
      strategicGoal: saSummary[0] ? { code: saSummary[0].code, name: saSummary[0].name } : undefined,
      actions
    })
  })

  return { insights, summaries: { bySA: saSummary } }
}

function actionForKPI(meta: KPIValueLite, achievement: number, trend: number): KnowledgeInsight['actions'][number] | null {
  const name = meta.kpiName || `KPI ${meta.kpiNumber}`
  const due = nextQuarter()
  // rule of thumb based on tag keywords
  const t = (name + ' ' + (meta.sh?.title || '') + ' ' + (meta.sa?.title || '')).toLowerCase()
  // TR + EN eşleştirmeleri
  if (/(oee|availability|uygunluk|kullanılabilirlik|downtime|arıza|mtbf|mttr)/.test(t)) {
    return { name: 'TPM/SMED programı', category: 'TPM', owner: 'Bakım & Üretim', due, effort: 'M', expectedImpact: 'OEE +5-10 puan' }
  }
  if (/(delivery|on-time|zamanında|lead time|çevrim süresi|cycle)/.test(t)) {
    return { name: 'Akış iyileştirme (WIP kontrol, çekme sistemi)', category: 'LEAN', owner: 'Üretim Planlama', due, effort: 'M', expectedImpact: 'Teslimat +5-10 puan' }
  }
  if (/(quality|kalite|hata|defect|ppm|yield|verim|ftq|scrap|yeniden iş)/.test(t)) {
    return { name: 'Kalite iyileştirme (SPC/Poka‑Yoke/8D)', category: 'QUALITY', owner: 'Kalite', due, effort: 'M', expectedImpact: 'Hata oranı -20%' }
  }
  if (/(energy|enerji|emission|emisyon|carbon|karbon|co2|sustain|sürdürülebilirlik)/.test(t)) {
    return { name: 'Enerji izleme ve azaltım', category: 'SUSTAINABILITY', owner: 'Enerji', due, effort: 'S', expectedImpact: 'Enerji yoğunluğu -5%' }
  }
  if (/(inventory|stok|wip|working capital|işletme sermayesi|cost|maliyet|cogs)/.test(t)) {
    return { name: 'Stok Optimizasyonu & Maliyet İyileştirme', category: 'COST', owner: 'Finans/LOJ', due, effort: 'M', expectedImpact: 'Stok günleri -10%' }
  }
  if (/(eğitim|atölye|mentorluk|koçluk|train|workshop|mentor)/.test(t)) {
    return { name: 'Eğitim→Uygulama dönüşüm programı (90‑gün sprint)', category: 'PROGRAM', owner: 'Dönüşüm Ofisi', due, effort: 'M', expectedImpact: 'Benimseme oranı +15 puan' }
  }
  if (/(5s|A3|kaizen)/i.test(t)) {
    return { name: '5S / A3 Kaizen Sprinti', category: 'LEAN', owner: 'MF Mentör', due, effort: 'S', expectedImpact: '5S≥70’te artış' }
  }
  // default generic improvement
  if (achievement < 70 || trend < 0) {
    return { name: 'A3/Kaizen Problem Çözme', category: 'KAIZEN', owner: 'Süreç Sahibi', due, effort: 'S', expectedImpact: 'Hedefe yakınsama' }
  }
  return null
}

function buildProgramActions(sa: { code?: string; name?: string }): KnowledgeInsight['actions'] {
  return [
    { name: 'Gemba ve Benchmark turu', category: 'BEST_PRACTICE', owner: 'Üst Yönetim', due: nextQuarter(), effort: 'S', expectedImpact: 'Hızlı öğrenme ve yayılım' },
    { name: 'Tema bazlı çalışma grupları', category: 'PROGRAM', owner: 'Dönüşüm Ofisi', due: nextQuarter(), effort: 'M', expectedImpact: 'Çapraz-fabrika sinerji' },
    { name: 'Aksiyonların OKR ile hizalanması', category: 'GOVERNANCE', owner: 'Strateji', due: nextQuarter(), effort: 'S', expectedImpact: 'Odak ve görünürlük' }
  ]
}

function nextQuarter(): string {
  const d = new Date()
  let q = Math.floor(d.getMonth() / 3) + 2
  let y = d.getFullYear()
  if (q > 4) { q = 1; y += 1 }
  return `${y}-Q${q}`
}

function round(n: number): number { return Math.round(n * 10) / 10 }


