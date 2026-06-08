export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { DeleteLeadButton, DeleteAllButton } from '@/components/LeadActions'

function scoreColor(score: number | null) {
  if (score == null) return 'bg-slate-100 text-slate-400'
  if (score >= 70) return 'bg-green-100 text-green-700'
  if (score >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const sessionUser = session.user as any
  const dbUser = await prisma.user.findUnique({ where: { id: sessionUser.id } })
  const leads = await prisma.lead.findMany({
    where: { userId: sessionUser.id },
    orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
    take: 200,
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-slate-900">Leadgen</span>
          <div className="flex gap-4 text-sm">
            <Link href="/dashboard" className="text-sky-600 font-medium">Dashboard</Link>
            <Link href="/pipeline" className="text-slate-500 hover:text-slate-800">Pipeline</Link>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/search" className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-sm font-semibold transition">
            + Nuova ricerca
          </Link>
          <span className="text-sm text-slate-500">{sessionUser.email}</span>
          <a href="/api/auth/signout" className="text-sm text-red-500 hover:underline">Esci</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Crediti rimanenti', value: dbUser?.credits ?? 0, sub: `Piano ${dbUser?.plan ?? 'free'}` },
            { label: 'Lead generati', value: leads.length, sub: 'Totale' },
            {
              label: 'Punteggio medio',
              value: leads.filter((l) => l.score != null).length
                ? Math.round(
                    leads.filter((l) => l.score != null).reduce((a, l) => a + (l.score ?? 0), 0) /
                      leads.filter((l) => l.score != null).length
                  )
                : '—',
              sub: 'Su 100',
            },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">I tuoi lead</h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">{leads.length} totali</span>
              <DeleteAllButton count={leads.length} />
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">Nessun lead ancora</p>
              <Link href="/search" className="mt-6 inline-block px-5 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold hover:bg-sky-600 transition">
                Nuova ricerca
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="px-6 py-3 font-medium">Score</th>
                    <th className="px-6 py-3 font-medium">Nome</th>
                    <th className="px-6 py-3 font-medium">Contatti</th>
                    <th className="px-6 py-3 font-medium">Messaggio AI</th>
                    <th className="px-6 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id} className="border-b border-slate-50 hover:bg-slate-50/50 align-top">
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2 py-1 rounded-md text-xs font-bold ${scoreColor(lead.score)}`}>
                          {lead.score ?? '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-800">{lead.name || '—'}</div>
                        {lead.title && <div className="text-xs text-slate-500">{lead.title}</div>}
                        {lead.address && <div className="text-xs text-slate-400 mt-0.5">{lead.address}</div>}
                        {lead.scoreReason && <div className="text-xs text-slate-400 italic mt-1 max-w-xs">{lead.scoreReason}</div>}
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        {lead.phone && <div className="text-slate-600">📞 {lead.phone}</div>}
                        {lead.website && (
                          <a href={lead.website} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline block truncate max-w-[160px]">
                            🌐 {lead.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                        {!lead.phone && !lead.website && <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        {lead.message ? (
                          <p className="text-slate-600 text-xs leading-relaxed">{lead.message}</p>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <DeleteLeadButton id={lead.id} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
