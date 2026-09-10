import { Header } from "@widgets/header";

import { CreateExpenseForm } from "@features/create-expense";
import { useDebtPersonSuggestions } from "@features/debts";
import { searchTransactionsByTitle } from "@features/search-transactions";

import { PageLayout } from "@shared/ui/layouts";

export const CreateExpensePage = () => {
  const debtPersonSuggestions = useDebtPersonSuggestions();
  return (
    <PageLayout className="h-full">
      <Header title="Add Expense" backButton />
      <CreateExpenseForm
        className="flex-1"
        searchTransactionsByTitle={searchTransactionsByTitle}
        debtPersonSuggestions={debtPersonSuggestions}
      />
    </PageLayout>
  );
};
