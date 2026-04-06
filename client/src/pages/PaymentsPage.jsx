import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionHeader from '../components/SectionHeader';
import { getPayments } from '../services/api';

function PaymentsPage() {
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    getPayments().then(setPayments);
  }, []);

  const columns = [
    { key: 'residentName', label: 'Resident' },
    { key: 'lotNumber', label: 'Lot' },
    {
      key: 'amount',
      label: 'Amount',
      render: (value) => `PHP ${value.toLocaleString()}`,
    },
    { key: 'method', label: 'Method' },
    {
      key: 'status',
      label: 'Status',
      render: (value) => <span className="status-pill">{value}</span>,
    },
    { key: 'date', label: 'Date' },
  ];

  return (
    <section className="glass-panel p-5">
      <SectionHeader
        eyebrow="Collections"
        title="Payment ledger"
        description="Review posted dues, pending transfers, and overdue balances with payment channel and status tracking."
        action={<button className="primary-button">Record payment</button>}
      />
      <DataTable columns={columns} rows={payments} />
    </section>
  );
}

export default PaymentsPage;
