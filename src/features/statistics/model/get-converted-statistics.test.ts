import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { AccountsMap } from "@entities/account";
import { Transaction } from "@entities/transaction";

import { getConvertedStatistics } from "./get-converted-statistics";

const accounts = {
  acc_usd: { id: "acc_usd", currencyId: "cur_usd" },
  acc_rub: { id: "acc_rub", currencyId: "cur_rub" },
} as unknown as AccountsMap;

const expenseCategories = {
  exp_food: { id: "exp_food", parentId: null, title: "Food" },
} as never;
const incomeCategories = {
  inc_food: { id: "inc_food", parentId: null, title: "Food" },
} as never;

const currencyCodes = { cur_usd: "USD", cur_rub: "RUB" };
// 1 USD = 3 BYN, 1 RUB = 0.03 BYN
const bynPerUnit = { BYN: "1", USD: "3", RUB: "0.03" };

const now = DateTime.now();
const transactions = [
  {
    type: "expense",
    id: "e1",
    title: "",
    accountId: "acc_usd",
    categoryId: "exp_food",
    amount: "100", // 100 USD -> 300 BYN
    datetime: now,
    createdAt: now,
  },
  {
    type: "income",
    id: "i1",
    title: "",
    accountId: "acc_rub",
    categoryId: "inc_food",
    amount: "1000", // 1000 RUB -> 30 BYN
    datetime: now,
    createdAt: now,
  },
] as Transaction[];

describe("getConvertedStatistics", () => {
  it("converts every currency to BYN and nets same-titled categories", () => {
    const { statistics, skippedTransactions, unmappedCurrencyIds } =
      getConvertedStatistics(
        accounts,
        expenseCategories,
        incomeCategories,
        transactions,
        currencyCodes,
        bynPerUnit,
        "BYN",
      );

    expect(skippedTransactions).toBe(0);
    expect(unmappedCurrencyIds).toEqual([]);
    // headline totals keep full converted amounts
    expect(statistics?.expenseAmount).toBe("300");
    expect(statistics?.incomeAmount).toBe("30");
    // "Food" expense (300) is netted against "Food" income (30) -> 270 expense
    expect(statistics?.expenseRootCategories.categories).toEqual([
      { categoryId: "exp_food", amount: "270", percentage: "100.00" },
    ]);
    expect(statistics?.incomeRootCategories.categories).toEqual([]);
  });

  it("converts to a non-BYN target", () => {
    const { statistics } = getConvertedStatistics(
      accounts,
      expenseCategories,
      incomeCategories,
      transactions,
      currencyCodes,
      bynPerUnit,
      "USD",
    );

    // 300 BYN / 3 = 100 USD expense, 30 BYN / 3 = 10 USD income
    expect(statistics?.expenseAmount).toBe("100");
    expect(statistics?.incomeAmount).toBe("10");
  });

  it("skips transactions whose currency has no ISO code", () => {
    const { skippedTransactions, unmappedCurrencyIds } = getConvertedStatistics(
      accounts,
      expenseCategories,
      incomeCategories,
      transactions,
      { cur_usd: "USD" }, // cur_rub left unmapped
      bynPerUnit,
      "BYN",
    );

    expect(skippedTransactions).toBe(1);
    expect(unmappedCurrencyIds).toEqual(["cur_rub"]);
  });
});
