import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-2xl bg-emerald-800 text-amber-100 shadow-sm ring-1 ring-emerald-900/20",
        className,
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 48 48" fill="none" className="h-[62%] w-[62%]">
        <path
          d="M8 17.5 24 9l16 8.5v2.2H8v-2.2Z"
          fill="currentColor"
          opacity=".95"
        />
        <path
          d="M12 22h4v15h-4V22Zm10 0h4v15h-4V22Zm10 0h4v15h-4V22Z"
          fill="currentColor"
          opacity=".8"
        />
        <path
          d="M7 39.5c3.2 0 5.3-2 8.5-2s5.3 2 8.5 2 5.3-2 8.5-2 5.3 2 8.5 2"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          opacity=".65"
        />
        <circle cx="24" cy="6.5" r="1.6" fill="currentColor" opacity=".8" />
      </svg>
    </span>
  );
}

export function Logo({
  siteName,
  compact = false,
  light = false,
  hideNameOnMobile = false,
}: {
  siteName: string;
  compact?: boolean;
  light?: boolean;
  hideNameOnMobile?: boolean;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <LogoMark className="h-10 w-10" />
      <span
        className={cn(
          "min-w-0 leading-tight",
          hideNameOnMobile && "hidden sm:block",
        )}
      >
        <span
          className={cn(
            "block truncate text-[13px] font-extrabold tracking-tight sm:text-sm",
            light ? "text-white" : "text-emerald-950",
          )}
        >
          {siteName}
        </span>
        {!compact && (
          <span
            className={cn(
              "block truncate text-[10px] font-semibold uppercase tracking-[0.18em]",
              light ? "text-amber-300/90" : "text-amber-700/90",
            )}
          >
            Lampung
          </span>
        )}
      </span>
    </span>
  );
}
