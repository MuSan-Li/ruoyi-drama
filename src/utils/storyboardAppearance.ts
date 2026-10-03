/** Imported plans may reference an appearance by index; generated plans use its name. */
export function selectStoryboardAppearance<T extends { appearanceIndex?: number; changeReason?: string }>(
  appearances: T[], reference: unknown,
): T | undefined {
  const name = typeof reference === 'string' ? reference.trim() : '';
  const index = typeof reference === 'number' ? reference : /^\d+$/.test(name) ? Number(name) : undefined;
  if (index !== undefined && Number.isSafeInteger(index) && index >= 0) {
    return appearances.find(appearance => appearance.appearanceIndex === index)
      || appearances[index] || appearances[0];
  }
  if (name) {
    return appearances.find(appearance => appearance.changeReason?.trim() === name)
      || appearances.find(appearance => appearance.changeReason?.includes(name))
      || appearances[0];
  }
  return appearances[0];
}
