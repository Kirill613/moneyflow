import {
  Currency,
  createCurrencyAmountString,
  formatAmountPrecision,
} from "@entities/currency";

import { Link } from "@shared/ui/links";

export interface ExcludedStatisticsCategory {
  id: string;
  title: string;
  amount: string;
}

interface ExcludedStatisticsSectionProps {
  expenseCategories: ExcludedStatisticsCategory[];
  incomeCategories: ExcludedStatisticsCategory[];
  currency: Currency;
}

export function ExcludedStatisticsSection({
  expenseCategories,
  incomeCategories,
  currency,
}: ExcludedStatisticsSectionProps) {
  if (expenseCategories.length === 0 && incomeCategories.length === 0) {
    return null;
  }

  const formatAmount = (amount: string, prefix: string) =>
    `${prefix}${createCurrencyAmountString({
      currency,
      amount: formatAmountPrecision(amount, currency.precision),
    })}`;

  const renderRow = (
    category: ExcludedStatisticsCategory,
    categoryType: "expense" | "income",
  ) => (
    <Link
      key={`${categoryType}-${category.id}`}
      to={`/${categoryType}-categories/${category.id}`}
      className="flex justify-between items-center gap-4 text-sm font-bold"
    >
      <span className="text-subtext0">{category.title}</span>
      <span className="text-overlay1">
        {formatAmount(category.amount, categoryType === "expense" ? "-" : "+")}
      </span>
    </Link>
  );

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h2 text-text">Вне статистики</h2>
      <p className="text-xs text-subtext0 -mt-2">
        Эти категории не входят в суммы и проценты выше.
      </p>
      <div className="flex flex-col gap-3">
        {expenseCategories.map((category) => renderRow(category, "expense"))}
        {incomeCategories.map((category) => renderRow(category, "income"))}
      </div>
    </div>
  );
}
