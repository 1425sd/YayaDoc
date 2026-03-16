import {
  IconArrowsMaximize,
  IconFocusCentered,
  IconMinus,
  IconPlus,
} from "@tabler/icons-react";
import { useTranslation } from "react-i18next";
import type { MindMapDocumentStats } from "@/features/mindmap/types/mindmap.types.ts";
import classes from "./mindmap-workspace.module.css";

type MindmapBottomBarProps = {
  isReady: boolean;
  stats: MindMapDocumentStats;
  zoomPercent: number;
  onCenter: () => void;
  onFit: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
};

type BottomActionButtonProps = {
  ariaLabel: string;
  disabled?: boolean;
  icon: typeof IconMinus;
  onClick: () => void;
};

function BottomActionButton({
  ariaLabel,
  disabled,
  icon: Icon,
  onClick,
}: BottomActionButtonProps) {
  return (
    <button
      type="button"
      className={classes.bottomActionButton}
      aria-label={ariaLabel}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon size={16} stroke={1.8} />
    </button>
  );
}

export function MindmapBottomBar({
  isReady,
  stats,
  zoomPercent,
  onCenter,
  onFit,
  onZoomIn,
  onZoomOut,
}: MindmapBottomBarProps) {
  const { t } = useTranslation();

  return (
    <div className={classes.bottomBar}>
      <div className={classes.bottomStats}>
        <span>
          {t("字数")} {stats.characterCount}
        </span>
        <span>
          {t("节点")} {stats.nodeCount}
        </span>
      </div>

      <div className={classes.bottomControls}>
        <BottomActionButton
          ariaLabel={t("缩小")}
          icon={IconMinus}
          onClick={onZoomOut}
          disabled={!isReady}
        />
        <span className={classes.zoomBadge}>{zoomPercent}%</span>
        <BottomActionButton
          ariaLabel={t("放大")}
          icon={IconPlus}
          onClick={onZoomIn}
          disabled={!isReady}
        />

        <button
          type="button"
          className={classes.bottomTextButton}
          onClick={onFit}
          disabled={!isReady}
        >
          <IconArrowsMaximize size={16} stroke={1.8} />
          <span>{t("适配屏幕")}</span>
        </button>

        <button
          type="button"
          className={classes.bottomTextButton}
          onClick={onCenter}
          disabled={!isReady}
        >
          <IconFocusCentered size={16} stroke={1.8} />
          <span>{t("回到中心")}</span>
        </button>
      </div>
    </div>
  );
}
