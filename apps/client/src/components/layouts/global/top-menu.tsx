import {
  Group,
  Menu,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconBrightnessFilled,
  IconBrush,
  IconCheck,
  IconChevronDown,
  IconDeviceDesktop,
  IconLogout,
  IconMoon,
  IconSettings,
  IconSun,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import { useAtom } from "jotai";
import { currentUserAtom } from "@/features/user/atoms/current-user-atom.ts";
import { Link } from "react-router-dom";
import APP_ROUTE from "@/lib/app-route.ts";
import useAuth from "@/features/auth/hooks/use-auth.ts";
import { CustomAvatar } from "@/components/ui/custom-avatar.tsx";
import { useTranslation } from "react-i18next";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import { getUserRoleLabel } from "@/features/workspace/types/user-role-data.ts";
import classes from "./top-menu.module.css";

export default function TopMenu() {
  const { t } = useTranslation();
  const [currentUser] = useAtom(currentUserAtom);
  const { logout } = useAuth();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const user = currentUser?.user;
  const workspace = currentUser?.workspace;

  if (!user || !workspace) {
    return <></>;
  }

  const roleLabel = t(getUserRoleLabel(user.role) ?? "Member");

  return (
    <Menu
      width={320}
      position="bottom-end"
      withArrow
      shadow="lg"
      offset={10}
      classNames={{
        arrow: classes.arrow,
        divider: classes.divider,
        dropdown: classes.dropdown,
        item: classes.item,
        itemLabel: classes.itemLabel,
        itemSection: classes.itemSection,
        label: classes.label,
      }}
    >
      <Menu.Target>
        <UnstyledButton className={classes.trigger}>
          <Group gap={10} wrap={"nowrap"}>
            <CustomAvatar
              avatarUrl={workspace?.logo}
              name={workspace?.name}
              variant="filled"
              size={34}
              radius="xl"
              style={{ flexShrink: 0 }}
              type={AvatarIconType.WORKSPACE_ICON}
            />
            <div className={classes.triggerMeta}>
              <Text className={classes.triggerTitle} lineClamp={1}>
                {workspace?.name}
              </Text>
              <Text className={classes.triggerSubtitle} lineClamp={1}>
                {t("Workspace")}
              </Text>
            </div>
            <div className={classes.triggerChevron}>
              <IconChevronDown size={14} stroke={2} />
            </div>
          </Group>
        </UnstyledButton>
      </Menu.Target>
      <Menu.Dropdown>
        <div className={classes.panel}>
          <Menu.Label>{t("Workspace")}</Menu.Label>

          <Menu.Item
            component={Link}
            to={APP_ROUTE.SETTINGS.WORKSPACE.GENERAL}
            leftSection={<IconSettings size={16} />}
          >
            {t("Workspace settings")}
          </Menu.Item>

          <Menu.Item
            component={Link}
            to={APP_ROUTE.SETTINGS.WORKSPACE.MEMBERS}
            leftSection={<IconUsers size={16} />}
          >
            {t("Manage members")}
          </Menu.Item>

          <Menu.Divider />

          <Menu.Label>{t("Account")}</Menu.Label>

          <Menu.Item
            component={Link}
            to={APP_ROUTE.SETTINGS.ACCOUNT.PROFILE}
            className={classes.profileItem}
          >
            <div className={classes.profileSummary}>
              <Group
                gap={12}
                wrap="nowrap"
                className={classes.profileIdentity}
              >
                <CustomAvatar
                  size={40}
                  radius="xl"
                  avatarUrl={user.avatarUrl}
                  name={user.name}
                />

                <div className={classes.profileMeta}>
                  <Text className={classes.profileName} lineClamp={1}>
                    {user.name}
                  </Text>
                  <Text className={classes.profileEmail} truncate="end">
                    {user.email}
                  </Text>
                </div>
              </Group>

              <span className={classes.roleBadge}>{roleLabel}</span>
            </div>
          </Menu.Item>

          <Menu.Item
            component={Link}
            to={APP_ROUTE.SETTINGS.ACCOUNT.PROFILE}
            leftSection={<IconUserCircle size={16} />}
          >
            {t("My profile")}
          </Menu.Item>

          <Menu.Item
            component={Link}
            to={APP_ROUTE.SETTINGS.ACCOUNT.PREFERENCES}
            leftSection={<IconBrush size={16} />}
          >
            {t("My preferences")}
          </Menu.Item>

          <Menu.Sub>
            <Menu.Sub.Target>
              <Menu.Sub.Item
                leftSection={<IconBrightnessFilled size={16} />}
                className={classes.themeTrigger}
              >
                {t("Theme")}
              </Menu.Sub.Item>
            </Menu.Sub.Target>

            <Menu.Sub.Dropdown className={classes.subDropdown}>
              <Menu.Item
                onClick={() => setColorScheme("light")}
                leftSection={<IconSun size={16} />}
                rightSection={
                  colorScheme === "light" ? (
                    <IconCheck
                      size={14}
                      stroke={2.6}
                      className={classes.checkIcon}
                    />
                  ) : null
                }
              >
                {t("Light")}
              </Menu.Item>
              <Menu.Item
                onClick={() => setColorScheme("dark")}
                leftSection={<IconMoon size={16} />}
                rightSection={
                  colorScheme === "dark" ? (
                    <IconCheck
                      size={14}
                      stroke={2.6}
                      className={classes.checkIcon}
                    />
                  ) : null
                }
              >
                {t("Dark")}
              </Menu.Item>
              <Menu.Item
                onClick={() => setColorScheme("auto")}
                leftSection={<IconDeviceDesktop size={16} />}
                rightSection={
                  colorScheme === "auto" ? (
                    <IconCheck
                      size={14}
                      stroke={2.6}
                      className={classes.checkIcon}
                    />
                  ) : null
                }
              >
                {t("System settings")}
              </Menu.Item>
            </Menu.Sub.Dropdown>
          </Menu.Sub>
        </div>

        <div className={classes.footerPanel}>
          <Menu.Item
            onClick={logout}
            leftSection={<IconLogout size={16} />}
            className={classes.logoutItem}
          >
            {t("Logout")}
          </Menu.Item>
        </div>
      </Menu.Dropdown>
    </Menu>
  );
}
