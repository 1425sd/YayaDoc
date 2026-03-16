import classes from "./page-header.module.css";
import PageHeaderMenu from "@/features/page/components/header/page-header-menu.tsx";
import { Group } from "@mantine/core";
import Breadcrumb from "@/features/page/components/breadcrumbs/breadcrumb.tsx";
import { useAtomValue } from "jotai";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms.ts";
import { TopToolbar } from "@/features/editor/components/top-toolbar/top-toolbar.tsx";
import { useEditorState } from "@tiptap/react";

interface Props {
  readOnly?: boolean;
}
export default function PageHeader({ readOnly }: Props) {
  const pageEditor = useAtomValue(pageEditorAtom);
  const isEditorEditable = useEditorState({
    editor: pageEditor,
    selector: (ctx) => ctx.editor?.isEditable ?? false,
  });

  return (
    <div className={classes.header}>
      <Group
        justify="space-between"
        h="100%"
        px="md"
        wrap="nowrap"
        className={classes.group}
      >
        <Breadcrumb />

        <Group
          justify="flex-end"
          h="100%"
          px="md"
          wrap="nowrap"
          gap="var(--mantine-spacing-xs)"
          className={classes.actions}
        >
          <PageHeaderMenu readOnly={readOnly} />
        </Group>
      </Group>

      {pageEditor && !readOnly && isEditorEditable && (
        <div className={classes.toolbarRow}>
          <TopToolbar editor={pageEditor} />
        </div>
      )}
    </div>
  );
}
