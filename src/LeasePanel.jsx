import { useState } from 'react'
import { calculateLease } from './calculateLease.js'
import { CURRENCIES, formatMoney, formatNumber } from './currencies.js'
import { Donut } from './Donut.jsx'
import {
  deleteLeaseCalculation,
  loadLeaseHistory,
  saveLeaseCalculation,
} from './history.js'
import {
  LEASE_DOWN_START,
  LEASE_MONTH_MAX,
  LEASE_MONTH_MIN,
  LEASE_PRICE_MAX,
  LEASE_PRICE_MIN,
  LEASE_PRICE_START,
  LEASE_PRICE_STEP,
  LEASE_RATE_MAX,
  LEASE_RATE_MIN,
  LEASE_RATE_START,
  LEASE_RESIDUAL_MAX,
  LEASE_RESIDUAL_MIN,
  LEASE_RESIDUAL_START,
  LEASE_START_YEARS,
  LEASE_YEAR_MAX,
  LEASE_YEAR_MIN,
} from './leaseRules.js'

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

function priceError(text, label) {
  const amount = parseNumber(text)
  if (amount === null) return `Enter a ${label}.`
  if (amount < LEASE_PRICE_MIN || amount > LEASE_PRICE_MAX) {
    return `Enter a ${label} from ${formatMoney(LEASE_PRICE_MIN, CURRENCIES.USD, 0)} to ${formatMoney(LEASE_PRICE_MAX, CURRENCIES.USD, 0)}.`
  }
  return ''
}

function downError(text, sellingPrice) {
  const amount = parseNumber(text)
  if (amount === null) return 'Enter a down payment.'
  if (sellingPrice === null) return ''
  if (amount < 0 || amount > sellingPrice) {
    return `Enter a down payment from ${formatMoney(0, CURRENCIES.USD, 0)} to ${formatMoney(sellingPrice, CURRENCIES.USD, 0)}.`
  }
  return ''
}

function residualError(text) {
  const value = parseNumber(text)
  if (value === null) return 'Enter a residual percent.'
  if (value < LEASE_RESIDUAL_MIN || value > LEASE_RESIDUAL_MAX) {
    return `Enter a residual from ${LEASE_RESIDUAL_MIN}% to ${LEASE_RESIDUAL_MAX}% of MSRP.`
  }
  return ''
}

function rateError(text) {
  const rate = parseNumber(text)
  if (rate === null) return 'Enter an interest rate.'
  if (rate < LEASE_RATE_MIN || rate > LEASE_RATE_MAX) {
    return `Enter an interest rate from ${LEASE_RATE_MIN}% to ${LEASE_RATE_MAX}% per year.`
  }
  return ''
}

function termError(text, unit) {
  const term = parseNumber(text)
  const min = unit === 'years' ? LEASE_YEAR_MIN : LEASE_MONTH_MIN
  const max = unit === 'years' ? LEASE_YEAR_MAX : LEASE_MONTH_MAX
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

function residualValueOf(msrp, residualPercent) {
  return Math.round(((msrp * residualPercent) / 100 + Number.EPSILON) * 100) / 100
}

function formatMoneyFactor(value) {
  return value.toFixed(8).replace(/0+$/, '').replace(/\.$/, '')
}

export function LeasePanel() {
  const currency = CURRENCIES.USD
  const [msrpText, setMsrpText] = useState(String(LEASE_PRICE_START))
  const [sellingText, setSellingText] = useState(String(LEASE_PRICE_START))
  const [downText, setDownText] = useState(String(LEASE_DOWN_START))
  const [residualText, setResidualText] = useState(String(LEASE_RESIDUAL_START))
  const [rateText, setRateText] = useState(String(LEASE_RATE_START))
  const [termText, setTermText] = useState(String(LEASE_START_YEARS))
  const [termUnit, setTermUnit] = useState('years')
  const [activeField, setActiveField] = useState(null)
  const [history, setHistory] = useState(() => loadLeaseHistory())

  const msrpMessage = priceError(msrpText, 'MSRP')
  const sellingMessage = priceError(sellingText, 'selling price')
  const msrp = msrpMessage ? null : parseNumber(msrpText)
  const sellingPrice = sellingMessage ? null : parseNumber(sellingText)
  const downMessage = downError(downText, sellingPrice)
  const residualMessage = residualError(residualText)
  const rateMessage = rateError(rateText)
  const termMessage = termError(termText, termUnit)
  const downPayment = downMessage ? null : parseNumber(downText)
  const residualPercent = residualMessage ? null : parseNumber(residualText)
  const rate = rateMessage ? null : parseNumber(rateText)
  const term = termMessage ? null : parseNumber(termText)
  const months = term === null ? null : termToMonths(term, termUnit)

  const inputsReady =
    msrp !== null &&
    sellingPrice !== null &&
    downPayment !== null &&
    residualPercent !== null &&
    rate !== null &&
    months !== null

  const residualTooHigh =
    inputsReady &&
    months > 0 &&
    residualValueOf(msrp, residualPercent) > sellingPrice - downPayment

  const result =
    inputsReady && months > 0 && !residualTooHigh
      ? calculateLease({
          msrp,
          sellingPrice,
          downPayment,
          residualPercent,
          annualRatePercent: rate,
          months,
        })
      : null

  const msrpSlider = msrp ?? LEASE_PRICE_MIN
  const sellingSlider = sellingPrice ?? LEASE_PRICE_MIN
  const downMax = sellingPrice ?? LEASE_PRICE_MIN
  const downSlider = downPayment ?? LEASE_DOWN_START
  const residualSlider = residualPercent ?? LEASE_RESIDUAL_MIN
  const rateSlider = rate ?? LEASE_RATE_MIN
  const termSlider = term ?? (termUnit === 'years' ? LEASE_YEAR_MIN : LEASE_MONTH_MIN)
  const termMin = termUnit === 'years' ? LEASE_YEAR_MIN : LEASE_MONTH_MIN
  const termMax = termUnit === 'years' ? LEASE_YEAR_MAX : LEASE_MONTH_MAX

  function selectTermUnit(nextUnit) {
    if (nextUnit === termUnit) return
    const current = parseNumber(termText)
    if (current === null || !Number.isInteger(current)) {
      setTermText(
        nextUnit === 'years' ? String(LEASE_START_YEARS) : String(LEASE_START_YEARS * 12),
      )
    } else if (termUnit === 'years') {
      setTermText(String(clamp(current * 12, LEASE_MONTH_MIN, LEASE_MONTH_MAX)))
    } else {
      setTermText(String(clamp(Math.round(current / 12), LEASE_YEAR_MIN, LEASE_YEAR_MAX)))
    }
    setTermUnit(nextUnit)
    setActiveField(null)
  }

  function displayMoney(field, text) {
    if (activeField === field) return text
    const amount = parseNumber(text)
    if (amount === null) return text
    return formatNumber(amount, currency, Number.isInteger(amount) ? 0 : 2)
  }

  function displayPlain(field, text) {
    if (activeField === field) return text
    const value = parseNumber(text)
    if (value === null) return text
    return String(value)
  }

  function handleSave() {
    if (!result || !inputsReady || term === null) return
    setHistory(
      saveLeaseCalculation({
        msrp,
        sellingPrice,
        downPayment,
        residualPercent,
        rate,
        unit: termUnit,
        term,
        months,
        monthlyPayment: result.monthlyPayment,
        depreciation: result.depreciation,
        financeCharge: result.financeCharge,
        totalDepreciation: result.totalDepreciation,
        totalFinanceCharge: result.totalFinanceCharge,
        residualValue: result.residualValue,
        totalOfPayments: result.totalOfPayments,
        totalCost: result.totalCost,
        dueAtSigning: result.dueAtSigning,
        keepCost: result.keepCost,
        moneyFactor: result.moneyFactor,
      }),
    )
  }

  function handleRestore(item) {
    setMsrpText(String(item.msrp))
    setSellingText(String(item.sellingPrice))
    setDownText(String(item.downPayment))
    setResidualText(String(item.residualPercent))
    setRateText(String(item.rate))
    setTermText(String(item.term))
    setTermUnit(item.unit)
    setActiveField(null)
  }

  function handleDelete(event, id) {
    event.stopPropagation()
    setHistory(deleteLeaseCalculation(id))
  }

  function emptyNote() {
    if (months === 0) return 'Enter a term of at least 1 month to see your lease payment.'
    if (residualTooHigh) {
      return 'Residual value is higher than the amount being leased. Lower the residual or raise the selling price.'
    }
    return 'Enter MSRP, selling price, down payment, residual, yearly interest rate, and term inside the allowed range to see your lease payment.'
  }

  return (
    <>
      <div className="layout">
        <section className="card" aria-label="Lease inputs">
          <div className="field">
            <label htmlFor="msrp">MSRP</label>
            <div className="input-wrap">
              <span className="prefix">$</span>
              <input
                id="msrp"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(msrpMessage)}
                aria-describedby="msrp-error"
                value={displayMoney('msrp', msrpText)}
                onFocus={() => {
                  setActiveField('msrp')
                  const amount = parseNumber(msrpText)
                  if (amount !== null) setMsrpText(String(amount))
                }}
                onBlur={() => setActiveField(null)}
                onChange={(event) => {
                  const next = event.target.value
                  if (next === '' || /^[0-9,]*\.?[0-9]{0,2}$/.test(next)) setMsrpText(next)
                }}
              />
            </div>
            <input
              className="slider"
              type="range"
              min={LEASE_PRICE_MIN}
              max={LEASE_PRICE_MAX}
              step={LEASE_PRICE_STEP}
              value={msrpSlider}
              aria-label="MSRP slider"
              style={{ '--fill': `${fillPercent(msrpSlider, LEASE_PRICE_MIN, LEASE_PRICE_MAX)}%` }}
              onChange={(event) => setMsrpText(event.target.value)}
            />
            <div className="range-labels">
              <span>{formatMoney(LEASE_PRICE_MIN, currency, 0)}</span>
              <span>{formatMoney(LEASE_PRICE_MAX, currency, 0)}</span>
            </div>
            <p className="field-error" id="msrp-error" role={msrpMessage ? 'alert' : undefined}>
              {msrpMessage}
            </p>
          </div>

          <div className="field">
            <label htmlFor="selling">Selling price</label>
            <div className="input-wrap">
              <span className="prefix">$</span>
              <input
                id="selling"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(sellingMessage)}
                aria-describedby="selling-error"
                value={displayMoney('selling', sellingText)}
                onFocus={() => {
                  setActiveField('selling')
                  const amount = parseNumber(sellingText)
                  if (amount !== null) setSellingText(String(amount))
                }}
                onBlur={() => setActiveField(null)}
                onChange={(event) => {
                  const next = event.target.value
                  if (next === '' || /^[0-9,]*\.?[0-9]{0,2}$/.test(next)) setSellingText(next)
                }}
              />
            </div>
            <input
              className="slider"
              type="range"
              min={LEASE_PRICE_MIN}
              max={LEASE_PRICE_MAX}
              step={LEASE_PRICE_STEP}
              value={sellingSlider}
              aria-label="Selling price slider"
              style={{
                '--fill': `${fillPercent(sellingSlider, LEASE_PRICE_MIN, LEASE_PRICE_MAX)}%`,
              }}
              onChange={(event) => setSellingText(event.target.value)}
            />
            <div className="range-labels">
              <span>{formatMoney(LEASE_PRICE_MIN, currency, 0)}</span>
              <span>{formatMoney(LEASE_PRICE_MAX, currency, 0)}</span>
            </div>
            <p
              className="field-error"
              id="selling-error"
              role={sellingMessage ? 'alert' : undefined}
            >
              {sellingMessage}
            </p>
          </div>

          <div className="field">
            <label htmlFor="down">Down payment</label>
            <div className="input-wrap">
              <span className="prefix">$</span>
              <input
                id="down"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(downMessage)}
                aria-describedby="down-error"
                value={displayMoney('down', downText)}
                onFocus={() => {
                  setActiveField('down')
                  const amount = parseNumber(downText)
                  if (amount !== null) setDownText(String(amount))
                }}
                onBlur={() => setActiveField(null)}
                onChange={(event) => {
                  const next = event.target.value
                  if (next === '' || /^[0-9,]*\.?[0-9]{0,2}$/.test(next)) setDownText(next)
                }}
              />
            </div>
            <input
              className="slider"
              type="range"
              min={0}
              max={Math.max(downMax, 0)}
              step={LEASE_PRICE_STEP}
              value={clamp(downSlider, 0, Math.max(downMax, 0))}
              aria-label="Down payment slider"
              style={{
                '--fill': `${fillPercent(clamp(downSlider, 0, Math.max(downMax, 0)), 0, Math.max(downMax, 0))}%`,
              }}
              onChange={(event) => setDownText(event.target.value)}
            />
            <div className="range-labels">
              <span>{formatMoney(0, currency, 0)}</span>
              <span>{formatMoney(Math.max(downMax, 0), currency, 0)}</span>
            </div>
            <p className="field-error" id="down-error" role={downMessage ? 'alert' : undefined}>
              {downMessage}
            </p>
          </div>

          <div className="field">
            <label htmlFor="residual">Residual (% of MSRP)</label>
            <div className="input-wrap">
              <input
                id="residual"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(residualMessage)}
                aria-describedby="residual-error"
                value={displayPlain('residual', residualText)}
                onFocus={() => setActiveField('residual')}
                onBlur={() => setActiveField(null)}
                onChange={(event) => {
                  const next = event.target.value
                  if (next === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(next)) setResidualText(next)
                }}
              />
              <span className="suffix">%</span>
            </div>
            <input
              className="slider"
              type="range"
              min={LEASE_RESIDUAL_MIN}
              max={LEASE_RESIDUAL_MAX}
              step="1"
              value={residualSlider}
              aria-label="Residual slider"
              style={{
                '--fill': `${fillPercent(residualSlider, LEASE_RESIDUAL_MIN, LEASE_RESIDUAL_MAX)}%`,
              }}
              onChange={(event) => setResidualText(event.target.value)}
            />
            <div className="range-labels">
              <span>{LEASE_RESIDUAL_MIN}%</span>
              <span>{LEASE_RESIDUAL_MAX}%</span>
            </div>
            <p
              className="field-error"
              id="residual-error"
              role={residualMessage ? 'alert' : undefined}
            >
              {residualMessage}
            </p>
          </div>

          <div className="field">
            <label htmlFor="lease-rate">Interest rate (% per year)</label>
            <div className="input-wrap">
              <input
                id="lease-rate"
                inputMode="decimal"
                autoComplete="off"
                aria-invalid={Boolean(rateMessage)}
                aria-describedby="lease-rate-error"
                value={displayPlain('rate', rateText)}
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
              min={LEASE_RATE_MIN}
              max={LEASE_RATE_MAX}
              step="0.1"
              value={rateSlider}
              aria-label="Lease interest rate slider"
              style={{ '--fill': `${fillPercent(rateSlider, LEASE_RATE_MIN, LEASE_RATE_MAX)}%` }}
              onChange={(event) => setRateText(String(Number(event.target.value)))}
            />
            <div className="range-labels">
              <span>{LEASE_RATE_MIN}%</span>
              <span>{LEASE_RATE_MAX}%</span>
            </div>
            <p
              className="field-error"
              id="lease-rate-error"
              role={rateMessage ? 'alert' : undefined}
            >
              {rateMessage}
            </p>
          </div>

          <div className="field">
            <div className="field-head">
              <label htmlFor="lease-term">Term</label>
              <div className="unit-toggle" role="group" aria-label="Lease term unit">
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
                id="lease-term"
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={Boolean(termMessage)}
                aria-describedby="lease-term-error"
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
              aria-label="Lease term slider"
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
            <p
              className="field-error"
              id="lease-term-error"
              role={termMessage ? 'alert' : undefined}
            >
              {termMessage}
            </p>
          </div>
        </section>

        <section className="card results" aria-live="polite" aria-label="Lease results">
          <div>
            <p className="eyebrow">Total monthly payment</p>
            <p className="emi-value">
              {result ? formatMoney(result.monthlyPayment, currency) : '—'}
            </p>
          </div>

          {result ? (
            <>
              <div className="result-group">
                <p className="result-group-title">Each month</p>
                <ul className="breakdown">
                  <li>
                    <span>Depreciation</span>
                    <strong>{formatMoney(result.depreciation, currency)}</strong>
                  </li>
                  <li>
                    <span>Finance charge</span>
                    <strong>{formatMoney(result.financeCharge, currency)}</strong>
                  </li>
                  <li>
                    <span>Total depreciation</span>
                    <strong>{formatMoney(result.totalDepreciation, currency)}</strong>
                  </li>
                  <li>
                    <span>Total finance charge</span>
                    <strong>{formatMoney(result.totalFinanceCharge, currency)}</strong>
                  </li>
                </ul>
              </div>

              <div className="result-group">
                <p className="result-group-title">At signing</p>
                <ul className="breakdown">
                  <li>
                    <span>Down payment</span>
                    <strong>{formatMoney(result.downPayment, currency)}</strong>
                  </li>
                  <li>
                    <span>Due at signing</span>
                    <strong>{formatMoney(result.dueAtSigning, currency)}</strong>
                  </li>
                </ul>
              </div>

              <div className="result-group">
                <p className="result-group-title">If you return the vehicle</p>
                <ul className="breakdown">
                  <li>
                    <span>Number of payments</span>
                    <strong>{result.months}</strong>
                  </li>
                  <li>
                    <span>Total of payments</span>
                    <strong>{formatMoney(result.totalOfPayments, currency)}</strong>
                  </li>
                  <li>
                    <span>Total cost</span>
                    <strong>{formatMoney(result.totalCost, currency)}</strong>
                  </li>
                </ul>
              </div>

              <div className="result-group">
                <p className="result-group-title">If you keep the vehicle</p>
                <ul className="breakdown">
                  <li>
                    <span>Residual value</span>
                    <strong>{formatMoney(result.residualValue, currency)}</strong>
                  </li>
                  <li>
                    <span>Cost if you keep it</span>
                    <strong>{formatMoney(result.keepCost, currency)}</strong>
                  </li>
                </ul>
              </div>

              <div className="chart-block">
                <Donut
                  primary={result.depreciation}
                  secondary={result.financeCharge}
                  label="depreciation"
                />
                <ul className="legend">
                  <li>
                    <span className="swatch principal" />
                    <p>Depreciation</p>
                    <small>{formatMoney(result.depreciation, currency)}</small>
                  </li>
                  <li>
                    <span className="swatch interest" />
                    <p>Finance charge</p>
                    <small>{formatMoney(result.financeCharge, currency)}</small>
                  </li>
                </ul>
              </div>

              <p className="money-factor">
                Money factor <strong>{formatMoneyFactor(result.moneyFactor)}</strong>
              </p>
            </>
          ) : (
            <p className="empty-note">{emptyNote()}</p>
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
            Estimate for a consumer vehicle lease. Interest is converted to a money factor. This
            does not include tax, fees, or mileage charges.
          </p>
        </section>
      </div>

      <section className="card history-card" aria-label="Saved lease calculations">
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
            {history.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className="history-row"
                  onClick={() => handleRestore(item)}
                >
                  <span className="history-main">
                    <strong>
                      {formatMoney(item.msrp, currency, 0)} MSRP · {item.residualPercent}% residual
                      · {item.rate}% · {formatTermLabel(item.term, item.unit)}
                    </strong>
                    <small>{formatSavedDate(item.savedAt)}</small>
                  </span>
                  <span className="history-emi">
                    <span>Payment</span>
                    <strong>{formatMoney(item.monthlyPayment, currency)}</strong>
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
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
