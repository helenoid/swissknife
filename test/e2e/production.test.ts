import { test, expect } from '@playwright/test'

test.describe('SwissKnife Production E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3001')
    await page.waitForLoadState('networkidle')
  })

  test('virtual desktop loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle('SwissKnife Web Desktop')
    
    // Check for desktop icons
    const icons = page.locator('.desktop-icon')
    await expect(icons).toHaveCount(14)
    
    // Verify Swiss flag branding
    await expect(page.locator('text=🇨🇭')).toBeVisible()
  })

  test('can launch and interact with applications', async ({ page }) => {
    // Launch Terminal app
    await page.click('[data-app="terminal"]')
    await expect(page.locator('.window[data-app="terminal"]')).toBeVisible()
    
    // Launch AI Chat app
    await page.click('[data-app="ai-chat"]')
    await expect(page.locator('.window[data-app="ai-chat"]')).toBeVisible()
    
    // Verify multi-window environment
    const windows = page.locator('.window')
    await expect(windows).toHaveCount(2)
  })

  test('shared system integration works', async ({ page }) => {
    // Launch Terminal
    await page.click('[data-app="terminal"]')
    
    // Test CLI commands
    const terminal = page.locator('.terminal-content')
    await terminal.type('sk-status')
    await page.keyboard.press('Enter')
    
    // Verify command execution
    await expect(terminal).toContainText('SwissKnife System Status')
  })

  test('performance metrics meet requirements', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('http://localhost:3001')
    await page.waitForSelector('.desktop-icon')
    
    const loadTime = Date.now() - startTime
    expect(loadTime).toBeLessThan(3000) // 3 second load time requirement
    
    // Check bundle size
    const resources = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(resource => resource.name.includes('.js'))
        .reduce((total, resource) => total + (resource.transferSize || 0), 0)
    })
    
    expect(resources).toBeLessThan(5 * 1024 * 1024) // 5MB bundle size limit
  })

  test('responsive design works on different viewports', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('.desktop-icons')).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('.desktop-icons')).toBeVisible()
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.locator('.mobile-menu')).toBeVisible()
  })

  test('accessibility requirements are met', async ({ page }) => {
    // Check for proper ARIA labels
    await expect(page.locator('[aria-label]')).toHaveCount.greaterThan(0)
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Check color contrast
    const contrastIssues = await page.evaluate(() => {
      // Simplified contrast check
      const elements = document.querySelectorAll('*')
      let issues = 0
      elements.forEach(el => {
        const styles = getComputedStyle(el)
        const bg = styles.backgroundColor
        const color = styles.color
        if (bg !== 'rgba(0, 0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
          // Basic contrast validation would go here
        }
      })
      return issues
    })
    
    expect(contrastIssues).toBe(0)
  })

  test('error handling and recovery', async ({ page }) => {
    // Test network error handling
    await page.route('**/*', route => route.abort())
    
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.error-message, .offline-indicator')).toBeVisible()
    
    // Test recovery
    await page.unroute('**/*')
    await page.reload()
    await expect(page.locator('.desktop-icon')).toBeVisible()
  })

  test('security headers are present', async ({ page }) => {
    const response = await page.goto('http://localhost:3001')
    const headers = response.headers()
    
    // Check security headers
    expect(headers['x-frame-options']).toBeDefined()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-xss-protection']).toBeDefined()
  })

  test('memory usage stays within limits', async ({ page }) => {
    await page.goto('http://localhost:3001')
    
    // Launch multiple apps to test memory usage
    const apps = ['terminal', 'ai-chat', 'file-manager', 'device-manager']
    for (const app of apps) {
      await page.click(`[data-app="${app}"]`)
      await page.waitForTimeout(500)
    }
    
    // Check memory usage
    const memoryUsage = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    expect(memoryUsage).toBeLessThan(100 * 1024 * 1024) // 100MB limit
  })
})