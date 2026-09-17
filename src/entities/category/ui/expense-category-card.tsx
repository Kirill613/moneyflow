import { twMerge } from "tailwind-merge";

import { Link } from "@shared/ui/links";

import { ExpenseCategoryID } from "../model/models";

import { CategoryCard } from "./category-card";

export interface ExpenseCategoryCardCategory {
  id: ExpenseCategoryID;
  title: string;
  amounts?: string[];
}

interface ExpenseCategoryCardProps {
  category: ExpenseCategoryCardCategory;
  className?: string;
}

export const ExpenseCategoryCard = ({
  category,
  className,
}: ExpenseCategoryCardProps) => {
  return (
    <Link to={`/expense-categories/${category.id}`}>
      <CategoryCard
        className={twMerge(
          "flex items-center justify-between gap-3",
          className,
        )}
      >
        <span>{category.title}</span>
        {category.amounts && category.amounts.length > 0 && (
          <span className="flex flex-col items-end gap-0.5 text-red">
            {category.amounts.map((amount) => (
              <span key={amount}>{amount}</span>
            ))}
          </span>
        )}
      </CategoryCard>
    </Link>
  );
};
