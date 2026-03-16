export type MindMapLayoutValue =
  | "logicalStructure"
  | "logicalStructureLeft"
  | "mindMap"
  | "organizationStructure"
  | "catalogOrganization"
  | "timeline"
  | "timeline2"
  | "verticalTimeline"
  | "verticalTimeline2"
  | "verticalTimeline3"
  | "fishbone"
  | "fishbone2"
  | "rightFishbone"
  | "rightFishbone2";

export type MindMapLineStyle = "straight" | "curve" | "direct";
export type MindMapThemePresetId = "professional" | "blueprint";
export type MindMapFontWeight = "normal" | "bold";

export type MindMapEditableNodeStyle = {
  fillColor: string;
  color: string;
  borderColor: string;
  borderWidth: number;
  borderRadius: number;
  fontSize: number;
  fontWeight: MindMapFontWeight;
};

export type MindMapThemeLevelStyle = MindMapEditableNodeStyle & {
  shape?: string;
  hoverRectColor?: string;
};

export type MindMapThemeConfig = {
  docmostThemePresetId?: MindMapThemePresetId;
  docmostCanvasGrid?: boolean;
  docmostCanvasBackground?: string;
  docmostGridColor?: string;
  lineWidth?: number;
  lineColor?: string;
  lineStyle?: MindMapLineStyle;
  lineDasharray?: string;
  lineRadius?: number;
  backgroundColor?: string;
  hoverRectColor?: string;
  root?: Partial<MindMapThemeLevelStyle>;
  second?: Partial<MindMapThemeLevelStyle>;
  node?: Partial<MindMapThemeLevelStyle>;
  generalization?: Partial<MindMapThemeLevelStyle>;
  [key: string]: unknown;
};

export type MindMapCanvasSettings = {
  showGrid: boolean;
  lineStyle: MindMapLineStyle;
  dashedLines: boolean;
  lineWidth: number;
};

export type MindMapNodeImageSize = {
  width: number;
  height: number;
  custom?: boolean;
};

export type MindMapNodeImagePayload = {
  url: string;
  title: string;
  width: number;
  height: number;
  custom?: boolean;
};

export type MindMapHyperlinkPayload = {
  url: string;
  title: string;
};

export type MindMapTagValue =
  | string
  | {
      text: string;
      style?: Record<string, unknown>;
    };

export type MindMapNodeData = Partial<MindMapEditableNodeStyle> & {
  text: string;
  expand?: boolean;
  image?: string | null;
  imageTitle?: string;
  imageSize?: MindMapNodeImageSize;
  hyperlink?: string;
  hyperlinkTitle?: string;
  note?: string;
  tag?: MindMapTagValue[];
  generalization?:
    | MindMapGeneralizationData
    | MindMapGeneralizationData[]
    | null;
  uid?: string;
  shape?: string;
  lineColor?: string;
  lineWidth?: number;
  lineDasharray?: string;
  [key: string]: unknown;
};

export type MindMapGeneralizationData = Partial<MindMapEditableNodeStyle> & {
  text: string;
  range?: [number, number] | null;
  uid?: string;
  richText?: boolean;
  resetRichText?: boolean;
  isActive?: boolean;
  [key: string]: unknown;
};

export type MindMapNode = {
  data: MindMapNodeData;
  children?: MindMapNode[];
};

export type MindMapViewTransform = Record<string, boolean | number | string>;

export type MindMapViewState = {
  scale: number;
  x: number;
  y: number;
  sx: number;
  sy: number;
};

export type MindMapViewData = {
  transform: MindMapViewTransform;
  state: MindMapViewState;
};

export type MindMapFullData = {
  layout: MindMapLayoutValue;
  root: MindMapNode;
  theme: {
    template: string;
    config: MindMapThemeConfig;
  };
  view: MindMapViewData | null;
};

export type MindMapPageContent = {
  type: "mindmap";
  data: MindMapFullData;
};

export type MindMapDocumentStats = {
  characterCount: number;
  nodeCount: number;
};

export type MindMapMetadataDialogKind = "image" | "hyperlink" | "note" | "tag";

export type MindMapInspectorNode = {
  uid: string;
  text: string;
  isRoot: boolean;
  isGeneralization: boolean;
  layerIndex: number;
  kind: "root" | "second" | "branch" | "summary";
  style: MindMapEditableNodeStyle;
  customStyle: Partial<MindMapEditableNodeStyle>;
  metadata: {
    image: string;
    imageTitle: string;
    imageSize: MindMapNodeImageSize;
    hyperlink: string;
    hyperlinkTitle: string;
    note: string;
    tags: string[];
    hasGeneralization: boolean;
    summaryText: string;
    summaryCount: number;
  };
};

export type MindMapThemePresetDefinition = {
  id: MindMapThemePresetId;
  labelKey: string;
  descriptionKey: string;
  previewColors: readonly [string, string, string];
  config: MindMapThemeConfig;
};

export interface SimpleMindMapNode {
  isRoot: boolean;
  isGeneralization: boolean;
  layerIndex: number;
  parent?: SimpleMindMapNode | null;
  getData(): MindMapNodeData;
  getData(key: string): unknown;
  getStyle(prop: string, root?: boolean): string | number;
  getSelfStyle(prop: string): unknown;
}

export interface SimpleMindMapRenderer {
  root?: SimpleMindMapNode;
  activeNodeList: SimpleMindMapNode[];
  setRootNodeCenter(): void;
  moveNodeToCenter(node: SimpleMindMapNode, resetScale?: boolean): void;
}

export interface SimpleMindMapViewApi {
  fit(): void;
  enlarge(cx?: number, cy?: number): void;
  narrow(cx?: number, cy?: number): void;
  getTransformData(): MindMapViewData;
  setScale(scale: number, cx?: number, cy?: number): void;
  translateXY(x: number, y: number): void;
}

export interface SimpleMindMapShortcutApi {
  addShortcut(key: string, fn: () => void): void;
}

export interface SimpleMindMapApi {
  renderer: SimpleMindMapRenderer;
  view: SimpleMindMapViewApi;
  keyCommand?: SimpleMindMapShortcutApi;
  destroy(): void;
  execCommand(command: string, ...args: unknown[]): void;
  getCustomThemeConfig(): MindMapThemeConfig;
  getData(withConfig?: boolean): MindMapFullData | MindMapNode;
  getLayout(): MindMapLayoutValue;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler?: (...args: unknown[]) => void): void;
  resize(): void;
  setLayout(layout: MindMapLayoutValue): void;
  setMode(mode: "edit" | "readonly"): void;
  setThemeConfig(config: MindMapThemeConfig, notRender?: boolean): void;
}
