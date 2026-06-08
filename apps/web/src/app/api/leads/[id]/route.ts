import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, userId: user.id },
    include: { activities: { orderBy: { createdAt: 'desc' } } },
  })
  if (!lead) return NextResponse.json({ error: 'Lead non trovato' }, { status: 404 })

  return NextResponse.json({ lead })
}

const STATUS_LABELS: Record<string, string> = {
  new: 'Nuovo',
  contacted: 'Contattato',
  qualified: 'Qualificato',
  closed: 'Chiuso',
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, userId: user.id },
  })
  if (!lead) return NextResponse.json({ error: 'Lead non trovato' }, { status: 404 })

  const data: any = {}
  const activities: { type: string; content: string }[] = []

  // Status change
  if (typeof body.status === 'string' && body.status !== lead.status) {
    data.status = body.status
    activities.push({
      type: 'status_change',
      content: `Stato cambiato in "${STATUS_LABELS[body.status] || body.status}"`,
    })
  }

  // Notes
  if (typeof body.notes === 'string' && body.notes !== lead.notes) {
    data.notes = body.notes
  }

  // Tags (full replacement)
  if (Array.isArray(body.tags)) {
    const cleaned = body.tags.map((t: string) => String(t).trim()).filter(Boolean)
    data.tags = cleaned
    activities.push({ type: 'tag', content: `Tag aggiornati: ${cleaned.join(', ') || '—'}` })
  }

  // Free-form note added to the timeline
  if (typeof body.activityNote === 'string' && body.activityNote.trim()) {
    activities.push({ type: 'note', content: body.activityNote.trim() })
  }

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: {
      ...data,
      ...(activities.length ? { activities: { create: activities } } : {}),
    },
  })

  return NextResponse.json({ success: true, lead: updated })
}

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
