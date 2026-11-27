"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ScanLine } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface BackfillResponse {
  ok?: boolean;
  error?: string;
  processed?: number;
  invoiceNo?: string;
  matched?: number;
  review?: number;
  skipped?: number;
  remaining?: number;
}

const MAX_ROUNDS = 15;

export function AutoVerifyQueueButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");

  async function run() {
    setLoading(true);
    let matched = 0;
    let review = 0;
    let skipped = 0;
    let processed = 0;
    let remaining = 0;

    try {
      for (let round = 0; round < MAX_ROUNDS; round += 1) {
        setProgress(
          processed === 0 ? "Memeriksa..." : `Memeriksa... ${processed} selesai`,
        );

        const response = await fetch("/api/admin/auto-verify/backfill", {
          method: "POST",
        });
        let data: BackfillResponse;
        try {
          data = (await response.json()) as BackfillResponse;
        } catch {
          toast.error(
            "Server tidak merespons. Coba lagi; antrean tetap aman.",
          );
          return;
        }

        if (!response.ok || !data.ok) {
          toast.error(data.error ?? "Gagal memproses antrean OCR.");
          return;
        }

        processed += data.processed ?? 0;
        matched += data.matched ?? 0;
        review += data.review ?? 0;
        skipped += data.skipped ?? 0;
        remaining = data.remaining ?? 0;

        if (processed === 0 || remaining === 0) break;
      }

      if (processed === 0) {
        toast.info("Tidak ada bukti yang perlu diperiksa.");
      } else {
        toast.success(
          `Selesai memeriksa ${processed} bukti: ${matched} cocok, ` +
            `${review} perlu cek, ${skipped} dilewati.` +
            (remaining > 0
              ? ` Sisa ${remaining}; tekan lagi untuk melanjutkan.`
              : ""),
        );
      }
      router.refresh();
    } catch {
      toast.error("Tidak dapat menghubungi server.");
    } finally {
      setProgress("");
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
      loadingText={progress || "Memeriksa..."}
    >
      <ScanLine className="h-3.5 w-3.5" /> Cek antrean OCR
    </Button>
  );
}
