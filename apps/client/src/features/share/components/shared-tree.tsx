import { ISharedPageTree } from "@/features/share/types/share.types.ts";
import { NodeApi, NodeRendererProps, Tree, TreeApi } from "react-arborist";
import {
  buildSharedPageTree,
  SharedPageTreeNode,
} from "@/features/share/utils.ts";
import { useEffect, useMemo, useRef, useState } from "react";
import { useElementSize, useMergedRef } from "@mantine/hooks";
import { SpaceTreeNode } from "@/features/page/tree/types.ts";
import { Link, useParams } from "react-router-dom";
import { atom, useAtom } from "jotai/index";
import { useTranslation } from "react-i18next";
import { buildSharedPageUrl } from "@/features/page/page.utils.ts";
import clsx from "clsx";
import {
  IconChevronRight,
  IconFileDescription,
  IconFolder,
  IconFolderOpen,
} from "@tabler/icons-react";
import { ActionIcon, Box } from "@mantine/core";
import { extractPageSlugId } from "@/lib";
import { OpenMap } from "react-arborist/dist/main/state/open-slice";
import classes from "@/features/page/tree/styles/tree.module.css";
import styles from "./share.module.css";
import { mobileSidebarAtom } from "@/components/layouts/global/hooks/atoms/sidebar-atom.ts";
import EmojiPicker from "@/components/ui/emoji-picker.tsx";
import { motion } from "motion/react";

interface SharedTree {
  sharedPageTree: ISharedPageTree;
}

const openSharedTreeNodesAtom = atom<OpenMap>({});

export default function SharedTree({ sharedPageTree }: SharedTree) {
  const [tree, setTree] = useState<
    TreeApi<SharedPageTreeNode> | null | undefined
  >(null);
  const rootElement = useRef<HTMLDivElement>();
  const { ref: sizeRef, width, height } = useElementSize();
  const mergedRef = useMergedRef(rootElement, sizeRef);
  const { pageSlug } = useParams();
  const [openTreeNodes, setOpenTreeNodes] = useAtom<OpenMap>(
    openSharedTreeNodesAtom,
  );

  const currentNodeId = extractPageSlugId(pageSlug);

  const treeData: SharedPageTreeNode[] = useMemo(() => {
    if (!sharedPageTree?.pageTree) return;
    return buildSharedPageTree(sharedPageTree.pageTree);
  }, [sharedPageTree?.pageTree]);

  useEffect(() => {
    const parentNodeId = treeData?.[0]?.slugId;

    if (parentNodeId && tree) {
      const parentNode = tree.get(parentNodeId);

      setTimeout(() => {
        if (parentNode) {
          tree.openSiblings(parentNode);
        }
      });

      // open direct children of parent node
      parentNode?.children.forEach((node) => {
        tree.openSiblings(node);
      });
    }
  }, [treeData, tree]);

  useEffect(() => {
    if (currentNodeId && tree) {
      setTimeout(() => {
        // focus on node and open all parents
        tree?.select(currentNodeId, { align: "auto" });
      }, 200);
    } else {
      tree?.deselectAll();
    }
  }, [currentNodeId, tree]);

  if (!sharedPageTree || !sharedPageTree?.pageTree) {
    return null;
  }

  return (
    <div ref={mergedRef} className={classes.treeContainer}>
      {rootElement.current && (
        <Tree
          data={treeData}
          disableDrag={true}
          disableDrop={true}
          disableEdit={true}
          width={width}
          height={rootElement.current.clientHeight}
          ref={(t) => setTree(t)}
          openByDefault={false}
          disableMultiSelection={true}
          className={classes.tree}
          rowClassName={classes.row}
          rowHeight={40}
          overscanCount={10}
          dndRootElement={rootElement.current}
          onToggle={() => {
            setOpenTreeNodes(tree?.openState);
          }}
          initialOpenState={openTreeNodes}
          onClick={(e) => {
            if (tree && tree.focusedNode) {
              tree.select(tree.focusedNode);
            }
          }}
        >
          {Node}
        </Tree>
      )}
    </div>
  );
}

function Node({ node, style, tree }: NodeRendererProps<any>) {
  const { shareId } = useParams();
  const { t } = useTranslation();
  const [, setMobileSidebarState] = useAtom(mobileSidebarAtom);
  const hasChildren =
    node.isInternal && (node.children.length > 0 || node.data.hasChildren);

  const pageUrl = buildSharedPageUrl({
    shareId: shareId,
    pageSlugId: node.data.slugId,
    pageTitle: node.data.name,
  });

  const pageIcon = node.data.icon ? (
    <span className={clsx(classes.itemIcon, classes.itemEmoji)}>
      {node.data.icon}
    </span>
  ) : (
    <span
      className={clsx(
        classes.itemIcon,
        hasChildren ? classes.itemIconFolder : classes.itemIconFile,
        hasChildren && node.isOpen && classes.itemIconFolderOpen,
      )}
    >
      {hasChildren ? (
        node.isOpen ? (
          <IconFolderOpen size={18} stroke={1.9} />
        ) : (
          <IconFolder size={18} stroke={1.9} />
        )
      ) : (
        <IconFileDescription size={18} stroke={1.8} />
      )}
    </span>
  );

  return (
    <>
      <Box
        style={style}
        className={clsx(classes.node, node.state, styles.treeNode)}
        component={Link}
        to={pageUrl}
        onClick={() => {
          setMobileSidebarState(false);
        }}
      >
        <PageArrow node={node} />
        <div className={classes.iconWrap}>
          <EmojiPicker
            onEmojiSelect={() => {}}
            icon={pageIcon}
            readOnly={true}
            removeEmojiAction={() => {}}
            actionIconProps={{
              size: "lg",
              variant: "transparent",
              c: "gray",
            }}
          />
        </div>
        <span className={classes.text}>{node.data.name || t("untitled")}</span>
      </Box>
    </>
  );
}

interface PageArrowProps {
  node: NodeApi<SpaceTreeNode>;
}

function PageArrow({ node }: PageArrowProps) {
  const hasChildren =
    node.isInternal && (node.children.length > 0 || node.data.hasChildren);

  if (!hasChildren) {
    return <span className={classes.arrowPlaceholder} aria-hidden="true" />;
  }

  return (
    <ActionIcon
      size={28}
      variant="transparent"
      c="gray"
      className={classes.arrowButton}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        node.toggle();
      }}
    >
      <motion.span
        className={classes.arrowIcon}
        animate={{ rotate: node.isOpen ? 90 : 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.3 }}
      >
        <IconChevronRight stroke={2.2} size={16} />
      </motion.span>
    </ActionIcon>
  );
}
