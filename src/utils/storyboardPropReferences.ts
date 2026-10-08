export interface StoryboardPropLink {
  kind: string;
  title: string;
  shotNumbers?: number[];
}

/** Explicit names (including []) override legacy per-asset shot-number links. */
export function storyboardPropNames(visibleProps: unknown, sceneNo: number, assets: StoryboardPropLink[]): string[] {
  const names = Array.isArray(visibleProps)
    ? visibleProps.filter((name): name is string => typeof name === 'string' && !!name)
    : assets.filter(asset => asset.kind === 'prop' && asset.shotNumbers?.includes(sceneNo)).map(asset => asset.title);
  return [...new Set(names)];
}
