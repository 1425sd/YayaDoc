import React from "react";
import { Avatar } from "@mantine/core";
import { getAvatarUrl } from "@/lib/config.ts";
import { AvatarIconType } from "@/features/attachments/types/attachment.types.ts";
import { DefaultAvatarIcon } from "@/components/ui/default-avatar.tsx";

interface CustomAvatarProps {
  avatarUrl?: string;
  name: string;
  color?: string;
  size?: string | number;
  radius?: string | number;
  variant?: string;
  style?: any;
  component?: any;
  type?: AvatarIconType;
  mt?: string | number;
}

export const CustomAvatar = React.forwardRef<HTMLDivElement, CustomAvatarProps>(
  ({ avatarUrl, name, type = AvatarIconType.AVATAR, ...props }, ref) => {
    const avatarLink = getAvatarUrl(avatarUrl, type);
    const showDefaultUserAvatar =
      !avatarLink && (type === AvatarIconType.AVATAR || !type);

    return (
      <Avatar
        ref={ref}
        src={avatarLink}
        name={showDefaultUserAvatar ? undefined : name}
        alt={name}
        color={showDefaultUserAvatar ? undefined : "initials"}
        {...props}
      >
        {showDefaultUserAvatar ? (
          <DefaultAvatarIcon seed={name} title={name || "Default avatar"} />
        ) : null}
      </Avatar>
    );
  },
);
