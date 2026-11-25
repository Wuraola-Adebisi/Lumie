import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/app/create')
})

test('opens the Creation Studio with an accessible canvas and format controls', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Start with a format.' })).toBeVisible()
  await expect(page.getByRole('group', { name: 'Letter composition canvas' })).toBeVisible()
  await expect(page.getByRole('button', { name: /Postcard/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Save draft' })).toBeVisible()
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
  await expect(page.getByRole('button', { name: 'Bold' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByRole('button', { name: 'Align centre' })).toBeVisible()
  await expect(page.locator('[contenteditable="true"][aria-label="Rich text content"]')).toBeVisible()
})

test('exports a PNG download', async ({ page }) => {
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'PNG' }).click()
  const download = await downloadPromise
  expect(download.suggestedFilename()).toMatch(/^lumie-letter-\\d{4}-\\d{2}-\\d{2}\\.png$/)
})

test('sets the selected postcard print dimensions', async ({ page }) => {
  await page.getByRole('button', { name: /Postcard/ }).click()
  await page.evaluate(() => {
    window.print = () => undefined
  })
  await page.getByRole('button', { name: 'PDF / Print' }).click()
  const printRules = page.locator('#lumie-export-print-rules')
  await expect.poll(() => printRules.evaluate((element) => element.textContent)).toContain('@page { size: 6in 4in; margin: 0 }')
  await expect(page.locator('.studio-paper')).toHaveClass(/studio-paper-postcard/)
})
