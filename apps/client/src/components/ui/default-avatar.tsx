import React from "react";

export interface DefaultAvatarOption {
  id: number;
  alt: string;
}

export const DEFAULT_AVATAR_OPTIONS: DefaultAvatarOption[] = [
  { id: 1, alt: "Avatar 1" },
  { id: 2, alt: "Avatar 2" },
  { id: 3, alt: "Avatar 3" },
  { id: 4, alt: "Avatar 4" },
];

interface DefaultAvatarIconProps {
  avatarId?: number;
  seed?: string | null;
  title?: string;
}

function hashSeed(seed?: string | null) {
  const normalizedSeed = seed?.trim().toLowerCase() || "default-avatar";
  let hash = 0;

  for (let index = 0; index < normalizedSeed.length; index += 1) {
    hash = Math.imul(hash ^ normalizedSeed.charCodeAt(index), 16777619);
  }

  return Math.abs(hash);
}

export function getDefaultAvatarId(seed?: string | null) {
  const avatarIndex = hashSeed(seed) % DEFAULT_AVATAR_OPTIONS.length;
  return DEFAULT_AVATAR_OPTIONS[avatarIndex].id;
}

function SvgFrame({
  children,
  title,
}: {
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 36 36"
      fill="none"
      role={title ? "img" : "presentation"}
      xmlns="http://www.w3.org/2000/svg"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden={title ? undefined : true}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

function AvatarOne({ title }: { title?: string }) {
  return (
    <SvgFrame title={title}>
      <rect width="36" height="36" fill="#ff005b" />
      <rect
        x="0"
        y="0"
        width="36"
        height="36"
        transform="translate(9 -5) rotate(219 18 18) scale(1)"
        fill="#ffb238"
        rx="6"
      />
      <g transform="translate(4.5 -4) rotate(9 18 18)">
        <path
          d="M15 19c2 1 4 1 6 0"
          stroke="#000000"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="10" y="14" width="1.5" height="2" rx="1" fill="#000000" />
        <rect x="24" y="14" width="1.5" height="2" rx="1" fill="#000000" />
      </g>
    </SvgFrame>
  );
}

function AvatarTwo({ title }: { title?: string }) {
  return (
    <SvgFrame title={title}>
      <rect width="36" height="36" fill="#ff7d10" />
      <rect
        x="0"
        y="0"
        width="36"
        height="36"
        transform="translate(5 -1) rotate(55 18 18) scale(1.1)"
        fill="#0a0310"
        rx="6"
      />
      <g transform="translate(7 -6) rotate(-5 18 18)">
        <path
          d="M15 20c2 1 4 1 6 0"
          stroke="#FFFFFF"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="14" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" />
        <rect x="20" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" />
      </g>
    </SvgFrame>
  );
}

function AvatarThree({ title }: { title?: string }) {
  return (
    <SvgFrame title={title}>
      <rect width="36" height="36" fill="#0a0310" />
      <rect
        x="0"
        y="0"
        width="36"
        height="36"
        transform="translate(-3 7) rotate(227 18 18) scale(1.2)"
        fill="#ff005b"
        rx="36"
      />
      <g transform="translate(-3 3.5) rotate(7 18 18)">
        <path d="M13,21 a1,0.75 0 0,0 10,0" fill="#FFFFFF" />
        <rect x="12" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" />
        <rect x="22" y="14" width="1.5" height="2" rx="1" fill="#FFFFFF" />
      </g>
    </SvgFrame>
  );
}

function AvatarFour({ title }: { title?: string }) {
  return (
    <SvgFrame title={title}>
      <rect width="36" height="36" fill="#d8fcb3" />
      <rect
        x="0"
        y="0"
        width="36"
        height="36"
        transform="translate(9 -5) rotate(219 18 18) scale(1)"
        fill="#89fcb3"
        rx="6"
      />
      <g transform="translate(4.5 -4) rotate(9 18 18)">
        <path
          d="M15 19c2 1 4 1 6 0"
          stroke="#000000"
          fill="none"
          strokeLinecap="round"
        />
        <rect x="10" y="14" width="1.5" height="2" rx="1" fill="#000000" />
        <rect x="24" y="14" width="1.5" height="2" rx="1" fill="#000000" />
      </g>
    </SvgFrame>
  );
}

export function DefaultAvatarIcon({
  avatarId,
  seed,
  title,
}: DefaultAvatarIconProps) {
  const resolvedAvatarId = avatarId ?? getDefaultAvatarId(seed);

  switch (resolvedAvatarId) {
    case 2:
      return <AvatarTwo title={title} />;
    case 3:
      return <AvatarThree title={title} />;
    case 4:
      return <AvatarFour title={title} />;
    case 1:
    default:
      return <AvatarOne title={title} />;
  }
}
