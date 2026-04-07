export const PAYMENT_METHODS = ['Land Bank', 'BDO', 'BDO Online', 'Bank Transfer', 'GCash', 'Cash'];

export function getPaymentEvidenceLabel(method) {
  switch (String(method || '').trim()) {
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

export function getPaymentEvidenceFieldLabel(method) {
  return `${getPaymentEvidenceLabel(method)} or proof of payment`;
}

export function getPaymentEvidenceActionLabel(method) {
  return `Show ${getPaymentEvidenceLabel(method)}`;
}

export function getPaymentEvidenceEmptyLabel(method) {
  return `No ${getPaymentEvidenceLabel(method).toLowerCase()}`;
}

export function getPaymentEvidencePreviewTitle(method, paymentDate) {
  const baseLabel = getPaymentEvidenceLabel(method);

  return paymentDate ? `${baseLabel} for ${paymentDate}` : `${baseLabel} preview`;
}

export function getPaymentEvidenceCurrentLabel(method) {
  return `Current saved ${getPaymentEvidenceLabel(method).toLowerCase()}`;
}
