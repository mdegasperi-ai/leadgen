import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const user = session.user as any
  const body = await req.json()
  const { name, source, query, location, maxResults, icpDesc } = body

  if (!query || !source) {
    return NextResponse.json({ error: 'Query e fonte sono obbligatori' }, { status: 400 })
  }

  // Check credits
  const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
  if (!dbUser) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })
  if (dbUser.credits < (maxResults ?? 20)) {
    return NextResponse.json({ error: `Crediti insufficienti. Hai ${dbUser.credits} crediti.` }, { status: 402 })
  }

  // Create campaign
  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      name: name || `${query} – ${location || 'Ovunque'}`,
      source,
      query,
      location: location || '',
      maxResults: maxResults ?? 20,
      icpDesc: icpDesc || '',
      status: 'pending',
    },
  })

  // Trigger worker (fire & forget)
  const workerUrl = process.env.WORKER_URL
  if (workerUrl) {
    const endpoint = source === 'linkedin'
      ? `${workerUrl}/scraper/linkedin`
      : `${workerUrl}/scraper/google-maps`

    const payload = source === 'linkedin'
      ? { keywords: query, location: location || undefined, max_results: maxResults ?? 20 }
      : { query, location: location || '', max_results: maxResults ?? 20 }

    // Update status to running
    await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'running' } })

    // Run async
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then(async (data: any) => {
        const rawLeads: any[] = data.leads ?? []

        // Save leads to DB
        const created = await prisma.$transaction(
          rawLeads.map(l =>
            prisma.lead.create({
              data: {
                userId: user.id,
                name: l.name ?? null,
                phone: l.phone ?? null,
                website: l.website ?? null,
                address: l.address ?? null,
                company: l.company ?? null,
                title: l.title ?? null,
                source,
                rawData: l,
              },
            })
          )
        )

        // Deduct credits and update campaign
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { credits: { decrement: created.length } },
          }),
          prisma.campaign.update({
            where: { id: campaign.id },
            data: { status: 'done', leadsFound: created.length, creditsUsed: created.length },
          }),
        ])
      })
      .catch(async () => {
        await prisma.campaign.update({ where: { id: campaign.id }, data: { status: 'failed' } })
      })
  }

  return NextResponse.json({ id: campaign.id })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const user = session.user as any
  const campaigns = await prisma.campaign.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json(campaigns)
}
