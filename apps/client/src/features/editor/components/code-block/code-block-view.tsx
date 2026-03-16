import { NodeViewContent, NodeViewProps, NodeViewWrapper } from "@tiptap/react";
import { ActionIcon, Select, Tooltip } from "@mantine/core";
import { CopyButton } from "@/components/common/copy-button";
import { useEffect, useMemo, useState } from "react";
import { IconCheck, IconCode, IconCopy, IconSparkles } from "@tabler/icons-react";
import classes from "./code-block.module.css";
import React from "react";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";

const MermaidView = React.lazy(
  () => import("@/features/editor/components/code-block/mermaid-view.tsx"),
);

type CodeBlockTheme = "graphite" | "midnight" | "forest" | "paper";
const AUTO_LANGUAGE_VALUE = "__auto__";

const POPULAR_LANGUAGES = [
  "bash",
  "javascript",
  "typescript",
  "tsx",
  "jsx",
  "python",
  "json",
  "yaml",
  "sql",
  "html",
  "css",
  "markdown",
  "go",
  "rust",
  "java",
  "php",
  "mermaid",
] as const;

const LANGUAGE_LABELS: Record<string, string> = {
  bash: "Bash",
  csharp: "C#",
  cpp: "C++",
  css: "CSS",
  dockerfile: "Dockerfile",
  go: "Go",
  graphql: "GraphQL",
  html: "HTML",
  javascript: "JavaScript",
  json: "JSON",
  jsx: "JSX",
  markdown: "Markdown",
  mermaid: "Mermaid",
  plaintext: "Plain text",
  powershell: "PowerShell",
  python: "Python",
  rust: "Rust",
  shell: "Shell",
  sql: "SQL",
  tsx: "TSX",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
};

const CODE_BLOCK_THEMES: Array<{
  value: CodeBlockTheme;
  label: string;
  preview: string;
}> = [
  {
    value: "graphite",
    label: "石墨夜色",
    preview:
      "linear-gradient(135deg, #111827 0%, #0f172a 55%, #1e293b 100%)",
  },
  {
    value: "midnight",
    label: "深海蓝调",
    preview:
      "linear-gradient(135deg, #08111f 0%, #0b1730 55%, #122447 100%)",
  },
  {
    value: "forest",
    label: "松影墨绿",
    preview:
      "linear-gradient(135deg, #081512 0%, #0d1b17 52%, #143129 100%)",
  },
  {
    value: "paper",
    label: "纸感浅色",
    preview:
      "linear-gradient(135deg, #fffdf7 0%, #f7f1e3 55%, #ebe2cf 100%)",
  },
];

function formatLanguageLabel(language: string | null | undefined) {
  if (!language) {
    return "Auto";
  }

  return (
    LANGUAGE_LABELS[language] ||
    language
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function detectLanguage(lowlight: any, code: string) {
  if (!code.trim()) {
    return null;
  }

  try {
    const result = lowlight.highlightAuto(code);
    return result?.data?.language || result?.language || null;
  } catch {
    return null;
  }
}

export default function CodeBlockView(props: NodeViewProps) {
  const { t } = useTranslation();
  const { node, updateAttributes, extension, editor, getPos } = props;
  const { language, theme } = node.attrs;
  const [isSelected, setIsSelected] = useState(false);
  const languageValue = language || null;
  const codeTheme = (theme as CodeBlockTheme) || "graphite";

  const detectedLanguage = useMemo(
    () => detectLanguage(extension.options.lowlight, node.textContent),
    [extension.options.lowlight, node.textContent],
  );
  const languageOptions = useMemo(() => {
    const languages = extension.options.lowlight.listLanguages();

    const mappedLanguages = [...languages]
      .sort((left, right) => {
        const leftPopularIndex = POPULAR_LANGUAGES.indexOf(left as never);
        const rightPopularIndex = POPULAR_LANGUAGES.indexOf(right as never);

        if (leftPopularIndex !== -1 || rightPopularIndex !== -1) {
          if (leftPopularIndex === -1) {
            return 1;
          }
          if (rightPopularIndex === -1) {
            return -1;
          }

          return leftPopularIndex - rightPopularIndex;
        }

        return formatLanguageLabel(left).localeCompare(formatLanguageLabel(right));
      })
      .map((item) => ({
        value: item,
        label: formatLanguageLabel(item),
      }));

    return [
      {
        value: AUTO_LANGUAGE_VALUE,
        label: detectedLanguage
          ? `自动识别 · ${formatLanguageLabel(detectedLanguage)}`
          : "自动识别",
      },
      ...mappedLanguages,
    ];
  }, [detectedLanguage, extension.options.lowlight]);
  const displayedLanguage = languageValue || detectedLanguage;
  const selectValue = languageValue || AUTO_LANGUAGE_VALUE;
  const languageBadgeLabel = languageValue
    ? formatLanguageLabel(languageValue)
    : detectedLanguage
      ? `Auto · ${formatLanguageLabel(detectedLanguage)}`
      : "Auto detect";
  const selectPlaceholder = detectedLanguage
    ? `自动识别 · ${formatLanguageLabel(detectedLanguage)}`
    : "自动识别";

  useEffect(() => {
    const updateSelection = () => {
      const { state } = editor;
      const { from, to } = state.selection;
      // Check if the selection intersects with the node's range
      const isNodeSelected =
        (from >= getPos() && from < getPos() + node.nodeSize) ||
        (to > getPos() && to <= getPos() + node.nodeSize);
      setIsSelected(isNodeSelected);
    };

    updateSelection();
    editor.on("selectionUpdate", updateSelection);
    return () => {
      editor.off("selectionUpdate", updateSelection);
    };
  }, [editor, getPos, node.nodeSize]);

  function changeLanguage(nextLanguage: string | null) {
    updateAttributes({
      language:
        !nextLanguage || nextLanguage === AUTO_LANGUAGE_VALUE
          ? null
          : nextLanguage,
    });
  }

  function changeTheme(nextTheme: CodeBlockTheme) {
    updateAttributes({
      theme: nextTheme,
    });
  }

  return (
    <NodeViewWrapper
      className={`${classes.root} codeBlock`}
      data-code-theme={codeTheme}
      data-selected={isSelected || undefined}
      data-editable={editor.isEditable || undefined}
    >
      <div contentEditable={false} className={classes.header}>
        <div className={classes.metaGroup}>
          <span
            className={classes.languageBadge}
            data-auto={(!languageValue && displayedLanguage) || undefined}
          >
            {!languageValue && detectedLanguage ? (
              <IconSparkles size={14} />
            ) : (
              <IconCode size={14} />
            )}
            <span>{languageBadgeLabel}</span>
          </span>

          {!editor.isEditable && (
            <span className={classes.themeBadge}>
              {
                CODE_BLOCK_THEMES.find((item) => item.value === codeTheme)
                  ?.label
              }
            </span>
          )}
        </div>

        <div className={classes.controlsGroup}>
          {editor.isEditable && (
            <>
              <div className={classes.themeRail} aria-label="代码块主题">
                {CODE_BLOCK_THEMES.map((item) => (
                  <Tooltip key={item.value} label={item.label} withArrow>
                    <button
                      type="button"
                      className={classes.themeSwatch}
                      data-active={item.value === codeTheme || undefined}
                      aria-label={item.label}
                      aria-pressed={item.value === codeTheme}
                      style={{ "--swatch-bg": item.preview } as React.CSSProperties}
                      onClick={() => changeTheme(item.value)}
                    />
                  </Tooltip>
                ))}
              </div>

              <Select
                placeholder={selectPlaceholder}
                checkIconPosition="right"
                data={languageOptions}
                value={selectValue}
                onChange={changeLanguage}
                searchable
                nothingFoundMessage="没有找到语言"
                className={classes.select}
                classNames={{
                  input: classes.selectInput,
                  section: classes.selectSection,
                  dropdown: classes.selectDropdown,
                  option: classes.selectOption,
                }}
              />
            </>
          )}

          <CopyButton value={node?.textContent} timeout={2000}>
            {({ copied, copy }) => (
              <Tooltip
                label={copied ? t("Copied") : t("Copy")}
                withArrow
                position="right"
              >
                <ActionIcon
                  variant="subtle"
                  onClick={copy}
                  className={classes.copyButton}
                  aria-label={copied ? t("Copied") : t("Copy")}
                >
                  {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </div>
      </div>

      <pre
        className={classes.pre}
        spellCheck="false"
        hidden={
          ((language === "mermaid" && !editor.isEditable) ||
            (language === "mermaid" && !isSelected)) &&
          node.textContent.length > 0
        }
      >
        {/* @ts-ignore */}
        <NodeViewContent
          as="div"
          className={`${classes.code} ${displayedLanguage ? `language-${displayedLanguage}` : ""}`}
        />
      </pre>

      {language === "mermaid" && (
        <Suspense fallback={null}>
          <MermaidView props={props} />
        </Suspense>
      )}
    </NodeViewWrapper>
  );
}
