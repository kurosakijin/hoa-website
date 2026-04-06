export const DEFAULT_SQUARE_METERS = 60;
export const INTEREST_RATE = 0.06;
export const INTEREST_YEARS = 5;

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function calculateLotPricing({ squareMeters, pricePerSquareMeter, isSpotCash }) {
  const normalizedSquareMeters = normalizePositiveNumber(squareMeters);
  const normalizedPricePerSquareMeter = normalizePositiveNumber(pricePerSquareMeter);
  const normalizedIsSpotCash = Boolean(isSpotCash);
  const cashAmount = roundCurrency(normalizedPricePerSquareMeter * normalizedSquareMeters);
  const annualInterest = normalizedIsSpotCash ? 0 : roundCurrency(cashAmount * INTEREST_RATE);
  const fiveYearInterest = normalizedIsSpotCash ? 0 : roundCurrency(annualInterest * INTEREST_YEARS);
  const totalBalance = roundCurrency(cashAmount + fiveYearInterest);

  return {
    squareMeters: normalizedSquareMeters,
    pricePerSquareMeter: normalizedPricePerSquareMeter,
    isSpotCash: normalizedIsSpotCash,
    cashAmount,
    annualInterest,
    fiveYearInterest,
    totalBalance,
  };
}

export function derivePricePerSquareMeter({ totalBalance, squareMeters, isSpotCash }) {
  const normalizedTotalBalance = normalizePositiveNumber(totalBalance);
  const normalizedSquareMeters = normalizePositiveNumber(squareMeters);

  if (!normalizedTotalBalance || !normalizedSquareMeters) {
    return 0;
  }

  const multiplier = isSpotCash ? 1 : 1 + INTEREST_RATE * INTEREST_YEARS;
  return roundCurrency(normalizedTotalBalance / (normalizedSquareMeters * multiplier));
}

export function calculateRemainingPreview({ squareMeters, pricePerSquareMeter, isSpotCash, paidAmount = 0 }) {
  const pricing = calculateLotPricing({ squareMeters, pricePerSquareMeter, isSpotCash });
  const normalizedPaidAmount = roundCurrency(Math.max(Number(paidAmount) || 0, 0));

  return {
    ...pricing,
    paidAmount: normalizedPaidAmount,
    remainingBalance: roundCurrency(Math.max(pricing.totalBalance - normalizedPaidAmount, 0)),
  };
}
