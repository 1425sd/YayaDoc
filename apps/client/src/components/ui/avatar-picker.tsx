"use client";

import { useEffect, useState } from "react";
import { Box, Card, Group, Text, UnstyledButton } from "@mantine/core";
import { motion, type Variants } from "motion/react";
import {
  DEFAULT_AVATAR_OPTIONS,
  DefaultAvatarIcon,
} from "@/components/ui/default-avatar.tsx";

export interface AvatarPickerProps {
  value?: number;
  defaultValue?: number;
  name?: string;
  onChange?: (avatarId: number) => void;
}

const mainAvatarVariants: Variants = {
  initial: {
    y: 20,
    opacity: 0,
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

const pickerVariants: Record<"container" | "item", Variants> = {
  container: {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.18,
      },
    },
  },
  item: {
    initial: {
      y: 20,
      opacity: 0,
    },
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  },
};

function resolveInitialAvatarId(defaultValue?: number, value?: number) {
  return value ?? defaultValue ?? DEFAULT_AVATAR_OPTIONS[0].id;
}

export function AvatarPicker({
  value,
  defaultValue,
  name = "Me",
  onChange,
}: AvatarPickerProps) {
  const [selectedAvatarId, setSelectedAvatarId] = useState(
    resolveInitialAvatarId(defaultValue, value),
  );
  const [rotationCount, setRotationCount] = useState(0);

  useEffect(() => {
    if (typeof value === "number") {
      setSelectedAvatarId(value);
    }
  }, [value]);

  const handleAvatarSelect = (avatarId: number) => {
    if (typeof value !== "number") {
      setSelectedAvatarId(avatarId);
    }

    setRotationCount((previousCount) => previousCount + 1080);
    onChange?.(avatarId);
  };

  return (
    <motion.div initial="initial" animate="animate">
      <Card
        radius="lg"
        p={0}
        withBorder
        style={{
          width: "100%",
          maxWidth: 420,
          margin: "0 auto",
          overflow: "hidden",
          background:
            "linear-gradient(180deg, var(--mantine-color-body) 0%, rgba(134, 142, 150, 0.08) 100%)",
        }}
      >
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: 1,
            height: "8rem",
            transition: {
              height: {
                type: "spring",
                stiffness: 100,
                damping: 20,
              },
            },
          }}
          style={{
            width: "100%",
            background:
              "linear-gradient(90deg, rgba(34, 139, 230, 0.18) 0%, rgba(34, 139, 230, 0.08) 100%)",
          }}
        />

        <Box px={32} pb={32} mt={-64}>
          <motion.div
            variants={mainAvatarVariants}
            style={{
              width: 160,
              height: 160,
              margin: "0 auto",
              borderRadius: "9999px",
              overflow: "hidden",
              border: "4px solid var(--mantine-color-body)",
              background: "var(--mantine-color-body)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
            }}
          >
            <Box
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transform: "scale(3)",
              }}
            >
              <motion.div
                animate={{ rotate: rotationCount }}
                transition={{
                  duration: 0.8,
                  ease: [0.4, 0, 0.2, 1],
                }}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <DefaultAvatarIcon avatarId={selectedAvatarId} title={name} />
              </motion.div>
            </Box>
          </motion.div>

          <motion.div
            variants={pickerVariants.item}
            style={{ textAlign: "center", marginTop: 16 }}
          >
            <Text fw={700} size="xl">
              {name}
            </Text>
            <Text c="dimmed" size="sm">
              Select your avatar
            </Text>
          </motion.div>

          <motion.div
            variants={pickerVariants.container}
            style={{ marginTop: 24 }}
          >
            <Group justify="center" gap={16} wrap="wrap">
              {DEFAULT_AVATAR_OPTIONS.map((avatar) => {
                const isSelected = selectedAvatarId === avatar.id;

                return (
                  <motion.div key={avatar.id} variants={pickerVariants.item}>
                    <UnstyledButton
                      onClick={() => handleAvatarSelect(avatar.id)}
                      aria-label={`Select ${avatar.alt}`}
                      aria-pressed={isSelected}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: "9999px",
                        overflow: "hidden",
                        border: isSelected
                          ? "2px solid var(--mantine-color-blue-6)"
                          : "2px solid rgba(134, 142, 150, 0.25)",
                        background: isSelected
                          ? "rgba(34, 139, 230, 0.08)"
                          : "transparent",
                        boxShadow: isSelected
                          ? "0 0 0 4px rgba(34, 139, 230, 0.12)"
                          : "none",
                        transition:
                          "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Box
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <DefaultAvatarIcon
                          avatarId={avatar.id}
                          title={avatar.alt}
                        />
                      </Box>
                    </UnstyledButton>
                  </motion.div>
                );
              })}
            </Group>
          </motion.div>
        </Box>
      </Card>
    </motion.div>
  );
}
