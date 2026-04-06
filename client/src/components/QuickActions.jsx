const actions = [
  {
    title: 'Register New Resident',
    description: 'Add a homeowner or tenant record and assign a lot in the community roster.',
  },
  {
    title: 'Post Manual Payment',
    description: 'Record cash, bank transfer, or check payments from the admin panel.',
  },
  {
    title: 'Review Delinquencies',
    description: 'Identify overdue balances and prioritize collection follow-ups.',
  },
];

function QuickActions() {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-xs uppercase tracking-[0.25em] text-stone-400">Quick actions</p>
      <div className="mt-4 space-y-3">
        {actions.map((action) => (
          <button
            key={action.title}
            type="button"
            className="w-full rounded-2xl border border-white/10 bg-stone-950/60 px-4 py-4 text-left transition hover:border-emerald-400/40 hover:bg-stone-950"
          >
            <p className="font-medium text-white">{action.title}</p>
            <p className="mt-2 text-sm text-stone-400">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
