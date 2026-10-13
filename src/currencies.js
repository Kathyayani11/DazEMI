export const RATE_MIN = 0
export const RATE_MAX = 20
export const YEAR_MIN = 0
export const YEAR_MAX = 30
export const MONTH_MIN = 0
export const MONTH_MAX = 360
export const START_YEARS = 5

export const CURRENCIES = {
  USD: {
    id: 'USD',
    label: 'Dollars',
    locale: 'en-US',
    loanMin: 0,
    loanMax: 1000000,
    loanStart: 50000,
    loanStep: 1000,
    rateStart: 3.5,
  },
}

export function formatMoney(amount, currency, digits = 2) {
  return new Intl.NumberFormat(currency.locale, {
    style: 'currency',
    currency: currency.id,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}

export function formatNumber(amount, currency, digits = 0) {
  return new Intl.NumberFormat(currency.locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}
