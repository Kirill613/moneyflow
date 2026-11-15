import { Decimal } from "decimal.js";
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import { Header } from "@widgets/header";

import {
  TransactionFiltersButton,
  filterTransactions,
} from "@features/filter-transactions";
import {
  CategoriesStatisticsSection,
  CurrencyTotalCard,
  convertStatisticsTransactions,
  getCurrenciesStatistics,
  getCurrencyCategoryBreakdown,
  isTransactionExcludedFromStatistics,
  netSameTitledCategories,
} from "@features/statistics";

import { useAccountsStore } from "@entities/account";
import {
  createCategoryString,
  getRootCategory,
  getTopExcludedCategory,
  useExpenseCategoriesStore,
  useIncomeCategoriesStore,
} from "@entities/category";
import {
  createCurrencyAmountString,
  formatAmountPrecision,
  useCurrenciesStore,
} from "@entities/currency";
import { useCurrencyConversionStore } from "@entities/currency-conversion";
import { useSettingsStore } from "@entities/settings";
import { TransactionType, useTransactions } from "@entities/transaction";

import { Divider } from "@shared/ui/dividers";
import { PageLayout } from "@shared/ui/layouts";

import { useStatisticsFiltersStore } from "../model/store";

export const StatisticsPage = () => {
  const { filters, setStatisticsFilters } = useStatisticsFiltersStore();
  const [params, setParams] = useSearchParams({
    filtersModalIsOpen: "false",
  });
  const filtersModalIsOpenParam = params.get("filtersModalIsOpen") ?? "false";
  const filtersModalIsOpen = filtersModalIsOpenParam === "true";

  const {
    currencies: { order: currenciesOrder, currencies },
  } = useCurrenciesStore((state) => ({
    currencies: state.currencies,
  }));
  const { accounts } = useAccountsStore((state) => ({
    accounts: state.accounts,
  }));
  const { expenseCategories } = useExpenseCategoriesStore((state) => ({
    expenseCategories: state.expenseCategories,
  }));
  const { incomeCategories } = useIncomeCategoriesStore((state) => ({
    incomeCategories: state.incomeCategories,
  }));
  const transactions = useTransactions();
  const filteredTransactions = useMemo(
    () =>
      filterTransactions(
        transactions,
        filters,
        accounts,
        expenseCategories,
        incomeCategories,
      ),
    [transactions, filters, accounts, expenseCategories, incomeCategories],
  );
  const { statistics: statisticsSettings } = useSettingsStore((state) => ({
    statistics: state.statistics,
  }));
  const includeHidden = statisticsSettings?.includeHiddenCategories ?? false;
  const { currencyCodes, rates } = useCurrencyConversionStore();
  const bynPerUnit = useMemo(() => rates?.bynPerUnit ?? {}, [rates]);
  const targetCurrencyId = useMemo(
    () =>
      currenciesOrder.find(
        (currencyId) => currencyCodes[currencyId] === "BYN",
      ) ?? null,
    [currenciesOrder, currencyCodes],
  );
  const conversion = useMemo(() => {
    if (targetCurrencyId === null || Object.keys(bynPerUnit).length === 0) {
      return {
        transactions: filteredTransactions,
        accounts,
        unconvertedCurrencyIds: [],
        active: false,
      };
    }
    return {
      ...convertStatisticsTransactions(
        filteredTransactions,
        accounts,
        currencyCodes,
        bynPerUnit,
        targetCurrencyId,
        "BYN",
      ),
      active: true,
    };
  }, [
    filteredTransactions,
    accounts,
    currencyCodes,
    bynPerUnit,
    targetCurrencyId,
  ]);
  const statsTransactions = conversion.transactions;
  const statsAccounts = conversion.accounts;

  const statistics = useMemo(
    () =>
      netSameTitledCategories(
        getCurrenciesStatistics(
          statsAccounts,
          expenseCategories,
          incomeCategories,
          statsTransactions,
          { ignoreExclusions: includeHidden },
        ),
        expenseCategories,
        incomeCategories,
      ),
    [
      statsAccounts,
      expenseCategories,
      incomeCategories,
      statsTransactions,
      includeHidden,
    ],
  );

  // original (unconverted) non-BYN sums per visible row, shown as "в т.ч. ..."
  const originalComposition = useMemo(() => {
    const expense: Record<string, Record<string, string>> = {};
    const income: Record<string, Record<string, string>> = {};
    if (!conversion.active) return { expense, income };
    for (const transaction of filteredTransactions) {
      if (transaction.type === TransactionType.transfer) continue;
      const account = accounts[transaction.accountId];
      if (!account || account.currencyId === targetCurrencyId) continue;
      const isExpense = transaction.type === TransactionType.expense;
      const categories = isExpense ? expenseCategories : incomeCategories;
      const top = getTopExcludedCategory(categories, transaction.categoryId);
      const counted =
        includeHidden ||
        transaction.excludedFromStatistics === false ||
        top === null;
      const rowId = counted
        ? getRootCategory(categories, transaction.categoryId).id
        : (top as NonNullable<typeof top>).id;
      const bucket = isExpense ? expense : income;
      const row = (bucket[rowId] = bucket[rowId] ?? {});
      row[account.currencyId] = new Decimal(row[account.currencyId] ?? "0")
        .plus(transaction.amount)
        .toString();
    }
    return { expense, income };
  }, [
    conversion.active,
    filteredTransactions,
    accounts,
    targetCurrencyId,
    expenseCategories,
    incomeCategories,
    includeHidden,
  ]);

  const formatOriginal = (
    composition: Record<string, string> | undefined,
    prefix: string,
  ): string[] =>
    Object.entries(composition ?? {}).map(([currencyId, amount]) => {
      const currency = currencies[currencyId];
      if (!currency) return `${prefix}${amount}`;
      return `${prefix}${createCurrencyAmountString({
        currency,
        amount: formatAmountPrecision(amount, currency.precision),
      })}`;
    });

  type BreakdownTransaction = {
    categoryId: string;
    accountId: string;
    amount: string;
    excludedFromStatistics?: boolean;
  };
  const partitionByExclusion = (
    transactions: BreakdownTransaction[],
    categories: typeof expenseCategories,
  ) => {
    const counted: BreakdownTransaction[] = [];
    const excluded: BreakdownTransaction[] = [];
    for (const transaction of transactions) {
      (!includeHidden &&
      isTransactionExcludedFromStatistics(categories, transaction)
        ? excluded
        : counted
      ).push(transaction);
    }
    return { counted, excluded };
  };
  const expenseTransactions = useMemo(
    () =>
      partitionByExclusion(
        statsTransactions.filter(
          (transaction) => transaction.type === TransactionType.expense,
        ) as BreakdownTransaction[],
        expenseCategories,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statsTransactions, expenseCategories, includeHidden],
  );
  const incomeTransactions = useMemo(
    () =>
      partitionByExclusion(
        statsTransactions.filter(
          (transaction) => transaction.type === TransactionType.income,
        ) as BreakdownTransaction[],
        incomeCategories,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statsTransactions, incomeCategories, includeHidden],
  );

  const buildBreakdown = (
    rootId: string,
    categories: typeof expenseCategories,
    transactions: {
      counted: BreakdownTransaction[];
      excluded: BreakdownTransaction[];
    },
    currencyId: string,
  ) => [
    ...getCurrencyCategoryBreakdown(
      rootId,
      categories,
      transactions.counted,
      statsAccounts,
      currencyId,
      "Без подкатегории",
    ),
    ...getCurrencyCategoryBreakdown(
      rootId,
      categories,
      transactions.excluded,
      statsAccounts,
      currencyId,
      "Без подкатегории",
    ).map((item) => ({ ...item, excluded: true })),
  ];

  const fromDateString = filters.fromDateTimeRange?.toLocaleString({
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const toDateString = filters.toDateTimeRange?.toLocaleString({
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  let dateRangeString: string;
  if (fromDateString && toDateString) {
    dateRangeString = `${fromDateString} - ${toDateString}`;
  } else if (fromDateString) {
    dateRangeString = `From ${fromDateString}`;
  } else if (toDateString) {
    dateRangeString = `To ${toDateString}`;
  } else {
    dateRangeString = "All time";
  }

  return (
    <PageLayout>
      <Header
        title="Statistics"
        rightActions={
          <TransactionFiltersButton
            isOpen={filtersModalIsOpen}
            onIsOpenChange={(value) =>
              setParams({ filtersModalIsOpen: value.toString() })
            }
            onChange={setStatisticsFilters}
            defaultValue={filters}
          />
        }
      />
      {filteredTransactions.length ? (
        <main className="flex flex-col gap-4">
          {currenciesOrder.map((currencyId) => {
            if (!(currencyId in statistics)) {
              return null;
            }

            const currencyStatistics = statistics[currencyId];
            // excluded categories shown greyed-out inside their own root line
            // breakdowns (when nested) or as extra rows in the section (when
            // they are roots themselves)
            const countedExpenseRoots = new Set(
              currencyStatistics.expenseRootCategories.categories.map(
                (category) => category.categoryId,
              ),
            );
            const countedIncomeRoots = new Set(
              currencyStatistics.incomeRootCategories.categories.map(
                (category) => category.categoryId,
              ),
            );
            // a hidden root gets its own grey row; a hidden subcategory shows
            // inside its root's breakdown, unless that root has no counted row
            // in this currency - then it also gets its own grey row
            const pickExcluded = (
              excluded: { categoryId: string; amount: string }[],
              categories: typeof expenseCategories,
              countedRoots: Set<string>,
            ) =>
              excluded.filter((category) => {
                const entity = categories[category.categoryId];
                if (!entity) return false;
                if (entity.parentId === null) return true;
                return !countedRoots.has(
                  getRootCategory(categories, category.categoryId).id,
                );
              });
            const excludedExpense = pickExcluded(
              currencyStatistics.excludedExpenseCategories?.categories ?? [],
              expenseCategories,
              countedExpenseRoots,
            );
            const excludedIncome = pickExcluded(
              currencyStatistics.excludedIncomeCategories?.categories ?? [],
              incomeCategories,
              countedIncomeRoots,
            );

            if (
              currencyStatistics.expenseAmount === "0" &&
              currencyStatistics.incomeAmount === "0" &&
              excludedExpense.length === 0 &&
              excludedIncome.length === 0
            ) {
              return null;
            }

            const currency = currencies[currencyId];

            return (
              <div key={currency.id} className="flex flex-col gap-4 group">
                <span className="text-sm text-subtext0 font-medium ">
                  {dateRangeString}
                  {conversion.active && currencyId === targetCurrencyId
                    ? " · всё ≈ BYN по курсу НБРБ"
                    : ""}
                </span>
                <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-2 gap-4">
                    <CurrencyTotalCard
                      type="expense"
                      currency={currency}
                      amount={currencyStatistics.expenseAmount}
                    />
                    <CurrencyTotalCard
                      type="income"
                      currency={currency}
                      amount={currencyStatistics.incomeAmount}
                    />
                  </div>
                  {currencyStatistics.expenseRootCategories.categories.length ||
                  excludedExpense.length ? (
                    <CategoriesStatisticsSection
                      categoryType="expense"
                      totalAmount={
                        currencyStatistics.expenseRootCategories.totalAmount
                      }
                      currency={currency}
                      excludedCategories={excludedExpense.map((category) => ({
                        id: category.categoryId,
                        amount: category.amount,
                        original: formatOriginal(
                          originalComposition.expense[category.categoryId],
                          "-",
                        ),
                        title: createCategoryString(
                          expenseCategories,
                          category.categoryId,
                        ),
                        breakdown: buildBreakdown(
                          category.categoryId,
                          expenseCategories,
                          expenseTransactions,
                          currencyId,
                        ),
                      }))}
                      categories={currencyStatistics.expenseRootCategories.categories.map(
                        (category) => ({
                          id: category.categoryId,
                          amount: category.amount,
                          percentage: category.percentage,
                          title: expenseCategories[category.categoryId].title,
                          original: formatOriginal(
                            originalComposition.expense[category.categoryId],
                            "-",
                          ),
                          breakdown: buildBreakdown(
                            category.categoryId,
                            expenseCategories,
                            expenseTransactions,
                            currencyId,
                          ),
                        }),
                      )}
                    />
                  ) : null}
                  {currencyStatistics.incomeRootCategories.categories.length ||
                  excludedIncome.length ? (
                    <CategoriesStatisticsSection
                      categoryType="income"
                      totalAmount={
                        currencyStatistics.incomeRootCategories.totalAmount
                      }
                      currency={currency}
                      excludedCategories={excludedIncome.map((category) => ({
                        id: category.categoryId,
                        amount: category.amount,
                        original: formatOriginal(
                          originalComposition.income[category.categoryId],
                          "+",
                        ),
                        title: createCategoryString(
                          incomeCategories,
                          category.categoryId,
                        ),
                        breakdown: buildBreakdown(
                          category.categoryId,
                          incomeCategories,
                          incomeTransactions,
                          currencyId,
                        ),
                      }))}
                      categories={currencyStatistics.incomeRootCategories.categories.map(
                        (category) => ({
                          id: category.categoryId,
                          amount: category.amount,
                          percentage: category.percentage,
                          title: incomeCategories[category.categoryId].title,
                          original: formatOriginal(
                            originalComposition.income[category.categoryId],
                            "+",
                          ),
                          breakdown: buildBreakdown(
                            category.categoryId,
                            incomeCategories,
                            incomeTransactions,
                            currencyId,
                          ),
                        }),
                      )}
                    />
                  ) : null}
                </div>
                <Divider className="group-last:hidden" />
              </div>
            );
          })}
        </main>
      ) : (
        <p
          className={twMerge(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%]",
            "text-center text-base/[1.75] font-medium text-subtext0 whitespace-pre-line",
          )}
        >
          There is no transactions for selected filters
        </p>
      )}
    </PageLayout>
  );
};
