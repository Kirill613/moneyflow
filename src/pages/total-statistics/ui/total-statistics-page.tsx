import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";

import { Header } from "@widgets/header";

import {
  TransactionFiltersButton,
  filterTransactions,
} from "@features/filter-transactions";
import { TotalStatistics } from "@features/statistics";

import { useAccountsStore } from "@entities/account";
import {
  useExpenseCategoriesStore,
  useIncomeCategoriesStore,
} from "@entities/category";
import { useCurrencyConversionStore } from "@entities/currency-conversion";
import { useTransactions } from "@entities/transaction";

import { PageLayout } from "@shared/ui/layouts";

import { useTotalStatisticsFiltersStore } from "../model/store";

export const TotalStatisticsPage = () => {
  const { filters, setTotalStatisticsFilters } =
    useTotalStatisticsFiltersStore();
  const [params, setParams] = useSearchParams({
    filtersModalIsOpen: "false",
  });
  const filtersModalIsOpen =
    (params.get("filtersModalIsOpen") ?? "false") === "true";

  const { accounts } = useAccountsStore((state) => ({
    accounts: state.accounts,
  }));
  const { expenseCategories } = useExpenseCategoriesStore((state) => ({
    expenseCategories: state.expenseCategories,
  }));
  const { incomeCategories } = useIncomeCategoriesStore((state) => ({
    incomeCategories: state.incomeCategories,
  }));
  const rates = useCurrencyConversionStore((state) => state.rates);
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

  return (
    <PageLayout>
      <Header
        title={rates ? `Total (${rates.date})` : "Total"}
        rightActions={
          <TransactionFiltersButton
            isOpen={filtersModalIsOpen}
            onIsOpenChange={(value) =>
              setParams({ filtersModalIsOpen: value.toString() })
            }
            onChange={setTotalStatisticsFilters}
            defaultValue={filters}
          />
        }
      />
      <TotalStatistics transactions={filteredTransactions} />
    </PageLayout>
  );
};
