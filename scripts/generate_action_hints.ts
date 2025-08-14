import fs from 'fs'
import path from 'path'

function parseCSV(content: string): string[][] {
  const lines = content.split(/\r?\n/)
  return lines.filter(Boolean).map(line => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') inQuotes = !inQuotes
      else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = '' }
      else current += ch
    }
    result.push(current.trim())
    return result
  })
}

function stringifyCSV(rows: string[][]): string {
  return rows.map(r => r.map(c => c.includes(',') ? `"${c}"` : c).join(',')).join('\n') + '\n'
}

// Basit kelime-tema sözlüğü
const THEME_MAP: Array<{ theme: string; keywords: string[] }> = [
  { theme: 'LEAN', keywords: ['yalın','israf','verim','5s','kaizen','standart'] },
  { theme: 'DIGITAL', keywords: ['dijital','erp','crm','lms','otomasyon','platform','ar/vr','simülasyon'] },
  { theme: 'GREEN', keywords: ['yeşil','enerji','karbon','çevre','sürdürülebil'] },
  { theme: 'RESILIENCE', keywords: ['risk','güvenlik','direnç','kriz','süreklilik'] },
]

function inferHint(description: string, shCode: string): string {
  const d = (description || '').toLowerCase()
  const hintedThemes = new Set<string>()
  for (const m of THEME_MAP) if (m.keywords.some(k => d.includes(k))) hintedThemes.add(m.theme)
  const themeHint = Array.from(hintedThemes).join('|')
  // SH’e dayalı ek ipucu
  // Örn: SH1.* için LEAN|DIGITAL|GREEN|RESILIENCE, SH2.* LEAN, SH3.* DIGITAL, SH4.* RESILIENCE
  let shTheme = ''
  if (/^SH1\./i.test(shCode)) shTheme = 'LEAN|DIGITAL|GREEN|RESILIENCE'
  else if (/^SH2\./i.test(shCode)) shTheme = 'LEAN'
  else if (/^SH3\./i.test(shCode)) shTheme = 'DIGITAL'
  else if (/^SH4\./i.test(shCode)) shTheme = 'RESILIENCE'
  const parts = [shCode]
  if (themeHint) parts.push(themeHint)
  if (shTheme) parts.push(shTheme)
  return parts.join('; ')
}

function main() {
  const csvPath = path.join(process.cwd(), 'Eylem_Listesi.csv')
  const content = fs.readFileSync(csvPath, 'utf-8')
  const rows = parseCSV(content)
  if (rows.length === 0) return
  const header = rows[0]
  let eIdx = header.findIndex(h => /E_code/i.test(h))
  let dIdx = header.findIndex(h => /Description/i.test(h))
  let shIdx = header.findIndex(h => /SH_code/i.test(h))
  const hasHint = header.some(h => /KPI_Hint/i.test(h))
  const newHeader = hasHint ? header : [...header, 'KPI_Hint']
  const out: string[][] = [newHeader]
  for (const row of rows.slice(1)) {
    const e = row[eIdx] || ''
    const d = row[dIdx] || ''
    const sh = row[shIdx] || ''
    const hint = inferHint(d, sh)
    const newRow = hasHint ? (row.slice(0, newHeader.length)) : [...row, hint]
    if (hasHint) newRow[newHeader.findIndex(h => /KPI_Hint/i.test(h))] = hint
    out.push(newRow)
  }
  fs.writeFileSync(csvPath, stringifyCSV(out), 'utf-8')
  console.log('✅ Eylem_Listesi.csv dosyasına KPI_Hint sütunu eklendi/güncellendi.')
}

main()


