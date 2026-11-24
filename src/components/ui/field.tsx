import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10 disabled:cursor-not-allowed disabled:bg-stone-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(fieldBase, "min-h-28 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(fieldBase, "h-11 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-1.5 block text-sm font-semibold text-stone-700", className)}
      {...props}
    />
  );
}

export function FieldHint({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("mt-1 text-xs leading-relaxed text-stone-500", className)} {...props} />;
}

export function FieldError({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("mt-1 text-xs font-medium text-rose-600", className)} {...props} />;
}
