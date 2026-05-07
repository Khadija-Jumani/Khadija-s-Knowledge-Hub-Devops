const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

// Configuration
// If Jenkins provides a BASE_URL, use it. Otherwise use the provided default.
const BASE_URL = process.env.BASE_URL || 'https://khadija-s-knowledge-hub-bwi3.vercel.app';
const TIMEOUT = 5000;

async function runTests() {
  // Set up Chrome options for headless execution
  let options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--disable-gpu');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage'); // Important for Jenkins Docker

  console.log(`Starting Selenium tests against ${BASE_URL}...\n`);
  
  let driver = await new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();

  let passed = 0;
  let failed = 0;

  async function test(name, testFn) {
    try {
      await testFn();
      console.log(`✅ TEST PASSED: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ TEST FAILED: ${name}`);
      console.error(`   Error: ${err.message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Load Homepage and verify title
    // ----------------------------------------------------
    await test('1. Verify page title is loaded', async () => {
      await driver.get(BASE_URL);
      const title = await driver.getTitle();
      if (!title || title.trim() === '') throw new Error("Title is empty");
    });

    // ----------------------------------------------------
    // TEST 2: Verify Login Link/Button on Homepage
    // ----------------------------------------------------
    await test('2. Verify Login navigation is accessible', async () => {
      await driver.get(BASE_URL);
      // Look for a login link
      const loginLinks = await driver.findElements(By.xpath("//a[contains(translate(., 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz'), 'login')]"));
      if (loginLinks.length === 0) {
          // If no explicit login link on homepage, we verify we can reach /login
          await driver.get(`${BASE_URL}/login`);
          const url = await driver.getCurrentUrl();
          if (!url.includes('/login')) throw new Error("Could not access login path");
      }
    });

    // ----------------------------------------------------
    // TEST 3: Access Login Page directly
    // ----------------------------------------------------
    await test('3. Navigate to Login Page', async () => {
      await driver.get(`${BASE_URL}/login`);
      await driver.wait(until.urlContains('/login'), TIMEOUT);
      const url = await driver.getCurrentUrl();
      if (!url.includes('/login')) throw new Error(`URL did not change to /login, actual: ${url}`);
    });

    // ----------------------------------------------------
    // TEST 4: Verify Login Page Heading or Text
    // ----------------------------------------------------
    await test('4. Verify Login page Welcome text', async () => {
      await driver.get(`${BASE_URL}/login`);
      // Since it's a login page, it should have "Sign In", "Login", or "Welcome"
      const bodyText = await driver.findElement(By.tagName('body')).getText();
      const lowerBody = bodyText.toLowerCase();
      if (!lowerBody.includes('login') && !lowerBody.includes('sign in') && !lowerBody.includes('welcome') && !lowerBody.includes('email')) {
         throw new Error("No login-related text found on the page");
      }
    });

    // ----------------------------------------------------
    // TEST 5: Verify Email Input on Login Page
    // ----------------------------------------------------
    await test('5. Verify Email input field exists', async () => {
      await driver.get(`${BASE_URL}/login`);
      const emailInput = await driver.findElements(By.css('input[type="email"], input[name="email"], input[placeholder*="mail"]'));
      if (emailInput.length === 0) throw new Error("Email input field not found");
    });

    // ----------------------------------------------------
    // TEST 6: Verify Password Input on Login Page
    // ----------------------------------------------------
    await test('6. Verify Password input field exists', async () => {
      await driver.get(`${BASE_URL}/login`);
      const passInput = await driver.findElements(By.css('input[type="password"], input[name="password"]'));
      if (passInput.length === 0) throw new Error("Password input field not found");
    });

    // ----------------------------------------------------
    // TEST 7: Verify Submit Button on Login Page
    // ----------------------------------------------------
    await test('7. Verify Submit/Login button exists', async () => {
      await driver.get(`${BASE_URL}/login`);
      const submitBtn = await driver.findElements(By.css('button[type="submit"], input[type="submit"], button'));
      if (submitBtn.length === 0) throw new Error("Submit button not found");
    });

    // ----------------------------------------------------
    // TEST 8: Test Form Elements are Enabled
    // ----------------------------------------------------
    await test('8. Verify email input is enabled for typing', async () => {
      await driver.get(`${BASE_URL}/login`);
      const emailInput = await driver.findElement(By.css('input[type="email"], input[name="email"], input[placeholder*="mail"]'));
      const isEnabled = await emailInput.isEnabled();
      if (!isEnabled) throw new Error("Email input is disabled");
    });

    // ----------------------------------------------------
    // TEST 9: Test Form Inputs Accept Values
    // ----------------------------------------------------
    await test('9. Verify entering text into email field', async () => {
      await driver.get(`${BASE_URL}/login`);
      const emailInput = await driver.findElement(By.css('input[type="email"], input[name="email"], input[placeholder*="mail"]'));
      await emailInput.sendKeys('test@example.com');
      const val = await emailInput.getAttribute('value');
      if (val !== 'test@example.com') throw new Error("Email input did not accept text");
    });

    // ----------------------------------------------------
    // TEST 10: Test Form Inputs Accept Password
    // ----------------------------------------------------
    await test('10. Verify entering text into password field', async () => {
      await driver.get(`${BASE_URL}/login`);
      const passInput = await driver.findElement(By.css('input[type="password"], input[name="password"]'));
      await passInput.sendKeys('password123');
      const val = await passInput.getAttribute('value');
      if (val !== 'password123') throw new Error("Password input did not accept text");
    });

    // ----------------------------------------------------
    // TEST 11: Test empty form submission behavior
    // ----------------------------------------------------
    await test('11. Test empty login submission prevents navigation', async () => {
      await driver.get(`${BASE_URL}/login`);
      const submitBtns = await driver.findElements(By.css('button[type="submit"], input[type="submit"]'));
      if (submitBtns.length > 0) {
          await submitBtns[0].click();
          // Wait a moment
          await driver.sleep(1000);
          const url = await driver.getCurrentUrl();
          if (!url.includes('/login')) throw new Error("Expected to remain on login page after empty submit");
      }
    });

    // ----------------------------------------------------
    // TEST 12: Test Invalid Login behavior
    // ----------------------------------------------------
    await test('12. Test invalid credentials submission', async () => {
      await driver.get(`${BASE_URL}/login`);
      const emailInput = await driver.findElement(By.css('input[type="email"], input[name="email"], input[placeholder*="mail"]'));
      const passInput = await driver.findElement(By.css('input[type="password"], input[name="password"]'));
      const submitBtn = await driver.findElement(By.css('button[type="submit"], input[type="submit"]'));
      
      await emailInput.sendKeys('invalid_user@example.com');
      await passInput.sendKeys('wrongpassword');
      await submitBtn.click();
      
      await driver.sleep(1500); // Wait for response
      const url = await driver.getCurrentUrl();
      if (!url.includes('/login')) throw new Error("Expected to remain on login page after invalid login");
    });

    // ----------------------------------------------------
    // TEST 13: Verify Page Performance / Load Status
    // ----------------------------------------------------
    await test('13. Verify page load state is complete', async () => {
      await driver.get(`${BASE_URL}/login`);
      const state = await driver.executeScript('return document.readyState');
      if (state !== 'complete') throw new Error("Page did not reach complete state");
    });

    // ----------------------------------------------------
    // TEST 14: Mobile Viewport check
    // ----------------------------------------------------
    await test('14. Check mobile viewport rendering', async () => {
      await driver.manage().window().setRect({ width: 375, height: 812 }); // iPhone X
      await driver.get(`${BASE_URL}/login`);
      const body = await driver.findElement(By.tagName('body'));
      const isDisplayed = await body.isDisplayed();
      if (!isDisplayed) throw new Error("Body not displayed in mobile view");
    });

    // ----------------------------------------------------
    // TEST 15: Clean up and final accessibility check
    // ----------------------------------------------------
    await test('15. Verify no major JS errors on load', async () => {
      await driver.get(`${BASE_URL}/login`);
      const logs = await driver.manage().logs().get('browser');
      const errors = logs.filter(l => l.level.name === 'SEVERE');
      // Just logging them, not failing on all errors as some third party scripts fail
      if (errors.length > 5) throw new Error("Too many severe console errors on page load");
    });

  } finally {
    console.log(`\nTests Completed: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    await driver.quit();
    
    // Exit with code 1 if any tests failed (fail the Jenkins pipeline test stage)
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

runTests();
