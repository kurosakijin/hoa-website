import { useEffect, useRef, useState } from 'react';
import ImagePreviewModal from './ImagePreviewModal';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDateOnly, toDateInputValue } from '../utils/format';
import { formatResidentFullName } from '../utils/middleInitial';
import {
  getPaymentEvidenceActionLabel,
  getPaymentEvidenceCurrentLabel,
  getPaymentEvidenceEmptyLabel,
  getPaymentEvidenceFieldLabel,
  getPaymentEvidencePreviewTitle,
  PAYMENT_METHODS,
  resolvePaymentEvidenceLabel,
} from '../utils/paymentEvidence';

const PAYMENT_TYPES = ['Monthly Dues', 'Advance Pay'];

function revokeObjectPreview(url) {
  if (typeof url === 'string' && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

function createPaymentForm(payment) {
  return {
    amount: payment?.amount || 0,
    method: payment?.method || 'Cash',
    type: payment?.type || 'Monthly Dues',
    paymentDate: toDateInputValue(payment?.paymentDate),
    notes: payment?.notes || '',
  };
}

function getResidentInitials(detail) {
  return [detail?.firstName?.[0], detail?.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'SH';
}

function validatePaymentForm(form) {
  if (!(Number(form.amount) > 0)) {
    return 'Payment amount must be greater than zero.';
  }

  if (!String(form.paymentDate || '').trim()) {
    return 'Payment date is required.';
  }

  return '';
}

function PaymentLotModal({
  isOpen,
  detail,
  loading,
  onClose,
  onCreatePayment,
  onUpdatePayment,
  onDeletePayment,
}) {
  const toast = useToast();
  const [editingPayment, setEditingPayment] = useState(null);
  const [form, setForm] = useState(createPaymentForm());
  const [receiptImageFile, setReceiptImageFile] = useState(null);
  const [receiptImagePreview, setReceiptImagePreview] = useState('');
  const [receiptPreviewModal, setReceiptPreviewModal] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const receiptInputRef = useRef(null);
  const activeMethod = form.method || editingPayment?.method || 'Cash';
  const activeEvidenceLabel = resolvePaymentEvidenceLabel(activeMethod);

  function resetReceiptSelection(nextPreview = '') {
    revokeObjectPreview(receiptImagePreview);
    setReceiptImageFile(null);
    setReceiptImagePreview(nextPreview);

    if (receiptInputRef.current) {
      receiptInputRef.current.value = '';
    }
  }

  useEffect(() => {
    setEditingPayment(null);
    setForm(createPaymentForm());
    resetReceiptSelection('');
    setReceiptPreviewModal(null);
  }, [detail, isOpen]);

  useEffect(() => {
    setForm(createPaymentForm(editingPayment));
    resetReceiptSelection(editingPayment?.receiptImageUrl || '');
  }, [editingPayment]);

  function handleReceiptImageChange(event) {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    revokeObjectPreview(receiptImagePreview);
    setReceiptImageFile(nextFile);
    setReceiptImagePreview(URL.createObjectURL(nextFile));
  }

  useEffect(() => () => revokeObjectPreview(receiptImagePreview), [receiptImagePreview]);

  function getPaymentRowState(payment) {
    const isEditingCurrentPayment = editingPayment?.id === payment.id;
    const rowMethod = isEditingCurrentPayment ? form.method || payment.method : payment.method;
    const evidenceSource = isEditingCurrentPayment
      ? {
          ...payment,
          method: rowMethod,
          evidenceLabel: activeEvidenceLabel,
        }
      : payment;
    const evidenceImageUrl = isEditingCurrentPayment && receiptImagePreview ? receiptImagePreview : payment.receiptImageUrl;

    return {
      rowMethod,
      evidenceSource,
      evidenceImageUrl,
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validatePaymentForm(form);

    if (validationError) {
      toast.warning({
        title: 'Payment details are incomplete',
        message: validationError,
      });
      return;
    }

    setIsSaving(true);

    try {
      if (editingPayment) {
        await onUpdatePayment(editingPayment.id, {
          ...form,
          receiptImageFile,
          amount: Number(form.amount),
        });
      } else {
        await onCreatePayment({
          residentId: detail.residentId,
          lotId: detail.lot.id,
          ...form,
          receiptImageFile,
          amount: Number(form.amount),
        });
      }

      toast.success({
        title: editingPayment ? 'Payment updated' : 'Payment recorded',
        message: editingPayment
          ? `The payment entry and ${activeEvidenceLabel.toLowerCase()} details were updated.`
          : 'The payment entry was added to the resident ledger.',
      });
      setEditingPayment(null);
      setForm(createPaymentForm());
      resetReceiptSelection('');
    } catch (submitError) {
      toast.error({
        title: editingPayment ? 'Could not update payment' : 'Could not record payment',
        message: submitError.message,
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(paymentId) {
    const confirmed = await toast.confirm({
      title: 'Remove this payment record?',
      message: 'This will permanently delete the selected payment history entry.',
      type: 'error',
      confirmLabel: 'Remove payment',
      cancelLabel: 'Keep payment',
    });

    if (!confirmed) {
      return;
    }

    try {
      await onDeletePayment(paymentId);
      toast.success({
        title: 'Payment removed',
        message: 'The selected payment history entry is gone.',
      });
    } catch (deleteError) {
      toast.error({
        title: 'Could not remove payment',
        message: deleteError.message,
      });
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        title="Lot payment details"
        description="Review the assigned lot, post payments, upload proof of payment, and inspect exact payment dates from the resident ledger."
        onClose={onClose}
        wide
      >
        {loading || !detail ? (
          <div className="surface-card p-6 text-sm text-slate-300">Loading lot details...</div>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="surface-card p-5">
                <p className="eyebrow">Resident profile</p>
                <div className="resident-lookup-profile resident-lookup-profile--compact">
                  <div className="resident-lookup-profile__photo">
                    {detail.profileImageUrl ? (
                      <img src={detail.profileImageUrl} alt={detail.residentName} className="resident-lookup-profile__image" />
                    ) : (
                      <span>{getResidentInitials(detail)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="mt-2 text-xl font-semibold text-white">{formatResidentFullName(detail)}</h3>
                    <p className="mt-2 text-sm text-slate-400">Resident ID: {detail.residentCode}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p>Contact: {detail.contactNumber}</p>
                  <p>Address: {detail.address}</p>
                  <p>Block {detail.lot.block} / Lot {detail.lot.lotNumber}</p>
                  <p>{detail.lot.squareMeters} sqm assigned</p>
                  <p>Price per sqm: {formatCurrency(detail.lot.pricePerSquareMeter)}</p>
                  <p>Billing basis: {detail.lot.isSpotCash ? 'Cash' : 'Installment with 5-year interest'}</p>
                  <p>Total balance: {formatCurrency(detail.lot.totalBalance)}</p>
                  <p>Remaining balance: {formatCurrency(detail.lot.remainingBalance)}</p>
                </div>
              </div>

              <form className="surface-card p-5" onSubmit={handleSubmit} noValidate>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="eyebrow">{editingPayment ? 'Edit payment' : 'Add payment'}</p>
                    <h3 className="mt-2 text-xl font-semibold text-white">
                      {editingPayment ? 'Update posted transaction' : 'Record a new payment'}
                    </h3>
                  </div>
                  {editingPayment ? (
                    <button
                      type="button"
                      className="action-button action-button--ghost"
                      onClick={() => {
                        setEditingPayment(null);
                        setForm(createPaymentForm());
                        resetReceiptSelection('');
                      }}
                    >
                      Cancel edit
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="field-shell">
                    <span>Amount</span>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={form.amount}
                      onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    />
                  </label>
                  <label className="field-shell">
                    <span>Payment date</span>
                    <input
                      type="date"
                      value={form.paymentDate}
                      onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))}
                    />
                  </label>
                  <label className="field-shell">
                    <span>Type</span>
                    <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                      {PAYMENT_TYPES.map((typeOption) => (
                        <option key={typeOption} value={typeOption}>
                          {typeOption}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-shell">
                    <span>Method</span>
                    <select value={form.method} onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}>
                      {PAYMENT_METHODS.map((methodOption) => (
                        <option key={methodOption} value={methodOption}>
                          {methodOption}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-shell md:col-span-2">
                    <span>{getPaymentEvidenceFieldLabel(activeMethod)}</span>
                    <input ref={receiptInputRef} type="file" accept="image/*" onChange={handleReceiptImageChange} />
                  </label>
                  {(receiptImagePreview || editingPayment?.receiptImageUrl) ? (
                    <div className="payment-receipt-preview md:col-span-2">
                      <div className="payment-receipt-preview__image-shell">
                        <img
                          src={receiptImagePreview || editingPayment?.receiptImageUrl}
                          alt={`${activeEvidenceLabel} preview`}
                          className="payment-receipt-preview__image"
                        />
                      </div>
                      <div className="payment-receipt-preview__copy">
                        <p className="text-sm font-semibold text-white">
                          {receiptImageFile
                            ? `Selected ${activeEvidenceLabel.toLowerCase()}: ${receiptImageFile.name}`
                            : getPaymentEvidenceCurrentLabel(activeMethod)}
                        </p>
                        <button
                          type="button"
                          className="table-action mt-3"
                          onClick={() =>
                            setReceiptPreviewModal({
                              title: editingPayment
                                ? `Saved ${activeEvidenceLabel.toLowerCase()}`
                                : getPaymentEvidencePreviewTitle(activeMethod),
                              imageUrl: receiptImagePreview || editingPayment?.receiptImageUrl,
                            })
                          }
                        >
                          {getPaymentEvidenceActionLabel(activeMethod)}
                        </button>
                      </div>
                    </div>
                  ) : null}
                  <label className="field-shell md:col-span-2">
                    <span>Notes</span>
                    <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
                  </label>
                </div>

                <div className="mt-4 flex justify-end">
                  <button type="submit" className="action-button action-button--primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : editingPayment ? 'Update payment' : 'Add payment'}
                  </button>
                </div>
              </form>
            </div>

            <div className="surface-card p-5">
              <div className="mb-4">
                <p className="eyebrow">Exact payment history</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Ledger entries for this lot</h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px] text-left text-sm">
                  <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                    <tr>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Method</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Evidence</th>
                      <th className="pb-3">Notes</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.paymentHistory.map((payment) => {
                      const { rowMethod, evidenceSource, evidenceImageUrl } = getPaymentRowState(payment);

                      return (
                        <tr key={payment.id} className="border-t border-white/8 text-slate-300">
                        <td className="py-4">{formatDateOnly(payment.paymentDate)}</td>
                        <td className="py-4">{payment.type}</td>
                        <td className="py-4">{rowMethod}</td>
                        <td className="py-4">{formatCurrency(payment.amount)}</td>
                        <td className="py-4">
                          {evidenceImageUrl ? (
                            <button
                              type="button"
                              className="table-action"
                              onClick={() =>
                                setReceiptPreviewModal({
                                  title: getPaymentEvidencePreviewTitle(evidenceSource, formatDateOnly(payment.paymentDate)),
                                  imageUrl: evidenceImageUrl,
                                })
                              }
                            >
                              {getPaymentEvidenceActionLabel(evidenceSource)}
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">{getPaymentEvidenceEmptyLabel(evidenceSource)}</span>
                          )}
                        </td>
                        <td className="py-4">{payment.notes || 'No notes'}</td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <button type="button" className="table-action" onClick={() => setEditingPayment(payment)}>
                              Edit
                            </button>
                            <button type="button" className="table-action table-action--danger" onClick={() => handleDelete(payment.id)}>
                              Remove
                            </button>
                          </div>
                        </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {!detail.paymentHistory.length ? (
                <p className="mt-4 text-sm text-slate-400">No payments recorded yet for this lot.</p>
              ) : null}
            </div>
          </div>
        )}
      </Modal>

      <ImagePreviewModal
        isOpen={Boolean(receiptPreviewModal)}
        title={receiptPreviewModal?.title || 'Payment evidence preview'}
        description="Review the uploaded proof of payment."
        imageUrl={receiptPreviewModal?.imageUrl}
        onClose={() => setReceiptPreviewModal(null)}
      />
    </>
  );
}

export default PaymentLotModal;
