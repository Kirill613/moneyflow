import { describe, expect, it } from "vitest";

import { netSameTitledCategories } from "./net-same-titled-categories";
import { CurrenciesStatistics } from "./statistics";

const expenseCategories = {
  exp_turkey: { title: "Турция" },
  exp_food: { title: "Еда" },
  exp_sell: { title: "Продать доллары" },
  inc_turkey: { title: "Турция" },
  inc_salary: { title: "Зарплата" },
  inc_sell: { title: "Продать доллары " },
};
const incomeCategories = expenseCategories;

function buildStatistics(
  expense: { categoryId: string; amount: string }[],
  income: { categoryId: string; amount: string }[],
): CurrenciesStatistics {
  const sum = (items: { amount: string }[]) =>
    items.reduce((total, { amount }) => total + Number(amount), 0).toString();

  return {
    usd: {
      incomeAmount: sum(income),
      expenseAmount: sum(expense),
      expenseRootCategories: {
        totalAmount: sum(expense),
        categories: expense.map((c) => ({ ...c, percentage: "0.00" })),
      },
      incomeRootCategories: {
        totalAmount: sum(income),
        categories: income.map((c) => ({ ...c, percentage: "0.00" })),
      },
    },
  };
}

describe("netSameTitledCategories", () => {
  it("keeps the difference on the expense side when expense is larger", () => {
    const statistics = buildStatistics(
      [
        { categoryId: "exp_turkey", amount: "1000" },
        { categoryId: "exp_food", amount: "500" },
      ],
      [{ categoryId: "inc_turkey", amount: "300" }],
    );

    const result = netSameTitledCategories(
      statistics,
      expenseCategories,
      incomeCategories,
    );

    expect(result.usd.expenseRootCategories.categories).toEqual([
      { categoryId: "exp_turkey", amount: "700", percentage: "58.33" },
      { categoryId: "exp_food", amount: "500", percentage: "41.67" },
    ]);
    expect(result.usd.incomeRootCategories.categories).toEqual([]);
    // headline totals are untouched
    expect(result.usd.expenseAmount).toBe("1500");
    expect(result.usd.incomeAmount).toBe("300");
  });

  it("keeps the difference on the income side when income is larger", () => {
    const statistics = buildStatistics(
      [{ categoryId: "exp_turkey", amount: "200" }],
      [{ categoryId: "inc_turkey", amount: "500" }],
    );

    const result = netSameTitledCategories(
      statistics,
      expenseCategories,
      incomeCategories,
    );

    expect(result.usd.expenseRootCategories.categories).toEqual([]);
    expect(result.usd.incomeRootCategories.categories).toEqual([
      { categoryId: "inc_turkey", amount: "300", percentage: "100.00" },
    ]);
  });

  it("cancels both sides out when amounts are equal", () => {
    const statistics = buildStatistics(
      [{ categoryId: "exp_turkey", amount: "400" }],
      [{ categoryId: "inc_turkey", amount: "400" }],
    );

    const result = netSameTitledCategories(
      statistics,
      expenseCategories,
      incomeCategories,
    );

    expect(result.usd.expenseRootCategories.categories).toEqual([]);
    expect(result.usd.incomeRootCategories.categories).toEqual([]);
  });

  it("nets titles that differ only by surrounding whitespace", () => {
    const statistics = buildStatistics(
      [{ categoryId: "exp_sell", amount: "1000" }],
      [{ categoryId: "inc_sell", amount: "300" }], // title has a trailing space
    );

    const result = netSameTitledCategories(
      statistics,
      expenseCategories,
      incomeCategories,
    );

    expect(result.usd.expenseRootCategories.categories).toEqual([
      { categoryId: "exp_sell", amount: "700", percentage: "100.00" },
    ]);
    expect(result.usd.incomeRootCategories.categories).toEqual([]);
  });

  it("leaves categories without a same-titled counterpart untouched", () => {
    const statistics = buildStatistics(
      [{ categoryId: "exp_food", amount: "500" }],
      [{ categoryId: "inc_salary", amount: "900" }],
    );

    const result = netSameTitledCategories(
      statistics,
      expenseCategories,
      incomeCategories,
    );

    expect(result.usd.expenseRootCategories.categories).toEqual([
      { categoryId: "exp_food", amount: "500", percentage: "100.00" },
    ]);
    expect(result.usd.incomeRootCategories.categories).toEqual([
      { categoryId: "inc_salary", amount: "900", percentage: "100.00" },
    ]);
  });
});
