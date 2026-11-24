import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
import { LinkPending } from "@/components/ui/link-pending";
import { Spinner } from "@/components/ui/spinner";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "gold";
type Size = "sm" | "md" | "lg" | "icon";

const variants: Record<Variant, string> = {
  primary:
    "bg-emerald-800 text-white shadow-sm hover:bg-emerald-900 focus-visible:outline-emerald-800",
  secondary:
    "bg-emerald-50 text-emerald-900 hover:bg-emerald-100 focus-visible:outline-emerald-700",
  outline:
    "border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 focus-visible:outline-emerald-700",
  ghost: "text-stone-700 hover:bg-stone-100 focus-visible:outline-emerald-700",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-600",
  gold: "bg-amber-500 text-stone-950 shadow-sm hover:bg-amber-400 focus-visible:outline-amber-500",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-6 text-base",
  icon: "h-10 w-10 p-0",
};

/**
 * Basis gaya tombol.
 * - Efek "tertekan" saat diklik: sedikit turun + mengecil, shadow hilang.
 * - Transisi halus untuk transform & warna.
 */
const base = cn(
  "relative isolate inline-flex select-none items-center justify-center gap-2 overflow-hidden rounded-xl font-semibold",
  "transition duration-150 ease-out",
  "active:translate-y-px active:scale-[0.98] active:shadow-none",
  "motion-reduce:transition-none motion-reduce:active:translate-y-0 motion-reduce:active:scale-100",
  "focus-visible:outline-2 focus-visible:outline-offset-2",
  "disabled:pointer-events-none disabled:opacity-60 disabled:shadow-none",
);

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  loading = false,
  loadingText,
  children,
  disabled,
  ...props
}: ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  /** Menampilkan spinner + menonaktifkan tombol. */
  loading?: boolean;
  /** Teks pengganti saat loading, mis. "Menyimpan...". */
  loadingText?: string;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClasses(variant, size, className)}
      {...props}
    >
      {loading ? (
        <span className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-[inherit] bg-inherit px-3">
          <Spinner />
          {loadingText ? <span className="truncate">{loadingText}</span> : null}
        </span>
      ) : null}
      <span
        className={cn(
          "inline-flex items-center justify-center gap-2",
          loading && "opacity-0",
        )}
      >
        {children}
      </span>
    </button>
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  pending = true,
  pendingLabel,
  children,
  ...props
}: ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  /** Tampilkan overlay spinner selama navigasi. */
  pending?: boolean;
  pendingLabel?: string;
}) {
  return (
    <Link className={buttonClasses(variant, size, className)} {...props}>
      {pending ? <LinkPending label={pendingLabel} /> : null}
      {children}
    </Link>
  );
}
