import { Header } from "@widgets/header";

import { CurrencyCodesMapping } from "@features/currency-codes";

import { PageLayout } from "@shared/ui/layouts";

export const CurrencyCodesPage = () => {
  return (
    <PageLayout>
      <Header title="Currency codes" backButton />
      <CurrencyCodesMapping />
    </PageLayout>
  );
};
