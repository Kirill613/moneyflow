import { Decimal } from "decimal.js";

import { AccountsMap } from "@entities/account";
import { BynPerUnit, convertAmount } from "@entities/currency-conversion";
import { Transaction } from "@entities/transaction";

import { getCurrencyBalance } from "./statistics";

export interface ConvertedCurrenciesTotalResult {
  // Sum of every currency balance converted to the target currency.
  total: string;
  // Currency ids excluded because they have no ISO code or no rate.
  unconvertedCurrencyIds: string[];
}

/**
 * Sums the balances of all currencies, converting each into the target
 * currency using NBRB rates. Currencies without an ISO code or rate are
 * skipped and reported.
 */
export function getConvertedCurrenciesTotal(
  currencyOrder: string[],
  accounts: AccountsMap,
  transactions: Transaction[],
  currencyCodes: Record<string, string>,
  bynPerUnit: BynPerUnit,
  targetCode: string,
): ConvertedCurrenciesTotalResult {
  let total = new Decimal("0");
  const unconvertedCurrencyIds: string[] = [];

  for (const currencyId of currencyOrder) {
    const code = currencyCodes[currencyId];
    if (!code) {
      unconvertedCurrencyIds.push(currencyId);
      continue;
    }

    const balance = getCurrencyBalance(currencyId, accounts, transactions);
    const converted = convertAmount(balance, code, targetCode, bynPerUnit);
    if (converted === null) {
      unconvertedCurrencyIds.push(currencyId);
      continue;
    }

    total = total.plus(converted);
  }

  return { total: total.toString(), unconvertedCurrencyIds };
}
