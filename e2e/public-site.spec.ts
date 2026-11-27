import { expect, test } from '@playwright/test'

test('publishes the Lumie contact address and canonical contact URL', async ({ page }) => {
  await page.goto('/contact')

  const contactLink = page.locator('a[href="mailto:hello@lumiepost.com"]').first()
  await expect(contactLink).toHaveAttribute('href', 'mailto:hello@lumiepost.com')
  await expect(page.getByRole('heading', { name: 'Privacy and site concerns' })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.lumiepost.com/contact')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://www.lumiepost.com/contact')
})

test('keeps the creation workspace out of search indexing', async ({ page }) => {
  await page.goto('/app')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
})
