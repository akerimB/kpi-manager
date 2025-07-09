import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'E-posta ve şifre gereklidir' }, { status: 400 })
    }

    // Kullanıcıyı veritabanından bul
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        factory: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 })
    }

    // Şifre kontrolü (basit kontrol - gerçek uygulamada bcrypt kullanılmalı)
    if (password !== '123456') {
      return NextResponse.json({ error: 'Geçersiz şifre' }, { status: 401 })
    }

    // Kullanıcı aktif mi kontrol et
    if (!user.isActive) {
      return NextResponse.json({ error: 'Hesap devre dışı' }, { status: 401 })
    }

    // JWT token oluştur
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role,
        factoryId: user.factoryId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    // Kullanıcı bilgilerini hazırla
    const userResponse = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      factoryId: user.factoryId,
      factory: user.factory ? {
        id: user.factory.id,
        name: user.factory.name,
        code: user.factory.code
      } : null,
      permissions: user.permissions ? JSON.parse(user.permissions) : null
    }

    // Son giriş zamanını güncelle
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    })

    return NextResponse.json({
      message: 'Giriş başarılı',
      token,
      user: userResponse
    })

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
} 