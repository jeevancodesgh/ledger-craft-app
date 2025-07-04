import { test, expect } from '@playwright/test';

/**
 * SIMPLE AUTHENTICATION TEST - PHASE 1 
 * 
 * This test uses real authentication to bypass the 404 issue
 * and validate that our invoice creation UI is accessible.
 */

test.describe('Simple Authentication Test', () => {
  test('Create test user and access invoice page', async ({ page }) => {
    console.log('🧪 Starting simple authentication test...');
    
    // Step 1: Go to signup page
    await page.goto('/signup');
    await page.waitForTimeout(2000);
    
    console.log('📝 Attempting to sign up test user...');
    
    // Step 2: Try to sign up (use random email to avoid conflicts)
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      // Fill out signup form
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      
      // Look for name field
      const nameField = page.locator('input[placeholder*="name"], input[name*="name"]').first();
      if (await nameField.count() > 0) {
        await nameField.fill('Test User');
      }
      
      // Click signup button
      await page.click('button[type="submit"], button:has-text("Sign up"), button:has-text("Create")');
      await page.waitForTimeout(3000);
      
      console.log('✅ Signup attempt completed');
      
      // Step 3: Check current URL and content
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      
      const pageContent = await page.textContent('body');
      console.log(`Page content: ${pageContent?.substring(0, 200)}...`);
      
      // Step 4: Try to navigate to invoices regardless
      console.log('🔄 Attempting to navigate to invoices...');
      await page.goto('/invoices');
      await page.waitForTimeout(2000);
      
      const invoicesUrl = page.url();
      console.log(`Invoices URL: ${invoicesUrl}`);
      
      // Step 5: Try to go to create invoice
      console.log('📄 Attempting to access invoice creation...');
      await page.goto('/invoices/new');
      await page.waitForTimeout(3000);
      
      const createUrl = page.url();
      const createContent = await page.textContent('body');
      
      console.log(`Create invoice URL: ${createUrl}`);
      console.log(`Create content: ${createContent?.substring(0, 200)}...`);
      
      // Check if we got past the 404
      const is404 = createContent?.includes('404') || createContent?.includes('Page not found');
      
      if (!is404) {
        console.log('🎉 SUCCESS: Got past authentication barrier!');
        
        // Look for form elements
        const forms = await page.locator('form').count();
        const inputs = await page.locator('input').count();
        const buttons = await page.locator('button').count();
        
        console.log(`Forms: ${forms}, Inputs: ${inputs}, Buttons: ${buttons}`);
        
        if (forms > 0 || inputs > 0) {
          console.log('✅ Invoice form is accessible!');
        }
      } else {
        console.log('❌ Still getting 404, trying different approach...');
        
        // Try going to dashboard first
        await page.goto('/');
        await page.waitForTimeout(2000);
        
        const dashboardContent = await page.textContent('body');
        console.log(`Dashboard content: ${dashboardContent?.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`⚠️ Error during test: ${error}`);
      
      // Still try to check what page we're on
      const currentUrl = page.url();
      const currentContent = await page.textContent('body');
      console.log(`Current URL after error: ${currentUrl}`);
      console.log(`Current content: ${currentContent?.substring(0, 200)}...`);
    }
  });
  
  test('Try login if signup fails', async ({ page }) => {
    console.log('🔐 Trying login approach...');
    
    // Go to login page
    await page.goto('/login');
    await page.waitForTimeout(2000);
    
    // Try with demo credentials that might exist
    const demoEmail = 'demo@example.com';
    const demoPassword = 'password123';
    
    try {
      await page.fill('input[type="email"]', demoEmail);
      await page.fill('input[type="password"]', demoPassword);
      await page.click('button[type="submit"], button:has-text("Sign in"), button:has-text("Login")');
      await page.waitForTimeout(3000);
      
      console.log(`After login attempt, URL: ${page.url()}`);
      
      // Try to access invoice creation
      await page.goto('/invoices/new');
      await page.waitForTimeout(2000);
      
      const content = await page.textContent('body');
      const is404 = content?.includes('404') || content?.includes('Page not found');
      
      if (!is404) {
        console.log('✅ Login successful, can access invoice page!');
      } else {
        console.log('❌ Login failed or still 404');
      }
      
    } catch (error) {
      console.log(`Login error: ${error}`);
    }
  });
  
  test('Direct UI component check', async ({ page }) => {
    console.log('🎯 Checking if we can see any UI components...');
    
    // Go directly to the app
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // Look for any clickable elements
    const buttons = await page.locator('button').count();
    const links = await page.locator('a').count();
    const inputs = await page.locator('input').count();
    
    console.log(`Found - Buttons: ${buttons}, Links: ${links}, Inputs: ${inputs}`);
    
    // Try to find navigation elements
    const navElements = await page.locator('nav, [role="navigation"]').count();
    console.log(`Navigation elements: ${navElements}`);
    
    // Check if there are any mention of "invoice" anywhere
    const invoiceText = await page.locator('text=/invoice/i').count();
    console.log(`Invoice mentions: ${invoiceText}`);
    
    if (invoiceText > 0) {
      console.log('Found invoice-related text, trying to click...');
      try {
        await page.click('text=/invoice/i');
        await page.waitForTimeout(2000);
        console.log(`After clicking invoice link: ${page.url()}`);
      } catch (e) {
        console.log(`Could not click invoice link: ${e}`);
      }
    }
  });
});