import { PageContentFormat } from "@/features/page/types/page.types.ts";

export const MINDMAP_PAGE_ICON = "🗺️";
export const DEFAULT_MINDMAP_TITLE = "未命名思维导图";
export const MINDMAP_CONTENT_FORMAT = PageContentFormat.JSON;

export type MindMapFullData = {
  layout: string;
  root: {
    data: Record<string, any> & {
      text: string;
      expand?: boolean;
    };
    children?: MindMapNode[];
  };
  theme: {
    template: string;
    config: Record<string, any>;
  };
  view:
    | {
        transform: Record<string, any>;
        state: Record<string, any>;
      }
    | null;
};

export type MindMapNode = {
  data: Record<string, any> & {
    text: string;
    expand?: boolean;
  };
  children?: MindMapNode[];
};

export type MindMapPageContent = {
  type: "mindmap";
  data: MindMapFullData;
};

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
];

export function createEmptyMindMapData(): MindMapFullData {
  return {
    layout: "logicalStructure",
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
      config: {},
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

function isValidMindMapRoot(root: any): root is MindMapFullData["root"] {
  return Boolean(
    root &&
      typeof root === "object" &&
      root.data &&
      typeof root.data === "object" &&
      typeof root.data.text === "string",
  );
}

function isValidMindMapView(
  view: any,
): view is NonNullable<MindMapFullData["view"]> {
  return Boolean(
    view &&
      typeof view === "object" &&
      view.transform &&
      typeof view.transform === "object" &&
      view.state &&
      typeof view.state === "object",
  );
}

function normalizeMindMapNode(
  node: any,
  fallbackText: string,
  forceExpand = false,
): MindMapNode {
  const sourceData =
    node?.data && typeof node.data === "object" ? node.data : ({} as any);
  const normalizedData: MindMapNode["data"] = {
    ...sourceData,
    text:
      typeof sourceData.text === "string" && sourceData.text.trim()
        ? sourceData.text
        : fallbackText,
  };

  if (forceExpand) {
    normalizedData.expand = true;
  } else if (typeof sourceData.expand !== "boolean") {
    normalizedData.expand = true;
  }

  return {
    data: normalizedData,
    children: Array.isArray(node?.children)
      ? node.children.map((child: any, index: number) =>
          normalizeMindMapNode(child, `${fallbackText}-${index + 1}`, false),
        )
      : [],
  };
}

export function isMindMapPageContent(
  content: any,
): content is MindMapPageContent {
  return Boolean(
    content?.type === "mindmap" && isValidMindMapRoot(content?.data?.root),
  );
}

export function getMindMapData(content: any): MindMapFullData {
  const fallback = createEmptyMindMapData();
  const data = isMindMapPageContent(content) ? content.data : content;

  if (!data || !isValidMindMapRoot(data.root)) {
    return fallback;
  }

  return {
    layout: typeof data.layout === "string" ? data.layout : fallback.layout,
    root: normalizeMindMapNode(data.root, fallback.root.data.text, true),
    theme: {
      template:
        typeof data.theme?.template === "string"
          ? data.theme.template
          : fallback.theme.template,
      config:
        data.theme?.config && typeof data.theme.config === "object"
          ? data.theme.config
          : fallback.theme.config,
    },
    view: isValidMindMapView(data.view) ? data.view : fallback.view,
  };
}

export function createMindMapContentFromData(data: any): MindMapPageContent {
  return {
    type: "mindmap",
    data: getMindMapData(data),
  };
}
