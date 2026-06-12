import { useCurrencyConversionStore } from "@entities/currency-conversion";
import { SettingCard } from "@entities/settings";

import { Button } from "@shared/ui/buttons";
import { RightLeftArrowIcon } from "@shared/ui/icons";

export const CurrencyRatesSettingCard = () => {
  const { rates, isRefreshingRates, refreshError, refreshRates } =
    useCurrencyConversionStore();

  const description = refreshError
    ? `Couldn't update: ${refreshError}`
    : rates
    ? `NBRB rates as of ${rates.date}`
    : "Not loaded yet";

  return (
    <SettingCard
      title="Exchange rates (NBRB)"
      description={description}
      icon={<RightLeftArrowIcon size="md" />}
      rightAction={
        <Button
          size="sm"
          variant="outlined"
          onClick={() => refreshRates()}
          disabled={isRefreshingRates}
        >
          {isRefreshingRates ? "Updating..." : "Update"}
        </Button>
      }
    />
  );
};
