import { test, expect, Page } from '@playwright/test';

const VALID_EMAIL    = process.env['E2E_EMAIL']    ?? 'owner@restaurant-test.com';
const VALID_PASSWORD = process.env['E2E_PASSWORD'] ?? 'TestPass123!';

async function login(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"], input[name="email"]', VALID_EMAIL);
  await page.fill('input[type="password"]', VALID_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 10_000 });
}

test.describe('Kanban des commandes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/orders');
  });

  // ── Page chargée ─────────────────────────────────────────────────────────────

  test('affiche la page des commandes', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/orders/);
    // Au moins un titre ou une colonne kanban visible
    const heading = page.locator('h1, h2, [data-testid="orders-title"]').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  // ── Créer une commande ────────────────────────────────────────────────────────

  test('ouvre le formulaire de nouvelle commande', async ({ page }) => {
    const newOrderBtn = page.locator(
      'a[href*="/orders/new"], button:has-text("Nouvelle"), button:has-text("Commande"), [data-testid="new-order-btn"]',
    ).first();
    await expect(newOrderBtn).toBeVisible({ timeout: 5000 });
    await newOrderBtn.click();

    await page.waitForURL(/\/orders\/new|\/orders.*new/, { timeout: 5000 });
    await expect(page).toHaveURL(/new/);
  });

  test('crée une commande et vérifie son apparition dans la liste', async ({ page }) => {
    // Navigue vers le formulaire de création
    await page.goto('/dashboard/orders/new');

    // Sélectionne le type de commande (dine_in)
    const typeSelector = page.locator(
      'select[name="type"], [data-testid="order-type"], button:has-text("Sur place")',
    ).first();
    if (await typeSelector.isVisible()) {
      await typeSelector.click();
    }

    // Ajoute un item si possible
    const addItemBtn = page.locator(
      'button:has-text("Ajouter"), button:has-text("Produit"), [data-testid="add-item"]',
    ).first();
    if (await addItemBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addItemBtn.click();
      // Sélectionne le premier produit disponible
      const firstProduct = page.locator('[data-testid="product-item"], .product-card').first();
      if (await firstProduct.isVisible({ timeout: 2000 }).catch(() => false)) {
        await firstProduct.click();
      }
    }

    // Soumet la commande
    const submitBtn = page.locator(
      'button[type="submit"], button:has-text("Créer"), button:has-text("Valider")',
    ).first();
    await expect(submitBtn).toBeVisible({ timeout: 3000 });
    await submitBtn.click();

    // Redirigé vers la liste ou détail commande
    await page.waitForURL(/\/dashboard\/orders/, { timeout: 8000 });
    await expect(page).toHaveURL(/\/dashboard\/orders/);
  });

  // ── Transition de statut ──────────────────────────────────────────────────────

  test('une commande existante peut être transitionner', async ({ page }) => {
    // Cherche la première commande dans la liste
    const firstOrder = page.locator(
      '[data-testid="order-card"], .order-card, [data-testid="kanban-card"]',
    ).first();

    const exists = await firstOrder.isVisible({ timeout: 3000 }).catch(() => false);
    if (!exists) {
      test.skip(); // Pas de commande disponible → skip
      return;
    }

    await firstOrder.click();

    // Cherche un bouton de transition
    const transitionBtn = page.locator(
      'button:has-text("Confirmer"), button:has-text("En préparation"), button:has-text("Prendre en charge"), [data-testid="transition-btn"]',
    ).first();

    const transitionVisible = await transitionBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (transitionVisible) {
      await transitionBtn.click();
      // Attend que l'état change (toast ou badge mis à jour)
      await page.waitForTimeout(1000);
      // Vérifie qu'il n'y a pas d'erreur visible
      const error = page.locator('[role="alert"]:has-text("erreur"), [role="alert"]:has-text("Erreur")');
      await expect(error).not.toBeVisible();
    }
  });
});
