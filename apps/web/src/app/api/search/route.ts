import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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
    const workerUrl = process.env.WORKER_URL || 'http://localhost:8000'
    const endpoint = source === 'google_maps' ? '/scraper/google-maps' : '/scraper/linkedin'

    const scrapeRes = await fetch(`${workerUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, location, max_results: maxResults }),
    })

    if (!scrapeRes.ok) throw new Error('Worker error')

    const { leads: rawLeads } = await scrapeRes.json()

    // Save leads + AI score each one
    const savedLeads = await Promise.all(
      rawLeads.map(async (lead: any) => {
        let score = null
        let scoreReason = null
        let message = null

        if (icpDesc && lead.name) {
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
          },
        })
      })
    )

    // Update campaign + deduct credits
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

    return NextResponse.json({ success: true, count: savedLeads.length })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
