import { Container } from "@mantine/core";
import SpaceHomeTabs from "@/features/space/components/space-home-tabs.tsx";
import { useParams } from "react-router-dom";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { getAppName } from "@/lib/config.ts";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import shellClasses from "@/components/layouts/global/page-shell.module.css";

export default function SpaceHome() {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);

  return (
    <>
      <Helmet>
        <title>{space?.name || "Overview"} - {getAppName()}</title>
      </Helmet>
      <Container size={880} pt="xl">
        <div className={shellClasses.pageShell}>
          <section className={shellClasses.heroPanel}>
            <p className={shellClasses.heroEyebrow}>{t("Space")}</p>
            <h1 className={shellClasses.heroTitle}>
              {space?.name || t("Overview")}
            </h1>
            <p className={shellClasses.heroText}>
              {t(
                "Track the latest updates in this space and keep your team’s most active work within easy reach.",
              )}
            </p>
          </section>

          {space && (
            <div className={shellClasses.tabsCard}>
              <SpaceHomeTabs />
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
