// The backend stores UTC but serialises datetimes without a timezone suffix,
// so without the 'Z' fix below the browser would read them as local time and
// show the wrong clock time.
function parse(value) {
  if (!value) return null
  if (value instanceof Date) return value
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(value)
  const d = new Date(hasZone ? value : value + 'Z')
  return Number.isNaN(d.getTime()) ? null : d
}

export function formatTime(value) {
  const d = parse(value)
  return d ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : ''
}

export function formatDateTime(value) {
  const d = parse(value)
  return d
    ? d.toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
    : ''
}
