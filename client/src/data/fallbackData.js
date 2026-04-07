export const fallbackDashboard = {
  stats: {
    residents: 247,
    occupiedLots: 231,
    collectionRate: '92%',
    overdueAccounts: 18,
  },
  monthlyCollections: [
    { month: 'Jan', amount: 182000 },
    { month: 'Feb', amount: 194000 },
    { month: 'Mar', amount: 201000 },
    { month: 'Apr', amount: 198500 },
    { month: 'May', amount: 208000 },
    { month: 'Jun', amount: 221000 },
  ],
  recentPayments: [
    { id: 'p1', residentName: 'Santos, Maria A.', lotNumber: 'A-14', amount: 3500, status: 'Paid', date: '2026-04-02' },
    { id: 'p2', residentName: 'Cruz, Daniel R.', lotNumber: 'C-07', amount: 3500, status: 'Pending', date: '2026-04-01' },
    { id: 'p3', residentName: 'Lim, Ana L.', lotNumber: 'B-11', amount: 7000, status: 'Paid', date: '2026-03-30' },
  ],
};

export const fallbackResidents = [
  { id: 'r1', fullName: 'Maria A. Santos', lotNumber: 'A-14', contactNumber: '09175551024', balance: 0 },
  { id: 'r2', fullName: 'Daniel R. Cruz', lotNumber: 'C-07', contactNumber: '09175554431', balance: 3500 },
  { id: 'r3', fullName: 'Ana L. Lim', lotNumber: 'B-11', contactNumber: '09175558821', balance: 0 },
  { id: 'r4', fullName: 'Paolo M. Reyes', lotNumber: 'D-03', contactNumber: '09175556642', balance: 1750 },
];

export const fallbackPayments = [
  { id: 'p1', residentName: 'Santos, Maria A.', lotNumber: 'A-14', amount: 3500, method: 'GCash', status: 'Paid', date: '2026-04-02' },
  { id: 'p2', residentName: 'Cruz, Daniel R.', lotNumber: 'C-07', amount: 3500, method: 'Bank Transfer', status: 'Pending', date: '2026-04-01' },
  { id: 'p3', residentName: 'Lim, Ana L.', lotNumber: 'B-11', amount: 7000, method: 'Cash', status: 'Paid', date: '2026-03-30' },
  { id: 'p4', residentName: 'Reyes, Paolo M.', lotNumber: 'D-03', amount: 1750, method: 'Bank Transfer', status: 'Overdue', date: '2026-03-25' },
];

export const fallbackAdmin = {
  notices: [
    'Quarterly board meeting scheduled for April 28, 2026.',
    'Pool maintenance begins on April 12, 2026.',
    'Update resident emergency contacts before the end of the month.',
  ],
  systemHealth: [
    { label: 'Resident profiles synced', value: '98%' },
    { label: 'Payments reconciled', value: '94%' },
    { label: 'Open service requests', value: '12' },
  ],
};
