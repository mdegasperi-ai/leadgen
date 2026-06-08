/**
 * Build a stable deduplication key for a lead.
 * Priority: phone > website domain > name+address.
 * Returns null when there's not enough info to dedupe on.
 */
export function buildDedupeKey(lead: {
  email?: string | null
  phone?: string | null
  website?: string | null
  name?: string | null
  address?: string | null
}): string | null {
  const email = (lead.email || '').toLowerCase().trim()
  if (email.includes('@')) return `email:${email}`

  const phone = (lead.phone || '').replace(/[^\d]/g, '')
  if (phone.length >= 6) return `phone:${phone}`

  if (lead.website) {
    const domain = lead.website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .toLowerCase()
      .trim()
    if (domain) return `web:${domain}`
  }

  const name = (lead.name || '').toLowerCase().trim()
  const address = (lead.address || '').toLowerCase().trim()
  if (name && address) return `na:${name}|${address}`

  return null
}
