import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
      <div>
        {eyebrow && (
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-amber-700">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-emerald-950">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-stone-500">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
