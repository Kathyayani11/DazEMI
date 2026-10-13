const STORAGE_KEY = 'dazemi-history'
const LEASE_STORAGE_KEY = 'dazemi-lease-history'
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

export function loadLeaseHistory() {
  try {
    const raw = localStorage.getItem(LEASE_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isLeaseHistoryItem)
  } catch {
    return []
  }
}

export function saveLeaseCalculation(item) {
  const nextItem = {
    ...item,
    id: item.id ?? String(Date.now()),
    savedAt: item.savedAt ?? new Date().toISOString(),
  }
  const list = [nextItem, ...loadLeaseHistory()].slice(0, MAX_ITEMS)
  writeLeaseHistory(list)
  return list
}

export function deleteLeaseCalculation(id) {
  const list = loadLeaseHistory().filter((item) => item.id !== id)
  writeLeaseHistory(list)
  return list
}

function writeHistory(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

function writeLeaseHistory(list) {
  localStorage.setItem(LEASE_STORAGE_KEY, JSON.stringify(list))
}

function isHistoryItem(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    item.currency === 'USD' &&
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

function isLeaseHistoryItem(item) {
  return (
    item &&
    typeof item === 'object' &&
    typeof item.id === 'string' &&
    typeof item.msrp === 'number' &&
    typeof item.sellingPrice === 'number' &&
    typeof item.downPayment === 'number' &&
    typeof item.residualPercent === 'number' &&
    typeof item.rate === 'number' &&
    (item.unit === 'years' || item.unit === 'months') &&
    typeof item.term === 'number' &&
    typeof item.months === 'number' &&
    typeof item.monthlyPayment === 'number' &&
    typeof item.depreciation === 'number' &&
    typeof item.financeCharge === 'number' &&
    typeof item.totalDepreciation === 'number' &&
    typeof item.totalFinanceCharge === 'number' &&
    typeof item.residualValue === 'number' &&
    typeof item.totalOfPayments === 'number' &&
    typeof item.totalCost === 'number' &&
    typeof item.dueAtSigning === 'number' &&
    typeof item.keepCost === 'number' &&
    typeof item.moneyFactor === 'number' &&
    typeof item.savedAt === 'string'
  )
}
