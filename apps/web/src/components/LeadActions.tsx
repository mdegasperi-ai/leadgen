'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function DeleteLeadButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Eliminare questo lead?')) return
    setLoading(true)
    const res = await fetch(`/api/leads/${id}`, { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Errore durante l\'eliminazione')
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      title="Elimina lead"
      className="text-slate-300 hover:text-red-500 transition disabled:opacity-50"
    >
      {loading ? '…' : '🗑'}
    </button>
  )
}

export function DeleteAllButton({ count }: { count: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDeleteAll() {
    if (!confirm(`Eliminare TUTTI i ${count} lead? L'azione è irreversibile.`)) return
    setLoading(true)
    const res = await fetch('/api/leads', { method: 'DELETE' })
    if (res.ok) {
      router.refresh()
    } else {
      alert('Errore durante l\'eliminazione')
      setLoading(false)
    }
  }

  if (count === 0) return null

  return (
    <button
      onClick={handleDeleteAll}
      disabled={loading}
      className="text-sm text-red-500 hover:text-red-600 font-medium transition disabled:opacity-50"
    >
      {loading ? 'Eliminazione…' : '🗑 Cancella tutti'}
    </button>
  )
}
