'use client'

import { useEffect, useState } from 'react'

type Lead = {
  id: string
  name: string | null
  company: string | null
  title: string | null
  phone: string | null
  website: string | null
  address: string | null
  score: number | null
  scoreReason: string | null
  message: string | null
  status: string
  notes: string | null
  tags: string[]
  source: string
}

type Activity = {
  id: string
  type: string
  content: string
  createdAt: string
}

const COLUMNS = [
  { key: 'new', label: 'Nuovi', color: 'border-slate-300', dot: 'bg-slate-400' },
  { key: 'contacted', label: 'Contattati', color: 'border-blue-300', dot: 'bg-blue-400' },
  { key: 'qualified', label: 'Qualificati', color: 'border-amber-300', dot: 'bg-amber-400' },
  { key: 'closed', label: 'Chiusi', color: 'border-green-300', dot: 'bg-green-500' },
]

function scoreColor(score: number | null) {
  if (score == null) return 'bg-slate-100 text-slate-400'
  if (score >= 70) return 'bg-green-100 text-green-700'
  if (score >= 40) return 'bg-amber-100 text-amber-700'
  return 'bg-red-100 text-red-600'
}

export function KanbanBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [dragId, setDragId] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)

  async function moveLead(id: string, status: string) {
    const prev = leads
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status } : l)))
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (!res.ok) setLeads(prev) // rollback on failure
  }

  function onDrop(status: string) {
    if (dragId) {
      const lead = leads.find((l) => l.id === dragId)
      if (lead && lead.status !== status) moveLead(dragId, status)
    }
    setDragId(null)
  }

  const openLead = leads.find((l) => l.id === openId) || null

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {COLUMNS.map((col) => {
          const colLeads = leads.filter((l) => l.status === col.key)
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDrop(col.key)}
              className={`bg-slate-50 rounded-xl border-t-4 ${col.color} p-3 min-h-[200px]`}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${col.dot}`} />
                  <span className="font-semibold text-sm text-slate-700">{col.label}</span>
                </div>
                <span className="text-xs text-slate-400">{colLeads.length}</span>
              </div>

              <div className="space-y-2">
                {colLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={() => setDragId(lead.id)}
                    onClick={() => setOpenId(lead.id)}
                    className="bg-white rounded-lg border border-slate-200 p-3 shadow-sm cursor-pointer hover:shadow-md hover:border-sky-300 transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-medium text-sm text-slate-800 leading-tight">
                        {lead.name || '—'}
                      </span>
                      <span className={`shrink-0 px-1.5 py-0.5 rounded text-xs font-bold ${scoreColor(lead.score)}`}>
                        {lead.score ?? '—'}
                      </span>
                    </div>
                    {lead.title && <p className="text-xs text-slate-500 mt-0.5">{lead.title}</p>}
                    {lead.phone && <p className="text-xs text-slate-400 mt-1">📞 {lead.phone}</p>}
                    {lead.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {lead.tags.map((t) => (
                          <span key={t} className="px-1.5 py-0.5 bg-sky-50 text-sky-600 rounded text-[10px]">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {colLeads.length === 0 && (
                  <p className="text-xs text-slate-300 text-center py-6">Trascina qui i lead</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {openLead && (
        <LeadDrawer
          lead={openLead}
          onClose={() => setOpenId(null)}
          onUpdate={(patch) =>
            setLeads((ls) => ls.map((l) => (l.id === openLead.id ? { ...l, ...patch } : l)))
          }
        />
      )}
    </>
  )
}

function LeadDrawer({
  lead,
  onClose,
  onUpdate,
}: {
  lead: Lead
  onClose: () => void
  onUpdate: (patch: Partial<Lead>) => void
}) {
  const [notes, setNotes] = useState(lead.notes || '')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(lead.tags)
  const [activityNote, setActivityNote] = useState('')
  const [activities, setActivities] = useState<Activity[] | null>(null)
  const [saving, setSaving] = useState(false)

  // Load activity timeline on mount
  useEffect(() => {
    fetch(`/api/leads/${lead.id}`)
      .then((r) => r.json())
      .then((d) => setActivities(d.lead?.activities || []))
      .catch(() => setActivities([]))
  }, [lead.id])

  function addTag() {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
      setTagInput('')
    }
  }

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes, tags, activityNote: activityNote.trim() || undefined }),
    })
    setSaving(false)
    if (res.ok) {
      onUpdate({ notes, tags })
      onClose()
    } else {
      alert('Errore durante il salvataggio')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-md h-full overflow-y-auto shadow-xl p-6"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">{lead.name || '—'}</h2>
            {lead.title && <p className="text-sm text-slate-500">{lead.title}</p>}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl">×</button>
        </div>

        {/* Contact info */}
        <div className="space-y-1 text-sm mb-5">
          {lead.address && <p className="text-slate-500">📍 {lead.address}</p>}
          {lead.phone && <p className="text-slate-600">📞 {lead.phone}</p>}
          {lead.website && (
            <a href={lead.website} target="_blank" rel="noreferrer" className="text-sky-600 hover:underline block">
              🌐 {lead.website.replace(/^https?:\/\//, '')}
            </a>
          )}
        </div>

        {lead.scoreReason && (
          <div className="bg-slate-50 rounded-lg p-3 mb-5 text-xs text-slate-600">
            <span className="font-semibold">Score {lead.score}:</span> {lead.scoreReason}
          </div>
        )}

        {lead.message && (
          <div className="mb-5">
            <p className="text-xs font-semibold text-slate-500 mb-1">Messaggio AI</p>
            <p className="text-sm text-slate-600 bg-sky-50 rounded-lg p-3 leading-relaxed">{lead.message}</p>
          </div>
        )}

        {/* Tags */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 mb-2">Tag</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((t) => (
              <span key={t} className="px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full text-xs flex items-center gap-1">
                {t}
                <button onClick={() => setTags(tags.filter((x) => x !== t))} className="hover:text-red-500">×</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              placeholder="Aggiungi tag…"
              className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button onClick={addTag} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm">+</button>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 mb-2">Note</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Note sul lead…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
          />
        </div>

        {/* Add activity */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 mb-2">Aggiungi attività</p>
          <input
            value={activityNote}
            onChange={(e) => setActivityNote(e.target.value)}
            placeholder="es. Chiamato, nessuna risposta…"
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-50 mb-6"
        >
          {saving ? 'Salvataggio…' : 'Salva'}
        </button>

        {/* Activity timeline */}
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-3">Timeline attività</p>
          {activities === null ? (
            <p className="text-xs text-slate-400">Caricamento…</p>
          ) : activities.length === 0 ? (
            <p className="text-xs text-slate-400">Nessuna attività</p>
          ) : (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex gap-2 text-sm">
                  <span className="text-slate-300 mt-0.5">•</span>
                  <div>
                    <p className="text-slate-700">{a.content}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(a.createdAt).toLocaleString('it-IT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
