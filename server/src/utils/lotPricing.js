const DEFAULT_SQUARE_METERS = 60;
const INTEREST_RATE = 0.06;
const INTEREST_YEARS = 5;

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

function calculateLotPricing({ squareMeters, pricePerSquareMeter, isSpotCash }) {
  const normalizedSquareMeters = normalizePositiveNumber(squareMeters);
  const normalizedPricePerSquareMeter = normalizePositiveNumber(pricePerSquareMeter);
  const normalizedIsSpotCash = normalizeBoolean(isSpotCash);
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

function derivePricePerSquareMeter({ totalBalance, squareMeters, isSpotCash }) {
  const normalizedTotalBalance = normalizePositiveNumber(totalBalance);
  const normalizedSquareMeters = normalizePositiveNumber(squareMeters);
  const normalizedIsSpotCash = normalizeBoolean(isSpotCash);

  if (!normalizedTotalBalance || !normalizedSquareMeters) {
    return 0;
  }

  const multiplier = normalizedIsSpotCash ? 1 : 1 + INTEREST_RATE * INTEREST_YEARS;
  return roundCurrency(normalizedTotalBalance / (normalizedSquareMeters * multiplier));
}

module.exports = {
  DEFAULT_SQUARE_METERS,
  INTEREST_RATE,
  INTEREST_YEARS,
  roundCurrency,
  normalizeBoolean,
  calculateLotPricing,
  derivePricePerSquareMeter,
};
