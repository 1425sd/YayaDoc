import { Button, Loader, Paper } from "@mantine/core";
import type { CSSProperties, RefObject } from "react";
import { useTranslation } from "react-i18next";
import classes from "./mindmap-workspace.module.css";

type MindmapCanvasProps = {
  canvasBackground: string;
  gridColor: string;
  isReady: boolean;
  loadError: string | null;
  onFit: () => void;
  onRetry: () => void;
  showGrid: boolean;
  containerRef: RefObject<HTMLDivElement | null>;
};

type CanvasStyleVars = CSSProperties & {
  "--mindmap-canvas-background": string;
  "--mindmap-grid-color": string;
};

export function MindmapCanvas({
  canvasBackground,
  gridColor,
  isReady,
  loadError,
  onFit,
  onRetry,
  showGrid,
  containerRef,
}: MindmapCanvasProps) {
  const { t } = useTranslation();

  const canvasStyle: CanvasStyleVars = {
    "--mindmap-canvas-background": canvasBackground,
    "--mindmap-grid-color": showGrid ? gridColor : "transparent",
  };

  return (
    <div className={classes.canvasSurface} style={canvasStyle}>
      <div className={classes.canvasBackdrop} data-grid={showGrid} />

      {loadError && (
        <div className={classes.canvasOverlay}>
          <Paper className={classes.errorCard}>
            <h3 className={classes.errorTitle}>{t("加载失败")}</h3>
            <p className={classes.errorText}>{t(loadError)}</p>
            <div className={classes.errorActions}>
              <Button variant="default" radius="xl" onClick={onRetry}>
                {t("重试")}
              </Button>
              <Button variant="subtle" radius="xl" onClick={onFit}>
                {t("适配屏幕")}
              </Button>
            </div>
          </Paper>
        </div>
      )}

      {!isReady && !loadError && (
        <div className={classes.canvasOverlay}>
          <Loader color="blue" />
        </div>
      )}

      <div ref={containerRef} className={classes.canvasHost} />

      <div className={classes.canvasHint}>
        <h3 className={classes.canvasHintTitle}>{t("快速开始")}</h3>
        <p className={classes.canvasHintText}>
          {t(
            "双击节点编辑文字，Tab 创建子节点，Enter 创建同级节点，底部状态栏可以随时缩放或回到中心。",
          )}
        </p>
      </div>
    </div>
  );
}
