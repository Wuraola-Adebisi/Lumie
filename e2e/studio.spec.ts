import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('lumie-auth-session-v1', JSON.stringify({
      accessToken: 'playwright-access-token',
      expiresAt: Date.now() + 60 * 60 * 1000,
    }))
  })
  await page.route('http://localhost:3001/**', async (route) => {
    const request = route.request()
    const url = new URL(request.url())
    const now = new Date().toISOString()
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
      await route.fulfill({ json: { items: [], nextCursor: null } })
      return
    }
    if (url.pathname === '/v1/creations' && request.method() === 'POST') {
      const body = request.postDataJSON() as { title: string; document: { format: string } }
      await route.fulfill({ status: 201, json: {
        id: 'b8e4e7d0-0a9c-4f3e-8b5f-2d8c2c4f9a10',
        title: body.title,
        format: body.document.format,
        document: body.document,
        revision: 1,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      } })
      return
    }
    if (url.pathname.startsWith('/v1/creations/') && request.method() === 'PATCH') {
      const body = request.postDataJSON() as { title: string; document: { format: string } }
      await route.fulfill({ json: {
        id: 'b8e4e7d0-0a9c-4f3e-8b5f-2d8c2c4f9a10',
        title: body.title,
        format: body.document.format,
        document: body.document,
        revision: 2,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
      } })
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

test('adds a valid local image to the composition', async ({ page }) => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j2ioAAAAASUVORK5CYII=', 'base64')
  await page.locator('#studio-photo-upload').setInputFiles({
    name: 'tiny.png',
    mimeType: 'image/png',
    buffer: png,
  })
  await expect(page.locator('.studio-element-photo img')).toBeVisible()
})

test('rejects an image larger than the local upload limit', async ({ page }) => {
  await page.locator('#studio-photo-upload').setInputFiles({
    name: 'large.png',
    mimeType: 'image/png',
    buffer: Buffer.alloc(3 * 1024 * 1024 + 1),
  })
  await expect(page.getByRole('status').filter({ hasText: 'smaller than 3 MB' })).toBeVisible()
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


test('saves, searches, reopens and deletes multiple named creations', async ({ page }) => {
  await page.getByLabel('Give it a name').fill('First postcard')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await page.getByRole('link', { name: 'Back to your creations' }).click()
  await expect(page.getByRole('heading', { name: 'Your creations' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'First postcard' })).toBeVisible()

  await page.getByRole('link', { name: 'Make something' }).click()
  await page.getByLabel('Give it a name').fill('Second letter')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await page.getByRole('link', { name: 'Back to your creations' }).click()
  await expect(page.getByRole('heading', { name: 'First postcard' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Second letter' })).toBeVisible()

  await page.getByRole('textbox', { name: 'Search your creations' }).fill('First')
  await expect(page.getByRole('heading', { name: 'First postcard' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Second letter' })).toHaveCount(0)
  await page.getByRole('textbox', { name: 'Search your creations' }).fill('')

  const firstCreation = page.locator('article').filter({ has: page.getByRole('heading', { name: 'First postcard' }) })
  await firstCreation.getByRole('link', { name: 'Open creation' }).click()
  await expect(page.getByLabel('Give it a name')).toHaveValue('First postcard')
  await page.getByRole('link', { name: 'Back to your creations' }).click()
  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Delete First postcard' }).click()
  await expect(page.getByRole('heading', { name: 'First postcard' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Second letter' })).toBeVisible()
})
