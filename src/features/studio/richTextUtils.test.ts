import { describe, expect, it } from 'vitest'
import { sanitizeRichTextHref } from './richTextUtils'

describe('sanitizeRichTextHref', () => {
  it.each(['https://example.com/letter', 'http://example.com', 'mailto:hello@example.com', 'tel:+123456789', '/about', '#section'])('allows safe destination %s', (href) => {
    expect(sanitizeRichTextHref(href)).toBe(href)
  })
  it.each(['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'vbscript:msgbox(1)', '', '   '])('rejects unsafe or empty destination %s', (href) => {
    expect(sanitizeRichTextHref(href)).toBeUndefined()
  })
  it('rejects malformed destinations', () => expect(sanitizeRichTextHref('http://[invalid')).toBeUndefined())
})
