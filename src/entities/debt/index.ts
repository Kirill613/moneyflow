import { create } from "zustand";

import { Debt, debtsApi, getDebtRemaining } from "@shared/api/debts-api";

export { getDebtRemaining };
export type { Debt };

interface DebtsState {
  debts: Debt[];
  loaded: boolean;
  fetchDebts(): Promise<void>;
  saveDebt(debt: Debt): Promise<void>;
  deleteDebt(id: string): Promise<void>;
}

// Serialize writes so saving two records cannot overwrite another change.
let writes = Promise.resolve();
const enqueue = (action: () => Promise<void>) => {
  const result = writes.then(action);
  writes = result.catch(() => undefined);
  return result;
};

export const useDebtsStore = create<DebtsState>((set, get) => ({
  debts: [],
  loaded: false,
  async fetchDebts() {
    await writes;
    set({ debts: await debtsApi.getDebts(), loaded: true });
  },
  saveDebt(debt) {
    return enqueue(async () => {
      const debts = get().debts;
      const next = debts.some((item) => item.id === debt.id)
        ? debts.map((item) => (item.id === debt.id ? debt : item))
        : [...debts, debt];
      await debtsApi.setDebts(next);
      set({ debts: next });
    });
  },
  deleteDebt(id) {
    return enqueue(async () => {
      const debts = get().debts.filter((item) => item.id !== id);
      await debtsApi.setDebts(debts);
      set({ debts });
    });
  },
}));
