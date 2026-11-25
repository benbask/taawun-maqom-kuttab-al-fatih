/**
 * Kompres gambar di browser sebelum diunggah. Vercel membatasi body request
 * serverless sekitar 4,5 MB, sedangkan foto kamera sering lebih besar.
 */
export async function compressImage(
  file: File,
  options: { maxSide?: number; quality?: number } = {},
): Promise<File> {
  const { maxSide = 1600, quality = 0.82 } = options;
  try {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      image.src = url;
      await image.decode();
      const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) return file;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (!blob || blob.size >= file.size) return file;
      const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
      return new File([blob], name, { type: "image/jpeg" });
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return file;
  }
}
