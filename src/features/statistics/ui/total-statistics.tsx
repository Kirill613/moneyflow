import { DateTime } from "luxon";
import { useEffect, useMemo } from "react";

import { useAccountsStore } from "@entities/account";
import {
  useExpenseCategoriesStore,
  useIncomeCategoriesStore,
} from "@entities/category";
import {
  TARGET_CURRENCIES,
  useCurrencyConversionStore,
} from "@entities/currency-conversion";
import { Transaction } from "@entities/transaction";

import { Link } from "@shared/ui/links";
import {
  TabLikeRadioButton,
  TabLikeRadioButtonGroup,
} from "@shared/ui/radio-buttons";

import { getConvertedStatistics } from "../model/get-converted-statistics";
import { targetDisplayCurrency } from "../model/target-display-currency";

import { CategoriesStatisticsSection } from "./categories-statistics-section";
import { CurrencyTotalCard } from "./currency-total-card";

interface TotalStatisticsProps {
  transactions: Transaction[];
}

export const TotalStatistics = ({ transactions }: TotalStatisticsProps) => {
  const { accounts } = useAccountsStore((state) => ({
    accounts: state.accounts,
  }));
  const { expenseCategories } = useExpenseCategoriesStore((state) => ({
    expenseCategories: state.expenseCategories,
  }));
  const { incomeCategories } = useIncomeCategoriesStore((state) => ({
    incomeCategories: state.incomeCategories,
  }));

  const {
    currencyCodes,
    targetCode,
    rates,
    isRefreshingRates,
    setTargetCode,
    refreshRates,
  } = useCurrencyConversionStore();

  // Refresh the rates once a day (or when there are none yet).
  useEffect(() => {
    const today = DateTime.now().toFormat("yyyy-MM-dd");
    if (!isRefreshingRates && (!rates || rates.date !== today)) {
      refreshRates();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bynPerUnit = rates?.bynPerUnit ?? {};

  const { statistics, skippedTransactions, unmappedCurrencyIds } = useMemo(
    () =>
      getConvertedStatistics(
        accounts,
        expenseCategories,
        incomeCategories,
        transactions,
        currencyCodes,
        bynPerUnit,
        targetCode,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      accounts,
      expenseCategories,
      incomeCategories,
      transactions,
      currencyCodes,
      rates,
      targetCode,
    ],
  );

  const currency = targetDisplayCurrency(targetCode);

  return (
    <main className="flex flex-col gap-6">
      <TabLikeRadioButtonGroup value={targetCode} onChange={setTargetCode}>
        {TARGET_CURRENCIES.map((target) => (
          <TabLikeRadioButton key={target.code} value={target.code}>
            {target.label}
          </TabLikeRadioButton>
        ))}
      </TabLikeRadioButtonGroup>

      {unmappedCurrencyIds.length > 0 && (
        <Link to="/currency-codes">
          <p className="text-xs text-yellow">
            {unmappedCurrencyIds.length} currency(ies) have no ISO code and are
            excluded. Tap to set codes in Settings.
          </p>
        </Link>
      )}

      {skippedTransactions > 0 && unmappedCurrencyIds.length === 0 && (
        <p className="text-xs text-yellow">
          {skippedTransactions} transaction(s) skipped — missing exchange rate.
        </p>
      )}

      {statistics ? (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <CurrencyTotalCard
              type="expense"
              currency={currency}
              amount={statistics.expenseAmount}
            />
            <CurrencyTotalCard
              type="income"
              currency={currency}
              amount={statistics.incomeAmount}
            />
          </div>
          {statistics.expenseRootCategories.categories.length > 0 && (
            <CategoriesStatisticsSection
              categoryType="expense"
              totalAmount={statistics.expenseRootCategories.totalAmount}
              currency={currency}
              categories={statistics.expenseRootCategories.categories.map(
                (category) => ({
                  id: category.categoryId,
                  amount: category.amount,
                  percentage: category.percentage,
                  title: expenseCategories[category.categoryId].title,
                }),
              )}
            />
          )}
          {statistics.incomeRootCategories.categories.length > 0 && (
            <CategoriesStatisticsSection
              categoryType="income"
              totalAmount={statistics.incomeRootCategories.totalAmount}
              currency={currency}
              categories={statistics.incomeRootCategories.categories.map(
                (category) => ({
                  id: category.categoryId,
                  amount: category.amount,
                  percentage: category.percentage,
                  title: incomeCategories[category.categoryId].title,
                }),
              )}
            />
          )}
        </div>
      ) : (
        <p className="text-center text-sm text-subtext0">
          Nothing to show yet. Add transactions and assign ISO codes to your
          currencies in Settings.
        </p>
      )}
    </main>
  );
};
