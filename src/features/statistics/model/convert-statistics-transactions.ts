import { BynPerUnit, convertAmount } from "@entities/currency-conversion";
import { Transaction, TransactionType } from "@entities/transaction";

import { AccountsForStatistics } from "./statistics";

export interface ConvertedStatisticsTransactions {
  transactions: Transaction[];
  // accounts remapped so every convertible account lives in the target
  // currency; unconvertible ones keep their original currency
  accounts: AccountsForStatistics;
  // currency ids that stayed unconverted (no ISO code or no rate)
  unconvertedCurrencyIds: string[];
}

// Rewrites transaction amounts into the target currency using NBRB rates so
// the whole statistics pipeline sees (ideally) a single currency. Amounts of
// accounts whose currency has no code or rate are left untouched, and such
// currencies keep their own sections.
export function convertStatisticsTransactions(
  transactions: Transaction[],
  accounts: Record<string, { currencyId: string }>,
  currencyCodes: Record<string, string>,
  bynPerUnit: BynPerUnit,
  targetCurrencyId: string,
  targetCode: string,
): ConvertedStatisticsTransactions {
  const convertible = new Set<string>();
  const unconverted = new Set<string>();
  const virtualAccounts: AccountsForStatistics = {};
  for (const [accountId, account] of Object.entries(accounts)) {
    const code = currencyCodes[account.currencyId];
    const ok =
      account.currencyId === targetCurrencyId ||
      (code !== undefined &&
        convertAmount("1", code, targetCode, bynPerUnit) !== null);
    if (ok) {
      convertible.add(accountId);
      virtualAccounts[accountId] = { currencyId: targetCurrencyId };
    } else {
      unconverted.add(account.currencyId);
      virtualAccounts[accountId] = { currencyId: account.currencyId };
    }
  }

  const convert = (amount: string, accountId: string): string => {
    const account = accounts[accountId];
    if (!account || !convertible.has(accountId)) {
      return amount;
    }
    if (account.currencyId === targetCurrencyId) {
      return amount;
    }
    const converted = convertAmount(
      amount,
      currencyCodes[account.currencyId],
      targetCode,
      bynPerUnit,
    );
    return converted === null ? amount : converted.toFixed(2);
  };

  const result = transactions.map((transaction) => {
    if (transaction.type === TransactionType.transfer) {
      return {
        ...transaction,
        fromAccount: {
          ...transaction.fromAccount,
          amount: convert(
            transaction.fromAccount.amount,
            transaction.fromAccount.accountId,
          ),
        },
        toAccount: {
          ...transaction.toAccount,
          amount: convert(
            transaction.toAccount.amount,
            transaction.toAccount.accountId,
          ),
        },
      };
    }
    return {
      ...transaction,
      amount: convert(transaction.amount, transaction.accountId),
    };
  });

  return {
    transactions: result,
    accounts: virtualAccounts,
    unconvertedCurrencyIds: [...unconverted],
  };
}
