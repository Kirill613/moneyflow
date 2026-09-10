import { Decimal } from "decimal.js";
import { z } from "zod";

import { positiveDecimalRegex } from "@shared/lib/regex";

export const isPositiveAmount = (value: string) =>
  positiveDecimalRegex.test(value) && new Decimal(value).gt(0);
export const convertTransferAmount = (
  amount: string,
  rate: string,
  precision: number,
) =>
  isPositiveAmount(amount) && isPositiveAmount(rate)
    ? new Decimal(amount)
        .mul(rate)
        .toDecimalPlaces(precision, Decimal.ROUND_HALF_UP)
        .toString()
    : "";

export const createTransferFormSchema = z
  .object({
    title: z.string(),
    fromAccountId: z.string().min(1),
    fromAccountAmount: z
      .string()
      .refine(isPositiveAmount, "Укажите сумму больше нуля"),
    toAccountId: z.string().min(1),
    toAccountAmount: z
      .string()
      .refine(isPositiveAmount, "Укажите сумму больше нуля"),
    datetime: z
      .string()
      .min(1)
      .refine((value) => Number.isFinite(Date.parse(value))),
  })
  .refine((value) => value.fromAccountId !== value.toAccountId, {
    message: "Выберите разные счета",
    path: ["toAccountId"],
  });
