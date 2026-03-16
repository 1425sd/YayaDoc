import { PageContentFormat } from "@/features/page/types/page.types.ts";

export const BOARD_PAGE_ICON = "🧠";
export const DEFAULT_BOARD_TITLE = "Untitled board";

export function createEmptyBoardContent() {
  return {
    type: "doc",
    content: [
      {
        type: "excalidraw",
        attrs: {
          title: "board.excalidraw.svg",
          align: "center",
          boardMode: true,
        },
      },
    ],
  };
}

export function getBoardNode(content: any) {
  if (!content || content.type !== "doc" || !Array.isArray(content.content)) {
    return null;
  }

  return (
    content.content.find(
      (node: any) =>
        node?.type === "excalidraw" && node?.attrs?.boardMode === true,
    ) || null
  );
}

export function isBoardPageContent(content: any) {
  return Boolean(getBoardNode(content));
}

export function upsertBoardContent(content: any, attrs: Record<string, any>) {
  const currentContent =
    content && content.type === "doc" && Array.isArray(content.content)
      ? content
      : createEmptyBoardContent();

  const nextNodes = [...currentContent.content];
  const boardNodeIndex = nextNodes.findIndex(
    (node: any) =>
      node?.type === "excalidraw" && node?.attrs?.boardMode === true,
  );

  const nextBoardNode = {
    type: "excalidraw",
    attrs: {
      ...(boardNodeIndex >= 0 ? nextNodes[boardNodeIndex]?.attrs : {}),
      ...attrs,
      boardMode: true,
    },
  };

  if (boardNodeIndex >= 0) {
    nextNodes[boardNodeIndex] = nextBoardNode;
  } else {
    nextNodes.unshift(nextBoardNode);
  }

  return {
    ...currentContent,
    content: nextNodes,
  };
}

export const BOARD_CONTENT_FORMAT = PageContentFormat.JSON;
