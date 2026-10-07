const STORAGE_KEY = 'dazemi-history'
const MAX_ITEMS = 20

export function loadHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isHistoryItem)
  } catch {
    return []
  }
}

export function saveCalculation(item) {
  const nextItem = {
    ...item,
    id: item.id ?? String(Date.now()),
    savedAt: item.savedAt ?? new Date().toISOString(),
  }
  const list = [nextItem, ...loadHistory()].slice(0, MAX_ITEMS)
  writeHistory(list)
  return list
}

export function deleteCalculation(id) {
  const list = loadHistory().filter((item) => item.id !== id)
  writeHistory(list)
  return list
}

function writeHistory(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function isHistoryItem(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    (item.currency === 'INR' || item.currency === 'USD') &&
    typeof item.loan === 'number' &&
    typeof item.rate === 'number' &&
    (item.unit === 'years' || item.unit === 'months') &&
    typeof item.term === 'number' &&
    typeof item.months === 'number' &&
    typeof item.emi === 'number' &&
    typeof item.principal === 'number' &&
    typeof item.interest === 'number' &&
    typeof item.total === 'number' &&
    typeof item.savedAt === 'string'
  )
}
