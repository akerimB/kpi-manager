import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json({ error: 'Token gereklidir' }, { status: 401 })
    }

    // Token'ı doğrula
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const { currentPassword, newPassword } = await request.json()

    // Mevcut şifre kontrolü (basit kontrol - gerçek uygulamada bcrypt kullanılmalı)
    if (currentPassword !== '123456') {
      return NextResponse.json({ error: 'Mevcut şifre yanlış' }, { status: 400 })
    }

    // Yeni şifre geçerlilik kontrolü
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Yeni şifre en az 6 karakter olmalı' }, { status: 400 })
    }

    // Şifre güncelleme (gerçek uygulamada hash'lenmiş şifre kaydedilmeli)
    // Şu an için basit olarak şifre değişikliği simule ediliyor
    
    return NextResponse.json({
      message: 'Şifre başarıyla değiştirildi'
    })

  } catch (error) {
    console.error('Password change error:', error)
    return NextResponse.json({ error: 'Şifre değiştirilirken hata oluştu' }, { status: 500 })
  }
} 