import { useEffect, useState } from 'react';
import SectionHeader from '../components/SectionHeader';
import { getAdminOverview } from '../services/api';

function AdminPage() {
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    getAdminOverview().then(setOverview);
  }, []);

  if (!overview) {
    return <div className="glass-panel p-8 text-stone-300">Loading admin controls...</div>;
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel p-5">
        <SectionHeader
          eyebrow="Administration"
          title="Admin control center"
          description="Publish association notices, monitor record sync health, and prepare data governance workflows."
          action={<button className="primary-button">Broadcast notice</button>}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {overview.systemHealth.map((item) => (
            <div key={item.label} className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-stone-400">{item.label}</p>
              <p className="mt-3 font-display text-3xl text-white">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-panel p-5">
        <SectionHeader
          eyebrow="Announcements"
          title="Community notices"
          description="Schedule reminders and board communication directly from the administrator panel."
        />
        <div className="space-y-3">
          {overview.notices.map((notice) => (
            <div key={notice} className="rounded-2xl border border-white/10 bg-stone-950/60 px-4 py-4 text-stone-200">
              {notice}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default AdminPage;
