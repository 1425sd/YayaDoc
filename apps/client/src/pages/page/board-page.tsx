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
import { isBoardPageContent } from "@/features/board/lib/board-content.ts";
import { buildPageUrl } from "@/features/page/page.utils.ts";
import { WhiteboardWorkspace } from "@/features/board/components/whiteboard-workspace.tsx";

export default function BoardPage() {
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
          title={t("Board not found")}
          description={t(
            "This board may have been deleted, moved, or you may not have access.",
          )}
          action={
            <Button component={Link} to="/home" variant="default" size="sm" mt="xs">
              {t("Go to homepage")}
            </Button>
          }
        />
      );
    }

    return (
      <EmptyState
        icon={IconAlertTriangle}
        title={t("Failed to load board")}
      />
    );
  }

  if (!space) {
    return <></>;
  }

  if (!isBoardPageContent(page.content)) {
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
      <WhiteboardWorkspace
        page={page}
        editable={page?.permissions?.canEdit ?? false}
      />
    </>
  );
}
