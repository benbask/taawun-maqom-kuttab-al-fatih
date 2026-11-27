"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DEFAULT_WHATSAPP_TEMPLATE } from "@/lib/share-message";

export function WhatsappTemplateReset() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reset() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_wa_template: DEFAULT_WHATSAPP_TEMPLATE }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        toast.error(data.error ?? "Gagal mereset template.");
        return;
      }
      toast.success("Template WhatsApp kembali ke bawaan panitia.");
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
      onClick={reset}
      loading={loading}
      loadingText="Mereset..."
    >
      <RotateCcw className="h-3.5 w-3.5" /> Reset template bawaan
    </Button>
  );
}
