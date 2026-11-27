import "server-only";
import { createWorker, type Worker } from "tesseract.js";

let workerPromise: Promise<Worker> | null = null;
let queue: Promise<unknown> = Promise.resolve();

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = createWorker("eng", 1, {
      logger: () => {},
      errorHandler: (error) => console.error("[auto-verify]", error),
    }).catch((error) => {
      workerPromise = null;
      throw error;
    });
  }
  return workerPromise;
}

/**
 * Membaca teks dari gambar bukti transfer. Worker dibuat sekali lalu dipakai
 * ulang, dan semua proses diantre supaya tidak saling menimpa.
 */
export async function recognizeProof(bytes: Uint8Array): Promise<{
  text: string;
  confidence: number;
}> {
  const run = queue.then(async () => {
    const worker = await getWorker();
    const result = await worker.recognize(Buffer.from(bytes));
    return {
      text: typeof result.data.text === "string" ? result.data.text : "",
      confidence: Number(result.data.confidence ?? 0),
    };
  });

  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
