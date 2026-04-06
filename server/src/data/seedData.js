const residents = [
  {
    residentCode: 'HOA-A12F90',
    firstName: 'Maria',
    lastName: 'Santos',
    contactNumber: '0917-555-1024',
    address: '14 Sampaguita Street, Greenfield Estates',
    status: 'Owner',
    lots: [
      {
        block: 'A',
        lotNumber: '14',
        squareMeters: 180,
        totalBalance: 12000,
        remainingBalance: 6500,
        isActive: true,
      },
      {
        block: 'A',
        lotNumber: '15',
        squareMeters: 175,
        totalBalance: 12000,
        remainingBalance: 3000,
        isActive: true,
      },
    ],
  },
  {
    residentCode: 'HOA-B79D22',
    firstName: 'Daniel',
    lastName: 'Cruz',
    contactNumber: '0917-555-4431',
    address: '7 Narra Lane, Greenfield Estates',
    status: 'Tenant',
    lots: [
      {
        block: 'C',
        lotNumber: '07',
        squareMeters: 145,
        totalBalance: 9000,
        remainingBalance: 4500,
        isActive: true,
      },
    ],
  },
  {
    residentCode: 'HOA-C44M81',
    firstName: 'Ana',
    lastName: 'Lim',
    contactNumber: '0917-555-8821',
    address: '11 Molave Drive, Greenfield Estates',
    status: 'Owner',
    lots: [
      {
        block: 'B',
        lotNumber: '11',
        squareMeters: 160,
        totalBalance: 11000,
        remainingBalance: 2000,
        isActive: true,
      },
    ],
  },
];

const payments = [
  {
    residentCode: 'HOA-A12F90',
    block: 'A',
    lotNumber: '14',
    amount: 3500,
    method: 'GCash',
    type: 'Association Dues',
    paymentDate: '2026-04-02T10:00:00.000Z',
    notes: 'April dues partial payment',
  },
  {
    residentCode: 'HOA-A12F90',
    block: 'A',
    lotNumber: '15',
    amount: 9000,
    method: 'Bank Transfer',
    type: 'Association Dues',
    paymentDate: '2026-03-28T09:30:00.000Z',
    notes: 'Quarterly dues settlement',
  },
  {
    residentCode: 'HOA-B79D22',
    block: 'C',
    lotNumber: '07',
    amount: 4500,
    method: 'Cash',
    type: 'Association Dues',
    paymentDate: '2026-04-01T13:45:00.000Z',
    notes: 'March and April dues',
  },
  {
    residentCode: 'HOA-C44M81',
    block: 'B',
    lotNumber: '11',
    amount: 9000,
    method: 'Check',
    type: 'Special Assessment',
    paymentDate: '2026-03-30T11:15:00.000Z',
    notes: 'Facility upgrade contribution',
  },
];

module.exports = {
  residents,
  payments,
};
