/**
 * Export blob directly to Phone Gallery / Device Storage via direct download.
 * Disables any share sheet or confirmation modals so capture flow is instant.
 */
export async function exportToDeviceGallery(
  blob: Blob,
  filename: string,
  _siteId: string = 'FIELD'
): Promise<{ success: boolean; mode: 'download' }> {
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
