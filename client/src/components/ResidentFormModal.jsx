import { useEffect, useMemo, useState } from 'react';
import Modal from './Modal';
import {
  BLOCK_OPTIONS,
  buildLotKey,
  getAvailableBlockOptions,
  getAvailableLotOptions,
} from '../data/lotCatalog';
import {
  calculateRemainingPreview,
  DEFAULT_SQUARE_METERS,
  derivePricePerSquareMeter,
} from '../utils/lotPricing';
import { sanitizeContactNumber } from '../utils/contactNumber';
import { sanitizeMiddleName } from '../utils/middleInitial';
import { formatCurrency } from '../utils/format';

function isLotLocked(lot) {
  return Number(lot?.totalBalance) > 0 && Number(lot?.remainingBalance) <= 0;
}

function withCalculatedBalances(lot) {
  const preview = calculateRemainingPreview({
    squareMeters: lot.squareMeters === '' ? DEFAULT_SQUARE_METERS : lot.squareMeters,
    pricePerSquareMeter: lot.pricePerSquareMeter,
    isSpotCash: lot.isSpotCash,
    paidAmount: lot.paidAmount,
  });

  return {
    ...lot,
    totalBalance: preview.totalBalance,
    remainingBalance: preview.remainingBalance,
  };
}

function createLotState(lot = {}) {
  const squareMeters = Number(lot.squareMeters) > 0 ? Number(lot.squareMeters) : DEFAULT_SQUARE_METERS;
  const totalBalance = Number(lot.totalBalance) || 0;
  const remainingBalance = Number(lot.remainingBalance) || 0;
  const paidAmount = Math.max(totalBalance - remainingBalance, 0);
  const isSpotCash = lot.isSpotCash === true;
  const pricePerSquareMeter =
    Number(lot.pricePerSquareMeter) > 0
      ? Number(lot.pricePerSquareMeter)
      : derivePricePerSquareMeter({
          totalBalance,
          squareMeters,
          isSpotCash,
        });

  return withCalculatedBalances({
    id: lot.id,
    block: lot.block || '',
    lotNumber: lot.lotNumber || '',
    squareMeters: String(squareMeters),
    pricePerSquareMeter: pricePerSquareMeter ? String(pricePerSquareMeter) : '',
    isSpotCash,
    totalBalance,
    remainingBalance,
    paidAmount,
    isActive: lot.isActive !== false,
  });
}

function createEmptyLot() {
  return createLotState({
    squareMeters: DEFAULT_SQUARE_METERS,
    pricePerSquareMeter: '',
    isSpotCash: false,
    totalBalance: 0,
    remainingBalance: 0,
    isActive: true,
  });
}

function createInitialState(resident) {
  if (!resident) {
    return {
      firstName: '',
      middleName: '',
      lastName: '',
      contactNumber: '',
      address: '',
      lots: [createEmptyLot()],
    };
  }

  return {
    firstName: resident.firstName,
    middleName: sanitizeMiddleName(resident.middleName || resident.middleInitial),
    lastName: resident.lastName,
    contactNumber: resident.contactNumber,
    address: resident.address,
    lots: resident.lots.map((lot) => createLotState(lot)),
  };
}

function buildSelectedLotKeys(lots, excludedIndex = -1) {
  return new Set(
    lots
      .filter((lot, lotIndex) => lotIndex !== excludedIndex && lot.block && lot.lotNumber)
      .map((lot) => buildLotKey(lot.block, lot.lotNumber))
  );
}

function getResidentInitials(source) {
  return [source.firstName?.[0], source.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'SH';
}

function validateResidentForm(form) {
  if (!String(form.lastName || '').trim()) {
    return 'Last name is required.';
  }

  if (!String(form.firstName || '').trim()) {
    return 'First name is required.';
  }

  if (!String(form.contactNumber || '').trim()) {
    return 'Contact number is required.';
  }

  if (!String(form.address || '').trim()) {
    return 'Address is required.';
  }

  if (!Array.isArray(form.lots) || !form.lots.length) {
    return 'At least one lot must be assigned to the resident.';
  }

  for (const [index, lot] of form.lots.entries()) {
    if (!String(lot.block || '').trim()) {
      return `Block is required for lot assignment ${index + 1}.`;
    }

    if (!String(lot.lotNumber || '').trim()) {
      return `Lot number is required for lot assignment ${index + 1}.`;
    }

    if (!(Number(lot.squareMeters) > 0)) {
      return `Square meters must be greater than zero for lot assignment ${index + 1}.`;
    }

    if (!(Number(lot.pricePerSquareMeter) > 0)) {
      return `Price per sqm must be greater than zero for lot assignment ${index + 1}.`;
    }
  }

  return '';
}

function ResidentFormModal({ isOpen, resident, residents = [], onClose, onSubmit }) {
  const [form, setForm] = useState(createInitialState(resident));
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImagePreview, setProfileImagePreview] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const occupiedLotKeys = useMemo(
    () =>
      new Set(
        residents.flatMap((residentItem) =>
          residentItem.id === resident?.id
            ? []
            : residentItem.lots
                .filter((lot) => lot.isActive !== false)
                .map((lot) => buildLotKey(lot.block, lot.lotNumber))
        )
      ),
    [residents, resident]
  );

  const hasAvailableLots = useMemo(() => {
    const selectedLotKeys = buildSelectedLotKeys(form.lots);

    return BLOCK_OPTIONS.some(
      (block) =>
        getAvailableLotOptions({
          block,
          occupiedLotKeys,
          selectedLotKeys,
        }).length > 0
    );
  }, [form.lots, occupiedLotKeys]);

  useEffect(() => {
    setForm(createInitialState(resident));
    setProfileImageFile(null);
    setProfileImagePreview(resident?.profileImageUrl || '');
    setError('');
  }, [resident, isOpen]);

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function updateLot(index, field, value) {
    setForm((current) => ({
      ...current,
      lots: current.lots.map((lot, lotIndex) => {
        if (lotIndex !== index) {
          return lot;
        }

        if (isLotLocked(lot)) {
          return lot;
        }

        if (field === 'block') {
          const selectedLotKeys = buildSelectedLotKeys(current.lots, index);
          const nextLotOptions = getAvailableLotOptions({
            block: value,
            currentLotNumber: lot.lotNumber,
            occupiedLotKeys,
            selectedLotKeys,
          });

          return withCalculatedBalances({
            ...lot,
            block: value,
            lotNumber: nextLotOptions.includes(String(lot.lotNumber || '')) ? lot.lotNumber : '',
          });
        }

        return withCalculatedBalances({
          ...lot,
          [field]: value,
        });
      }),
    }));
  }

  function addLot() {
    if (!hasAvailableLots) {
      return;
    }

    setForm((current) => ({
      ...current,
      lots: [...current.lots, createEmptyLot()],
    }));
  }

  function removeLot(index) {
    setForm((current) => ({
      ...current,
      lots: current.lots.filter((lot, lotIndex) => lotIndex !== index || isLotLocked(lot)),
    }));
  }

  function handleProfileImageChange(event) {
    const nextFile = event.target.files?.[0];

    if (!nextFile) {
      return;
    }

    setProfileImageFile(nextFile);
    setProfileImagePreview(URL.createObjectURL(nextFile));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateResidentForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await onSubmit({
        ...form,
        profileImageFile,
        lots: form.lots.map((lot) => ({
          id: lot.id,
          block: lot.block,
          lotNumber: lot.lotNumber,
          squareMeters: Number(lot.squareMeters || DEFAULT_SQUARE_METERS),
          pricePerSquareMeter: Number(lot.pricePerSquareMeter),
          isSpotCash: lot.isSpotCash,
          totalBalance: lot.totalBalance,
          remainingBalance: lot.remainingBalance,
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
      description="Capture the resident profile, profile picture, assigned lot, and pricing basis for automatic balance computation."
      onClose={onClose}
      wide
    >
      <form className="space-y-6" onSubmit={handleSubmit} noValidate>
        <div className="resident-form-shell">
          <section className="resident-media-card">
            <div className="resident-media-card__preview">
              {profileImagePreview ? (
                <img src={profileImagePreview} alt="Resident profile preview" className="resident-media-card__image" />
              ) : (
                <span className="resident-media-card__fallback">{getResidentInitials(form)}</span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Resident profile picture</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Upload a clear resident photo. This photo will also show on the resident lookup page.
              </p>
            </div>
            <label className="field-shell">
              <span>{resident?.profileImageUrl ? 'Replace photo' : 'Upload photo'}</span>
              <input type="file" accept="image/*" onChange={handleProfileImageChange} />
            </label>
            {profileImageFile ? (
              <p className="text-sm text-slate-400">Selected file: {profileImageFile.name}</p>
            ) : resident?.profileImageUrl ? (
              <p className="text-sm text-slate-400">Current photo is already attached to this resident record.</p>
            ) : null}
          </section>

          <section className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="field-shell">
                <span>Last name</span>
                <input value={form.lastName} onChange={(event) => updateField('lastName', event.target.value)} />
              </label>
              <label className="field-shell">
                <span>First name</span>
                <input value={form.firstName} onChange={(event) => updateField('firstName', event.target.value)} />
              </label>
              <label className="field-shell">
                <span>Middle name</span>
                <input
                  value={form.middleName}
                  onChange={(event) => updateField('middleName', sanitizeMiddleName(event.target.value))}
                  placeholder="Enter middle name"
                />
              </label>
              <label className="field-shell">
                <span>Contact number</span>
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.contactNumber}
                  onChange={(event) => updateField('contactNumber', sanitizeContactNumber(event.target.value))}
                />
              </label>
              <label className="field-shell md:col-span-2">
                <span>Address</span>
                <input value={form.address} onChange={(event) => updateField('address', event.target.value)} />
              </label>
            </div>
          </section>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Assigned lots</p>
              <p className="text-sm text-slate-400">
                Square meters start at 60. Total and remaining balances are calculated automatically from the pricing setup.
              </p>
            </div>
            <button
              type="button"
              className="action-button action-button--ghost"
              onClick={addLot}
              disabled={!hasAvailableLots}
            >
              Add lot
            </button>
          </div>

          {form.lots.map((lot, index) => {
            const lotLocked = isLotLocked(lot);
            const pricing = calculateRemainingPreview({
              squareMeters: lot.squareMeters === '' ? DEFAULT_SQUARE_METERS : lot.squareMeters,
              pricePerSquareMeter: lot.pricePerSquareMeter,
              isSpotCash: lot.isSpotCash,
              paidAmount: lot.paidAmount,
            });
            const selectedLotKeys = buildSelectedLotKeys(form.lots, index);
            const blockOptions = getAvailableBlockOptions({
              occupiedLotKeys,
              selectedLotKeys,
              currentBlock: lot.block,
              currentLotNumber: lot.lotNumber,
            });
            const lotOptions = getAvailableLotOptions({
              block: lot.block,
              currentLotNumber: lot.lotNumber,
              occupiedLotKeys,
              selectedLotKeys,
            });

            return (
              <div key={lot.id || index} className="rounded-3xl border border-white/10 bg-slate-950/40 p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-white">Lot assignment {index + 1}</p>
                    {lotLocked ? <span className="status-tag">Fully paid and locked</span> : null}
                  </div>
                  {form.lots.length > 1 && !lotLocked ? (
                    <button type="button" className="action-button action-button--danger" onClick={() => removeLot(index)}>
                      Forfeit lot
                    </button>
                  ) : null}
                </div>

                {lotLocked ? (
                  <p className="lot-lock-notice">
                    This lot is already fully paid. Its block, lot number, pricing, and forfeiture are locked, but you can still edit the resident details and add another lot.
                  </p>
                ) : null}

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <label className="field-shell">
                    <span>Block</span>
                    <select value={lot.block} onChange={(event) => updateLot(index, 'block', event.target.value)} disabled={lotLocked}>
                      <option value="">Select block</option>
                      {blockOptions.map((blockOption) => (
                        <option key={blockOption} value={blockOption}>
                          Block {blockOption}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-shell">
                    <span>Lot number</span>
                    <select
                      value={lot.lotNumber}
                      onChange={(event) => updateLot(index, 'lotNumber', event.target.value)}
                      disabled={lotLocked || !lot.block || !lotOptions.length}
                    >
                      <option value="">
                        {!lot.block ? 'Select block first' : lotOptions.length ? 'Select lot' : 'No available lots in this block'}
                      </option>
                      {lotOptions.map((lotOption) => (
                        <option key={`${lot.block}-${lotOption}`} value={lotOption}>
                          Lot {lotOption}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-shell">
                    <span>Square meters</span>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={lot.squareMeters}
                      onChange={(event) => updateLot(index, 'squareMeters', event.target.value)}
                      disabled={lotLocked}
                    />
                  </label>
                  <label className="field-shell">
                    <span>Price per sqm</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={lot.pricePerSquareMeter}
                      onChange={(event) => updateLot(index, 'pricePerSquareMeter', event.target.value)}
                      disabled={lotLocked}
                    />
                  </label>
                </div>

                <label className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 accent-cyan-400"
                    checked={lot.isSpotCash}
                    onChange={(event) => updateLot(index, 'isSpotCash', event.target.checked)}
                    disabled={lotLocked}
                  />
                  <span>
                    <strong className="text-white">Cash</strong>
                    <span className="block text-slate-400">
                      Checked means the resident pays the lot directly in full. Unchecked applies 6% yearly interest across 5 years.
                    </span>
                  </span>
                </label>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Cash</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(pricing.cashAmount)}</p>
                    <p className="mt-1 text-xs text-slate-400">Cash basis from price per sqm x square meters.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Interest</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(pricing.annualInterest)}</p>
                    <p className="mt-1 text-xs text-slate-400">{lot.isSpotCash ? 'No interest applied on cash.' : 'Yearly interest amount.'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">5 Year Interest</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(pricing.fiveYearInterest)}</p>
                    <p className="mt-1 text-xs text-slate-400">Total interest for the 5-year term.</p>
                  </div>
                  <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Total Payment</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(pricing.totalBalance)}</p>
                    <p className="mt-1 text-xs text-cyan-100/80">Total balance that will be saved for this lot.</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">Remaining</p>
                    <p className="mt-2 text-lg font-semibold text-white">{formatCurrency(pricing.remainingBalance)}</p>
                    <p className="mt-1 text-xs text-emerald-100/80">
                      {lot.paidAmount > 0
                        ? `Keeps ${formatCurrency(lot.paidAmount)} already posted in payment history.`
                        : 'Matches the total balance until payments are posted.'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!hasAvailableLots ? (
          <p className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            No additional vacant lots are available right now. Existing assigned lots can still be reviewed without duplicating another resident&apos;s block and lot.
          </p>
        ) : null}

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
