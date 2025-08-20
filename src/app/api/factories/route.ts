import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const factories = await prisma.modelFactory.findMany({
      select: {
        id: true,
        name: true,
        city: true,
        region: true,
        createdAt: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json({
      success: true,
      factories,
      total: factories.length
    })

  } catch (error) {
    console.error('❌ Factories fetch error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Fabrikalar getirilemedi',
        detail: String(error)
      }, 
      { status: 500 }
    )
  }
}