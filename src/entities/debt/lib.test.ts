import { describe, expect, it } from "vitest";

import {
  DebtTransaction,
  computeDebts,
  extractDebtPersonsFromTitles,
  isDebtCategoryTitle,
  normalizeDebtPerson,
} from "./lib";

describe("debt entity lib", () => {
  describe("isDebtCategoryTitle", () => {
    it("matches debt categories in any case", () => {
      expect(isDebtCategoryTitle("Дать в долг")).toBe(true);
      expect(isDebtCategoryTitle("ДОЛГИ")).toBe(true);
      expect(isDebtCategoryTitle("Машина")).toBe(false);
    });
  });

  describe("normalizeDebtPerson", () => {
    it("trims, collapses spaces and capitalizes", () => {
      expect(normalizeDebtPerson("  фама  ")).toBe("Фама");
      expect(normalizeDebtPerson("олег  петров")).toBe("Олег петров");
      expect(normalizeDebtPerson("   ")).toBe("");
    });
  });

  describe("extractDebtPersonsFromTitles", () => {
    it("extracts names from real debt transaction titles", () => {
      const persons = extractDebtPersonsFromTitles([
        "Долг",
        "Долг фама ",
        "Дать долг Олег",
        "Дать долг Сергей",
        "Долг фама вернул ",
        "Олег отдал долг",
        "Долг рома вернул ",
        "Дать долг Рома",
      ]);
      expect(persons).toEqual(["Фама", "Олег", "Сергей", "Рома"]);
    });

    it("ignores numbers and single letters", () => {
      expect(extractDebtPersonsFromTitles(["Долг 100 я"])).toEqual([]);
    });
  });

  describe("computeDebts", () => {
    const transaction = (
      overrides: Partial<DebtTransaction>,
    ): DebtTransaction => ({
      id: "id",
      kind: "expense",
      title: "Долг",
      amount: "10",
      debtPerson: "Фама",
      datetime: 1,
      currencyId: "byn",
      ...overrides,
    });

    it("computes positive net when more was lent than returned", () => {
      const debts = computeDebts([
        transaction({ id: "1", amount: "100", datetime: 1 }),
        transaction({ id: "2", kind: "income", amount: "30", datetime: 2 }),
      ]);
      expect(debts).toHaveLength(1);
      expect(debts[0].person).toBe("Фама");
      expect(debts[0].balances).toEqual([{ currencyId: "byn", net: "70" }]);
      expect(debts[0].history.map((entry) => entry.id)).toEqual(["2", "1"]);
    });

    it("computes negative net when I owe the person", () => {
      const debts = computeDebts([
        transaction({ id: "1", kind: "income", amount: "50" }),
      ]);
      expect(debts[0].balances).toEqual([{ currencyId: "byn", net: "-50" }]);
    });

    it("groups person names case-insensitively", () => {
      const debts = computeDebts([
        transaction({ id: "1", debtPerson: "фама", amount: "5" }),
        transaction({ id: "2", debtPerson: "Фама ", amount: "7" }),
      ]);
      expect(debts).toHaveLength(1);
      expect(debts[0].balances).toEqual([{ currencyId: "byn", net: "12" }]);
    });

    it("keeps currencies separate and skips empty persons", () => {
      const debts = computeDebts([
        transaction({ id: "1", currencyId: "byn", amount: "5" }),
        transaction({ id: "2", currencyId: "usd", amount: "7" }),
        transaction({ id: "3", debtPerson: "  " }),
      ]);
      expect(debts).toHaveLength(1);
      expect(debts[0].balances).toEqual([
        { currencyId: "byn", net: "5" },
        { currencyId: "usd", net: "7" },
      ]);
    });

    it("sorts persons by latest activity", () => {
      const debts = computeDebts([
        transaction({ id: "1", debtPerson: "Олег", datetime: 10 }),
        transaction({ id: "2", debtPerson: "Рома", datetime: 20 }),
      ]);
      expect(debts.map((debt) => debt.person)).toEqual(["Рома", "Олег"]);
    });

    it("sums with decimal precision", () => {
      const debts = computeDebts([
        transaction({ id: "1", amount: "0.1" }),
        transaction({ id: "2", amount: "0.2" }),
      ]);
      expect(debts[0].balances[0].net).toBe("0.3");
    });
  });
});
