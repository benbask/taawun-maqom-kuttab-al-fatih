import { Spinner } from "@/components/ui/spinner";

export default function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
      <div className="flex flex-col items-center justify-center gap-4 text-emerald-900">
        <Spinner className="size-6" label="Memuat halaman" />
        <p className="text-sm font-semibold text-stone-500">Memuat halaman…</p>
        <div className="mt-4 w-full max-w-2xl space-y-3" aria-hidden="true">
          <div className="h-6 w-2/3 animate-pulse rounded-lg bg-stone-200/70" />
          <div className="h-4 w-full animate-pulse rounded-lg bg-stone-200/60" />
          <div className="h-4 w-5/6 animate-pulse rounded-lg bg-stone-200/60" />
        </div>
      </div>
    </div>
  );
}
