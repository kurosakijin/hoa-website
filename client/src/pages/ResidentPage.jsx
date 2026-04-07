import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Link, useOutletContext } from 'react-router-dom';
import Seo from '../components/Seo';
import { getPublicOccupancySummary } from '../services/api';

const featureCards = [
  {
    title: 'Resident records that stay organized',
    text: 'Track contact details, addresses, lot assignments, and resident IDs with a single searchable directory.',
  },
  {
    title: 'Payment visibility for every assigned lot',
    text: 'See total balance, remaining balance, and exact-date payment history for each homeowner property.',
  },
  {
    title: 'Resident-friendly information access',
    text: 'Residents can search their own records, confirm assigned lots, and review exact-date payment history from a dedicated lookup page.',
  },
];

const residentServices = [
  { label: 'Resident info search', value: 'Name, block, lot, or ID' },
  { label: 'Payment visibility', value: 'Exact-date lot history' },
  { label: 'Property support', value: 'Single or multi-lot records' },
];

const lookupPreparation = [
  'Prepare your resident ID if you already received one from the admin team.',
  'If you do not have your ID yet, use your last name, first name, block, and lot number.',
  'Uploaded payment receipts and posted payment dates will appear directly in your resident result.',
];

function ResidentPage() {
  const { openResidentChatWidget } = useOutletContext();
  const [occupancySummary, setOccupancySummary] = useState({
    occupiedResidents: 0,
    occupiedLots: 0,
    occupiedBlocksCount: 0,
    occupiedBlocks: [],
  });
  const [isLoadingSummary, setIsLoadingSummary] = useState(true);
  const [occupancyError, setOccupancyError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOccupancySummary() {
      try {
        const summary = await getPublicOccupancySummary();

        if (!isMounted) {
          return;
        }

        setOccupancySummary(summary);
        setOccupancyError('');
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setOccupancyError(error.message);
      } finally {
        if (isMounted) {
          setIsLoadingSummary(false);
        }
      }
    }

    loadOccupancySummary();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="pb-20">
      <Seo
        title="Resident Page"
        description="Resident-facing page for Sitio Hiyas homeowners with occupancy visibility, lot payment summaries, and access to resident record lookup."
        path="/resident-page"
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          name: 'Sitio Hiyas Resident Page',
          description:
            'Resident page for Sitio Hiyas Homeowners Association with occupancy updates, payment visibility, and resident lookup access.',
          url: import.meta.env.VITE_SITE_URL
            ? `${import.meta.env.VITE_SITE_URL.replace(/\/+$/, '')}/resident-page`
            : undefined,
        }}
      />
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-6 lg:pt-10">
        <div className="hero-copy surface-card p-8 lg:p-10">
          <p className="eyebrow">Resident page</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white lg:text-6xl">
            Resident records, lot balances, and payment visibility in one place.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
            This page keeps the resident-focused portal separate from the public homepage. Use it to review occupancy updates, understand the resident search process, and move into your own record lookup when you are ready.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/find-my-resident-info" className="action-button action-button--primary">
              Find My Resident Info
            </Link>
            <button type="button" className="action-button action-button--secondary" onClick={openResidentChatWidget}>
              Chat with Admin
            </button>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="info-chip">
              <strong>Resident lookup</strong>
              <span>Search by name, block, lot, or resident ID.</span>
            </div>
            <div className="info-chip">
              <strong>Lot-based payments</strong>
              <span>Track balances and exact-date histories per property.</span>
            </div>
            <div className="info-chip">
              <strong>Multi-lot resident view</strong>
              <span>Residents with two or more lots are shown with card-based property records.</span>
            </div>
          </div>
        </div>

        <div className="dashboard-preview">
          <div className="surface-card preview-card preview-card--hero p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow">Resident services</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Community and resident information at a glance</h2>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {residentServices.map((service) => (
                <div key={service.label} className="preview-stat preview-stat--compact-copy">
                  <span>{service.label}</span>
                  <strong>{service.value}</strong>
                </div>
              ))}
            </div>

            <div className="mt-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Current occupancy</p>
                  <h3 className="mt-2 text-xl font-semibold text-white">Occupied resident records by block</h3>
                </div>
                <span className="status-tag">
                  {isLoadingSummary ? 'Loading occupancy...' : `${occupancySummary.occupiedLots} occupied lots`}
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="preview-stat">
                  <span>Occupied residents</span>
                  <strong>{isLoadingSummary ? '...' : occupancySummary.occupiedResidents}</strong>
                </div>
                <div className="preview-stat">
                  <span>Occupied lots</span>
                  <strong>{isLoadingSummary ? '...' : occupancySummary.occupiedLots}</strong>
                </div>
              </div>

              {occupancyError ? (
                <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
                  {occupancyError}
                </p>
              ) : null}

              {!occupancyError && !isLoadingSummary && occupancySummary.occupiedBlocks.length ? (
                <div className="mt-5 h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancySummary.occupiedBlocks}>
                      <CartesianGrid stroke="rgba(44, 62, 80, 0.12)" vertical={false} />
                      <XAxis dataKey="block" stroke="#768694" tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke="#768694" tickLine={false} axisLine={false} />
                      <Tooltip
                        formatter={(value) => [`${value} occupied lots`, 'Occupied lots']}
                        labelFormatter={(value) => `Block ${value}`}
                        contentStyle={{
                          background: '#fbf6ef',
                          border: '1px solid rgba(44, 62, 80, 0.12)',
                          borderRadius: '18px',
                          color: '#2c3e50',
                        }}
                      />
                      <Bar dataKey="occupiedLots" fill="#88b04b" radius={[10, 10, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : null}

              {!occupancyError && !isLoadingSummary && !occupancySummary.occupiedBlocks.length ? (
                <div className="mt-5 rounded-3xl border border-white/10 bg-slate-950/40 p-5 text-sm text-slate-300">
                  No occupied resident records are available yet. Once residents and lot assignments are added by the admin team, this chart will reflect the current occupied blocks.
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-4 surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="eyebrow">Before you search</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Resident lookup preparation</h3>
              </div>
              <span className="status-tag status-tag--violet">Resident guide</span>
            </div>

            <div className="grid gap-3">
              {lookupPreparation.map((item) => (
                <div key={item} className="preview-stat">
                  <span>Resident support</span>
                  <strong>{item}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 lg:px-6">
        <div className="grid gap-4 lg:grid-cols-3">
          {featureCards.map((card) => (
            <article key={card.title} className="surface-card p-6">
              <p className="eyebrow">Platform feature</p>
              <h3 className="mt-3 text-2xl font-semibold text-white">{card.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-300">{card.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-5xl px-4 lg:px-6">
        <article className="surface-card resident-chat-entry p-6 lg:p-8">
          <div>
            <p className="eyebrow">Resident support</p>
            <h2 className="mt-3 text-3xl font-semibold text-white">Need to chat with the admin team?</h2>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              Open the Messenger-style chat popup to ask about your lot assignment, payment history, or resident record. The popup stays with you while you move around the public pages until you close it yourself.
            </p>
          </div>

          <div className="resident-chat-entry__actions">
            <button type="button" className="action-button action-button--primary" onClick={openResidentChatWidget}>
              Open Chat Popup
            </button>
            <Link to="/find-my-resident-info" className="action-button action-button--secondary">
              Find My Resident Info
            </Link>
          </div>
        </article>
      </section>
    </main>
  );
}

export default ResidentPage;
