import {
  Alert,
  Button,
  Group,
  Image,
  Loader,
  Modal,
  Stack,
  Text,
  TextInput,
  Textarea,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconPhotoPlus,
  IconRefresh,
  IconTrash,
} from "@tabler/icons-react";
import clsx from "clsx";
import {
  type ChangeEvent,
  type ClipboardEvent,
  type DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  buildMindMapImagePayloadFromBlob,
  getClipboardImageFile,
  getImageFileFromFileList,
  MAX_MINDMAP_IMAGE_FILE_SIZE,
  normalizeHyperlink,
} from "@/features/mindmap/lib/mindmap-node-assets.ts";
import type {
  MindMapHyperlinkPayload,
  MindMapInspectorNode,
  MindMapMetadataDialogKind,
  MindMapNodeImagePayload,
} from "@/features/mindmap/types/mindmap.types.ts";
import classes from "./mindmap-node-metadata-dialog.module.css";

type MindmapNodeMetadataDialogProps = {
  dialogKind: MindMapMetadataDialogKind | null;
  selectedNode: MindMapInspectorNode | null;
  onApplyHyperlink: (value: MindMapHyperlinkPayload) => void;
  onApplyImage: (value: MindMapNodeImagePayload) => void;
  onApplyNote: (value: string) => void;
  onApplyTag: (value: string[]) => void;
  onClose: () => void;
};

function parseTags(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
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

function triggerFileInput(fileInput: HTMLInputElement | null) {
  fileInput?.click();
}

export function MindmapNodeMetadataDialog({
  dialogKind,
  selectedNode,
  onApplyHyperlink,
  onApplyImage,
  onApplyNote,
  onApplyTag,
  onClose,
}: MindmapNodeMetadataDialogProps) {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [imageDraft, setImageDraft] = useState<MindMapNodeImagePayload | null>(
    null,
  );
  const [imageFileName, setImageFileName] = useState("");
  const [imageError, setImageError] = useState("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isReadingImage, setIsReadingImage] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (!dialogKind || !selectedNode) {
      return;
    }

    setImageDraft(
      selectedNode.metadata.image
        ? {
            url: selectedNode.metadata.image,
            title: selectedNode.metadata.imageTitle,
            width: selectedNode.metadata.imageSize.width,
            height: selectedNode.metadata.imageSize.height,
            custom: selectedNode.metadata.imageSize.custom,
          }
        : null,
    );
    setImageFileName(
      selectedNode.metadata.imageTitle ||
        (selectedNode.metadata.image ? t("当前节点图片") : ""),
    );
    setImageError("");
    setIsDraggingImage(false);
    setIsReadingImage(false);
    setLinkUrl(selectedNode.metadata.hyperlink);
    setLinkTitle(selectedNode.metadata.hyperlinkTitle);
    setNote(selectedNode.metadata.note);
    setTags(selectedNode.metadata.tags.join(", "));
  }, [dialogKind, selectedNode, t]);

  const opened = dialogKind !== null && selectedNode !== null;
  const normalizedHyperlink = useMemo(() => {
    const normalized = normalizeHyperlink(linkUrl);
    return isValidHyperlink(normalized) ? normalized : "";
  }, [linkUrl]);

  const applyImageFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        setImageError(t("请上传图片文件。"));
        return;
      }

      if (file.size > MAX_MINDMAP_IMAGE_FILE_SIZE) {
        setImageError(t("图片大小不能超过 10MB。"));
        return;
      }

      setImageError("");
      setIsReadingImage(true);

      try {
        const payload = await buildMindMapImagePayloadFromBlob(file);
        setImageDraft(payload);
        setImageFileName(file.name);
      } catch (error) {
        console.error(error);
        setImageError(t("读取图片失败，请重试。"));
      } finally {
        setIsReadingImage(false);
      }
    },
    [t],
  );

  const handleFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = getImageFileFromFileList(event.currentTarget.files);
      if (file) {
        await applyImageFile(file);
      }

      event.currentTarget.value = "";
    },
    [applyImageFile],
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDraggingImage(false);

      const file = getImageFileFromFileList(event.dataTransfer.files);
      if (file) {
        await applyImageFile(file);
      }
    },
    [applyImageFile],
  );

  const handlePasteImage = useCallback(
    async (event: ClipboardEvent<HTMLDivElement>) => {
      const file = getClipboardImageFile(event.clipboardData);
      if (!file) {
        return;
      }

      event.preventDefault();
      await applyImageFile(file);
    },
    [applyImageFile],
  );

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      radius="lg"
      title={
        dialogKind === "image"
          ? t("节点图片")
          : dialogKind === "hyperlink"
            ? t("节点超链接")
            : dialogKind === "note"
              ? t("节点备注")
              : t("节点标签")
      }
    >
      {dialogKind === "image" && (
        <Stack className={classes.imageDialog}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(event) => {
              void handleFileChange(event);
            }}
            hidden
          />

          <div
            role="button"
            tabIndex={0}
            className={clsx(classes.uploadZone, {
              [classes.uploadZoneActive]: isDraggingImage,
            })}
            onClick={() => triggerFileInput(fileInputRef.current)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                triggerFileInput(fileInputRef.current);
              }
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragEnter={(event) => {
              event.preventDefault();
              setIsDraggingImage(true);
            }}
            onDragLeave={(event) => {
              event.preventDefault();
              setIsDraggingImage(false);
            }}
            onDrop={(event) => {
              void handleDrop(event);
            }}
            onPaste={(event) => {
              void handlePasteImage(event);
            }}
          >
            {isReadingImage ? (
              <Loader size="md" />
            ) : imageDraft?.url ? (
              <div className={classes.previewSurface}>
                <div className={classes.previewImageWrap}>
                  <Image
                    src={imageDraft.url}
                    alt={imageDraft.title || t("节点图片预览")}
                    className={classes.previewImage}
                  />
                </div>
                <div className={classes.previewMeta}>
                  <div className={classes.previewMetaText}>
                    <div className={classes.fileName}>
                      {imageFileName || t("已选择图片")}
                    </div>
                    <div className={classes.fileMeta}>
                      {t(
                        "原始尺寸 {{width}} x {{height}}，画布中会自动适配显示。",
                        {
                          width: imageDraft.width,
                          height: imageDraft.height,
                        },
                      )}
                    </div>
                  </div>
                  <Group gap="xs">
                    <Button
                      variant="default"
                      radius="xl"
                      leftSection={<IconRefresh size={16} />}
                      onClick={(event) => {
                        event.stopPropagation();
                        triggerFileInput(fileInputRef.current);
                      }}
                    >
                      {t("重新选择")}
                    </Button>
                    <Button
                      color="red"
                      variant="light"
                      radius="xl"
                      leftSection={<IconTrash size={16} />}
                      onClick={(event) => {
                        event.stopPropagation();
                        setImageDraft(null);
                        setImageFileName("");
                        setImageError("");
                      }}
                    >
                      {t("移除预览")}
                    </Button>
                  </Group>
                </div>
              </div>
            ) : (
              <div className={classes.uploadPlaceholder}>
                <div className={classes.uploadIcon}>
                  <IconPhotoPlus size={26} />
                </div>
                <div>
                  <Text fw={700}>{t("点击选择本地图片")}</Text>
                  <Text size="sm" c="dimmed" mt={6}>
                    {t("也支持直接拖拽文件到这里，或在这里粘贴剪贴板图片。")}
                  </Text>
                </div>
              </div>
            )}
          </div>

          <TextInput
            label={t("图片标题")}
            placeholder={t("可选，用于节点图片提示")}
            value={imageDraft?.title ?? ""}
            onChange={(event) =>
              setImageDraft((current) =>
                current
                  ? {
                      ...current,
                      title: event.currentTarget.value,
                    }
                  : current,
              )
            }
            disabled={!imageDraft}
          />

          {imageError && (
            <Alert
              color="red"
              icon={<IconAlertCircle size={16} />}
              variant="light"
            >
              {imageError}
            </Alert>
          )}

          <Text size="sm" c="dimmed">
            {t("支持 JPG、PNG、GIF、WebP，单张图片不超过 10MB。")}
          </Text>

          <Group justify="space-between">
            <Button
              variant="default"
              onClick={() =>
                onApplyImage({
                  url: "",
                  title: "",
                  width: 0,
                  height: 0,
                  custom: false,
                })
              }
              disabled={!selectedNode?.metadata.image && !imageDraft}
            >
              {t("移除节点图片")}
            </Button>
            <Button
              onClick={() => {
                if (imageDraft) {
                  onApplyImage(imageDraft);
                }
              }}
              disabled={!imageDraft || isReadingImage}
            >
              {t("应用")}
            </Button>
          </Group>
        </Stack>
      )}

      {dialogKind === "hyperlink" && (
        <Stack>
          <TextInput
            label={t("链接地址")}
            placeholder="https://example.com"
            value={linkUrl}
            onChange={(event) => setLinkUrl(event.currentTarget.value)}
          />
          <Text
            size="sm"
            c={linkUrl.trim() && !normalizedHyperlink ? "red" : "dimmed"}
          >
            {linkUrl.trim()
              ? normalizedHyperlink
                ? t("已识别为超链接：{{url}}", {
                    url: normalizedHyperlink,
                  })
                : t("当前内容不是可识别的链接，请检查格式。")
              : t("支持直接粘贴 example.com，会自动补全为 https://example.com")}
          </Text>
          <TextInput
            label={t("链接标题")}
            value={linkTitle}
            onChange={(event) => setLinkTitle(event.currentTarget.value)}
          />
          <Group justify="space-between" mt="xs">
            <Button
              variant="default"
              onClick={() => onApplyHyperlink({ url: "", title: "" })}
            >
              {t("移除")}
            </Button>
            <Button
              onClick={() =>
                onApplyHyperlink({
                  url: normalizedHyperlink,
                  title: linkTitle.trim(),
                })
              }
              disabled={Boolean(linkUrl.trim()) && !normalizedHyperlink}
            >
              {t("应用")}
            </Button>
          </Group>
        </Stack>
      )}

      {dialogKind === "note" && (
        <>
          <Textarea
            label={t("备注")}
            minRows={6}
            autosize
            value={note}
            onChange={(event) => setNote(event.currentTarget.value)}
          />
          <Group justify="space-between" mt="xl">
            <Button variant="default" onClick={() => onApplyNote("")}>
              {t("清空")}
            </Button>
            <Button onClick={() => onApplyNote(note.trim())}>
              {t("应用")}
            </Button>
          </Group>
        </>
      )}

      {dialogKind === "tag" && (
        <>
          <TextInput
            label={t("标签")}
            description={t("使用英文逗号分隔多个标签。")}
            value={tags}
            onChange={(event) => setTags(event.currentTarget.value)}
          />
          <Group justify="space-between" mt="xl">
            <Button variant="default" onClick={() => onApplyTag([])}>
              {t("清空")}
            </Button>
            <Button onClick={() => onApplyTag(parseTags(tags))}>
              {t("应用")}
            </Button>
          </Group>
        </>
      )}
    </Modal>
  );
}
