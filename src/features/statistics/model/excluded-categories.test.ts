import { describe, expect, it } from "vitest";

import { TransactionType } from "@entities/transaction";

import { getCurrenciesStatistics, getTopExcludedCategory } from "./statistics";

const accounts = {
  card: { currencyId: "byn" },
};

const expenseCategories = {
  car: { id: "car", parentId: null },
  kx1: { id: "kx1", parentId: "car", excludedFromStatistics: true },
  "kx1-fuel": { id: "kx1-fuel", parentId: "kx1" },
  dad: { id: "dad", parentId: null, excludedFromStatistics: true },
  home: { id: "home", parentId: null },
};

const incomeCategories = {
  salary: { id: "salary", parentId: null },
};

const expense = (categoryId: string, amount: string) => ({
  type: TransactionType.expense,
  categoryId,
  accountId: "card",
  amount,
});

describe("excluded categories in statistics", () => {
  it("getTopExcludedCategory picks the topmost flagged ancestor", () => {
    expect(getTopExcludedCategory(expenseCategories, "kx1-fuel")?.id).toBe(
      "kx1",
    );
    expect(getTopExcludedCategory(expenseCategories, "kx1")?.id).toBe("kx1");
    expect(getTopExcludedCategory(expenseCategories, "dad")?.id).toBe("dad");
    expect(getTopExcludedCategory(expenseCategories, "home")).toBe(null);
    expect(getTopExcludedCategory(expenseCategories, "car")).toBe(null);
  });

  it("moves excluded spending out of totals into a separate section", () => {
    const statistics = getCurrenciesStatistics(
      accounts,
      expenseCategories,
      incomeCategories,
      [
        expense("car", "100"),
        expense("kx1", "30"),
        expense("kx1-fuel", "20"),
        expense("dad", "500"),
        expense("home", "40"),
        {
          type: TransactionType.income,
          categoryId: "salary",
          accountId: "card",
          amount: "1000",
        },
      ],
    );

    const byn = statistics.byn;
    expect(byn.expenseAmount).toBe("140");
    expect(byn.incomeAmount).toBe("1000");
    expect(byn.expenseRootCategories.categories).toEqual([
      { categoryId: "car", amount: "100", percentage: "71.43" },
      { categoryId: "home", amount: "40", percentage: "28.57" },
    ]);
    expect(byn.excludedExpenseCategories?.categories).toEqual([
      { categoryId: "dad", amount: "500", percentage: "90.91" },
      { categoryId: "kx1", amount: "50", percentage: "9.09" },
    ]);
    expect(byn.excludedIncomeCategories).toBeUndefined();
  });
});
