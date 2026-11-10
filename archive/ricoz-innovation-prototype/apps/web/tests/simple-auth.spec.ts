import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test.skip(
  process.env.DEV_SIMPLE_AUTH !== "true",
  "Run with the explicit simple development-auth test command.",
);
test("simple signup, persistence, logout, invalid password and staff login work through the UI", async ({
  page,
}) => {
  const pageErrors: string[] = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  await page.goto("/?screen=signin");
  await expect(
    page.getByText(
      "Local demo: use email and password. Email verification and MFA are deferred for now.",
    ),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await page.getByRole("button", { name: /Sell or transition a practice/ }).click();
  const email = `simple-browser-${Date.now()}@example.test`;
  const signup = page
    .locator("form")
    .filter({
      has: page.getByRole("heading", { name: "Create your account" }),
    });
  await signup.getByLabel("Full name").fill("Fictional Simple Browser");
  await signup.getByLabel("Email", { exact: true }).fill(email);
  await signup.getByLabel("Password", { exact: true }).fill("Simple123!");
  await signup
    .getByRole("button", { name: "Create account", exact: true })
    .click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
  const initialCookies = await page.context().cookies();
  const accessCookie = initialCookies.find(cookie => cookie.name === 'hpt_session');
  expect(accessCookie?.value.split('.')).toHaveLength(3);
  expect(accessCookie?.httpOnly).toBe(true);
  expect(initialCookies.find(cookie => cookie.name === 'hpt_refresh')?.httpOnly).toBe(true);
  await page.context().clearCookies({ name: 'hpt_session' });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  expect((await page.context().cookies()).find(cookie => cookie.name === 'hpt_session')?.value.split('.')).toHaveLength(3);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  await page.getByRole("button", { name: "Sign out" }).click();
  for (const account of [
    email,
    "seller@example.test",
    "buyer@example.test",
    "broker@example.test",
  ]) {
    await page
      .getByRole("button", { name: "Sign in", exact: true })
      .first()
      .click();
    const form = page
      .locator("form")
      .filter({
        has: page.getByRole("heading", { name: "Sign in", exact: true }),
      });
    await form.getByLabel("Email", { exact: true }).fill(account);
    if (account === email) {
      await form.getByLabel("Password", { exact: true }).fill("incorrect");
      await form.getByRole("button", { name: "Sign in", exact: true }).click();
      await expect(form.getByRole("alert")).toContainText(
        "Invalid credentials",
      );
    }
    await form
      .getByLabel("Password", { exact: true })
      .fill(account === email ? "Simple123!" : "DevelopmentOnly!2026");
    await form.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
    await expect(
      page.getByText("Your privileged account must enroll in MFA", {
        exact: false,
      }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Sign out" }).click();
  }
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .first()
    .click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.screenshot({
    path: "test-results/simple-auth.png",
    fullPage: true,
  });
  expect(pageErrors).toEqual([]);
});
