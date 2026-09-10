import { Decimal } from "decimal.js";
import { useEffect, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { AccountID, AccountIcon, AccountPicker } from "@entities/account";
import {
  CurrenciesMap,
  CurrencyID,
  createCurrencyAmountString,
} from "@entities/currency";
import {
  TransactionTitleAutocomplete,
  TransactionTitleAutocompleteProps,
  TransferID,
  Transfers,
  createTransferAmountString,
  sortTransactionsByDateTime,
} from "@entities/transaction";

import { Button } from "@shared/ui/buttons";
import { ColorPickerColor } from "@shared/ui/color-pickers";
import { CalendarIcon } from "@shared/ui/icons";
import { Input } from "@shared/ui/inputs";
import { Link } from "@shared/ui/links";

import { convertTransferAmount, isPositiveAmount } from "../model/amounts";

export { createTransferFormSchema } from "../model/amounts";

interface CreateTransferFormAccount {
  id: AccountID;
  title: string;
  color: ColorPickerColor;
  icon: AccountIcon;
  currencyId: CurrencyID;
}

export interface CreateTransferFormData {
  title: string;
  fromAccountId: AccountID | null;
  fromAccountAmount: string;
  toAccountId: AccountID | null;
  toAccountAmount: string;
  datetime: string;
}

export interface CreateTransferFormFieldsetProps
  extends Pick<TransactionTitleAutocompleteProps, "searchTransactionsByTitle"> {
  transfers: Transfers;
  accounts: {
    order: AccountID[];
    accounts: Record<AccountID, CreateTransferFormAccount>;
  };
  currencies: CurrenciesMap;
}

export const CreateTransferFormFieldset = ({
  transfers,
  accounts,
  currencies,
  searchTransactionsByTitle,
}: CreateTransferFormFieldsetProps) => {
  const { control, register, watch, reset, setValue, getValues, formState } =
    useFormContext<CreateTransferFormData>();

  const [fromAccountId, toAccountId, title] = watch([
    "fromAccountId",
    "toAccountId",
    "title",
  ]);
  const fromAmount = watch("fromAccountAmount");
  const toAmount = watch("toAccountAmount");
  const fromCurrency = fromAccountId
    ? currencies[accounts.accounts[fromAccountId]?.currencyId]
    : undefined;
  const toCurrency = toAccountId
    ? currencies[accounts.accounts[toAccountId]?.currencyId]
    : undefined;
  const sameCurrency = !!fromCurrency && fromCurrency.id === toCurrency?.id;
  const [autoAmount, setAutoAmount] = useState(
    !toAmount || fromAmount === toAmount,
  );
  const [rateInput, setRateInput] = useState({
    from: fromAccountId,
    to: toAccountId,
    value: "",
  });
  const rate =
    rateInput.from === fromAccountId && rateInput.to === toAccountId
      ? rateInput.value
      : "";
  const setRate = (value: string) =>
    setRateInput({ from: fromAccountId, to: toAccountId, value });
  useEffect(() => {
    if (sameCurrency && autoAmount)
      setValue("toAccountAmount", fromAmount, { shouldValidate: true });
  }, [sameCurrency, autoAmount, fromAmount, setValue]);
  useEffect(() => {
    if (!sameCurrency && rate && toCurrency)
      setValue(
        "toAccountAmount",
        convertTransferAmount(fromAmount, rate, toCurrency.precision),
        { shouldValidate: true },
      );
  }, [sameCurrency, fromAmount, rate, toCurrency, setValue]);
  const fromAccountCurrencySymbol =
    fromAccountId === null
      ? undefined
      : currencies[accounts.accounts[fromAccountId]?.currencyId]?.symbol;
  const toAccountCurrencySymbol =
    toAccountId === null
      ? undefined
      : currencies[accounts.accounts[toAccountId]?.currencyId]?.symbol;
  const sortedTransfers = sortTransactionsByDateTime(Object.values(transfers));
  const formattedTransfers = sortedTransfers.map((transfer) => {
    const fromAccount = accounts.accounts[transfer.fromAccount.accountId];
    const fromCurrency = currencies[fromAccount.currencyId];
    const toAccount = accounts.accounts[transfer.toAccount.accountId];
    const toCurrency = currencies[toAccount.currencyId];
    return {
      ...transfer,
      formattedAmount: createTransferAmountString({
        fromAmount: createCurrencyAmountString({
          currency: fromCurrency,
          amount: transfer.fromAccount.amount,
        }),
        toAmount: createCurrencyAmountString({
          currency: toCurrency,
          amount: transfer.toAccount.amount,
        }),
        sameCurrencies: fromAccount.currencyId === toAccount.currencyId,
      }),
    };
  });

  const onSelectAutocompleteTransferId = (value: TransferID) => {
    const transfer = transfers[value];
    reset({
      ...getValues(),
      title: transfer.title,
      fromAccountId: transfer.fromAccount.accountId,
      fromAccountAmount: transfer.fromAccount.amount,
      toAccountId: transfer.toAccount.accountId,
      toAccountAmount: transfer.toAccount.amount,
    });
    setAutoAmount(transfer.fromAccount.amount === transfer.toAccount.amount);
    setRate("");
  };

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-subtext0">
        Выберите, откуда списать и куда зачислить деньги: карта, наличные или
        счёт в другой валюте.
      </p>
      {accounts.order.length < 2 && (
        <Link to="/accounts/create" className="text-lavender underline">
          Добавьте второй счёт для перевода
        </Link>
      )}
      <TransactionTitleAutocomplete
        transactions={formattedTransfers}
        title={title}
        amountColor="blue"
        inputProps={{
          label: "Комментарий",
          placeholder: "Снятие наличных, покупка долларов…",
          value: title,
          ...register("title"),
        }}
        searchTransactionsByTitle={searchTransactionsByTitle}
        onSelect={onSelectAutocompleteTransferId}
      />
      <div className="flex flex-col gap-3">
        <h2 className="text-h2 text-text ms-4">Откуда списать</h2>
        <Controller
          control={control}
          name="fromAccountId"
          render={({ field: { value, onChange } }) => (
            <AccountPicker
              accounts={accounts.order.map((accountId) => {
                const account = accounts.accounts[accountId];
                return {
                  ...account,
                  currencySymbol: currencies[account.currencyId].symbol,
                };
              })}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </div>
      <Input
        label="Сумма списания"
        id="transfer-from-amount"
        placeholder="15.8"
        required
        type="number"
        step="any"
        min="0"
        leftAddon={fromAccountCurrencySymbol}
        {...register("fromAccountAmount")}
      />
      <div className="flex flex-col gap-3">
        <Button
          type="button"
          size="sm"
          variant="outlined"
          disabled={!fromAccountId || !toAccountId}
          onClick={() => {
            setValue("fromAccountId", toAccountId, { shouldValidate: true });
            setValue("toAccountId", fromAccountId, { shouldValidate: true });
            setValue("fromAccountAmount", toAmount, { shouldValidate: true });
            setValue("toAccountAmount", fromAmount, { shouldValidate: true });
          }}
        >
          Поменять направление ⇄
        </Button>
        <h2 className="text-h2 text-text ms-4">Куда зачислить</h2>
        <Controller
          control={control}
          name="toAccountId"
          render={({ field: { value, onChange } }) => (
            <AccountPicker
              accounts={accounts.order
                .filter((accountId) => accountId !== fromAccountId)
                .map((accountId) => {
                  const account = accounts.accounts[accountId];
                  return {
                    ...account,
                    currencySymbol: currencies[account.currencyId].symbol,
                  };
                })}
              value={value}
              onChange={onChange}
            />
          )}
        />
      </div>
      {sameCurrency && (
        <label className="flex items-center gap-2 text-sm text-text">
          <input
            type="checkbox"
            checked={autoAmount}
            onChange={(event) => setAutoAmount(event.target.checked)}
          />
          Зачислить ту же сумму
        </label>
      )}
      {!!fromCurrency && !!toCurrency && !sameCurrency && (
        <Input
          id="transfer-rate"
          label={`Курс: сколько ${toCurrency.symbol} за 1 ${fromCurrency.symbol}`}
          placeholder="Введите курс или сумму зачисления ниже"
          type="number"
          step="any"
          min="0"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
        />
      )}
      <Input
        label="Сумма зачисления"
        id="transfer-to-amount"
        placeholder="15.8"
        required
        type="number"
        step="any"
        min="0"
        readOnly={sameCurrency && autoAmount}
        leftAddon={toAccountCurrencySymbol}
        {...register("toAccountAmount", { onChange: () => setRate("") })}
      />
      {formState.errors.toAccountId && (
        <p role="alert" className="text-red text-sm">
          Выберите разные счета для перевода.
        </p>
      )}
      {fromAccountId &&
        toAccountId &&
        isPositiveAmount(fromAmount) &&
        isPositiveAmount(toAmount) && (
          <p className="rounded bg-surface0 p-4 text-sm text-text">
            {accounts.accounts[fromAccountId]?.title}: −{fromAmount}{" "}
            {fromAccountCurrencySymbol}
            <br />
            {accounts.accounts[toAccountId]?.title}: +{toAmount}{" "}
            {toAccountCurrencySymbol}
            {!sameCurrency && (
              <>
                <br />1 {fromAccountCurrencySymbol} ={" "}
                {new Decimal(toAmount)
                  .div(fromAmount)
                  .toDecimalPlaces(6)
                  .toString()}{" "}
                {toAccountCurrencySymbol}
              </>
            )}
          </p>
        )}
      <Input
        label="Дата и время"
        required
        type="datetime-local"
        leftAddon={<CalendarIcon size="sm" />}
        inputBoxClassName="gap-3"
        {...register("datetime")}
      />
    </div>
  );
};
