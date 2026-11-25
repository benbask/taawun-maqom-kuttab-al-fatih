"use client";

import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProofUploadTrigger() {
  return (
    <Button
      type="button"
      variant="danger"
      size="lg"
      className="w-full whitespace-normal text-center leading-snug"
      onClick={() => window.dispatchEvent(new Event("taawun:open-proof"))}
    >
      <Upload className="h-5 w-5 shrink-0" />
      <span>Jangan lupa kembali ke halaman ini untuk upload bukti</span>
    </Button>
  );
}
