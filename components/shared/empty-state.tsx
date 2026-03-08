interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-black/10 bg-white/80 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur">
      <div className="max-w-lg space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--muted)]">
          No activity yet
        </p>
        <h3 className="font-display text-2xl text-[var(--ink)]">{title}</h3>
        <p className="text-sm leading-7 text-[var(--muted)]">{description}</p>
        {action}
      </div>
    </div>
  );
}
