import { useMemo } from "react";

import {
  useExpenseCategoriesStore,
  useIncomeCategoriesStore,
} from "@entities/category";
import {
  Transaction,
  TransactionType,
  useTransactions,
} from "@entities/transaction";

import {
  CategoriesForStatistics,
  isTransactionExcludedFromStatistics,
} from "./statistics";

// Hidden transactions are reference-only: they move neither statistics nor
// account balances. Transfers always count.
export const excludeHiddenTransactions = (
  transactions: Transaction[],
  expenseCategories: CategoriesForStatistics,
  incomeCategories: CategoriesForStatistics,
): Transaction[] =>
  transactions.filter((transaction) => {
    if (transaction.type === TransactionType.expense) {
      return !isTransactionExcludedFromStatistics(
        expenseCategories,
        transaction,
      );
    }
    if (transaction.type === TransactionType.income) {
      return !isTransactionExcludedFromStatistics(
        incomeCategories,
        transaction,
      );
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
