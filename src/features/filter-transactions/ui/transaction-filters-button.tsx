import { DateTime } from "luxon";
import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { twMerge } from "tailwind-merge";

import {
  AccountCheckbox,
  AccountID,
  AccountMultiplePicker,
  useAccountsStore,
} from "@entities/account";
import {
  CategorySelect,
  ExpenseCategoryID,
  IncomeCategoryID,
  useExpenseCategoriesStore,
  useIncomeCategoriesStore,
} from "@entities/category";
import {
  CurrencyCheckbox,
  CurrencyID,
  CurrencyMultiplePicker,
  useCurrenciesStore,
} from "@entities/currency";

import { toLocalDatetime } from "@shared/lib/date";
import { Button } from "@shared/ui/buttons";
import { CalendarIcon, FilterIcon } from "@shared/ui/icons";
import { Input } from "@shared/ui/inputs";
import { ModalBottomSlide } from "@shared/ui/modals";
import {
  TabLikeRadioButton,
  TabLikeRadioButtonGroup,
} from "@shared/ui/radio-buttons";

import { TransactionFilters } from "../model/filter";

const QuickPeriod = {
  all: "all",
  thisMonth: "thisMonth",
  lastMonth: "lastMonth",
} as const;
type QuickPeriod = (typeof QuickPeriod)[keyof typeof QuickPeriod];

interface TransactionFiltersFormData {
  currencies: { currencyId: CurrencyID; value: boolean }[];
  accounts: { accountId: AccountID; value: boolean }[];
  expenseCategoryId: ExpenseCategoryID | null;
  incomeCategoryId: IncomeCategoryID | null;
  quickPeriod: QuickPeriod;
  fromMonth: string;
  toMonth: string;
  fromDateTimeRange: string;
  toDateTimeRange: string;
}

interface TransactionFiltersButtonProps {
  isOpen: boolean;
  onIsOpenChange: (value: boolean) => void;
  defaultValue?: TransactionFilters;
  onChange?(filters: TransactionFilters): void;
  className?: string;
}

// Resolves the active date range from the time controls. "This month" / "Last
// month" override the month range, which in turn overrides the day range.
const resolveDateRange = (
  data: TransactionFiltersFormData,
): { from?: DateTime; to?: DateTime } => {
  if (data.quickPeriod === QuickPeriod.thisMonth) {
    const now = DateTime.now();
    return { from: now.startOf("month"), to: now.endOf("month") };
  }
  if (data.quickPeriod === QuickPeriod.lastMonth) {
    const lastMonth = DateTime.now().minus({ months: 1 });
    return { from: lastMonth.startOf("month"), to: lastMonth.endOf("month") };
  }
  if (data.fromMonth || data.toMonth) {
    return {
      from: data.fromMonth
        ? DateTime.fromFormat(data.fromMonth, "yyyy-MM").startOf("month")
        : undefined,
      to: data.toMonth
        ? DateTime.fromFormat(data.toMonth, "yyyy-MM").endOf("month")
        : undefined,
    };
  }
  return {
    from: data.fromDateTimeRange
      ? DateTime.fromISO(data.fromDateTimeRange)
      : undefined,
    to: data.toDateTimeRange
      ? DateTime.fromISO(data.toDateTimeRange)
      : undefined,
  };
};

const mapFormDataToFilters = (
  data: TransactionFiltersFormData,
): TransactionFilters => {
  const currencyIds = data.currencies
    .filter((c) => c.value)
    .map((c) => c.currencyId);
  const accountIds = data.accounts
    .filter((a) => a.value)
    .map((a) => a.accountId);

  const { from, to } = resolveDateRange(data);
  return {
    currencyId: currencyIds.length ? currencyIds : undefined,
    accountId: accountIds.length ? accountIds : undefined,
    expenseCategoryId: data.expenseCategoryId ?? undefined,
    incomeCategoryId: data.incomeCategoryId ?? undefined,
    fromDateTimeRange: from,
    toDateTimeRange: to,
  };
};

export const TransactionFiltersButton = ({
  isOpen,
  onIsOpenChange,
  defaultValue,
  onChange,
  className,
}: TransactionFiltersButtonProps) => {
  const {
    currencies: { currencies, order: currenciesOrder },
  } = useCurrenciesStore();
  const { accounts, order: accountsOrder } = useAccountsStore();
  const { expenseCategories } = useExpenseCategoriesStore();
  const { incomeCategories } = useIncomeCategoriesStore();

  const { control, watch, handleSubmit, register, setValue } =
    useForm<TransactionFiltersFormData>({
      defaultValues: {
        currencies: [],
        accounts: [],
        expenseCategoryId: defaultValue?.expenseCategoryId ?? null,
        incomeCategoryId: defaultValue?.incomeCategoryId ?? null,
        quickPeriod: QuickPeriod.all,
        fromMonth: "",
        toMonth: "",
        fromDateTimeRange:
          defaultValue?.fromDateTimeRange &&
          toLocalDatetime(defaultValue.fromDateTimeRange),
        toDateTimeRange:
          defaultValue?.toDateTimeRange &&
          toLocalDatetime(defaultValue.toDateTimeRange),
      },
    });
  const { fields: currencyFields } = useFieldArray({
    name: "currencies",
    control,
  });
  const { fields: accountFields, replace: replaceAccountFields } =
    useFieldArray({
      name: "accounts",
      control,
    });

  const formCurrencies = watch("currencies");
  const quickPeriod = watch("quickPeriod");
  const fromMonth = watch("fromMonth");
  const toMonth = watch("toMonth");
  const monthRangeDisabled = quickPeriod !== QuickPeriod.all;
  const dayRangeDisabled =
    quickPeriod !== QuickPeriod.all || Boolean(fromMonth || toMonth);
  // Hash of currency fields state for useEffect dependency, because array of currency fields as dependency causes recursive re-render
  const formCurrenciesHash = formCurrencies
    .map((c) => `${c.currencyId}${c.value}`)
    .join("");

  useEffect(() => {
    const selectedCurrencies = formCurrencies.filter((c) => c.value);
    const selectedCurrencyIds = selectedCurrencies.map((c) => c.currencyId);
    const recomputedAccounts = selectedCurrencyIds.length
      ? accountsOrder
          .filter((accountId) =>
            selectedCurrencyIds.includes(accounts[accountId].currencyId),
          )
          .map((accountId) => ({
            accountId,
            value: Boolean(defaultValue?.accountId?.includes(accountId)),
          }))
      : accountsOrder.map((accountId) => ({
          accountId,
          value: Boolean(defaultValue?.accountId?.includes(accountId)),
        }));
    replaceAccountFields(recomputedAccounts);
  }, [
    formCurrencies,
    formCurrenciesHash,
    replaceAccountFields,
    accountsOrder,
    accounts,
    defaultValue?.accountId,
  ]);

  useEffect(() => {
    setValue(
      "currencies",
      currenciesOrder.map((currencyId) => ({
        currencyId,
        value: Boolean(defaultValue?.currencyId?.includes(currencyId)),
      })),
    );
  }, [currencies, currenciesOrder, setValue, defaultValue?.currencyId]);

  const closeModal = () => onIsOpenChange(false);
  const openModal = () => onIsOpenChange(true);

  const onApply = (data: TransactionFiltersFormData) => {
    onChange?.(mapFormDataToFilters(data));
    closeModal();
  };

  return (
    <>
      <button onClick={openModal}>
        <FilterIcon
          size="sm"
          className={twMerge(
            "text-overlay1 active:text-overlay2 transition-colors",
            className,
          )}
        />
      </button>
      <ModalBottomSlide
        title="Transactions Filters"
        isOpen={isOpen}
        onClose={closeModal}
        className="z-50"
        pageLayoutClassName="h-full"
      >
        <div className="flex flex-col flex-1 min-h-0 pb-7 gap-4">
          <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pe-1">
            <CurrencyMultiplePicker>
              {currencyFields.map((currencyField, index) => (
                <Controller
                  key={currencyField.id}
                  control={control}
                  name={`currencies.${index}.value`}
                  render={({ field: { value, onChange } }) => (
                    <CurrencyCheckbox
                      checked={value}
                      currency={currencies[currencyField.currencyId]}
                      onChange={onChange}
                    />
                  )}
                />
              ))}
            </CurrencyMultiplePicker>
            <AccountMultiplePicker>
              {accountFields.map((accountField, index) => (
                <Controller
                  key={accountField.id}
                  control={control}
                  name={`accounts.${index}.value`}
                  render={({ field: { value, onChange } }) => (
                    <AccountCheckbox
                      checked={value}
                      account={{
                        ...accounts[accountField.accountId],
                        currencySymbol:
                          currencies[
                            accounts[accountField.accountId].currencyId
                          ].symbol,
                      }}
                      onChange={onChange}
                    />
                  )}
                />
              ))}
            </AccountMultiplePicker>
            <Controller
              control={control}
              name="expenseCategoryId"
              render={({ field: { value, onChange } }) => (
                <CategorySelect
                  categories={expenseCategories}
                  label="Expense category"
                  value={value}
                  onChange={onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="incomeCategoryId"
              render={({ field: { value, onChange } }) => (
                <CategorySelect
                  categories={incomeCategories}
                  label="Income category"
                  value={value}
                  onChange={onChange}
                />
              )}
            />
            <Controller
              control={control}
              name="quickPeriod"
              render={({ field: { value, onChange } }) => (
                <TabLikeRadioButtonGroup
                  label="Period"
                  value={value}
                  onChange={onChange}
                >
                  <TabLikeRadioButton value={QuickPeriod.all}>
                    All time
                  </TabLikeRadioButton>
                  <TabLikeRadioButton value={QuickPeriod.thisMonth}>
                    This month
                  </TabLikeRadioButton>
                  <TabLikeRadioButton value={QuickPeriod.lastMonth}>
                    Last month
                  </TabLikeRadioButton>
                </TabLikeRadioButtonGroup>
              )}
            />
            <Input
              label="From month"
              type="month"
              leftAddon={<CalendarIcon size="sm" />}
              inputBoxClassName="gap-3"
              containerClassName={monthRangeDisabled ? "opacity-50" : ""}
              disabled={monthRangeDisabled}
              placeholder="From month"
              {...register("fromMonth")}
            />
            <Input
              label="To month"
              type="month"
              leftAddon={<CalendarIcon size="sm" />}
              inputBoxClassName="gap-3"
              containerClassName={monthRangeDisabled ? "opacity-50" : ""}
              disabled={monthRangeDisabled}
              placeholder="To month"
              {...register("toMonth")}
            />
            <Input
              label="From date time"
              type="datetime-local"
              leftAddon={<CalendarIcon size="sm" />}
              inputBoxClassName="gap-3"
              containerClassName={dayRangeDisabled ? "opacity-50" : ""}
              disabled={dayRangeDisabled}
              placeholder="From"
              {...register("fromDateTimeRange")}
            />
            <Input
              label="To date time"
              type="datetime-local"
              leftAddon={<CalendarIcon size="sm" />}
              inputBoxClassName="gap-3"
              containerClassName={dayRangeDisabled ? "opacity-50" : ""}
              disabled={dayRangeDisabled}
              placeholder="To"
              {...register("toDateTimeRange")}
            />
          </div>
          <Button
            onClick={handleSubmit(onApply)}
            className="w-[75%] self-center shrink-0"
          >
            Apply
          </Button>
        </div>
      </ModalBottomSlide>
    </>
  );
};
