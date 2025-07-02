import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: 'jeevancodes@gmail.com',
  password: 'Jeeva@900'
};

test('Debug login flow', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');
  
  // Take a screenshot to see what we get
  await page.screenshot({ path: 'debug-home.png' });
  
  // Try to go to login
  await page.goto('/login');
  await page.screenshot({ path: 'debug-login-page.png' });
  
  // Check what elements are available
  const forms = await page.locator('form').count();
  console.log(`Found ${forms} forms on login page`);
  
  const emailInputs = await page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').count();
  console.log(`Found ${emailInputs} email inputs`);
  
  const passwordInputs = await page.locator('input[type="password"], input[name="password"]').count();
  console.log(`Found ${passwordInputs} password inputs`);
  
  const submitButtons = await page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Login")').count();
  console.log(`Found ${submitButtons} submit buttons`);
  
  // Try to login
  if (emailInputs > 0 && passwordInputs > 0) {
    await page.fill('input[type="email"], input[name="email"], input[placeholder*="email"]', TEST_USER.email);
    await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
    
    await page.screenshot({ path: 'debug-filled-form.png' });
    
    // Click submit
    await page.click('button[type="submit"], button:has-text("Sign"), button:has-text("Login")');
    
    // Wait a bit and see what happens
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'debug-after-submit.png' });
    
    console.log('Current URL:', page.url());
    
    // Check for common authenticated elements
    const navElements = await page.locator('nav, .sidebar, [data-testid="sidebar"], aside').count();
    console.log(`Found ${navElements} navigation elements`);
    
    const h1Elements = await page.locator('h1').count();
    console.log(`Found ${h1Elements} h1 elements`);
    
    if (h1Elements > 0) {
      const h1Texts = await page.locator('h1').allTextContents();
      console.log('H1 texts:', h1Texts);
    }
  }
});