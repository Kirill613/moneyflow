import { create } from "zustand";
import { devtools } from "zustand/middleware";

import { TransactionFilters } from "@features/filter-transactions";

interface TotalStatisticsFiltersStoreState {
  filters: TransactionFilters;
  setTotalStatisticsFilters(filters: TransactionFilters): void;
}

export const useTotalStatisticsFiltersStore =
  create<TotalStatisticsFiltersStoreState>()(
    devtools((set) => ({
      filters: {},
      setTotalStatisticsFilters(filters) {
        set({ filters });
      },
    })),
  );
