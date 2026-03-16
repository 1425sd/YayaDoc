import slugify from "@sindresorhus/slugify";

const buildPageSlug = (pageSlugId: string, pageTitle?: string): string => {
  const titleSlug = slugify(pageTitle?.substring(0, 70) || "untitled", {
    customReplacements: [
      ["♥", ""],
      ["🦄", ""],
    ],
  });

  return `${titleSlug}-${pageSlugId}`;
};

export const buildCreatePageUrl = (spaceName: string): string =>
  `/s/${spaceName}/new`;

export const buildPageUrl = (
  spaceName: string,
  pageSlugId: string,
  pageTitle?: string,
  anchorId?: string,
): string => {
  let url: string;
  if (spaceName === undefined) {
    url = `/p/${buildPageSlug(pageSlugId, pageTitle)}`;
  } else {
    url = `/s/${spaceName}/p/${buildPageSlug(pageSlugId, pageTitle)}`;
  }
  return anchorId ? `${url}#${anchorId}` : url;
};

export const buildBoardUrl = (
  spaceName: string,
  pageSlugId: string,
  pageTitle?: string,
): string => `/s/${spaceName}/b/${buildPageSlug(pageSlugId, pageTitle)}`;

export const buildMindMapUrl = (
  spaceName: string,
  pageSlugId: string,
  pageTitle?: string,
): string => `/s/${spaceName}/m/${buildPageSlug(pageSlugId, pageTitle)}`;

export const buildSharedPageUrl = (opts: {
  shareId: string;
  pageSlugId: string;
  pageTitle?: string;
  anchorId?: string;
}): string => {
  const { shareId, pageSlugId, pageTitle, anchorId } = opts;
  let url: string;
  if (!shareId) {
    url = `/share/p/${buildPageSlug(pageSlugId, pageTitle)}`;
  } else {
    url = `/share/${shareId}/p/${buildPageSlug(pageSlugId, pageTitle)}`;
  }
  return anchorId ? `${url}#${anchorId}` : url;
};
