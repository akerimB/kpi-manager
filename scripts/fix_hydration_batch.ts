import fs from 'fs'
import path from 'path'

// Hydration sorunlarını toplu olarak düzeltmek için yardımcı script
const filesToFix = [
  'src/app/kpi-entry/page.tsx',
  'src/app/actions/page.tsx', 
  'src/app/themes/page.tsx',
  'src/app/simulation/page.tsx'
]

async function fixHydrationIssues() {
  for (const filePath of filesToFix) {
    const fullPath = path.join(process.cwd(), filePath)
    
    try {
      let content = fs.readFileSync(fullPath, 'utf8')
      
      console.log(`🔧 Düzeltiliyor: ${filePath}`)
      
      // getCurrentUser() çağrısını değiştir
      if (content.includes('const userContext = getCurrentUser()')) {
        content = content.replace(
          'const userContext = getCurrentUser()',
          `const [userContext, setUserContext] = useState<any>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setUserContext(getCurrentUser())
  }, [])`
        )
        
        // useState import'u ekle
        if (!content.includes('useEffect, useState')) {
          content = content.replace(
            /import.*\{([^}]*)\}.*from 'react'/,
            (match, imports) => {
              const importList = imports.split(',').map((s: string) => s.trim())
              if (!importList.includes('useState')) importList.push('useState')
              if (!importList.includes('useEffect')) importList.push('useEffect')
              return match.replace(imports, importList.join(', '))
            }
          )
        }
        
        // Authentication kontrollerini client-safe yap
        content = content.replace(
          /if \(!isAuthenticated\) \{/g,
          'if (isClient && !isAuthenticated) {'
        )
        
        content = content.replace(
          /if \(!userContext\) \{[\s\S]*?return[\s\S]*?\}/g,
          `if (!isClient) {
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
          <div className="text-blue-600 text-6xl mb-4">🔐</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Giriş Gerekli</h2>
          <p className="text-gray-600 mb-4">Bu sayfayı görüntülemek için giriş yapmanız gerekiyor.</p>
          <a href="/login" className="text-blue-600 hover:text-blue-800">Giriş Yap</a>
        </div>
      </div>
    )
  }`
        )
        
        fs.writeFileSync(fullPath, content, 'utf8')
        console.log(`✅ Tamamlandı: ${filePath}`)
      }
    } catch (error) {
      console.error(`❌ Hata ${filePath}:`, error)
    }
  }
  
  console.log('🎉 Tüm dosyalar düzeltildi!')
}

fixHydrationIssues()
