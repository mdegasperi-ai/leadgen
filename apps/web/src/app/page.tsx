export const dynamic = 'force-dynamic'

import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <span className="inline-block mb-4 px-3 py-1 text-xs font-semibold tracking-widest uppercase bg-brand-500/20 text-brand-500 rounded-full">
          Beta
        </span>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Find your next B2B clients
          <br />
          <span className="text-brand-500">powered by AI</span>
        </h1>
        <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
          Scrape LinkedIn, Google Maps, and the web. Score leads automatically.
          Send personalized outreach — all in one platform.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-lg transition"
          >
            Get started free
          </Link>
          <Link
            href="#features"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition"
          >
            See how it works
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: '🔍',
              title: 'Multi-channel scraping',
              desc: 'LinkedIn, Google Maps, company websites — all in one search.',
            },
            {
              icon: '🤖',
              title: 'AI lead scoring',
              desc: 'Every lead gets a fit score based on your Ideal Customer Profile.',
            },
            {
              icon: '✉️',
              title: 'Personalized outreach',
              desc: 'AI writes a custom opening message for each lead.',
            },
          ].map((f) => (
            <div key={f.title} className="bg-white/5 rounded-xl p-6 border border-white/10">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-slate-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
