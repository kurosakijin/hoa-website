export const PAYMENT_METHODS = ['Land Bank', 'BDO', 'BDO Online', 'Bank Transfer', 'GCash', 'Cash'];

function trimValue(value) {
  return String(value || '').trim();
}

export function getPaymentEvidenceLabel(method) {
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

export function resolvePaymentEvidenceLabel(paymentOrMethod) {
  if (paymentOrMethod && typeof paymentOrMethod === 'object') {
    return trimValue(paymentOrMethod.evidenceLabel) || getPaymentEvidenceLabel(paymentOrMethod.method);
  }

  return getPaymentEvidenceLabel(paymentOrMethod);
}

export function getPaymentEvidenceFieldLabel(method) {
  return `${resolvePaymentEvidenceLabel(method)} or proof of payment`;
}

export function getPaymentEvidenceActionLabel(method) {
  return `Show ${resolvePaymentEvidenceLabel(method)}`;
}

export function getPaymentEvidenceEmptyLabel(method) {
  return `No ${resolvePaymentEvidenceLabel(method).toLowerCase()}`;
}

export function getPaymentEvidencePreviewTitle(method, paymentDate) {
  const baseLabel = resolvePaymentEvidenceLabel(method);

  return paymentDate ? `${baseLabel} for ${paymentDate}` : `${baseLabel} preview`;
}

export function getPaymentEvidenceCurrentLabel(method) {
  return `Current saved ${resolvePaymentEvidenceLabel(method).toLowerCase()}`;
}
