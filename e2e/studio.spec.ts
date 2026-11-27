import { expect, test } from '@playwright/test'

// Authenticated browser coverage uses the same Supabase session shape as the app.

test.beforeEach(async ({ page }) => {
  let creationCounter = 0
  type MockCreation = {
    id: string
    title: string
    format: string
    document: { format: string; [key: string]: unknown }
    revision: number
    status: 'draft' | 'archived'
    createdAt: string
    updatedAt: string
  }
  const savedCreations: MockCreation[] = []
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
    const request = route.request()
    const url = new URL(request.url())
    const now = new Date().toISOString()
    if (url.pathname === '/v1/assets/upload-intents' && request.method() === 'POST') {
      await route.fulfill({ status: 201, json: { assetId: 'd7e3d69c-2f83-4b2a-b3b1-a32c4d4a9e21', uploadUrl: 'http://localhost:3001/test-upload/photo', requiredHeaders: { 'Content-Type': 'image/png' } } })
      return
    }
    if (url.pathname === '/test-upload/photo' && request.method() === 'PUT') { await route.fulfill({ status: 200, body: '' }); return }
    if (url.pathname === '/v1/assets/d7e3d69c-2f83-4b2a-b3b1-a32c4d4a9e21/complete' && request.method() === 'POST') { await route.fulfill({ json: { status: 'ready' } }); return }
    if (url.pathname === '/v1/assets/d7e3d69c-2f83-4b2a-b3b1-a32c4d4a9e21/download-url') { await route.fulfill({ json: { url: 'http://localhost:3001/test-photo.png' } }); return }
    if (url.pathname === '/test-photo.png') { await route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2ioAAAAASUVORK5CYII=', 'base64') }); return }
    if (url.pathname === '/v1/inbox' && request.method() === 'GET') {
      await route.fulfill({ json: { items: [] } })
      return
    }
    if (url.pathname === '/v1/correspondence' && request.method() === 'POST') {
      await route.fulfill({ status: 404, json: { code: 'RECIPIENT_NOT_FOUND', message: 'No Lumie account is registered with that email address yet.' } })
      return
    }
    if (url.pathname === '/v1/invitations' && request.method() === 'POST') {
      await route.fulfill({ status: 201, json: { inviteUrl: 'https://www.lumiepost.com/invite/test-invitation-token-1234567890123456789012345678901234567890', expiresAt: new Date(Date.now() + 14 * 86400000).toISOString() } })
      return
    }
    if (url.pathname === '/v1/me') {
      await route.fulfill({ json: {
        id: 'a7d3d69c-2f83-4b2a-b3b1-a32c4d4a9e21',
        displayName: 'Studio Tester',
        avatarAssetId: null,
        locale: 'en',
        timeZone: 'UTC',
        createdAt: now,
      } })
      return
    }
    if (url.pathname === '/v1/creations' && request.method() === 'GET') {
      await route.fulfill({ json: { items: savedCreations.filter((item) => item.status === 'draft'), nextCursor: null } })
      return
    }
    if (url.pathname === '/v1/creations' && request.method() === 'POST') {
      const body = request.postDataJSON() as { title: string; document: { format: string; [key: string]: unknown } }
      creationCounter += 1
      const saved: MockCreation = {
        id: creationCounter === 1 ? 'b8e4e7d0-0a9c-4f3e-8b5f-2d8c2c4f9a10' : 'c9f5f8e1-1b0d-4a4f-9c6e-3e9d3d5fab21',
        title: body.title,
        format: body.document.format,
        document: body.document,
        revision: 1,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      }
      savedCreations.push(saved)
      await route.fulfill({ status: 201, json: saved })
      return
    }
    const creationMatch = url.pathname.match(/^\/v1\/creations\/([0-9a-f-]{36})$/i)
    if (creationMatch && request.method() === 'GET') {
      const saved = savedCreations.find((item) => item.id === creationMatch[1])
      await route.fulfill(saved ? { json: saved } : { status: 404, json: { code: 'NOT_FOUND', message: 'Not found.' } })
      return
    }
    if (creationMatch && request.method() === 'PATCH') {
      const saved = savedCreations.find((item) => item.id === creationMatch[1])
      if (!saved) {
        await route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: 'Not found.' } })
        return
      }
      const body = request.postDataJSON() as { title: string; document: { format: string; [key: string]: unknown } }
      Object.assign(saved, { title: body.title, format: body.document.format, document: body.document, revision: saved.revision + 1, updatedAt: now })
      await route.fulfill({ json: saved })
      return
    }
    if (creationMatch && request.method() === 'DELETE') {
      const saved = savedCreations.find((item) => item.id === creationMatch[1])
      if (saved) saved.status = 'archived'
      await route.fulfill({ status: 204, body: '' })
      return
    }
    await route.fulfill({ status: 404, json: { code: 'NOT_FOUND', message: 'Not found.' } })
  })
  await page.goto('/app/create')
})

test('opens the Creation Studio with an accessible canvas and format controls', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Choose your paper.' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Letter composition canvas' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Postcard/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save draft' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Make it yours.' })).toBeVisible()
  await expect(page.getByText(/Sending correspondence is a separate step/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Make share image' })).toBeVisible()
})

test('moves a selected layer with arrow keys and larger Shift + arrow steps', async ({ page }) => {
  const layer = page.getByRole('group', { name: /Select text layer/ }).first()
  await expect(layer).toHaveCSS('left', /./)
  await layer.focus()
  await layer.press('ArrowRight')
  await expect(layer).toHaveAttribute('style', /left: 10%/)
  await layer.press('Shift+ArrowDown')
  await expect(layer).toHaveAttribute('style', /top: 17%/)
})

test('opens the rich-text controls when a text layer is selected', async ({ page }) => {
  const layer = page.getByRole('group', { name: /Select text layer/ }).first()
  await layer.click()
  await expect(page.getByRole('toolbar', { name: 'Text formatting' })).toBeVisible()
  const bold = page.getByRole('button', { name: 'Bold' })
  const initiallyPressed = await bold.getAttribute('aria-pressed')
  await bold.click()
  await expect(bold).toHaveAttribute('aria-pressed', initiallyPressed === 'true' ? 'false' : 'true')
  await expect(page.getByRole('button', { name: 'Align centre' })).toBeVisible()
  await expect(page.locator('[contenteditable="true"][aria-label="Rich text content"]')).toBeVisible()
})

test('exports a PNG download with the selected format in its filename', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'PNG' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^lumie-letter-\d{4}-\d{2}-\d{2}\.png$/)
})

test('supports touch-pointer dragging of a composition layer', async ({ page }) => {
  const paper = page.locator('.studio-paper')
  const layer = page.getByRole('group', { name: /Select text layer/ }).first()
  const bounds = await paper.boundingBox()
  if (!bounds) throw new Error('Composition canvas is not measurable')

  await layer.dispatchEvent('pointerdown', {
    pointerId: 7,
    pointerType: 'touch',
    isPrimary: true,
    button: 0,
    clientX: bounds.x + bounds.width * 0.2,
    clientY: bounds.y + bounds.height * 0.2,
  })
  await page.evaluate(({ x, y }) => {
    window.dispatchEvent(new PointerEvent('pointermove', {
      pointerId: 7, pointerType: 'touch', isPrimary: true,
      clientX: x, clientY: y, bubbles: true,
    }))
    window.dispatchEvent(new PointerEvent('pointerup', {
      pointerId: 7, pointerType: 'touch', isPrimary: true,
      clientX: x, clientY: y, bubbles: true,
    }))
  }, { x: bounds.x + bounds.width * 0.3, y: bounds.y + bounds.height * 0.25 })

  await expect(layer).toHaveAttribute('style', /left: 19%/)
  await expect(layer).toHaveAttribute('style', /top: 17%/)
})

test('uploads a photo and keeps only its asset identifier in cloud drafts', async ({ page }) => {
  const saveRequestPromise = page.waitForRequest((request) => {
    if (!request.url().startsWith('http://localhost:3001/v1/creations') || !['POST', 'PATCH'].includes(request.method())) return false
    try {
      const body = request.postDataJSON() as { document?: { elements?: Array<{ imageAssetId?: string }> } }
      return Boolean(body.document?.elements?.some((element) => element.imageAssetId === 'd7e3d69c-2f83-4b2a-b3b1-a32c4d4a9e21'))
    } catch { return false }
  })
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2ioAAAAASUVORK5CYII=', 'base64')
  await page.locator('#studio-photo-upload').setInputFiles({
    name: 'tiny.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await expect(page.locator('.studio-element-photo img')).toBeVisible()
  const saveRequest = await saveRequestPromise
  const body = saveRequest.postDataJSON() as { document: { elements: Array<{ kind: string; imageAssetId?: string; image?: string }> } }
  const photo = body.document.elements.find((element) => element.kind === 'photo')
  expect(photo?.imageAssetId).toBe('d7e3d69c-2f83-4b2a-b3b1-a32c4d4a9e21')
  expect(photo).not.toHaveProperty('image')
})

test('rejects an image larger than the 10 MB upload limit', async ({ page }) => {
  await page.locator('#studio-photo-upload').setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
  })
  await expect(page.getByRole('status').filter({ hasText: 'no larger than 10 MB' })).toBeVisible()
  await expect(page.locator('.studio-element-photo')).toHaveCount(0)
})

test('uses the correct print dimensions for every composition format', async ({ page }) => {
  const formats = [
    { label: /Letter/, size: '@page { size: 8.5in 11in; margin: 0 }', className: 'studio-paper-letter' },
    { label: /Postcard/, size: '@page { size: 6in 4in; margin: 0 }', className: 'studio-paper-postcard' },
    { label: /Photo card/, size: '@page { size: 5in 5in; margin: 0 }', className: 'studio-paper-photo-card' },
    { label: /Collage/, size: '@page { size: 8in 8in; margin: 0 }', className: 'studio-paper-collage' },
    { label: /Memory page/, size: '@page { size: 8in 10in; margin: 0 }', className: 'studio-paper-memory' },
  ]

  await page.evaluate(() => { window.print = () => undefined })

  for (const format of formats) {
    await page.getByRole('button', { name: format.label }).click()
    await page.getByRole('button', { name: 'PDF / Print' }).click()
    const printRules = page.locator('#lumie-export-print-rules')
    await expect.poll(() => printRules.evaluate((element) => element.textContent)).toContain(format.size)
    await expect(page.locator('.studio-paper')).toHaveClass(new RegExp(format.className))
    await printRules.evaluate((element) => element.remove())
  }
})


test('keeps composition and correspondence actions clearly separate', async ({ page }) => {
  await page.getByRole('button', { name: 'Make share image' }).click()
  await expect(page.getByRole('dialog', { name: 'Make a share image' })).toBeVisible()
  await expect(page.getByText(/This does not send the letter or deliver it to a recipient/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download image' })).toBeVisible()
})

test('keeps the format chooser and editing controls usable on a narrow screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await expect(page.getByRole('heading', { name: 'Make it yours.' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Postcard/ })).toBeVisible()
  await expect(page.locator('.studio-paper')).toBeVisible()
  await expect(page.locator('.studio-inspector')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Make share image' })).toBeVisible()
  const overflow = await page.locator('body').evaluate((element) => element.scrollWidth > window.innerWidth)
  expect(overflow).toBe(false)
})

test('offers a creative assistant suggestion', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Lumie assistant' })).toBeVisible()
  await page.getByLabel('What would you like help with?').selectOption('design.direction')
  await page.getByLabel('A little context (optional)').fill('A bright postcard for a friend')
  await page.getByRole('button', { name: 'Show me an idea' }).click()
  await expect(page.getByRole('heading', { name: 'A visual direction' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Copy suggestion' })).toBeVisible()
  await expect(page.getByText('Was this useful?')).toBeVisible()
  await page.getByRole('button', { name: 'Helpful', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Thanks for letting us know.' })).toBeVisible()
})

// Keep assistant interaction coverage alongside the editor's browser-level acceptance tests.


test('saves multiple account creations and reopens them from the dashboard', async ({ page }) => {
  await page.getByLabel('Give it a name').fill('First postcard')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.locator('.studio-save-state')).toContainText('Saved at')
  await page.getByRole('link', { name: 'Back to your desk' }).click()
  await expect(page.getByRole('heading', { name: 'Your desk' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'First postcard' })).toBeVisible()

  await page.getByRole('main').getByRole('link', { name: 'New piece' }).click()
  await page.getByLabel('Give it a name').fill('Second letter')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.locator('.studio-save-state')).toContainText('Saved at')
  await page.getByRole('link', { name: 'Back to your desk' }).click()
  await expect(page.getByRole('heading', { name: 'First postcard' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Second letter' })).toBeVisible()

  await page.getByRole('link', { name: 'View all creations' }).click()
  await expect(page.getByRole('heading', { name: 'Your creations' })).toBeVisible()
  await page.getByRole('textbox', { name: 'Search your creations' }).fill('First')
  await expect(page.getByRole('heading', { name: 'First postcard' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Second letter' })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Search your creations' }).fill('')
  await page.getByRole('link', { name: 'Open piece' }).first().click()
  await expect(page.getByLabel('Give it a name')).toHaveValue('First postcard')
})

test('creates a shareable invitation when sending to someone without a Lumie account', async ({ page }) => {
  await page.getByLabel('Give it a name').fill('A letter for a friend')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.locator('.studio-save-state')).toContainText('Saved at')
  await page.goto('/app/inbox')
  await page.getByLabel('Recipient email').fill('newfriend@example.test')
  await page.getByRole('button', { name: 'Send letter' }).click()
  await expect(page.getByRole('status')).toContainText('An invitation link is ready')
  await expect(page.getByLabel('Invitation link')).toHaveValue(/https:\/\/www\.lumiepost\.com\/invite\//)
  await expect(page.getByRole('button', { name: 'Copy invitation link' })).toBeVisible()
})
