import { BubbleMenu as BaseBubbleMenu } from "@tiptap/react/menus";
import { findParentNode, posToDOMRect, useEditorState } from "@tiptap/react";
import React, { useCallback } from "react";
import { Node as PMNode } from "@tiptap/pm/model";
import {
  EditorMenuProps,
  ShouldShowProps,
} from "@/features/editor/components/table/types/types.ts";
import { ActionIcon, Box, Tooltip } from "@mantine/core";
import clsx from "clsx";
import { IconMoodSmile, IconX } from "@tabler/icons-react";
import { CalloutType, isTextSelected } from "@docmost/editor-ext";
import { useTranslation } from "react-i18next";
import EmojiPicker from "@/components/ui/emoji-picker.tsx";
import classes from "../common/toolbar-menu.module.css";
import { CALLOUT_PALETTE } from "@/features/editor/components/callout/callout-palette.ts";

export function CalloutMenu({ editor }: EditorMenuProps) {
  const { t } = useTranslation();

  const shouldShow = useCallback(
    ({ state }: ShouldShowProps) => {
      if (!state) {
        return false;
      }
      if (isTextSelected(editor)) return false;

      return editor.isActive("callout");
    },
    [editor],
  );

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      return {
        isCallout: ctx.editor.isActive("callout"),
        isInfo: ctx.editor.isActive("callout", { type: "info" }),
        isNote: ctx.editor.isActive("callout", { type: "note" }),
        isSuccess: ctx.editor.isActive("callout", { type: "success" }),
        isWarning: ctx.editor.isActive("callout", { type: "warning" }),
        isDanger: ctx.editor.isActive("callout", { type: "danger" }),
      };
    },
  });

  const getReferencedVirtualElement = useCallback(() => {
    if (!editor) return;
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "callout";
    const parent = findParentNode(predicate)(selection);

    if (parent) {
      const dom = editor.view.nodeDOM(parent?.pos) as HTMLElement;
      const domRect = dom.getBoundingClientRect();
      return {
        getBoundingClientRect: () => domRect,
        getClientRects: () => [domRect],
      };
    }

    const domRect = posToDOMRect(editor.view, selection.from, selection.to);
    return {
      getBoundingClientRect: () => domRect,
      getClientRects: () => [domRect],
    };
  }, [editor]);

  const setCalloutType = useCallback(
    (calloutType: CalloutType) => {
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .updateCalloutType(calloutType)
        .run();
    },
    [editor],
  );

  const setCalloutIcon = useCallback(
    (emoji: any) => {
      const emojiChar = emoji?.native || emoji?.emoji || emoji;
      editor
        .chain()
        .focus(undefined, { scrollIntoView: false })
        .updateCalloutIcon(emojiChar)
        .run();
    },
    [editor],
  );

  const removeCalloutIcon = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .updateCalloutIcon("")
      .run();
  }, [editor]);

  const unsetCallout = useCallback(() => {
    editor
      .chain()
      .focus(undefined, { scrollIntoView: false })
      .unsetCallout()
      .run();
  }, [editor]);

  const getCurrentIcon = () => {
    const { selection } = editor.state;
    const predicate = (node: PMNode) => node.type.name === "callout";
    const parent = findParentNode(predicate)(selection);
    const icon = parent?.node.attrs.icon;
    return icon || null;
  };

  const currentIcon = getCurrentIcon();

  return (
    <BaseBubbleMenu
      editor={editor}
      pluginKey={`callout-menu`}
      updateDelay={0}
      getReferencedVirtualElement={getReferencedVirtualElement}
      options={{
        placement: "bottom",
        // offset: 233, //      //         offset: [0, 10],
        // zIndex: 99,
        flip: false,
      }}
      shouldShow={shouldShow}
    >
      <div className={classes.toolbar}>
        {CALLOUT_PALETTE.map((item) => {
          const isActive =
            item.type === "info"
              ? editorState?.isInfo
              : item.type === "note"
                ? editorState?.isNote
                : item.type === "success"
                  ? editorState?.isSuccess
                  : item.type === "warning"
                    ? editorState?.isWarning
                    : editorState?.isDanger;

          return (
            <Tooltip
              key={item.type}
              position="top"
              label={t(item.name)}
              withinPortal={false}
            >
              <ActionIcon
                onClick={() => setCalloutType(item.type)}
                size="lg"
                aria-label={t(item.name)}
                variant="subtle"
                className={clsx({ [classes.active]: isActive })}
              >
                <Box
                  className={classes.calloutSwatch}
                  style={
                    {
                      "--callout-swatch-bg": item.background,
                      "--callout-swatch-border": item.border,
                      "--callout-swatch-accent": item.accent,
                    } as React.CSSProperties
                  }
                />
              </ActionIcon>
            </Tooltip>
          );
        })}

        <div className={classes.divider} />

        <Tooltip
          position="top"
          label={t("Turn off highlight block")}
          withinPortal={false}
        >
          <ActionIcon
            onClick={unsetCallout}
            size="lg"
            aria-label={t("Turn off highlight block")}
            variant="subtle"
            className={classes.destructive}
          >
            <IconX size={18} stroke={2.2} />
          </ActionIcon>
        </Tooltip>

        <div className={classes.divider} />

        <EmojiPicker
          onEmojiSelect={setCalloutIcon}
          removeEmojiAction={removeCalloutIcon}
          readOnly={false}
          icon={currentIcon || <IconMoodSmile size={18} />}
          actionIconProps={{
            size: "lg",
            variant: "subtle",
          }}
        />
      </div>
    </BaseBubbleMenu>
  );
}

export default CalloutMenu;
