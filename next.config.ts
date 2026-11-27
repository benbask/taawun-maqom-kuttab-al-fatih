import type { NextConfig } from "next";

/**
 * Tesseract.js menjalankan worker thread dan memuat file .wasm dari dalam
 * node_modules saat runtime. File-file itu tidak terdeteksi otomatis oleh
 * pelacakan dependensi, jadi harus didaftarkan manual pada route yang
 * menjalankan OCR.
 */
const ocrFiles = [
  "./node_modules/tesseract.js/**",
  "./node_modules/tesseract.js-core/tesseract-core*.js",
  "./node_modules/tesseract.js-core/tesseract-core*.wasm",
  "./node_modules/wasm-feature-detect/**",
  "./node_modules/is-url/**",
  "./node_modules/regenerator-runtime/**",
];

const nextConfig: NextConfig = {
  // Tesseract.js membuat worker thread dari path file di dalam paketnya.
  // Jika ikut di-bundle Next.js, path itu rusak dan worker tidak pernah
  // merespons. Biarkan paket ini tetap dimuat dari node_modules.
  serverExternalPackages: ["tesseract.js", "tesseract.js-core"],
  outputFileTracingIncludes: {
    "/api/ocr/run": ocrFiles,
    "/api/admin/auto-verify/backfill": ocrFiles,
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
