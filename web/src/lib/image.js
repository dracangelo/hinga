/*
 * Preparing images in the browser before upload.
 *
 * Phone photos are routinely 4–10 MB and base64 inflates them by a third, so a
 * raw file went straight past Vercel's 4.5 MB request-body limit and the admin
 * panel reported a size error. Resizing to a sensible storefront size and
 * re-encoding keeps uploads in the low hundreds of KB.
 */

const MAX_EDGE = 1600;
const TARGET_BYTES = 700 * 1024;
const HARD_LIMIT_BYTES = 3 * 1024 * 1024;
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;

export function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(blob);
  });
}

async function loadImage(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* Fall through to the <img> path (some browsers refuse SVG bitmaps). */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('That image could not be opened.'));
      image.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function encode(canvas, type, quality) {
  return new Promise((resolve) => {
    if (!canvas.toBlob) {
      resolve(null);
      return;
    }
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

/**
 * Resize and re-encode an image file for upload.
 * @returns {Promise<{data: string, name: string, bytes: number}>}
 */
export async function prepareImageForUpload(file) {
  if (!file) throw new Error('Choose an image first.');
  if (!file.type.startsWith('image/')) {
    throw new Error('That file is not an image. Use a JPG, PNG, WEBP or GIF.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`That image is ${formatBytes(file.size)}. Please use one under 30 MB.`);
  }

  // SVG is vector and GIF may be animated: send them untouched when they fit.
  const sendAsIs =
    file.type === 'image/svg+xml' ||
    (file.type === 'image/gif' && file.size <= HARD_LIMIT_BYTES);
  if (sendAsIs) {
    return { data: await readAsDataUrl(file), name: file.name, bytes: file.size };
  }

  const image = await loadImage(file);
  const width = image.width || image.naturalWidth;
  const height = image.height || image.naturalHeight;
  if (!width || !height) throw new Error('That image could not be read.');

  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  let targetWidth = Math.max(1, Math.round(width * scale));
  let targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('This browser cannot resize images. Try another browser.');

  let blob = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.clearRect(0, 0, targetWidth, targetHeight);
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    for (const quality of [0.85, 0.75, 0.65, 0.55]) {
      const encoded = await encode(canvas, 'image/webp', quality);
      if (!encoded) {
        // No toBlob support — keep the untouched file rather than failing.
        image.close?.();
        return { data: await readAsDataUrl(file), name: file.name, bytes: file.size };
      }
      if (!blob || encoded.size < blob.size) blob = encoded;
      if (encoded.size <= TARGET_BYTES) {
        blob = encoded;
        break;
      }
    }

    if (blob.size <= HARD_LIMIT_BYTES) break;
    targetWidth = Math.max(1, Math.round(targetWidth * 0.75));
    targetHeight = Math.max(1, Math.round(targetHeight * 0.75));
  }

  image.close?.();

  if (blob.size > HARD_LIMIT_BYTES) {
    throw new Error(
      `Even after resizing that image is ${formatBytes(blob.size)}. Please use a smaller one.`,
    );
  }

  const baseName = String(file.name || 'image').replace(/\.[^.]+$/, '') || 'image';
  return {
    data: await readAsDataUrl(blob),
    name: `${baseName}.webp`,
    bytes: blob.size,
  };
}
