import { test, expect } from "@playwright/test";
for (const width of [375, 768, 1440]) {
  test(`login and route protection at ${width}px without Supabase`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole("status")).toContainText(
      "aguardando configuração",
    );
    await expect(
      page.getByRole("button", { name: "Entrar no workspace" }),
    ).toBeDisabled();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/login-${width}.png`,
      fullPage: true,
    });
    await page.getByRole("link", { name: "Esqueci minha senha" }).click();
    await expect(page).toHaveURL(/recuperar-senha/);
    await expect(
      page.getByRole("button", { name: "Enviar instruções" }),
    ).toBeDisabled();
    await page.goto("/app/configuracoes");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/app/clientes");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/redefinir-senha");
    await expect(page).toHaveURL(/\/login$/);
    await page.goto("/auth/callback?code=invalid");
    await expect(page).toHaveURL(/recuperar-senha\?expired=1/);
    await expect(
      page.getByRole("alert").filter({ hasText: "Link inválido" }),
    ).toBeVisible();
  });
}
