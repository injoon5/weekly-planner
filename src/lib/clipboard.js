/**
 * Copy text to the clipboard.
 * @param {string} text
 * @returns {Promise<boolean>} whether the copy succeeded
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
