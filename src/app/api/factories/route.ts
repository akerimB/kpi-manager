import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userRole = searchParams.get('userRole') || 'MODEL_FACTORY'
    const factoryId = searchParams.get('factoryId')

    let whereCondition: any = {
      isActive: true
    }
    
    // Model fabrika kullanıcıları sadece kendi fabrikalarını görebilir
    if (userRole === 'MODEL_FACTORY' && factoryId) {
      whereCondition.id = factoryId
    }

    const factories = await prisma.modelFactory.findMany({
      where: whereCondition,
      orderBy: {
        name: 'asc'
      }
    })

    return NextResponse.json(factories)
  } catch (error) {
    console.error('Factories fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 