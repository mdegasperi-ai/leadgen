'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const SOURCES = [
  { value: 'google_maps', label: '🗺️ Google Maps', desc: 'Attività locali, negozi, ristoranti...' },
  { value: 'linkedin', label: '💼 LinkedIn', desc: 'Profili professionali e aziende' },
]

export default function SearchPage() {
  const router = useRouter()
  const [source, setSource] = useState('google_maps')
  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [maxResults, setMaxResults] = useState(20)
  const [icpDesc, setIcpDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source, query, location, maxResults, icpDesc }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Errore durante la ricerca')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Errore di connessione')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <button onClick={() => router.back()} className="text-slate-400 hover:text-slate-600">
          ← Indietro
        </button>
        <span className="font-bold text-slate-900">Nuova ricerca</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Source */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Sorgente dati</label>
            <div className="grid grid-cols-2 gap-3">
              {SOURCES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSource(s.value)}
                  className={`p-4 rounded-xl border-2 text-left transition ${
                    source === s.value
                      ? 'border-sky-500 bg-sky-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold text-sm">{s.label}</div>
                  <div className="text-xs text-slate-500 mt-1">{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Query */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {source === 'google_maps' ? 'Tipo di attività' : 'Parole chiave'}
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder={source === 'google_maps' ? 'es. ristorante, agenzia marketing...' : 'es. CEO startup, Sales Manager...'}
              required
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Città / Zona</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="es. Milano, Roma, Torino..."
            />
          </div>

          {/* ICP */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Descrivi il tuo cliente ideale <span className="text-slate-400 font-normal">(per AI scoring)</span>
            </label>
            <textarea
              value={icpDesc}
              onChange={(e) => setIcpDesc(e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
              placeholder="es. PMI con 10-50 dipendenti nel settore tech, con budget marketing, in fase di crescita..."
            />
          </div>

          {/* Max results */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Numero di lead <span className="text-slate-400 font-normal">({maxResults} crediti)</span>
            </label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>5</span><span>50</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading || !query}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin">⟳</span> Ricerca in corso...
              </>
            ) : (
              <>🔍 Avvia ricerca</>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
