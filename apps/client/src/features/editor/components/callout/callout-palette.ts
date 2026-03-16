import { CalloutType } from "@docmost/editor-ext";

export type HighlightCalloutType = Extract<
  CalloutType,
  "info" | "note" | "success" | "warning" | "danger"
>;

export type CalloutPaletteItem = {
  name: string;
  type: HighlightCalloutType;
  background: string;
  border: string;
  accent: string;
  iconBackground: string;
};

const DEFAULT_CALLOUT_PALETTE = {
  name: "Default",
  type: "info" as HighlightCalloutType,
  background: "#f8fafc",
  border: "#dbe2ea",
  accent: "#94a3b8",
  iconBackground: "#eef2f6",
};

export const CALLOUT_PALETTE: CalloutPaletteItem[] = [
  {
    name: "Sky",
    type: "info",
    background: "#eff8ff",
    border: "#c9defc",
    accent: "#5b9bff",
    iconBackground: "#dcecff",
  },
  {
    name: "Mint",
    type: "success",
    background: "#eefaf2",
    border: "#c8e8d1",
    accent: "#55b37b",
    iconBackground: "#dcf3e4",
  },
  {
    name: "Lilac",
    type: "note",
    background: "#f6f1ff",
    border: "#ddd0f7",
    accent: "#9b78d3",
    iconBackground: "#ebe3ff",
  },
  {
    name: "Peach",
    type: "warning",
    background: "#fff4ea",
    border: "#f6d5b7",
    accent: "#ef9a56",
    iconBackground: "#ffe5cf",
  },
  {
    name: "Rose",
    type: "danger",
    background: "#fff1f4",
    border: "#f2cad5",
    accent: "#e77d97",
    iconBackground: "#ffe1e8",
  },
];

export function getCalloutPalette(type: CalloutType) {
  if (type === "default") {
    return DEFAULT_CALLOUT_PALETTE;
  }

  return CALLOUT_PALETTE.find((item) => item.type === type) ?? DEFAULT_CALLOUT_PALETTE;
}
