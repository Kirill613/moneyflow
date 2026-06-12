import { useCurrenciesStore } from "@entities/currency";
import {
  SUPPORTED_CURRENCY_CODES,
  UNSET_CURRENCY_CODE,
  useCurrencyConversionStore,
} from "@entities/currency-conversion";

import {
  Select,
  SelectButton,
  SelectOption,
  SelectOptions,
} from "@shared/ui/selects";

const NOT_SET_LABEL = "— not set —";

export const CurrencyCodesMapping = () => {
  const {
    currencies: { order, currencies },
  } = useCurrenciesStore((state) => ({ currencies: state.currencies }));
  const { currencyCodes, setCurrencyCode } = useCurrencyConversionStore(
    (state) => ({
      currencyCodes: state.currencyCodes,
      setCurrencyCode: state.setCurrencyCode,
    }),
  );

  return (
    <main className="flex flex-col gap-4">
      <p className="text-xs text-subtext0">
        Assign an ISO code to each currency so amounts can be converted using
        official NBRB rates. Currencies left unset are excluded from the total
        statistics.
      </p>
      <ul className="flex flex-col gap-3">
        {order.map((currencyId) => {
          const currency = currencies[currencyId];
          const code = currencyCodes[currencyId] ?? UNSET_CURRENCY_CODE;
          return (
            <li
              key={currencyId}
              className="flex items-center justify-between gap-4"
            >
              <span className="text-sm font-medium text-text">
                {currency.symbol}
              </span>
              <Select
                value={code}
                onChange={(value: string) => setCurrencyCode(currencyId, value)}
                className="w-32"
              >
                <SelectButton>
                  <span>{code || NOT_SET_LABEL}</span>
                </SelectButton>
                <SelectOptions className="z-10 max-h-60">
                  <SelectOption value={UNSET_CURRENCY_CODE}>
                    {NOT_SET_LABEL}
                  </SelectOption>
                  {SUPPORTED_CURRENCY_CODES.map((isoCode) => (
                    <SelectOption key={isoCode} value={isoCode}>
                      {isoCode}
                    </SelectOption>
                  ))}
                </SelectOptions>
              </Select>
            </li>
          );
        })}
      </ul>
    </main>
  );
};
