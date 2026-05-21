import { test, expect } from '@playwright/test';

const VALID_EMAIL    = process.env['E2E_EMAIL']    ?? 'owner@restaurant-test.com';
const VALID_PASSWORD = process.env['E2E_PASSWORD'] ?? 'TestPass123!';

test.describe('Login', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  // ── Formulaire visible ───────────────────────────────────────────────────────

  test('affiche le formulaire de connexion', async ({ page }) => {
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  // ── Login invalide ───────────────────────────────────────────────────────────

  test('affiche une erreur pour des identifiants invalides', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', 'inconnu@test.com');
    await page.fill('input[type="password"]', 'mauvais-mdp');
    await page.click('button[type="submit"]');

    // Attend un message d'erreur
    const errorMsg = page.locator('[role="alert"], .error, [data-testid="login-error"]');
    await expect(errorMsg).toBeVisible({ timeout: 5000 });
  });

  test('affiche une erreur si email manquant', async ({ page }) => {
    await page.fill('input[type="password"]', 'SomePassword1!');
    await page.click('button[type="submit"]');

    // Le formulaire ne soumet pas (validation HTML5 ou message d'erreur)
    await expect(page).toHaveURL(/\/login/);
  });

  // ── Login valide + redirect ───────────────────────────────────────────────────

  test('redirige vers le dashboard après connexion valide', async ({ page }) => {
    await page.fill('input[type="email"], input[name="email"]', VALID_EMAIL);
    await page.fill('input[type="password"]', VALID_PASSWORD);
    await page.click('button[type="submit"]');

    // Attend la redirection vers le dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  // ── Redirect post-login ───────────────────────────────────────────────────────

  test('redirige vers /login si accès direct à /dashboard sans session', async ({ page }) => {
    // Accès sans être authentifié
    await page.goto('/dashboard');
    await page.waitForURL(/\/login/, { timeout: 5000 });
    await expect(page).toHaveURL(/\/login/);
  });
});
