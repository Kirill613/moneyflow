import { Controller, useFormContext } from "react-hook-form";
import { z } from "zod";

import { AccountID, AccountIcon, AccountPicker } from "@entities/account";
import {
  CategorySelect,
  IncomeCategoryID,
  IncomeCategories,
  getTopExcludedCategory,
} from "@entities/category";
import {
  CurrenciesMap,
  CurrencyID,
  createCurrencyAmountString,
} from "@entities/currency";
import { isDebtCategoryTitle } from "@entities/debt";
import {
  IncomeID,
  Incomes,
  TransactionTitleAutocomplete,
  TransactionTitleAutocompleteProps,
  createIncomeAmountString,
  sortTransactionsByDateTime,
} from "@entities/transaction";

import { positiveDecimalRegex } from "@shared/lib/regex";
import { ColorPickerColor } from "@shared/ui/color-pickers";
import { CalendarIcon } from "@shared/ui/icons";
import { Input } from "@shared/ui/inputs";
import { Toggle } from "@shared/ui/toggles";

interface CreateIncomeFormAccount {
  id: AccountID;
  title: string;
  color: ColorPickerColor;
  icon: AccountIcon;
  currencyId: CurrencyID;
}

export interface CreateIncomeFormData {
  title: string;
  categoryId: IncomeCategoryID | null;
  accountId: AccountID | null;
  amount: string;
  datetime: string;
  debtPerson: string;
  includeInStatistics: boolean;
}

export interface CreateIncomeFormFieldsetProps
  extends Pick<TransactionTitleAutocompleteProps, "searchTransactionsByTitle"> {
  incomes: Incomes;
  categories: IncomeCategories;
  accounts: {
    order: AccountID[];
    accounts: Record<AccountID, CreateIncomeFormAccount>;
  };
  currencies: CurrenciesMap;
  debtPersonSuggestions?: string[];
}

export const createIncomeFormSchema = z.object({
  title: z.string(),
  categoryId: z.string(),
  accountId: z.string(),
  amount: z.string().regex(positiveDecimalRegex),
  datetime: z.string().nonempty(),
  debtPerson: z.string(),
  includeInStatistics: z.boolean(),
});

export const CreateIncomeFormFieldset = ({
  incomes,
  categories,
  accounts,
  currencies,
  searchTransactionsByTitle,
  debtPersonSuggestions = [],
}: CreateIncomeFormFieldsetProps) => {
  const { control, register, watch, reset, setValue } =
    useFormContext<CreateIncomeFormData>();

  const [accountId, title, categoryId, debtPerson] = watch([
    "accountId",
    "title",
    "categoryId",
    "debtPerson",
  ]);
  const isDebtCategory =
    categoryId !== null &&
    isDebtCategoryTitle(categories[categoryId]?.title ?? "");
  const isCategoryExcluded =
    categoryId !== null &&
    getTopExcludedCategory(categories, categoryId) !== null;
  const currencySymbol =
    accountId === null
      ? undefined
      : currencies[accounts.accounts[accountId].currencyId]?.symbol;
  const sortedIncomes = sortTransactionsByDateTime(Object.values(incomes));
  const formattedIncomes = sortedIncomes.map((income) => ({
    ...income,
    formattedAmount: createIncomeAmountString(
      createCurrencyAmountString({
        currency: currencies[accounts.accounts[income.accountId].currencyId],
        amount: income.amount,
      }),
    ),
  }));

  const onSelectAutocompleteIncomeId = (value: IncomeID) => {
    const income = incomes[value];
    reset({
      title: income.title,
      categoryId: income.categoryId,
      accountId: income.accountId,
      amount: income.amount,
      debtPerson: income.debtPerson ?? "",
      includeInStatistics: income.excludedFromStatistics === false,
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <TransactionTitleAutocomplete
        transactions={formattedIncomes}
        title={title}
        amountColor="green"
        inputProps={{
          label: "Title",
          placeholder: "e.g. Salary, ...",
          value: title,
          ...register("title"),
        }}
        searchTransactionsByTitle={searchTransactionsByTitle}
        onSelect={onSelectAutocompleteIncomeId}
      />
      <Controller
        control={control}
        name="categoryId"
        render={({ field: { value, onChange } }) => (
          <CategorySelect
            categories={categories}
            label="Category"
            required
            value={value}
            onChange={onChange}
          />
        )}
      />
      {isDebtCategory && (
        <div className="flex flex-col gap-2">
          <Input
            label="Человек (долг)"
            placeholder="Имя"
            {...register("debtPerson")}
          />
          {debtPersonSuggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {debtPersonSuggestions.map((person) => (
                <button
                  key={person}
                  type="button"
                  className={`rounded-full px-3 py-1 text-sm transition-colors ${
                    person === debtPerson
                      ? "bg-lavender text-crust font-bold"
                      : "bg-surface0 text-text active:bg-surface1"
                  }`}
                  onClick={() =>
                    setValue("debtPerson", person, { shouldDirty: true })
                  }
                >
                  {person}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {isCategoryExcluded && (
        <Controller
          control={control}
          name="includeInStatistics"
          render={({ field: { value, onChange } }) => (
            <div className="flex items-center justify-between gap-3 px-4">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-text">
                  Учитывать в статистике
                </span>
                <span className="text-xs text-subtext0">
                  Категория скрыта из статистики, но эта запись будет считаться
                </span>
              </div>
              <Toggle checked={value ?? false} onChange={onChange} />
            </div>
          )}
        />
      )}
      <Controller
        control={control}
        name="accountId"
        render={({ field: { value, onChange } }) => (
          <AccountPicker
            accounts={accounts.order.map((accountId) => {
              const account = accounts.accounts[accountId];
              return {
                ...account,
                currencySymbol: currencies[account.currencyId].symbol,
              };
            })}
            label="Account"
            required
            value={value}
            onChange={onChange}
          />
        )}
      />
      <Input
        label="Amount"
        placeholder="15.8"
        required
        type="number"
        leftAddon={currencySymbol}
        {...register("amount")}
      />
      <Input
        label="Date & Time"
        required
        type="datetime-local"
        leftAddon={<CalendarIcon size="sm" />}
        inputBoxClassName="gap-3"
        {...register("datetime")}
      />
    </div>
  );
};
