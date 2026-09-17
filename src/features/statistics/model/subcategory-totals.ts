import { Decimal } from "decimal.js";

export interface SubcategoryTotalsCategory {
  id: string;
  parentId: string | null;
}

export interface SubcategoryTotalsTransaction {
  categoryId: string;
  accountId: string;
  amount: string;
}

export type CurrencyTotals = Record<string, string>;

export interface SubcategoryTotals {
  direct: CurrencyTotals;
  children: Record<string, CurrencyTotals>;
}

// For every transaction inside the categoryId subtree, credit either the
// direct child of categoryId whose subtree contains it, or the "direct"
// bucket when the transaction sits on categoryId itself.
export const getSubcategoryTotals = (
  categoryId: string,
  categories: Record<string, SubcategoryTotalsCategory>,
  transactions: SubcategoryTotalsTransaction[],
  accounts: Record<string, { currencyId: string }>,
): SubcategoryTotals => {
  const direct: Record<string, Decimal> = {};
  const children: Record<string, Record<string, Decimal>> = {};

  for (const transaction of transactions) {
    const account = accounts[transaction.accountId];
    if (!account) continue;

    let childId: string | null = null;
    let currentId: string | null = transaction.categoryId;
    let found = false;
    const visited = new Set<string>();
    while (currentId !== null && !visited.has(currentId)) {
      visited.add(currentId);
      if (currentId === categoryId) {
        found = true;
        break;
      }
      childId = currentId;
      currentId = categories[currentId]?.parentId ?? null;
    }
    if (!found) continue;

    const bucket =
      childId === null ? direct : (children[childId] = children[childId] ?? {});
    bucket[account.currencyId] = (
      bucket[account.currencyId] ?? new Decimal(0)
    ).plus(transaction.amount);
  }

  const toStrings = (totals: Record<string, Decimal>): CurrencyTotals =>
    Object.fromEntries(
      Object.entries(totals).map(([currencyId, amount]) => [
        currencyId,
        amount.toString(),
      ]),
    );

  return {
    direct: toStrings(direct),
    children: Object.fromEntries(
      Object.entries(children).map(([childId, totals]) => [
        childId,
        toStrings(totals),
      ]),
    ),
  };
};
