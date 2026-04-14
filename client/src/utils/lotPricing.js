export const DEFAULT_SQUARE_METERS = 60;
export const INTEREST_RATE = 0.06;
export const DEFAULT_INTEREST_YEARS = 5;
export const INTEREST_YEAR_OPTIONS = ['1', '2', '3', '4', '5'];

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function normalizeInterestYears(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return DEFAULT_INTEREST_YEARS;
  }

  return Math.min(5, Math.max(1, parsed));
}

export function calculateLotPricing({ squareMeters, pricePerSquareMeter, isSpotCash, interestYears }) {
  const normalizedSquareMeters = normalizePositiveNumber(squareMeters);
  const normalizedPricePerSquareMeter = normalizePositiveNumber(pricePerSquareMeter);
  const normalizedIsSpotCash = Boolean(isSpotCash);
  const normalizedInterestYears = normalizeInterestYears(interestYears);
  const cashAmount = roundCurrency(normalizedPricePerSquareMeter * normalizedSquareMeters);
  const annualInterest = normalizedIsSpotCash ? 0 : roundCurrency(cashAmount * INTEREST_RATE);
  const termInterest = normalizedIsSpotCash ? 0 : roundCurrency(annualInterest * normalizedInterestYears);
  const totalBalance = roundCurrency(cashAmount + termInterest);

  return {
    squareMeters: normalizedSquareMeters,
    pricePerSquareMeter: normalizedPricePerSquareMeter,
    isSpotCash: normalizedIsSpotCash,
    interestYears: normalizedInterestYears,
    cashAmount,
    annualInterest,
    termInterest,
    totalBalance,
  };
}

export function derivePricePerSquareMeter({ totalBalance, squareMeters, isSpotCash, interestYears }) {
  const normalizedTotalBalance = normalizePositiveNumber(totalBalance);
  const normalizedSquareMeters = normalizePositiveNumber(squareMeters);

  if (!normalizedTotalBalance || !normalizedSquareMeters) {
    return 0;
  }

  const multiplier = isSpotCash ? 1 : 1 + INTEREST_RATE * normalizeInterestYears(interestYears);
  return roundCurrency(normalizedTotalBalance / (normalizedSquareMeters * multiplier));
}

export function calculateRemainingPreview({
  squareMeters,
  pricePerSquareMeter,
  isSpotCash,
  interestYears,
  paidAmount = 0,
}) {
  const pricing = calculateLotPricing({ squareMeters, pricePerSquareMeter, isSpotCash, interestYears });
  const normalizedPaidAmount = roundCurrency(Math.max(Number(paidAmount) || 0, 0));

  return {
    ...pricing,
    paidAmount: normalizedPaidAmount,
    remainingBalance: roundCurrency(Math.max(pricing.totalBalance - normalizedPaidAmount, 0)),
  };
}
