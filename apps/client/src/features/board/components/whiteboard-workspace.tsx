import {
  ActionIcon,
  Button,
  Group,
  Loader,
  Popover,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconArrowNarrowRight,
  IconBrush,
  IconBulb,
  IconCalendar,
  IconCheck,
  IconCloud,
  IconFlag,
  IconHeart,
  IconMap2,
  IconPointer,
  IconPhoto,
  IconPlus,
  IconRectangle,
  IconSettings2,
  IconStar,
  IconTextSize,
  IconVectorBezier2,
} from "@tabler/icons-react";
import {
  type ComponentType,
  lazy,
  Suspense,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useDebouncedCallback } from "@mantine/hooks";
import "@excalidraw/excalidraw/index.css";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import { useHandleLibrary } from "@excalidraw/excalidraw";
import { svgStringToFile } from "@/lib";
import { getFileUrl, getSpaceUrl } from "@/lib/config.ts";
import { localStorageLibraryAdapter } from "@/features/editor/components/excalidraw/excalidraw-utils.ts";
import { IPage, PageContentFormat } from "@/features/page/types/page.types.ts";
import {
  useUpdatePageMutation,
  useUpdateTitlePageMutation,
} from "@/features/page/queries/page-query.ts";
import { uploadFile } from "@/features/page/services/page-service.ts";
import {
  getBoardNode,
  upsertBoardContent,
} from "@/features/board/lib/board-content.ts";
import classes from "./whiteboard-workspace.module.css";

const ExcalidrawComponent = lazy(() =>
  import("@excalidraw/excalidraw").then((module) => ({
    default: module.Excalidraw,
  })),
);

type WhiteboardWorkspaceProps = {
  page: IPage;
  editable: boolean;
};

type IconEntry = {
  label: string;
  Icon: ComponentType<any>;
};

const ICON_LIBRARY: IconEntry[] = [
  { label: "Star", Icon: IconStar },
  { label: "Idea", Icon: IconBulb },
  { label: "Flag", Icon: IconFlag },
  { label: "Heart", Icon: IconHeart },
  { label: "Cloud", Icon: IconCloud },
  { label: "Calendar", Icon: IconCalendar },
];

function getSceneCenter(excalidrawAPI: ExcalidrawImperativeAPI | null) {
  const appState = (excalidrawAPI as any)?.getAppState?.() || {};
  return {
    x: -(appState.scrollX || 0) + (appState.width || window.innerWidth) / 2,
    y: -(appState.scrollY || 0) + (appState.height || window.innerHeight) / 2,
  };
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getImageDimensions(src: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth || 180,
        height: image.naturalHeight || 180,
      });
    };
    image.onerror = reject;
    image.src = src;
  });
}

function getSaveStatusLabel(
  saveState: "saved" | "saving" | "dirty",
  lastSavedAt: Date | null,
) {
  if (saveState === "saving") {
    return "Saving board…";
  }

  if (saveState === "dirty") {
    return "Unsaved changes";
  }

  if (!lastSavedAt) {
    return "Saved";
  }

  return `Saved ${lastSavedAt.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getInitialBoardHeight() {
  if (typeof window === "undefined") {
    return 2400;
  }

  return Math.max(window.innerHeight * 3, 2400);
}

function getSceneContentBottom(
  elements: ReadonlyArray<{ y?: number; height?: number }> = [],
) {
  return elements.reduce((maxBottom, element) => {
    const elementBottom = (element.y || 0) + (element.height || 0);
    return Math.max(maxBottom, elementBottom);
  }, 0);
}

export function WhiteboardWorkspace({
  page,
  editable,
}: WhiteboardWorkspaceProps) {
  const { t } = useTranslation();
  const boardNode = getBoardNode(page.content);
  const updatePageMutation = useUpdatePageMutation();
  const updateTitleMutation = useUpdateTitlePageMutation();
  const [title, setTitle] = useState(page.title || "");
  const [saveState, setSaveState] = useState<"saved" | "saving" | "dirty">(
    "saved",
  );
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [activeTool, setActiveTool] = useState("selection");
  const [isIconOpen, setIsIconOpen] = useState(false);
  const [isShapeOpen, setIsShapeOpen] = useState(false);
  const [iconQuery, setIconQuery] = useState("");
  const deferredIconQuery = useDeferredValue(iconQuery);
  const [sceneData, setSceneData] = useState<any>(null);
  const [isSceneReady, setIsSceneReady] = useState(false);
  const [boardHeight, setBoardHeight] = useState(getInitialBoardHeight);
  const [toolbarPosition, setToolbarPosition] = useState({ x: 24, y: 112 });
  const [isDraggingToolbar, setIsDraggingToolbar] = useState(false);
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const toolbarDragOffsetRef = useRef({ x: 0, y: 0 });
  const isDirtyRef = useRef(false);
  const isSavingRef = useRef(false);
  const isInitialLoadRef = useRef(true);
  const lastFingerprintRef = useRef("");
  const hasLoadedPageRef = useRef<string | null>(null);

  useHandleLibrary({
    excalidrawAPI,
    adapter: localStorageLibraryAdapter,
  });

  useEffect(() => {
    setTitle(page.title || "");
  }, [page.title]);

  useEffect(() => {
    const handleResize = () => {
      setBoardHeight((currentHeight) =>
        Math.max(currentHeight, getInitialBoardHeight()),
      );
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollBottom = window.innerHeight + window.scrollY;
      const documentHeight = document.documentElement.scrollHeight;

      if (scrollBottom >= documentHeight - 280) {
        setBoardHeight(
          (currentHeight) => currentHeight + Math.max(window.innerHeight, 1200),
        );
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!isDraggingToolbar) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const toolbarWidth = toolbarRef.current?.offsetWidth || 88;
      const toolbarHeight = toolbarRef.current?.offsetHeight || 560;
      const nextX = event.clientX - toolbarDragOffsetRef.current.x;
      const nextY = event.clientY - toolbarDragOffsetRef.current.y;

      setToolbarPosition({
        x: Math.min(Math.max(12, nextX), window.innerWidth - toolbarWidth - 12),
        y: Math.min(
          Math.max(64, nextY),
          window.innerHeight - toolbarHeight - 12,
        ),
      });
    };

    const stopDragging = () => {
      setIsDraggingToolbar(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", stopDragging);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopDragging);
    };
  }, [isDraggingToolbar]);

  useEffect(() => {
    let cancelled = false;

    async function loadScene() {
      if (hasLoadedPageRef.current === page.id) {
        return;
      }

      hasLoadedPageRef.current = page.id;
      setIsSceneReady(false);

      if (!boardNode?.attrs?.src) {
        if (!cancelled) {
          setSceneData(null);
          setBoardHeight(getInitialBoardHeight());
          setIsSceneReady(true);
          isInitialLoadRef.current = true;
          lastFingerprintRef.current = "";
        }
        return;
      }

      try {
        const request = await fetch(getFileUrl(boardNode.attrs.src), {
          credentials: "include",
          cache: "no-store",
        });
        const { loadFromBlob } = await import("@excalidraw/excalidraw");
        const data = await loadFromBlob(await request.blob(), null, null);
        if (!cancelled) {
          setSceneData(data);
          setBoardHeight(
            Math.max(
              getInitialBoardHeight(),
              getSceneContentBottom(data?.elements || []) + 1400,
            ),
          );
          isInitialLoadRef.current = true;
          lastFingerprintRef.current = "";
        }
      } catch (error) {
        if (!cancelled) {
          console.error(error);
        }
      } finally {
        if (!cancelled) {
          setIsSceneReady(true);
        }
      }
    }

    loadScene();

    return () => {
      cancelled = true;
    };
  }, [boardNode?.attrs?.src, page.id]);

  const persistBoard = useCallback(async () => {
    if (!editable || !excalidrawAPI || isSavingRef.current) {
      return;
    }

    isSavingRef.current = true;
    setSaveState("saving");

    try {
      const { exportToSvg } = await import("@excalidraw/excalidraw");
      const svg = await exportToSvg({
        elements: (excalidrawAPI as any).getSceneElements?.() || [],
        appState: {
          exportEmbedScene: true,
          exportWithDarkMode: false,
        },
        files: (excalidrawAPI as any).getFiles?.() || {},
      });

      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svg);
      svgString = svgString.replace(
        /https:\/\/unpkg\.com\/@excalidraw\/excalidraw@undefined/g,
        "https://unpkg.com/@excalidraw/excalidraw@latest",
      );

      const svgFile = await svgStringToFile(svgString, "board.excalidraw.svg");
      const attachment = await uploadFile(
        svgFile,
        page.id,
        boardNode?.attrs?.attachmentId,
      );

      const nextContent = upsertBoardContent(page.content, {
        src: `/api/files/${attachment.id}/${attachment.fileName}?t=${new Date(
          attachment.updatedAt,
        ).getTime()}`,
        title: attachment.fileName,
        size: attachment.fileSize,
        attachmentId: attachment.id,
      });

      await updatePageMutation.mutateAsync({
        pageId: page.id,
        content: nextContent,
        format: PageContentFormat.JSON,
      } as any);

      isDirtyRef.current = false;
      setSaveState("saved");
      setLastSavedAt(new Date());
    } finally {
      isSavingRef.current = false;
    }
  }, [
    boardNode?.attrs?.attachmentId,
    editable,
    excalidrawAPI,
    page.content,
    page.id,
    updatePageMutation,
  ]);

  const debouncedPersist = useDebouncedCallback(() => {
    if (isDirtyRef.current) {
      persistBoard().catch((error) => console.error(error));
    }
  }, 2500);

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

  const updateSceneWithNewElements = useCallback(
    async (elements: any[]) => {
      if (!excalidrawAPI || elements.length === 0) {
        return;
      }

      const currentElements = (excalidrawAPI as any).getSceneElements?.() || [];

      (excalidrawAPI as any).updateScene?.({
        elements: [...currentElements, ...elements],
        appState: {
          activeTool: {
            type: "selection",
            locked: false,
          },
        },
      });

      setActiveTool("selection");
      isDirtyRef.current = true;
      setSaveState("dirty");
      const contentBottom = getSceneContentBottom(elements);
      setBoardHeight((currentHeight) =>
        contentBottom > currentHeight - 480
          ? Math.max(currentHeight, contentBottom + 1200)
          : currentHeight,
      );
      debouncedPersist();
    },
    [debouncedPersist, excalidrawAPI],
  );

  const insertImageFile = useCallback(
    async (file: File, preferredWidth?: number, preferredHeight?: number) => {
      if (!editable || !excalidrawAPI) {
        return;
      }

      const dataURL = await fileToDataUrl(file);
      const { width: naturalWidth, height: naturalHeight } =
        await getImageDimensions(dataURL);
      const fileId = crypto.randomUUID();
      const center = getSceneCenter(excalidrawAPI);
      const targetWidth = preferredWidth || Math.min(naturalWidth, 320);
      const targetHeight =
        preferredHeight ||
        Math.max(80, (naturalHeight / naturalWidth) * targetWidth);

      const { convertToExcalidrawElements } = await import(
        "@excalidraw/excalidraw"
      );

      (excalidrawAPI as any).addFiles?.([
        {
          id: fileId,
          dataURL,
          mimeType: file.type || "image/png",
          created: Date.now(),
          lastRetrieved: Date.now(),
        },
      ]);

      const elements = convertToExcalidrawElements([
        {
          type: "image",
          fileId: fileId as any,
          x: center.x - targetWidth / 2,
          y: center.y - targetHeight / 2,
          width: targetWidth,
          height: targetHeight,
        },
      ]);

      await updateSceneWithNewElements(elements);
    },
    [editable, excalidrawAPI, updateSceneWithNewElements],
  );

  const handleToolChange = useCallback(
    (tool: string) => {
      if (!editable) {
        return;
      }

      (excalidrawAPI as any)?.setActiveTool?.({ type: tool, locked: false });
      setActiveTool(tool);
      setIsShapeOpen(false);
    },
    [editable, excalidrawAPI],
  );

  const handleInsertIcon = useCallback(
    async (entry: IconEntry) => {
      const svgMarkup = renderToStaticMarkup(
        <entry.Icon size={120} stroke={1.6} color="#0f172a" />,
      );
      const iconFile = await svgStringToFile(
        svgMarkup,
        `${entry.label.toLowerCase()}.svg`,
      );
      await insertImageFile(iconFile, 120, 120);
      setIsIconOpen(false);
      setIconQuery("");
    },
    [insertImageFile],
  );

  const handleInsertMindMap = useCallback(async () => {
    if (!editable || !excalidrawAPI) {
      return;
    }

    const { convertToExcalidrawElements } = await import(
      "@excalidraw/excalidraw"
    );
    const center = getSceneCenter(excalidrawAPI);
    const baseX = center.x - 90;
    const baseY = center.y - 40;

    const elements = convertToExcalidrawElements([
      {
        type: "rectangle",
        x: baseX,
        y: baseY,
        width: 180,
        height: 72,
        backgroundColor: "#fff7ed",
        strokeColor: "#ea580c",
      },
      {
        type: "text",
        x: baseX + 36,
        y: baseY + 22,
        text: t("Central topic"),
        fontSize: 28,
        strokeColor: "#9a3412",
      },
      {
        type: "rectangle",
        x: baseX + 280,
        y: baseY - 120,
        width: 170,
        height: 62,
        backgroundColor: "#eff6ff",
        strokeColor: "#2563eb",
      },
      {
        type: "text",
        x: baseX + 316,
        y: baseY - 98,
        text: t("Branch A"),
        fontSize: 24,
        strokeColor: "#1d4ed8",
      },
      {
        type: "rectangle",
        x: baseX + 280,
        y: baseY + 118,
        width: 170,
        height: 62,
        backgroundColor: "#ecfdf5",
        strokeColor: "#059669",
      },
      {
        type: "text",
        x: baseX + 316,
        y: baseY + 140,
        text: t("Branch B"),
        fontSize: 24,
        strokeColor: "#047857",
      },
      {
        type: "arrow",
        x: baseX + 180,
        y: baseY + 34,
        points: [
          [0, 0],
          [100, -92],
        ] as any,
        strokeColor: "#2563eb",
      },
      {
        type: "arrow",
        x: baseX + 180,
        y: baseY + 38,
        points: [
          [0, 0],
          [100, 110],
        ] as any,
        strokeColor: "#059669",
      },
    ]);

    await updateSceneWithNewElements(elements);
  }, [editable, excalidrawAPI, t, updateSceneWithNewElements]);

  const filteredIcons = useMemo(() => {
    const query = deferredIconQuery.trim().toLowerCase();
    if (!query) {
      return ICON_LIBRARY;
    }

    return ICON_LIBRARY.filter((entry) =>
      entry.label.toLowerCase().includes(query),
    );
  }, [deferredIconQuery]);

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
            {t("Back to space")}
          </Button>
          <TextInput
            value={title}
            onChange={(event) => setTitle(event.currentTarget.value)}
            onBlur={() => {
              if (!editable || title === page.title) {
                return;
              }
              updateTitleMutation.mutate({
                pageId: page.id,
                title,
              } as any);
            }}
            className={classes.titleInput}
            size="md"
            radius="xl"
            fw={700}
            readOnly={!editable}
          />
          <span className={classes.status}>{t(saveStatusLabel)}</span>
        </div>

        <div className={classes.actions}>
          <Tooltip label={t("Undo")} withArrow>
            <ActionIcon
              variant="default"
              radius="xl"
              size="lg"
              onClick={() => (excalidrawAPI as any)?.history?.undo?.()}
              disabled={!editable}
            >
              <IconArrowBackUp size={18} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t("Redo")} withArrow>
            <ActionIcon
              variant="default"
              radius="xl"
              size="lg"
              onClick={() => (excalidrawAPI as any)?.history?.redo?.()}
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
              persistBoard().catch((error) => console.error(error))
            }
            loading={saveState === "saving"}
            disabled={!editable}
          >
            {t("Save")}
          </Button>
        </div>
      </div>

      <div
        className={classes.canvasWrap}
        style={{ minHeight: `${boardHeight}px` }}
      >
        <div
          ref={toolbarRef}
          className={`${classes.toolbar} ${isDraggingToolbar ? classes.toolbarDragging : ""}`}
          style={{
            left: `${toolbarPosition.x}px`,
            top: `${toolbarPosition.y}px`,
          }}
        >
          <button
            type="button"
            className={classes.dragHandle}
            onPointerDown={(event) => {
              event.preventDefault();
              if (!toolbarRef.current) {
                return;
              }

              const bounds = toolbarRef.current.getBoundingClientRect();
              toolbarDragOffsetRef.current = {
                x: event.clientX - bounds.left,
                y: event.clientY - bounds.top,
              };
              setIsDraggingToolbar(true);
            }}
          >
            {t("Drag")}
          </button>

          <Popover
            opened={isIconOpen}
            onChange={setIsIconOpen}
            position="right-start"
            withinPortal
          >
            <Popover.Target>
              <button
                type="button"
                className={classes.toolButton}
                onClick={() => setIsIconOpen((opened) => !opened)}
                disabled={!editable}
              >
                <IconStar size={20} stroke={1.8} />
              </button>
            </Popover.Target>
            <Popover.Dropdown className={classes.popoverPanel}>
              <TextInput
                value={iconQuery}
                onChange={(event) => setIconQuery(event.currentTarget.value)}
                placeholder={t("Search icons")}
                className={classes.iconSearch}
              />
              <div className={classes.iconGrid}>
                {filteredIcons.map((entry) => (
                  <button
                    key={entry.label}
                    type="button"
                    className={classes.iconCard}
                    onClick={() => handleInsertIcon(entry)}
                  >
                    <entry.Icon size={24} stroke={1.8} />
                    <span className={classes.iconLabel}>{entry.label}</span>
                  </button>
                ))}
              </div>
            </Popover.Dropdown>
          </Popover>

          <Tooltip label={t("Select")} withArrow position="right">
            <button
              type="button"
              className={`${classes.toolButton} ${activeTool === "selection" ? classes.toolActive : ""}`}
              onClick={() => handleToolChange("selection")}
            >
              <IconPointer size={20} stroke={1.8} />
            </button>
          </Tooltip>

          <Tooltip label={t("Pen")} withArrow position="right">
            <button
              type="button"
              className={`${classes.toolButton} ${activeTool === "freedraw" ? classes.toolActive : ""}`}
              onClick={() => handleToolChange("freedraw")}
            >
              <IconBrush size={20} stroke={1.8} />
            </button>
          </Tooltip>

          <Tooltip label={t("Vector")} withArrow position="right">
            <button
              type="button"
              className={`${classes.toolButton} ${activeTool === "line" ? classes.toolActive : ""}`}
              onClick={() => handleToolChange("line")}
            >
              <IconVectorBezier2 size={20} stroke={1.8} />
            </button>
          </Tooltip>

          <Tooltip label={t("Text")} withArrow position="right">
            <button
              type="button"
              className={`${classes.toolButton} ${activeTool === "text" ? classes.toolActive : ""}`}
              onClick={() => handleToolChange("text")}
            >
              <IconTextSize size={20} stroke={1.8} />
            </button>
          </Tooltip>

          <Popover
            opened={isShapeOpen}
            onChange={setIsShapeOpen}
            position="right-start"
            withinPortal
          >
            <Popover.Target>
              <button
                type="button"
                className={classes.toolButton}
                onClick={() => setIsShapeOpen((opened) => !opened)}
                disabled={!editable}
              >
                <IconRectangle size={20} stroke={1.8} />
              </button>
            </Popover.Target>
            <Popover.Dropdown className={classes.popoverPanel}>
              <Text fw={700} mb="sm">
                {t("Shapes")}
              </Text>
              <div className={classes.shapeGrid}>
                <button
                  type="button"
                  className={classes.shapeButton}
                  onClick={() => handleToolChange("rectangle")}
                >
                  <IconRectangle size={22} />
                </button>
                <button
                  type="button"
                  className={classes.shapeButton}
                  onClick={() => handleToolChange("ellipse")}
                >
                  <IconSettings2 size={22} />
                </button>
                <button
                  type="button"
                  className={classes.shapeButton}
                  onClick={() => handleToolChange("diamond")}
                >
                  <IconPlus size={22} />
                </button>
              </div>
            </Popover.Dropdown>
          </Popover>

          <Tooltip label={t("Arrow / Line")} withArrow position="right">
            <button
              type="button"
              className={`${classes.toolButton} ${activeTool === "arrow" ? classes.toolActive : ""}`}
              onClick={() => handleToolChange("arrow")}
            >
              <IconArrowNarrowRight size={20} stroke={1.8} />
            </button>
          </Tooltip>

          <Tooltip label={t("Mind map starter")} withArrow position="right">
            <button
              type="button"
              className={classes.toolButton}
              onClick={() =>
                handleInsertMindMap().catch((error) => console.error(error))
              }
              disabled={!editable}
            >
              <IconMap2 size={20} stroke={1.8} />
            </button>
          </Tooltip>

          <Tooltip label={t("Insert image")} withArrow position="right">
            <button
              type="button"
              className={`${classes.toolButton} ${activeTool === "image" ? classes.toolActive : ""}`}
              onClick={() => fileInputRef.current?.click()}
              disabled={!editable}
            >
              <IconPhoto size={20} stroke={1.8} />
            </button>
          </Tooltip>

          <div className={classes.toolbarDivider} />
          <div className={classes.toolbarHint}>
            {t("Copy, paste, drag images, undo, redo")}
          </div>
        </div>

        <div className={classes.canvasSurface}>
          {!isSceneReady && (
            <Group justify="center" align="center" h="100%">
              <Loader color="orange" />
            </Group>
          )}

          {isSceneReady && (
            <Suspense fallback={null}>
              <ExcalidrawComponent
                excalidrawAPI={(api) => setExcalidrawAPI(api)}
                initialData={{
                  ...(sceneData || {}),
                  scrollToContent: true,
                }}
                onChange={(elements, appState, files) => {
                  const contentBottom = getSceneContentBottom(elements);
                  setBoardHeight((currentHeight) =>
                    contentBottom > currentHeight - 480
                      ? Math.max(currentHeight, contentBottom + 1200)
                      : currentHeight,
                  );
                  setActiveTool(appState?.activeTool?.type || "selection");
                  const fingerprint = `${elements.length}:${elements.reduce(
                    (sum, element) => sum + (element.version || 0),
                    0,
                  )}:${Object.keys(files || {}).length}`;

                  if (isInitialLoadRef.current) {
                    lastFingerprintRef.current = fingerprint;
                    isInitialLoadRef.current = false;
                    return;
                  }

                  if (fingerprint !== lastFingerprintRef.current) {
                    lastFingerprintRef.current = fingerprint;
                    isDirtyRef.current = true;
                    setSaveState("dirty");
                    debouncedPersist();
                  }
                }}
                viewModeEnabled={!editable}
                UIOptions={{
                  canvasActions: {
                    loadScene: false,
                    saveToActiveFile: false,
                    export: false,
                  },
                }}
                autoFocus={editable}
              />
            </Suspense>
          )}
        </div>
      </div>

      <div className={classes.footer}>
        <div className={classes.footerNote}>
          {t(
            "Native copy/paste, external text or image paste, drag-and-drop images, and undo/redo are handled directly by the board canvas.",
          )}
        </div>
        <Text c="dimmed" size="sm">
          {t(
            "Text styling stays available from the native Excalidraw property panel.",
          )}
        </Text>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0];
          if (file) {
            insertImageFile(file).catch((error) => console.error(error));
          }
          event.currentTarget.value = "";
        }}
      />
    </div>
  );
}
