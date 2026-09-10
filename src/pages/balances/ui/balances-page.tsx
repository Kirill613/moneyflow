import { Tab as HeadlessTab } from "@headlessui/react";

import { Header } from "@widgets/header";

import { PageLayout } from "@shared/ui/layouts";
import { Link } from "@shared/ui/links";
import { Tab, TabGroup, TabList } from "@shared/ui/tabs";

import { useBalancesPageStore } from "../model/store";

import { AccountsTabPanel } from "./accounts-tab-panel";
import { CurrenciesTabPanel } from "./currencies-tab-panel";

export const BalancesPage = () => {
  const { tab, onChangeTab } = useBalancesPageStore();
  return (
    <PageLayout className="pb-14">
      <Header title="Balances" />
      <Link
        to="/transfers/create"
        className="rounded bg-lavender text-crust font-bold text-center p-3"
      >
        Перевод / обмен валют
      </Link>
      <Link
        to="/debts"
        className="rounded bg-surface0 text-text font-bold text-center p-3"
      >
        Долги
      </Link>
      <TabGroup selectedIndex={tab} onChange={onChangeTab}>
        <TabList label="Group By">
          <Tab>Accounts</Tab>
          <Tab>Currencies</Tab>
        </TabList>
        <HeadlessTab.Panels>
          <AccountsTabPanel />
          <CurrenciesTabPanel />
        </HeadlessTab.Panels>
      </TabGroup>
    </PageLayout>
  );
};
