import { twMerge } from "tailwind-merge";

import { CategoryType } from "@entities/category";
import {
  Currency,
  createCurrencyAmountString,
  formatAmountPrecision,
} from "@entities/currency";

import {
  CategoryStatisticsBreakdownItem,
  CategoryStatisticsLine,
} from "./category-statistics-line";

interface CategoriesStatisticsSectionProps {
  categories: {
    id: string;
    title: string;
    amount: string;
    percentage: string;
    breakdown?: CategoryStatisticsBreakdownItem[];
  }[];
  // categories marked "Не учитывать в статистике": rendered greyed-out after
  // the counted ones and not part of totalAmount
  excludedCategories?: {
    id: string;
    title: string;
    amount: string;
    breakdown?: CategoryStatisticsBreakdownItem[];
  }[];
  categoryType: CategoryType;
  totalAmount: string;
  currency: Currency;
}

const categoryTypeToTitle: Record<CategoryType, string> = {
  expense: "Expenses",
  income: "Incomes",
};

const categoryTypeToClassName: Record<CategoryType, string> = {
  expense: "text-red",
  income: "text-green",
};

const categoryTypeToAmountPrefix: Record<CategoryType, string> = {
  expense: "-",
  income: "+",
};

export function CategoriesStatisticsSection({
  categories,
  excludedCategories = [],
  categoryType,
  totalAmount,
  currency,
}: CategoriesStatisticsSectionProps) {
  const formattedTotalAmount = `${
    categoryTypeToAmountPrefix[categoryType]
  }${createCurrencyAmountString({
    currency,
    amount: formatAmountPrecision(totalAmount, currency.precision),
  })}`;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-h2 text-text">{categoryTypeToTitle[categoryType]}</h2>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4">
          {categories.map((category) => (
            <CategoryStatisticsLine
              key={category.id}
              category={category}
              categoryType={categoryType}
              currency={currency}
            />
          ))}
          {excludedCategories.map((category) => (
            <CategoryStatisticsLine
              key={category.id}
              category={{ ...category, percentage: "0.00", excluded: true }}
              categoryType={categoryType}
              currency={currency}
            />
          ))}
        </div>
        <div className="flex justify-between items-center gap-4 font-bold">
          <span className="text-subtext0 text-sm">Total:</span>
          <span
            className={twMerge(
              "text-base",
              categoryTypeToClassName[categoryType],
            )}
          >
            {formattedTotalAmount}
          </span>
        </div>
      </div>
    </div>
  );
}
