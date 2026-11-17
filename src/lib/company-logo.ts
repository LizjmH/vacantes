import sharp from "sharp";

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;
export async function normalizeCompanyLogo(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_LOGO_BYTES)
    throw new Error("Selecciona una imagen de hasta 2 MB.");
  const buffer = Buffer.from(bytes);
  const png = buffer
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const webp =
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP";
  if (!png && !jpeg && !webp)
    throw new Error("Elige una imagen PNG, JPG o WebP.");
  try {
    const image = sharp(buffer, {
      limitInputPixels: 16_000_000,
      failOn: "error",
    });
    const metadata = await image.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      !["png", "jpeg", "webp"].includes(metadata.format || "") ||
      (metadata.pages || 1) > 1
    )
      throw new Error();
    const result = await image
      .rotate()
      .resize({
        width: 1024,
        height: 1024,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
    if (result.length > MAX_LOGO_BYTES) throw new Error();
    return new Uint8Array(result);
  } catch {
    throw new Error(
      "No se pudo leer la imagen. Usa un PNG, JPG o WebP estático y de menor tamaño.",
    );
  }
}
