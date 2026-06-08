import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any

  // Only delete if the lead belongs to this user
  const result = await prisma.lead.deleteMany({
    where: { id: params.id, userId: user.id },
  })

  if (result.count === 0) {
    return NextResponse.json({ error: 'Lead non trovato' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
