import { useEffect, useMemo, useState } from 'react';
import PaymentLotModal from '../../components/PaymentLotModal';
import { useAuth } from '../../context/AuthContext';
import {
  createPayment,
  deletePayment,
  getPaymentLotDetails,
  getPaymentLots,
  updatePayment,
} from '../../services/api';
import { formatCurrency } from '../../utils/format';

function AdminPaymentsPage() {
  const { token } = useAuth();
  const [lots, setLots] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);
  const [selectedLotDetail, setSelectedLotDetail] = useState(null);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadLots() {
    try {
      setLots(await getPaymentLots(token));
      setError('');
    } catch (loadError) {
      setError(loadError.message);
    }
  }

  useEffect(() => {
    loadLots();
  }, [token]);

  const filteredLots = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return lots;
    }

    return lots.filter((lot) =>
      [lot.residentName, lot.block, lot.lotNumber, lot.residentCode]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
  }, [lots, search]);

  async function openLotModal(lot) {
    setSelectedLot(lot);
    setIsModalLoading(true);

    try {
      const detail = await getPaymentLotDetails(token, lot.residentId, lot.lotId);
      setSelectedLotDetail(detail);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsModalLoading(false);
    }
  }

  async function refreshLotDetail() {
    if (!selectedLot) {
      return;
    }

    const detail = await getPaymentLotDetails(token, selectedLot.residentId, selectedLot.lotId);
    setSelectedLotDetail(detail);
    await loadLots();
  }

  async function handleCreatePayment(payload) {
    await createPayment(token, payload);
    await refreshLotDetail();
  }

  async function handleUpdatePayment(paymentId, payload) {
    await updatePayment(token, paymentId, payload);
    await refreshLotDetail();
  }

  async function handleDeletePayment(paymentId) {
    await deletePayment(token, paymentId);
    await refreshLotDetail();
  }

  function closeModal() {
    setSelectedLot(null);
    setSelectedLotDetail(null);
    setIsModalLoading(false);
  }

  return (
    <div className="space-y-6">
      <section className="surface-card p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Payment management</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Active resident lot balances</h2>
            <p className="mt-2 text-sm text-slate-400">
              View active resident lots with block, lot, square meter assignment, remaining balance, total balance, and full modal payment history controls.
            </p>
          </div>

          <input
            className="admin-search min-w-[280px]"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search resident, block, lot, or resident ID..."
          />
        </div>

        {error ? <p className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</p> : null}

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.24em] text-slate-500">
              <tr>
                <th className="pb-3">Name</th>
                <th className="pb-3">Block</th>
                <th className="pb-3">Lot</th>
                <th className="pb-3">Square meter assigned</th>
                <th className="pb-3">Remaining balance</th>
                <th className="pb-3">Total balance</th>
                <th className="pb-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.map((lot) => (
                <tr key={`${lot.residentId}-${lot.lotId}`} className="border-t border-white/8 text-slate-300">
                  <td className="py-4 font-medium text-white">
                    <div>{lot.residentName}</div>
                    <div className="text-xs text-slate-500">{lot.residentCode}</div>
                  </td>
                  <td className="py-4">{lot.block}</td>
                  <td className="py-4">{lot.lotNumber}</td>
                  <td className="py-4">{lot.squareMeters} sqm</td>
                  <td className="py-4">{formatCurrency(lot.remainingBalance)}</td>
                  <td className="py-4">{formatCurrency(lot.totalBalance)}</td>
                  <td className="py-4">
                    <div className="flex justify-end">
                      <button type="button" className="action-button action-button--secondary" onClick={() => openLotModal(lot)}>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <PaymentLotModal
        isOpen={Boolean(selectedLot)}
        detail={selectedLotDetail}
        loading={isModalLoading}
        onClose={closeModal}
        onCreatePayment={handleCreatePayment}
        onUpdatePayment={handleUpdatePayment}
        onDeletePayment={handleDeletePayment}
      />
    </div>
  );
}

export default AdminPaymentsPage;
