"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FieldError, Input } from "@/components/ui/field";
import { compressImage } from "@/lib/image-compress";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export function ImageUploadField({
  id,
  value,
  onChange,
  placeholder = "https://...",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File | null) {
    setError(null);
    if (!file) return;
    if (!ALLOWED.includes(file.type)) {
      setError("Format gambar harus JPG, PNG, atau WEBP.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Ukuran gambar maksimal 4 MB.");
      return;
    }

    setLoading(true);
    try {
      const chosen = await compressImage(file, { maxSide: 1600, quality: 0.85 });
      if (chosen.size > MAX_BYTES) {
        setError("Ukuran gambar masih terlalu besar. Coba pilih gambar lain.");
        return;
      }

      const form = new FormData();
      form.append("file", chosen);
      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: form,
      });

      let data: { ok?: boolean; url?: string; error?: string };
      try {
        data = (await response.json()) as typeof data;
      } catch {
        setError(
          response.status === 413
            ? "Ukuran gambar terlalu besar untuk dikirim. Coba gambar lain."
            : "Server belum merespons dengan benar. Coba lagi.",
        );
        return;
      }

      if (!response.ok || !data.ok || !data.url) {
        setError(data.error ?? "Gagal mengunggah gambar.");
        return;
      }

      onChange(data.url);
      toast.success("Gambar berhasil diunggah.");
    } catch {
      setError("Tidak dapat menghubungi server.");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Pratinjau gambar"
            className="h-36 w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2 py-1 text-[11px] font-bold text-rose-700 shadow-sm ring-1 ring-rose-200 transition hover:bg-rose-50"
          >
            <Trash2 className="h-3 w-3" /> Hapus
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-28 w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-stone-500 transition hover:border-emerald-400 hover:bg-emerald-50/40 hover:text-emerald-800"
        >
          <ImagePlus className="h-5 w-5" />
          <span className="text-xs font-semibold">Pilih gambar dari perangkat</span>
        </button>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          id={id}
          type="text"
          inputMode="url"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          {loading ? "Mengunggah..." : "Unggah gambar"}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => upload(event.target.files?.[0] ?? null)}
      />

      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
