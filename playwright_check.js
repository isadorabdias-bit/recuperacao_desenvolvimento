const { chromium } = require('playwright');
(async() => {
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGEERROR:', err.message));
  await page.goto('http://localhost/recuperacao_desenvolvimento/index.html', {waitUntil:'networkidle'});
  await page.waitForTimeout(1500);
  const count = await page.locator('.edit-button').count();
  console.log('edit_count=', count);
  if (count > 0) {
    const label = await page.locator('.edit-button').first().textContent();
    console.log('first_edit=', label);
    await page.locator('.edit-button').first().click();
    await page.waitForTimeout(500);
    const title = await page.locator('#formTitle').textContent();
    console.log('form_title=', title);
    const equipment = await page.locator('#equipment').inputValue();
    console.log('equipment=', equipment);
  }
  const deleteBtn = page.locator('.delete-button').first();
  if (await deleteBtn.count() > 0) {
    console.log('delete_exists=', await deleteBtn.textContent());
  }
  await browser.close();
})();
