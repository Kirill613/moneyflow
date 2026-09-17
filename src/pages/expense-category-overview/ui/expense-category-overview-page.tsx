import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

import { Header } from "@widgets/header";
import { GroupedTransactionList } from "@widgets/transaction-list";

import {
  CreateExpenseCategoryFormData,
  CreateExpenseCategoryFormFieldset,
  UpdateExpenseCategoryButton,
  createExpenseCategoryFormSchema,
} from "@features/create-expense-category";
import { DeleteExpenseCategoryButton } from "@features/delete-expense-category";
import { CurrencyTotals, getSubcategoryTotals } from "@features/statistics";

import { useAccountsStore } from "@entities/account";
import {
  CategoryCard,
  ExpenseCategoryCardList,
  useExpenseCategoriesStore,
} from "@entities/category";
import {
  createCurrencyAmountString,
  formatAmountPrecision,
  useCurrenciesStore,
} from "@entities/currency";
import { useExpensesStore } from "@entities/transaction";

import { FloatingActionButton } from "@shared/ui/buttons";
import { Divider } from "@shared/ui/dividers";
import { PlusIcon } from "@shared/ui/icons";
import { PageLayout } from "@shared/ui/layouts";
import { Link } from "@shared/ui/links";

export const ExpenseCategoryOverviewPage = () => {
  const { id } = useParams();
  if (typeof id === "undefined") {
    throw new Error("Impossible expense category id");
  }
  const { expenseCategories } = useExpenseCategoriesStore();
  const { expenses } = useExpensesStore((state) => ({
    expenses: state.expenses,
  }));
  const { accounts } = useAccountsStore();
  const {
    currencies: { currencies },
  } = useCurrenciesStore();
  const category = expenseCategories[id];

  const totals = useMemo(
    () =>
      getSubcategoryTotals(
        id,
        expenseCategories,
        Object.values(expenses),
        accounts,
      ),
    [id, expenseCategories, expenses, accounts],
  );

  const formatTotals = (currencyTotals?: CurrencyTotals): string[] =>
    Object.entries(currencyTotals ?? {}).map(([currencyId, amount]) => {
      const currency = currencies[currencyId];
      if (!currency) {
        return `-${amount}`;
      }
      return `-${createCurrencyAmountString({
        currency,
        amount: formatAmountPrecision(amount, currency.precision),
      })}`;
    });

  const subCategories = Object.values(expenseCategories)
    .filter((subCategory) => subCategory.parentId === category?.id)
    .map((subCategory) => ({
      ...subCategory,
      amounts: formatTotals(totals.children[subCategory.id]),
    }));
  const directAmounts = formatTotals(totals.direct);

  const methods = useForm<CreateExpenseCategoryFormData>({
    defaultValues: category,
    resolver: zodResolver(createExpenseCategoryFormSchema),
  });
  const { reset } = methods;

  useEffect(() => {
    reset(category);
  }, [id, category, reset]);

  const beforeDelete = () => {
    reset({ title: "" });
  };

  return (
    category && (
      <PageLayout className="pb-44">
        <FormProvider {...methods}>
          <Header
            title="Category Overview"
            backButton
            rightActions={
              <>
                <DeleteExpenseCategoryButton
                  id={id}
                  beforeDelete={beforeDelete}
                />
                <UpdateExpenseCategoryButton
                  id={id}
                  parentId={category.parentId}
                />
              </>
            }
          />
          <main className="flex flex-col gap-6">
            <CreateExpenseCategoryFormFieldset />
            <div className="flex flex-col gap-3">
              <h2 className="ms-4 text-h2 text-text">Sub-categories</h2>
              {subCategories.length ? (
                <>
                  <ExpenseCategoryCardList categories={subCategories} />
                  {directAmounts.length > 0 && (
                    <CategoryCard className="flex items-center justify-between gap-3 bg-transparent">
                      <span className="text-subtext0">Без подкатегории</span>
                      <span className="flex flex-col items-end gap-0.5 text-red">
                        {directAmounts.map((amount) => (
                          <span key={amount}>{amount}</span>
                        ))}
                      </span>
                    </CategoryCard>
                  )}
                </>
              ) : (
                <p className="text-body-sm font-medium text-subtext0 indent-4">
                  You don’t have any sub-categories yet. To add first tap add
                  button.
                </p>
              )}
              <Link
                to={`/expense-categories/create?parentId=${category.id}`}
                className="fixed bottom-20 left-1/2 -translate-x-1/2 z-10"
              >
                <FloatingActionButton>
                  <PlusIcon size="lg" />
                </FloatingActionButton>
              </Link>
            </div>
            <Divider />
            {category && (
              <GroupedTransactionList filters={{ expenseCategoryId: id }} />
            )}
          </main>
        </FormProvider>
      </PageLayout>
    )
  );
};
