"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint } from "@/components/ui/field";
import { compressImage } from "@/lib/image-compress";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function InvoiceProofUploader({
  invoiceId,
  rejected = false,
}: {
  invoiceId: string;
  rejected?: boolean;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function openPicker() {
      inputRef.current?.click();
    }
    window.addEventListener("taawun:open-proof", openPicker);
    return () => window.removeEventListener("taawun:open-proof", openPicker);
  }, []);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function pick(next: File | null) {
    setError(null);
    if (!next) return;
    if (!ALLOWED.includes(next.type)) {
      setError("Format harus JPG, PNG, WEBP, atau PDF.");
      return;
    }
    if (next.size > MAX_BYTES) {
      setError("Ukuran file maksimal 5 MB.");
      return;
    }
    const chosen = next.type.startsWith("image/") ? await compressImage(next) : next;
    if (chosen.size > MAX_BYTES) {
      setError("Ukuran file masih terlalu besar. Coba crop atau foto ulang bukti.");
      return;
    }
    setFile(chosen);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(chosen.type.startsWith("image/") ? URL.createObjectURL(chosen) : null);
  }

  async function upload() {
    if (!file) {
      setError("Pilih file bukti transfer terlebih dahulu.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch(`/api/invoice/${invoiceId}/proof`, {
        method: "POST",
        body: form,
      });
      let data: { ok?: boolean; error?: string };
      try {
        data = (await response.json()) as { ok?: boolean; error?: string };
      } catch {
        setError(
          response.status === 413
            ? "Ukuran bukti terlalu besar untuk dikirim. Coba foto/crop ulang atau unggah file lebih kecil."
            : "Server belum merespons dengan benar. Periksa koneksi lalu coba lagi.",
        );
        return;
      }
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Gagal mengunggah bukti. Silakan coba lagi.");
        return;
      }
      toast.success("Bukti transfer terkirim. Menunggu verifikasi admin.");
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      router.refresh();
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700 ring-1 ring-emerald-100">
          <Upload className="h-4 w-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-stone-900">
            {rejected ? "Unggah ulang bukti transfer" : "Unggah bukti transfer"}
          </h3>
          <p className="text-xs text-stone-500">
            JPG, PNG, WEBP, atau PDF. Maksimal 5 MB.
          </p>
        </div>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          pick(event.dataTransfer.files?.[0] ?? null);
        }}
        className={
          dragging
            ? "cursor-pointer rounded-2xl border-2 border-dashed border-emerald-500 bg-emerald-50 p-5 text-center"
            : "cursor-pointer rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50/60 p-5 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40"
        }
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Pratinjau bukti transfer"
            className="mx-auto max-h-56 rounded-xl object-contain shadow-sm"
          />
        ) : file ? (
          <div className="flex flex-col items-center gap-1">
            <FileCheck2 className="h-8 w-8 text-emerald-600" />
            <p className="text-sm font-semibold text-stone-800">{file.name}</p>
            <p className="text-xs text-stone-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <ImagePlus className="h-8 w-8 text-stone-400" />
            <p className="text-sm font-semibold text-stone-700">
              Klik atau tarik file ke sini
            </p>
            <p className="text-xs text-stone-400">Screenshot / foto bukti transfer</p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(event) => pick(event.target.files?.[0] ?? null)}
        />
      </div>

      {file && (
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (preview) URL.revokeObjectURL(preview);
              setPreview(null);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-rose-600"
          >
            <X className="h-3.5 w-3.5" /> Hapus file
          </button>
          <Button size="sm" onClick={upload} disabled={loading}>
            {loading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Kirim bukti
          </Button>
        </div>
      )}

      {error && <FieldError>{error}</FieldError>}
      <FieldHint>
        Pastikan nominal, tanggal, dan status transaksi terlihat jelas pada bukti.
      </FieldHint>
    </div>
  );
}
