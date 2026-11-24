"use client";

import { Printer } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonClasses("outline", "sm", "no-print")}
    >
      <Printer className="h-3.5 w-3.5" /> Cetak
    </button>
  );
}
