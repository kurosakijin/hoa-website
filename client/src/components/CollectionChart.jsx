import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function CollectionChart({ data }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <div className="mb-5">
        <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Collections</p>
        <h3 className="mt-2 font-display text-2xl text-white">Monthly dues trend</h3>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="hoaCollection" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#34d399" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#34d399" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="month" stroke="#a8a29e" tickLine={false} axisLine={false} />
            <YAxis stroke="#a8a29e" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1c1917',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '16px',
                color: '#fafaf9',
              }}
            />
            <Area type="monotone" dataKey="amount" stroke="#34d399" fill="url(#hoaCollection)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default CollectionChart;
