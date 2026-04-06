function SectionHeader({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-emerald-300/80">{eyebrow}</p>
        <h2 className="mt-2 font-display text-3xl text-white">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm text-stone-300">{description}</p>
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export default SectionHeader;
