/**
 * Consumer vehicle lease (dealer formula).
 * annualRatePercent is the yearly rate the user typed (for example 3.5).
 * residualPercent is a percent of MSRP (for example 50).
 * months is the lease length in months.
 *
 * money factor   = annualRatePercent / 2400
 * residual value = msrp × residualPercent / 100
 * net cost       = sellingPrice − downPayment
 * depreciation   = (net cost − residual value) ÷ months
 * finance charge = (net cost + residual value) × money factor
 * monthly payment = depreciation + finance charge
 */
export function calculateLease({
  msrp,
  sellingPrice,
  downPayment,
  residualPercent,
  annualRatePercent,
  months,
}) {
  if (
    !(msrp >= 0) ||
    !(sellingPrice >= 0) ||
    !(downPayment >= 0) ||
    !(residualPercent >= 0) ||
    !(annualRatePercent >= 0) ||
    !(months > 0)
  ) {
    return null
  }

  if (downPayment > sellingPrice) {
    return null
  }

  const netCost = sellingPrice - downPayment
  const residualValue = roundMoney((msrp * residualPercent) / 100)

  if (residualValue > netCost) {
    return null
  }

  const moneyFactor = annualRatePercent / 2400
  const depreciation = roundMoney((netCost - residualValue) / months)
  const financeCharge = roundMoney((netCost + residualValue) * moneyFactor)
  const monthlyPayment = roundMoney(depreciation + financeCharge)
  const totalDepreciation = roundMoney(depreciation * months)
  const totalFinanceCharge = roundMoney(financeCharge * months)
  const totalOfPayments = roundMoney(monthlyPayment * months)
  const totalCost = roundMoney(totalOfPayments + downPayment)
  const dueAtSigning = roundMoney(downPayment + monthlyPayment)
  const keepCost = roundMoney(totalCost + residualValue)

  return {
    moneyFactor,
    residualValue,
    netCost,
    depreciation,
    financeCharge,
    totalDepreciation,
    totalFinanceCharge,
    monthlyPayment,
    months,
    totalOfPayments,
    totalCost,
    dueAtSigning,
    keepCost,
    downPayment,
  }
}

function roundMoney(amount) {
  return Math.round((amount + Number.EPSILON) * 100) / 100
}
