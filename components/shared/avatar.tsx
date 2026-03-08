import { initials, cn } from "@/lib/utils";

interface AvatarProps {
  name: string;
  src?: string | null;
  className?: string;
}

export function Avatar({ name, src, className }: AvatarProps) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={name}
        src={src}
        className={cn(
          "h-10 w-10 rounded-2xl border border-black/10 object-cover shadow-sm",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-[var(--panel-strong)] text-sm font-semibold uppercase tracking-[0.2em] text-[var(--ink)] shadow-sm",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
