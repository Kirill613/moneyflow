import { SettingCard } from "@entities/settings";

import { CoinsIcon, RightChevronIcon } from "@shared/ui/icons";
import { Link } from "@shared/ui/links";

export const CurrencyCodesSettingCard = () => {
  return (
    <Link to="/currency-codes">
      <SettingCard
        title="Currency codes (NBRB)"
        description="Map currencies to ISO codes for the total statistics"
        icon={<CoinsIcon size="md" />}
        rightAction={<RightChevronIcon size="sm" className="text-overlay1" />}
      />
    </Link>
  );
};
