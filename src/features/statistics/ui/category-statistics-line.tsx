import { useState } from "react";
import { twMerge } from "tailwind-merge";

import { CategoryType } from "@entities/category";
import {
  Currency,
  createCurrencyAmountString,
  formatAmountPrecision,
} from "@entities/currency";

import { DownChevronIcon } from "@shared/ui/icons";
import { Link } from "@shared/ui/links";

import { ProgressBar } from "./progress-bar";

export interface CategoryStatisticsBreakdownItem {
  // null marks spending on the category itself ("Без подкатегории")
  id: string | null;
  title: string;
  amount: string;
}

interface CategoryStatisticsLineProps {
  category: {
    id: string;
    title: string;
    amount: string;
    percentage: string;
    breakdown?: CategoryStatisticsBreakdownItem[];
  };
  categoryType: CategoryType;
  currency: Currency;
}

const categoryTypeToClassName: Record<CategoryType, string> = {
  expense: "text-red",
  income: "text-green",
};

const categoryTypeToAmountPrefix: Record<CategoryType, string> = {
  expense: "-",
  income: "+",
};

export function CategoryStatisticsLine({
  category: { id, title, amount, percentage, breakdown },
  categoryType,
  currency,
}: CategoryStatisticsLineProps) {
  const [expanded, setExpanded] = useState(false);

  const formatAmount = (value: string) =>
    `${categoryTypeToAmountPrefix[categoryType]}${createCurrencyAmountString({
      currency,
      amount: formatAmountPrecision(value, currency.precision),
    })}`;

  const formattedPercentage =
    percentage.length < 5 ? `0${percentage}%` : `${percentage}%`;
  const amountClassName = categoryTypeToClassName[categoryType];

  const line = (
    <>
      <div className="flex justify-between items-center gap-4 text-sm font-bold">
        <span className="flex items-center gap-1.5 text-subtext0">
          {title}
          {breakdown && breakdown.length > 0 && (
            <DownChevronIcon
              size="xs"
              className={twMerge(
                "text-overlay0 transition-transform",
                expanded && "rotate-180",
              )}
            />
          )}
        </span>
        <span className={amountClassName}>{formatAmount(amount)}</span>
      </div>
      <div className="flex items-center gap-4">
        <ProgressBar progress={percentage} />
        <span className="text-xs text-subtext0 font-medium">
          {formattedPercentage}
        </span>
      </div>
    </>
  );

  if (!breakdown || breakdown.length === 0) {
    return (
      <Link
        to={`/${categoryType}-categories/${id}`}
        className="flex flex-col gap-2.5"
      >
        {line}
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        className="flex flex-col gap-2.5 text-left"
        onClick={() => setExpanded((value) => !value)}
      >
        {line}
      </button>
      {expanded && (
        <div className="flex flex-col gap-2 ps-3 border-s border-surface1">
          {breakdown.map((item) => {
            const row = (
              <>
                <span className="text-subtext0">{item.title}</span>
                <span className={twMerge("font-bold", amountClassName)}>
                  {formatAmount(item.amount)}
                </span>
              </>
            );
            return item.id !== null ? (
              <Link
                key={item.id}
                to={`/${categoryType}-categories/${item.id}`}
                className="flex justify-between items-center gap-4 text-sm"
              >
                {row}
              </Link>
            ) : (
              <div
                key="__direct"
                className="flex justify-between items-center gap-4 text-sm"
              >
                {row}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
