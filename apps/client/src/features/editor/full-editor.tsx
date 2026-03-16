import classes from "@/features/editor/styles/editor.module.css";
import React from "react";
import { TitleEditor } from "@/features/editor/title-editor";
import PageEditor from "@/features/editor/page-editor";
import { Container } from "@mantine/core";
import { useAtom, useAtomValue } from "jotai";
import { userAtom } from "@/features/user/atoms/current-user-atom.ts";
import { pageEditorAtom } from "@/features/editor/atoms/editor-atoms.ts";
import { TopToolbar } from "@/features/editor/components/top-toolbar/top-toolbar.tsx";

const MemoizedTitleEditor = React.memo(TitleEditor);
const MemoizedPageEditor = React.memo(PageEditor);

export interface FullEditorProps {
  pageId: string;
  slugId: string;
  title: string;
  content: string;
  spaceSlug: string;
  editable: boolean;
}

export function FullEditor({
  pageId,
  title,
  slugId,
  content,
  spaceSlug,
  editable,
}: FullEditorProps) {
  const [user] = useAtom(userAtom);
  const pageEditor = useAtomValue(pageEditorAtom);
  const fullPageWidth = user.settings?.preferences?.fullPageWidth;

  return (
    <Container
      fluid={fullPageWidth}
      size={!fullPageWidth && 900}
      className={classes.editor}
    >
      {pageEditor && editable && <TopToolbar editor={pageEditor} />}
      <MemoizedTitleEditor
        pageId={pageId}
        slugId={slugId}
        title={title}
        spaceSlug={spaceSlug}
        editable={editable}
      />
      <MemoizedPageEditor
        pageId={pageId}
        editable={editable}
        content={content}
      />
    </Container>
  );
}
