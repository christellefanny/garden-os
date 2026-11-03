/** Decode locally, orient and re-encode to strip photo metadata before any upload. */
export async function prepareLayoutPhoto(file: File) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 20 * 1024 * 1024 || !file.size) throw Error("Choose a JPG, PNG or WebP photo under 20 MB. Export HEIC pictures as JPG first.");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    if (!bitmap.width || !bitmap.height || bitmap.width * bitmap.height > 60000000) throw Error("Choose a smaller photo, under 60 megapixels.");
    function resize(max: number, limit: number) {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext("2d");
      if (!context) throw Error("This browser could not prepare your picture.");
      context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [.8, .65, .5, .35]) { const image = canvas.toDataURL("image/jpeg", quality); if (image.length < limit) return image; }
      throw Error("This picture is too detailed. Try a smaller photo.");
    }
    return { analysis: resize(1400, 1300000), reference: resize(600, 100000), aspectRatio: bitmap.width / bitmap.height };
  } finally { bitmap.close(); }
}
