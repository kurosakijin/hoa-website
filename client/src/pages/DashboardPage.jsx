import { useEffect, useState } from 'react';
import CollectionChart from '../components/CollectionChart';
import DataTable from '../components/DataTable';
import QuickActions from '../components/QuickActions';
import SectionHeader from '../components/SectionHeader';
import StatCard from '../components/StatCard';
import { getDashboardSummary } from '../services/api';

function DashboardPage() {
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    getDashboardSummary().then(setDashboard);
  }, []);

  if (!dashboard) {
    return <div className="glass-panel p-8 text-stone-300">Loading dashboard...</div>;
  }

  const paymentColumns = [
    { key: 'residentName', label: 'Resident' },
    { key: 'lotNumber', label: 'Lot' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `PHP ${value.toLocaleString()}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <span className="status-pill">{value}</span>,
    },
    { key: 'date', label: 'Date' },
  ];

  return (
    <div className="space-y-6">
      <section className="hero-panel">
        <SectionHeader
          eyebrow="Community pulse"
          title="Operations dashboard"
          description="Track household records, monthly dues, and collection health from a single command center built for homeowners associations."
          action={<button className="primary-button">Generate report</button>}
        />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Registered residents" value={dashboard.stats.residents} hint="All homeowners and tenants on file" />
          <StatCard label="Occupied lots" value={dashboard.stats.occupiedLots} hint="Units currently marked active" />
          <StatCard label="Collection rate" value={dashboard.stats.collectionRate} hint="Current month dues recovery" />
          <StatCard label="Overdue accounts" value={dashboard.stats.overdueAccounts} hint="Residents requiring follow-up" />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.6fr_0.8fr]">
        <CollectionChart data={dashboard.monthlyCollections} />
        <QuickActions />
      </section>

      <section className="glass-panel p-5">
        <SectionHeader
          eyebrow="Finance"
          title="Recent payments"
          description="Latest dues and assessment payments posted to the association ledger."
        />
        <DataTable columns={paymentColumns} rows={dashboard.recentPayments} />
      </section>
    </div>
  );
}

export default DashboardPage;
