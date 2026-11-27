import { expect, test } from '@playwright/test'

test('publishes the Lumie contact address and canonical contact URL', async ({ page }) => {
  await page.goto('/contact')

  const contactLink = page.locator('a[href="mailto:hello@lumiepost.com"]').first()
  await expect(contactLink).toHaveAttribute('href', 'mailto:hello@lumiepost.com')
  await expect(page.getByRole('heading', { name: 'Privacy and site concerns' })).toBeVisible()
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://www.lumiepost.com/contact')
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', 'https://www.lumiepost.com/contact')
})

test('keeps the authenticated creation workspace out of search indexing', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('lumie-auth-session-v1', JSON.stringify({
      accessToken: 'playwright-access-token',
      expiresAt: Date.now() + 60 * 60 * 1000,
    }))
  })
  await page.route('http://localhost:3001/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/v1/me') {
      await route.fulfill({ json: {
        id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21',
        displayName: 'Studio Tester',
        avatarAssetId: null,
        locale: 'en',
        timeZone: 'UTC',
        createdAt: new Date().toISOString(),
      } })
      return
    }
    await route.fulfill({ json: { items: [], nextCursor: null } })
  })
  await page.goto('/app')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow')
})
