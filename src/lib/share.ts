export async function shareURL(url: string, title?: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({ title: title ?? 'QRポケット', url });
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export async function copyURL(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}
