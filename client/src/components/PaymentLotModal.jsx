import { useEffect, useState } from 'react';
import Modal from './Modal';
import { formatCurrency, formatDate, toDateInputValue } from '../utils/format';

function createPaymentForm(payment) {
  return {
    amount: payment?.amount || 0,
    method: payment?.method || 'Cash',
    type: payment?.type || 'Association Dues',
    paymentDate: toDateInputValue(payment?.paymentDate),
    notes: payment?.notes || '',
  };
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
  const [editingPayment, setEditingPayment] = useState(null);
  const [form, setForm] = useState(createPaymentForm());
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setEditingPayment(null);
    setForm(createPaymentForm());
    setError('');
  }, [detail, isOpen]);

  useEffect(() => {
    setForm(createPaymentForm(editingPayment));
  }, [editingPayment]);

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      if (editingPayment) {
        await onUpdatePayment(editingPayment.id, {
          ...form,
          amount: Number(form.amount),
        });
      } else {
        await onCreatePayment({
          residentId: detail.residentId,
          lotId: detail.lot.id,
          ...form,
          amount: Number(form.amount),
        });
      }

      setEditingPayment(null);
      setForm(createPaymentForm());
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(paymentId) {
    if (!window.confirm('Remove this payment history record?')) {
      return;
    }

    try {
      await onDeletePayment(paymentId);
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Lot payment details"
      description="Review the assigned lot, post payments, update entries, and inspect exact payment dates from the resident ledger."
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
              <h3 className="mt-2 text-xl font-semibold text-white">{detail.residentName}</h3>
              <p className="mt-2 text-sm text-slate-400">Resident ID: {detail.residentCode}</p>
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

            <form className="surface-card p-5" onSubmit={handleSubmit}>
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
                    min="0"
                    value={form.amount}
                    onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                    required
                  />
                </label>
                <label className="field-shell">
                  <span>Payment date</span>
                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(event) => setForm((current) => ({ ...current, paymentDate: event.target.value }))}
                    required
                  />
                </label>
                <label className="field-shell">
                  <span>Type</span>
                  <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
                    <option value="Association Dues">Association Dues</option>
                    <option value="Special Assessment">Special Assessment</option>
                    <option value="Penalty">Penalty</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label className="field-shell">
                  <span>Method</span>
                  <select value={form.method} onChange={(event) => setForm((current) => ({ ...current, method: event.target.value }))}>
                    <option value="Cash">Cash</option>
                    <option value="GCash">GCash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Check">Check</option>
                  </select>
                </label>
                <label className="field-shell md:col-span-2">
                  <span>Notes</span>
                  <input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} />
                </label>
              </div>

              {error ? <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

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
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  <tr>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Type</th>
                    <th className="pb-3">Method</th>
                    <th className="pb-3">Amount</th>
                    <th className="pb-3">Notes</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.paymentHistory.map((payment) => (
                    <tr key={payment.id} className="border-t border-white/8 text-slate-300">
                      <td className="py-4">{formatDate(payment.paymentDate)}</td>
                      <td className="py-4">{payment.type}</td>
                      <td className="py-4">{payment.method}</td>
                      <td className="py-4">{formatCurrency(payment.amount)}</td>
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
                  ))}
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
  );
}

export default PaymentLotModal;
