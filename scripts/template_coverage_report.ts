// Template Coverage Report Script

import { CORE_EVIDENCE_TEMPLATES } from '../src/lib/evidence-templates-core'

function generateCoverageReport() {
  console.log('📊 KPI Evidence Template Coverage Report (Core)')
  console.log('=' .repeat(50))
  
  const summary = CORE_EVIDENCE_TEMPLATES.map(template => ({
    kpiNumber: template.kpiNumber,
    shCode: template.shCode,
    kpiTitle: template.kpiTitle,
    requiredCount: template.requiredEvidences.filter(e => e.type === 'required').length,
    recommendedCount: template.requiredEvidences.filter(e => e.type === 'recommended').length,
    optionalCount: template.requiredEvidences.filter(e => e.type === 'optional').length,
    aiMethodsCount: template.aiAnalysisMethods.length
  }))
  
  console.log(`\n📈 Overall Statistics:`)
  console.log(`• Total KPIs: ${summary.length}/41`)
  console.log(`• Total Required Evidences: ${summary.reduce((sum, kpi) => sum + kpi.requiredCount, 0)}`)
  console.log(`• Total Recommended Evidences: ${summary.reduce((sum, kpi) => sum + kpi.recommendedCount, 0)}`)
  console.log(`• Total Optional Evidences: ${summary.reduce((sum, kpi) => sum + kpi.optionalCount, 0)}`)
  console.log(`• Total AI Methods: ${summary.reduce((sum, kpi) => sum + kpi.aiMethodsCount, 0)}`)
  
  // SH Code breakdown
  const shGroups = summary.reduce((groups: any, kpi) => {
    const shCode = kpi.shCode
    if (!groups[shCode]) {
      groups[shCode] = { count: 0, kpis: [] }
    }
    groups[shCode].count++
    groups[shCode].kpis.push(kpi.kpiNumber)
    return groups
  }, {})
  
  console.log(`\n🎯 Strategic Target Breakdown:`)
  Object.entries(shGroups).forEach(([shCode, data]: [string, any]) => {
    console.log(`• ${shCode}: ${data.count} KPIs (${data.kpis.join(', ')})`)
  })
  
  // Coverage by detail level
  const detailedKPIs = summary.filter(kpi => kpi.requiredCount >= 2 && kpi.aiMethodsCount >= 3)
  const basicKPIs = summary.filter(kpi => kpi.requiredCount < 2 || kpi.aiMethodsCount < 3)
  
  console.log(`\n📋 Detail Level Analysis:`)
  console.log(`• Detailed Templates (≥2 required evidences, ≥3 AI methods): ${detailedKPIs.length}`)
  console.log(`• Basic Templates: ${basicKPIs.length}`)
  
  // Top KPIs by evidence count
  const topKPIs = summary
    .sort((a, b) => (b.requiredCount + b.recommendedCount + b.optionalCount) - (a.requiredCount + a.recommendedCount + a.optionalCount))
    .slice(0, 5)
  
  console.log(`\n🏆 Top 5 KPIs by Evidence Count:`)
  topKPIs.forEach((kpi, idx) => {
    const total = kpi.requiredCount + kpi.recommendedCount + kpi.optionalCount
    console.log(`${idx + 1}. KPI ${kpi.kpiNumber} (${kpi.shCode}): ${total} evidences`)
  })
  
  // File type analysis
  const fileTypes: Record<string, number> = {}
  CORE_EVIDENCE_TEMPLATES.forEach(template => {
    template.requiredEvidences.forEach(evidence => {
      evidence.fileType.forEach(type => {
        fileTypes[type] = (fileTypes[type] || 0) + 1
      })
    })
  })
  
  console.log(`\n📁 File Type Distribution:`)
  Object.entries(fileTypes)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`• ${type}: ${count} occurrences`)
    })
  
  console.log(`\n🔧 Implementation Status:`)
  console.log(`• Core Evidence Templates: ✅ Active (${summary.length} KPIs)`)
  console.log(`• Full Template Library: 🔄 Optimized (moved to lazy load)`)
  console.log(`• Page Performance: ✅ Fixed (fast loading)`)
  console.log(`• Template UI Integration: ✅ Working`)
  console.log(`• Validation Rules: ⚠️  Pending (next step)`)
  console.log(`• AI Analysis Methods: ⚠️  Pending (kanıt.txt based)`)
  
  console.log(`\n🎯 Next Development Priorities:`)
  console.log(`1. Upload validation with template rules`)
  console.log(`2. KPI-specific AI analysis implementation`) 
  console.log(`3. Excel/CSV template generation`)
  console.log(`4. Advanced AI pipeline (7 steps from kanıt.txt)`)
  console.log(`5. Sector heatmaps and analytics`)
}

generateCoverageReport()
