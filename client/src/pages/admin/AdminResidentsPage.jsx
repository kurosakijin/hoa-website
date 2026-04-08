import { useEffect, useMemo, useState } from 'react';
import ResidentFormModal from '../../components/ResidentFormModal';
import TransferResidentModal from '../../components/TransferResidentModal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  createResident,
  deleteResident,
  getResidents,
  transferResident,
  updateResident,
} from '../../services/api';
import { formatCurrency } from '../../utils/format';
import { formatResidentSortableName } from '../../utils/middleInitial';

function getResidentInitials(resident) {
  return [resident.firstName?.[0], resident.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'SH';
}

function isLotLocked(lot) {
  return Number(lot?.totalBalance) > 0 && Number(lot?.remainingBalance) <= 0;
}

function getLockedLotCount(resident) {
  return resident.lots.filter((lot) => lot.isActive !== false && isLotLocked(lot)).length;
}

function hasTransferableLots(resident) {
  return resident.lots.some((lot) => lot.isActive !== false && !isLotLocked(lot));
}

function getResidentStatus(resident) {
  const lockedLotCount = getLockedLotCount(resident);
  const activeLotCount = resident.lots.filter((lot) => lot.isActive !== false).length;

  if (activeLotCount === 0) {
    return {
      className: 'status-tag status-tag--violet',
      label: 'No lot assigned',
    };
  }

  if (resident.totalBalance > 0 && resident.remainingBalance <= 0) {
    return {
      className: 'status-tag',
      label: 'Fully paid and locked',
    };
  }

  if (lockedLotCount > 0) {
    return {
      className: 'status-tag status-tag--violet',
      label: `${lockedLotCount} locked lot${lockedLotCount > 1 ? 's' : ''}`,
    };
  }

  return {
    className: 'status-tag status-tag--danger',
    label: 'With balance',
  };
}

function AdminResidentsPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState('');
  const [editingResident, setEditingResident] = useState(null);
  const [transferResidentTarget, setTransferResidentTarget] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function loadResidents({ notifyOnError = true } = {}) {
    try {
      setResidents(await getResidents(token));
    } catch (loadError) {
      if (notifyOnError) {
        toast.error({
          title: 'Resident directory unavailable',
          message: loadError.message,
        });
      }

      throw loadError;
    }
  }

  useEffect(() => {
    loadResidents().catch(() => {});
  }, [token]);

  const filteredResidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return residents;
    }

    return residents.filter((resident) =>
      [
        resident.lastName,
        resident.firstName,
        resident.middleName,
        resident.contactNumber,
        resident.address,
        resident.residentCode,
        resident.fullName,
        ...resident.lots.map((lot) => `${lot.block} ${lot.lotNumber}`),
      ]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [residents, search]);

  const residentStats = useMemo(() => {
    const totalLots = residents.reduce((sum, resident) => sum + resident.lots.length, 0);
    const outstandingResidents = residents.filter((resident) => resident.remainingBalance > 0).length;
    const totalOutstanding = residents.reduce((sum, resident) => sum + resident.remainingBalance, 0);

    return {
      totalResidents: residents.length,
      totalLots,
      outstandingResidents,
      totalOutstanding,
    };
  }, [residents]);

  async function handleCreate(payload) {
    await createResident(token, payload);
    await loadResidents({ notifyOnError: false });
  }

  async function handleUpdate(payload) {
    await updateResident(token, editingResident.id, payload);
    await loadResidents({ notifyOnError: false });
  }

  async function handleTransfer(payload) {
    await transferResident(token, transferResidentTarget.id, payload);
    await loadResidents({ notifyOnError: false });
  }

  async function handleDelete(residentId) {
    const confirmed = await toast.confirm({
      title: 'Forfeit this resident record?',
      message: 'This will also delete the payment history tied to the resident and the assigned block and lot records.',
      type: 'error',
      confirmLabel: 'Forfeit resident',
      cancelLabel: 'Keep record',
    });

    if (!confirmed) {
      return;
    }

    try {
      await deleteResident(token, residentId);
      await loadResidents({ notifyOnError: false });
      toast.success({
        title: 'Resident forfeited',
        message: 'The resident record and linked payment history were removed.',
      });
    } catch (deleteError) {
      toast.error({
        title: 'Forfeiture failed',
        message: deleteError.message,
      });
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface-card resident-directory-shell p-6">
        <div className="resident-directory-hero">
          <div>
            <p className="eyebrow">Resident management</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Admin resident directory</h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Review residents by name, contact number, address, assigned lots, balances, and profile photo. The directory now uses a list layout so long names stay readable.
            </p>
          </div>

          <div className="resident-directory-toolbar">
            <input
              className="admin-search w-full lg:min-w-[280px]"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search resident, address, block, lot, or ID..."
            />
            <button type="button" className="action-button action-button--primary" onClick={() => setIsCreateOpen(true)}>
              Add resident
            </button>
          </div>
        </div>

        <div className="resident-directory-summary">
          <div className="resident-directory-summary__item">
            <span>Total residents</span>
            <strong>{residentStats.totalResidents}</strong>
          </div>
          <div className="resident-directory-summary__item">
            <span>Assigned lots</span>
            <strong>{residentStats.totalLots}</strong>
          </div>
          <div className="resident-directory-summary__item">
            <span>Residents with balance</span>
            <strong>{residentStats.outstandingResidents}</strong>
          </div>
          <div className="resident-directory-summary__item">
            <span>Total outstanding</span>
            <strong>{formatCurrency(residentStats.totalOutstanding)}</strong>
          </div>
        </div>

        {filteredResidents.length ? (
          <div className="resident-directory-grid">
            {filteredResidents.map((resident) => {
              const residentStatus = getResidentStatus(resident);
              const residentHasLockedLots = getLockedLotCount(resident) > 0;
              const residentHasTransferableLots = hasTransferableLots(resident);
              const activeLots = resident.lots.filter((lot) => lot.isActive !== false);
              const transferTitle = residentHasTransferableLots
                ? 'Transfer an unpaid assigned lot to a new resident.'
                : residentHasLockedLots
                  ? 'Fully paid lots are locked and cannot be transferred.'
                  : 'No assigned lot is available to transfer.';

              return (
                <article key={resident.id} className="resident-directory-card resident-directory-card--list">
                  <div className="resident-directory-card__header">
                    <div className="resident-directory-card__identity">
                      <div className="resident-directory-card__avatar resident-directory-card__avatar--image">
                        {resident.profileImageUrl ? (
                          <img src={resident.profileImageUrl} alt={resident.fullName} className="resident-directory-card__avatar-image" />
                        ) : (
                          <span>{getResidentInitials(resident)}</span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="resident-directory-card__eyebrow">Resident record</p>
                        <h3 className="resident-directory-card__name">{formatResidentSortableName(resident)}</h3>
                        <p className="resident-directory-card__sub">{resident.residentCode}</p>
                      </div>
                    </div>

                    <div className="resident-directory-card__header-side">
                      <span className={residentStatus.className}>{residentStatus.label}</span>
                      <p className="resident-directory-card__header-note">
                        {activeLots.length ? `${activeLots.length} assigned lot${activeLots.length > 1 ? 's' : ''}` : 'No property assigned yet'}
                      </p>
                    </div>
                  </div>

                  <ul className="resident-directory-card__detail-list">
                    <li className="resident-directory-card__detail-item">
                      <span className="resident-directory-card__detail-label">Contact number</span>
                      <strong className="resident-directory-card__detail-value">{resident.contactNumber}</strong>
                    </li>
                    <li className="resident-directory-card__detail-item resident-directory-card__detail-item--wide">
                      <span className="resident-directory-card__detail-label">Address</span>
                      <strong className="resident-directory-card__detail-value resident-directory-card__address">{resident.address}</strong>
                    </li>
                    <li className="resident-directory-card__detail-item">
                      <span className="resident-directory-card__detail-label">Assigned lots</span>
                      <div className="resident-directory-card__lot-list resident-directory-card__lot-list--stacked">
                        {activeLots.length ? (
                          activeLots.map((lot) => (
                            <span key={lot.id} className="resident-directory-card__lot-chip resident-directory-card__lot-chip--block">
                              Block {lot.block} / Lot {lot.lotNumber}
                            </span>
                          ))
                        ) : (
                          <span className="resident-directory-card__detail-value text-slate-400">No lot assigned yet</span>
                        )}
                      </div>
                    </li>
                    <li className="resident-directory-card__detail-item">
                      <span className="resident-directory-card__detail-label">Remaining balance</span>
                      <strong className="resident-directory-card__detail-value">{formatCurrency(resident.remainingBalance)}</strong>
                    </li>
                    <li className="resident-directory-card__detail-item">
                      <span className="resident-directory-card__detail-label">Total balance</span>
                      <strong className="resident-directory-card__detail-value">{formatCurrency(resident.totalBalance)}</strong>
                    </li>
                  </ul>

                  <div className="resident-directory-card__footer">
                    <p className="resident-directory-card__footer-note">
                      Review the resident record, update profile details, add a lot later, transfer an unpaid lot, or forfeit an unpaid assignment.
                    </p>

                    <div className="resident-directory-card__actions resident-directory-card__actions--list">
                      <button type="button" className="table-action" onClick={() => setEditingResident(resident)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="table-action"
                        onClick={() => setTransferResidentTarget(resident)}
                        disabled={!residentHasTransferableLots}
                        title={transferTitle}
                      >
                        Transfer
                      </button>
                      <button
                        type="button"
                        className="table-action table-action--danger"
                        onClick={() => handleDelete(resident.id)}
                        disabled={residentHasLockedLots}
                        title={
                          residentHasLockedLots
                            ? 'Residents with fully paid lots are locked and cannot be forfeited.'
                            : 'Forfeit this resident record and delete the linked payment history.'
                        }
                      >
                        Forfeit
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="resident-directory-empty">
            <p className="text-base font-semibold text-white">No residents matched your search.</p>
            <p className="mt-2 text-sm text-slate-400">Try another resident name, address, resident ID, block, or lot number.</p>
          </div>
        )}
      </section>

      <ResidentFormModal
        isOpen={isCreateOpen}
        resident={null}
        residents={residents}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ResidentFormModal
        isOpen={Boolean(editingResident)}
        resident={editingResident}
        residents={residents}
        onClose={() => setEditingResident(null)}
        onSubmit={handleUpdate}
      />

      <TransferResidentModal
        isOpen={Boolean(transferResidentTarget)}
        resident={transferResidentTarget}
        onClose={() => setTransferResidentTarget(null)}
        onSubmit={handleTransfer}
      />
    </div>
  );
}

export default AdminResidentsPage;
