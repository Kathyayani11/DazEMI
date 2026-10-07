export const RATE_MIN = 1
export const RATE_MAX = 20
export const YEAR_MIN = 1
export const YEAR_MAX = 30
export const MONTH_MIN = 12
export const MONTH_MAX = 360
export const START_YEARS = 5

export const CURRENCIES = {
  INR: {
    id: 'INR',
    label: 'Rupees',
    locale: 'en-IN',
    loanMin: 100000,
    loanMax: 10000000,
    loanStart: 1000000,
    loanStep: 10000,
    rateStart: 8.5,
  },
  USD: {
    id: 'USD',
    label: 'Dollars',
    locale: 'en-US',
    loanMin: 20000,
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
