import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  Debt,
  debtSchema,
  debtsApi,
  debtsSchema,
  getDebtRemaining,
} from "./index";

const storage = vi.hoisted(() => new Map<string, string>());
vi.mock("@capacitor/preferences", () => ({
  Preferences: {
    get: async ({ key }: { key: string }) => ({
      value: storage.get(key) ?? null,
    }),
    set: async ({ key, value }: { key: string; value: string }) => {
      storage.set(key, value);
    },
  },
}));

const debt: Debt = {
  id: "036a70ef-a421-4cc5-ad6e-5a488cc68afd",
  person: "Иван",
  direction: "receivable",
  amount: "100.30",
  currency: { id: "BYN", symbol: "Br", precision: 2 },
  dueDate: "2026-09-20",
  note: "",
  createdAt: 1789000000000,
  payments: [
    {
      id: "150d1d21-b4b4-43bd-8ee5-7655b23ae13b",
      amount: "20.10",
      date: "2026-09-10",
    },
  ],
};

describe("debts", () => {
  beforeEach(() => storage.clear());
  it("tracks exact remaining amounts for both directions", () => {
    expect(getDebtRemaining(debt)).toBe("80.2");
    expect(getDebtRemaining({ ...debt, direction: "payable" })).toBe("80.2");
  });
  it("fully repays and allows undoing a repayment", () => {
    const paid = {
      ...debt,
      payments: [{ ...debt.payments[0], amount: "100.30" }],
    };
    expect(getDebtRemaining(paid)).toBe("0");
    expect(getDebtRemaining({ ...paid, payments: [] })).toBe("100.3");
  });
  it("rejects overpayment, zero and negative debts and duplicate IDs", () => {
    expect(debtSchema.safeParse({ ...debt, amount: "10" }).success).toBe(false);
    expect(
      debtSchema.safeParse({ ...debt, amount: "0", payments: [] }).success,
    ).toBe(false);
    expect(
      debtSchema.safeParse({ ...debt, amount: "-10", payments: [] }).success,
    ).toBe(false);
    expect(debtsSchema.safeParse([debt, debt]).success).toBe(false);
  });
  it("loads empty state on existing installations and persists repayment history", async () => {
    expect(await debtsApi.getDebts()).toEqual([]);
    await debtsApi.setDebts([debt]);
    expect(await debtsApi.getDebts()).toEqual([debt]);
  });
  it("keeps saved data intact when a write is invalid", async () => {
    await debtsApi.setDebts([debt]);
    await expect(
      debtsApi.setDebts([{ ...debt, amount: "1" }]),
    ).rejects.toThrow();
    expect(await debtsApi.getDebts()).toEqual([debt]);
  });
});
