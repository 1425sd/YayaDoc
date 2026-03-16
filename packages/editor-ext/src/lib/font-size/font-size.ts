import { Extension } from "@tiptap/core";

const FONT_SIZE_PATTERN = /^\d+(\.\d+)?(px|em|rem|%)$/;

const normalizeFontSize = (fontSize: string | null | undefined) => {
  if (!fontSize) {
    return null;
  }

  const trimmedFontSize = fontSize.trim();
  return FONT_SIZE_PATTERN.test(trimmedFontSize) ? trimmedFontSize : null;
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export interface FontSizeOptions {
  types: string[];
}

export const FontSize = Extension.create<FontSizeOptions>({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) =>
              normalizeFontSize(
                element.getAttribute("data-font-size") || element.style.fontSize,
              ),
            renderHTML: (attributes) => {
              const fontSize = normalizeFontSize(attributes.fontSize);
              if (!fontSize) {
                return {};
              }

              return {
                "data-font-size": fontSize,
                style: `font-size: ${fontSize}`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          const normalizedFontSize = normalizeFontSize(fontSize);
          if (!normalizedFontSize) {
            return false;
          }

          return chain()
            .setMark("textStyle", { fontSize: normalizedFontSize })
            .run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          const commandChain = chain().setMark("textStyle", { fontSize: null }) as any;

          if (typeof commandChain.removeEmptyTextStyle === "function") {
            return commandChain.removeEmptyTextStyle().run();
          }

          return commandChain.run();
        },
    };
  },
});
