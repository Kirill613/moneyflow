import { describe, expect, it } from "vitest";

import { AccountsMap } from "@entities/account";
import { Transaction } from "@entities/transaction";

import { getConvertedCurrenciesTotal } from "./get-converted-currencies-total";

const accounts = {
  acc_usd: { id: "acc_usd", currencyId: "cur_usd", initialBalance: "100" },
  acc_rub: { id: "acc_rub", currencyId: "cur_rub", initialBalance: "1000" },
} as unknown as AccountsMap;

const order = ["cur_usd", "cur_rub"];
const transactions: Transaction[] = [];
// 1 USD = 3 BYN, 1 RUB = 0.03 BYN
const bynPerUnit = { BYN: "1", USD: "3", RUB: "0.03" };

describe("getConvertedCurrenciesTotal", () => {
  it("sums all currency balances converted to the target", () => {
    const { total, unconvertedCurrencyIds } = getConvertedCurrenciesTotal(
      order,
      accounts,
      transactions,
      { cur_usd: "USD", cur_rub: "RUB" },
      bynPerUnit,
      "BYN",
    );

    // 100 USD -> 300 BYN, 1000 RUB -> 30 BYN
    expect(total).toBe("330");
    expect(unconvertedCurrencyIds).toEqual([]);
  });

  it("excludes currencies without an ISO code", () => {
    const { total, unconvertedCurrencyIds } = getConvertedCurrenciesTotal(
      order,
      accounts,
      transactions,
      { cur_usd: "USD" },
      bynPerUnit,
      "BYN",
    );

    expect(total).toBe("300");
    expect(unconvertedCurrencyIds).toEqual(["cur_rub"]);
  });
});
