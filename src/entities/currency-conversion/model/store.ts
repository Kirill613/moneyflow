import { DateTime } from "luxon";
import { create } from "zustand";
import { devtools } from "zustand/middleware";

import {
  CachedRatesDTO,
  currencyConversionApi,
} from "@shared/api/currency-conversion-api";
import { fetchDailyRates } from "@shared/api/nbrb-api";

import { buildBynPerUnit } from "../lib/convert";

interface CurrencyConversionStoreState {
  currencyCodes: Record<string, string>;
  targetCode: string;
  rates: CachedRatesDTO | null;
  isRefreshingRates: boolean;
  refreshError: string | null;
  fetchCurrencyConversion(): Promise<void>;
  setCurrencyCode(currencyId: string, code: string): Promise<void>;
  setTargetCode(code: string): Promise<void>;
  refreshRates(): Promise<void>;
}

export const useCurrencyConversionStore =
  create<CurrencyConversionStoreState>()(
    devtools((set, get) => ({
      currencyCodes: {},
      targetCode: "BYN",
      rates: null,
      isRefreshingRates: false,
      refreshError: null,
      async fetchCurrencyConversion() {
        const { currencyCodes, targetCode, rates } =
          await currencyConversionApi.getCurrencyConversion();
        set({ currencyCodes, targetCode, rates });
      },
      async setCurrencyCode(currencyId, code) {
        const currencyCodes = { ...get().currencyCodes };
        if (code) {
          currencyCodes[currencyId] = code;
        } else {
          delete currencyCodes[currencyId];
        }
        await currencyConversionApi.setCurrencyConversion({
          currencyCodes,
          targetCode: get().targetCode,
          rates: get().rates,
        });
        set({ currencyCodes });
      },
      async setTargetCode(code) {
        await currencyConversionApi.setCurrencyConversion({
          currencyCodes: get().currencyCodes,
          targetCode: code,
          rates: get().rates,
        });
        set({ targetCode: code });
      },
      async refreshRates() {
        set({ isRefreshingRates: true, refreshError: null });
        try {
          const rawRates = await fetchDailyRates();
          const rates: CachedRatesDTO = {
            date: DateTime.now().toFormat("yyyy-MM-dd"),
            bynPerUnit: buildBynPerUnit(rawRates),
          };
          await currencyConversionApi.setCurrencyConversion({
            currencyCodes: get().currencyCodes,
            targetCode: get().targetCode,
            rates,
          });
          set({ rates, isRefreshingRates: false });
        } catch (error) {
          set({
            isRefreshingRates: false,
            refreshError:
              error instanceof Error ? error.message : "Failed to fetch rates",
          });
        }
      },
    })),
  );
