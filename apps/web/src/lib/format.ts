export function formatMoney(value: number | null | undefined, visibility?: string | null) {
  if (visibility === 'ON_REQUEST' || value == null) return 'Price on request';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

export function locationOf(city?: string, state?: string) {
  return [city, state].filter(Boolean).join(', ') || 'Location not provided';
}
