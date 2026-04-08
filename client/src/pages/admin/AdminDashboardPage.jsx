import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import MetricCard from '../../components/MetricCard';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getDashboardSummary } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/format';

function AdminDashboardPage() {
  const { token } = useAuth();
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [hasLoadError, setHasLoadError] = useState(false);

  useEffect(() => {
    getDashboardSummary(token)
      .then((data) => {
        setSummary(data);
        setHasLoadError(false);
      })
      .catch((dashboardError) => {
        setHasLoadError(true);
        toast.error({
          title: 'Dashboard summary unavailable',
          message: dashboardError.message,
        });
      });
  }, [token]);

  if (hasLoadError) {
    return (
      <div className="surface-card p-6 text-sm text-slate-300">
        Dashboard data could not be loaded right now. Try refreshing the admin workspace again.
      </div>
    );
  }

  if (!summary) {
    return <div className="surface-card p-6 text-sm text-slate-300">Loading dashboard summary...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="surface-card preview-card preview-card--hero p-6">
        <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="eyebrow">Admin preview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Sitio Hiyas command dashboard</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              This protected dashboard is where administrators monitor collections, track outstanding balances, and manage resident records.
            </p>
          </div>
          <span className="status-tag status-tag--violet">Protected admin workspace</span>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="preview-stat">
            <span>Total billed</span>
            <strong>{formatCurrency(summary.stats.totalBalance)}</strong>
          </div>
          <div className="preview-stat">
            <span>Total collected</span>
            <strong>{formatCurrency(summary.stats.totalCollected)}</strong>
          </div>
          <div className="preview-stat">
            <span>Remaining outstanding</span>
            <strong>{formatCurrency(summary.stats.totalOutstanding)}</strong>
          </div>
        </div>

        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <AreaChart data={summary.monthlyCollections}>
              <defs>
                <linearGradient id="adminHeroArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.65} />
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value) => formatCurrency(value)}
                contentStyle={{
                  background: '#0f172a',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '18px',
                }}
              />
              <Area type="monotone" dataKey="amount" stroke="#818cf8" strokeWidth={3} fill="url(#adminHeroArea)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total residents" value={summary.stats.totalResidents} hint="Profiles registered in the HOA directory" />
        <MetricCard label="Active lots" value={summary.stats.activeLots} hint="Properties currently assigned to residents" />
        <MetricCard label="Total collected" value={formatCurrency(summary.stats.totalCollected)} hint={`${summary.stats.collectionRate}% recovered from billed balances`} />
        <MetricCard label="Outstanding" value={formatCurrency(summary.stats.totalOutstanding)} hint="Remaining dues still to be collected" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.55fr_0.95fr]">
        <div className="surface-card p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">Collections trend</p>
              <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Monthly payment flow</h2>
            </div>
            <span className="status-tag status-tag--violet">{summary.monthlyCollections.length} months tracked</span>
          </div>

          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
              <AreaChart data={summary.monthlyCollections}>
                <defs>
                  <linearGradient id="dashboardArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.7} />
                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '18px',
                  }}
                />
                <Area type="monotone" dataKey="amount" stroke="#818cf8" strokeWidth={3} fill="url(#dashboardArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-5">
            <p className="eyebrow">Recent payments</p>
            <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Latest posted activity</h2>
          </div>

          <div className="space-y-3">
            {summary.recentPayments.map((payment) => (
              <div key={payment.id} className="rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{payment.residentName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Block {payment.block} / Lot {payment.lotNumber}
                    </p>
                  </div>
                  <span className="status-tag">{formatCurrency(payment.amount)}</span>
                </div>
                <div className="mt-3 text-sm text-slate-400">
                  <p>{payment.method} / {payment.type}</p>
                  <p>{formatDate(payment.paymentDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="surface-card p-5">
          <div className="mb-5">
            <p className="eyebrow">Highest outstanding lots</p>
            <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Collection follow-up queue</h2>
          </div>

          <div className="space-y-3">
            {summary.overdueLots.map((lot) => (
              <div key={`${lot.residentId}-${lot.block}-${lot.lotNumber}`} className="rounded-2xl border border-white/8 bg-slate-950/50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{lot.residentName}</p>
                    <p className="mt-1 text-sm text-slate-400">
                      Resident ID: {lot.residentCode} / Block {lot.block} / Lot {lot.lotNumber}
                    </p>
                  </div>
                  <span className="status-tag status-tag--danger">{formatCurrency(lot.remainingBalance)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="surface-card p-5">
          <div className="mb-5">
            <p className="eyebrow">Balance overview</p>
            <h2 className="mt-2 text-xl font-semibold text-white sm:text-2xl">Billed vs remaining</h2>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
              <BarChart
                data={[
                  { label: 'Total billed', amount: summary.stats.totalBalance },
                  { label: 'Collected', amount: summary.stats.totalCollected },
                  { label: 'Outstanding', amount: summary.stats.totalOutstanding },
                ]}
              >
                <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} />
                <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{
                    background: '#0f172a',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '18px',
                  }}
                />
                <Bar dataKey="amount" fill="#60a5fa" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}

export default AdminDashboardPage;
