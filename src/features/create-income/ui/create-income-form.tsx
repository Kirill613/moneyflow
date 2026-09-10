import { zodResolver } from "@hookform/resolvers/zod";
import { DateTime } from "luxon";
import { useEffect } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { twMerge } from "tailwind-merge";

import { useAccountsStore } from "@entities/account";
import { useIncomeCategoriesStore } from "@entities/category";
import { useCurrenciesStore } from "@entities/currency";
import { normalizeDebtPerson } from "@entities/debt";
import { useIncomesStore } from "@entities/transaction";

import { getNowLocalDatetime } from "@shared/lib/date";
import { Button } from "@shared/ui/buttons";

import { useCreateIncomeFormStore } from "../model/store";

import {
  CreateIncomeFormData,
  CreateIncomeFormFieldset,
  CreateIncomeFormFieldsetProps,
  createIncomeFormSchema,
} from "./create-income-form-fieldset";

interface CreateIncomeFormProps
  extends Pick<
    CreateIncomeFormFieldsetProps,
    "searchTransactionsByTitle" | "debtPersonSuggestions"
  > {
  className?: string;
}

export const CreateIncomeForm = ({
  className,
  searchTransactionsByTitle,
  debtPersonSuggestions,
}: CreateIncomeFormProps) => {
  const navigate = useNavigate();
  const { createIncome, incomes } = useIncomesStore((state) => ({
    incomes: state.incomes,
    createIncome: state.createIncome,
  }));
  const { incomeCategories } = useIncomeCategoriesStore();
  const { order: accountsOrder, accounts } = useAccountsStore();
  const {
    currencies: { currencies },
  } = useCurrenciesStore();
  const {
    getCreateIncomeFormState,
    setCreateIncomeFormState,
    setAccountId,
    setCategoryId,
    resetCreateIncomeFormState,
  } = useCreateIncomeFormStore();

  const defaultValues = getCreateIncomeFormState();
  const methods = useForm<CreateIncomeFormData>({
    defaultValues: {
      ...defaultValues,
      datetime: defaultValues.datetime
        ? defaultValues.datetime
        : getNowLocalDatetime(),
    },
    resolver: zodResolver(createIncomeFormSchema),
  });
  const { handleSubmit, formState, watch } = methods;

  const { title, categoryId, accountId, amount, datetime, debtPerson } =
    watch();

  useEffect(() => {
    const category =
      categoryId === null ? categoryId : incomeCategories[categoryId] ?? null;
    if (category === null) {
      setCategoryId(null);
    }
  }, [categoryId, incomeCategories, setCategoryId]);

  useEffect(() => {
    const account =
      accountId === null ? accountId : accounts[accountId] ?? null;
    if (account === null) {
      setAccountId(null);
    }
  }, [accountId, accounts, setAccountId]);

  useEffect(() => {
    setCreateIncomeFormState({
      title,
      categoryId,
      accountId,
      amount,
      datetime,
      debtPerson,
    });
  }, [
    title,
    categoryId,
    accountId,
    amount,
    datetime,
    debtPerson,
    setCreateIncomeFormState,
  ]);

  const onCreateIncome = async (income: CreateIncomeFormData) => {
    if (income.accountId === null) {
      throw new Error("Impossible accountId on income creation");
    }
    if (income.categoryId === null) {
      throw new Error("Impossible categoryId on income creation");
    }

    await createIncome({
      ...income,
      accountId: income.accountId,
      categoryId: income.categoryId,
      datetime: DateTime.fromISO(income.datetime),
      debtPerson: normalizeDebtPerson(income.debtPerson) || undefined,
    });
    resetCreateIncomeFormState();
    navigate(-1);
  };

  return (
    <FormProvider {...methods}>
      <form
        className={twMerge(
          "flex flex-col justify-between gap-8 pb-7",
          className,
        )}
      >
        <CreateIncomeFormFieldset
          incomes={incomes}
          categories={incomeCategories}
          accounts={{ order: accountsOrder, accounts }}
          currencies={currencies}
          searchTransactionsByTitle={searchTransactionsByTitle}
          debtPersonSuggestions={debtPersonSuggestions}
        />
        <Button
          onClick={handleSubmit(onCreateIncome)}
          className="w-[75%] self-center"
          disabled={!formState.isValid}
        >
          Confirm
        </Button>
      </form>
    </FormProvider>
  );
};
