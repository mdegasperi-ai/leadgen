'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const FONTI = [
  { value: 'google_maps', label: 'Google Maps', icon: '🗺️', desc: 'Aziende locali, ristoranti, negozi…' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼', desc: 'Professionisti, decision maker, manager…' },
]

export default function NuovaRicercaPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    nome: '',
    fonte: 'google_maps',
    query: '',
    location: '',
    maxResults: 20,
    icpDesc: '',
  })

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  async function avvia() {
    if (!form.query.trim()) { setError('Inserisci una keyword di ricerca.'); return }
    if (form.fonte === 'google_maps' && !form.location.trim()) { setError('Inserisci una location.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.nome || `${form.query} – ${form.location || 'Ovunque'}`,
          source: form.fonte,
          query: form.query,
          location: form.location,
          maxResults: Number(form.maxResults),
          icpDesc: form.icpDesc,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Errore sconosciuto')
      router.push(`/dashboard/campagne/${data.id}`)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <a href="/dashboard" className="text-slate-400 hover:text-slate-600 text-sm">← Dashboard</a>
        <span className="text-slate-300">/</span>
        <span className="text-sm font-medium text-slate-700">Nuova ricerca</span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Nuova ricerca lead</h1>
        <p className="text-slate-500 text-sm mb-8">Configura la tua campagna e genera nuovi contatti in pochi secondi.</p>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2].map(n => (
            <div key={n} className="flex items-center gap-2">
              <button
                onClick={() => n < step && setStep(n as 1 | 2)}
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition ${
                  step === n ? 'bg-sky-500 text-white' : n < step ? 'bg-sky-100 text-sky-600 cursor-pointer' : 'bg-slate-200 text-slate-400'
                }`}
              >{n}</button>
              {n < 2 && <div className={`h-0.5 w-12 ${step > n ? 'bg-sky-300' : 'bg-slate-200'}`} />}
            </div>
          ))}
          <span className="ml-2 text-sm text-slate-500">{step === 1 ? 'Fonte & Query' : 'Dettagli campagna'}</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">

          {step === 1 && <>
            {/* Fonte */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Fonte dati</label>
              <div className="grid grid-cols-2 gap-3">
                {FONTI.map(f => (
                  <button
                    key={f.value}
                    onClick={() => set('fonte', f.value)}
                    className={`p-4 rounded-lg border-2 text-left transition ${
                      form.fonte === f.value ? 'border-sky-500 bg-sky-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{f.icon}</div>
                    <div className="font-semibold text-sm text-slate-800">{f.label}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Query */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {form.fonte === 'google_maps' ? 'Tipo di attività' : 'Keyword / ruolo'}
              </label>
              <input
                value={form.query}
                onChange={e => set('query', e.target.value)}
                placeholder={form.fonte === 'google_maps' ? 'es. ristoranti, avvocati, dentisti…' : 'es. marketing manager, CEO startup…'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Location {form.fonte === 'linkedin' && <span className="text-slate-400 font-normal">(opzionale)</span>}
              </label>
              <input
                value={form.location}
                onChange={e => set('location', e.target.value)}
                placeholder="es. Milano, Roma, Torino…"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            {/* Max results */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Numero di lead <span className="text-slate-400 font-normal">(max {form.fonte === 'google_maps' ? '50' : '30'})</span>
              </label>
              <input
                type="number"
                min={5}
                max={form.fonte === 'google_maps' ? 50 : 30}
                value={form.maxResults}
                onChange={e => set('maxResults', parseInt(e.target.value) || 20)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
              <p className="text-xs text-slate-400 mt-1">Ogni lead consuma 1 credito.</p>
            </div>

            <button
              onClick={() => {
                if (!form.query.trim()) { setError('Inserisci una keyword.'); return }
                setError('')
                setStep(2)
              }}
              className="w-full py-2.5 bg-sky-500 text-white rounded-lg font-semibold text-sm hover:bg-sky-600 transition"
            >
              Avanti →
            </button>
          </>}

          {step === 2 && <>
            {/* Riepilogo */}
            <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-600 flex gap-4">
              <span><strong>Fonte:</strong> {FONTI.find(f => f.value === form.fonte)?.label}</span>
              <span><strong>Query:</strong> {form.query}</span>
              {form.location && <span><strong>Luogo:</strong> {form.location}</span>}
              <span><strong>Lead:</strong> {form.maxResults}</span>
            </div>

            {/* Nome campagna */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nome campagna <span className="text-slate-400 font-normal">(opzionale)</span>
              </label>
              <input
                value={form.nome}
                onChange={e => set('nome', e.target.value)}
                placeholder={`${form.query} – ${form.location || 'Ovunque'}`}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
              />
            </div>

            {/* ICP */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Descrivi il tuo cliente ideale (ICP) <span className="text-slate-400 font-normal">(opzionale)</span>
              </label>
              <textarea
                value={form.icpDesc}
                onChange={e => set('icpDesc', e.target.value)}
                rows={3}
                placeholder="es. Titolari di ristoranti con più di 10 dipendenti nel Nord Italia, interessati a soluzioni POS…"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
              />
              <p className="text-xs text-slate-400 mt-1">L'AI userà questa descrizione per valutare e filtrare i lead trovati.</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-lg font-semibold text-sm hover:bg-slate-50 transition"
              >
                ← Indietro
              </button>
              <button
                onClick={avvia}
                disabled={loading}
                className="flex-1 py-2.5 bg-sky-500 text-white rounded-lg font-semibold text-sm hover:bg-sky-600 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Avvio ricerca…' : '🚀 Avvia ricerca'}
              </button>
            </div>
          </>}

          {error && step === 1 && <p className="text-sm text-red-500 -mt-2">{error}</p>}
        </div>
      </div>
    </div>
  )
}
