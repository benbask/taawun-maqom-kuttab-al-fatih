"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AutoVerifyQueueButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/auto-verify/backfill", {
        method: "POST",
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        processed?: number;
        matched?: number;
        review?: number;
        skipped?: number;
        remaining?: number;
      };
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Gagal memproses antrean OCR.");
        return;
      }
      toast.success(
        `Diproses ${data.processed ?? 0}: ${data.matched ?? 0} cocok, ` +
          `${data.review ?? 0} perlu cek, ${data.skipped ?? 0} dilewati. ` +
          `Sisa ${data.remaining ?? 0}.`,
      );
      router.refresh();
    } catch {
      toast.error("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={run}
      loading={loading}
      loadingText="Memeriksa..."
    >
      <ScanLine className="h-3.5 w-3.5" /> Cek antrean OCR
    </Button>
  );
}
