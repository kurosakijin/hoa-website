import { useState } from 'react';
import { Link } from 'react-router-dom';
import ImagePreviewModal from '../components/ImagePreviewModal';
import Seo from '../components/Seo';
import TurnstileWidget, { isTurnstileConfigured } from '../components/TurnstileWidget';
import { useToast } from '../context/ToastContext';
import { searchResidentByDetails, searchResidentById } from '../services/api';
import { formatCurrency, formatDateOnly } from '../utils/format';
import { formatResidentFullName } from '../utils/middleInitial';
import {
  getPaymentEvidenceActionLabel,
  getPaymentEvidenceEmptyLabel,
  getPaymentEvidencePreviewTitle,
} from '../utils/paymentEvidence';

function getResidentInitials(resident) {
  return [resident.firstName?.[0], resident.lastName?.[0]].filter(Boolean).join('').toUpperCase() || 'SH';
}

function isValidResidentIdFormat(value) {
  return /^HOA-[A-F0-9]{6}$/.test(String(value || '').trim().toUpperCase());
}

function containsNonDigits(value) {
  return /[^0-9]/.test(String(value || ''));
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M14.5 5.5 8 12l6.5 6.5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function ResidentLookupPage() {
  const toast = useToast();
  const [detailForm, setDetailForm] = useState({
    lastName: '',
    firstName: '',
    block: '',
    lotNumber: '',
  });
  const [residentId, setResidentId] = useState('');
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [receiptPreviewModal, setReceiptPreviewModal] = useState(null);
  const [detailTurnstileToken, setDetailTurnstileToken] = useState('');
  const [detailTurnstileResetKey, setDetailTurnstileResetKey] = useState(0);
  const [idTurnstileToken, setIdTurnstileToken] = useState('');
  const [idTurnstileResetKey, setIdTurnstileResetKey] = useState(0);

  function updateNumericLookupField(fieldName, nextValue) {
    if (containsNonDigits(nextValue)) {
      toast.warning({
        title: `Invalid ${fieldName}`,
        message: `Please enter the ${fieldName}.`,
      });
      return;
    }

    setDetailForm((current) => ({
      ...current,
      [fieldName === 'block number' ? 'block' : 'lotNumber']: nextValue,
    }));
  }

  async function handleDetailSearch(event) {
    event.preventDefault();

    if (!detailForm.lastName.trim() || !detailForm.firstName.trim() || !detailForm.block.trim() || !detailForm.lotNumber.trim()) {
      toast.warning({
        title: 'Resident lookup is incomplete',
        message: 'Please enter the last name, first name, block, and lot number before searching.',
      });
      return;
    }

    if (isTurnstileConfigured() && !detailTurnstileToken) {
      toast.warning({
        title: 'Security check required',
        message: 'Please complete the Cloudflare security check before searching resident details.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await searchResidentByDetails({
        ...detailForm,
        turnstileToken: detailTurnstileToken,
      });
      setResult(data);
    } catch (searchError) {
      setResult(null);
      toast.warning({
        title: 'No resident match found',
        message: searchError.message,
      });
    } finally {
      setDetailTurnstileToken('');
      setDetailTurnstileResetKey((current) => current + 1);
      setIsLoading(false);
    }
  }

  async function handleIdSearch(event) {
    event.preventDefault();

    if (!residentId.trim()) {
      toast.warning({
        title: 'Resident ID is required',
        message: 'Enter the resident ID first so we can look up the matching record.',
      });
      return;
    }

    if (!isValidResidentIdFormat(residentId)) {
      toast.warning({
        title: 'Invalid resident ID format',
        message: 'Please enter the valid format ID.',
      });
      return;
    }

    if (isTurnstileConfigured() && !idTurnstileToken) {
      toast.warning({
        title: 'Security check required',
        message: 'Please complete the Cloudflare security check before searching by resident ID.',
      });
      return;
    }

    setIsLoading(true);

    try {
      const data = await searchResidentById(residentId, idTurnstileToken);
      setResult(data);
    } catch (searchError) {
      setResult(null);
      toast.warning({
        title: 'Resident ID not found',
        message: searchError.message,
      });
    } finally {
      setIdTurnstileToken('');
      setIdTurnstileResetKey((current) => current + 1);
      setIsLoading(false);
    }
  }

  return (
    <>
      <Seo
        title="Find My Resident Info"
        description="Search Sitio Hiyas resident records by resident ID, name, block, and lot number to view assigned properties, balances, and payment history."
        path="/find-my-resident-info"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Find My Resident Info',
          description:
            'Resident lookup page for Sitio Hiyas Homeowners Association where residents can search by resident ID, name, block, and lot number.',
          url: import.meta.env.VITE_SITE_URL
            ? `${import.meta.env.VITE_SITE_URL.replace(/\/+$/, '')}/find-my-resident-info`
            : undefined,
        }}
      />
      <main className="mx-auto max-w-7xl px-4 py-10 lg:px-6">
        <section className="surface-card p-8">
          <p className="eyebrow">Public resident lookup</p>
          <h1 className="mt-3 text-4xl font-semibold text-white">Find my resident info</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">
            Search your resident information by name, block, and lot number, or use the resident ID created by the admin team. Matching records show your contact details, profile photo, assigned properties, and exact payment history.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/resident-page" className="action-button action-button--primary gap-2">
              <BackIcon />
              Resident Page
            </Link>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <form className="surface-card p-5" onSubmit={handleDetailSearch} noValidate>
              <p className="eyebrow">Search by resident details</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="field-shell">
                  <span>Last name</span>
                  <input value={detailForm.lastName} onChange={(event) => setDetailForm((current) => ({ ...current, lastName: event.target.value }))} />
                </label>
                <label className="field-shell">
                  <span>First name</span>
                  <input value={detailForm.firstName} onChange={(event) => setDetailForm((current) => ({ ...current, firstName: event.target.value }))} />
                </label>
                <label className="field-shell">
                  <span>Block</span>
                  <input
                    value={detailForm.block}
                    inputMode="numeric"
                    onChange={(event) => updateNumericLookupField('block number', event.target.value)}
                  />
                </label>
                <label className="field-shell">
                  <span>Lot number</span>
                  <input
                    value={detailForm.lotNumber}
                    inputMode="numeric"
                    onChange={(event) => updateNumericLookupField('lot number', event.target.value)}
                  />
                </label>
              </div>
              <button type="submit" className="action-button action-button--primary mt-4" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Search resident details'}
              </button>

              <TurnstileWidget
                action="resident_lookup_details"
                resetKey={detailTurnstileResetKey}
                onVerify={setDetailTurnstileToken}
                onExpire={() => setDetailTurnstileToken('')}
                onError={() => {
                  setDetailTurnstileToken('');
                  toast.warning({
                    title: 'Security check unavailable',
                    message: 'Cloudflare verification could not be completed. Please try again.',
                  });
                }}
              />
            </form>

            <form className="surface-card p-5" onSubmit={handleIdSearch} noValidate>
              <p className="eyebrow">Search by resident ID</p>
              <div className="mt-4">
                <label className="field-shell">
                  <span>Resident ID</span>
                  <input value={residentId} onChange={(event) => setResidentId(event.target.value.toUpperCase())} placeholder="Example: HOA-A12F90" />
                </label>
              </div>
              <p className="mt-4 text-sm text-slate-400">
                Use this if your name and lot details do not match exactly, or if you manage multiple lots under one resident code.
              </p>
              <button type="submit" className="action-button action-button--secondary mt-4" disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Find by resident ID'}
              </button>

              <TurnstileWidget
                action="resident_lookup_id"
                resetKey={idTurnstileResetKey}
                onVerify={setIdTurnstileToken}
                onExpire={() => setIdTurnstileToken('')}
                onError={() => {
                  setIdTurnstileToken('');
                  toast.warning({
                    title: 'Security check unavailable',
                    message: 'Cloudflare verification could not be completed. Please try again.',
                  });
                }}
              />
            </form>
          </div>

        </section>

        {result ? (
          <section className="mt-8 space-y-6">
            <div className="surface-card p-6">
              <div className="resident-lookup-profile">
                <div className="resident-lookup-profile__photo">
                  {result.profileImageUrl ? (
                    <img src={result.profileImageUrl} alt={result.fullName} className="resident-lookup-profile__image" />
                  ) : (
                    <span>{getResidentInitials(result)}</span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="eyebrow">Resident record</p>
                  <h2 className="mt-3 resident-lookup-profile__name">{formatResidentFullName(result)}</h2>
                  <p className="mt-3 text-sm text-slate-300">Resident ID: {result.residentCode}</p>
                </div>
              </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="info-chip">
                  <strong>Contact number</strong>
                  <span>{result.contactNumber}</span>
                </div>
                <div className="info-chip">
                  <strong>Address</strong>
                  <span>{result.address}</span>
                </div>
                <div className="info-chip">
                  <strong>Assigned lots</strong>
                  <span>{result.lots.length}</span>
                </div>
            </div>

            {!result.lots.length ? (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-slate-950/40 px-5 py-5">
                <p className="text-sm font-semibold text-white">No property assignment yet</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  This resident record exists, but no block and lot have been assigned yet. Contact the admin team if you expected a property assignment here.
                </p>
              </div>
            ) : null}
          </div>

            {result.lots.length ? (
              <div className={`grid gap-6 ${result.lots.length > 1 ? 'lg:grid-cols-2' : ''}`}>
                {result.lots.map((lot) => (
                  <article key={lot.id} className="surface-card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">Property assignment</p>
                        <h3 className="mt-2 text-2xl font-semibold text-white">
                          Block {lot.block} / Lot {lot.lotNumber}
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
                        <table className="w-full min-w-170 text-left text-sm">
                          <thead className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            <tr>
                              <th className="pb-3">Date</th>
                              <th className="pb-3">Type</th>
                              <th className="pb-3">Method</th>
                              <th className="pb-3">Amount</th>
                              <th className="pb-3">Evidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lot.paymentHistory.map((payment) => (
                              <tr key={payment.id} className="border-t border-white/8 text-slate-300">
                                <td className="py-3">{formatDateOnly(payment.paymentDate)}</td>
                                <td className="py-3">{payment.type}</td>
                                <td className="py-3">{payment.method}</td>
                                <td className="py-3">{formatCurrency(payment.amount)}</td>
                                <td className="py-3">
                                  {payment.receiptImageUrl ? (
                                    <button
                                      type="button"
                                      className="table-action"
                                      onClick={() =>
                                        setReceiptPreviewModal({
                                          title: getPaymentEvidencePreviewTitle(payment, formatDateOnly(payment.paymentDate)),
                                          imageUrl: payment.receiptImageUrl,
                                        })
                                      }
                                    >
                                      {getPaymentEvidenceActionLabel(payment)}
                                    </button>
                                  ) : (
                                    <span className="text-xs text-slate-500">{getPaymentEvidenceEmptyLabel(payment)}</span>
                                  )}
                                </td>
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
            ) : null}
          </section>
        ) : null}
      </main>

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

export default ResidentLookupPage;
