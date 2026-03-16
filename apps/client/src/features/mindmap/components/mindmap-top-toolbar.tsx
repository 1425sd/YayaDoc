import { Button, TextInput, Tooltip } from "@mantine/core";
import {
  IconArrowBackUp,
  IconArrowForwardUp,
  IconChevronLeft,
  IconDeviceFloppy,
  IconHierarchy2,
  IconLink,
  IconListDetails,
  IconNotes,
  IconPhoto,
  IconPlus,
  IconTags,
  IconTrash,
} from "@tabler/icons-react";
import type { TablerIcon } from "@tabler/icons-react";
import clsx from "clsx";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import classes from "./mindmap-workspace.module.css";

type ToolbarAction = {
  icon: TablerIcon;
  label: string;
  tooltip: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
};

type MindmapTopToolbarProps = {
  editable: boolean;
  isSaving: boolean;
  saveStatusLabel: string;
  selectedNodeCount: number;
  spaceUrl: string;
  title: string;
  onSave: () => void;
  onTitleBlur: () => void;
  onTitleChange: (value: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onInsertChild: () => void;
  onInsertSibling: () => void;
  onDelete: () => void;
  onOpenImage: () => void;
  onOpenHyperlink: () => void;
  onOpenNote: () => void;
  onOpenTag: () => void;
  onAddSummary: () => void;
};

function ToolbarButton({
  icon: Icon,
  label,
  tooltip,
  onClick,
  disabled,
  danger,
}: ToolbarAction) {
  return (
    <Tooltip label={tooltip} withArrow>
      <button
        type="button"
        className={clsx(classes.toolbarButton, {
          [classes.toolbarButtonDanger]: danger,
        })}
        onClick={onClick}
        disabled={disabled}
      >
        <Icon size={16} stroke={1.8} />
        <span>{label}</span>
      </button>
    </Tooltip>
  );
}

export function MindmapTopToolbar({
  editable,
  isSaving,
  saveStatusLabel,
  selectedNodeCount,
  spaceUrl,
  title,
  onSave,
  onTitleBlur,
  onTitleChange,
  onUndo,
  onRedo,
  onInsertChild,
  onInsertSibling,
  onDelete,
  onOpenImage,
  onOpenHyperlink,
  onOpenNote,
  onOpenTag,
  onAddSummary,
}: MindmapTopToolbarProps) {
  const { t } = useTranslation();
  const canEditSelection = editable && selectedNodeCount > 0;

  const primaryActions: ToolbarAction[] = [
    {
      icon: IconArrowBackUp,
      label: t("撤销"),
      tooltip: t("撤销"),
      onClick: onUndo,
      disabled: !editable,
    },
    {
      icon: IconArrowForwardUp,
      label: t("重做"),
      tooltip: t("重做"),
      onClick: onRedo,
      disabled: !editable,
    },
    {
      icon: IconHierarchy2,
      label: t("子节点"),
      tooltip: t("新增子节点"),
      onClick: onInsertChild,
      disabled: !editable,
    },
    {
      icon: IconPlus,
      label: t("同级节点"),
      tooltip: t("新增同级节点"),
      onClick: onInsertSibling,
      disabled: !editable,
    },
    {
      icon: IconTrash,
      label: t("删除节点"),
      tooltip: t("删除选中节点"),
      onClick: onDelete,
      disabled: !canEditSelection,
      danger: true,
    },
  ];

  const extensionActions: ToolbarAction[] = [
    {
      icon: IconPhoto,
      label: t("图片"),
      tooltip: t("为节点设置图片"),
      onClick: onOpenImage,
      disabled: !canEditSelection,
    },
    {
      icon: IconLink,
      label: t("超链接"),
      tooltip: t("为节点设置超链接"),
      onClick: onOpenHyperlink,
      disabled: !canEditSelection,
    },
    {
      icon: IconNotes,
      label: t("备注"),
      tooltip: t("为节点设置备注"),
      onClick: onOpenNote,
      disabled: !canEditSelection,
    },
    {
      icon: IconTags,
      label: t("标签"),
      tooltip: t("为节点设置标签"),
      onClick: onOpenTag,
      disabled: !canEditSelection,
    },
    {
      icon: IconListDetails,
      label: t("概要"),
      tooltip: t("为节点添加概要"),
      onClick: onAddSummary,
      disabled: !canEditSelection,
    },
  ];

  return (
    <div className={classes.topSection}>
      <div className={classes.topMeta}>
        <Button
          component={Link}
          to={spaceUrl}
          variant="default"
          radius="xl"
          size="sm"
          leftSection={<IconChevronLeft size={16} />}
        >
          {t("返回空间")}
        </Button>

        <div className={classes.titleBlock}>
          <TextInput
            value={title}
            onChange={(event) => onTitleChange(event.currentTarget.value)}
            onBlur={onTitleBlur}
            readOnly={!editable}
            size="md"
            radius="xl"
            className={classes.titleInput}
            styles={{
              input: {
                fontWeight: 700,
              },
            }}
          />
          <div className={classes.metaRow}>
            <span className={classes.statusPill}>{t(saveStatusLabel)}</span>
            {selectedNodeCount > 0 && (
              <span className={classes.selectionPill}>
                {t("已选节点")} {selectedNodeCount}
              </span>
            )}
          </div>
        </div>

        <Button
          variant="filled"
          radius="xl"
          size="sm"
          leftSection={<IconDeviceFloppy size={16} />}
          onClick={onSave}
          loading={isSaving}
          disabled={!editable}
        >
          {t("保存")}
        </Button>
      </div>

      <div className={classes.toolbarRow}>
        <div className={classes.toolbarGroup}>
          {primaryActions.map((action) => (
            <ToolbarButton key={action.label} {...action} />
          ))}
        </div>

        <div className={classes.toolbarGroup}>
          {extensionActions.map((action) => (
            <ToolbarButton key={action.label} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
}
