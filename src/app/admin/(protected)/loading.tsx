import { Spinner } from "@/components/ui/spinner";

export default function AdminLoading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-emerald-900">
      <Spinner className="size-6" label="Memuat halaman admin" />
      <p className="text-sm font-semibold text-stone-500">Memuat data…</p>
    </div>
  );
}
