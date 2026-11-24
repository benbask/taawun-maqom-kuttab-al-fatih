import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

type Tone = "green" | "amber" | "red" | "blue" | "stone" | "gold";

const tones: Record<Tone, string> = {
  green: "border-emerald-200 bg-emerald-50 text-emerald-800",
  amber: "border-amber-200 bg-amber-50 text-amber-800",
  red: "border-rose-200 bg-rose-50 text-rose-800",
  blue: "border-sky-200 bg-sky-50 text-sky-800",
  stone: "border-stone-200 bg-stone-100 text-stone-700",
  gold: "border-amber-300 bg-amber-100 text-amber-900",
};

export function Badge({
  className,
  tone = "green",
  ...props
}: ComponentProps<"span"> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
