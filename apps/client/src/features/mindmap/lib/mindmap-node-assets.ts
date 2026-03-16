import type { MindMapNodeImagePayload } from "@/features/mindmap/types/mindmap.types.ts";

export const DEFAULT_NODE_IMAGE_WIDTH = 160;
export const DEFAULT_NODE_IMAGE_HEIGHT = 100;
export const MAX_MINDMAP_IMAGE_FILE_SIZE = 10 * 1024 * 1024;

const URL_PROTOCOL_RE = /^[a-zA-Z][a-zA-Z\d+.-]*:/;
const URL_LIKE_RE =
  /^(?:www\.|localhost(?::\d+)?(?:[/?#]|$)|(?:\d{1,3}\.){3}\d{1,3}(?::\d+)?(?:[/?#]|$)|(?:[a-zA-Z\d-]+\.)+[a-zA-Z]{2,}(?::\d+)?(?:[/?#]|$))/;

function getImageTitleFromName(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

function getImageSizeFallback(value: number, fallback: number) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export function isImageMimeType(type: string | null | undefined) {
  return typeof type === "string" && type.startsWith("image/");
}

export function getImageFileFromFileList(
  files: FileList | File[] | null | undefined,
) {
  if (!files) {
    return null;
  }

  const list = Array.isArray(files) ? files : Array.from(files);
  return list.find((file) => isImageMimeType(file.type)) ?? null;
}

export function getClipboardImageFile(dataTransfer: DataTransfer | null) {
  const file = getImageFileFromFileList(dataTransfer?.files);
  if (file) {
    return file;
  }

  const item = Array.from(dataTransfer?.items ?? []).find(
    (entry) => entry.kind === "file" && isImageMimeType(entry.type),
  );

  return item?.getAsFile() ?? null;
}

export function readBlobAsDataUrl(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("读取图片失败"));
    };
    reader.onerror = () => reject(reader.error ?? new Error("读取图片失败"));
    reader.readAsDataURL(blob);
  });
}

export function getImageDimensions(url: string) {
  return new Promise<{ width: number; height: number }>((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || image.width || DEFAULT_NODE_IMAGE_WIDTH,
        height:
          image.naturalHeight || image.height || DEFAULT_NODE_IMAGE_HEIGHT,
      });
    };
    image.onerror = () => {
      resolve({
        width: DEFAULT_NODE_IMAGE_WIDTH,
        height: DEFAULT_NODE_IMAGE_HEIGHT,
      });
    };
    image.src = url;
  });
}

export async function buildMindMapImagePayloadFromBlob(
  blob: Blob,
): Promise<MindMapNodeImagePayload> {
  const url = await readBlobAsDataUrl(blob);
  const size = await getImageDimensions(url);
  const title =
    blob instanceof File ? getImageTitleFromName(blob.name) : "粘贴图片";

  return {
    url,
    title,
    width: getImageSizeFallback(size.width, DEFAULT_NODE_IMAGE_WIDTH),
    height: getImageSizeFallback(size.height, DEFAULT_NODE_IMAGE_HEIGHT),
    custom: false,
  };
}

export function normalizeHyperlink(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (URL_PROTOCOL_RE.test(trimmed)) {
    return trimmed;
  }

  if (trimmed.startsWith("//")) {
    return `https:${trimmed}`;
  }

  if (URL_LIKE_RE.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

export function getAutoDetectedNodeHyperlink(text: string) {
  const trimmed = text.trim();
  if (!trimmed || /\s/.test(trimmed)) {
    return "";
  }

  const normalized = normalizeHyperlink(trimmed);
  if (!normalized) {
    return "";
  }

  try {
    // `new URL` also accepts schemes like mailto: and tel:.
    new URL(normalized);
    return normalized;
  } catch {
    return "";
  }
}
