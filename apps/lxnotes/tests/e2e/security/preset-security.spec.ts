import { test, expect, Page } from '@playwright/test'

// Helper to generate random user
const generateUser = () => ({
    email: `test-${Math.random().toString(36).substring(7)}@example.com`,
    password: 'Password123!',
    name: `Test User ${Math.random().toString(36).substring(7)}`
});

async function registerUser(page: Page, user: ReturnType<typeof generateUser>) {
    await page.goto('/auth/register');
    await page.fill('input[name="full_name"]', user.name);
    await page.fill('input[name="email"]', user.email);
    await page.fill('input[name="password"]', user.password);
    await page.getByRole('button', { name: 'Sign Up' }).click();
    // Wait for redirect to dashboard or onboarding
    await page.waitForURL(/\/dashboard|production/);
}

async function createProduction(page: Page, name: string) {
    // Navigate to create production if not already there (dashboard logic varies)
    // Assuming we are on dashboard or can get there
    if (!page.url().includes('dashboard') && !page.url().includes('production')) {
        await page.goto('/dashboard');
    }

    // Find Create Production button
    // Might need to check if we are on empty state or list
    // The production-sharing test used: await page.getByRole('button', { name: 'New Production' }).click();

    // Check if New Production button exists
    const newProdBtn = page.getByRole('button', { name: 'New Production' });
    if (await newProdBtn.isVisible()) {
        await newProdBtn.click();
    } else {
        // Maybe we are on a page where we can't see it?
        // Try direct navigation or assume we are on dashboard with button
        // Or maybe strictly follow the sharing test steps
        await page.goto('/dashboard');
        await page.getByRole('button', { name: 'New Production' }).click();
    }

    await page.fill('input[name="name"]', name);
    await page.getByRole('button', { name: 'Create Production' }).click();

    // Wait for production page
    await page.waitForURL(/\/production\/.*\/cue-notes/);
    const productionUrl = page.url();
    const productionId = productionUrl.split('/')[4];
    return { id: productionId, name };
}

async function logout(page: Page) {
    await page.goto('/auth/signout');
    await page.waitForURL('/');
    // Verify we are logged out (e.g. check for Sign In button)
    await expect(page.getByText('Sign In').first()).toBeVisible();
}

test.describe.skip('Preset Security', () => {
    test('should restrict preset access to production members', async ({ page }) => {
        // 1. Create Owner and Stranger
        const owner = generateUser();
        const stranger = generateUser();

        // 2. Register Owner & Create Production
        await registerUser(page, owner);
        const production = await createProduction(page, 'Secure Production');

        // 3. Create a Custom Preset as Owner
        // Navigate to Cue Notes -> Print -> New Preset
        await page.goto(`/production/${production.id}/cue`);

        // Open Print Sidebar
        await page.getByRole('button', { name: /print/i }).click();

        // Click New Preset
        // Assuming "New Preset" is a card or button
        await page.getByTestId('preset-card-create-new').click();

        // Wizard Steps
        await expect(page.getByTestId('preset-wizard')).toBeVisible();

        const presetName = 'Secret Owner Preset';
        await page.getByPlaceholder('e.g. Director Copy').fill(presetName);

        // Go through steps
        // Name (Step 1) -> Next
        await page.getByRole('button', { name: /next/i }).click();
        // Status (Step 2) -> Next
        await page.getByRole('button', { name: /next/i }).click();
        // Types (Step 3) -> Next
        await page.getByRole('button', { name: /next/i }).click();
        // Priorities (Step 4) -> Next
        await page.getByRole('button', { name: /next/i }).click();
        // Sorting (Step 5) -> Next
        await page.getByRole('button', { name: /next/i }).click();
        // Grouping (Step 6) -> Next
        await page.getByRole('button', { name: /next/i }).click();
        // Page Layout (Step 7) -> Save (For Print Variant)
        // Wait, variant defaults to print in sidebar usually?
        // Let's assume it's print variant for Cue Notes sidebar default or we selected it.
        // The wizard shows "Save Preset" on last step.
        await page.getByRole('button', { name: /save preset/i }).click();

        // Verify preset is visible for Owner
        await expect(page.getByText(presetName)).toBeVisible();

        // 4. Logout
        await logout(page);

        // 5. Register/Login as Stranger
        await registerUser(page, stranger);

        // 6. Attempt to access Owner's Production
        await page.goto(`/production/${production.id}/cue`);

        // 7. Verify Access Denied
        // RLS should prevent fetching, so dashboard might show error or redirect
        // Or if we can assume 404 behavior for "Production not found"
        await expect(page.getByText('Production not found')).toBeVisible();

        // 8. Verify API Direct Access Denied
        const response = await page.request.get(`/api/productions/${production.id}/print-presets`);
        // Should be 403 or 404 (since "production not found" check happens)
        expect([403, 404]).toContain(response.status());
    })
})
