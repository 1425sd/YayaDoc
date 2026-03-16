import {
  ActionIcon,
  Button,
  Popover,
  ScrollArea,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAlignCenter,
  IconAlignJustified,
  IconAlignLeft,
  IconAlignRight,
  IconBlockquote,
  IconBold,
  IconCheck,
  IconChevronDown,
  IconCode,
  IconH1,
  IconH2,
  IconItalic,
  IconList,
  IconListNumbers,
  IconStrikethrough,
  IconUnderline,
} from "@tabler/icons-react";
import { useEditorState } from "@tiptap/react";
import type { Editor } from "@tiptap/react";
import clsx from "clsx";
import { ReactNode, useState } from "react";
import classes from "./top-toolbar.module.css";

type TopToolbarProps = { editor: Editor };

const FONT_SIZE_OPTIONS = [
  { label: "默认", value: null },
  { label: "12", value: "12px" },
  { label: "14", value: "14px" },
  { label: "16", value: "16px" },
  { label: "18", value: "18px" },
  { label: "20", value: "20px" },
  { label: "24", value: "24px" },
  { label: "28", value: "28px" },
  { label: "32", value: "32px" },
];

function getFontSizeLabel(fontSize: string | null | undefined) {
  if (!fontSize) {
    return "16";
  }

  const matchedPixelSize = fontSize.match(/^(\d+(?:\.\d+)?)px$/);
  return matchedPixelSize?.[1] || fontSize;
}

export function TopToolbar({ editor }: TopToolbarProps) {
  const [isBlockTypeOpen, setIsBlockTypeOpen] = useState(false);
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const state = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor.isActive("bold"),
      italic: ctx.editor.isActive("italic"),
      underline: ctx.editor.isActive("underline"),
      strike: ctx.editor.isActive("strike"),
      code: ctx.editor.isActive("code"),
      paragraph: ctx.editor.isActive("paragraph"),
      h1: ctx.editor.isActive("heading", { level: 1 }),
      h2: ctx.editor.isActive("heading", { level: 2 }),
      bulletList: ctx.editor.isActive("bulletList"),
      orderedList: ctx.editor.isActive("orderedList"),
      blockquote: ctx.editor.isActive("blockquote"),
      callout: ctx.editor.isActive("callout"),
      alignLeft: ctx.editor.isActive({ textAlign: "left" }),
      alignCenter: ctx.editor.isActive({ textAlign: "center" }),
      alignRight: ctx.editor.isActive({ textAlign: "right" }),
      alignJustify: ctx.editor.isActive({ textAlign: "justify" }),
      fontSize: ctx.editor.getAttributes("textStyle").fontSize,
    }),
  });

  const Btn = ({ label, active, onClick, children }: { label: string; active?: boolean; onClick: () => void; children: ReactNode }) => (
    <Tooltip label={label} withArrow>
      <ActionIcon
        variant="subtle"
        size={30}
        aria-label={label}
        className={clsx(classes.iconBtn, { [classes.active]: active })}
        onClick={onClick}
      >
        {children}
      </ActionIcon>
    </Tooltip>
  );

  const toggleHighlightBlock = () => {
    if (editor.isActive("callout")) {
      editor.chain().focus().unsetCallout().run();
      return;
    }

    editor.chain().focus().toggleCallout({ type: "info" }).run();
  };

  const blockLabel = state.h1
    ? "标题 1"
    : state.h2
      ? "标题 2"
      : state.bulletList
        ? "无序列表"
        : state.orderedList
          ? "有序列表"
          : state.blockquote
            ? "引用"
            : "正文";
  const currentFontSizeLabel = getFontSizeLabel(state.fontSize);
  const blockOptions = [
    {
      label: "正文",
      active: state.paragraph && !state.bulletList && !state.orderedList,
      command: () => editor.chain().focus().setParagraph().run(),
    },
    {
      label: "标题 1",
      active: state.h1,
      command: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    {
      label: "标题 2",
      active: state.h2,
      command: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    {
      label: "无序列表",
      active: state.bulletList,
      command: () => editor.chain().focus().toggleBulletList().run(),
    },
    {
      label: "有序列表",
      active: state.orderedList,
      command: () => editor.chain().focus().toggleOrderedList().run(),
    },
    {
      label: "引用",
      active: state.blockquote,
      command: () => editor.chain().focus().toggleBlockquote().run(),
    },
  ];

  return (
    <div className={classes.wrap}>
      <div className={classes.toolbar}>
        <Popover
          opened={isBlockTypeOpen}
          withArrow
          position="bottom-start"
          onChange={setIsBlockTypeOpen}
        >
          <Popover.Target>
            <UnstyledButton
              className={classes.selectBtn}
              onClick={() => setIsBlockTypeOpen(!isBlockTypeOpen)}
            >
              <span>{blockLabel}</span>
              <IconChevronDown size={14} />
            </UnstyledButton>
          </Popover.Target>

          <Popover.Dropdown p={4}>
            <ScrollArea.Autosize mah={220} type="scroll">
              <Button.Group orientation="vertical">
                {blockOptions.map((option) => (
                  <Button
                    key={option.label}
                    variant="subtle"
                    justify="space-between"
                    fullWidth
                    onClick={() => {
                      option.command();
                      setIsBlockTypeOpen(false);
                    }}
                    rightSection={option.active ? <IconCheck size={16} /> : null}
                    style={{ border: "none" }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Button.Group>
            </ScrollArea.Autosize>
          </Popover.Dropdown>
        </Popover>

        <Popover
          opened={isFontSizeOpen}
          withArrow
          position="bottom-start"
          onChange={setIsFontSizeOpen}
        >
          <Popover.Target>
            <UnstyledButton
              className={classes.selectBtn}
              onClick={() => setIsFontSizeOpen(!isFontSizeOpen)}
            >
              <span>{currentFontSizeLabel}</span>
              <IconChevronDown size={14} />
            </UnstyledButton>
          </Popover.Target>

          <Popover.Dropdown p={4}>
            <ScrollArea.Autosize mah={220} type="scroll">
              <Button.Group orientation="vertical">
                {FONT_SIZE_OPTIONS.map((option) => {
                  const isActive =
                    (option.value === null && !state.fontSize) ||
                    option.value === state.fontSize;

                  return (
                    <Button
                      key={option.label}
                      variant="subtle"
                      justify="space-between"
                      fullWidth
                      onClick={() => {
                        if (option.value) {
                          editor.chain().focus().setFontSize(option.value).run();
                        } else {
                          editor.chain().focus().unsetFontSize().run();
                        }
                        setIsFontSizeOpen(false);
                      }}
                      rightSection={isActive ? <IconCheck size={16} /> : null}
                      style={{ border: "none" }}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </Button.Group>
            </ScrollArea.Autosize>
          </Popover.Dropdown>
        </Popover>

        <Tooltip label="高亮块" withArrow>
          <UnstyledButton
            className={clsx(classes.switchBtn, {
              [classes.switchActive]: state.callout,
            })}
            aria-pressed={state.callout}
            onClick={toggleHighlightBlock}
          >
            <span className={classes.switchTrack}>
              <span className={classes.switchThumb} />
            </span>
            <span className={classes.switchLabel}>高亮块</span>
          </UnstyledButton>
        </Tooltip>

        <div className={classes.divider} />

        <div className={classes.group}>
          <Btn label="加粗" active={state.bold} onClick={() => editor.chain().focus().toggleBold().run()}>
            <IconBold size={16} />
          </Btn>
          <Btn label="斜体" active={state.italic} onClick={() => editor.chain().focus().toggleItalic().run()}>
            <IconItalic size={16} />
          </Btn>
          <Btn label="下划线" active={state.underline} onClick={() => editor.chain().focus().toggleUnderline().run()}>
            <IconUnderline size={16} />
          </Btn>
          <Btn label="删除线" active={state.strike} onClick={() => editor.chain().focus().toggleStrike().run()}>
            <IconStrikethrough size={16} />
          </Btn>
          <Btn label="行内代码" active={state.code} onClick={() => editor.chain().focus().toggleCode().run()}>
            <IconCode size={16} />
          </Btn>
        </div>

        <div className={classes.divider} />

        <div className={classes.group}>
          <Btn label="标题 1" active={state.h1} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
            <IconH1 size={16} />
          </Btn>
          <Btn label="标题 2" active={state.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
            <IconH2 size={16} />
          </Btn>
          <Btn label="无序列表" active={state.bulletList} onClick={() => editor.chain().focus().toggleBulletList().run()}>
            <IconList size={16} />
          </Btn>
          <Btn label="有序列表" active={state.orderedList} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
            <IconListNumbers size={16} />
          </Btn>
          <Btn label="引用" active={state.blockquote} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
            <IconBlockquote size={16} />
          </Btn>
        </div>

        <div className={classes.divider} />

        <div className={classes.group}>
          <Btn label="左对齐" active={state.alignLeft} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
            <IconAlignLeft size={16} />
          </Btn>
          <Btn label="居中" active={state.alignCenter} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
            <IconAlignCenter size={16} />
          </Btn>
          <Btn label="右对齐" active={state.alignRight} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
            <IconAlignRight size={16} />
          </Btn>
          <Btn label="两端对齐" active={state.alignJustify} onClick={() => editor.chain().focus().setTextAlign("justify").run()}>
            <IconAlignJustified size={16} />
          </Btn>
        </div>
      </div>
    </div>
  );
}
