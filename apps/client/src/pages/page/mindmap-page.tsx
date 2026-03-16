import { Navigate, useParams } from "react-router-dom";
import { usePageQuery } from "@/features/page/queries/page-query";
import { Helmet } from "react-helmet-async";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { useTranslation } from "react-i18next";
import { EmptyState } from "@/components/ui/empty-state.tsx";
import { IconAlertTriangle, IconFileOff } from "@tabler/icons-react";
import { Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { extractPageSlugId } from "@/lib";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { isMindMapPageContent } from "@/features/mindmap/lib/mindmap-content.ts";
import { MindMapWorkspace } from "@/features/mindmap/components/mindmap-workspace.tsx";

export default function MindMapPage() {
  const { t } = useTranslation();
  const { pageSlug } = useParams();

  const {
    data: page,
    isLoading,
    isError,
    error,
  } = usePageQuery({ pageId: extractPageSlugId(pageSlug) });
  const { data: space } = useGetSpaceBySlugQuery(page?.space?.slug);

  if (isLoading) {
    return <></>;
  }

  if (isError || !page) {
    if ([401, 403, 404].includes(error?.["status"])) {
      return (
        <EmptyState
          icon={IconFileOff}
          title={t("未找到思维导图")}
          description={t(
            "这张思维导图可能已被删除、移动，或者你没有访问权限。",
          )}
          action={
            <Button
              component={Link}
              to="/home"
              variant="default"
              size="sm"
              mt="xs"
            >
              {t("返回首页")}
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState icon={IconAlertTriangle} title={t("思维导图加载失败")} />
    );
  }

  if (!space) {
    return <></>;
  }

  if (!isMindMapPageContent(page.content)) {
    return (
      <Navigate
        replace
        to={buildPageUrl(page?.space?.slug, page.slugId, page.title)}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${page?.icon || ""}  ${page?.title || t("untitled")}`}</title>
      </Helmet>
      <MindMapWorkspace
        page={page}
        editable={page?.permissions?.canEdit ?? false}
      />
    </>
  );
}
