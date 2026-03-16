import { PageContentFormat } from "@/features/page/types/page.types.ts";
import {
  getDefaultMindMapThemeConfig,
  normalizeMindMapThemeConfig,
} from "@/features/mindmap/lib/mindmap-theme.ts";
import type {
  MindMapDocumentStats,
  MindMapFullData,
  MindMapLayoutValue,
  MindMapNode,
  MindMapNodeData,
  MindMapPageContent,
  MindMapThemeConfig,
  MindMapViewData,
} from "@/features/mindmap/types/mindmap.types.ts";

export const MINDMAP_PAGE_ICON = "🗺️";
export const DEFAULT_MINDMAP_TITLE = "未命名思维导图";
export const MINDMAP_CONTENT_FORMAT = PageContentFormat.JSON;

export const MINDMAP_LAYOUT_OPTIONS = [
  {
    value: "logicalStructure",
    label: "逻辑结构图",
  },
  {
    value: "logicalStructureLeft",
    label: "向左逻辑结构图",
  },
  {
    value: "mindMap",
    label: "思维导图",
  },
  {
    value: "organizationStructure",
    label: "组织结构图",
  },
  {
    value: "catalogOrganization",
    label: "目录组织图",
  },
  {
    value: "timeline",
    label: "时间轴",
  },
  {
    value: "timeline2",
    label: "时间轴 2",
  },
  {
    value: "verticalTimeline",
    label: "竖向时间轴",
  },
  {
    value: "verticalTimeline2",
    label: "竖向时间轴 2",
  },
  {
    value: "verticalTimeline3",
    label: "竖向时间轴 3",
  },
  {
    value: "fishbone",
    label: "鱼骨图",
  },
  {
    value: "fishbone2",
    label: "鱼骨图 2",
  },
  {
    value: "rightFishbone",
    label: "向右鱼骨图",
  },
  {
    value: "rightFishbone2",
    label: "向右鱼骨图 2",
  },
] as const satisfies ReadonlyArray<{
  value: MindMapLayoutValue;
  label: string;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isMindMapLayoutValue(value: unknown): value is MindMapLayoutValue {
  return MINDMAP_LAYOUT_OPTIONS.some((option) => option.value === value);
}

function isMindMapNodeData(value: unknown): value is MindMapNodeData {
  return isRecord(value) && isString(value.text);
}

function isValidMindMapRoot(root: unknown): root is MindMapNode {
  return Boolean(
    isRecord(root) &&
      isMindMapNodeData(root.data) &&
      (root.children === undefined || Array.isArray(root.children)),
  );
}

function isValidMindMapView(view: unknown): view is MindMapViewData {
  return Boolean(
    isRecord(view) &&
      isRecord(view.transform) &&
      isRecord(view.state) &&
      typeof view.state.scale === "number" &&
      typeof view.state.x === "number" &&
      typeof view.state.y === "number" &&
      typeof view.state.sx === "number" &&
      typeof view.state.sy === "number",
  );
}

function normalizeMindMapNode(
  node: unknown,
  fallbackText: string,
  forceExpand = false,
): MindMapNode {
  const source = isRecord(node) ? node : {};
  const sourceData = isMindMapNodeData(source.data)
    ? source.data
    : ({ text: fallbackText } as MindMapNodeData);
  const normalizedData: MindMapNodeData = {
    ...sourceData,
    text: sourceData.text.trim() ? sourceData.text : fallbackText,
  };

  if (forceExpand) {
    normalizedData.expand = true;
  } else if (typeof sourceData.expand !== "boolean") {
    normalizedData.expand = true;
  }

  return {
    data: normalizedData,
    children: Array.isArray(source.children)
      ? source.children.map((child, index) =>
          normalizeMindMapNode(child, `${fallbackText}-${index + 1}`),
        )
      : [],
  };
}

function normalizeThemeConfig(config: unknown): MindMapThemeConfig {
  return normalizeMindMapThemeConfig(config);
}

function countGeneralizationStats(
  generalization: unknown,
): MindMapDocumentStats {
  if (!generalization) {
    return {
      characterCount: 0,
      nodeCount: 0,
    };
  }

  const list = Array.isArray(generalization)
    ? generalization
    : [generalization];

  return list.reduce<MindMapDocumentStats>(
    (accumulator, item) => {
      if (isRecord(item) && isString(item.text)) {
        accumulator.nodeCount += 1;
        accumulator.characterCount += item.text.length;
      }

      return accumulator;
    },
    {
      characterCount: 0,
      nodeCount: 0,
    },
  );
}

function countNodeStats(node: unknown): MindMapDocumentStats {
  if (!isValidMindMapRoot(node)) {
    return {
      characterCount: 0,
      nodeCount: 0,
    };
  }

  const ownStats = countGeneralizationStats(node.data.generalization);
  const childrenStats = (node.children ?? []).reduce<MindMapDocumentStats>(
    (accumulator, child) => {
      const childStats = countNodeStats(child);

      return {
        characterCount: accumulator.characterCount + childStats.characterCount,
        nodeCount: accumulator.nodeCount + childStats.nodeCount,
      };
    },
    {
      characterCount: 0,
      nodeCount: 0,
    },
  );

  return {
    characterCount:
      node.data.text.length +
      ownStats.characterCount +
      childrenStats.characterCount,
    nodeCount: 1 + ownStats.nodeCount + childrenStats.nodeCount,
  };
}

export function createEmptyMindMapData(): MindMapFullData {
  return {
    layout: "mindMap",
    root: {
      data: {
        text: "中心主题",
        expand: true,
      },
      children: [
        {
          data: {
            text: "分支一",
            expand: true,
          },
          children: [],
        },
        {
          data: {
            text: "分支二",
            expand: true,
          },
          children: [],
        },
      ],
    },
    theme: {
      template: "default",
      config: getDefaultMindMapThemeConfig(),
    },
    view: null,
  };
}

export function createEmptyMindMapContent(): MindMapPageContent {
  return {
    type: "mindmap",
    data: createEmptyMindMapData(),
  };
}

export function isMindMapPageContent(
  content: unknown,
): content is MindMapPageContent {
  return Boolean(
    isRecord(content) &&
      content.type === "mindmap" &&
      isRecord(content.data) &&
      isValidMindMapRoot(content.data.root),
  );
}

export function getMindMapData(content: unknown): MindMapFullData {
  const fallback = createEmptyMindMapData();
  const data =
    isMindMapPageContent(content) && isRecord(content.data)
      ? content.data
      : content;
  const themeSource =
    isRecord(data) && isRecord(data.theme) ? data.theme : undefined;

  if (!isRecord(data) || !isValidMindMapRoot(data.root)) {
    return fallback;
  }

  return {
    layout: isMindMapLayoutValue(data.layout) ? data.layout : fallback.layout,
    root: normalizeMindMapNode(data.root, fallback.root.data.text, true),
    theme: {
      template: isString(themeSource?.template)
        ? themeSource.template
        : fallback.theme.template,
      config: normalizeThemeConfig(themeSource?.config),
    },
    view: isValidMindMapView(data.view) ? data.view : fallback.view,
  };
}

export function createMindMapContentFromData(
  data: unknown,
): MindMapPageContent {
  return {
    type: "mindmap",
    data: getMindMapData(data),
  };
}

export function countMindMapDocumentStats(root: unknown): MindMapDocumentStats {
  return countNodeStats(root);
}
