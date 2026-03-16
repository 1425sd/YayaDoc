import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import type { CSSProperties } from "react";
import classes from "./callout.module.css";
import { getCalloutPalette } from "./callout-palette.ts";

export default function CalloutView(props: NodeViewProps) {
  const { node } = props;
  const { type, icon } = node.attrs;
  const palette = getCalloutPalette(type);
  const hasIcon = typeof icon === "string" && icon.trim() !== "";

  return (
    <NodeViewWrapper
      className={classes.root}
      data-has-icon={hasIcon || undefined}
      style={
        {
          "--callout-accent": palette.accent,
          "--callout-border": palette.border,
          "--callout-bg": palette.background,
          "--callout-icon-bg": palette.iconBackground,
        } as CSSProperties
      }
    >
      {hasIcon ? <div className={classes.icon}>{icon}</div> : null}

      <div className={classes.content}>
        <NodeViewContent className={classes.message} />
      </div>
    </NodeViewWrapper>
  );
}
