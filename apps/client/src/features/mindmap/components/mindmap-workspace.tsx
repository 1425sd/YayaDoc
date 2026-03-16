import { useDebouncedCallback } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getSpaceUrl } from "@/lib/config.ts";
import {
  buildMindMapImagePayloadFromBlob,
  DEFAULT_NODE_IMAGE_HEIGHT,
  DEFAULT_NODE_IMAGE_WIDTH,
  getAutoDetectedNodeHyperlink,
  getClipboardImageFile,
  normalizeHyperlink,
} from "@/features/mindmap/lib/mindmap-node-assets.ts";
import {
  updatePageData,
  useUpdatePageMutation,
  useUpdateTitlePageMutation,
} from "@/features/page/queries/page-query.ts";
import { IPage } from "@/features/page/types/page.types.ts";
import {
  countMindMapDocumentStats,
  createMindMapContentFromData,
  getMindMapData,
  MINDMAP_CONTENT_FORMAT,
  MINDMAP_LAYOUT_OPTIONS,
} from "@/features/mindmap/lib/mindmap-content.ts";
import {
  applyCanvasSettingsToThemeConfig,
  buildMindMapThemeConfigFromPreset,
  getMindMapCanvasSettings,
  getMindMapThemePresetId,
  getMindMapThemePresets,
  normalizeMindMapThemeConfig,
} from "@/features/mindmap/lib/mindmap-theme.ts";
import type {
  MindMapCanvasSettings,
  MindMapDocumentStats,
  MindMapEditableNodeStyle,
  MindMapFontWeight,
  MindMapHyperlinkPayload,
  MindMapInspectorNode,
  MindMapLayoutValue,
  MindMapMetadataDialogKind,
  MindMapNodeData,
  MindMapNodeImagePayload,
  MindMapThemeConfig,
  SimpleMindMapApi,
  SimpleMindMapNode,
} from "@/features/mindmap/types/mindmap.types.ts";
import { MindmapBottomBar } from "./mindmap-bottom-bar.tsx";
import { MindmapCanvas } from "./mindmap-canvas.tsx";
import { MindmapNodeMetadataDialog } from "./mindmap-node-metadata-dialog.tsx";
import { MindmapRightPanel } from "./mindmap-right-panel.tsx";
import { MindmapTopToolbar } from "./mindmap-top-toolbar.tsx";
import classes from "./mindmap-workspace.module.css";

type MindMapStatic = {
  new (options: Record<string, unknown>): SimpleMindMapApi;
  hasPlugin(plugin: unknown): number;
  usePlugin(plugin: unknown): void;
};

type MindMapWorkspaceProps = {
  page: IPage;
  editable: boolean;
};

type SaveState = "saved" | "saving" | "dirty";

const MINDMAP_CONTAINER_WAIT_TIMEOUT = 4000;
const TEXT_EDIT_CLASS_NAMES = [
  "smm-node-edit-wrap",
  "smm-richtext-node-edit-wrap",
] as const;
const THEME_PRESETS = getMindMapThemePresets();

let isMindMapPluginsRegistered = false;

const COMMANDS_REQUIRING_ACTIVE_NODE = new Set([
  "INSERT_CHILD_NODE",
  "INSERT_NODE",
  "REMOVE_NODE",
  "ADD_GENERALIZATION",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function registerMindMapPlugin(MindMap: MindMapStatic, plugin: unknown) {
  if (MindMap.hasPlugin(plugin) === -1) {
    MindMap["usePlugin"](plugin);
  }
}

function createAbortError() {
  const error = new Error("Mind map initialization cancelled");
  error.name = "AbortError";
  return error;
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

function isSimpleMindMapNode(value: unknown): value is SimpleMindMapNode {
  return (
    isRecord(value) &&
    typeof value.getData === "function" &&
    typeof value.getStyle === "function"
  );
}

function isValidHyperlink(value: string) {
  if (!value) {
    return false;
  }

  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function getSafeHyperlink(value: string) {
  const normalized = normalizeHyperlink(value);
  return isValidHyperlink(normalized) ? normalized : "";
}

function hasModifierKey(event: unknown) {
  return Boolean(
    isRecord(event) &&
      (("ctrlKey" in event && Boolean(event.ctrlKey)) ||
        ("metaKey" in event && Boolean(event.metaKey))),
  );
}

function getEventTargetElement(event: unknown) {
  if (!isRecord(event) || !("target" in event)) {
    return null;
  }

  const { target } = event;
  return target instanceof Element ? target : null;
}

function stopDomEvent(event: unknown) {
  if (!isRecord(event)) {
    return;
  }

  if ("preventDefault" in event && typeof event.preventDefault === "function") {
    event.preventDefault();
  }

  if (
    "stopPropagation" in event &&
    typeof event.stopPropagation === "function"
  ) {
    event.stopPropagation();
  }
}

function isHyperlinkIconTarget(event: unknown) {
  const target = getEventTargetElement(event);
  return Boolean(target?.closest("a"));
}

function isMindMapTextEditTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) {
    return false;
  }

  return TEXT_EDIT_CLASS_NAMES.some(
    (className) =>
      target.classList.contains(className) ||
      Boolean(target.closest(`.${className}`)),
  );
}

function getContainerSize(container: HTMLDivElement) {
  const rect = container.getBoundingClientRect();

  return {
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function hasReadyContainerSize(container: HTMLDivElement) {
  const { width, height } = getContainerSize(container);
  return width > 0 && height > 0;
}

function getLoadErrorMessage(error: unknown) {
  if (
    error instanceof Error &&
    (error.message.includes("容器元素el的宽高不能为0") ||
      error.message.includes("容器尺寸不可用"))
  ) {
    return "思维导图区域还没准备完成，请重试一次";
  }

  return "思维导图编辑器加载失败";
}

function waitForContainerReady(
  container: HTMLDivElement,
  isCancelled: () => boolean,
) {
  if (hasReadyContainerSize(container)) {
    return Promise.resolve();
  }

  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    let frameId = 0;
    let timeoutId = 0;
    let resizeObserver: ResizeObserver | null = null;

    const cleanup = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      resizeObserver?.disconnect();
    };

    const check = () => {
      if (isCancelled()) {
        cleanup();
        reject(createAbortError());
        return;
      }

      if (hasReadyContainerSize(container)) {
        cleanup();
        resolve();
        return;
      }

      frameId = window.requestAnimationFrame(check);
    };

    timeoutId = window.setTimeout(() => {
      const { width, height } = getContainerSize(container);
      cleanup();
      reject(new Error(`容器尺寸不可用 (${width}x${height})`));
    }, MINDMAP_CONTAINER_WAIT_TIMEOUT);

    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(check);
      resizeObserver.observe(container);
    }

    check();
  });
}

async function loadMindMapConstructor() {
  const [
    { default: MindMap },
    { default: DragPlugin },
    { default: SelectPlugin },
    { default: KeyboardNavigationPlugin },
    { default: TouchEventPlugin },
  ] = await Promise.all([
    import("simple-mind-map"),
    import("simple-mind-map/src/plugins/Drag.js"),
    import("simple-mind-map/src/plugins/Select.js"),
    import("simple-mind-map/src/plugins/KeyboardNavigation.js"),
    import("simple-mind-map/src/plugins/TouchEvent.js"),
  ]);

  const constructor = MindMap as unknown as MindMapStatic;

  if (!isMindMapPluginsRegistered) {
    registerMindMapPlugin(constructor, DragPlugin);
    registerMindMapPlugin(constructor, SelectPlugin);
    registerMindMapPlugin(constructor, KeyboardNavigationPlugin);
    registerMindMapPlugin(constructor, TouchEventPlugin);
    isMindMapPluginsRegistered = true;
  }

  return constructor;
}

function getSaveStatusLabel(saveState: SaveState, lastSavedAt: Date | null) {
  if (saveState === "saving") {
    return "正在保存思维导图...";
  }

  if (saveState === "dirty") {
    return "有未保存的更改";
  }

  if (!lastSavedAt) {
    return "已保存";
  }

  return `已保存于 ${lastSavedAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function createFingerprint(data: unknown) {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error(error);
    return "";
  }
}

function normalizeFontWeight(value: unknown): MindMapFontWeight {
  if (typeof value === "number") {
    return value >= 600 ? "bold" : "normal";
  }

  if (typeof value === "string") {
    const normalizedValue = value.toLowerCase();
    if (normalizedValue === "bold") {
      return "bold";
    }

    const parsed = Number(normalizedValue);
    if (Number.isFinite(parsed)) {
      return parsed >= 600 ? "bold" : "normal";
    }
  }

  return "normal";
}

function toNumberValue(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

function toTextValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeTags(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item === "string") {
        return item;
      }

      if (isRecord(item) && typeof item.text === "string") {
        return item.text;
      }

      return "";
    })
    .filter(Boolean);
}

function getGeneralizationList(value: unknown) {
  const list = Array.isArray(value) ? value : value ? [value] : [];

  return list.filter(
    (item): item is Record<string, unknown> =>
      isRecord(item) && typeof item.text === "string",
  );
}

function getNodeKind(node: SimpleMindMapNode): MindMapInspectorNode["kind"] {
  if (node.isGeneralization) {
    return "summary";
  }

  if (node.isRoot) {
    return "root";
  }

  if (node.layerIndex === 1) {
    return "second";
  }

  return "branch";
}

function createInspectorNodeSnapshot(
  node: SimpleMindMapNode,
): MindMapInspectorNode {
  const data = node.getData() as MindMapNodeData;
  const generalizationList = getGeneralizationList(data.generalization);
  const imageSizeSource = node.getData("imageSize");
  const imageSize =
    isRecord(imageSizeSource) &&
    typeof imageSizeSource.width === "number" &&
    typeof imageSizeSource.height === "number"
      ? {
          width: imageSizeSource.width,
          height: imageSizeSource.height,
          custom:
            typeof imageSizeSource.custom === "boolean"
              ? imageSizeSource.custom
              : undefined,
        }
      : {
          width: DEFAULT_NODE_IMAGE_WIDTH,
          height: DEFAULT_NODE_IMAGE_HEIGHT,
        };

  const customStyle: Partial<MindMapEditableNodeStyle> = {};
  const fillColor = node.getSelfStyle("fillColor");
  const color = node.getSelfStyle("color");
  const borderColor = node.getSelfStyle("borderColor");
  const borderWidth = node.getSelfStyle("borderWidth");
  const borderRadius = node.getSelfStyle("borderRadius");
  const fontSize = node.getSelfStyle("fontSize");
  const fontWeight = node.getSelfStyle("fontWeight");

  if (typeof fillColor === "string") {
    customStyle.fillColor = fillColor;
  }
  if (typeof color === "string") {
    customStyle.color = color;
  }
  if (typeof borderColor === "string") {
    customStyle.borderColor = borderColor;
  }
  if (borderWidth !== undefined) {
    customStyle.borderWidth = toNumberValue(borderWidth, 0);
  }
  if (borderRadius !== undefined) {
    customStyle.borderRadius = toNumberValue(borderRadius, 0);
  }
  if (fontSize !== undefined) {
    customStyle.fontSize = toNumberValue(fontSize, 14);
  }
  if (fontWeight !== undefined) {
    customStyle.fontWeight = normalizeFontWeight(fontWeight);
  }

  return {
    uid: toTextValue(data.uid),
    text: toTextValue(data.text),
    isRoot: node.isRoot,
    isGeneralization: node.isGeneralization,
    layerIndex: node.layerIndex,
    kind: getNodeKind(node),
    style: {
      fillColor: toTextValue(node.getStyle("fillColor")),
      color: toTextValue(node.getStyle("color")),
      borderColor: toTextValue(node.getStyle("borderColor")),
      borderWidth: toNumberValue(node.getStyle("borderWidth"), 0),
      borderRadius: toNumberValue(node.getStyle("borderRadius"), 0),
      fontSize: toNumberValue(node.getStyle("fontSize"), 14),
      fontWeight: normalizeFontWeight(node.getStyle("fontWeight")),
    },
    customStyle,
    metadata: {
      image: toTextValue(node.getData("image")),
      imageTitle: toTextValue(node.getData("imageTitle")),
      imageSize,
      hyperlink: toTextValue(node.getData("hyperlink")),
      hyperlinkTitle: toTextValue(node.getData("hyperlinkTitle")),
      note: toTextValue(node.getData("note")),
      tags: normalizeTags(node.getData("tag")),
      hasGeneralization: generalizationList.length > 0,
      summaryText: node.isGeneralization
        ? toTextValue(data.text)
        : toTextValue(generalizationList[0]?.text),
      summaryCount: generalizationList.length,
    },
  };
}

function getZoomPercent(mindMap: SimpleMindMapApi | null) {
  if (!mindMap) {
    return 100;
  }

  return Math.max(
    10,
    Math.round(mindMap.view.getTransformData().state.scale * 100),
  );
}

export function MindMapWorkspace({ page, editable }: MindMapWorkspaceProps) {
  const { t } = useTranslation();
  const initialMindMapData = getMindMapData(page.content);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mindMapRef = useRef<SimpleMindMapApi | null>(null);
  const pageRef = useRef(page);
  const isSavingRef = useRef(false);
  const isDirtyRef = useRef(false);
  const isHydratingRef = useRef(true);
  const lastSavedFingerprintRef = useRef("");
  const markDirtyRef = useRef<() => void>(() => undefined);
  const [title, setTitle] = useState(page.title || "");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    page.updatedAt ? new Date(page.updatedAt) : null,
  );
  const [layout, setLayout] = useState<MindMapLayoutValue>(
    initialMindMapData.layout,
  );
  const [activeNodeCount, setActiveNodeCount] = useState(0);
  const [selectedNode, setSelectedNode] = useState<MindMapInspectorNode | null>(
    null,
  );
  const [zoomPercent, setZoomPercent] = useState(
    Math.round((initialMindMapData.view?.state.scale ?? 1) * 100),
  );
  const [themeConfig, setThemeConfig] = useState<MindMapThemeConfig>(
    initialMindMapData.theme.config,
  );
  const [documentStats, setDocumentStats] = useState<MindMapDocumentStats>(
    countMindMapDocumentStats(initialMindMapData.root),
  );
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);
  const [metadataDialogKind, setMetadataDialogKind] =
    useState<MindMapMetadataDialogKind | null>(null);
  const updatePageMutation = useUpdatePageMutation();
  const updateTitleMutation = useUpdateTitlePageMutation();

  const syncSelectionSnapshot = useCallback(
    (mindMap?: SimpleMindMapApi | null) => {
      const target = mindMap ?? mindMapRef.current;
      const activeNodeList = target?.renderer.activeNodeList ?? [];
      setActiveNodeCount(activeNodeList.length);
      setSelectedNode(
        activeNodeList.length > 0
          ? createInspectorNodeSnapshot(activeNodeList[0])
          : null,
      );
    },
    [],
  );

  const syncThemeConfigState = useCallback(
    (mindMap?: SimpleMindMapApi | null) => {
      const target = mindMap ?? mindMapRef.current;
      if (!target) {
        return;
      }

      setThemeConfig(
        normalizeMindMapThemeConfig(target.getCustomThemeConfig()),
      );
    },
    [],
  );

  const syncZoomState = useCallback((mindMap?: SimpleMindMapApi | null) => {
    setZoomPercent(getZoomPercent(mindMap ?? mindMapRef.current));
  }, []);

  const syncDocumentState = useCallback((mindMap?: SimpleMindMapApi | null) => {
    const target = mindMap ?? mindMapRef.current;
    if (!target) {
      return;
    }

    setDocumentStats(countMindMapDocumentStats(target.getData()));
  }, []);

  const fitCanvas = useCallback(() => {
    const mindMap = mindMapRef.current;
    if (!mindMap) {
      return;
    }

    mindMap.resize();
    mindMap.view.fit();
    syncZoomState(mindMap);
  }, [syncZoomState]);

  const centerCanvas = useCallback(() => {
    const mindMap = mindMapRef.current;
    if (!mindMap) {
      return;
    }

    mindMap.renderer.setRootNodeCenter();
    syncZoomState(mindMap);
  }, [syncZoomState]);

  useEffect(() => {
    pageRef.current = page;
    const mindMapData = getMindMapData(page.content);

    setTitle(page.title || "");
    setLastSavedAt(page.updatedAt ? new Date(page.updatedAt) : null);
    setLayout(mindMapData.layout);
    setThemeConfig(mindMapData.theme.config);
    setDocumentStats(countMindMapDocumentStats(mindMapData.root));
    setZoomPercent(Math.round((mindMapData.view?.state.scale ?? 1) * 100));
    setSelectedNode(null);
    setActiveNodeCount(0);
    setMetadataDialogKind(null);
  }, [page]);

  const persistMindMap = useCallback(async () => {
    const mindMap = mindMapRef.current;
    const currentPage = pageRef.current;

    if (!mindMap || !editable || isSavingRef.current) {
      return;
    }

    const currentData = mindMap.getData(true);
    const currentFingerprint = createFingerprint(currentData);

    if (
      !currentFingerprint ||
      currentFingerprint === lastSavedFingerprintRef.current
    ) {
      isDirtyRef.current = false;
      setSaveState("saved");
      return;
    }

    isSavingRef.current = true;
    setSaveState("saving");

    try {
      const updatedPage = await updatePageMutation.mutateAsync({
        pageId: currentPage.id,
        content: createMindMapContentFromData(currentData),
        format: MINDMAP_CONTENT_FORMAT,
        contentType: "mindmap",
      } as never);

      pageRef.current = updatedPage;
      updatePageData(updatedPage);
      lastSavedFingerprintRef.current = currentFingerprint;

      const latestFingerprint = createFingerprint(mindMap.getData(true));
      if (latestFingerprint !== currentFingerprint) {
        isDirtyRef.current = true;
        setSaveState("dirty");
        return;
      }

      isDirtyRef.current = false;
      setSaveState("saved");
      setLastSavedAt(new Date(updatedPage.updatedAt || Date.now()));
    } finally {
      isSavingRef.current = false;
    }
  }, [editable, updatePageMutation]);

  const debouncedPersist = useDebouncedCallback(
    () => {
      if (!isDirtyRef.current) {
        return;
      }

      persistMindMap().catch((error) => console.error(error));
    },
    {
      delay: 1200,
      flushOnUnmount: true,
    },
  );

  const persistTitle = useDebouncedCallback(
    async (nextTitle: string) => {
      const currentPage = pageRef.current;
      const trimmedTitle = nextTitle.trim();

      if (!editable || !trimmedTitle || trimmedTitle === currentPage.title) {
        return;
      }

      try {
        const updatedPage = await updateTitleMutation.mutateAsync({
          pageId: currentPage.id,
          title: trimmedTitle,
        } as never);
        pageRef.current = updatedPage;
        updatePageData(updatedPage);
      } catch (error) {
        console.error(error);
      }
    },
    {
      delay: 500,
      flushOnUnmount: true,
    },
  );

  useEffect(() => {
    const mindMapData = getMindMapData(page.content);
    const container = containerRef.current;
    let cancelled = false;
    let currentMindMap: SimpleMindMapApi | null = null;
    let cleanupSelectionState: (() => void) | null = null;
    let cleanupDataChange: (() => void) | null = null;
    let cleanupViewChange: (() => void) | null = null;
    let cleanupLayoutChange: ((nextLayout: unknown) => void) | null = null;
    let cleanupNodeClick: ((node: unknown, event: unknown) => void) | null =
      null;
    let cleanupBeforeTextEdit: (() => void) | null = null;
    let cleanupHideTextEdit:
      | ((textEditNode: unknown, activeNodes: unknown, node: unknown) => void)
      | null = null;
    let cleanupTextEditPasteListener: (() => void) | null = null;
    let cleanupPasteFallbackTimer: (() => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    if (!container) {
      return;
    }

    isHydratingRef.current = true;
    isDirtyRef.current = false;
    markDirtyRef.current = () => undefined;
    setIsReady(false);
    setLoadError(null);
    setActiveNodeCount(0);
    setSelectedNode(null);
    setMetadataDialogKind(null);

    container.innerHTML = "";

    async function setupMindMap() {
      try {
        await waitForContainerReady(container, () => cancelled);
        const MindMap = await loadMindMapConstructor();
        const initialViewData =
          mindMapData.view?.state && mindMapData.view?.transform
            ? mindMapData.view
            : null;

        if (cancelled) {
          return;
        }

        let pasteFallbackTimer = 0;
        let isTextEditPasteBound = false;

        const clearPasteFallbackTimer = () => {
          if (pasteFallbackTimer) {
            window.clearTimeout(pasteFallbackTimer);
            pasteFallbackTimer = 0;
          }
        };

        const mindMap = new MindMap({
          el: container,
          data: mindMapData.root,
          layout: mindMapData.layout,
          theme: mindMapData.theme.template,
          themeConfig: mindMapData.theme.config,
          viewData: initialViewData,
          readonly: !editable,
          mousewheelAction: "zoom",
          fit: !initialViewData,
          handleNodePasteImg: async (blob: Blob) => {
            clearPasteFallbackTimer();
            const payload = await buildMindMapImagePayloadFromBlob(blob);
            return {
              url: payload.url,
              size: {
                width: payload.width,
                height: payload.height,
              },
            };
          },
        });

        if (cancelled) {
          mindMap.destroy();
          return;
        }

        currentMindMap = mindMap;
        mindMapRef.current = mindMap;
        mindMap.keyCommand?.addShortcut("Control+Shift+z", () => {
          mindMap.execCommand("FORWARD");
        });

        const markDirty = () => {
          if (isHydratingRef.current) {
            return;
          }

          const nextFingerprint = createFingerprint(mindMap.getData(true));
          if (
            !nextFingerprint ||
            nextFingerprint === lastSavedFingerprintRef.current
          ) {
            isDirtyRef.current = false;
            setSaveState("saved");
            return;
          }

          isDirtyRef.current = true;
          setSaveState("dirty");
          setLayout(mindMap.getLayout());
          debouncedPersist();
        };

        const handleSelectionChange = () => {
          syncSelectionSnapshot(mindMap);
        };

        const getActiveNodesForAssetUpdate = () => {
          let activeNodeList = mindMap.renderer.activeNodeList ?? [];
          if (
            activeNodeList.length === 0 &&
            mindMap.renderer.root &&
            editable
          ) {
            try {
              mindMap.execCommand(
                "SET_NODE_ACTIVE",
                mindMap.renderer.root,
                true,
              );
            } catch (error) {
              console.error(
                "Failed to focus root node for asset update",
                error,
              );
            }
            activeNodeList = mindMap.renderer.activeNodeList ?? [];
          }
          return activeNodeList;
        };

        const applyImagePayloadToSelection = (
          payload: MindMapNodeImagePayload,
        ) => {
          const activeNodeList = getActiveNodesForAssetUpdate();
          if (activeNodeList.length === 0) {
            return;
          }

          activeNodeList.forEach((node) => {
            mindMap.execCommand("SET_NODE_IMAGE", node, payload);
          });

          syncSelectionSnapshot(mindMap);
          syncDocumentState(mindMap);
        };

        const handleEditorPaste = (event: ClipboardEvent) => {
          if (!editable || !isMindMapTextEditTarget(event.target)) {
            return;
          }

          const clipboardImage = getClipboardImageFile(event.clipboardData);
          if (!clipboardImage) {
            return;
          }

          clearPasteFallbackTimer();
          pasteFallbackTimer = window.setTimeout(() => {
            if (cancelled) {
              return;
            }

            buildMindMapImagePayloadFromBlob(clipboardImage)
              .then((payload) => {
                applyImagePayloadToSelection(payload);
              })
              .catch((error) => {
                console.error("Failed to paste clipboard image", error);
              })
              .finally(() => {
                pasteFallbackTimer = 0;
              });
          }, 180);
        };

        const bindTextEditPasteFallback = () => {
          if (isTextEditPasteBound) {
            return;
          }

          document.addEventListener("paste", handleEditorPaste, true);
          isTextEditPasteBound = true;
        };

        const unbindTextEditPasteFallback = () => {
          if (!isTextEditPasteBound) {
            return;
          }

          document.removeEventListener("paste", handleEditorPaste, true);
          isTextEditPasteBound = false;
        };

        const handleDataChange = () => {
          markDirty();
          syncSelectionSnapshot(mindMap);
          syncDocumentState(mindMap);
        };

        const handleViewChange = () => {
          markDirty();
          syncZoomState(mindMap);
        };

        const handleLayoutChange = (nextLayout: unknown) => {
          setLayout(
            typeof nextLayout === "string"
              ? (nextLayout as MindMapLayoutValue)
              : mindMap.getLayout(),
          );
          markDirty();
        };

        const handleNodeClick = (node: unknown, event: unknown) => {
          if (
            !isSimpleMindMapNode(node) ||
            !hasModifierKey(event) ||
            isHyperlinkIconTarget(event)
          ) {
            return;
          }

          const hyperlink = getSafeHyperlink(
            toTextValue(node.getData("hyperlink")),
          );
          if (!hyperlink) {
            return;
          }

          stopDomEvent(event);
          window.open(hyperlink, "_blank", "noopener,noreferrer");
        };

        const handleHideTextEdit = (
          _textEditNode: unknown,
          _activeNodes: unknown,
          currentNode: unknown,
        ) => {
          unbindTextEditPasteFallback();
          clearPasteFallbackTimer();

          if (!isSimpleMindMapNode(currentNode)) {
            return;
          }

          const currentHyperlink = toTextValue(
            currentNode.getData("hyperlink"),
          );
          const normalizedHyperlink = getSafeHyperlink(currentHyperlink);

          if (normalizedHyperlink && normalizedHyperlink !== currentHyperlink) {
            mindMap.execCommand(
              "SET_NODE_HYPERLINK",
              currentNode,
              normalizedHyperlink,
              toTextValue(currentNode.getData("hyperlinkTitle")),
            );
            return;
          }

          if (currentHyperlink.trim()) {
            return;
          }

          const detectedHyperlink = getAutoDetectedNodeHyperlink(
            toTextValue(currentNode.getData("text")),
          );
          if (!detectedHyperlink) {
            return;
          }

          mindMap.execCommand(
            "SET_NODE_HYPERLINK",
            currentNode,
            detectedHyperlink,
            toTextValue(currentNode.getData("hyperlinkTitle")),
          );
        };

        cleanupSelectionState = handleSelectionChange;
        cleanupDataChange = handleDataChange;
        cleanupViewChange = handleViewChange;
        cleanupLayoutChange = handleLayoutChange;
        cleanupNodeClick = handleNodeClick;
        cleanupBeforeTextEdit = bindTextEditPasteFallback;
        cleanupHideTextEdit = handleHideTextEdit;
        cleanupTextEditPasteListener = unbindTextEditPasteFallback;
        cleanupPasteFallbackTimer = clearPasteFallbackTimer;
        markDirtyRef.current = markDirty;

        mindMap.on("data_change", handleDataChange);
        mindMap.on("view_data_change", handleViewChange);
        mindMap.on("layout_change", handleLayoutChange);
        mindMap.on("node_active", handleSelectionChange);
        mindMap.on("node_click", handleNodeClick);
        mindMap.on("before_show_text_edit", bindTextEditPasteFallback);
        mindMap.on("hide_text_edit", handleHideTextEdit);

        lastSavedFingerprintRef.current = createFingerprint(
          mindMap.getData(true),
        );

        resizeObserver =
          typeof ResizeObserver === "undefined"
            ? null
            : new ResizeObserver(() => {
                mindMap.resize();
              });

        resizeObserver?.observe(container);

        requestAnimationFrame(() => {
          if (cancelled) {
            return;
          }

          mindMap.resize();

          if (editable && mindMap.renderer.root) {
            try {
              mindMap.execCommand(
                "SET_NODE_ACTIVE",
                mindMap.renderer.root,
                true,
              );
            } catch (error) {
              console.error("Failed to focus root node", error);
            }
          }

          setLayout(mindMap.getLayout());
          syncSelectionSnapshot(mindMap);
          syncDocumentState(mindMap);
          syncZoomState(mindMap);
          syncThemeConfigState(mindMap);
          setSaveState("saved");
          setIsReady(true);

          queueMicrotask(() => {
            isHydratingRef.current = false;
          });
        });
      } catch (error) {
        if (isAbortError(error)) {
          return;
        }

        console.error("Failed to load mind map workspace", {
          error,
          pageId: page.id,
          containerSize: getContainerSize(container),
        });

        if (!cancelled) {
          setLoadError(getLoadErrorMessage(error));
          setIsReady(false);
        }
      }
    }

    setupMindMap();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      debouncedPersist.flush();
      persistTitle.flush();
      currentMindMap?.off("data_change", cleanupDataChange ?? undefined);
      currentMindMap?.off("view_data_change", cleanupViewChange ?? undefined);
      currentMindMap?.off("layout_change", cleanupLayoutChange ?? undefined);
      currentMindMap?.off("node_active", cleanupSelectionState ?? undefined);
      currentMindMap?.off("node_click", cleanupNodeClick ?? undefined);
      currentMindMap?.off(
        "before_show_text_edit",
        cleanupBeforeTextEdit ?? undefined,
      );
      currentMindMap?.off("hide_text_edit", cleanupHideTextEdit ?? undefined);
      cleanupTextEditPasteListener?.();
      cleanupPasteFallbackTimer?.();
      currentMindMap?.destroy();
      markDirtyRef.current = () => undefined;
      if (mindMapRef.current === currentMindMap) {
        mindMapRef.current = null;
      }
    };
  }, [
    debouncedPersist,
    editable,
    loadVersion,
    page.content,
    page.id,
    persistTitle,
    syncDocumentState,
    syncSelectionSnapshot,
    syncThemeConfigState,
    syncZoomState,
  ]);

  useEffect(() => {
    const mindMap = mindMapRef.current;
    if (!mindMap) {
      return;
    }

    mindMap.setMode(editable ? "edit" : "readonly");
  }, [editable]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!isDirtyRef.current) {
        return;
      }

      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  useEffect(() => {
    if (!selectedNode && metadataDialogKind) {
      setMetadataDialogKind(null);
    }
  }, [metadataDialogKind, selectedNode]);

  const layoutOptions = useMemo(
    () =>
      MINDMAP_LAYOUT_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.label),
      })),
    [t],
  );

  const ensureActiveNodes = useCallback((focusRootIfEmpty = false) => {
    const mindMap = mindMapRef.current;
    if (!mindMap) {
      return [] as SimpleMindMapNode[];
    }

    let activeNodeList = mindMap.renderer.activeNodeList ?? [];
    if (
      focusRootIfEmpty &&
      activeNodeList.length === 0 &&
      mindMap.renderer.root
    ) {
      try {
        mindMap.execCommand("SET_NODE_ACTIVE", mindMap.renderer.root, true);
      } catch (error) {
        console.error(
          "Failed to focus root node before running command",
          error,
        );
      }

      activeNodeList = mindMap.renderer.activeNodeList ?? [];
    }

    return activeNodeList;
  }, []);

  const runCommand = useCallback(
    (command: string, ...args: unknown[]) => {
      if (!editable) {
        return;
      }

      const mindMap = mindMapRef.current;
      if (!mindMap) {
        return;
      }

      if (COMMANDS_REQUIRING_ACTIVE_NODE.has(command)) {
        ensureActiveNodes(true);
      }

      mindMap.execCommand(command, ...args);
      syncSelectionSnapshot(mindMap);
      syncDocumentState(mindMap);
      syncZoomState(mindMap);
    },
    [
      editable,
      ensureActiveNodes,
      syncDocumentState,
      syncSelectionSnapshot,
      syncZoomState,
    ],
  );

  const applyNodeStyleChange = useCallback(
    (patch: Partial<MindMapEditableNodeStyle>) => {
      if (!editable) {
        return;
      }

      const mindMap = mindMapRef.current;
      if (!mindMap) {
        return;
      }

      const activeNodeList = ensureActiveNodes();
      if (activeNodeList.length === 0) {
        return;
      }

      activeNodeList.forEach((node) => {
        mindMap.execCommand("SET_NODE_STYLES", node, patch);
      });

      syncSelectionSnapshot(mindMap);
      syncDocumentState(mindMap);
    },
    [editable, ensureActiveNodes, syncDocumentState, syncSelectionSnapshot],
  );

  const resetNodeStyles = useCallback(() => {
    if (!editable) {
      return;
    }

    const mindMap = mindMapRef.current;
    if (!mindMap) {
      return;
    }

    const activeNodeList = ensureActiveNodes();
    activeNodeList.forEach((node) => {
      mindMap.execCommand("REMOVE_CUSTOM_STYLES", node);
    });

    syncSelectionSnapshot(mindMap);
    syncDocumentState(mindMap);
  }, [editable, ensureActiveNodes, syncDocumentState, syncSelectionSnapshot]);

  const updateThemeConfig = useCallback(
    (nextConfig: MindMapThemeConfig) => {
      if (!editable) {
        return;
      }

      const mindMap = mindMapRef.current;
      if (!mindMap) {
        return;
      }

      mindMap.setThemeConfig(nextConfig);
      syncThemeConfigState(mindMap);
      syncSelectionSnapshot(mindMap);
      markDirtyRef.current();
    },
    [editable, syncSelectionSnapshot, syncThemeConfigState],
  );

  const handleSelectThemePreset = useCallback(
    (presetId: (typeof THEME_PRESETS)[number]["id"]) => {
      updateThemeConfig(
        buildMindMapThemeConfigFromPreset(presetId, themeConfig),
      );
    },
    [themeConfig, updateThemeConfig],
  );

  const handleCanvasSettingsChange = useCallback(
    (patch: Partial<MindMapCanvasSettings>) => {
      const currentSettings = getMindMapCanvasSettings(themeConfig);
      updateThemeConfig(
        applyCanvasSettingsToThemeConfig(themeConfig, {
          ...currentSettings,
          ...patch,
        }),
      );
    },
    [themeConfig, updateThemeConfig],
  );

  const handleLayoutChange = useCallback(
    (nextLayout: MindMapLayoutValue) => {
      if (!editable) {
        return;
      }

      const mindMap = mindMapRef.current;
      if (!mindMap) {
        return;
      }

      mindMap.setLayout(nextLayout);
      setLayout(nextLayout);
      syncSelectionSnapshot(mindMap);
      syncDocumentState(mindMap);
    },
    [editable, syncDocumentState, syncSelectionSnapshot],
  );

  const handleZoomIn = useCallback(() => {
    const mindMap = mindMapRef.current;
    if (!mindMap) {
      return;
    }

    mindMap.view.enlarge();
    syncZoomState(mindMap);
  }, [syncZoomState]);

  const handleZoomOut = useCallback(() => {
    const mindMap = mindMapRef.current;
    if (!mindMap) {
      return;
    }

    mindMap.view.narrow();
    syncZoomState(mindMap);
  }, [syncZoomState]);

  const applyToActiveNodes = useCallback(
    (updater: (mindMap: SimpleMindMapApi, node: SimpleMindMapNode) => void) => {
      const mindMap = mindMapRef.current;
      if (!mindMap || !editable) {
        return;
      }

      const activeNodeList = ensureActiveNodes();
      if (activeNodeList.length === 0) {
        return;
      }

      activeNodeList.forEach((node) => {
        updater(mindMap, node);
      });

      syncSelectionSnapshot(mindMap);
      syncDocumentState(mindMap);
      setMetadataDialogKind(null);
    },
    [editable, ensureActiveNodes, syncDocumentState, syncSelectionSnapshot],
  );

  const applyNoteContent = useCallback(
    (value: string) => {
      applyToActiveNodes((mindMap, node) => {
        mindMap.execCommand("SET_NODE_NOTE", node, value);
      });
    },
    [applyToActiveNodes],
  );

  const applyTagContent = useCallback(
    (value: string[]) => {
      applyToActiveNodes((mindMap, node) => {
        mindMap.execCommand("SET_NODE_TAG", node, value);
      });
    },
    [applyToActiveNodes],
  );

  const applyImageContent = useCallback(
    (value: MindMapNodeImagePayload) => {
      applyToActiveNodes((mindMap, node) => {
        mindMap.execCommand("SET_NODE_IMAGE", node, value);
      });
    },
    [applyToActiveNodes],
  );

  const applyHyperlinkContent = useCallback(
    (value: MindMapHyperlinkPayload) => {
      const hyperlink = getSafeHyperlink(value.url);
      applyToActiveNodes((mindMap, node) => {
        mindMap.execCommand(
          "SET_NODE_HYPERLINK",
          node,
          hyperlink,
          value.title.trim(),
        );
      });
    },
    [applyToActiveNodes],
  );

  const applySummaryContent = useCallback(
    (value: string) => {
      const nextText = value.trim();
      if (!nextText) {
        return;
      }

      const mindMap = mindMapRef.current;
      if (!mindMap || !editable) {
        return;
      }

      const activeNodeList = ensureActiveNodes();
      if (activeNodeList.length === 0) {
        return;
      }

      const nodesWithoutSummary: SimpleMindMapNode[] = [];

      activeNodeList.forEach((node) => {
        if (node.isGeneralization) {
          mindMap.execCommand("SET_NODE_TEXT", node, nextText, false, false);
          return;
        }

        const generalizationList = getGeneralizationList(
          node.getData("generalization"),
        );

        if (generalizationList.length === 0) {
          nodesWithoutSummary.push(node);
          return;
        }

        const nextGeneralization = generalizationList.map((item, index) =>
          index === 0 ? { ...item, text: nextText } : item,
        );

        mindMap.execCommand("SET_NODE_DATA", node, {
          generalization:
            nextGeneralization.length === 1
              ? nextGeneralization[0]
              : nextGeneralization,
        });
      });

      if (nodesWithoutSummary.length > 0) {
        mindMap.execCommand("ADD_GENERALIZATION", { text: nextText }, false);
      }

      syncSelectionSnapshot(mindMap);
      syncDocumentState(mindMap);
    },
    [editable, ensureActiveNodes, syncDocumentState, syncSelectionSnapshot],
  );

  const removeSummaryContent = useCallback(() => {
    const mindMap = mindMapRef.current;
    if (!mindMap || !editable) {
      return;
    }

    const activeNodeList = ensureActiveNodes();
    if (activeNodeList.length === 0) {
      return;
    }

    if (activeNodeList.some((node) => node.isGeneralization)) {
      mindMap.execCommand("REMOVE_NODE");
    } else {
      mindMap.execCommand("REMOVE_GENERALIZATION");
    }

    syncSelectionSnapshot(mindMap);
    syncDocumentState(mindMap);
  }, [editable, ensureActiveNodes, syncDocumentState, syncSelectionSnapshot]);

  const saveStatusLabel = getSaveStatusLabel(saveState, lastSavedAt);
  const themePresetId = getMindMapThemePresetId(themeConfig);
  const canvasSettings = getMindMapCanvasSettings(themeConfig);
  const canvasBackground = themeConfig.docmostCanvasBackground || "#f3f4f6";
  const gridColor = themeConfig.docmostGridColor || "rgba(148, 163, 184, 0.18)";

  return (
    <>
      <div className={classes.shell}>
        <MindmapTopToolbar
          editable={editable}
          isSaving={saveState === "saving"}
          saveStatusLabel={saveStatusLabel}
          selectedNodeCount={activeNodeCount}
          spaceUrl={getSpaceUrl(page?.space?.slug)}
          title={title}
          onSave={() => persistMindMap().catch((error) => console.error(error))}
          onTitleBlur={() => persistTitle.flush()}
          onTitleChange={(nextTitle) => {
            setTitle(nextTitle);
            persistTitle(nextTitle);
          }}
          onUndo={() => runCommand("BACK")}
          onRedo={() => runCommand("FORWARD")}
          onInsertChild={() => runCommand("INSERT_CHILD_NODE")}
          onInsertSibling={() => runCommand("INSERT_NODE")}
          onDelete={() => runCommand("REMOVE_NODE")}
          onOpenImage={() => setMetadataDialogKind("image")}
          onOpenHyperlink={() => setMetadataDialogKind("hyperlink")}
          onOpenNote={() => setMetadataDialogKind("note")}
          onOpenTag={() => setMetadataDialogKind("tag")}
          onAddSummary={() => runCommand("ADD_GENERALIZATION")}
        />

        <div className={classes.workspace}>
          <MindmapCanvas
            canvasBackground={canvasBackground}
            gridColor={gridColor}
            isReady={isReady}
            loadError={loadError}
            onFit={fitCanvas}
            onRetry={() => setLoadVersion((value) => value + 1)}
            showGrid={canvasSettings.showGrid}
            containerRef={containerRef}
          />

          <MindmapRightPanel
            editable={editable && isReady}
            layout={layout}
            layoutOptions={layoutOptions}
            selectedNode={selectedNode}
            selectedNodeCount={activeNodeCount}
            themePresetId={themePresetId}
            themePresets={THEME_PRESETS}
            canvasSettings={canvasSettings}
            onLayoutChange={handleLayoutChange}
            onNodeStyleChange={applyNodeStyleChange}
            onResetNodeStyle={resetNodeStyles}
            onSelectThemePreset={handleSelectThemePreset}
            onCanvasSettingsChange={handleCanvasSettingsChange}
            onOpenImageDialog={() => setMetadataDialogKind("image")}
            onOpenHyperlinkDialog={() => setMetadataDialogKind("hyperlink")}
            onApplyNote={applyNoteContent}
            onApplyTags={applyTagContent}
            onApplySummary={applySummaryContent}
            onRemoveSummary={removeSummaryContent}
          />
        </div>

        <MindmapBottomBar
          isReady={isReady}
          stats={documentStats}
          zoomPercent={zoomPercent}
          onCenter={centerCanvas}
          onFit={fitCanvas}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />
      </div>

      <MindmapNodeMetadataDialog
        dialogKind={metadataDialogKind}
        selectedNode={selectedNode}
        onClose={() => setMetadataDialogKind(null)}
        onApplyImage={applyImageContent}
        onApplyHyperlink={applyHyperlinkContent}
        onApplyNote={(value) => applyNoteContent(value)}
        onApplyTag={(value) => applyTagContent(value)}
      />
    </>
  );
}
