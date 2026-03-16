import {
  ActionIcon,
  Group,
  Menu,
  Text,
  Tooltip,
  UnstyledButton,
} from "@mantine/core";
import {
  IconAdjustmentsHorizontal,
  IconArrowDown,
  IconDots,
  IconFileExport,
  IconFilePlus,
  IconFolderPlus,
  IconLayoutDashboard,
  IconTrash,
  IconZoomScan,
} from "@tabler/icons-react";
import classes from "./space-sidebar.module.css";
import React from "react";
import { useAtom } from "jotai";
import { treeApiAtom } from "@/features/page/tree/atoms/tree-api-atom.ts";
import { Link, useLocation, useParams } from "react-router-dom";
import clsx from "clsx";
import { useDisclosure } from "@mantine/hooks";
import SpaceSettingsModal from "@/features/space/components/settings-modal.tsx";
import { useGetSpaceBySlugQuery } from "@/features/space/queries/space-query.ts";
import { getSpaceUrl } from "@/lib/config.ts";
import SpaceTree from "@/features/page/tree/components/space-tree.tsx";
import { useSpaceAbility } from "@/features/space/permissions/use-space-ability.ts";
import {
  SpaceCaslAction,
  SpaceCaslSubject,
} from "@/features/space/permissions/permissions.type.ts";
import PageImportModal from "@/features/page/components/page-import-modal.tsx";
import { useTranslation } from "react-i18next";
import { SwitchSpace } from "./switch-space";
import ExportModal from "@/components/common/export-modal";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import { useToggleSidebar } from "@/components/layouts/global/hooks/hooks/use-toggle-sidebar.ts";
import { searchSpotlight } from "@/features/search/constants";
import { buildCreatePageUrl } from "@/features/page/page.utils.ts";

export function SpaceSidebar() {
  const { t } = useTranslation();
  const [tree] = useAtom(treeApiAtom);
  const location = useLocation();
  const [opened, { open: openSettings, close: closeSettings }] =
    useDisclosure(false);
  const [mobileSidebarOpened] = useAtom(mobileSidebarAtom);
  const toggleMobileSidebar = useToggleSidebar(mobileSidebarAtom);

  const { spaceSlug } = useParams();
  const { data: space } = useGetSpaceBySlugQuery(spaceSlug);

  const spaceRules = space?.membership?.permissions;
  const spaceAbility = useSpaceAbility(spaceRules);

  if (!space) {
    return <></>;
  }

  function handleCreatePage() {
    tree?.create({ parentId: null, type: "internal", index: 0 });
  }

  const menuCopy = {
    overview: "查看空间总览与动态",
    search: "全局检索页面与内容",
    settings: "管理成员、权限与配置",
    create: "创建看板/文档/思维导图",
    newPage: "快速新建一页空白文档",
  };

  return (
    <>
      <div className={classes.navbar}>
        <div
          className={classes.section}
          style={{
            border: "none",
            marginTop: 2,
            marginBottom: 3,
          }}
        >
          <SwitchSpace
            spaceName={space?.name}
            spaceSlug={space?.slug}
            spaceIcon={space?.logo}
          />
        </div>

        <div className={clsx(classes.section, classes.sectionMenu)}>
          <div className={classes.menuItems}>
            <UnstyledButton
              component={Link}
              to={getSpaceUrl(spaceSlug)}
              className={clsx(
                classes.menu,
                location.pathname.toLowerCase() === getSpaceUrl(spaceSlug)
                  ? classes.activeButton
                  : "",
              )}
            >
              <div className={classes.menuItemInner}>
                <IconLayoutDashboard
                  size={19}
                  className={clsx(
                    classes.menuItemIcon,
                    classes.menuItemIconOverview,
                  )}
                  stroke={2.15}
                />
                <div className={classes.menuText}>
                  <span className={classes.menuLabel}>{t("Overview")}</span>
                  <span className={classes.menuDesc}>{menuCopy.overview}</span>
                </div>
              </div>
            </UnstyledButton>

            <UnstyledButton
              className={classes.menu}
              onClick={searchSpotlight.open}
            >
              <div className={classes.menuItemInner}>
                <IconZoomScan
                  size={19}
                  className={clsx(
                    classes.menuItemIcon,
                    classes.menuItemIconSearch,
                  )}
                  stroke={2.15}
                />
                <div className={classes.menuText}>
                  <span className={classes.menuLabel}>{t("Search")}</span>
                  <span className={classes.menuDesc}>{menuCopy.search}</span>
                </div>
                <span className={classes.menuMeta}>Ctrl K</span>
              </div>
            </UnstyledButton>

            <UnstyledButton className={classes.menu} onClick={openSettings}>
              <div className={classes.menuItemInner}>
                <IconAdjustmentsHorizontal
                  size={19}
                  className={clsx(
                    classes.menuItemIcon,
                    classes.menuItemIconSettings,
                  )}
                  stroke={2.15}
                />
                <div className={classes.menuText}>
                  <span className={classes.menuLabel}>{t("Space settings")}</span>
                  <span className={classes.menuDesc}>{menuCopy.settings}</span>
                </div>
              </div>
            </UnstyledButton>

            {spaceAbility.can(
              SpaceCaslAction.Manage,
              SpaceCaslSubject.Page,
            ) && (
              <UnstyledButton
                component={Link}
                to={buildCreatePageUrl(spaceSlug)}
                className={classes.menu}
              >
                <div className={classes.menuItemInner}>
                  <IconFolderPlus
                    size={19}
                    className={clsx(
                      classes.menuItemIcon,
                      classes.menuItemIconCreate,
                    )}
                    stroke={2.15}
                  />
                  <div className={classes.menuText}>
                    <span className={classes.menuLabel}>{t("Create")}</span>
                    <span className={classes.menuDesc}>{menuCopy.create}</span>
                  </div>
                  <span className={classes.menuMeta}>NEW</span>
                </div>
              </UnstyledButton>
            )}

            {spaceAbility.can(
              SpaceCaslAction.Manage,
              SpaceCaslSubject.Page,
            ) && (
              <UnstyledButton
                className={classes.menu}
                onClick={() => {
                  handleCreatePage();
                  if (mobileSidebarOpened) {
                    toggleMobileSidebar();
                  }
                }}
              >
                <div className={classes.menuItemInner}>
                  <IconFilePlus
                    size={19}
                    className={clsx(
                      classes.menuItemIcon,
                      classes.menuItemIconNewPage,
                    )}
                    stroke={2.15}
                  />
                  <div className={classes.menuText}>
                    <span className={classes.menuLabel}>{t("New page")}</span>
                    <span className={classes.menuDesc}>{menuCopy.newPage}</span>
                  </div>
                  <span className={classes.menuMeta}>+1</span>
                </div>
              </UnstyledButton>
            )}
          </div>
        </div>

        <div className={clsx(classes.section, classes.sectionPages)}>
          <Group className={classes.pagesHeader} justify="space-between">
            <Text size="xs" fw={500} c="dimmed">
              {t("Pages")}
            </Text>

            {spaceAbility.can(
              SpaceCaslAction.Manage,
              SpaceCaslSubject.Page,
            ) && (
              <Group gap="xs">
                <SpaceMenu spaceId={space.id} onSpaceSettings={openSettings} />

                <Tooltip label={t("Create page")} withArrow position="right">
                  <ActionIcon
                    variant="default"
                    size={18}
                    onClick={handleCreatePage}
                    aria-label={t("Create page")}
                  >
                    <IconFilePlus />
                  </ActionIcon>
                </Tooltip>
              </Group>
            )}
          </Group>

          <div className={classes.pages}>
            <SpaceTree
              spaceId={space.id}
              readOnly={spaceAbility.cannot(
                SpaceCaslAction.Manage,
                SpaceCaslSubject.Page,
              )}
            />
          </div>
        </div>
      </div>

      <SpaceSettingsModal
        opened={opened}
        onClose={closeSettings}
        spaceId={space?.slug}
      />
    </>
  );
}

interface SpaceMenuProps {
  spaceId: string;
  onSpaceSettings: () => void;
}
function SpaceMenu({ spaceId, onSpaceSettings }: SpaceMenuProps) {
  const { t } = useTranslation();
  const { spaceSlug } = useParams();
  const [importOpened, { open: openImportModal, close: closeImportModal }] =
    useDisclosure(false);
  const [exportOpened, { open: openExportModal, close: closeExportModal }] =
    useDisclosure(false);

  return (
    <>
      <Menu width={200} shadow="md" withArrow>
        <Menu.Target>
          <Tooltip
            label={t("Import pages & space settings")}
            withArrow
            position="top"
          >
            <ActionIcon
              variant="default"
              size={18}
              aria-label={t("Space menu")}
            >
              <IconDots />
            </ActionIcon>
          </Tooltip>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Item
            onClick={openImportModal}
            leftSection={<IconArrowDown size={16} />}
          >
            {t("Import pages")}
          </Menu.Item>

          <Menu.Item
            onClick={openExportModal}
            leftSection={<IconFileExport size={16} />}
          >
            {t("Export space")}
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            onClick={onSpaceSettings}
            leftSection={<IconAdjustmentsHorizontal size={16} />}
          >
            {t("Space settings")}
          </Menu.Item>

          <Menu.Item
            component={Link}
            to={`/s/${spaceSlug}/trash`}
            leftSection={<IconTrash size={16} />}
          >
            {t("Trash")}
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <PageImportModal
        spaceId={spaceId}
        open={importOpened}
        onClose={closeImportModal}
      />

      <ExportModal
        type="space"
        id={spaceId}
        open={exportOpened}
        onClose={closeExportModal}
      />
    </>
  );
}
