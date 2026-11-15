import { Header } from "@widgets/header";

import { CreateIncomeForm } from "@features/create-income";
import { useDebtPersonSuggestions } from "@features/debts";
import { searchTransactionsByTitle } from "@features/search-transactions";

import { PageLayout } from "@shared/ui/layouts";

export const CreateIncomePage = () => {
  const debtPersonSuggestions = useDebtPersonSuggestions();
  return (
    <PageLayout className="h-[100dvh] overflow-y-auto pb-6">
      <Header title="Add Income" backButton />
      <CreateIncomeForm
        className="flex-1"
        searchTransactionsByTitle={searchTransactionsByTitle}
        debtPersonSuggestions={debtPersonSuggestions}
      />
    </PageLayout>
  );
};
