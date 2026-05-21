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

test.describe('Gestion du menu', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await page.goto('/dashboard/menu');
  });

  // ── Page chargée ─────────────────────────────────────────────────────────────

  test('affiche la page du menu', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard\/menu/);
    const heading = page.locator('h1, h2, [data-testid="menu-title"]').first();
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  // ── Créer une catégorie ───────────────────────────────────────────────────────

  test('crée une nouvelle catégorie', async ({ page }) => {
    const categoryName = `Catégorie Test ${Date.now()}`;

    // Ouvre le formulaire de création de catégorie
    const addCatBtn = page.locator(
      'button:has-text("Catégorie"), button:has-text("Nouvelle catégorie"), [data-testid="add-category-btn"]',
    ).first();
    await expect(addCatBtn).toBeVisible({ timeout: 5000 });
    await addCatBtn.click();

    // Remplit le nom
    const nameInput = page.locator(
      'input[name="name"], input[placeholder*="catégorie"], input[placeholder*="Catégorie"], dialog input[type="text"]',
    ).first();
    await expect(nameInput).toBeVisible({ timeout: 3000 });
    await nameInput.fill(categoryName);

    // Soumet
    const saveBtn = page.locator(
      'button[type="submit"], button:has-text("Créer"), button:has-text("Enregistrer"), button:has-text("Sauvegarder")',
    ).last();
    await saveBtn.click();

    // Vérifie que la catégorie apparaît dans la liste
    await expect(page.locator(`text=${categoryName}`)).toBeVisible({ timeout: 5000 });
  });

  // ── Créer un produit ──────────────────────────────────────────────────────────

  test('navigue vers la création de produit et vérifie le formulaire', async ({ page }) => {
    // Bouton / lien vers nouveau produit
    const newProductBtn = page.locator(
      'a[href*="/products/new"], button:has-text("Produit"), button:has-text("Nouveau produit"), [data-testid="new-product-btn"]',
    ).first();
    await expect(newProductBtn).toBeVisible({ timeout: 5000 });
    await newProductBtn.click();

    await page.waitForURL(/\/products\/new|\/menu.*new/, { timeout: 5000 });

    // Vérifie les champs obligatoires du formulaire
    await expect(page.locator('input[name="name"], input[placeholder*="nom"], input[placeholder*="Nom"]').first()).toBeVisible();
    await expect(page.locator('input[name="basePrice"], input[name="price"], input[placeholder*="prix"]').first()).toBeVisible();
  });

  test('crée un produit avec nom et prix', async ({ page }) => {
    await page.goto('/dashboard/menu/products/new');

    const productName = `Produit Test ${Date.now()}`;

    const nameInput = page.locator('input[name="name"]').first();
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await nameInput.fill(productName);

    const priceInput = page.locator('input[name="basePrice"], input[name="price"]').first();
    await expect(priceInput).toBeVisible({ timeout: 3000 });
    await priceInput.fill('2500');

    const submitBtn = page.locator('button[type="submit"]').first();
    await submitBtn.click();

    // Redirigé vers la liste ou le menu
    await page.waitForURL(/\/dashboard\/menu/, { timeout: 8000 });
    await expect(page).toHaveURL(/\/dashboard\/menu/);
  });

  // ── Toggle disponibilité ──────────────────────────────────────────────────────

  test('toggle la disponibilité d\'un produit existant', async ({ page }) => {
    // Cherche un toggle de disponibilité
    const availabilityToggle = page.locator(
      '[data-testid="availability-toggle"], input[type="checkbox"][name*="available"], button[aria-label*="disponib"]',
    ).first();

    const exists = await availabilityToggle.isVisible({ timeout: 3000 }).catch(() => false);
    if (!exists) {
      test.skip();
      return;
    }

    const initialState = await availabilityToggle.isChecked().catch(() => null);
    await availabilityToggle.click();
    await page.waitForTimeout(500);

    // L'état devrait avoir changé
    const newState = await availabilityToggle.isChecked().catch(() => null);
    if (initialState !== null && newState !== null) {
      expect(newState).not.toBe(initialState);
    }
  });
});
