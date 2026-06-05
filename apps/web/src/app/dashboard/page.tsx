export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Credits remaining', value: '25', sub: 'Free plan' },
            { label: 'Leads generated', value: '0', sub: 'This month' },
            { label: 'Avg. lead score', value: '—', sub: 'No data yet' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
              <p className="text-sm text-slate-500 mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
              <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-800 mb-4">Recent leads</h2>
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">🔍</p>
            <p className="font-medium">No leads yet</p>
            <p className="text-sm mt-1">Start your first search to generate leads</p>
            <button className="mt-6 px-5 py-2 bg-brand-500 text-white rounded-lg text-sm font-semibold hover:bg-brand-600 transition">
              New search
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
