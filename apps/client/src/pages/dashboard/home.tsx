import { Container, Space } from "@mantine/core";
import HomeTabs from "@/features/home/components/home-tabs";
import SpaceGrid from "@/features/space/components/space-grid.tsx";
import { getAppName } from "@/lib/config.ts";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import shellClasses from "@/components/layouts/global/page-shell.module.css";

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <Helmet>
        <title>
          {t("Home")} - {getAppName()}
        </title>
      </Helmet>
      <Container size={880} pt="xl">
        <div className={shellClasses.pageShell}>
          <section className={shellClasses.heroPanel}>
            <p className={shellClasses.heroEyebrow}>{t("Workspace")}</p>
            <h1 className={shellClasses.heroTitle}>{t("Home")}</h1>
            <p className={shellClasses.heroText}>
              {t(
                "Browse your spaces, jump back into recent work, and keep the whole workspace moving in one place.",
              )}
            </p>
          </section>

          <section className={shellClasses.contentPanel}>
            <div className={shellClasses.sectionHeader}>
              <div>
                <h2 className={shellClasses.sectionLabel}>
                  {t("Spaces you belong to")}
                </h2>
                <p className={shellClasses.sectionText}>
                  {t(
                    "Your most relevant spaces stay close at hand so you can get back to work faster.",
                  )}
                </p>
              </div>
            </div>
            <SpaceGrid />
          </section>

          <Space h="xs" />

          <div className={shellClasses.tabsCard}>
            <HomeTabs />
          </div>
        </div>
      </Container>
    </>
  );
}
