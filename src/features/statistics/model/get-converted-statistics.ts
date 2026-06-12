import { AccountsMap } from "@entities/account";
import { ExpenseCategories, IncomeCategories } from "@entities/category";
import { BynPerUnit, convertAmount } from "@entities/currency-conversion";
import { Transaction, TransactionType } from "@entities/transaction";

import { netSameTitledCategories } from "./net-same-titled-categories";
import { CurrencyStatistics, getCurrenciesStatistics } from "./statistics";

// Every account is pretended to share this synthetic currency so that
// getCurrenciesStatistics groups all (already converted) transactions together.
const SYNTHETIC_CURRENCY_ID = "__converted__";

export interface ConvertedStatisticsResult {
  statistics: CurrencyStatistics | null;
  // Transactions that could not be converted (missing ISO code or missing rate).
  skippedTransactions: number;
  // App currency ids that have no ISO code assigned.
  unmappedCurrencyIds: string[];
}

/**
 * Builds a single combined statistic across all currencies by converting every
 * transaction into the target currency using NBRB rates, then reuses the
 * regular statistics computation and the same-titled-category netting.
 */
export function getConvertedStatistics(
  accounts: AccountsMap,
  expenseCategories: ExpenseCategories,
  incomeCategories: IncomeCategories,
  transactions: Transaction[],
  currencyCodes: Record<string, string>,
  bynPerUnit: BynPerUnit,
  targetCode: string,
): ConvertedStatisticsResult {
  const unmappedCurrencyIds = new Set<string>();
  let skippedTransactions = 0;

  const convert = (amount: string, accountId: string): string | null => {
    const code = currencyCodes[accounts[accountId].currencyId];
    if (!code) {
      unmappedCurrencyIds.add(accounts[accountId].currencyId);
      return null;
    }
    const converted = convertAmount(amount, code, targetCode, bynPerUnit);
    return converted === null ? null : converted.toString();
  };

  const convertedTransactions: Transaction[] = [];
  for (const transaction of transactions) {
    if (
      transaction.type === TransactionType.expense ||
      transaction.type === TransactionType.income
    ) {
      const amount = convert(transaction.amount, transaction.accountId);
      if (amount === null) {
        skippedTransactions++;
        continue;
      }
      convertedTransactions.push({ ...transaction, amount });
    } else {
      const fromAmount = convert(
        transaction.fromAccount.amount,
        transaction.fromAccount.accountId,
      );
      const toAmount = convert(
        transaction.toAccount.amount,
        transaction.toAccount.accountId,
      );
      if (fromAmount === null || toAmount === null) {
        skippedTransactions++;
        continue;
      }
      convertedTransactions.push({
        ...transaction,
        fromAccount: { ...transaction.fromAccount, amount: fromAmount },
        toAccount: { ...transaction.toAccount, amount: toAmount },
      });
    }
  }

  const syntheticAccounts: Record<string, { currencyId: string }> = {};
  for (const accountId of Object.keys(accounts)) {
    syntheticAccounts[accountId] = { currencyId: SYNTHETIC_CURRENCY_ID };
  }

  const statistics = netSameTitledCategories(
    getCurrenciesStatistics(
      syntheticAccounts,
      expenseCategories,
      incomeCategories,
      convertedTransactions,
    ),
    expenseCategories,
    incomeCategories,
  );

  return {
    statistics: statistics[SYNTHETIC_CURRENCY_ID] ?? null,
    skippedTransactions,
    unmappedCurrencyIds: [...unmappedCurrencyIds],
  };
}
