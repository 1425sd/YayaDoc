import { Button, Container } from "@mantine/core";
import {
  IconArrowRight,
  IconBrush,
  IconFileDescription,
  IconMap2,
  IconSparkles,
} from "@tabler/icons-react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getAppName } from "@/lib/config.ts";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { useCreatePageMutation } from "@/features/page/queries/page-query.ts";
import {
  buildBoardUrl,
  buildMindMapUrl,
  buildPageUrl,
} from "@/features/page/page.utils.ts";
import {
  BOARD_CONTENT_FORMAT,
  BOARD_PAGE_ICON,
  DEFAULT_BOARD_TITLE,
  createEmptyBoardContent,
} from "@/features/board/lib/board-content.ts";
import {
  createEmptyMindMapContent,
  DEFAULT_MINDMAP_TITLE,
  MINDMAP_CONTENT_FORMAT,
  MINDMAP_PAGE_ICON,
} from "@/features/mindmap/lib/mindmap-content.ts";
import classes from "./board-create-page.module.css";

export default function BoardCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);
  const createPageMutation = useCreatePageMutation();
  const [creating, setCreating] = useState<"note" | "board" | "mindmap" | null>(
    null,
  );

  if (!space) {
    return null;
  }

  const handleCreateNote = async () => {
    setCreating("note");
    try {
      const page = await createPageMutation.mutateAsync({
        spaceId: space.id,
      });
      navigate(buildPageUrl(space.slug, page.slugId, page.title));
    } finally {
      setCreating(null);
    }
  };

  const handleCreateBoard = async () => {
    setCreating("board");
    try {
      const page = await createPageMutation.mutateAsync({
        spaceId: space.id,
        title: DEFAULT_BOARD_TITLE,
        icon: BOARD_PAGE_ICON,
        content: createEmptyBoardContent(),
        format: BOARD_CONTENT_FORMAT,
      });
      navigate(buildBoardUrl(space.slug, page.slugId, page.title));
    } finally {
      setCreating(null);
    }
  };

  const handleCreateMindMap = async () => {
    setCreating("mindmap");
    try {
      const page = await createPageMutation.mutateAsync({
        spaceId: space.id,
        title: DEFAULT_MINDMAP_TITLE,
        icon: MINDMAP_PAGE_ICON,
        content: createEmptyMindMapContent(),
        format: MINDMAP_CONTENT_FORMAT,
        contentType: "mindmap",
      });
      navigate(buildMindMapUrl(space.slug, page.slugId, page.title));
    } finally {
      setCreating(null);
    }
  };

  return (
    <>
      <Helmet>
        <title>
          {t("创建")} - {space.name} - {getAppName()}
        </title>
      </Helmet>

      <Container size="xl" className={classes.page}>
        <section className={classes.hero}>
          <div className={classes.eyebrow}>
            <IconSparkles size={14} />
            {space.name}
          </div>
          <h1 className={classes.title}>{t("选择你要创建的内容")}</h1>
          <p className={classes.subtitle}>
            {t(
              "你可以先创建文档来沉淀结构化内容，也可以打开白板进行视觉创作，或者直接进入独立的思维导图工作区来梳理分支想法。",
            )}
          </p>

          <div className={classes.grid}>
            <article className={`${classes.card} ${classes.noteCard}`}>
              <div className={classes.iconWrap}>
                <IconFileDescription size={28} stroke={1.8} />
              </div>
              <h2 className={classes.cardTitle}>{t("创建文档")}</h2>
              <p className={classes.cardText}>
                {t("适合会议纪要、方案说明、知识沉淀和需要结构化表达的页面。")}
              </p>
              <div className={classes.featureList}>
                <span className={classes.feature}>{t("富文本编辑")}</span>
                <span className={classes.feature}>{t("表格与嵌入")}</span>
                <span className={classes.feature}>{t("评论协作")}</span>
              </div>
              <div className={classes.actions}>
                <Button
                  size="md"
                  radius="xl"
                  variant="white"
                  rightSection={<IconArrowRight size={16} />}
                  onClick={handleCreateNote}
                  loading={creating === "note"}
                >
                  {t("创建文档")}
                </Button>
                <span className={classes.meta}>{t("适合结构化内容")}</span>
              </div>
            </article>

            <article className={`${classes.card} ${classes.boardCard}`}>
              <div className={classes.iconWrap}>
                <IconBrush size={28} stroke={1.8} />
              </div>
              <h2 className={classes.cardTitle}>{t("创建白板")}</h2>
              <p className={classes.cardText}>
                {t("适合草图、流程图、便签整理、连线表达和快速视觉化发散。")}
              </p>
              <div className={classes.featureList}>
                <span className={classes.feature}>{t("绘图与图形工具")}</span>
                <span className={classes.feature}>{t("自由布局")}</span>
                <span className={classes.feature}>{t("图片与图标")}</span>
              </div>
              <div className={classes.actions}>
                <Button
                  size="md"
                  radius="xl"
                  color="orange"
                  rightSection={<IconArrowRight size={16} />}
                  onClick={handleCreateBoard}
                  loading={creating === "board"}
                >
                  {t("创建白板")}
                </Button>
                <span className={classes.meta}>{t("适合视觉创作")}</span>
              </div>
            </article>

            <article className={`${classes.card} ${classes.mindMapCard}`}>
              <div className={classes.iconWrap}>
                <IconMap2 size={28} stroke={1.8} />
              </div>
              <h2 className={classes.cardTitle}>{t("创建思维导图")}</h2>
              <p className={classes.cardText}>
                {t(
                  "适合梳理分支结构、搭建主题层级，并用专属布局快速组织复杂想法。",
                )}
              </p>
              <div className={classes.featureList}>
                <span className={classes.feature}>{t("分支编辑")}</span>
                <span className={classes.feature}>{t("多种布局")}</span>
                <span className={classes.feature}>{t("自动保存")}</span>
              </div>
              <div className={classes.actions}>
                <Button
                  size="md"
                  radius="xl"
                  color="violet"
                  rightSection={<IconArrowRight size={16} />}
                  onClick={handleCreateMindMap}
                  loading={creating === "mindmap"}
                >
                  {t("创建思维导图")}
                </Button>
                <span className={classes.meta}>{t("适合发散与梳理")}</span>
              </div>
            </article>
          </div>
        </section>
      </Container>
    </>
  );
}
