import React, { FC } from "react";
import { Tooltip, UnstyledButton } from "@mantine/core";
import type { Editor } from "@tiptap/react";
import { useEditorState } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import {
  CALLOUT_PALETTE,
} from "@/features/editor/components/callout/callout-palette.ts";
import classes from "./bubble-menu.module.css";

interface HighlightBlockSelectorProps {
  editor: Editor | null;
}

export const HighlightBlockSelector: FC<HighlightBlockSelectorProps> = ({
  editor,
}) => {
  const { t } = useTranslation();

  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return null;
      }

      return {
        isCallout: ctx.editor.isActive("callout"),
      };
    },
  });

  if (!editor || !editorState) {
    return null;
  }

  const previewItem = CALLOUT_PALETTE[0];
  const toggleHighlightBlock = () => {
    if (editor.isActive("callout")) {
      editor.chain().focus().unsetCallout().run();
    } else {
      editor.chain().focus().toggleCallout({ type: previewItem.type }).run();
    }
  };
  const previewStyles = {
    "--preview-bg": previewItem.background,
    "--preview-border": previewItem.border,
    "--preview-accent": previewItem.accent,
  } as React.CSSProperties;

  return (
    <Tooltip label={t("Highlight block")} withArrow withinPortal={false}>
      <UnstyledButton
        className={classes.highlightToggleButton}
        data-active={editorState.isCallout || undefined}
        onClick={toggleHighlightBlock}
      >
        <span className={classes.highlightChip} style={previewStyles} />
        <span className={classes.highlightToggleTrack}>
          <span className={classes.highlightToggleThumb} />
        </span>
        <span className={classes.highlightToggleLabel}>
          {t("Highlight block")}
        </span>
      </UnstyledButton>
    </Tooltip>
  );
};
