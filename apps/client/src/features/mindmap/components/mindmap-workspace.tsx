import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Paper,
  Select,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import { useDebouncedCallback } from "@mantine/hooks";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconCheck,
  IconMap2,
} from "@tabler/icons-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { getSpaceUrl } from "@/lib/config.ts";
import {
  updatePageData,
  useUpdatePageMutation,
  useUpdateTitlePageMutation,
} from "@/features/page/queries/page-query.ts";
import { IPage } from "@/features/page/types/page.types.ts";
import {
  createMindMapContentFromData,
  getMindMapData,
  MINDMAP_CONTENT_FORMAT,
  MINDMAP_LAYOUT_OPTIONS,
} from "@/features/mindmap/lib/mindmap-content.ts";
import classes from "./mindmap-workspace.module.css";

type MindMapConstructor = typeof import("simple-mind-map").default;
type MindMapInstance = InstanceType<MindMapConstructor>;

type MindMapWorkspaceProps = {
  page: IPage;
  editable: boolean;
};

type SaveState = "saved" | "saving" | "dirty";

let isMindMapPluginsRegistered = false;
const MINDMAP_CONTAINER_WAIT_TIMEOUT = 4000;
const COMMANDS_REQUIRING_ACTIVE_NODE = new Set([
  "INSERT_CHILD_NODE",
  "INSERT_AFTER",
  "INSERT_PARENT_NODE",
  "REMOVE_NODE",
]);

function registerMindMapPlugin(MindMap: any, plugin: any) {
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

  if (!isMindMapPluginsRegistered) {
    registerMindMapPlugin(MindMap, DragPlugin);
    registerMindMapPlugin(MindMap, SelectPlugin);
    registerMindMapPlugin(MindMap, KeyboardNavigationPlugin);
    registerMindMapPlugin(MindMap, TouchEventPlugin);
    isMindMapPluginsRegistered = true;
  }

  return MindMap as MindMapConstructor;
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

function createFingerprint(data: any) {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error(error);
    return "";
  }
}

export function MindMapWorkspace({ page, editable }: MindMapWorkspaceProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mindMapRef = useRef<MindMapInstance | null>(null);
  const pageRef = useRef(page);
  const isSavingRef = useRef(false);
  const isDirtyRef = useRef(false);
  const isHydratingRef = useRef(true);
  const lastSavedFingerprintRef = useRef("");
  const [title, setTitle] = useState(page.title || "");
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    page.updatedAt ? new Date(page.updatedAt) : null,
  );
  const [layout, setLayout] = useState(getMindMapData(page.content).layout);
  const [activeNodeCount, setActiveNodeCount] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadVersion, setLoadVersion] = useState(0);
  const updatePageMutation = useUpdatePageMutation();
  const updateTitleMutation = useUpdateTitlePageMutation();

  const fitCanvas = useCallback(() => {
    mindMapRef.current?.resize?.();
    const view = mindMapRef.current?.view as any;
    view?.fit?.();
  }, []);

  useEffect(() => {
    pageRef.current = page;
    setTitle(page.title || "");
    setLastSavedAt(page.updatedAt ? new Date(page.updatedAt) : null);
    setLayout(getMindMapData(page.content).layout);
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
      } as any);

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
        } as any);
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
    let currentMindMap: MindMapInstance | null = null;
    let cleanupSelectionState: ((...args: any[]) => void) | null = null;
    let cleanupMarkDirty: (() => void) | null = null;
    let cleanupLayoutChange: ((nextLayout: string) => void) | null = null;
    let resizeObserver: ResizeObserver | null = null;

    if (!container) {
      return;
    }

    isHydratingRef.current = true;
    isDirtyRef.current = false;
    setIsReady(false);
    setLoadError(null);
    setActiveNodeCount(0);

    container.innerHTML = "";

    async function setupMindMap() {
      try {
        await waitForContainerReady(container, () => cancelled);
        const MindMap = await loadMindMapConstructor();

        if (cancelled) {
          return;
        }

        const mindMap = new MindMap({
          el: container,
          data: mindMapData.root,
          layout: mindMapData.layout,
          theme: mindMapData.theme.template,
          themeConfig: mindMapData.theme.config,
          viewData: mindMapData.view,
          readonly: !editable,
          mousewheelAction: "zoom",
          fit: !mindMapData.view || Object.keys(mindMapData.view).length === 0,
        } as any);

        if (cancelled) {
          mindMap.destroy();
          return;
        }

        currentMindMap = mindMap;
        mindMapRef.current = mindMap;

        const syncSelectionState = (_node?: any, activeNodeList?: any[]) => {
          setActiveNodeCount(activeNodeList?.length ?? 0);
        };

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

        const handleLayoutChange = (nextLayout: string) => {
          setLayout(nextLayout);
          markDirty();
        };

        cleanupSelectionState = syncSelectionState;
        cleanupMarkDirty = markDirty;
        cleanupLayoutChange = handleLayoutChange;

        mindMap.on("data_change", markDirty);
        mindMap.on("view_data_change", markDirty);
        mindMap.on("layout_change", handleLayoutChange);
        mindMap.on("node_active", syncSelectionState);

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

          if (editable && mindMap.renderer?.root) {
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
          setActiveNodeCount(mindMap.renderer?.activeNodeList?.length ?? 0);
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
      currentMindMap?.off("data_change", cleanupMarkDirty as any);
      currentMindMap?.off("view_data_change", cleanupMarkDirty as any);
      currentMindMap?.off("layout_change", cleanupLayoutChange as any);
      currentMindMap?.off("node_active", cleanupSelectionState as any);
      currentMindMap?.destroy();
      if (mindMapRef.current === currentMindMap) {
        mindMapRef.current = null;
      }
    };
  }, [debouncedPersist, editable, loadVersion, page.id, persistTitle]);

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

  const layoutOptions = useMemo(
    () =>
      MINDMAP_LAYOUT_OPTIONS.map((option) => ({
        value: option.value,
        label: t(option.label),
      })),
    [t],
  );

  const runCommand = useCallback(
    (command: string, ...args: any[]) => {
      if (!editable) {
        return;
      }

      const mindMap = mindMapRef.current;
      const activeNodeList = mindMap?.renderer?.activeNodeList ?? [];
      const rootNode = mindMap?.renderer?.root;

      if (
        COMMANDS_REQUIRING_ACTIVE_NODE.has(command) &&
        activeNodeList.length === 0 &&
        rootNode
      ) {
        try {
          mindMap?.execCommand("SET_NODE_ACTIVE", rootNode, true);
        } catch (error) {
          console.error("Failed to focus root node before running command", {
            command,
            error,
          });
        }
      }

      mindMapRef.current?.execCommand(command, ...args);
      setActiveNodeCount(
        mindMapRef.current?.renderer?.activeNodeList?.length ?? 0,
      );
    },
    [editable],
  );

  const saveStatusLabel = getSaveStatusLabel(saveState, lastSavedAt);

  return (
    <div className={classes.shell}>
      <div className={classes.topBar}>
        <div className={classes.topMeta}>
          <Button
            component={Link}
            to={getSpaceUrl(page?.space?.slug)}
            variant="default"
            radius="xl"
            className={classes.backButton}
          >
            {t("返回空间")}
          </Button>
          <TextInput
            value={title}
            onChange={(event) => {
              const nextTitle = event.currentTarget.value;
              setTitle(nextTitle);
              persistTitle(nextTitle);
            }}
            onBlur={() => persistTitle.flush()}
            className={classes.titleInput}
            size="md"
            radius="xl"
            fw={700}
            readOnly={!editable}
          />
          <span className={classes.status}>{t(saveStatusLabel)}</span>
        </div>

        <Group gap="xs">
          <Tooltip label={t("撤销")} withArrow>
            <ActionIcon
              variant="default"
              radius="xl"
              size="lg"
              onClick={() => runCommand("BACK")}
              disabled={!editable}
            >
              <IconArrowBackUp size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t("重做")} withArrow>
            <ActionIcon
              variant="default"
              radius="xl"
              size="lg"
              onClick={() => runCommand("FORWARD")}
              disabled={!editable}
            >
              <IconArrowForwardUp size={18} />
            </ActionIcon>
          </Tooltip>
          <Button
            radius="xl"
            color="dark"
            leftSection={<IconCheck size={16} />}
            onClick={() =>
              persistMindMap().catch((error) => console.error(error))
            }
            loading={saveState === "saving"}
            disabled={!editable}
          >
            {t("保存")}
          </Button>
        </Group>
      </div>

      <div className={classes.workspace}>
        <div className={classes.sidePanel}>
          <Paper className={classes.panelCard}>
            <h2 className={classes.panelTitle}>{t("分支操作")}</h2>
            <p className={classes.panelText}>
              {activeNodeCount > 0
                ? t(
                    "当前已选中节点，你可以继续新增分支、调整层级，或者直接删除它。",
                  )
                : t("先点击一个节点，然后再使用这些操作来新增或删除分支。")}
            </p>

            <div className={classes.buttonGrid}>
              <Button
                variant="light"
                radius="xl"
                onClick={() => runCommand("INSERT_CHILD_NODE")}
                disabled={!editable}
              >
                {t("添加子节点")}
              </Button>
              <Button
                variant="light"
                radius="xl"
                onClick={() => runCommand("INSERT_AFTER")}
                disabled={!editable}
              >
                {t("添加同级节点")}
              </Button>
              <Button
                variant="light"
                radius="xl"
                onClick={() => runCommand("INSERT_PARENT_NODE")}
                disabled={!editable}
              >
                {t("添加父节点")}
              </Button>
              <Button
                variant="light"
                color="red"
                radius="xl"
                onClick={() => runCommand("REMOVE_NODE")}
                disabled={!editable}
              >
                {t("删除节点")}
              </Button>
            </div>
          </Paper>

          <Paper className={classes.panelCard}>
            <h2 className={classes.panelTitle}>{t("视图与布局")}</h2>
            <p className={classes.panelText}>
              {t(
                "你可以切换结构样式、重新整理布局，也可以一键展开或收起整张图。",
              )}
            </p>

            <Select
              mt="md"
              radius="xl"
              label={t("布局")}
              value={layout}
              data={layoutOptions}
              onChange={(value) => {
                if (!value) {
                  return;
                }
                mindMapRef.current?.setLayout(value);
              }}
              disabled={!isReady}
            />

            <div className={classes.secondaryGrid}>
              <Button
                variant="default"
                radius="xl"
                onClick={() => runCommand("EXPAND_ALL")}
                disabled={!editable}
              >
                {t("全部展开")}
              </Button>
              <Button
                variant="default"
                radius="xl"
                onClick={() => runCommand("UNEXPAND_ALL")}
                disabled={!editable}
              >
                {t("全部收起")}
              </Button>
              <Button
                variant="default"
                radius="xl"
                onClick={() => runCommand("RESET_LAYOUT")}
                disabled={!editable}
              >
                {t("重置布局")}
              </Button>
              <Button
                variant="default"
                radius="xl"
                onClick={fitCanvas}
                disabled={!isReady}
              >
                {t("适配画布")}
              </Button>
            </div>
          </Paper>

          <Paper className={classes.panelCard}>
            <Group gap="sm" wrap="nowrap">
              <IconMap2 size={20} stroke={1.8} color="#2563eb" />
              <div>
                <Text fw={800} c="dark.8">
                  {t("使用提示")}
                </Text>
                <Text size="sm" c="dimmed">
                  {t(
                    "双击节点可以直接改名，拖动分支可以重新组织结构，滚轮可以缩放画布。",
                  )}
                </Text>
              </div>
            </Group>
          </Paper>
        </div>

        <div className={classes.canvasPanel}>
          {loadError && (
            <div className={classes.loaderOverlay}>
              <Paper className={classes.errorCard}>
                <h3 className={classes.errorTitle}>{t("加载失败")}</h3>
                <p className={classes.errorText}>{t(loadError)}</p>
                <Group mt="md" gap="sm">
                  <Button
                    radius="xl"
                    variant="default"
                    onClick={() => setLoadVersion((value) => value + 1)}
                  >
                    {t("重试")}
                  </Button>
                  <Button
                    radius="xl"
                    variant="subtle"
                    onClick={fitCanvas}
                    disabled={!mindMapRef.current}
                  >
                    {t("适配画布")}
                  </Button>
                </Group>
              </Paper>
            </div>
          )}
          {!isReady && !loadError && (
            <div className={classes.loaderOverlay}>
              <Loader color="blue" />
            </div>
          )}
          <div ref={containerRef} className={classes.canvas} />
          <div className={classes.canvasHint}>
            <h3 className={classes.hintTitle}>{t("快速开始")}</h3>
            <p className={classes.hintText}>
              {t(
                "双击任意节点即可编辑文字。左侧操作面板会对当前选中的节点生效，内容也会自动保存。",
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
