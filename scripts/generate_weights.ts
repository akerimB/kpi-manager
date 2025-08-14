import fs from 'fs'
import path from 'path'
import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

function normalizeText(s: string | null | undefined): string {
  return (s || '').toLowerCase()
}

async function main() {
  // KPI ağırlıkları (SH içi)
  const kpis = await prisma.kpi.findMany({ include: { strategicTarget: true } })
  const kpiRows: string[][] = [[
    'kpiNumber','kpiId','shCode','score_keywords','score_theme','score_shHint','rawScore','weight'
  ]]
  const shToKpis: Record<string, { id: string; number: number; score: number }[]> = {}
  for (const k of kpis) {
    const d = normalizeText(k.description)
    const themes = (k.themes || '').split(',').map(t => t.trim()).filter(Boolean)
    let scoreKeywords = 0
    if (/eğitim|sertifika|atölye|mentorluk|staj/.test(d)) scoreKeywords += 1
    if (/verim|oee|iyileştirme|standart/.test(d)) scoreKeywords += 1
    if (/dijital|erp|crm|lms|otomasyon|platform|simülasyon/.test(d)) scoreKeywords += 1
    if (/yeşil|enerji|karbon|çevre|sürdürülebil/.test(d)) scoreKeywords += 1
    if (/risk|güvenlik|direnç|kriz|süreklilik/.test(d)) scoreKeywords += 1
    const scoreTheme = themes.length >= 2 ? 1 : 0.5
    const scoreShHint = k.strategicTarget.code.startsWith('SH1.') ? 0.6 : 0.5
    const raw = scoreKeywords + scoreTheme + scoreShHint
    if (!shToKpis[k.strategicTarget.code]) shToKpis[k.strategicTarget.code] = []
    shToKpis[k.strategicTarget.code].push({ id: k.id, number: k.number, score: raw })
  }
  for (const shCode of Object.keys(shToKpis)) {
    const list = shToKpis[shCode]
    const sum = list.reduce((s, x) => s + x.score, 0) || 1
    for (const item of list) {
      const w = item.score / sum
      await prisma.kpi.update({ where: { id: item.id }, data: { shWeight: w } })
      kpiRows.push([
        String(item.number), item.id, shCode,
        '-', '-', '-', item.score.toFixed(4), w.toFixed(4)
      ])
    }
  }

  // SH ağırlıkları (SA içi)
  const targets = await prisma.strategicTarget.findMany({ include: { strategicGoal: true, kpis: true } })
  const shRows: string[][] = [[
    'shCode','saCode','kpiCount','hasDigital','hasGreen','hasResilience','rawScore','weight'
  ]]
  const saToSh: Record<string, { id: string; code: string; score: number; kpiCount: number }[]> = {}
  for (const sh of targets) {
    const saCode = sh.strategicGoal.code
    const themes = new Set<string>()
    for (const k of sh.kpis) (k.themes || '').split(',').map(t => t.trim()).forEach(t => themes.add(t))
    const scoreDivers = themes.has('DIGITAL') ? 0.5 : 0
    const scoreGreen = themes.has('GREEN') ? 0.5 : 0
    const scoreRes = themes.has('RESILIENCE') ? 0.5 : 0
    const base = 1 + (sh.kpis.length >= 2 ? 0.5 : 0)
    const raw = base + scoreDivers + scoreGreen + scoreRes
    if (!saToSh[saCode]) saToSh[saCode] = []
    saToSh[saCode].push({ id: sh.id, code: sh.code, score: raw, kpiCount: sh.kpis.length })
  }
  for (const sa of Object.keys(saToSh)) {
    const list = saToSh[sa]
    const sum = list.reduce((s, x) => s + x.score, 0) || 1
    for (const item of list) {
      const w = item.score / sum
      await prisma.strategicTarget.update({ where: { id: item.id }, data: { goalWeight: w } })
      shRows.push([
        item.code, sa, String(item.kpiCount),
        String(Number(list.find(l => l.code === item.code)?.score ? 1 : 0)),
        String(Number(1)), String(Number(1)),
        item.score.toFixed(4), w.toFixed(4)
      ])
    }
  }

  // CSV çıktıları
  const outDir = path.join(process.cwd(), 'weights')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir)
  const kpiCsv = [kpiRows[0].join(','), ...kpiRows.slice(1).map(r => r.join(','))].join('\n') + '\n'
  const shCsv = [shRows[0].join(','), ...shRows.slice(1).map(r => r.join(','))].join('\n') + '\n'
  fs.writeFileSync(path.join(outDir, 'kpi_weights.csv'), kpiCsv, 'utf-8')
  fs.writeFileSync(path.join(outDir, 'sh_weights.csv'), shCsv, 'utf-8')
  console.log('✅ Weights generated to weights/kpi_weights.csv and weights/sh_weights.csv')
}

main().finally(async () => prisma.$disconnect())


