/**
 * Reliable clipboard write — tries multiple methods.
 */
export async function copyText(text: string): Promise<boolean> {
  // Method 1: Navigator clipboard (works in Electron renderer)
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // fall through
  }

  // Method 2: execCommand (legacy fallback)
  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    if (success) return true
  } catch {
    // fall through
  }

  // Method 3: IPC bridge
  try {
    if (window.api?.clipboard?.write) {
      const result = await window.api.clipboard.write(text)
      if (result.success) return true
    }
  } catch {
    // all methods failed
  }

  return false
}
