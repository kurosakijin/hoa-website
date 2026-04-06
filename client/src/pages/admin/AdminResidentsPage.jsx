import { useEffect, useMemo, useState } from 'react';
import ResidentFormModal from '../../components/ResidentFormModal';
import TransferResidentModal from '../../components/TransferResidentModal';
import { useAuth } from '../../context/AuthContext';
import {
  createResident,
  deleteResident,
  getResidents,
  transferResident,
  updateResident,
} from '../../services/api';
import { formatCurrency } from '../../utils/format';

function AdminResidentsPage() {
  const { token } = useAuth();
  const [residents, setResidents] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [editingResident, setEditingResident] = useState(null);
  const [transferResidentTarget, setTransferResidentTarget] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  async function loadResidents() {
    try {
      setResidents(await getResidents(token));
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadResidents();
  }, [token]);

  const filteredResidents = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return residents;
    }

    return residents.filter((resident) =>
      [resident.lastName, resident.firstName, resident.contactNumber, resident.address, resident.residentCode]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [residents, search]);

  async function handleCreate(payload) {
    await createResident(token, payload);
    await loadResidents();
  }

  async function handleUpdate(payload) {
    await updateResident(token, editingResident.id, payload);
    await loadResidents();
  }

  async function handleTransfer(payload) {
    await transferResident(token, transferResidentTarget.id, payload);
    await loadResidents();
  }

  async function handleDelete(residentId) {
    if (!window.confirm('Remove this resident and all related payment history?')) {
      return;
    }

    try {
      await deleteResident(token, residentId);
      await loadResidents();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Resident management</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Admin resident directory</h2>
            <p className="mt-2 text-sm text-slate-400">
              Residents are listed from last name to first name, with balances and modal actions for edit, transfer, and removal.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              className="admin-search min-w-[260px]"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search resident, contact, address, or ID..."
            />
            <button type="button" className="action-button action-button--primary" onClick={() => setIsCreateOpen(true)}>
              Add resident
            </button>
          </div>
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.24em] text-slate-500">
              <tr>
                <th className="pb-3">Last name</th>
                <th className="pb-3">First name</th>
                <th className="pb-3">Contact number</th>
                <th className="pb-3">Address</th>
                <th className="pb-3">Remaining balance</th>
                <th className="pb-3">Total balance</th>
                <th className="pb-3">Resident ID</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResidents.map((resident) => (
                <tr key={resident.id} className="border-t border-white/8 text-slate-300">
                  <td className="py-4 font-medium text-white">{resident.lastName}</td>
                  <td className="py-4">{resident.firstName}</td>
                  <td className="py-4">{resident.contactNumber}</td>
                  <td className="py-4">{resident.address}</td>
                  <td className="py-4">{formatCurrency(resident.remainingBalance)}</td>
                  <td className="py-4">{formatCurrency(resident.totalBalance)}</td>
                  <td className="py-4">{resident.residentCode}</td>
                  <td className="py-4">
                    <div className="flex justify-end gap-2">
                      <button type="button" className="table-action" onClick={() => setEditingResident(resident)}>
                        Edit
                      </button>
                      <button type="button" className="table-action" onClick={() => setTransferResidentTarget(resident)}>
                        Transfer
                      </button>
                      <button type="button" className="table-action table-action--danger" onClick={() => handleDelete(resident.id)}>
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <ResidentFormModal
        isOpen={isCreateOpen}
        resident={null}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <ResidentFormModal
        isOpen={Boolean(editingResident)}
        resident={editingResident}
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
