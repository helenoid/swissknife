import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const screenshotsDir = path.join(__dirname, '../../docs/screenshots');

// Ensure screenshots directory exists
if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

// All applications to test with their expected functionality indicators
const applications = [
    { name: 'terminal', selector: '[data-app="terminal"]', expectMock: false },
    { name: 'vibecode', selector: '[data-app="vibecode"]', expectMock: false },
    { name: 'music-studio-unified', selector: '[data-app="music-studio-unified"]', expectMock: false },
    { name: 'ai-chat', selector: '[data-app="ai-chat"]', expectMock: false },
    { name: 'files', selector: '[data-app="files"]', expectMock: true },
    { name: 'tasks', selector: '[data-app="tasks"]', expectMock: false },
    { name: 'todo', selector: '[data-app="todo"]', expectMock: false },
    { name: 'ai-models', selector: '[data-app="ai-models"]', expectMock: false },
    { name: 'hugging-face', selector: '[data-app="hugging-face"]', expectMock: false },
    { name: 'openrouter', selector: '[data-app="openrouter"]', expectMock: false },
    { name: 'ipfs', selector: '[data-app="ipfs"]', expectMock: false },
    { name: 'devices', selector: '[data-app="devices"]', expectMock: false },
    { name: 'settings', selector: '[data-app="settings"]', expectMock: false },
    { name: 'mcp-control', selector: '[data-app="mcp-control"]', expectMock: false },
    { name: 'api-keys', selector: '[data-app="api-keys"]', expectMock: false },
    { name: 'github', selector: '[data-app="github"]', expectMock: false },
    { name: 'oauth', selector: '[data-app="oauth"]', expectMock: false },
    { name: 'ai-cron', selector: '[data-app="ai-cron"]', expectMock: false },
    { name: 'navi', selector: '[data-app="navi"]', expectMock: true },
    { name: 'music-studio', selector: '[data-app="music-studio"]', expectMock: false },
    { name: 'p2p-network', selector: '[data-app="p2p-network"]', expectMock: true },
    { name: 'neural-network', selector: '[data-app="neural-network"]', expectMock: false },
    { name: 'training', selector: '[data-app="training"]', expectMock: false },
    { name: 'peertube', selector: '[data-app="peertube"]', expectMock: false },
    { name: 'calculator', selector: '[data-app="calculator"]', expectMock: false },
    { name: 'clock', selector: '[data-app="clock"]', expectMock: false },
    { name: 'friends', selector: '[data-app="friends"]', expectMock: false },
    { name: 'images', selector: '[data-app="images"]', expectMock: false },
    { name: 'neural-photoshop', selector: '[data-app="neural-photoshop"]', expectMock: false },
    { name: 'cinema', selector: '[data-app="cinema"]', expectMock: false },
    { name: 'notes', selector: '[data-app="notes"]', expectMock: false },
    { name: 'monitor', selector: '[data-app="monitor"]', expectMock: false },
    { name: 'media-player', selector: '[data-app="media-player"]', expectMock: false },
    { name: 'p2p-chat', selector: '[data-app="p2p-chat"]', expectMock: false }
];

let page: Page;

test.describe('SwissKnife Desktop Applications - Real vs Mock Analysis', () => {
    test.beforeAll(async ({ browser }) => {
        page = await browser.newPage();
        
        // Find the desktop server
        let serverUrl = '';
        for (const port of [3001, 3002, 3000]) {
            try {
                const testUrl = `http://localhost:${port}`;
                const response = await page.request.get(testUrl);
                if (response.ok()) {
                    serverUrl = testUrl;
                    console.log(`Found desktop server at ${serverUrl}`);
                    break;
                }
            } catch (error) {
                // Continue to next port
            }
        }
        
        if (!serverUrl) {
            throw new Error('No desktop server found on ports 3000, 3001, or 3002');
        }
        
        await page.goto(serverUrl);
        
        // Wait for desktop to load
        await page.waitForSelector('.desktop', { timeout: 30000 });
        await page.waitForSelector('.desktop-icons', { timeout: 10000 });
    });

    test.afterAll(async () => {
        await page?.close();
    });

    test('should take desktop overview screenshot', async () => {
        // Take full desktop screenshot
        await page.screenshot({ 
            path: path.join(screenshotsDir, 'desktop-overview-analysis.png'),
            fullPage: true 
        });
        
        console.log('Desktop overview screenshot captured for analysis');
    });

    // Test each application individually
    for (const app of applications) {
        test(`should analyze ${app.name} application functionality`, async () => {
            console.log(`\n🔍 Testing ${app.name} application...`);
            
            // Click the app icon
            const appIcon = page.locator(app.selector).first();
            await expect(appIcon).toBeVisible({ timeout: 5000 });
            await appIcon.click();
            
            // Wait for window to appear
            await page.waitForTimeout(2000);
            
            let appWindow = null;
            const windowSelectors = [
                `.window[data-app="${app.name}"]`,
                `.window .window-title:has-text("${app.name}")`,
                '#windows-container .window:last-child'
            ];
            
            for (const selector of windowSelectors) {
                const element = page.locator(selector).first();
                if (await element.count() > 0 && await element.isVisible()) {
                    appWindow = element;
                    break;
                }
            }
            
            if (appWindow) {
                console.log(`✅ Found window for ${app.name}`);
                
                // Take screenshot of the application window
                await appWindow.screenshot({ 
                    path: path.join(screenshotsDir, `${app.name}-analysis.png`) 
                });
                
                // Analyze the content to determine if it's a mock or real application
                const windowContent = await appWindow.textContent();
                const isLikelyMock = await analyzeIfMock(page, appWindow, app.name, windowContent);
                
                // Log analysis results
                console.log(`📊 ${app.name} Analysis:`);
                console.log(`   Expected Mock: ${app.expectMock}`);
                console.log(`   Detected Mock: ${isLikelyMock}`);
                console.log(`   Status: ${isLikelyMock ? '🟡 MOCK/PLACEHOLDER' : '🟢 FUNCTIONAL'}`);
                
                if (app.expectMock && !isLikelyMock) {
                    console.log(`   ⚠️  Expected mock but found functional app`);
                } else if (!app.expectMock && isLikelyMock) {
                    console.log(`   ❌ Expected functional but found mock/placeholder`);
                } else {
                    console.log(`   ✅ Analysis matches expectation`);
                }
                
                // Close the window
                const closeButton = appWindow.locator('.window-close, .close-btn, [data-action="close"]').first();
                if (await closeButton.count() > 0) {
                    await closeButton.click();
                    await page.waitForTimeout(500);
                }
            } else {
                console.log(`❌ No window found for ${app.name}`);
            }
        });
    }
});

async function analyzeIfMock(page: Page, appWindow: any, appName: string, content: string): Promise<boolean> {
    // Check for common mock indicators
    const mockIndicators = [
        'placeholder',
        'mock',
        'coming soon',
        'not available',
        'under development',
        'not implemented',
        'fallback',
        'loading...',
        'app not loaded properly'
    ];
    
    const contentLower = content?.toLowerCase() || '';
    const hasMockText = mockIndicators.some(indicator => contentLower.includes(indicator));
    
    // Check for interactive elements that indicate real functionality
    const interactiveElements = await appWindow.locator('input, button, canvas, textarea, select').count();
    const hasInteractiveElements = interactiveElements > 2; // More than just close/minimize buttons
    
    // Check for specific functional content based on app type
    let hasSpecificFunctionality = false;
    
    switch (appName) {
        case 'terminal':
            hasSpecificFunctionality = contentLower.includes('$') || contentLower.includes('command') || contentLower.includes('prompt');
            break;
        case 'calculator':
            hasSpecificFunctionality = await appWindow.locator('button:has-text("1"), button:has-text("2"), button:has-text("+")').count() > 0;
            break;
        case 'neural-photoshop':
            hasSpecificFunctionality = await appWindow.locator('canvas').count() > 0 || contentLower.includes('layers') || contentLower.includes('brush');
            break;
        case 'music-studio':
        case 'music-studio-unified':
            hasSpecificFunctionality = contentLower.includes('bpm') || contentLower.includes('pattern') || contentLower.includes('track');
            break;
        case 'peertube':
            hasSpecificFunctionality = contentLower.includes('video') || contentLower.includes('room') || contentLower.includes('watch');
            break;
        case 'media-player':
            hasSpecificFunctionality = contentLower.includes('play') || contentLower.includes('playlist') || contentLower.includes('volume');
            break;
        default:
            hasSpecificFunctionality = hasInteractiveElements;
    }
    
    // Determine if it's likely a mock
    const isLikelyMock = hasMockText || (!hasInteractiveElements && !hasSpecificFunctionality);
    
    return isLikelyMock;
}