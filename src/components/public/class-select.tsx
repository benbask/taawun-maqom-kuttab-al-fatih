"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

export function ClassSelect({
  classes,
  selectedId,
}: {
  classes: Array<{ id: string; name: string }>;
  selectedId: string | null;
}) {
  const router = useRouter();

  return (
    <div className="no-print relative mt-1">
      <select
        aria-label="Pilih kelas"
        value={selectedId ?? ""}
        onChange={(event) => {
          const id = event.target.value;
          window.dispatchEvent(new Event("taawun:navigate"));
          router.push(id ? `/verifikasi?kelas=${id}` : "/verifikasi");
        }}
        className="w-full appearance-none rounded-lg border border-white/20 bg-white/10 py-1.5 pl-2.5 pr-8 text-sm font-bold text-white outline-none transition hover:bg-white/15 focus:border-amber-300"
      >
        {classes.map((cls) => (
          <option key={cls.id} value={cls.id} className="bg-white text-emerald-950">
            {cls.name}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-200" />
    </div>
  );
}
