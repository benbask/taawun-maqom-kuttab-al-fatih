import { Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatRupiah } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface TopContributor {
  id: string;
  name: string;
  amount: number;
}

export function TopContributorsCard({
  contributors,
  className,
}: {
  contributors: TopContributor[];
  className?: string;
}) {
  const max = Math.max(...contributors.map((item) => item.amount), 1);

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/60 px-5 py-4">
        <span className="rounded-lg bg-amber-100 p-1.5 text-amber-700">
          <Trophy className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-stone-900">
            10 kontributor teratas
          </h2>
          <p className="text-xs text-stone-500">
            Nominal pokok Ta&apos;awun, nama disamarkan.
          </p>
        </div>
      </div>

      {contributors.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-stone-500">
          Belum ada kontributor yang dapat ditampilkan.
        </p>
      ) : (
        <div className="divide-y divide-stone-100">
          {contributors.map((item, index) => (
            <div key={item.id} className="flex items-center gap-3 px-5 py-3">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-extrabold tabular-nums",
                  index === 0
                    ? "bg-amber-400 text-amber-950"
                    : index < 3
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-stone-100 text-stone-500",
                )}
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-stone-800">
                  {item.name}
                </p>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                  <div
                    className="h-full rounded-full bg-emerald-600"
                    style={{ width: `${(item.amount / max) * 100}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-xs font-extrabold tabular-nums text-emerald-900">
                {formatRupiah(item.amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
