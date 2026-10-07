import { useState } from 'react'
import { calculateEmi } from './calculateEmi.js'
import {
  CURRENCIES,
  MONTH_MAX,
  MONTH_MIN,
  RATE_MAX,
  RATE_MIN,
  START_YEARS,
  YEAR_MAX,
  YEAR_MIN,
  formatMoney,
  formatNumber,
} from './currencies.js'
import { deleteCalculation, loadHistory, saveCalculation } from './history.js'
import './App.css'

function formatSavedDate(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function formatTermLabel(term, unit) {
  if (unit === 'years') {
    return `${term} ${term === 1 ? 'year' : 'years'}`
  }
  return `${term} ${term === 1 ? 'month' : 'months'}`
}

function stripCommas(value) {
  return String(value).replace(/,/g, '').trim()
}

function parseNumber(value) {
  const raw = stripCommas(value)
  if (raw === '' || raw === '.') return null
  const number = Number(raw)
  return Number.isFinite(number) ? number : null
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function fillPercent(value, min, max) {
  if (max === min) return 0
  return clamp(((value - min) / (max - min)) * 100, 0, 100)
}

function loanError(text, currency) {
  const amount = parseNumber(text)
  if (amount === null) return 'Enter a loan amount.'
  if (amount < currency.loanMin || amount > currency.loanMax) {
    return `Enter a loan from ${formatMoney(currency.loanMin, currency, 0)} to ${formatMoney(currency.loanMax, currency, 0)}.`
  }
  return ''
}

function rateError(text) {
  const rate = parseNumber(text)
  if (rate === null) return 'Enter an interest rate.'
  if (rate < RATE_MIN || rate > RATE_MAX) {
    return `Enter an interest rate from ${RATE_MIN}% to ${RATE_MAX}% per year.`
  }
  return ''
}

function termError(text, unit) {
  const term = parseNumber(text)
  const min = unit === 'years' ? YEAR_MIN : MONTH_MIN
  const max = unit === 'years' ? YEAR_MAX : MONTH_MAX
  const label = unit === 'years' ? 'years' : 'months'
  if (term === null) return `Enter a term in ${label}.`
  if (!Number.isInteger(term)) return `Enter a whole number of ${label}.`
  if (term < min || term > max) {
    return `Enter a term from ${min} to ${max} ${label}.`
  }
  return ''
}

function termToMonths(term, unit) {
  return unit === 'years' ? term * 12 : term
}

function Donut({ principal, interest }) {
  const total = principal + interest
  const radius = 62
  const circumference = 2 * Math.PI * radius
  const principalShare = total > 0 ? principal / total : 0
  const principalArc = principalShare * circumference
  const principalPct = Math.round(principalShare * 100)

  return (
    <div className="donut-wrap" aria-hidden="true">
      <svg className="donut" viewBox="0 0 168 168">
        <circle cx="84" cy="84" r={radius} fill="none" stroke="#292018" strokeWidth="18" />
        <circle
          className="donut-arc"
          cx="84"
          cy="84"
          r={radius}
          fill="none"
          stroke="#E85D04"
          strokeWidth="18"
          strokeDasharray={`${principalArc} ${circumference - principalArc}`}
          transform="rotate(-90 84 84)"
        />
      </svg>
      <div className="donut-center">
        <strong>{principalPct}%</strong>
        <span>principal</span>
      </div>
    </div>
  )
}

function App() {
  const [currencyId, setCurrencyId] = useState('INR')
  const [loanText, setLoanText] = useState(String(CURRENCIES.INR.loanStart))
  const [rateText, setRateText] = useState(String(CURRENCIES.INR.rateStart))
  const [termText, setTermText] = useState(String(START_YEARS))
  const [termUnit, setTermUnit] = useState('years')
  const [activeField, setActiveField] = useState(null)
  const [history, setHistory] = useState(() => loadHistory())

  const currency = CURRENCIES[currencyId]
  const loanMessage = loanError(loanText, currency)
  const rateMessage = rateError(rateText)
  const termMessage = termError(termText, termUnit)
  const loan = loanMessage ? null : parseNumber(loanText)
  const rate = rateMessage ? null : parseNumber(rateText)
  const term = termMessage ? null : parseNumber(termText)
  const months = term === null ? null : termToMonths(term, termUnit)
  const result =
    loan !== null && rate !== null && months !== null
      ? calculateEmi(loan, rate, months)
      : null

  const loanSlider = loan ?? currency.loanMin
  const rateSlider = rate ?? RATE_MIN
  const termSlider = term ?? (termUnit === 'years' ? YEAR_MIN : MONTH_MIN)
  const termMin = termUnit === 'years' ? YEAR_MIN : MONTH_MIN
  const termMax = termUnit === 'years' ? YEAR_MAX : MONTH_MAX

  function selectCurrency(nextId) {
    if (nextId === currencyId) return
    const next = CURRENCIES[nextId]
    setCurrencyId(nextId)
    setLoanText(String(next.loanStart))
    setRateText(String(next.rateStart))
    setTermText(String(START_YEARS))
    setTermUnit('years')
    setActiveField(null)
  }

  function selectTermUnit(nextUnit) {
    if (nextUnit === termUnit) return
    const current = parseNumber(termText)
    if (current === null || !Number.isInteger(current)) {
      setTermText(nextUnit === 'years' ? String(START_YEARS) : String(START_YEARS * 12))
    } else if (termUnit === 'years') {
      setTermText(String(clamp(current * 12, MONTH_MIN, MONTH_MAX)))
    } else {
      setTermText(String(clamp(Math.round(current / 12), YEAR_MIN, YEAR_MAX)))
    }
    setTermUnit(nextUnit)
    setActiveField(null)
  }

  function displayLoan() {
    if (activeField === 'loan') return loanText
    const amount = parseNumber(loanText)
    if (amount === null) return loanText
    return formatNumber(amount, currency, Number.isInteger(amount) ? 0 : 2)
  }

  function displayRate() {
    if (activeField === 'rate') return rateText
    const value = parseNumber(rateText)
    if (value === null) return rateText
    return String(value)
  }

  function handleSave() {
    if (!result || loan === null || rate === null || term === null || months === null) return
    setHistory(
      saveCalculation({
        currency: currencyId,
        loan,
        rate,
        unit: termUnit,
        term,
        months,
        emi: result.emi,
        principal: result.principal,
        interest: result.interest,
        total: result.total,
      }),
    )
  }

  function handleRestore(item) {
    setCurrencyId(item.currency)
    setLoanText(String(item.loan))
    setRateText(String(item.rate))
    setTermText(String(item.term))
    setTermUnit(item.unit)
    setActiveField(null)
  }

  function handleDelete(event, id) {
    event.stopPropagation()
    setHistory(deleteCalculation(id))
  }

  return (
    <main className="page">
      <header className="header">
        <div>
          <h1 className="brand">
            Daz<span>EMI</span>
          </h1>
          <p className="tagline">See your monthly loan payment as you move the sliders.</p>
        </div>
        <div className="currency-switch" role="group" aria-label="Currency">
          <button
            type="button"
            aria-pressed={currencyId === 'INR'}
            onClick={() => selectCurrency('INR')}
          >
            ₹ Rupees
          </button>
          <button
            type="button"
            aria-pressed={currencyId === 'USD'}
            onClick={() => selectCurrency('USD')}
          >
            $ Dollars
          </button>
        </div>
      </header>

      <div className="layout">
        <section className="card" aria-label="Loan inputs">
          <div className="field">
            <label htmlFor="loan">Loan amount</label>
            <div className="input-wrap">
              <span className="prefix">{currency.id === 'INR' ? '₹' : '$'}</span>
              <input
                id="loan"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(loanMessage)}
                aria-describedby="loan-error"
                value={displayLoan()}
                onFocus={() => {
                  setActiveField('loan')
                  const amount = parseNumber(loanText)
                  if (amount !== null) setLoanText(String(amount))
                }}
                onBlur={() => setActiveField(null)}
                onChange={(event) => {
                  const next = event.target.value
                  if (next === '' || /^[0-9,]*\.?[0-9]{0,2}$/.test(next)) setLoanText(next)
                }}
              />
            </div>
            <input
              className="slider"
              type="range"
              min={currency.loanMin}
              max={currency.loanMax}
              step={currency.loanStep}
              value={loanSlider}
              aria-label="Loan amount slider"
              style={{ '--fill': `${fillPercent(loanSlider, currency.loanMin, currency.loanMax)}%` }}
              onChange={(event) => setLoanText(event.target.value)}
            />
            <div className="range-labels">
              <span>{formatMoney(currency.loanMin, currency, 0)}</span>
              <span>{formatMoney(currency.loanMax, currency, 0)}</span>
            </div>
            <p className="field-error" id="loan-error" role={loanMessage ? 'alert' : undefined}>
              {loanMessage}
            </p>
          </div>

          <div className="field">
            <label htmlFor="rate">Interest rate (% per year)</label>
            <div className="input-wrap">
              <input
                id="rate"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(rateMessage)}
                aria-describedby="rate-error"
                value={displayRate()}
                onFocus={() => setActiveField('rate')}
                onBlur={() => setActiveField(null)}
                onChange={(event) => {
                  const next = event.target.value
                  if (next === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(next)) setRateText(next)
                }}
              />
              <span className="suffix">%</span>
            </div>
            <input
              className="slider"
              type="range"
              min={RATE_MIN}
              max={RATE_MAX}
              step="0.1"
              value={rateSlider}
              aria-label="Interest rate slider"
              style={{ '--fill': `${fillPercent(rateSlider, RATE_MIN, RATE_MAX)}%` }}
              onChange={(event) => setRateText(String(Number(event.target.value)))}
            />
            <div className="range-labels">
              <span>{RATE_MIN}%</span>
              <span>{RATE_MAX}%</span>
            </div>
            <p className="field-error" id="rate-error" role={rateMessage ? 'alert' : undefined}>
              {rateMessage}
            </p>
          </div>

          <div className="field">
            <div className="field-head">
              <label htmlFor="term">Term</label>
              <div className="unit-toggle" role="group" aria-label="Term unit">
                <button
                  type="button"
                  aria-pressed={termUnit === 'months'}
                  onClick={() => selectTermUnit('months')}
                >
                  Months
                </button>
                <button
                  type="button"
                  aria-pressed={termUnit === 'years'}
                  onClick={() => selectTermUnit('years')}
                >
                  Years
                </button>
              </div>
            </div>
            <div className="input-wrap">
              <input
                id="term"
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={Boolean(termMessage)}
                aria-describedby="term-error"
                value={termText}
                onFocus={() => setActiveField('term')}
                onBlur={() => setActiveField(null)}
                onChange={(event) => {
                  const next = event.target.value
                  if (next === '' || /^[0-9]+$/.test(next)) setTermText(next)
                }}
              />
              <span className="suffix">{termUnit === 'years' ? 'yr' : 'mo'}</span>
            </div>
            <input
              className="slider"
              type="range"
              min={termMin}
              max={termMax}
              step="1"
              value={termSlider}
              aria-label="Term slider"
              style={{ '--fill': `${fillPercent(termSlider, termMin, termMax)}%` }}
              onChange={(event) => setTermText(event.target.value)}
            />
            <div className="range-labels">
              <span>
                {termMin} {termMin === 1 ? termUnit.slice(0, -1) : termUnit}
              </span>
              <span>
                {termMax} {termUnit}
              </span>
            </div>
            <p className="field-error" id="term-error" role={termMessage ? 'alert' : undefined}>
              {termMessage}
            </p>
          </div>
        </section>

        <section className="card results" aria-live="polite" aria-label="Loan results">
          <div>
            <p className="eyebrow">Monthly EMI</p>
            <p className="emi-value">{result ? formatMoney(result.emi, currency) : '—'}</p>
          </div>

          {result ? (
            <>
              <ul className="breakdown">
                <li>
                  <span>Principal amount</span>
                  <strong>{formatMoney(result.principal, currency)}</strong>
                </li>
                <li>
                  <span>Interest amount</span>
                  <strong>{formatMoney(result.interest, currency)}</strong>
                </li>
                <li>
                  <span>Total amount</span>
                  <strong>{formatMoney(result.total, currency)}</strong>
                </li>
              </ul>

              <div className="chart-block">
                <Donut principal={result.principal} interest={result.interest} />
                <ul className="legend">
                  <li>
                    <span className="swatch principal" />
                    <p>Principal</p>
                    <small>{formatMoney(result.principal, currency)}</small>
                  </li>
                  <li>
                    <span className="swatch interest" />
                    <p>Interest</p>
                    <small>{formatMoney(result.interest, currency)}</small>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <p className="empty-note">
              Enter a loan amount, yearly interest rate, and term inside the allowed range to see
              your EMI.
            </p>
          )}

          <button
            type="button"
            className="save-button"
            disabled={!result}
            onClick={handleSave}
          >
            Save this calculation
          </button>

          <p className="footnote">
            Interest is calculated per year, then converted to a monthly rate. This is an estimate
            and does not include fees or taxes.
          </p>
        </section>
      </div>

      <section className="card history-card" aria-label="Saved calculations">
        <div className="history-head">
          <p className="eyebrow">Saved calculations</p>
          <p className="history-count">
            {history.length === 0
              ? 'Stored on this browser'
              : `${history.length} saved on this browser`}
          </p>
        </div>

        {history.length === 0 ? (
          <p className="empty-note">No saved calculations yet.</p>
        ) : (
          <ul className="history-list">
            {history.map((item) => {
              const itemCurrency = CURRENCIES[item.currency]
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="history-row"
                    onClick={() => handleRestore(item)}
                  >
                    <span className="history-main">
                      <strong>
                        {formatMoney(item.loan, itemCurrency, 0)} · {item.rate}% ·{' '}
                        {formatTermLabel(item.term, item.unit)}
                      </strong>
                      <small>{formatSavedDate(item.savedAt)}</small>
                    </span>
                    <span className="history-emi">
                      <span>EMI</span>
                      <strong>{formatMoney(item.emi, itemCurrency)}</strong>
                    </span>
                  </button>
                  <button
                    type="button"
                    className="history-delete"
                    onClick={(event) => handleDelete(event, item.id)}
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

export default App
