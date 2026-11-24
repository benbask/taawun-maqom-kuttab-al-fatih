import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  max,
  className,
}: {
  value: number;
  max: number;
  className?: string;
}) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const label = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 1,
  }).format(percent);

  return (
    <div className={cn("space-y-2", className)}>
      <div
        className="h-3 w-full overflow-hidden rounded-full bg-emerald-950/10 ring-1 ring-inset ring-emerald-950/5"
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Capaian Ta'awun"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-400 transition-[width] duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span className="font-semibold text-emerald-800">{label}% tercapai</span>
        <span>Target {max > 0 ? "Ta'awun" : "belum ditetapkan"}</span>
      </div>
    </div>
  );
}
