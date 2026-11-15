import { useMemo } from "react";

import {
  useExpenseCategoriesStore,
  useIncomeCategoriesStore,
  getTopExcludedCategory,
} from "@entities/category";
import {
  Transaction,
  TransactionType,
  useTransactions,
} from "@entities/transaction";

import { CategoriesForStatistics } from "./statistics";

// A transaction skips balances only when its hiding category is marked
// excludedFromBalance (reference-only). A category hidden from statistics
// alone (e.g. currency exchanges) still moves balances, and a transaction
// whose own flag is false counts everywhere. Transfers always count.
export const isTransactionExcludedFromBalance = (
  categories: CategoriesForStatistics &
    Record<string, { excludedFromBalance?: boolean }>,
  transaction: { categoryId: string; excludedFromStatistics?: boolean },
): boolean => {
  if (transaction.excludedFromStatistics === false) {
    return false;
  }
  const top = getTopExcludedCategory(categories, transaction.categoryId);
  return top !== null && top.excludedFromBalance === true;
};

export const excludeHiddenTransactions = (
  transactions: Transaction[],
  expenseCategories: CategoriesForStatistics,
  incomeCategories: CategoriesForStatistics,
): Transaction[] =>
  transactions.filter((transaction) => {
    if (transaction.type === TransactionType.expense) {
      return !isTransactionExcludedFromBalance(expenseCategories, transaction);
    }
    if (transaction.type === TransactionType.income) {
      return !isTransactionExcludedFromBalance(incomeCategories, transaction);
    }
    return true;
  });

export const useBalanceTransactions = (): Transaction[] => {
  const transactions = useTransactions();
  const { expenseCategories } = useExpenseCategoriesStore();
  const { incomeCategories } = useIncomeCategoriesStore();
  return useMemo(
    () =>
      excludeHiddenTransactions(
        transactions,
        expenseCategories,
        incomeCategories,
      ),
    [transactions, expenseCategories, incomeCategories],
  );
};
