import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
async function login(page: any, email: string) {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .first()
    .click();
  const form = page
    .locator("form")
    .filter({
      has: page.getByRole("heading", { name: "Sign in", exact: true }),
    });
  await form.getByLabel("Email", { exact: true }).fill(email);
  await form
    .getByLabel("Password", { exact: true })
    .fill("DevelopmentOnly!2026");
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();
}
test("public discovery is anonymous and accessible at desktop and mobile widths", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Current opportunities" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Veterinary ownership opportunity" }),
  ).toBeVisible();
  expect(await page.content()).not.toContain("Example Road");
  expect(await page.content()).not.toContain("revenueMinor");
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.screenshot({
    path: "test-results/opportunities-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/opportunities-mobile.png",
    fullPage: true,
  });
});
test("buyer interest is persisted and another buyer has no deal access", async ({
  page,
}) => {
  await login(page, "buyer2@example.test");
  await page
    .getByRole("button", { name: "Browse practices", exact: true })
    .click();
  const card = page.locator("article").filter({
    has: page.getByRole("heading", {
      name: "Veterinary ownership opportunity",
    }),
  });
  await card
    .getByLabel("Your note")
    .fill("Synthetic buyer ready for a human finance and opportunity review.");
  await card
    .getByRole("button", { name: "Express interest", exact: true })
    .click();
  await expect(card.getByRole("status")).toHaveText("Saved.");
  await page.getByRole("button", { name: "My interests", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "View request" }),
  ).toHaveCount(1);
  await page.getByRole("button", { name: "My deals", exact: true }).click();
  await expect(
    page.getByText("Nothing here yet. New items will show up in this list."),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
});
test("seller onboards each category through the guided wizard", async ({
  page,
}) => {
  await login(page, "seller@example.test");
  await page.getByRole("button", { name: "My practices", exact: true }).click();
  for (const category of ["dental", "veterinary", "specialistMedical"]) {
    if (category !== "dental")
      await page
        .getByRole("button", { name: "Onboard another practice" })
        .click();
    await page
      .getByRole("combobox", { name: "Category", exact: true })
      .selectOption(category);
    const form = page.locator("form").filter({
      has: page.getByRole("heading", {
        name: "Practice identity",
        exact: true,
      }),
    });
    const brokerage = form.getByRole("combobox", {
      name: "Brokerage",
      exact: true,
    });
    const option = await brokerage
      .locator("option")
      .nth(1)
      .getAttribute("value");
    await brokerage.selectOption(option!);
    const values: Record<string, string> = {
      legalName: "Fictional E2E " + category + " Entity",
      displayName: "Fictional E2E " + category,
      region: "Northern region",
      address: "99 Example Road",
      ownershipStructure: "Partnership",
    };
    for (const [name, value] of Object.entries(values))
      await form.locator("[name=" + name + "]").fill(value);
    await form.getByRole("button", { name: "Continue" }).click();
    const facilityForm = page.locator("form").filter({
      has: page.getByRole("heading", {
        name: "Facilities and team",
        exact: true,
      }),
    });
    for (const [name, value] of Object.entries({
      yearsOperating: "10",
      staffCount: "6",
      facility: "Synthetic leased facility",
      equipment: "Synthetic equipment summary",
    }))
      await facilityForm.locator("[name=" + name + "]").fill(value);
    if (category === "veterinary") {
      await facilityForm
        .getByLabel("Species categories (comma separated)")
        .fill("Companion animals");
      await facilityForm
        .getByLabel("Services (comma separated)")
        .fill("General care");
    } else
      await facilityForm
        .getByLabel("Specialty", { exact: true })
        .fill(category === "dental" ? "General dentistry" : "Cardiology");
    if (category === "dental")
      await facilityForm.getByLabel("Chairs / operatories").fill("4");
    if (category === "specialistMedical") {
      await facilityForm
        .getByLabel("Consultation facilities")
        .fill("Two rooms");
      await facilityForm
        .getByLabel("Procedure facilities")
        .fill("Procedure room");
    }
    await facilityForm.getByRole("button", { name: "Continue" }).click();
    await page
      .getByLabel("Financial period 1", { exact: true })
      .fill("Year ending December 2025");
    await page.getByLabel("Revenue 1", { exact: true }).fill("500000");
    await page.getByLabel("Expenses 1", { exact: true }).fill("350000");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page
      .getByLabel("Transition reason", { exact: true })
      .fill("Planned partner retirement");
    await page
      .getByLabel("Desired timeline", { exact: true })
      .fill("Within twelve months");
    await page
      .getByRole("button", { name: "Create private practice", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Private practice created" }),
    ).toBeVisible();
    await expect(
      page.getByText("Fictional E2E " + category, { exact: true }),
    ).toBeVisible();
  }
  const audit = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(audit.violations).toEqual([]);
  await page.screenshot({
    path: "test-results/seller-desktop.png",
    fullPage: true,
  });
});
import { createRequire } from "node:module";
import path from "node:path";
const { TOTP, Secret } = createRequire(path.resolve("../api/package.json"))(
  "otpauth",
);

test("broker enrolls MFA, reviews diligence and terms, records legal close and completes separate handover", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Sign in", exact: true })
    .first()
    .click();
  const loginForm = page
    .locator("form")
    .filter({
      has: page.getByRole("heading", { name: "Sign in", exact: true }),
    });
  await loginForm
    .getByLabel("Email", { exact: true })
    .fill("broker@example.test");
  await loginForm
    .getByLabel("Password", { exact: true })
    .fill("DevelopmentOnly!2026");
  await loginForm.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Account", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Set up authenticator" }).click();
  const secretText = await page
    .locator("p")
    .filter({ hasText: "Authenticator secret:" })
    .locator("code")
    .textContent();
  const confirm = page.locator("form").filter({
    has: page.getByRole("heading", { name: "Confirm MFA", exact: true }),
  });
  await confirm
    .getByLabel("Six-digit authenticator code")
    .fill(
      new TOTP({ secret: Secret.fromBase32(secretText!.trim()) }).generate(),
    );
  await confirm
    .getByRole("button", { name: "Confirm MFA", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Set up authenticator" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "My deals", exact: true }).click();
  const row = page
    .locator("article")
    .filter({ has: page.getByText("Full Acquisition", { exact: true }) });
  await row.getByRole("button", { name: "Open workspace" }).click();
  await page
    .getByRole("navigation", { name: "Workspace sections" })
    .getByRole("button", { name: "Diligence", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Due diligence", exact: true }),
  ).toBeVisible();
  async function stage(value: string) {
    await page
      .getByRole("navigation", { name: "Workspace sections" })
      .getByRole("button", { name: "Closing & handover", exact: true })
      .click();
    const form = page.locator("form").filter({
      has: page.getByRole("heading", {
        name: "Transition deal stage",
        exact: true,
      }),
    });
    await form
      .getByRole("combobox", { name: "Target stage", exact: true })
      .selectOption(value);
    await form
      .getByLabel("Recorded reason", { exact: true })
      .fill("Reviewed synthetic stage prerequisites and authority.");
    await form
      .getByRole("button", { name: "Transition deal stage", exact: true })
      .click();
    await expect(page.locator(".platform-stages .current")).toHaveText(
      value.replace(/([A-Z])/g, " $1").replace(/^./, (x) => x.toUpperCase()),
    );
  }
  await stage("diligence");
  await page
    .getByRole("navigation", { name: "Workspace sections" })
    .getByRole("button", { name: "Diligence", exact: true })
    .click();
  const checklist = page.locator("form").filter({
    has: page.getByRole("heading", {
      name: "Update checklist item",
      exact: true,
    }),
  });
  const count = await checklist.count();
  expect(count).toBeGreaterThanOrEqual(5);
  for (let i = 0; i < count; i++) {
    const form = checklist.nth(i);
    await form
      .getByRole("combobox", { name: "Status", exact: true })
      .selectOption("accepted");
    const evidence = form.getByRole("combobox", {
      name: "Reviewed evidence",
      exact: true,
    });
    await evidence.selectOption(
      (await evidence.locator("option").nth(1).getAttribute("value"))!,
    );
    await form
      .getByLabel("Recorded reason", { exact: true })
      .fill("Synthetic evidence reviewed for this checklist category.");
    await form
      .getByRole("button", { name: "Update checklist item", exact: true })
      .click();
    await expect(form.getByRole("status")).toHaveText("Saved.");
  }
  await page
    .getByRole("navigation", { name: "Workspace sections" })
    .getByRole("button", { name: "Offers", exact: true })
    .click();
  const decision = page.locator("form").filter({
    has: page.getByRole("heading", {
      name: "Record offer decision",
      exact: true,
    }),
  });
  await decision
    .getByRole("combobox", { name: "Decision", exact: true })
    .selectOption("accepted");
  const terms = decision.getByRole("combobox", {
    name: "Reviewed terms communication (required for acceptance)",
    exact: true,
  });
  await terms.selectOption(
    (await terms.locator("option").nth(1).getAttribute("value"))!,
  );
  await decision
    .getByLabel("Recorded reason", { exact: true })
    .fill("Recorded synthetic communication of accepted terms.");
  await decision
    .getByRole("button", { name: "Record offer decision", exact: true })
    .click();
  await expect(page.locator(".platform-stages .current")).toHaveText(
    "Diligence",
  );
  await stage("termsAgreed");
  await stage("closing");
  const close = page.locator("form").filter({
    has: page.getByRole("heading", {
      name: "Confirm external legal closing",
      exact: true,
    }),
  });
  const closeEvidence = close.getByRole("combobox", {
    name: "Reviewed external legal-close evidence",
    exact: true,
  });
  await closeEvidence.selectOption(
    (await closeEvidence.locator("option").first().getAttribute("value"))!,
  );
  await close
    .getByLabel("Recorded reason", { exact: true })
    .fill("Reviewed external synthetic legal-close evidence.");
  page.once("dialog", (dialog) => dialog.accept());
  await close
    .getByRole("button", {
      name: "Confirm external legal closing",
      exact: true,
    })
    .click();
  await expect(page.locator(".platform-stages .current")).toHaveText("Closed");
  await stage("handover");
  const task = page.locator("form").filter({
    has: page.getByRole("heading", { name: "Assign task", exact: true }),
  });
  await task
    .getByLabel("Task", { exact: true })
    .fill("Complete synthetic operational handover");
  await task
    .getByRole("combobox", { name: "Kind", exact: true })
    .selectOption("handover");
  await task.getByRole("button", { name: "Assign task", exact: true }).click();
  await expect(task.getByRole("status")).toHaveText("Saved.");
  const handover = page.locator("article").filter({
    has: page.getByText("Complete synthetic operational handover", {
      exact: true,
    }),
  });
  await handover
    .getByRole("button", { name: "Complete task", exact: true })
    .click();
  await expect(handover.getByText("Completed", { exact: true })).toBeVisible();
  await stage("completed");
  await page
    .getByRole("navigation", { name: "Workspace sections" })
    .getByRole("button", { name: "Overview", exact: true })
    .click();
  await page.screenshot({
    path: "test-results/completed-deal.png",
    fullPage: true,
  });
});
