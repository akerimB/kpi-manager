import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { role, factoryCode } = await request.json()
    
    // 15 Model Fabrika ve yönetim kullanıcıları
    const factories = [
      { code: 'ADANA', id: 'cmebmec0a0007gpvewan8fteb', name: 'Adana' },
      { code: 'ANKARA', id: 'cmebmec020000gpveb9ewqio0', name: 'Ankara' },
      { code: 'BURSA', id: 'cmebmec060001gpved4wzoa1i', name: 'Bursa' },
      { code: 'DENIZLI', id: 'cmebmec0c000agpveur7svu8r', name: 'Denizli' },
      { code: 'ESKISEHIR', id: 'cmebmec0b0008gpve0h73wefe', name: 'Eskişehir' },
      { code: 'GAZIANTEP', id: 'cmebmec070002gpveev4g7r2v', name: 'Gaziantep' },
      { code: 'KAYSERI', id: 'cmebmec090004gpveghxdwyuw', name: 'Kayseri' },
      { code: 'KOCAELI', id: 'cmebmec0d000bgpvez84cki35', name: 'Kocaeli' },
      { code: 'KONYA', id: 'cmebmec090005gpvep0rxmljz', name: 'Konya' },
      { code: 'MALATYA', id: 'cmebmec0d000cgpveu4t34ysn', name: 'Malatya' },
      { code: 'MERSIN', id: 'cmebmec0a0006gpvexv9vprdx', name: 'Mersin' },
      { code: 'SAMSUN', id: 'cmebmec0c0009gpvejqbibf0h', name: 'Samsun' },
      { code: 'TEKIRDAG', id: 'cmebmec0e000dgpveiwmi4eo2', name: 'Tekirdağ' },
      { code: 'TRABZON', id: 'cmebmec0f000egpveges02p3j', name: 'Trabzon' },
      { code: 'IZMIR', id: 'cmebmec080003gpve0qsf64du', name: 'İzmir' }
    ]
    
    const demoUsers = {
      'UPPER_MANAGEMENT': {
        id: 'upper-mgmt-demo',
        email: 'ust.yonetim@kobimodel.gov.tr',
        name: 'Üst Yönetim',
        role: 'UPPER_MANAGEMENT',
        factoryId: null
      }
    }
    
    // Dinamik olarak tüm fabrika kullanıcılarını ekle
    factories.forEach(factory => {
      demoUsers[`MODEL_FACTORY_${factory.code}`] = {
        id: `mf-${factory.code.toLowerCase()}`,
        email: `${factory.code.toLowerCase()}@kobimodel.gov.tr`,
        name: `${factory.name} Model Fabrika`,
        role: 'MODEL_FACTORY',
        factoryId: factory.id
      }
    })
    
    // Model fabrika için ilk fabrikayı varsayılan yap
    if (role === 'MODEL_FACTORY') {
      const targetCode = factoryCode || 'KAYSERI' // Default to Kayseri
      const factoryKey = `MODEL_FACTORY_${targetCode.toUpperCase()}`
      const user = demoUsers[factoryKey as keyof typeof demoUsers]
      
      if (user) {
        const token = `demo-token-${targetCode.toLowerCase()}-${Date.now()}`
        return NextResponse.json({ success: true, token, user })
      } else {
        return NextResponse.json({ error: `Fabrika bulunamadı: ${targetCode}` }, { status: 400 })
      }
    }
    
    const user = demoUsers[role as keyof typeof demoUsers]
    
    if (!user) {
      return NextResponse.json({ error: 'Geçersiz rol' }, { status: 400 })
    }
    
    const token = `demo-token-${role.toLowerCase()}-${Date.now()}`
    
    return NextResponse.json({
      success: true,
      token,
      user
    })
    
  } catch (error) {
    console.error('Demo login error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
