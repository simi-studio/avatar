import { expect, test } from "@playwright/test";

/**
 * Smoke coverage for the core flows. Generation is mocked at the network layer
 * so these tests never send a real key upstream and stay deterministic.
 */

test("home renders sample looks and links to the generator", async ({
  page,
}) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /Studio-quality avatars from a sentence or a photo/,
  );
  await expect(
    page.getByText(/Your key stays in this session/),
  ).toBeVisible();
  await expect(page.getByRole("img", { name: "Professional" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Create an avatar" })).toBeVisible();
  await page.getByRole("link", { name: "Create an avatar" }).click();
  await expect(page).toHaveURL(/\/(en\/)?generate/);
  await expect(page.getByLabel("API Key")).toBeVisible();
  await expect(page.getByText(/try free|free trial|hosted credit/i)).toHaveCount(
    0,
  );
});

test("zh-CN home is outcome-first and stays BYOK", async ({ page }) => {
  await page.goto("/zh-CN");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    /用一句话或一张照片，做出影棚级头像/,
  );
  await expect(page.getByText(/Key 只留在本会话/)).toBeVisible();
  await expect(page.getByRole("img", { name: "专业" })).toBeVisible();
  await page.getByRole("link", { name: "生成头像" }).click();
  await expect(page).toHaveURL(/\/zh-CN\/generate/);
  await expect(page.getByLabel("API Key")).toBeVisible();
  await expect(page.getByText(/免费试用|试用额度|Try free/i)).toHaveCount(0);
});

test("a gallery example hydrates the generate form", async ({ page }) => {
  await page.goto("/en/generate?example=corgi");
  await expect(page.getByText("Theme", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Optional prompt")).toHaveValue(/team mascot/i);
});

test("generate page renders the form", async ({ page }) => {
  await page.goto("/en/generate");
  await expect(
    page.getByRole("button", { name: "Generate", exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel("API Key")).toBeVisible();
  await expect(page.getByText(/try free|free trial/i)).toHaveCount(0);
});

test("locale switch navigates to the zh-CN generate page", async ({ page }) => {
  await page.goto("/en/generate");
  await page.getByLabel("Language").selectOption("zh-CN");
  await expect(page).toHaveURL(/\/zh-CN\/generate/);
});

test("switching mode within the text source updates the form", async ({
  page,
}) => {
  await page.goto("/en/generate");
  await page.getByRole("button", { name: "More ways", exact: true }).click();
  await page.getByRole("button", { name: "Themed", exact: true }).click();
  // Themed mode replaces the style picker with the theme picker.
  await expect(page.getByText("Theme", { exact: true })).toBeVisible();
});

test("hydrates a shared team preset from the URL", async ({ page }) => {
  // base64url of {"mode":"themed","themeId":"dogs","variantId":"corgi"}
  const preset = Buffer.from(
    JSON.stringify({ mode: "themed", themeId: "dogs", variantId: "corgi" }),
  )
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  await page.goto(`/en/generate?preset=${preset}`);
  // Themed mode is active, so the theme picker is shown.
  await expect(page.getByText("Theme", { exact: true })).toBeVisible();
});

test("shows a normalized error when the provider rejects the key", async ({
  page,
}) => {
  await page.route("**/api/generate", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        error: { code: "INVALID_API_KEY" },
      }),
    });
  });

  await page.goto("/en/generate");
  await page.getByLabel("API Key").fill("sk-test-invalid-key");
  const generate = page.getByRole("button", { name: "Generate", exact: true });
  await expect(generate).toBeEnabled();
  await generate.click();

  await expect(
    page.getByText("The API key is invalid or was rejected by the provider."),
  ).toBeVisible();
});
