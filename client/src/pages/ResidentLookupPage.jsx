import { useState } from 'react';
import { searchResidentByDetails, searchResidentById } from '../services/api';
import { formatCurrency, formatDate } from '../utils/format';

function ResidentLookupPage() {
  const [detailForm, setDetailForm] = useState({
    lastName: '',
    firstName: '',
    block: '',
    lotNumber: '',
  });
  const [residentId, setResidentId] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function handleDetailSearch(event) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await searchResidentByDetails(detailForm);
      setResult(data);
    } catch (searchError) {
      setResult(null);
      setError(searchError.message);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleIdSearch(event) {
    event.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const data = await searchResidentById(residentId);
      setResult(data);
    } catch (searchError) {
      setResult(null);
      setError(searchError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
      <section className="surface-card p-8">
        <p className="eyebrow">Public resident lookup</p>
        <h1 className="mt-3 text-4xl font-semibold text-white">Find my resident info</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
          Search your homeowner information by name, block, and lot number, or use the resident ID created by the admin team. Matching records show your contact details, assigned properties, and exact payment history.
        </p>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form className="surface-card p-5" onSubmit={handleDetailSearch}>
            <p className="eyebrow">Search by resident details</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="field-shell">
                <span>Last name</span>
                <input value={detailForm.lastName} onChange={(event) => setDetailForm((current) => ({ ...current, lastName: event.target.value }))} required />
              </label>
              <label className="field-shell">
                <span>First name</span>
                <input value={detailForm.firstName} onChange={(event) => setDetailForm((current) => ({ ...current, firstName: event.target.value }))} required />
              </label>
              <label className="field-shell">
                <span>Block</span>
                <input value={detailForm.block} onChange={(event) => setDetailForm((current) => ({ ...current, block: event.target.value }))} required />
              </label>
              <label className="field-shell">
                <span>Lot number</span>
                <input value={detailForm.lotNumber} onChange={(event) => setDetailForm((current) => ({ ...current, lotNumber: event.target.value }))} required />
              </label>
            </div>
            <button type="submit" className="action-button action-button--primary mt-4" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Search resident details'}
            </button>
          </form>

          <form className="surface-card p-5" onSubmit={handleIdSearch}>
            <p className="eyebrow">Search by resident ID</p>
            <div className="mt-4">
              <label className="field-shell">
                <span>Resident ID</span>
                <input value={residentId} onChange={(event) => setResidentId(event.target.value.toUpperCase())} placeholder="Example: HOA-A12F90" required />
              </label>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Use this if your name and lot details do not match exactly, or if you manage multiple lots under one resident code.
            </p>
            <button type="submit" className="action-button action-button--secondary mt-4" disabled={isLoading}>
              {isLoading ? 'Searching...' : 'Find by resident ID'}
            </button>
          </form>
        </div>

        {error ? (
          <div className="mt-6 rounded-3xl border border-amber-500/30 bg-amber-500/10 px-5 py-4 text-sm text-amber-100">
            {error}
          </div>
        ) : null}
      </section>

      {result ? (
        <section className="mt-8 space-y-6">
          <div className="surface-card p-6">
            <p className="eyebrow">Resident record</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">{result.fullName}</h2>
            <p className="mt-3 text-sm text-slate-300">Resident ID: {result.residentCode}</p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="info-chip">
                <strong>Contact number</strong>
                <span>{result.contactNumber}</span>
              </div>
              <div className="info-chip">
                <strong>Address</strong>
                <span>{result.address}</span>
              </div>
              <div className="info-chip">
                <strong>Resident type</strong>
                <span>{result.status}</span>
              </div>
              <div className="info-chip">
                <strong>Assigned lots</strong>
                <span>{result.lots.length}</span>
              </div>
            </div>
          </div>

          <div className={`grid gap-6 ${result.lots.length > 1 ? 'lg:grid-cols-2' : ''}`}>
            {result.lots.map((lot) => (
              <article key={lot.id} className="surface-card p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="eyebrow">Property assignment</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">
                      Block {lot.block} · Lot {lot.lotNumber}
                    </h3>
                  </div>
                  <span className="status-tag">{lot.squareMeters} sqm</span>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="info-chip">
                    <strong>Total balance</strong>
                    <span>{formatCurrency(lot.totalBalance)}</span>
                  </div>
                  <div className="info-chip">
                    <strong>Remaining balance</strong>
                    <span>{formatCurrency(lot.remainingBalance)}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-sm font-semibold text-white">Payment history</p>
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        <tr>
                          <th className="pb-3">Exact date</th>
                          <th className="pb-3">Type</th>
                          <th className="pb-3">Method</th>
                          <th className="pb-3">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lot.paymentHistory.map((payment) => (
                          <tr key={payment.id} className="border-t border-white/8 text-slate-300">
                            <td className="py-3">{formatDate(payment.paymentDate)}</td>
                            <td className="py-3">{payment.type}</td>
                            <td className="py-3">{payment.method}</td>
                            <td className="py-3">{formatCurrency(payment.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {!lot.paymentHistory.length ? (
                    <p className="mt-3 text-sm text-slate-400">No payment history recorded for this lot yet.</p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

export default ResidentLookupPage;
