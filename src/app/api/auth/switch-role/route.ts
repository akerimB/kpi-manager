import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { targetRole, factoryId } = await request.json()
    
    // Admin kullanıcısı için rol değiştirme
    const adminSwitchRoles = {
      'UPPER_MANAGEMENT': {
        id: 'admin-as-upper',
        email: 'admin@kobimodel.gov.tr',
        name: 'Admin (Üst Yönetim Görünümü)',
        role: 'UPPER_MANAGEMENT',
        factoryId: null,
        isAdminSwitched: true
      },
      'MODEL_FACTORY': {
        id: 'admin-as-mf',
        email: 'admin@kobimodel.gov.tr',
        name: 'Admin (Model Fabrika Görünümü)',
        role: 'MODEL_FACTORY',
        factoryId: factoryId || 'cmebmec0a0007gpvewan8fteb', // Varsayılan Adana
        isAdminSwitched: true
      },
      'ADMIN': {
        id: 'admin-demo',
        email: 'admin@kobimodel.gov.tr',
        name: 'System Admin',
        role: 'ADMIN',
        factoryId: null,
        isAdminSwitched: false
      }
    }
    
    const user = adminSwitchRoles[targetRole as keyof typeof adminSwitchRoles]
    
    if (!user) {
      return NextResponse.json({ error: 'Geçersiz hedef rol' }, { status: 400 })
    }
    
    const token = `admin-switch-${targetRole.toLowerCase()}-${Date.now()}`
    
    return NextResponse.json({
      success: true,
      token,
      user,
      message: `Admin ${targetRole} rolüne geçiş yaptı`
    })
    
  } catch (error) {
    console.error('Role switch error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
