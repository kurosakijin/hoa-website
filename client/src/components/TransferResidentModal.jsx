import { useEffect, useState } from 'react';
import Modal from './Modal';
import { sanitizeContactNumber } from '../utils/contactNumber';
import { sanitizeMiddleName } from '../utils/middleInitial';

function isLotLocked(lot) {
  return Number(lot?.totalBalance) > 0 && Number(lot?.remainingBalance) <= 0;
}

function getTransferableLots(resident) {
  return resident?.lots?.filter((lot) => lot.isActive !== false && !isLotLocked(lot)) || [];
}

function createInitialState(resident) {
  const transferableLots = getTransferableLots(resident);

  return {
    lotId: transferableLots[0]?.id || '',
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    address: '',
  };
}

function validateTransferForm(form) {
  if (!String(form.lotId || '').trim()) {
    return 'Please select an assigned lot to transfer.';
  }

  if (!String(form.lastName || '').trim()) {
    return 'New resident last name is required.';
  }

  if (!String(form.firstName || '').trim()) {
    return 'New resident first name is required.';
  }

  if (!String(form.contactNumber || '').trim()) {
    return 'Contact number is required.';
  }

  if (!String(form.address || '').trim()) {
    return 'Address is required.';
  }

  return '';
}

function TransferResidentModal({ isOpen, resident, onClose, onSubmit }) {
  const [form, setForm] = useState(createInitialState(resident));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const transferableLots = getTransferableLots(resident);
  const hasLockedLots = resident?.lots?.some((lot) => isLotLocked(lot)) || false;

  useEffect(() => {
    setForm(createInitialState(resident));
    setError('');
  }, [resident, isOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateTransferForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSubmit(form);
      onClose();
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Transfer resident lot"
      description="Move one selected property to a new resident profile while keeping the lot assignment and payment records attached."
      onClose={onClose}
    >
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="field-shell">
          <span>Assigned lot to transfer</span>
          <select
            value={form.lotId}
            onChange={(event) => setForm((current) => ({ ...current, lotId: event.target.value }))}
            disabled={!transferableLots.length}
          >
            {!transferableLots.length ? <option value="">No transferable lots available</option> : null}
            {transferableLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                Block {lot.block} / Lot {lot.lotNumber}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-slate-400">
          Transfer moves one unpaid assigned lot to a new resident profile. Fully paid lots stay locked to the resident record and cannot be transferred.
        </p>

        {!transferableLots.length && hasLockedLots ? (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            This resident only has fully paid lots right now, so transfer is locked for those property assignments.
          </p>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-shell">
            <span>New resident last name</span>
            <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} />
          </label>
          <label className="field-shell">
            <span>New resident first name</span>
            <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} />
          </label>
          <label className="field-shell">
            <span>Middle name</span>
            <input
              value={form.middleName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  middleName: sanitizeMiddleName(event.target.value),
                }))
              }
              placeholder="Enter middle name"
            />
          </label>
          <label className="field-shell">
            <span>Contact number</span>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={form.contactNumber}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  contactNumber: sanitizeContactNumber(event.target.value),
                }))
              }
            />
          </label>
        </div>

        <label className="field-shell">
          <span>Address</span>
          <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
        </label>

        {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <button type="button" className="action-button action-button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="action-button action-button--primary" disabled={isSaving || !transferableLots.length}>
            {isSaving ? 'Transferring...' : 'Transfer lot'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default TransferResidentModal;
