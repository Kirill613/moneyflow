import { Decimal } from "decimal.js";

import { AccountID, AccountsMap } from "@entities/account";
import {
  ExpenseCategoryID,
  IncomeCategoryID,
  getRootCategory,
} from "@entities/category";
import { CurrencyID } from "@entities/currency";
import { Transaction, TransactionType } from "@entities/transaction";

export interface AccountForStatistics {
  currencyId: CurrencyID;
}

export interface CategoryForStatistics {
  id: ExpenseCategoryID | IncomeCategoryID;
  parentId: ExpenseCategoryID | IncomeCategoryID | null;
  excludedFromStatistics?: boolean;
}

export type CategoriesForStatistics = Record<
  IncomeCategoryID | ExpenseCategoryID,
  CategoryForStatistics
>;

export interface ExpenseForStatistics {
  type: typeof TransactionType.expense;
  amount: string;
  accountId: AccountID;
  categoryId: ExpenseCategoryID;
}

export interface IncomeForStatistics {
  type: typeof TransactionType.income;
  amount: string;
  accountId: AccountID;
  categoryId: IncomeCategoryID;
}

export interface TransferForStatistics {
  type: typeof TransactionType.transfer;
  fromAccount: {
    accountId: AccountID;
    amount: string;
  };
  toAccount: {
    accountId: AccountID;
    amount: string;
  };
}

export type TransactionForStatistics =
  | ExpenseForStatistics
  | IncomeForStatistics
  | TransferForStatistics;

export type AccountsForStatistics = Record<AccountID, AccountForStatistics>;

export interface CategoryStatistics {
  categoryId: ExpenseCategoryID | IncomeCategoryID;
  amount: string;
  percentage: string;
}

export interface CategoriesStatistics {
  totalAmount: string;
  categories: CategoryStatistics[];
}

export interface CurrencyStatistics {
  incomeAmount: string;
  expenseAmount: string;
  expenseRootCategories: CategoriesStatistics;
  incomeRootCategories: CategoriesStatistics;
  excludedExpenseCategories?: CategoriesStatistics;
  excludedIncomeCategories?: CategoriesStatistics;
}

// The topmost category on the path from categoryId to its root that is marked
// excludedFromStatistics, or null when the whole path is included. The topmost
// one wins so everything under a hidden category is grouped under it.
export const getTopExcludedCategory = (
  categories: CategoriesForStatistics,
  categoryId: string,
): CategoryForStatistics | null => {
  let excluded: CategoryForStatistics | null = null;
  let current: CategoryForStatistics | undefined = categories[categoryId];
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.excludedFromStatistics) {
      excluded = current;
    }
    current =
      current.parentId === null ? undefined : categories[current.parentId];
  }
  return excluded;
};

export type CurrenciesStatistics = Record<CurrencyID, CurrencyStatistics>;

export const getAccountBalance = (
  accountId: AccountID,
  initialBalance: string,
  transactions: Transaction[],
): string => {
  let balance = new Decimal(initialBalance);
  for (const transaction of transactions) {
    switch (transaction.type) {
      case TransactionType.expense: {
        if (transaction.accountId === accountId) {
          balance = balance.minus(transaction.amount);
        }
        break;
      }
      case TransactionType.income: {
        if (transaction.accountId === accountId) {
          balance = balance.plus(transaction.amount);
        }
        break;
      }
      case TransactionType.transfer: {
        if (transaction.fromAccount.accountId === accountId) {
          balance = balance.minus(transaction.fromAccount.amount);
        }
        if (transaction.toAccount.accountId === accountId) {
          balance = balance.plus(transaction.toAccount.amount);
        }
        break;
      }
      default:
        throw new Error("Impossible transaction type");
    }
  }
  return balance.toString();
};

export const getCurrencyBalance = (
  currencyId: CurrencyID,
  accounts: AccountsMap,
  transactions: Transaction[],
): string => {
  let balance = new Decimal("0");

  for (const account of Object.values(accounts)) {
    if (account.currencyId === currencyId) {
      balance = balance.plus(account.initialBalance);
    }
  }
  for (const transaction of transactions) {
    switch (transaction.type) {
      case TransactionType.expense: {
        if (accounts[transaction.accountId].currencyId === currencyId) {
          balance = balance.minus(transaction.amount);
        }
        break;
      }
      case TransactionType.income: {
        if (accounts[transaction.accountId].currencyId === currencyId) {
          balance = balance.plus(transaction.amount);
        }
        break;
      }
      case TransactionType.transfer: {
        const fromAccount = transaction.fromAccount;
        if (accounts[fromAccount.accountId].currencyId === currencyId) {
          balance = balance.minus(fromAccount.amount);
        }
        const toAccount = transaction.toAccount;
        if (accounts[toAccount.accountId].currencyId === currencyId) {
          balance = balance.plus(toAccount.amount);
        }
        break;
      }
    }
  }
  return balance.toString();
};

export function getCurrenciesStatistics(
  accounts: AccountsForStatistics,
  expenseCategories: CategoriesForStatistics,
  incomeCategories: CategoriesForStatistics,
  transactions: TransactionForStatistics[],
): CurrenciesStatistics {
  const statistics: Record<
    CurrencyID,
    {
      incomeAmount: Decimal;
      expenseAmount: Decimal;
      expenseRootCategories: Record<
        ExpenseCategoryID,
        { id: string; amount: Decimal }
      >;
      incomeRootCategories: Record<
        IncomeCategoryID,
        { id: string; amount: Decimal }
      >;
      excludedExpenseCategories: Record<
        ExpenseCategoryID,
        { id: string; amount: Decimal }
      >;
      excludedIncomeCategories: Record<
        IncomeCategoryID,
        { id: string; amount: Decimal }
      >;
    }
  > = {};

  const emptyCurrencyStatistics = () => ({
    incomeAmount: new Decimal("0"),
    expenseAmount: new Decimal("0"),
    expenseRootCategories: {},
    incomeRootCategories: {},
    excludedExpenseCategories: {},
    excludedIncomeCategories: {},
  });

  for (const transaction of transactions) {
    switch (transaction.type) {
      case TransactionType.expense: {
        const account = accounts[transaction.accountId];
        const currencyId = account.currencyId;
        const amount = new Decimal(transaction.amount);
        const rootCategory = getRootCategory(
          expenseCategories,
          transaction.categoryId,
        );

        const currencyStatistics =
          statistics[currencyId] ??
          (statistics[currencyId] = emptyCurrencyStatistics());

        const excludedCategory = getTopExcludedCategory(
          expenseCategories,
          transaction.categoryId,
        );
        if (excludedCategory !== null) {
          const excludedStatistics =
            currencyStatistics.excludedExpenseCategories[excludedCategory.id] ??
            (currencyStatistics.excludedExpenseCategories[excludedCategory.id] =
              { id: excludedCategory.id, amount: new Decimal("0") });
          excludedStatistics.amount = excludedStatistics.amount.plus(amount);
          break;
        }

        const categoryStatistics =
          currencyStatistics.expenseRootCategories[rootCategory.id] ??
          (currencyStatistics.expenseRootCategories[rootCategory.id] = {
            id: rootCategory.id,
            amount: new Decimal("0"),
          });

        currencyStatistics.expenseAmount =
          currencyStatistics.expenseAmount.plus(amount);
        categoryStatistics.amount = categoryStatistics.amount.plus(amount);

        break;
      }
      case TransactionType.income: {
        const account = accounts[transaction.accountId];
        const currencyId = account.currencyId;
        const amount = new Decimal(transaction.amount);
        const rootCategory = getRootCategory(
          incomeCategories,
          transaction.categoryId,
        );

        const currencyStatistics =
          statistics[currencyId] ??
          (statistics[currencyId] = emptyCurrencyStatistics());

        const excludedCategory = getTopExcludedCategory(
          incomeCategories,
          transaction.categoryId,
        );
        if (excludedCategory !== null) {
          const excludedStatistics =
            currencyStatistics.excludedIncomeCategories[excludedCategory.id] ??
            (currencyStatistics.excludedIncomeCategories[excludedCategory.id] =
              { id: excludedCategory.id, amount: new Decimal("0") });
          excludedStatistics.amount = excludedStatistics.amount.plus(amount);
          break;
        }

        const categoryStatistics =
          currencyStatistics.incomeRootCategories[rootCategory.id] ??
          (currencyStatistics.incomeRootCategories[rootCategory.id] = {
            id: rootCategory.id,
            amount: new Decimal("0"),
          });

        currencyStatistics.incomeAmount =
          currencyStatistics.incomeAmount.plus(amount);
        categoryStatistics.amount = categoryStatistics.amount.plus(amount);

        break;
      }
      case TransactionType.transfer: {
        const fromAccount = accounts[transaction.fromAccount.accountId];
        const toAccount = accounts[transaction.toAccount.accountId];
        const fromCurrencyId = fromAccount.currencyId;
        const toCurrencyId = toAccount.currencyId;
        const fromAmount = new Decimal(transaction.fromAccount.amount);
        const toAmount = new Decimal(transaction.toAccount.amount);

        const fromCurrencyStatistics =
          statistics[fromCurrencyId] ??
          (statistics[fromCurrencyId] = emptyCurrencyStatistics());
        const toCurrencyStatistics =
          statistics[toCurrencyId] ??
          (statistics[toCurrencyId] = emptyCurrencyStatistics());

        if (fromCurrencyId === toCurrencyId) {
          const amountDiff = fromAmount.minus(toAmount);
          if (amountDiff.isPositive()) {
            fromCurrencyStatistics.expenseAmount =
              fromCurrencyStatistics.expenseAmount.plus(amountDiff);
          } else {
            toCurrencyStatistics.incomeAmount =
              toCurrencyStatistics.incomeAmount.plus(amountDiff.abs());
          }
        } else {
          fromCurrencyStatistics.expenseAmount =
            fromCurrencyStatistics.expenseAmount.plus(fromAmount);
          toCurrencyStatistics.incomeAmount =
            toCurrencyStatistics.incomeAmount.plus(toAmount);
        }
      }
    }
  }

  const finalizeSection = (
    categories: Record<string, { id: string; amount: Decimal }>,
  ): CategoriesStatistics => {
    const totalAmount = Object.values(categories).reduce(
      (total, { amount }) => total.plus(amount),
      new Decimal("0"),
    );
    return {
      totalAmount: totalAmount.toString(),
      categories: Object.values(categories)
        .sort((a, b) => b.amount.minus(a.amount).toNumber())
        .map(({ id, amount }) => ({
          categoryId: id,
          amount: amount.toString(),
          percentage: totalAmount.isZero()
            ? "0.00"
            : amount.div(totalAmount).mul(100).toFixed(2),
        })),
    };
  };

  const result: CurrenciesStatistics = Object.fromEntries(
    Object.entries(statistics).map(([currencyId, currencyStatistics]) => {
      const currencyResult: CurrencyStatistics = {
        incomeAmount: currencyStatistics.incomeAmount.toString(),
        expenseAmount: currencyStatistics.expenseAmount.toString(),
        expenseRootCategories: finalizeSection(
          currencyStatistics.expenseRootCategories,
        ),
        incomeRootCategories: finalizeSection(
          currencyStatistics.incomeRootCategories,
        ),
      };
      if (Object.keys(currencyStatistics.excludedExpenseCategories).length) {
        currencyResult.excludedExpenseCategories = finalizeSection(
          currencyStatistics.excludedExpenseCategories,
        );
      }
      if (Object.keys(currencyStatistics.excludedIncomeCategories).length) {
        currencyResult.excludedIncomeCategories = finalizeSection(
          currencyStatistics.excludedIncomeCategories,
        );
      }
      return [currencyId, currencyResult];
    }),
  );

  return result;
}
