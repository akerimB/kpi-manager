import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // JWT token'ı client-side'da siliniyor, server-side'da özel bir işlem yok
    // Gerçek uygulamada token blacklist'i kullanılabilir
    
    return NextResponse.json({
      message: 'Çıkış başarılı'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
} 