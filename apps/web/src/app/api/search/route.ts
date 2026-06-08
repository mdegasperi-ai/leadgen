import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { buildDedupeKey } from '@/lib/dedupe'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    const { source, query, location, maxResults, icpDesc } = await req.json()

    if (!query) return NextResponse.json({ error: 'Query required' }, { status: 400 })

    // Check credits
    const dbUser = await prisma.user.findUnique({ where: { id: user.id } })
    if (!dbUser || dbUser.credits < maxResults) {
      return NextResponse.json({ error: 'Crediti insufficienti' }, { status: 402 })
    }

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: `${query} — ${location || 'Ovunque'}`,
        source,
        query,
        location,
        maxResults,
        icpDesc,
        status: 'running',
      },
    })

    // Call worker
    const workerUrl = (process.env.WORKER_URL || 'http://localhost:8000').trim()
    const endpoint = source === 'google_maps' ? '/scraper/google-maps' : '/scraper/linkedin'

    let rawLeads: any[] = []
    try {
      const scrapeRes = await fetch(`${workerUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, location, max_results: maxResults }),
      })

      if (!scrapeRes.ok) {
        const body = await scrapeRes.text()
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'failed' },
        })
        return NextResponse.json({
          error: 'Worker error',
          detail: `Worker responded ${scrapeRes.status}: ${body.slice(0, 300)}`,
          workerUrl: `${workerUrl}${endpoint}`,
        }, { status: 502 })
      }

      const data = await scrapeRes.json()
      rawLeads = data.leads || []
    } catch (workerErr: any) {
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'failed' },
      })
      return NextResponse.json({
        error: 'Cannot reach worker',
        detail: workerErr?.message || String(workerErr),
        workerUrl: `${workerUrl}${endpoint}`,
      }, { status: 502 })
    }

    // --- Deduplication: drop leads we already have for this user ---
    const existing = await prisma.lead.findMany({
      where: { userId: user.id, dedupeKey: { not: null } },
      select: { dedupeKey: true },
    })
    const seenKeys = new Set(existing.map((l) => l.dedupeKey as string))

    const uniqueLeads: { lead: any; key: string | null }[] = []
    for (const lead of rawLeads) {
      const key = buildDedupeKey(lead)
      // Skip if duplicate of an existing lead, or of another lead in this same batch
      if (key && seenKeys.has(key)) continue
      if (key) seenKeys.add(key)
      uniqueLeads.push({ lead, key })
    }

    const skipped = rawLeads.length - uniqueLeads.length

    // Save unique leads + AI score each one
    const savedLeads = await Promise.all(
      uniqueLeads.map(async ({ lead, key }) => {
        let score = null
        let scoreReason = null
        let message = null

        if (lead.name) {
          try {
            const [scoreRes, msgRes] = await Promise.all([
              fetch(`${workerUrl}/leads/score`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead, icp_description: icpDesc }),
              }),
              fetch(`${workerUrl}/leads/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lead, icp_description: icpDesc }),
              }),
            ])
            if (scoreRes.ok) {
              const s = await scoreRes.json()
              score = s.score
              scoreReason = s.reason
            }
            if (msgRes.ok) {
              const m = await msgRes.json()
              message = m.message
            }
          } catch {}
        }

        return prisma.lead.create({
          data: {
            userId: user.id,
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            website: lead.website,
            address: lead.address,
            company: lead.company,
            title: lead.title,
            source,
            score,
            scoreReason,
            message,
            rawData: lead,
            dedupeKey: key,
            activities: {
              create: { type: 'created', content: `Lead importato da ${source}` },
            },
          },
        })
      })
    )

    // Update campaign + deduct credits (only for leads actually saved)
    await Promise.all([
      prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'done', leadsFound: savedLeads.length, creditsUsed: savedLeads.length },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: savedLeads.length } },
      }),
    ])

    return NextResponse.json({ success: true, count: savedLeads.length, skipped })
  } catch (error: any) {
    console.error('[SEARCH ERROR]', error)
    return NextResponse.json({
      error: 'Internal server error',
      detail: error?.message || String(error),
    }, { status: 500 })
  }
}
