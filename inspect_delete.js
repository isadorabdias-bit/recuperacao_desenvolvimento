const { chromium } = require('playwright');
(async() => {
  const browser = await chromium.launch({ headless:true });
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  page.on('response', async res => {
    if (res.url().includes('/api.php')) {
      console.log('API_RESPONSE', res.status(), await res.text());
    }
  });
  await page.goto('http://localhost/recuperacao_desenvolvimento/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  console.log('BUTTONS', await page.locator('.delete-button').count());
  if (await page.locator('.delete-button').count() > 0) {
    await page.locator('.delete-button').first().click();
    await page.waitForTimeout(1000);
    console.log('FEEDBACK', await page.locator('#feedbackMessage').textContent());
  }
  await browser.close();
})();
