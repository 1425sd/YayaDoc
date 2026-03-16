import {
  Badge,
  Button,
  ColorInput,
  Divider,
  NumberInput,
  Select,
  SegmentedControl,
  Switch,
  Tabs,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconBoxAlignRight,
  IconLayoutKanban,
  IconLink,
  IconPalette,
  IconPhoto,
  IconSettings2,
} from "@tabler/icons-react";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  MindMapCanvasSettings,
  MindMapEditableNodeStyle,
  MindMapInspectorNode,
  MindMapLayoutValue,
  MindMapThemePresetDefinition,
  MindMapThemePresetId,
} from "@/features/mindmap/types/mindmap.types.ts";
import classes from "./mindmap-workspace.module.css";

type MindmapRightPanelProps = {
  editable: boolean;
  layout: MindMapLayoutValue;
  layoutOptions: Array<{
    value: MindMapLayoutValue;
    label: string;
  }>;
  selectedNode: MindMapInspectorNode | null;
  selectedNodeCount: number;
  themePresetId: MindMapThemePresetId;
  themePresets: MindMapThemePresetDefinition[];
  canvasSettings: MindMapCanvasSettings;
  onLayoutChange: (layout: MindMapLayoutValue) => void;
  onNodeStyleChange: (patch: Partial<MindMapEditableNodeStyle>) => void;
  onResetNodeStyle: () => void;
  onSelectThemePreset: (presetId: MindMapThemePresetId) => void;
  onCanvasSettingsChange: (patch: Partial<MindMapCanvasSettings>) => void;
  onOpenImageDialog: () => void;
  onOpenHyperlinkDialog: () => void;
  onApplyNote: (value: string) => void;
  onApplyTags: (value: string[]) => void;
  onApplySummary: (value: string) => void;
  onRemoveSummary: () => void;
};

function getNumberValue(value: string | number, fallback: number) {
  return typeof value === "number" ? value : fallback;
}

function getNodeKindLabel(
  node: MindMapInspectorNode,
  t: (key: string) => string,
) {
  switch (node.kind) {
    case "root":
      return t("根节点");
    case "second":
      return t("二级节点");
    case "summary":
      return t("概要节点");
    default:
      return t("分支节点");
  }
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function MindmapRightPanel({
  editable,
  layout,
  layoutOptions,
  selectedNode,
  selectedNodeCount,
  themePresetId,
  themePresets,
  canvasSettings,
  onLayoutChange,
  onNodeStyleChange,
  onResetNodeStyle,
  onSelectThemePreset,
  onCanvasSettingsChange,
  onOpenImageDialog,
  onOpenHyperlinkDialog,
  onApplyNote,
  onApplyTags,
  onApplySummary,
  onRemoveSummary,
}: MindmapRightPanelProps) {
  const { t } = useTranslation();
  const stackedTabs = useMediaQuery("(max-width: 1180px)");
  const nodeStyle = selectedNode?.style;
  const hasCustomStyle =
    selectedNode && Object.keys(selectedNode.customStyle).length > 0;
  const [noteDraft, setNoteDraft] = useState("");
  const [tagDraft, setTagDraft] = useState("");
  const [summaryDraft, setSummaryDraft] = useState("");

  useEffect(() => {
    if (!selectedNode) {
      setNoteDraft("");
      setTagDraft("");
      setSummaryDraft("");
      return;
    }

    setNoteDraft(selectedNode.metadata.note);
    setTagDraft(selectedNode.metadata.tags.join(", "));
    setSummaryDraft(
      selectedNode.kind === "summary"
        ? selectedNode.text
        : selectedNode.metadata.summaryText,
    );
  }, [selectedNode]);

  const hasNote = Boolean(selectedNode?.metadata.note.trim());
  const hasTags = Boolean(selectedNode?.metadata.tags.length);
  const hasImage = Boolean(selectedNode?.metadata.image);
  const hasLink = Boolean(selectedNode?.metadata.hyperlink);
  const hasSummary =
    selectedNode?.kind === "summary" ||
    selectedNode?.metadata.hasGeneralization;

  return (
    <div className={classes.rightPanel}>
      <Tabs
        defaultValue="style"
        orientation={stackedTabs ? "horizontal" : "vertical"}
        className={classes.rightPanelTabs}
      >
        <Tabs.List className={classes.rightPanelTabList}>
          <Tabs.Tab
            value="style"
            leftSection={<IconPalette size={16} />}
            className={classes.rightPanelTab}
          >
            {t("节点样式")}
          </Tabs.Tab>
          <Tabs.Tab
            value="theme"
            leftSection={<IconLayoutKanban size={16} />}
            className={classes.rightPanelTab}
          >
            {t("主题")}
          </Tabs.Tab>
          <Tabs.Tab
            value="structure"
            leftSection={<IconBoxAlignRight size={16} />}
            className={classes.rightPanelTab}
          >
            {t("结构")}
          </Tabs.Tab>
          <Tabs.Tab
            value="settings"
            leftSection={<IconSettings2 size={16} />}
            className={classes.rightPanelTab}
          >
            {t("设置")}
          </Tabs.Tab>
        </Tabs.List>

        <div className={classes.rightPanelBody}>
          <Tabs.Panel value="style" className={classes.rightPanelPanel}>
            <div className={classes.panelSection}>
              <div className={classes.panelHeader}>
                <div>
                  <h3 className={classes.panelTitle}>{t("节点样式")}</h3>
                  <p className={classes.panelText}>
                    {selectedNode
                      ? t("这里同时管理节点外观和节点内容。")
                      : t("先选中一个节点，再在这里调整它的样式和内容。")}
                  </p>
                </div>
                {selectedNode && (
                  <Badge variant="light" radius="sm">
                    {getNodeKindLabel(selectedNode, t)}
                  </Badge>
                )}
              </div>

              {!selectedNode || !nodeStyle ? (
                <div className={classes.emptyPanelState}>
                  <Text fw={600}>{t("暂无选中节点")}</Text>
                  <Text size="sm" c="dimmed">
                    {t(
                      "点击画布中的节点后，这里会显示颜色、边框、圆角、字体和节点内容编辑区。",
                    )}
                  </Text>
                </div>
              ) : (
                <>
                  <div className={classes.fieldGrid}>
                    <ColorInput
                      label={t("背景")}
                      value={nodeStyle.fillColor}
                      onChange={(value) =>
                        onNodeStyleChange({ fillColor: value })
                      }
                      disabled={!editable}
                    />
                    <ColorInput
                      label={t("文字")}
                      value={nodeStyle.color}
                      onChange={(value) => onNodeStyleChange({ color: value })}
                      disabled={!editable}
                    />
                    <ColorInput
                      label={t("边框")}
                      value={nodeStyle.borderColor}
                      onChange={(value) =>
                        onNodeStyleChange({ borderColor: value })
                      }
                      disabled={!editable}
                    />
                    <NumberInput
                      label={t("边框宽度")}
                      min={0}
                      max={6}
                      value={nodeStyle.borderWidth}
                      onChange={(value) =>
                        onNodeStyleChange({
                          borderWidth: getNumberValue(
                            value,
                            nodeStyle.borderWidth,
                          ),
                        })
                      }
                      disabled={!editable}
                    />
                    <NumberInput
                      label={t("圆角")}
                      min={0}
                      max={28}
                      value={nodeStyle.borderRadius}
                      onChange={(value) =>
                        onNodeStyleChange({
                          borderRadius: getNumberValue(
                            value,
                            nodeStyle.borderRadius,
                          ),
                        })
                      }
                      disabled={!editable}
                    />
                    <NumberInput
                      label={t("字号")}
                      min={12}
                      max={32}
                      value={nodeStyle.fontSize}
                      onChange={(value) =>
                        onNodeStyleChange({
                          fontSize: getNumberValue(value, nodeStyle.fontSize),
                        })
                      }
                      disabled={!editable}
                    />
                  </div>

                  <div className={classes.fieldStack}>
                    <Text fw={600} size="sm">
                      {t("字重")}
                    </Text>
                    <SegmentedControl
                      value={nodeStyle.fontWeight}
                      onChange={(value) =>
                        onNodeStyleChange({
                          fontWeight:
                            value as MindMapEditableNodeStyle["fontWeight"],
                        })
                      }
                      data={[
                        {
                          label: t("常规"),
                          value: "normal",
                        },
                        {
                          label: t("加粗"),
                          value: "bold",
                        },
                      ]}
                      fullWidth
                      disabled={!editable}
                    />
                  </div>

                  <div className={classes.panelActions}>
                    <Button
                      variant="default"
                      radius="xl"
                      onClick={onResetNodeStyle}
                      disabled={!editable || !hasCustomStyle}
                    >
                      {t("恢复默认样式")}
                    </Button>
                    {selectedNodeCount > 1 && (
                      <Text size="sm" c="dimmed">
                        {t("多选时会批量应用到所有已选节点。")}
                      </Text>
                    )}
                  </div>

                  <Divider
                    className={classes.sectionDivider}
                    label={t("节点内容")}
                    labelPosition="center"
                  />

                  <div className={classes.metadataBadgeRow}>
                    <Badge variant={hasImage ? "filled" : "light"} radius="sm">
                      {hasImage ? t("有图片") : t("无图片")}
                    </Badge>
                    <Badge variant={hasLink ? "filled" : "light"} radius="sm">
                      {hasLink ? t("有链接") : t("无链接")}
                    </Badge>
                    <Badge variant={hasNote ? "filled" : "light"} radius="sm">
                      {hasNote ? t("有备注") : t("无备注")}
                    </Badge>
                    <Badge variant={hasTags ? "filled" : "light"} radius="sm">
                      {hasTags ? t("有标签") : t("无标签")}
                    </Badge>
                    <Badge
                      variant={hasSummary ? "filled" : "light"}
                      radius="sm"
                    >
                      {hasSummary ? t("有概要") : t("无概要")}
                    </Badge>
                  </div>

                  <div className={classes.metadataActionRow}>
                    <Button
                      variant="default"
                      radius="xl"
                      leftSection={<IconPhoto size={16} />}
                      onClick={onOpenImageDialog}
                      disabled={!editable}
                    >
                      {hasImage ? t("编辑图片") : t("添加图片")}
                    </Button>
                    <Button
                      variant="default"
                      radius="xl"
                      leftSection={<IconLink size={16} />}
                      onClick={onOpenHyperlinkDialog}
                      disabled={!editable}
                    >
                      {hasLink ? t("编辑链接") : t("添加链接")}
                    </Button>
                  </div>

                  <div className={classes.fieldStack}>
                    <Text fw={700}>{t("备注")}</Text>
                    <Textarea
                      minRows={4}
                      autosize
                      value={noteDraft}
                      onChange={(event) =>
                        setNoteDraft(event.currentTarget.value)
                      }
                      disabled={!editable}
                    />
                    <div className={classes.inlineActionRow}>
                      <Button
                        variant="default"
                        radius="xl"
                        onClick={() => {
                          setNoteDraft("");
                          onApplyNote("");
                        }}
                        disabled={!editable || !hasNote}
                      >
                        {t("清空备注")}
                      </Button>
                      <Button
                        radius="xl"
                        onClick={() => onApplyNote(noteDraft.trim())}
                        disabled={!editable}
                      >
                        {t("保存备注")}
                      </Button>
                    </div>
                  </div>

                  <div className={classes.fieldStack}>
                    <Text fw={700}>{t("标签")}</Text>
                    <TextInput
                      value={tagDraft}
                      description={t("使用英文逗号分隔多个标签。")}
                      onChange={(event) =>
                        setTagDraft(event.currentTarget.value)
                      }
                      disabled={!editable}
                    />
                    <div className={classes.inlineActionRow}>
                      <Button
                        variant="default"
                        radius="xl"
                        onClick={() => {
                          setTagDraft("");
                          onApplyTags([]);
                        }}
                        disabled={!editable || !hasTags}
                      >
                        {t("清空标签")}
                      </Button>
                      <Button
                        radius="xl"
                        onClick={() => onApplyTags(parseTags(tagDraft))}
                        disabled={!editable}
                      >
                        {t("保存标签")}
                      </Button>
                    </div>
                  </div>

                  <div className={classes.fieldStack}>
                    <Text fw={700}>{t("概要")}</Text>
                    <Textarea
                      minRows={3}
                      autosize
                      value={summaryDraft}
                      placeholder={t("输入概要内容，未存在时会自动创建概要。")}
                      onChange={(event) =>
                        setSummaryDraft(event.currentTarget.value)
                      }
                      disabled={!editable}
                    />
                    <div className={classes.inlineActionRow}>
                      <Button
                        variant="default"
                        radius="xl"
                        onClick={onRemoveSummary}
                        disabled={!editable || !hasSummary}
                      >
                        {t("删除概要")}
                      </Button>
                      <Button
                        radius="xl"
                        onClick={() => onApplySummary(summaryDraft)}
                        disabled={!editable || !summaryDraft.trim()}
                      >
                        {hasSummary ? t("保存概要") : t("创建概要")}
                      </Button>
                    </div>
                    {selectedNode.metadata.summaryCount > 1 &&
                      selectedNode.kind !== "summary" && (
                        <Text size="sm" c="dimmed">
                          {t(
                            "当前节点存在多个概要，P1 面板会优先编辑第一个概要。",
                          )}
                        </Text>
                      )}
                  </div>
                </>
              )}
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="theme" className={classes.rightPanelPanel}>
            <div className={classes.panelSection}>
              <h3 className={classes.panelTitle}>{t("主题")}</h3>
              <p className={classes.panelText}>
                {t("切换预设会更新根节点、分支节点、连线和画布氛围。")}
              </p>

              <div className={classes.themePresetList}>
                {themePresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    className={clsx(classes.themePresetCard, {
                      [classes.themePresetCardActive]:
                        themePresetId === preset.id,
                    })}
                    onClick={() => onSelectThemePreset(preset.id)}
                    disabled={!editable}
                  >
                    <div className={classes.themePresetSwatches}>
                      {preset.previewColors.map((color) => (
                        <span
                          key={color}
                          className={classes.themePresetSwatch}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <div>
                      <Text fw={700}>{t(preset.labelKey)}</Text>
                      <Text size="sm" c="dimmed">
                        {t(preset.descriptionKey)}
                      </Text>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="structure" className={classes.rightPanelPanel}>
            <div className={classes.panelSection}>
              <h3 className={classes.panelTitle}>{t("结构")}</h3>
              <p className={classes.panelText}>
                {t("默认推荐思维导图结构，其他结构已保留为可切换入口。")}
              </p>

              <Select
                label={t("布局")}
                value={layout}
                data={layoutOptions}
                onChange={(value) => {
                  if (!value) {
                    return;
                  }

                  onLayoutChange(value as MindMapLayoutValue);
                }}
                disabled={!editable}
              />

              <Text size="sm" c="dimmed" mt="md">
                {t(
                  "当前结构切换已经是真实渲染，后续还可以继续补不同结构的专属参数。",
                )}
              </Text>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="settings" className={classes.rightPanelPanel}>
            <div className={classes.panelSection}>
              <h3 className={classes.panelTitle}>{t("设置")}</h3>
              <p className={classes.panelText}>
                {t("控制画布网格和基础连线风格，便于快速调整整体阅读体验。")}
              </p>

              <div className={classes.fieldStack}>
                <Switch
                  label={t("显示网格")}
                  checked={canvasSettings.showGrid}
                  onChange={(event) =>
                    onCanvasSettingsChange({
                      showGrid: event.currentTarget.checked,
                    })
                  }
                  disabled={!editable}
                />
                <Switch
                  label={t("虚线连线")}
                  checked={canvasSettings.dashedLines}
                  onChange={(event) =>
                    onCanvasSettingsChange({
                      dashedLines: event.currentTarget.checked,
                    })
                  }
                  disabled={!editable}
                />
              </div>

              <div className={classes.fieldStack}>
                <Text fw={600} size="sm">
                  {t("连线样式")}
                </Text>
                <SegmentedControl
                  value={canvasSettings.lineStyle}
                  onChange={(value) =>
                    onCanvasSettingsChange({
                      lineStyle: value as MindMapCanvasSettings["lineStyle"],
                    })
                  }
                  data={[
                    { label: t("直线"), value: "straight" },
                    { label: t("曲线"), value: "curve" },
                    { label: t("直连"), value: "direct" },
                  ]}
                  fullWidth
                  disabled={!editable}
                />
              </div>

              <NumberInput
                label={t("连线宽度")}
                min={1}
                max={6}
                value={canvasSettings.lineWidth}
                onChange={(value) =>
                  onCanvasSettingsChange({
                    lineWidth: getNumberValue(value, canvasSettings.lineWidth),
                  })
                }
                disabled={!editable}
              />
            </div>
          </Tabs.Panel>
        </div>
      </Tabs>
    </div>
  );
}
