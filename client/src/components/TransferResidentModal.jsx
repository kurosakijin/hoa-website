import { useEffect, useState } from 'react';
import Modal from './Modal';
import { sanitizeContactNumber } from '../utils/contactNumber';

function getTransferableLots(resident) {
  return resident?.lots?.filter((lot) => lot.isActive !== false) || [];
}

function createInitialState(resident) {
  const transferableLots = getTransferableLots(resident);

  return {
    lotId: transferableLots[0]?.id || '',
    firstName: '',
    lastName: '',
    contactNumber: '',
    address: '',
    status: 'Owner',
  };
}

function TransferResidentModal({ isOpen, resident, onClose, onSubmit }) {
  const [form, setForm] = useState(createInitialState(resident));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const transferableLots = getTransferableLots(resident);

  useEffect(() => {
    setForm(createInitialState(resident));
    setError('');
  }, [resident, isOpen]);

  async function handleSubmit(event) {
    event.preventDefault();
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
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="field-shell">
          <span>Assigned lot to transfer</span>
          <select
            value={form.lotId}
            onChange={(event) => setForm((current) => ({ ...current, lotId: event.target.value }))}
            disabled={!transferableLots.length}
          >
            {!transferableLots.length ? <option value="">No active lots available</option> : null}
            {transferableLots.map((lot) => (
              <option key={lot.id} value={lot.id}>
                Block {lot.block} / Lot {lot.lotNumber}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-slate-400">
          Transfer moves one of this resident&apos;s current assigned lots to a new resident profile. Vacant block and lot selection is handled in the add or edit resident form.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-shell">
            <span>New resident last name</span>
            <input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} required />
          </label>
          <label className="field-shell">
            <span>New resident first name</span>
            <input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} required />
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
              required
            />
          </label>
          <label className="field-shell">
            <span>Resident type</span>
            <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
              <option value="Owner">Owner</option>
              <option value="Tenant">Tenant</option>
            </select>
          </label>
        </div>

        <label className="field-shell">
          <span>Address</span>
          <input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} required />
        </label>

        {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <button type="button" className="action-button action-button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="action-button action-button--primary" disabled={isSaving}>
            {isSaving ? 'Transferring...' : 'Transfer lot'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default TransferResidentModal;
