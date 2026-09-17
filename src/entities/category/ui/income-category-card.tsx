import { twMerge } from "tailwind-merge";

import { Link } from "@shared/ui/links";

import { IncomeCategoryID } from "../model/models";

import { CategoryCard } from "./category-card";

export interface IncomeCategoryCardCategory {
  id: IncomeCategoryID;
  title: string;
  amounts?: string[];
}

interface IncomeCategoryCardProps {
  category: IncomeCategoryCardCategory;
  className?: string;
}

export const IncomeCategoryCard = ({
  category,
  className,
}: IncomeCategoryCardProps) => {
  return (
    <Link to={`/income-categories/${category.id}`}>
      <CategoryCard
        className={twMerge(
          "flex items-center justify-between gap-3",
          className,
        )}
      >
        <span>{category.title}</span>
        {category.amounts && category.amounts.length > 0 && (
          <span className="flex flex-col items-end gap-0.5 text-green">
            {category.amounts.map((amount) => (
              <span key={amount}>{amount}</span>
            ))}
          </span>
        )}
      </CategoryCard>
    </Link>
  );
};
