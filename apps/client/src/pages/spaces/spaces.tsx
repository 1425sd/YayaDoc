import { Container, Group } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Helmet } from "react-helmet-async";
import { getAppName } from "@/lib/config";
import { useGetSpacesQuery } from "@/features/space/queries/space-query";
import CreateSpaceModal from "@/features/space/components/create-space-modal";
import { AllSpacesList } from "@/features/space/components/spaces-page";
import { usePaginateAndSearch } from "@/hooks/use-paginate-and-search";
import useUserRole from "@/hooks/use-user-role";
import shellClasses from "@/components/layouts/global/page-shell.module.css";

export default function Spaces() {
  const { t } = useTranslation();
  const { isAdmin } = useUserRole();
  const { search, cursor, goNext, goPrev, handleSearch } = usePaginateAndSearch();

  const { data } = useGetSpacesQuery({
    cursor,
    limit: 30,
    query: search,
  });

  return (
    <>
      <Helmet>
        <title>
          {t("Spaces")} - {getAppName()}
        </title>
      </Helmet>

      <Container size={880} pt="xl">
        <div className={shellClasses.pageShell}>
          <section className={shellClasses.heroPanel}>
            <p className={shellClasses.heroEyebrow}>{t("Directory")}</p>
            <h1 className={shellClasses.heroTitle}>{t("Spaces")}</h1>
            <p className={shellClasses.heroText}>
              {t(
                "Browse every space you belong to, search quickly, and jump into the right context without breaking flow.",
              )}
            </p>
          </section>

          <section className={shellClasses.contentPanel}>
            <div className={shellClasses.sectionHeader}>
              <div>
                <h2 className={shellClasses.sectionLabel}>{t("Spaces")}</h2>
                <p className={shellClasses.sectionText}>
                  {t("Spaces you belong to")}
                </p>
              </div>
              {isAdmin && <CreateSpaceModal />}
            </div>

            <div className={shellClasses.tableCard}>
              <AllSpacesList
                spaces={data?.items || []}
                onSearch={handleSearch}
                hasPrevPage={data?.meta?.hasPrevPage}
                hasNextPage={data?.meta?.hasNextPage}
                onNext={() => goNext(data?.meta?.nextCursor)}
                onPrev={goPrev}
              />
            </div>
          </section>
        </div>
      </Container>
    </>
  );
}
