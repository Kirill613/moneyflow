import { Header } from "@widgets/header";

import { AppearanceSettingCardGroup } from "@features/appearance";
import { BackupSettingCardGroup } from "@features/backup";
import {
  CurrencyCodesSettingCard,
  CurrencyRatesSettingCard,
} from "@features/currency-codes";
import { NotificationsSettingCardGroup } from "@features/notifications";

import {
  AboutUsSettingCardGroup,
  CategoriesSettingCard,
  SettingCardGroup,
  StatisticsSettingCardGroup,
} from "@entities/settings";

import { PageLayout } from "@shared/ui/layouts";

export const SettingsPage = () => {
  return (
    <PageLayout hasHorizontalPaddings={false} className="gap-6">
      <Header title="Settings" className="px-5" />
      <main className="flex flex-col gap-6">
        <SettingCardGroup title="Management">
          <CategoriesSettingCard />
          <CurrencyCodesSettingCard />
          <CurrencyRatesSettingCard />
        </SettingCardGroup>
        <StatisticsSettingCardGroup />
        <BackupSettingCardGroup />
        <NotificationsSettingCardGroup />
        <AppearanceSettingCardGroup />
        <AboutUsSettingCardGroup />
      </main>
    </PageLayout>
  );
};
