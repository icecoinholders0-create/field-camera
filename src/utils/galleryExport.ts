/**
 * Export blob directly to Phone Gallery / Device Storage.
 * On mobile browsers (iOS Safari & Android Chrome), navigator.share({ files: [file] })
 * invokes the native OS share sheet with a direct "Save Image / Save to Photos" action.
 */
export async function exportToDeviceGallery(
  blob: Blob,
  filename: string,
  siteId: string = 'FIELD'
): Promise<{ success: boolean; mode: 'share' | 'download' | 'copied' }> {
  const isPhoto = blob.type.includes('image') || filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.png');
  const mimeType = blob.type || (isPhoto ? 'image/jpeg' : 'video/webm');
  const file = new File([blob], filename, { type: mimeType });

  // 1. Try Native Web Share API (Triggers native iOS/Android "Save Image" / "Save to Photos" action)
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title: `Field Camera - ${siteId}`,
        text: `Field inspection capture (${siteId})`,
        files: [file],
      });
      return { success: true, mode: 'share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // User closed native share sheet, still count as user action handled
        return { success: true, mode: 'share' };
      }
      console.warn('Native share failed, falling back to download link:', err);
    }
  }

  // 2. Fallback: Browser file download link
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return { success: true, mode: 'download' };
  } catch (err) {
    console.error('Failed to trigger direct file download:', err);
    return { success: false, mode: 'download' };
  }
}
