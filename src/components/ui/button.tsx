import Link from "next/link";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

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

export function buttonClasses(variant: Variant = "primary", size: Size = "md", className?: string) {
  return cn(
    "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className,
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      type={type}
      className={buttonClasses(variant, size, className)}
      {...props}
    />
  );
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return <Link className={buttonClasses(variant, size, className)} {...props} />;
}
