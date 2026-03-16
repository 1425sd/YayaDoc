import type { CSSProperties } from "react";

const PAGE_BACKGROUND_STORAGE_PREFIX = "editor-background:";
const PATTERN_BACKGROUND_KEY = "ornament";
const GRID_BACKGROUND_KEY = "grid";
const PATTERN_BACKGROUND_TOKEN =
  `${PAGE_BACKGROUND_STORAGE_PREFIX}${PATTERN_BACKGROUND_KEY}`;
const GRID_BACKGROUND_TOKEN =
  `${PAGE_BACKGROUND_STORAGE_PREFIX}${GRID_BACKGROUND_KEY}`;
const PATTERN_BACKGROUND_IMAGE =
  `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cg fill='%2394908e' fill-opacity='0.32'%3E%3Cpolygon fill-rule='evenodd' points='8 4 12 6 8 8 6 12 4 8 0 6 4 4 6 0 8 4'/%3E%3C/g%3E%3C/svg%3E")`;
const GRID_BACKGROUND_IMAGE =
  "linear-gradient(rgba(148, 144, 142, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 144, 142, 0.12) 1px, transparent 1px)";

export type PageBackgroundId = "default" | "ornament" | "grid";

type PageBackgroundOption = {
  id: PageBackgroundId;
  label: string;
  coverPhoto: string | null;
  previewStyle: CSSProperties;
  surfaceStyle: CSSProperties;
};

export const PAGE_BACKGROUND_OPTIONS: PageBackgroundOption[] = [
  {
    id: "default",
    label: "白色",
    coverPhoto: null,
    previewStyle: {
      backgroundColor: "#ffffff",
      backgroundImage: "none",
    },
    surfaceStyle: {
      "--editor-page-background-color": "#ffffff",
      "--editor-page-background-image": "none",
      "--editor-page-background-repeat": "no-repeat",
      "--editor-page-background-size": "auto",
      "--editor-page-background-position": "top left",
    } as CSSProperties,
  },
  {
    id: "ornament",
    label: "纹理",
    coverPhoto: PATTERN_BACKGROUND_TOKEN,
    previewStyle: {
      backgroundColor: "#ffffff",
      backgroundImage: PATTERN_BACKGROUND_IMAGE,
      backgroundRepeat: "repeat",
      backgroundSize: "24px 24px",
    },
    surfaceStyle: {
      "--editor-page-background-color": "#ffffff",
      "--editor-page-background-image": PATTERN_BACKGROUND_IMAGE,
      "--editor-page-background-repeat": "repeat",
      "--editor-page-background-size": "24px 24px",
      "--editor-page-background-position": "top left",
    } as CSSProperties,
  },
  {
    id: "grid",
    label: "浅网格",
    coverPhoto: GRID_BACKGROUND_TOKEN,
    previewStyle: {
      backgroundColor: "#ffffff",
      backgroundImage: GRID_BACKGROUND_IMAGE,
      backgroundRepeat: "repeat",
      backgroundSize: "28px 28px",
    },
    surfaceStyle: {
      "--editor-page-background-color": "#ffffff",
      "--editor-page-background-image": GRID_BACKGROUND_IMAGE,
      "--editor-page-background-repeat": "repeat",
      "--editor-page-background-size": "28px 28px",
      "--editor-page-background-position": "top left",
    } as CSSProperties,
  },
];

export function getPageBackgroundId(
  coverPhoto?: string | null,
): PageBackgroundId {
  return (
    PAGE_BACKGROUND_OPTIONS.find((option) => option.coverPhoto === coverPhoto)
      ?.id ?? "default"
  );
}

export function getPageBackgroundOption(coverPhoto?: string | null) {
  const backgroundId = getPageBackgroundId(coverPhoto);

  return (
    PAGE_BACKGROUND_OPTIONS.find((option) => option.id === backgroundId) ??
    PAGE_BACKGROUND_OPTIONS[0]
  );
}

export function getPageBackgroundSurfaceStyle(coverPhoto?: string | null) {
  return getPageBackgroundOption(coverPhoto).surfaceStyle;
}

export function toPageBackgroundCoverPhoto(
  backgroundId: PageBackgroundId,
): string | null {
  return (
    PAGE_BACKGROUND_OPTIONS.find((option) => option.id === backgroundId)
      ?.coverPhoto ?? null
  );
}
