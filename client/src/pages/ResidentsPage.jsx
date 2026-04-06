import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import SectionHeader from '../components/SectionHeader';
import { getResidents } from '../services/api';

function ResidentsPage() {
  const [residents, setResidents] = useState([]);

  useEffect(() => {
    getResidents().then(setResidents);
  }, []);

  const columns = [
    { key: 'fullName', label: 'Resident' },
    { key: 'lotNumber', label: 'Lot Number' },
    {
      key: 'status',
      label: 'Resident Type',
      render: (value) => <span className="status-pill">{value}</span>,
    },
    { key: 'contactNumber', label: 'Contact' },
    {
      key: 'balance',
      label: 'Outstanding Balance',
      render: (value) => `PHP ${value.toLocaleString()}`,
    },
  ];

  return (
    <section className="glass-panel p-5">
      <SectionHeader
        eyebrow="Directory"
        title="Resident management"
        description="Maintain homeowner, tenant, and lot occupancy records with balances visible at a glance."
        action={<button className="primary-button">Add resident</button>}
      />
      <DataTable columns={columns} rows={residents} />
    </section>
  );
}

export default ResidentsPage;
