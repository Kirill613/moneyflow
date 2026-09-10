import { Preferences } from "@capacitor/preferences";
import { Decimal } from "decimal.js";
import { z } from "zod";

import { positiveDecimalRegex } from "@shared/lib/regex";

const amountSchema = z
  .string()
  .regex(positiveDecimalRegex)
  .refine((value) => new Decimal(value).gt(0), "Укажите сумму больше нуля");
const paymentSchema = z.object({
  id: z.string().uuid(),
  amount: amountSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export const debtSchema = z
  .object({
    id: z.string().uuid(),
    person: z.string().trim().min(1),
    direction: z.enum(["receivable", "payable"]),
    amount: amountSchema,
    currency: z.object({
      id: z.string(),
      symbol: z.string(),
      precision: z.number().int().min(0).max(20),
    }),
    dueDate: z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/),
    note: z.string(),
    createdAt: z.number().int().positive(),
    payments: z.array(paymentSchema),
  })
  .refine(
    (debt) =>
      debt.payments
        .reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0))
        .lte(debt.amount),
    "Возвраты не могут превышать сумму долга",
  )
  .refine(
    (debt) =>
      new Set(debt.payments.map((payment) => payment.id)).size ===
      debt.payments.length,
  );

export type Debt = z.infer<typeof debtSchema>;
export const debtsSchema = z
  .array(debtSchema)
  .refine(
    (debts) => new Set(debts.map((debt) => debt.id)).size === debts.length,
  );
export const getDebtRemaining = (debt: Debt) =>
  debt.payments
    .reduce(
      (sum, payment) => sum.minus(payment.amount),
      new Decimal(debt.amount),
    )
    .toString();

export const debtsApi = {
  async getDebts(): Promise<Debt[]> {
    const { value } = await Preferences.get({ key: "debts" });
    return debtsSchema.parse(value === null ? [] : JSON.parse(value));
  },
  async setDebts(debts: Debt[]) {
    await Preferences.set({
      key: "debts",
      value: JSON.stringify(debtsSchema.parse(debts)),
    });
  },
};
