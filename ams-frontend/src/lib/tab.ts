/**
 * Tab-opening helpers that keep repeated opens from "stealing" / focusing
 * an already-open same-URL tab (the classic "tab sau đè tab trước" problem).
 *
 * `freshTabUrl` appends a cache-busting `?_t=` query param so each open is a
 * distinct URL, which forces the browser to open a brand-new tab instead of
 * activating the existing one.
 */

/** Stable-ish per-session nonce so re-opens of the "same" file still get a new tab. */
let nonce = 0

export function freshTabUrl(href: string, force = false): string {
  if (!force && href.includes("_t=")) return href
  nonce += 1
  const sep = href.includes("?") ? "&" : "?"
  return `${href}${sep}_t=${Date.now().toString(36)}${nonce.toString(36)}`
}

/**
 * Open `href` in a fresh tab. The `download` hint (when present) signals the
 * browser to save rather than navigate, which also sidesteps the same-tab
 * focus behavior.
 */
export function openFreshTab(href: string, download = false): void {
  const url = freshTabUrl(href)
  const a = document.createElement("a")
  a.href = url
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  if (download) a.download = ""
  document.body.appendChild(a)
  a.click()
  a.remove()
}
