import { StatisticsIcon } from "@shared/ui/icons";
import { Toggle } from "@shared/ui/toggles";

import { useSettingsStore } from "../model/store";

import { SettingCard } from "./setting-card";
import { SettingCardGroup } from "./setting-card-group";

export const StatisticsSettingCardGroup = () => {
  const { statistics, setStatisticsSettings } = useSettingsStore((state) => ({
    statistics: state.statistics,
    setStatisticsSettings: state.setStatisticsSettings,
  }));
  const includeHidden = statistics?.includeHiddenCategories ?? false;
  const onClick = () => {
    setStatisticsSettings({ includeHiddenCategories: !includeHidden });
  };

  return (
    <SettingCardGroup title="Statistics">
      <SettingCard
        title="Учитывать скрытые категории"
        description="Серые категории войдут в итоги статистики"
        onClick={onClick}
        icon={<StatisticsIcon size="md" />}
        rightAction={<Toggle checked={includeHidden} />}
      />
    </SettingCardGroup>
  );
};
