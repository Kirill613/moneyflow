import { DateTime } from "luxon";
import { describe, expect, it } from "vitest";

import { TransactionType } from "@entities/transaction";

import { convertStatisticsTransactions } from "./convert-statistics-transactions";

const accounts = {
  card: { currencyId: "byn" },
  dollars: { currencyId: "usd" },
  mystery: { currencyId: "xxx" },
};
const codes = { byn: "BYN", usd: "USD" };
const rates = { BYN: "1", USD: "3" };

const expense = (accountId: string, amount: string) => ({
  type: TransactionType.expense,
  id: "e1",
  title: "t",
  accountId,
  categoryId: "c",
  amount,
  datetime: DateTime.now(),
  createdAt: DateTime.now(),
});

describe("convertStatisticsTransactions", () => {
  it("converts foreign amounts into the target currency", () => {
    const result = convertStatisticsTransactions(
      [expense("dollars", "80")],
      accounts,
      codes,
      rates,
      "byn",
      "BYN",
    );
    expect((result.transactions[0] as { amount: string }).amount).toBe(
      "240.00",
    );
    expect(result.accounts.dollars).toEqual({ currencyId: "byn" });
    expect(result.unconvertedCurrencyIds).toEqual(["xxx"]);
  });

  it("leaves target-currency and unconvertible amounts untouched", () => {
    const result = convertStatisticsTransactions(
      [expense("card", "10"), expense("mystery", "5")],
      accounts,
      codes,
      rates,
      "byn",
      "BYN",
    );
    expect((result.transactions[0] as { amount: string }).amount).toBe("10");
    expect((result.transactions[1] as { amount: string }).amount).toBe("5");
    expect(result.accounts.mystery).toEqual({ currencyId: "xxx" });
  });

  it("converts both legs of a transfer", () => {
    const transfer = {
      type: TransactionType.transfer,
      id: "t1",
      title: "x",
      fromAccount: { accountId: "card", amount: "30" },
      toAccount: { accountId: "dollars", amount: "10" },
      datetime: DateTime.now(),
      createdAt: DateTime.now(),
    };
    const result = convertStatisticsTransactions(
      [transfer],
      accounts,
      codes,
      rates,
      "byn",
      "BYN",
    );
    const converted = result.transactions[0] as typeof transfer;
    expect(converted.fromAccount.amount).toBe("30");
    expect(converted.toAccount.amount).toBe("30.00");
  });
});
