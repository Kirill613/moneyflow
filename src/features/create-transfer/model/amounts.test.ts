import { describe, expect, it } from "vitest";

import { convertTransferAmount, createTransferFormSchema } from "./amounts";

const transfer = {
  title: "Обмен",
  fromAccountId: "card",
  toAccountId: "cash",
  fromAccountAmount: "300",
  toAccountAmount: "100",
  datetime: "2026-09-10T12:00",
};

describe("transfer validation and conversion", () => {
  it("accepts different debit and credit amounts for currency exchange", () => {
    expect(createTransferFormSchema.safeParse(transfer).success).toBe(true);
  });
  it("rejects a transfer to the same account", () => {
    expect(
      createTransferFormSchema.safeParse({ ...transfer, toAccountId: "card" })
        .success,
    ).toBe(false);
  });
  it.each(["0", "-1", "NaN", "Infinity", "", "1e3"])(
    "rejects invalid debit or credit amount %s",
    (amount) => {
      expect(
        createTransferFormSchema.safeParse({
          ...transfer,
          fromAccountAmount: amount,
        }).success,
      ).toBe(false);
      expect(
        createTransferFormSchema.safeParse({
          ...transfer,
          toAccountAmount: amount,
        }).success,
      ).toBe(false);
    },
  );
  it("uses exact decimal multiplication and rounds to the destination currency", () => {
    expect(convertTransferAmount("0.1", "3", 2)).toBe("0.3");
    expect(convertTransferAmount("100", "3.25555", 2)).toBe("325.56");
    expect(convertTransferAmount("100", "0.333333", 2)).toBe("33.33");
  });
  it("does not calculate with incomplete or invalid inputs", () => {
    expect(convertTransferAmount("", "3", 2)).toBe("");
    expect(convertTransferAmount("100", "0", 2)).toBe("");
  });
});
