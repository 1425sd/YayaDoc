import { ISpace } from "@/features/space/types/space.types.ts";

export interface IPage {
  id: string;
  slugId: string;
  title: string;
  content: any;
  icon: string;
  coverPhoto: string;
  parentPageId: string;
  creatorId: string;
  spaceId: string;
  workspaceId: string;
  isLocked: boolean;
  lastUpdatedById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
  position: string;
  hasChildren: boolean;
  canEdit?: boolean;
  creator: ICreator;
  lastUpdatedBy: ILastUpdatedBy;
  deletedBy: IDeletedBy;
  space: Partial<ISpace>;
  permissions?: {
    canEdit: boolean;
    hasRestriction: boolean;
  };
}

export type PageContentType = "note" | "board" | "mindmap";

export enum PageContentFormat {
  JSON = "json",
  HTML = "html",
  Markdown = "markdown",
}

interface ICreator {
  id: string;
  name: string;
  avatarUrl: string;
}
interface ILastUpdatedBy {
  id: string;
  name: string;
  avatarUrl: string;
}

interface IDeletedBy {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface IMovePage {
  pageId: string;
  position?: string;
  after?: string;
  before?: string;
  parentPageId?: string;
}

export interface IMovePageToSpace {
  pageId: string;
  spaceId: string;
}

export interface ICopyPageToSpace {
  pageId: string;
  spaceId?: string;
}

export interface SidebarPagesParams {
  spaceId?: string;
  pageId?: string;
  cursor?: string;
}

export interface IPageInput {
  pageId: string;
  spaceId?: string;
  title: string;
  parentPageId: string;
  icon: string;
  coverPhoto: string;
  position: string;
  isLocked: boolean;
  content?: any;
  format?: PageContentFormat;
  contentType?: PageContentType;
}

export interface IExportPageParams {
  pageId: string;
  format: ExportFormat;
  includeChildren?: boolean;
  includeAttachments?: boolean;
}

export enum ExportFormat {
  HTML = "html",
  Markdown = "markdown",
}
