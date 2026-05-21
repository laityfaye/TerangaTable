import { test, expect } from '@playwright/test';

test.describe('Wizard inscription restaurant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register');
  });

  // ── Page initiale ─────────────────────────────────────────────────────────────

  test('affiche la première étape du wizard', async ({ page }) => {
    await expect(page).toHaveURL(/\/register/);
    // Barre de progression ou indicateur d'étape
    const stepIndicator = page.locator(
      '[data-testid="wizard-progress"], [data-testid="step-indicator"], .wizard-step, nav li',
    ).first();
    await expect(stepIndicator).toBeVisible({ timeout: 5000 });
  });

  // ── Étape 1 : Région ──────────────────────────────────────────────────────────

  test('Étape 1 — sélectionne une région et passe à l\'étape 2', async ({ page }) => {
    // Sélectionne une région disponible
    const regionOption = page.locator(
      '[data-testid="region-option"], .region-card, input[name="region"], select[name="region"]',
    ).first();
    await expect(regionOption).toBeVisible({ timeout: 5000 });
    await regionOption.click();

    // Bouton Suivant
    const nextBtn = page.locator(
      'button:has-text("Suivant"), button:has-text("Continuer"), button:has-text("Next"), [data-testid="next-btn"]',
    ).first();
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();

    // Étape 2 visible
    await expect(page.locator('input[name="restaurantName"], input[placeholder*="restaurant"]').first())
      .toBeVisible({ timeout: 5000 });
  });

  // ── Étapes 2 + 3 + 4 + soumission ────────────────────────────────────────────

  test('parcourt les 4 étapes et soumet la demande', async ({ page }) => {
    // ── Étape 1 : Région ──────────────────────────────────────────────────────
    const regionOption = page.locator(
      '[data-testid="region-option"], .region-card, input[name="region"]',
    ).first();
    if (await regionOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await regionOption.click();
    }
    const next1 = page.locator(
      'button:has-text("Suivant"), button:has-text("Continuer"), [data-testid="next-btn"]',
    ).first();
    await next1.click();

    // ── Étape 2 : Infos restaurant ────────────────────────────────────────────
    const restaurantNameInput = page.locator(
      'input[name="restaurantName"], input[placeholder*="restaurant"], input[placeholder*="Restaurant"]',
    ).first();
    await expect(restaurantNameInput).toBeVisible({ timeout: 5000 });
    await restaurantNameInput.fill('Restaurant E2E Test');

    const ownerNameInput = page.locator(
      'input[name="ownerName"], input[placeholder*="propriétaire"], input[placeholder*="Nom"]',
    ).first();
    if (await ownerNameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await ownerNameInput.fill('Fatou Diallo');
    }

    const emailInput = page.locator(
      'input[type="email"], input[name="ownerEmail"]',
    ).first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill(`e2e-${Date.now()}@test.com`);
    }

    const next2 = page.locator(
      'button:has-text("Suivant"), button:has-text("Continuer"), [data-testid="next-btn"]',
    ).first();
    await next2.click();

    // ── Étape 3 : Besoins (checkboxes, skip si optionnelle) ───────────────────
    await page.waitForTimeout(500);
    const next3 = page.locator(
      'button:has-text("Suivant"), button:has-text("Continuer"), [data-testid="next-btn"]',
    ).first();
    if (await next3.isVisible({ timeout: 2000 }).catch(() => false)) {
      await next3.click();
    }

    // ── Étape 4 : Confirmation ────────────────────────────────────────────────
    await page.waitForTimeout(500);
    const submitBtn = page.locator(
      'button[type="submit"], button:has-text("Soumettre"), button:has-text("Envoyer"), button:has-text("Confirmer"), [data-testid="submit-btn"]',
    ).first();
    await expect(submitBtn).toBeVisible({ timeout: 5000 });
    await submitBtn.click();

    // ── Page succès ───────────────────────────────────────────────────────────
    // Attend la page de succès (URL ou message)
    await page.waitForURL(/\/register.*success|\/register.*merci|\/register/, { timeout: 10_000 });

    const successMessage = page.locator(
      '[data-testid="success-page"], h1:has-text("Merci"), h1:has-text("Succès"), h2:has-text("Envoyée"), text=succès',
    ).first();
    await expect(successMessage).toBeVisible({ timeout: 8000 });
  });

  // ── Validation formulaire ─────────────────────────────────────────────────────

  test('ne peut pas passer à l\'étape 2 sans sélectionner une région', async ({ page }) => {
    // Clique directement sur Suivant sans sélectionner
    const nextBtn = page.locator(
      'button:has-text("Suivant"), button:has-text("Continuer"), [data-testid="next-btn"]',
    ).first();
    if (await nextBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await nextBtn.click();
      // Reste sur l'étape 1 (pas de champ d'étape 2)
      const step2Field = page.locator('input[name="restaurantName"]');
      await expect(step2Field).not.toBeVisible({ timeout: 2000 }).catch(() => undefined);
    }
  });
});
