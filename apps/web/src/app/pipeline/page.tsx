export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { KanbanBoard } from '@/components/KanbanBoard'

export default async function PipelinePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = session.user as any
  const leads = await prisma.lead.findMany({
    where: { userId: user.id },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    take: 500,
    select: {
      id: true, name: true, company: true, title: true, phone: true, website: true,
      address: true, score: true, scoreReason: true, message: true, status: true,
      notes: true, tags: true, source: true,
    },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-slate-900">Leadgen</span>
          <div className="flex gap-4 text-sm">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-800">Dashboard</Link>
            <Link href="/pipeline" className="text-sky-600 font-medium">Pipeline</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/search" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold transition">
            + Nuova ricerca
          </Link>
          <a href="/api/auth/signout" className="text-sm text-red-500 hover:underline">Esci</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Pipeline</h1>
          <p className="text-sm text-slate-400">Trascina i lead tra le colonne · clicca per dettagli</p>
        </div>

        {leads.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 text-center py-20 text-slate-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-medium">Nessun lead in pipeline</p>
            <Link href="/search" className="mt-6 inline-block px-5 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold hover:bg-sky-600 transition">
              Nuova ricerca
            </Link>
          </div>
        ) : (
          <KanbanBoard initialLeads={leads} />
        )}
      </div>
    </div>
  )
}
