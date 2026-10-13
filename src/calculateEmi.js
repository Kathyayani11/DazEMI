/**
 * Reducing-balance EMI.
 * annualRatePercent is the yearly rate the user typed (for example 8.5).
 * months is the loan length in months.
 *
 * EMI = P × r × (1 + r)^n / ((1 + r)^n − 1)
 * r = annualRatePercent / 12 / 100
 */
export function calculateEmi(principal, annualRatePercent, months) {
  if (!(principal >= 0) || !(annualRatePercent >= 0) || !(months > 0)) {
    return null
  }

  const monthlyRate = annualRatePercent / 12 / 100
  if (monthlyRate === 0) {
    return {
      emi: roundMoney(principal / months),
      principal,
      interest: 0,
      total: principal,
    }
  }

  const rawEmi =
    (principal * monthlyRate * (1 + monthlyRate) ** months) /
    ((1 + monthlyRate) ** months - 1)

  const emi = roundMoney(rawEmi)
  const total = roundMoney(emi * months)
  const interest = roundMoney(total - principal)

  return { emi, principal, interest, total }
}

function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}
