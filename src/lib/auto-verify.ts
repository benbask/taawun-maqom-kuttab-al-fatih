import "server-only";
import { mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createWorker, type Worker } from "tesseract.js";

/**
 * Batas waktu satu proses OCR. Tesseract.js tidak pernah menolak promise
 * `createWorker` ketika inisialisasi gagal, jadi kita wajib memutusnya sendiri
 * agar permintaan tidak menggantung selamanya.
 */
const RECOGNIZE_TIMEOUT_MS = 25_000;

let workerPromise: Promise<Worker> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function appBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/$/, "")}`;

  return "https://maqom2026.vercel.app";
}

async function createOcrWorker(): Promise<Worker> {
  const cachePath = path.join(tmpdir(), "taawun-ocr");
  await mkdir(cachePath, { recursive: true }).catch(() => undefined);

  return createWorker("eng", 1, {
    // Data bahasa disajikan dari folder public aplikasi sendiri, bukan CDN
    // pihak ketiga, supaya tidak bergantung pada jaringan eksternal.
    langPath: `${appBaseUrl()}/ocr`,
    cachePath,
    cacheMethod: "none",
    logger: () => {},
    errorHandler: (error) => console.error("[auto-verify]", error),
  });
}

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createOcrWorker().catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

async function resetWorker(): Promise<void> {
  const current = workerPromise;
  workerPromise = null;
  if (!current) return;
  try {
    const worker = await current;
    await worker.terminate();
  } catch {
    // Worker yang gagal init tidak perlu dibersihkan.
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Pemeriksaan OCR melebihi batas waktu."));
    }, ms);
    timer.unref?.();
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/**
 * Membaca teks dari gambar bukti transfer. Worker dibuat sekali lalu dipakai
 * ulang, dan semua proses diantre supaya tidak saling menimpa.
 */
export async function recognizeProof(bytes: Uint8Array): Promise<{
  text: string;
  confidence: number;
}> {
  const run = queue.then(() =>
    withTimeout(
      (async () => {
        const worker = await getWorker();
        const result = await worker.recognize(Buffer.from(bytes));
        return {
          text: typeof result.data.text === "string" ? result.data.text : "",
          confidence: Number(result.data.confidence ?? 0),
        };
      })(),
      RECOGNIZE_TIMEOUT_MS,
    ),
  );

  queue = run.then(
    () => undefined,
    () => undefined,
  );

  try {
    return await run;
  } catch (error) {
    // Worker yang macet harus dibuang agar pemeriksaan berikutnya tidak ikut
    // menggantung.
    await resetWorker();
    throw error;
  }
}
