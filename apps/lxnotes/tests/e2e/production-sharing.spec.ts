import { test, expect } from '@playwright/test'

// Helper to generate random user
const generateUser = () => ({
    email: `test-${Math.random().toString(36).substring(7)}@example.com`,
    password: 'Password123!',
    name: 'Test User'
});

test.describe.skip('Production Sharing', () => {
    // Skipped because automated login with Google Auth is not supported in this test environment.
    // Requires manual verification or a mock auth provider.
    test('should allow a user to join via share link', async ({ page }) => {
        // 1. Register & Login as Admin
        const admin = generateUser();
        await page.goto('/auth/register');
        await page.fill('input[name="full_name"]', admin.name);
        await page.fill('input[name="email"]', admin.email);
        await page.fill('input[name="password"]', admin.password);
        await page.getByRole('button', { name: 'Sign Up' }).click();

        // 2. Create Production
        // Wait for dashboard or production list
        await page.waitForURL(/\/dashboard|production/);
        await page.getByRole('button', { name: 'New Production' }).click();
        await page.fill('input[name="name"]', 'Share Test Prod');
        await page.getByRole('button', { name: 'Create Production' }).click();

        // Wait for production page
        await page.waitForURL(/\/production\/.*\/cue-notes/);
        const productionUrl = page.url();
        const productionId = productionUrl.split('/')[4];

        // 3. Get Share Code
        await page.goto(`/production/${productionId}/settings`);
        // Wait for the share code section to load
        await expect(page.locator('text=Share Production')).toBeVisible();
        const codeElement = page.locator('text=Share Code').locator('..').locator('.font-mono');
        await expect(codeElement).toBeVisible();
        const shareCode = await codeElement.innerText();
        expect(shareCode).toMatch(/^[A-Z0-9]{6}$/);

        // 4. Logout
        await page.goto('/auth/signout');
        await page.waitForURL('/');

        // 5. Register Member
        const member = generateUser();
        await page.goto('/auth/register');
        await page.fill('input[name="full_name"]', member.name);
        await page.fill('input[name="email"]', member.email);
        await page.fill('input[name="password"]', member.password);
        await page.getByRole('button', { name: 'Sign Up' }).click();
        // Assuming redirection to dashboard
        await page.waitForURL(/\/dashboard|production/);

        // 6. Visit Share Link
        await page.goto(`/p/${shareCode}`);

        // Verify Landing Page
        await expect(page.getByText('Join Production')).toBeVisible();
        await expect(page.getByText('Share Test Prod')).toBeVisible();
        await expect(page.getByText(`Code: ${shareCode}`)).toBeVisible();

        // Click Join
        await page.getByRole('button', { name: /Join/ }).click();

        // Verify Success
        await page.waitForURL(/\/production\/.*\/cue-notes/);
        await expect(page.getByText('Cue Notes')).toBeVisible();
    });

    test('should redirect unauthenticated users', async ({ page }) => {
        // 1. Create Admin & Production (Simplified flow just to get code)
        const admin = generateUser();
        await page.goto('/auth/register');
        await page.fill('input[name="full_name"]', admin.name);
        await page.fill('input[name="email"]', admin.email);
        await page.fill('input[name="password"]', admin.password);
        await page.getByRole('button', { name: 'Sign Up' }).click();

        await page.waitForURL(/\/dashboard|production/);
        await page.getByRole('button', { name: 'New Production' }).click();
        await page.fill('input[name="name"]', 'Auth Flow Prod');
        await page.getByRole('button', { name: 'Create Production' }).click();
        await page.waitForURL(/\/production\/.*\/cue-notes/);
        const productionId = page.url().split('/')[4];

        await page.goto(`/production/${productionId}/settings`);
        const codeElement = page.locator('text=Share Code').locator('..').locator('.font-mono');
        const shareCode = await codeElement.innerText();

        await page.goto('/auth/signout');

        // 2. Visit Link as Guest
        await page.goto(`/p/${shareCode}`);

        // Should be at login
        await expect(page).toHaveURL(/\/auth\/login/);

        // 3. Login
        const member = generateUser();
        await page.goto('/auth/register');
        await page.fill('input[name="full_name"]', member.name);
        await page.fill('input[name="email"]', member.email);
        await page.fill('input[name="password"]', member.password);
        await page.getByRole('button', { name: 'Sign Up' }).click();

        // After registration/login, manually navigate back to share link 
        // (since registration might not respect 'next' param properly in this mock flow)
        await page.goto(`/p/${shareCode}`);

        // Should see join page
        await expect(page.getByText('Join Production')).toBeVisible();
    })
});
