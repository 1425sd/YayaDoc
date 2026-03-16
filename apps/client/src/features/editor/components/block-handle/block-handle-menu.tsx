import { ActionIcon, Menu } from "@mantine/core";
import {
  IconBlockquote,
  IconCode,
  IconCopy,
  IconCut,
  IconDots,
  IconH1,
  IconH2,
  IconIndentIncrease,
  IconList,
  IconListNumbers,
  IconPlus,
  IconTrash,
  IconTypography,
} from "@tabler/icons-react";
import type { Editor } from "@tiptap/react";
import { isNodeSelection } from "@tiptap/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAtom } from "jotai";
import { isCellSelection, isTextSelected } from "@docmost/editor-ext";
import { showManualBubbleMenuAtom } from "@/features/editor/atoms/editor-atoms";
import classes from "./block-handle-menu.module.css";

type Props = { editor: Editor };

export function BlockHandleMenu({ editor }: Props) {
  const [showManualBubbleMenu, setShowManualBubbleMenu] = useAtom(
    showManualBubbleMenuAtom,
  );
  const [open, setOpen] = useState(false);
  const [top, setTop] = useState(0);
  const [left, setLeft] = useState(0);
  const [blockPos, setBlockPos] = useState<number | null>(null);
  const skipNextMenuToggleRef = useRef(false);
  const hideHandleTimeoutRef = useRef<number | null>(null);
  const isHoveringHandleRef = useRef(false);

  const editorEl = useMemo(() => editor.view.dom as HTMLElement, [editor]);

  const clearHideHandleTimeout = () => {
    if (hideHandleTimeoutRef.current) {
      window.clearTimeout(hideHandleTimeoutRef.current);
      hideHandleTimeoutRef.current = null;
    }
  };

  const scheduleHideHandle = () => {
    clearHideHandleTimeout();
    hideHandleTimeoutRef.current = window.setTimeout(() => {
      if (!open && !isHoveringHandleRef.current) {
        setBlockPos(null);
      }
    }, 180);
  };

  useEffect(() => {
    const isBlock = (el: Element | null) => {
      if (!el) return false;
      const tag = el.tagName.toLowerCase();
      return [
        "p",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "blockquote",
        "pre",
        "ul",
        "ol",
        "li",
        "table",
      ].includes(tag);
    };

    const onMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !editorEl.contains(target)) return;
      clearHideHandleTimeout();

      let node: HTMLElement | null = target;
      while (node && node !== editorEl && !isBlock(node)) {
        node = node.parentElement;
      }

      if (!node || node === editorEl) return;

      const rect = node.getBoundingClientRect();
      const rootRect = editorEl.getBoundingClientRect();
      const y = rect.top - rootRect.top + editorEl.scrollTop + 2;
      const x = -34;

      let pos: number | null = null;
      try {
        pos = editor.view.posAtDOM(node, 0);
      } catch {
        pos = null;
      }

      setTop(y);
      setLeft(x);
      setBlockPos(pos);
    };

    const onLeave = () => {
      if (!open && !isHoveringHandleRef.current) {
        scheduleHideHandle();
      }
    };

    editorEl.addEventListener("mousemove", onMove);
    editorEl.addEventListener("mouseleave", onLeave);
    return () => {
      clearHideHandleTimeout();
      editorEl.removeEventListener("mousemove", onMove);
      editorEl.removeEventListener("mouseleave", onLeave);
    };
  }, [editor, editorEl, open]);

  const focusAtBlock = () => {
    if (blockPos == null) return false;
    editor.chain().focus(blockPos).run();
    return true;
  };

  const canToggleTextToolbar = () => {
    const { selection } = editor.state;

    return (
      !selection.empty &&
      !isNodeSelection(selection) &&
      !isCellSelection(selection) &&
      isTextSelected(editor)
    );
  };

  const copyBlock = async () => {
    if (!focusAtBlock()) return;
    const text = editor.state.selection.$from.parent.textContent;
    if (text) await navigator.clipboard.writeText(text);
  };

  const cutBlock = async () => {
    if (!focusAtBlock()) return;
    const text = editor.state.selection.$from.parent.textContent;
    if (text) await navigator.clipboard.writeText(text);
    editor.chain().focus().selectParentNode().deleteSelection().run();
  };

  if (!editor.isEditable || blockPos == null) return null;

  return (
    <div
      className={classes.handleWrap}
      style={{ top, left, zIndex: 40 }}
      onMouseEnter={() => {
        isHoveringHandleRef.current = true;
        clearHideHandleTimeout();
      }}
      onMouseLeave={() => {
        isHoveringHandleRef.current = false;
        if (!open) {
          scheduleHideHandle();
        }
      }}
    >
      <Menu
        withArrow
        width={250}
        shadow="md"
        opened={open}
        onChange={(nextOpen) => {
          if (skipNextMenuToggleRef.current) {
            skipNextMenuToggleRef.current = false;
            return;
          }

          if (nextOpen) {
            clearHideHandleTimeout();
            setShowManualBubbleMenu(false);
          }

          if (!nextOpen && !isHoveringHandleRef.current) {
            scheduleHideHandle();
          }

          setOpen(nextOpen);
        }}
        withinPortal={false}
      >
        <Menu.Target>
          <ActionIcon
            variant="default"
            className={classes.handle}
            aria-label="Block actions"
            onMouseDown={(e) => e.preventDefault()}
            onClick={(event) => {
              if (!canToggleTextToolbar()) {
                setShowManualBubbleMenu(false);
                return;
              }

              event.preventDefault();
              skipNextMenuToggleRef.current = true;
              setOpen(false);
              editor.chain().focus().run();
              const nextShowManualBubbleMenu = !showManualBubbleMenu;
              setShowManualBubbleMenu(nextShowManualBubbleMenu);
              editor.view.dispatch(
                editor.state.tr.setMeta(
                  "manualBubbleMenu",
                  nextShowManualBubbleMenu,
                ),
              );
            }}
            draggable
          >
            <IconDots size={14} />
          </ActionIcon>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label className={classes.menuLabel}>转化为</Menu.Label>
          <Menu.Item leftSection={<IconTypography size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().setParagraph().run()}>段落</Menu.Item>
          <Menu.Item leftSection={<IconH1 size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().toggleHeading({ level: 1 }).run()}>标题 1</Menu.Item>
          <Menu.Item leftSection={<IconH2 size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().toggleHeading({ level: 2 }).run()}>标题 2</Menu.Item>
          <Menu.Item leftSection={<IconList size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().toggleBulletList().run()}>无序列表</Menu.Item>
          <Menu.Item leftSection={<IconListNumbers size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().toggleOrderedList().run()}>有序列表</Menu.Item>
          <Menu.Item leftSection={<IconBlockquote size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().toggleBlockquote().run()}>引用</Menu.Item>
          <Menu.Item leftSection={<IconCode size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().toggleCodeBlock().run()}>代码块</Menu.Item>

          <Menu.Divider />
          <Menu.Item leftSection={<IconCopy size={14} />} onClick={copyBlock}>复制块</Menu.Item>
          <Menu.Item leftSection={<IconCut size={14} />} onClick={cutBlock}>剪切块</Menu.Item>
          <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => focusAtBlock() && editor.chain().focus().selectParentNode().deleteSelection().run()}>删除块</Menu.Item>

          <Menu.Divider />
          <Menu.Item leftSection={<IconIndentIncrease size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().sinkListItem("listItem").run()}>缩进</Menu.Item>
          <Menu.Item leftSection={<IconIndentIncrease size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().liftListItem("listItem").run()}>取消缩进</Menu.Item>
          <Menu.Item leftSection={<IconPlus size={14} />} onClick={() => focusAtBlock() && editor.chain().focus().insertContent("\n").run()}>在下方添加</Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </div>
  );
}
