import { Tab as HeadlessTab } from "@headlessui/react";

import { Header } from "@widgets/header";

import { RightLeftArrowIcon, SackDollarIcon } from "@shared/ui/icons";
import { PageLayout } from "@shared/ui/layouts";
import { Link } from "@shared/ui/links";
import { Tab, TabGroup, TabList } from "@shared/ui/tabs";

import { useBalancesPageStore } from "../model/store";

import { AccountsTabPanel } from "./accounts-tab-panel";
import { CurrenciesTabPanel } from "./currencies-tab-panel";

const actionLinkClassName =
  "flex items-center gap-1 rounded bg-surface0 py-2 px-2 text-xs font-bold text-text transition-colors active:bg-surface1";

export const BalancesPage = () => {
  const { tab, onChangeTab } = useBalancesPageStore();
  return (
    <PageLayout className="pb-14">
      <Header title="Balances" />
      <TabGroup selectedIndex={tab} onChange={onChangeTab}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <Link
              to="/transfers/create"
              className={actionLinkClassName}
              aria-label="Перевод / обмен валют"
            >
              <RightLeftArrowIcon size="xs" />
              Перевод
            </Link>
            <Link to="/debts" className={actionLinkClassName}>
              <SackDollarIcon size="xs" />
              Долги
            </Link>
          </div>
          <TabList>
            <Tab className="px-2.5">Accounts</Tab>
            <Tab className="px-2.5">Currencies</Tab>
          </TabList>
        </div>
        <HeadlessTab.Panels>
          <AccountsTabPanel />
          <CurrenciesTabPanel />
        </HeadlessTab.Panels>
      </TabGroup>
    </PageLayout>
  );
};
