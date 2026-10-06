import { test } from "node:test";
import assert from "node:assert/strict";
import { loginSchema, passwordSchema } from "../src/lib/auth-validation";
import { canReadCommercial, canReadFinance } from "../src/lib/permissions";
test("credentials are validated without trimming passwords", () => {
  assert.equal(
    loginSchema.safeParse({ email: "bad", password: "" }).success,
    false,
  );
  const result = loginSchema.parse({
    email: "  user@example.com ",
    password: " spaces ",
  });
  assert.equal(result.password, " spaces ");
  assert.equal(result.email, "user@example.com");
  assert.equal(
    passwordSchema.safeParse({ password: "short", confirm: "short" }).success,
    false,
  );
  assert.equal(
    passwordSchema.safeParse({
      password: "long-password-here",
      confirm: "different",
    }).success,
    false,
  );
  assert.equal(
    passwordSchema.safeParse({
      password: "long-password-here",
      confirm: "long-password-here",
    }).success,
    true,
  );
});
test("UI capabilities do not give operators finance or commercial access", () => {
  for (const role of ["designer", "editor", "social_media"] as const) {
    assert.equal(canReadFinance(role), false);
    assert.equal(canReadCommercial(role), false);
  }
  assert.equal(canReadFinance("financeiro"), true);
  assert.equal(canReadCommercial("financeiro"), false);
  assert.equal(canReadFinance("gestor"), false);
});
