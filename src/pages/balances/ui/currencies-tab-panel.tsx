import { Tab as HeadlessTab } from "@headlessui/react";
import { twMerge } from "tailwind-merge";

import {
  getConvertedCurrenciesTotal,
  getCurrencyBalance,
  targetDisplayCurrency,
} from "@features/statistics";

import { useAccountsStore } from "@entities/account";
import {
  CurrencyCard,
  createCurrencyAmountString,
  formatAmountPrecision,
  useCurrenciesStore,
} from "@entities/currency";
import { useCurrencyConversionStore } from "@entities/currency-conversion";
import { useTransactions } from "@entities/transaction";

import { FloatingActionButton } from "@shared/ui/buttons";
import { PlusIcon } from "@shared/ui/icons";
import { Link } from "@shared/ui/links";

export const CurrenciesTabPanel = () => {
  const { currencies } = useCurrenciesStore();
  const { accounts } = useAccountsStore();
  const transactions = useTransactions();
  const { currencyCodes, rates } = useCurrencyConversionStore();

  const bynPerUnit = rates?.bynPerUnit ?? {};
  // Hardcoded: always show the combined balance in BYN and USD side by side.
  const totals = (["BYN", "USD"] as const).map((code) => ({
    code,
    ...getConvertedCurrenciesTotal(
      currencies.order,
      accounts,
      transactions,
      currencyCodes,
      bynPerUnit,
      code,
    ),
  }));
  const unconvertedCurrencyIds = totals[0].unconvertedCurrencyIds;
  const convertedCount =
    currencies.order.length - unconvertedCurrencyIds.length;

  return (
    <HeadlessTab.Panel as="div" className="text-text">
      {currencies.order.length ? (
        <div className="flex flex-col gap-2.5">
          {convertedCount > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 gap-2.5">
                {totals.map(({ code, total }) => {
                  const currency = targetDisplayCurrency(code);
                  return (
                    <div
                      key={code}
                      className="flex flex-col gap-1 p-4 rounded bg-surface0"
                    >
                      <span className="text-xs text-subtext0">
                        Total {code}
                        {unconvertedCurrencyIds.length > 0 ? " (partial)" : ""}
                      </span>
                      <span className="text-lg font-extrabold whitespace-nowrap overflow-x-auto">
                        {`≈ ${createCurrencyAmountString({
                          currency,
                          amount: formatAmountPrecision(
                            total,
                            currency.precision,
                          ),
                        })}`}
                      </span>
                    </div>
                  );
                })}
              </div>
              {unconvertedCurrencyIds.length > 0 && (
                <Link to="/currency-codes">
                  <span className="text-xs text-yellow">
                    {unconvertedCurrencyIds.length} currency(ies) excluded — set
                    ISO codes in Settings.
                  </span>
                </Link>
              )}
            </div>
          )}
          {currencies.order.map((id) => (
            <CurrencyCard
              key={id}
              currency={currencies.currencies[id]}
              balance={getCurrencyBalance(id, accounts, transactions)}
            />
          ))}
        </div>
      ) : (
        <p
          className={twMerge(
            "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%]",
            "text-center text-base/[1.75] font-medium text-subtext0 whitespace-pre-line",
          )}
        >
          You don’t have any currencies yet. To add first tap add button
        </p>
      )}
      <Link
        to="/currencies/create"
        className="fixed bottom-20 left-1/2 -translate-x-1/2 z-10"
      >
        <FloatingActionButton>
          <PlusIcon size="lg" />
        </FloatingActionButton>
      </Link>
    </HeadlessTab.Panel>
  );
};
