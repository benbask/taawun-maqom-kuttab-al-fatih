"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import jsQR from "jsqr";
import {
  CheckCircle2,
  Crop,
  ImagePlus,
  Loader2,
  RefreshCw,
  ScanLine,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { buttonClasses } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { cn } from "@/lib/utils";

type Rect = { x: number; y: number; w: number; h: number } | null;
type DetectorResult = { rawValue: string };
type BarcodeDetectorCtor = new (options: {
  formats: string[];
}) => { detect: (source: CanvasImageSource) => Promise<DetectorResult[]> };

const MAX_DIMENSION = 1200;

function transformCanvas(src: HTMLCanvasElement, rotation: number, scale: number) {
  const swapped = rotation % 180 === 90;
  const out = document.createElement("canvas");
  out.width = Math.round((swapped ? src.height : src.width) * scale);
  out.height = Math.round((swapped ? src.width : src.height) * scale);
  const ctx = out.getContext("2d");
  if (!ctx) return out;
  ctx.imageSmoothingEnabled = false;
  ctx.translate(out.width / 2, out.height / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  ctx.drawImage(src, -src.width / 2, -src.height / 2);
  return out;
}

export function QrisPayloadField({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  const previewRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const urlRef = useRef<string | null>(null);
  const draggingRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const [selection, setSelection] = useState<Rect>(null);
  const [decoding, setDecoding] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  function paintSelection(rect: Rect) {
    const canvas = overlayRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!rect) return;
    ctx.fillStyle = "rgba(220, 38, 38, 0.10)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.strokeStyle = "#dc2626";
    ctx.lineWidth = Math.max(2, Math.round(canvas.width / 400));
    ctx.setLineDash([8, 5]);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }

  function canvasPos(event: ReactPointerEvent<HTMLCanvasElement>) {
    const canvas = overlayRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.round(((event.clientX - rect.left) * canvas.width) / rect.width),
      y: Math.round(((event.clientY - rect.top) * canvas.height) / rect.height),
    };
  }

  async function decodeCanvas(source: HTMLCanvasElement) {
    const Detector = (
      window as unknown as { BarcodeDetector?: BarcodeDetectorCtor }
    ).BarcodeDetector;
    if (Detector) {
      try {
        const detector = new Detector({ formats: ["qr_code"] });
        const found = await detector.detect(source);
        if (found[0]?.rawValue) {
          return { value: found[0].rawValue, via: "BarcodeDetector (native)" };
        }
      } catch {
        // lanjut ke jsQR
      }
    }

    for (const rotation of [0, 90, 180, 270]) {
      for (const scale of [1, 2]) {
        const canvas = transformCanvas(source, rotation, scale);
        let data;
        try {
          data = canvas.getContext("2d", { willReadFrequently: true })?.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
        } catch {
          continue;
        }
        if (!data) continue;
        for (const inversionAttempts of ["attemptBoth", "dontInvert"] as const) {
          const result = jsQR(data.data, data.width, data.height, {
            inversionAttempts,
          });
          if (result?.data) {
            return {
              value: result.data,
              via: `jsQR (rotasi ${rotation}°, ${scale}x)`,
            };
          }
        }
      }
    }
    return null;
  }

  async function runDecode(source: HTMLCanvasElement, label: string) {
    setDecoding(true);
    setStatus(`Membaca ${label}...`);
    setOk(null);
    try {
      const result = await decodeCanvas(source);
      if (!result) {
        setStatus("QR tidak terbaca. Coba pilih area QR saja menggunakan mouse.");
        setOk(false);
        toast.error("QR tidak terbaca dari gambar.");
        return;
      }
      onChange(result.value);
      setStatus(`Berhasil dibaca via ${result.via}. Payload sudah terisi di bawah.`);
      setOk(true);
      toast.success("Payload QRIS berhasil dibaca dari gambar.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Gagal membaca gambar.";
      setStatus(message);
      setOk(false);
      toast.error(message);
    } finally {
      setDecoding(false);
    }
  }

  function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, atau WEBP).");
      return;
    }
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    const image = new Image();
    image.onload = () => {
      const ratio = Math.min(
        1,
        MAX_DIMENSION / Math.max(image.width, image.height),
      );
      const width = Math.max(1, Math.round(image.width * ratio));
      const height = Math.max(1, Math.round(image.height * ratio));
      const preview = previewRef.current;
      const overlay = overlayRef.current;
      if (!preview || !overlay) return;
      preview.width = width;
      preview.height = height;
      overlay.width = width;
      overlay.height = height;
      preview.getContext("2d")?.drawImage(image, 0, 0, width, height);
      setSelection(null);
      paintSelection(null);
      setHasImage(true);
      void runDecode(preview, "gambar penuh");
    };
    image.onerror = () => {
      setStatus("Gambar tidak bisa dibuka.");
      setOk(false);
    };
    image.src = url;
  }

  function decodeSelected() {
    if (!selection || selection.w < 10 || selection.h < 10) {
      toast.error("Pilih area QR dulu dengan menggeser mouse di atas gambar.");
      return;
    }
    const preview = previewRef.current;
    if (!preview) return;
    const pad = Math.round(Math.max(selection.w, selection.h) * 0.06);
    const x = Math.max(0, selection.x - pad);
    const y = Math.max(0, selection.y - pad);
    const w = Math.min(preview.width - x, selection.w + pad * 2);
    const h = Math.min(preview.height - y, selection.h + pad * 2);
    const crop = document.createElement("canvas");
    crop.width = w;
    crop.height = h;
    crop.getContext("2d")?.drawImage(preview, x, y, w, h, 0, 0, w, h);
    void runDecode(crop, "area terpilih");
  }

  return (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => document.getElementById(`${id}-file`)?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            document.getElementById(`${id}-file`)?.click();
          }
        }}
        className="cursor-pointer rounded-xl border-2 border-dashed border-stone-300 bg-stone-50/60 p-4 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40"
      >
        <ImagePlus className="mx-auto h-7 w-7 text-emerald-700" />
        <p className="mt-1 text-sm font-semibold text-stone-700">
          Klik untuk unggah gambar QRIS
        </p>
        <p className="text-xs text-stone-400">
          JPG, PNG, atau WEBP — payload akan dibaca otomatis
        </p>
        <input
          id={`${id}-file`}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/*"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0] ?? undefined)}
        />
      </div>

      <div
        className={cn(
          "rounded-xl border border-stone-200 bg-white p-3",
          !hasImage && "hidden",
        )}
      >
          <div className="relative inline-block max-w-full">
            <canvas ref={previewRef} className="block max-w-full rounded-lg" />
            <canvas
              ref={overlayRef}
              className="absolute left-0 top-0 max-w-full cursor-crosshair rounded-lg"
              style={{ touchAction: "none" }}
              onPointerDown={(event) => {
                draggingRef.current = true;
                startRef.current = canvasPos(event);
                setSelection(null);
                paintSelection(null);
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                if (!draggingRef.current || !startRef.current) return;
                const point = canvasPos(event);
                const rect: Rect = {
                  x: Math.min(startRef.current.x, point.x),
                  y: Math.min(startRef.current.y, point.y),
                  w: Math.abs(point.x - startRef.current.x),
                  h: Math.abs(point.y - startRef.current.y),
                };
                setSelection(rect);
                paintSelection(rect);
              }}
              onPointerUp={() => {
                draggingRef.current = false;
              }}
              onPointerCancel={() => {
                draggingRef.current = false;
              }}
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                const preview = previewRef.current;
                if (preview) void runDecode(preview, "gambar penuh");
              }}
              disabled={decoding}
              className={buttonClasses("outline", "sm")}
            >
              {decoding ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Decode ulang
            </button>
            <button
              type="button"
              onClick={decodeSelected}
              disabled={decoding}
              className={buttonClasses("secondary", "sm")}
            >
              <Crop className="h-3.5 w-3.5" /> Decode area terpilih
            </button>
            <button
              type="button"
              onClick={() => {
                setSelection(null);
                paintSelection(null);
              }}
              className={buttonClasses("ghost", "sm")}
            >
              Hapus seleksi
            </button>
          </div>
      </div>

      {status && (
        <p
          className={cn(
            "flex items-start gap-1.5 rounded-lg p-2.5 text-xs leading-relaxed",
            ok === true
              ? "bg-emerald-50 text-emerald-800"
              : ok === false
                ? "bg-amber-50 text-amber-900"
                : "bg-stone-50 text-stone-600",
          )}
        >
          {ok === true ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : ok === false ? (
            <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <ScanLine className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          {status}
        </p>
      )}

      <Textarea
        id={id}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setStatus(null);
          setOk(null);
        }}
        placeholder="000201010212..."
        className="min-h-28 font-mono text-xs"
      />
      <p className="text-[11px] leading-relaxed text-stone-400">
        Boleh dengan atau tanpa spasi. Pastikan payload hasil decode adalah QRIS
        statis; sistem akan menolak payload yang sudah memiliki nominal.
      </p>
    </div>
  );
}
