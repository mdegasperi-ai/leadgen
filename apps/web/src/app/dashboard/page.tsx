export const dynamic = 'force-dynamic'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = session.user as any
  const leads = await prisma.lead.count({ where: { userId: user.id } })

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-slate-900">Leadgen</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-500">{user.email}</span>
          <a href="/api/auth/signout" className="text-sm text-red-500 hover:underline">Esci</a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Crediti rimanenti', value: user.credits ?? 25, sub: `Piano ${user.plan ?? 'free'}` },
            { label: 'Lead generati', value: leads, sub: 'Totale' },
            { label: 'Piano attivo', value: user.plan ?? 'Free', sub: '25 crediti inclusi' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Lead recenti</h2>
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">Nessun lead ancora</p>
            <p className="text-sm mt-1">Avvia la tua prima ricerca per generare lead</p>
            <button className="mt-6 px-5 py-2 bg-sky-500 text-white rounded-lg text-sm font-semibold hover:bg-sky-600 transition">
              Nuova ricerca
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
