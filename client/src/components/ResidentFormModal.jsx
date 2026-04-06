import { useEffect, useState } from 'react';
import Modal from './Modal';

function createEmptyLot() {
  return {
    block: '',
    lotNumber: '',
    squareMeters: 0,
    totalBalance: 0,
    remainingBalance: 0,
    isActive: true,
  };
}

function createInitialState(resident) {
  if (!resident) {
    return {
      firstName: '',
      lastName: '',
      contactNumber: '',
      address: '',
      status: 'Owner',
      lots: [createEmptyLot()],
    };
  }

  return {
    firstName: resident.firstName,
    lastName: resident.lastName,
    contactNumber: resident.contactNumber,
    address: resident.address,
    status: resident.status,
    lots: resident.lots.map((lot) => ({
      id: lot.id,
      block: lot.block,
      lotNumber: lot.lotNumber,
      squareMeters: lot.squareMeters,
      totalBalance: lot.totalBalance,
      remainingBalance: lot.remainingBalance,
      isActive: lot.isActive,
    })),
  };
}

function ResidentFormModal({ isOpen, resident, onClose, onSubmit }) {
  const [form, setForm] = useState(createInitialState(resident));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(createInitialState(resident));
    setError('');
  }, [resident, isOpen]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLot(index, field, value) {
    setForm((current) => ({
      ...current,
      lots: current.lots.map((lot, lotIndex) =>
        lotIndex === index
          ? {
              ...lot,
              [field]: value,
            }
          : lot
      ),
    }));
  }

  function addLot() {
    setForm((current) => ({
      ...current,
      lots: [...current.lots, createEmptyLot()],
    }));
  }

  function removeLot(index) {
    setForm((current) => ({
      ...current,
      lots: current.lots.filter((_, lotIndex) => lotIndex !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      await onSubmit({
        ...form,
        lots: form.lots.map((lot) => ({
          id: lot.id,
          block: lot.block,
          lotNumber: lot.lotNumber,
          squareMeters: Number(lot.squareMeters),
          totalBalance: Number(lot.totalBalance),
          remainingBalance: Number(lot.remainingBalance),
          isActive: lot.isActive,
        })),
      });
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
      title={resident ? 'Edit resident record' : 'Add resident record'}
      description="Capture the homeowner profile, contact information, and every assigned lot in one place."
      onClose={onClose}
      wide
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="field-shell">
            <span>Last name</span>
            <input value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} required />
          </label>
          <label className="field-shell">
            <span>First name</span>
            <input value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} required />
          </label>
          <label className="field-shell">
            <span>Contact number</span>
            <input value={form.contactNumber} onChange={(event) => updateField('contactNumber', event.target.value)} required />
          </label>
          <label className="field-shell">
            <span>Resident type</span>
            <select value={form.status} onChange={(event) => updateField('status', event.target.value)}>
              <option value="Owner">Owner</option>
              <option value="Tenant">Tenant</option>
            </select>
          </label>
          <label className="field-shell md:col-span-2">
            <span>Address</span>
            <input value={form.address} onChange={(event) => updateField('address', event.target.value)} required />
          </label>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Assigned lots</p>
              <p className="text-sm text-slate-400">Add one or more lots for residents with multiple properties.</p>
            </div>
            <button type="button" className="action-button action-button--ghost" onClick={addLot}>
              Add lot
            </button>
          </div>

          {form.lots.map((lot, index) => (
            <div key={lot.id || index} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Lot assignment {index + 1}</p>
                {form.lots.length > 1 ? (
                  <button type="button" className="action-button action-button--danger" onClick={() => removeLot(index)}>
                    Remove lot
                  </button>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="field-shell">
                  <span>Block</span>
                  <input value={lot.block} onChange={(event) => updateLot(index, 'block', event.target.value)} required />
                </label>
                <label className="field-shell">
                  <span>Lot number</span>
                  <input value={lot.lotNumber} onChange={(event) => updateLot(index, 'lotNumber', event.target.value)} required />
                </label>
                <label className="field-shell">
                  <span>Square meters</span>
                  <input type="number" min="0" value={lot.squareMeters} onChange={(event) => updateLot(index, 'squareMeters', event.target.value)} required />
                </label>
                <label className="field-shell">
                  <span>Total balance</span>
                  <input type="number" min="0" value={lot.totalBalance} onChange={(event) => updateLot(index, 'totalBalance', event.target.value)} required />
                </label>
                <label className="field-shell">
                  <span>Remaining balance</span>
                  <input type="number" min="0" value={lot.remainingBalance} onChange={(event) => updateLot(index, 'remainingBalance', event.target.value)} required />
                </label>
              </div>
            </div>
          ))}
        </div>

        {error ? <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

        <div className="flex justify-end gap-3">
          <button type="button" className="action-button action-button--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="action-button action-button--primary" disabled={isSaving}>
            {isSaving ? 'Saving...' : resident ? 'Save changes' : 'Create resident'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ResidentFormModal;
