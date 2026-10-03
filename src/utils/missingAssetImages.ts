/** Existing media and acknowledged/unknown in-flight receipts must never enter a new batch. */
export function needsAssetImage(
  asset: { id?: string; referenceImageUrl?: string; imageUrls?: string },
  key: string,
  pending: Record<string, unknown>,
  generating: Record<string, boolean>,
): boolean {
  if (!asset.id || asset.referenceImageUrl?.trim() || pending[key] || generating[key]) return false;
  if (asset.imageUrls?.trim()) {
    try {
      const images: unknown = JSON.parse(asset.imageUrls);
      if (!Array.isArray(images) || images.length > 0) return false;
    } catch { return false; } // Unreadable media data requires review, never a replacement submission.
  }
  return true;
}
