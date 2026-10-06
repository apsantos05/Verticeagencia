import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
test("dashboard empty states render responsively (isolated component fixture)", async ({
  page,
}) => {
  execFileSync(
    process.execPath,
    ["node_modules/tsx/dist/cli.mjs", "tests/render-dashboard.tsx"],
    { cwd: process.cwd() },
  );
  await page.goto("/login");
  const styles = await page
    .locator('link[rel="stylesheet"]')
    .evaluateAll((links) =>
      links.map((link) => (link as HTMLLinkElement).href),
    );
  const markup = readFileSync(resolve("test-results/dashboard.html"), "utf8");
  await page.setContent(
    `<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width, initial-scale=1">${styles.map((url) => `<link rel="stylesheet" href="${url}">`).join("")}</head><body>${markup}</body></html>`,
  );
  for (const width of [375, 768, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(
      page.getByRole("heading", { name: "Saúde financeira" }),
    ).toBeVisible();
    await expect(page.getByText("Nenhuma tarefa atrasada")).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/dashboard-${width}.png`,
      fullPage: true,
    });
  }
});
