import { ImageMediaType } from "./anthropic";

const MAX_DIMENSION = 1568;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Get the MIME type from a File object.
 */
export function getMediaType(file: File): ImageMediaType | null {
  const typeMap: Record<string, ImageMediaType> = {
    "image/jpeg": "image/jpeg",
    "image/jpg": "image/jpeg",
    "image/png": "image/png",
    "image/webp": "image/webp",
    "image/gif": "image/gif",
  };
  return typeMap[file.type] ?? null;
}

/**
 * Validate that a file is an acceptable image.
 */
export function validateImage(file: File): string | null {
  if (!getMediaType(file)) {
    return "Unsupported file type. Please use JPEG, PNG, WebP, or GIF.";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "File too large. Maximum size is 10MB.";
  }
  return null;
}

/**
 * Read a File as a base64 string, optionally resizing if too large.
 * Returns the base64 data (without the data URL prefix).
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Resize if either dimension exceeds the max
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const scale = MAX_DIMENSION / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Failed to get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Use the original format if possible, fall back to JPEG
      const mimeType = getMediaType(file) ?? "image/jpeg";
      const dataUrl = canvas.toDataURL(mimeType, 0.9);
      const base64 = dataUrl.split(",")[1];
      resolve(base64);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}
