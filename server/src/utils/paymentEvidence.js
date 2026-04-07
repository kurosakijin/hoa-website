const PAYMENT_METHODS = ['Land Bank', 'BDO', 'BDO Online', 'Bank Transfer', 'GCash', 'Cash'];

function trimValue(value) {
  return typeof value === 'string' ? value.trim() : value;
}

function getPaymentEvidenceLabel(method) {
  switch (trimValue(method)) {
    case 'Land Bank':
    case 'BDO':
      return 'Deposit Slip';
    case 'BDO Online':
    case 'Bank Transfer':
    case 'GCash':
      return 'Screenshot';
    case 'Cash':
    default:
      return 'Receipt';
  }
}

function normalizePaymentMethod(value) {
  const normalized = trimValue(value);

  if (PAYMENT_METHODS.includes(normalized)) {
    return normalized;
  }

  switch (String(normalized).toLowerCase()) {
    case 'check':
      return 'Bank Transfer';
    case 'landbank':
      return 'Land Bank';
    case 'bdo':
      return 'BDO';
    case 'bdo online':
    case 'bdo-online':
    case 'bdoonline':
      return 'BDO Online';
    case 'bank transfer':
    case 'banktransfer':
      return 'Bank Transfer';
    case 'gcash':
      return 'GCash';
    case 'cash':
      return 'Cash';
    default:
      return 'Cash';
  }
}

module.exports = {
  PAYMENT_METHODS,
  getPaymentEvidenceLabel,
  normalizePaymentMethod,
};
