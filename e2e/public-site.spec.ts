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
    localStorage.setItem('lumie-supabase-session-v1', JSON.stringify({
      access_token: 'playwright-access-token',
      refresh_token: 'playwright-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', email: 'studio@example.test', user_metadata: { display_name: 'Studio Tester' } },
    }))
  })
  await page.route('https://lumie-e2e.supabase.co/**', async (route) => {
    const path = new URL(route.request().url()).pathname
    if (path === '/auth/v1/user') {
      await route.fulfill({ json: { id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', email: 'studio@example.test', user_metadata: { display_name: 'Studio Tester' } } })
      return
    }
    if (path === '/rest/v1/profiles') {
      await route.fulfill({ json: [{ id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', display_name: 'Studio Tester', avatar_asset_id: null, locale: 'en', time_zone: 'UTC', created_at: new Date().toISOString() }] })
      return
    }
    await route.fulfill({ status: 404, json: { message: 'Not found' } })
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

test('redirects visitors to sign-in before opening the private workspace', async ({ page }) => {
  await page.goto('/app')
  await expect(page).toHaveURL(/\/sign-in$/)
  await expect(page.getByRole('heading', { name: 'Come on in.' })).toBeVisible()
})

test('requests a password reset without revealing whether an account exists', async ({ page }) => {
  let requestedEmail = ''
  await page.route('https://lumie-e2e.supabase.co/auth/v1/recover*', async (route) => {
    const body = route.request().postDataJSON() as { email: string; code_challenge: string; code_challenge_method: string }
    requestedEmail = body.email
    expect(body.code_challenge).toBeTruthy()
    expect(body.code_challenge_method).toBe('s256')
    await route.fulfill({ status: 200, json: {} })
  })
  await page.goto('/sign-in')
  await page.getByRole('button', { name: 'Forgot your password?' }).click()
  await page.getByLabel('Email address').fill('person@example.test')
  await page.getByRole('button', { name: 'Send reset link' }).click()
  await expect(page.getByRole('status')).toContainText('If an account exists for that email')
  expect(requestedEmail).toBe('person@example.test')
})

test('lets an authenticated user choose a new password', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('lumie-supabase-session-v1', JSON.stringify({
      access_token: 'playwright-access-token',
      refresh_token: 'playwright-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', email: 'studio@example.test', user_metadata: { display_name: 'Studio Tester' } },
    }))
  })
  await page.route('https://lumie-e2e.supabase.co/**', async (route) => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path === '/auth/v1/user' && request.method() === 'PUT') {
      expect(request.postDataJSON()).toEqual({ password: 'NewSecurePassword123!' })
      await route.fulfill({ json: { id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', email: 'studio@example.test' } })
      return
    }
    if (path === '/auth/v1/user') {
      await route.fulfill({ json: { id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', email: 'studio@example.test', user_metadata: { display_name: 'Studio Tester' } } })
      return
    }
    if (path === '/rest/v1/profiles') {
      await route.fulfill({ json: [{ id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', display_name: 'Studio Tester', avatar_asset_id: null, locale: 'en', time_zone: 'UTC', created_at: new Date().toISOString() }] })
      return
    }
    await route.fulfill({ status: 404, json: { message: 'Not found' } })
  })
  await page.goto('/reset-password')
  await expect(page.getByRole('heading', { name: 'Choose a new password.' })).toBeVisible()
  await page.getByLabel('New password').fill('NewSecurePassword123!')
  await page.getByLabel('Confirm new password').fill('NewSecurePassword123!')
  await page.getByRole('button', { name: 'Update password' }).click()
  await expect(page.getByRole('status')).toContainText('Your password has been updated')
})
