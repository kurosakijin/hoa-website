const DEFAULT_SQUARE_METERS = 60;
const INTEREST_RATE = 0.06;
const DEFAULT_INTEREST_YEARS = 5;

function roundCurrency(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;
}

function normalizePositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeBoolean(value) {
  if (typeof value === 'string') {
    return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
  }

  return value === true || value === 1;
}

function normalizeInterestYears(value) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed)) {
    return DEFAULT_INTEREST_YEARS;
  }

  return Math.min(5, Math.max(1, parsed));
}

function calculateLotPricing({ squareMeters, pricePerSquareMeter, isSpotCash, interestYears }) {
  const normalizedSquareMeters = normalizePositiveNumber(squareMeters);
  const normalizedPricePerSquareMeter = normalizePositiveNumber(pricePerSquareMeter);
  const normalizedIsSpotCash = normalizeBoolean(isSpotCash);
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

function derivePricePerSquareMeter({ totalBalance, squareMeters, isSpotCash, interestYears }) {
  const normalizedTotalBalance = normalizePositiveNumber(totalBalance);
  const normalizedSquareMeters = normalizePositiveNumber(squareMeters);
  const normalizedIsSpotCash = normalizeBoolean(isSpotCash);

  if (!normalizedTotalBalance || !normalizedSquareMeters) {
    return 0;
  }

  const multiplier = normalizedIsSpotCash ? 1 : 1 + INTEREST_RATE * normalizeInterestYears(interestYears);
  return roundCurrency(normalizedTotalBalance / (normalizedSquareMeters * multiplier));
}

module.exports = {
  DEFAULT_SQUARE_METERS,
  INTEREST_RATE,
  DEFAULT_INTEREST_YEARS,
  roundCurrency,
  normalizeBoolean,
  normalizeInterestYears,
  calculateLotPricing,
  derivePricePerSquareMeter,
};
