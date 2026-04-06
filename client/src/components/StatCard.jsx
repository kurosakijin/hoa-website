function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
      <p className="text-sm text-stone-400">{label}</p>
      <p className="mt-3 font-display text-3xl text-white">{value}</p>
      <p className="mt-2 text-sm text-stone-300">{hint}</p>
    </div>
  );
}

export default StatCard;
