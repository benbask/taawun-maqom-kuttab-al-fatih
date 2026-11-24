import { cn } from "@/lib/utils";

/**
 * Indikator loading ringan tanpa dependensi icon.
 * Mewarisi warna teks induk (border-current), jadi otomatis cocok
 * di tombol terang maupun gelap.
 */
export function Spinner({
  className,
  label = "Memuat",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent align-[-0.125em] opacity-90 motion-reduce:animate-none",
        className,
      )}
    />
  );
}
