let clearTimer: ReturnType<typeof setTimeout> | null = null;

export function copyToClipboardSecurely(text: string, clearAfterSeconds = 30): Promise<void> {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }

  return navigator.clipboard.writeText(text).then(() => {
    if (clearAfterSeconds > 0) {
      clearTimer = setTimeout(() => {
        navigator.clipboard.readText().then((currentClip) => {
          if (currentClip === text) {
            navigator.clipboard.writeText('').catch(() => {});
          }
        }).catch(() => {});
      }, clearAfterSeconds * 1000);
    }
  });
}
