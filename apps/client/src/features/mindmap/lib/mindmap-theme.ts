import type {
  MindMapCanvasSettings,
  MindMapThemeConfig,
  MindMapThemePresetDefinition,
  MindMapThemePresetId,
} from "@/features/mindmap/types/mindmap.types.ts";

export const DEFAULT_MINDMAP_THEME_PRESET_ID: MindMapThemePresetId =
  "professional";

const DEFAULT_CANVAS_GRID = true;
const DEFAULT_LINE_WIDTH = 2;

const MINDMAP_THEME_PRESETS: Record<
  MindMapThemePresetId,
  MindMapThemePresetDefinition
> = {
  professional: {
    id: "professional",
    labelKey: "专业主题",
    descriptionKey: "浅灰画布、黄色根节点与浅蓝二级分支，适合常规知识梳理。",
    previewColors: ["#ffd54a", "#e7f3ff", "#4b5563"],
    config: {
      docmostThemePresetId: "professional",
      docmostCanvasGrid: true,
      docmostCanvasBackground: "#f3f4f6",
      docmostGridColor: "rgba(148, 163, 184, 0.18)",
      backgroundColor: "transparent",
      lineColor: "#4b5563",
      lineWidth: 2,
      lineStyle: "straight",
      lineDasharray: "none",
      lineRadius: 10,
      hoverRectColor: "#2563eb",
      root: {
        fillColor: "#ffd54a",
        color: "#1f2937",
        borderColor: "#2f3640",
        borderWidth: 2,
        borderRadius: 10,
        fontSize: 20,
        fontWeight: "bold",
        shape: "rectangle",
      },
      second: {
        fillColor: "#e7f3ff",
        color: "#335b7d",
        borderColor: "#8aa6bf",
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 16,
        fontWeight: "normal",
        shape: "rectangle",
      },
      node: {
        fillColor: "transparent",
        color: "#374151",
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: "normal",
        shape: "rectangle",
      },
      generalization: {
        fillColor: "#ffd54a",
        color: "#1f2937",
        borderColor: "#fbbf24",
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: "bold",
        shape: "rectangle",
      },
    },
  },
  blueprint: {
    id: "blueprint",
    labelKey: "蓝图主题",
    descriptionKey: "更冷静的蓝灰风格，适合流程整理和项目规划。",
    previewColors: ["#9ec5ff", "#f8fafc", "#334155"],
    config: {
      docmostThemePresetId: "blueprint",
      docmostCanvasGrid: true,
      docmostCanvasBackground: "#eef3f8",
      docmostGridColor: "rgba(100, 116, 139, 0.16)",
      backgroundColor: "transparent",
      lineColor: "#334155",
      lineWidth: 2,
      lineStyle: "curve",
      lineDasharray: "none",
      lineRadius: 12,
      hoverRectColor: "#0f766e",
      root: {
        fillColor: "#9ec5ff",
        color: "#0f172a",
        borderColor: "#1d4ed8",
        borderWidth: 2,
        borderRadius: 12,
        fontSize: 20,
        fontWeight: "bold",
        shape: "rectangle",
      },
      second: {
        fillColor: "#f8fafc",
        color: "#334155",
        borderColor: "#94a3b8",
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 16,
        fontWeight: "normal",
        shape: "rectangle",
      },
      node: {
        fillColor: "transparent",
        color: "#475569",
        borderColor: "transparent",
        borderWidth: 0,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: "normal",
        shape: "rectangle",
      },
      generalization: {
        fillColor: "#dbeafe",
        color: "#0f172a",
        borderColor: "#60a5fa",
        borderWidth: 1,
        borderRadius: 8,
        fontSize: 14,
        fontWeight: "bold",
        shape: "rectangle",
      },
    },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asThemeConfig(value: unknown): MindMapThemeConfig {
  return isRecord(value) ? (value as MindMapThemeConfig) : {};
}

function mergeLevelConfig(
  base: MindMapThemeConfig,
  patch: Partial<MindMapThemeConfig>,
) {
  return {
    root: {
      ...(base.root ?? {}),
      ...(patch.root ?? {}),
    },
    second: {
      ...(base.second ?? {}),
      ...(patch.second ?? {}),
    },
    node: {
      ...(base.node ?? {}),
      ...(patch.node ?? {}),
    },
    generalization: {
      ...(base.generalization ?? {}),
      ...(patch.generalization ?? {}),
    },
  };
}

export function mergeMindMapThemeConfig(
  base: MindMapThemeConfig,
  patch: Partial<MindMapThemeConfig>,
): MindMapThemeConfig {
  return {
    ...base,
    ...patch,
    ...mergeLevelConfig(base, patch),
  };
}

export function getMindMapThemePresets(): MindMapThemePresetDefinition[] {
  return Object.values(MINDMAP_THEME_PRESETS);
}

export function getMindMapThemePreset(
  presetId?: string,
): MindMapThemePresetDefinition {
  if (!presetId || !(presetId in MINDMAP_THEME_PRESETS)) {
    return MINDMAP_THEME_PRESETS[DEFAULT_MINDMAP_THEME_PRESET_ID];
  }

  return MINDMAP_THEME_PRESETS[presetId as MindMapThemePresetId];
}

export function buildMindMapThemeConfigFromPreset(
  presetId: MindMapThemePresetId,
  currentConfig?: MindMapThemeConfig,
): MindMapThemeConfig {
  const preset = getMindMapThemePreset(presetId).config;
  const preservedGrid = currentConfig?.docmostCanvasGrid;

  return mergeMindMapThemeConfig(preset, {
    docmostCanvasGrid:
      typeof preservedGrid === "boolean"
        ? preservedGrid
        : (preset.docmostCanvasGrid ?? DEFAULT_CANVAS_GRID),
  });
}

export function getDefaultMindMapThemeConfig(): MindMapThemeConfig {
  return buildMindMapThemeConfigFromPreset(DEFAULT_MINDMAP_THEME_PRESET_ID);
}

export function normalizeMindMapThemeConfig(
  config: unknown,
): MindMapThemeConfig {
  const nextConfig = asThemeConfig(config);
  const presetId =
    typeof nextConfig.docmostThemePresetId === "string"
      ? nextConfig.docmostThemePresetId
      : DEFAULT_MINDMAP_THEME_PRESET_ID;

  return mergeMindMapThemeConfig(
    buildMindMapThemeConfigFromPreset(presetId as MindMapThemePresetId),
    nextConfig,
  );
}

export function getMindMapThemePresetId(
  config: MindMapThemeConfig | undefined,
): MindMapThemePresetId {
  const presetId = config?.docmostThemePresetId;

  return presetId === "blueprint" ? "blueprint" : "professional";
}

export function getMindMapCanvasSettings(
  config: MindMapThemeConfig | undefined,
): MindMapCanvasSettings {
  return {
    showGrid: config?.docmostCanvasGrid ?? DEFAULT_CANVAS_GRID,
    lineStyle: config?.lineStyle ?? "straight",
    dashedLines: config?.lineDasharray !== "none" && !!config?.lineDasharray,
    lineWidth: config?.lineWidth ?? DEFAULT_LINE_WIDTH,
  };
}

export function applyCanvasSettingsToThemeConfig(
  config: MindMapThemeConfig,
  settings: MindMapCanvasSettings,
): MindMapThemeConfig {
  return mergeMindMapThemeConfig(config, {
    docmostCanvasGrid: settings.showGrid,
    lineStyle: settings.lineStyle,
    lineDasharray: settings.dashedLines ? "8,4" : "none",
    lineWidth: settings.lineWidth,
  });
}
