import { useAccountsStore } from "@entities/account";
import {
  useExpenseCategoriesStore,
  useIncomeCategoriesStore,
} from "@entities/category";
import {
  DebtTransaction,
  extractDebtPersonsFromTitles,
  isDebtCategoryTitle,
  normalizeDebtPerson,
} from "@entities/debt";
import { useExpensesStore, useIncomesStore } from "@entities/transaction";

export const useDebtPersonSuggestions = (): string[] => {
  const { expenses } = useExpensesStore((state) => ({
    expenses: state.expenses,
  }));
  const { incomes } = useIncomesStore((state) => ({
    incomes: state.incomes,
  }));
  const { expenseCategories } = useExpenseCategoriesStore();
  const { incomeCategories } = useIncomeCategoriesStore();

  const persons = new Map<string, string>();
  const addPerson = (person: string) => {
    const normalized = normalizeDebtPerson(person);
    if (normalized !== "" && !persons.has(normalized.toLowerCase())) {
      persons.set(normalized.toLowerCase(), normalized);
    }
  };

  const debtCategoryTitles: string[] = [];
  for (const expense of Object.values(expenses)) {
    if (expense.debtPerson) {
      addPerson(expense.debtPerson);
    } else if (
      isDebtCategoryTitle(expenseCategories[expense.categoryId]?.title ?? "")
    ) {
      debtCategoryTitles.push(expense.title);
    }
  }
  for (const income of Object.values(incomes)) {
    if (income.debtPerson) {
      addPerson(income.debtPerson);
    } else if (
      isDebtCategoryTitle(incomeCategories[income.categoryId]?.title ?? "")
    ) {
      debtCategoryTitles.push(income.title);
    }
  }
  extractDebtPersonsFromTitles(debtCategoryTitles).forEach(addPerson);

  return [...persons.values()];
};

export const useDebtTransactions = (): DebtTransaction[] => {
  const { expenses } = useExpensesStore((state) => ({
    expenses: state.expenses,
  }));
  const { incomes } = useIncomesStore((state) => ({
    incomes: state.incomes,
  }));
  const { accounts } = useAccountsStore();

  const transactions: DebtTransaction[] = [];
  for (const expense of Object.values(expenses)) {
    const account = accounts[expense.accountId];
    if (!expense.debtPerson || !account) continue;
    transactions.push({
      id: expense.id,
      kind: "expense",
      title: expense.title,
      amount: expense.amount,
      debtPerson: expense.debtPerson,
      datetime: expense.datetime.toMillis(),
      currencyId: account.currencyId,
    });
  }
  for (const income of Object.values(incomes)) {
    const account = accounts[income.accountId];
    if (!income.debtPerson || !account) continue;
    transactions.push({
      id: income.id,
      kind: "income",
      title: income.title,
      amount: income.amount,
      debtPerson: income.debtPerson,
      datetime: income.datetime.toMillis(),
      currencyId: account.currencyId,
    });
  }
  return transactions;
};
