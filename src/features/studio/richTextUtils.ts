const ALLOWED_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/** Accept only navigable web/contact links; reject script and other executable schemes. */
export function sanitizeRichTextHref(href?: string): string | undefined {
  if (!href?.trim()) return undefined
  try {
    const parsed = new URL(href, 'https://lumie.invalid')
    return ALLOWED_LINK_PROTOCOLS.has(parsed.protocol) ? href : undefined
  } catch {
    return undefined
  }
}
