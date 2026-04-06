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
import { Link } from 'react-router-dom';

const previewTrend = [
  { month: 'Jan', collections: 95000, residents: 208 },
  { month: 'Feb', collections: 118000, residents: 214 },
  { month: 'Mar', collections: 140000, residents: 227 },
  { month: 'Apr', collections: 162000, residents: 233 },
  { month: 'May', collections: 175000, residents: 240 },
  { month: 'Jun', collections: 189000, residents: 247 },
];

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
    title: 'Admin workflows built for daily HOA work',
    text: 'Handle edits, transfers, removals, and new collections from a dashboard designed around association operations.',
  },
];

function LandingPage() {
  return (
    <main className="pb-20">
      <section className="mx-auto grid max-w-7xl gap-8 px-4 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-6 lg:pt-10">
        <div className="hero-copy surface-card p-8 lg:p-10">
          <p className="eyebrow">Modern HOA platform</p>
          <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-white lg:text-6xl">
            A homeowners association website built for residents, dues, and day-to-day administration.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
            Greenfield Estates brings resident search, payment visibility, and an admin-only control center into one polished portal. Public visitors can explore the community, while administrators manage records and collections securely.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/find-my-resident-info" className="action-button action-button--primary">
              Find My Resident Info
            </Link>
            <Link to="/admin/login" className="action-button action-button--secondary">
              Admin Login
            </Link>
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
              <strong>Secure admin area</strong>
              <span>Protected dashboard for records and collections.</span>
            </div>
          </div>
        </div>

        <div className="dashboard-preview">
          <div className="surface-card preview-card preview-card--hero p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="eyebrow">Admin preview</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">SaaS-style HOA dashboard</h2>
              </div>
              <span className="status-tag">Live operations</span>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="preview-stat">
                <span>Total residents</span>
                <strong>247</strong>
              </div>
              <div className="preview-stat">
                <span>Collections posted</span>
                <strong>PHP 189K</strong>
              </div>
              <div className="preview-stat">
                <span>Active lots</span>
                <strong>231</strong>
              </div>
            </div>

            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={previewTrend}>
                  <defs>
                    <linearGradient id="heroChart" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.65} />
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.08} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148,163,184,0.16)" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '18px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="collections"
                    stroke="#818cf8"
                    strokeWidth={3}
                    fill="url(#heroChart)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 surface-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="eyebrow">Resident growth</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Community engagement snapshot</h3>
              </div>
              <span className="status-tag status-tag--violet">+18 this quarter</span>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={previewTrend}>
                  <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                  <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: '#0f172a',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '18px',
                    }}
                  />
                  <Bar dataKey="residents" fill="#60a5fa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
    </main>
  );
}

export default LandingPage;
