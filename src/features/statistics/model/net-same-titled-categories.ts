import { Decimal } from "decimal.js";

import { CategoriesStatistics, CurrenciesStatistics } from "./statistics";

interface CategoryTitleMap {
  [id: string]: { title: string };
}

interface WorkingCategory {
  categoryId: string;
  title: string;
  amount: Decimal;
}

function toWorkingCategories(
  section: CategoriesStatistics,
  titles: CategoryTitleMap,
): WorkingCategory[] {
  return section.categories.map((category) => ({
    categoryId: category.categoryId,
    // Trim surrounding whitespace so accidental trailing spaces (e.g.
    // "Продать доллары" vs "Продать доллары ") don't break the match.
    title: titles[category.categoryId].title.trim(),
    amount: new Decimal(category.amount),
  }));
}

function rebuildSection(categories: WorkingCategory[]): CategoriesStatistics {
  const totalAmount = categories.reduce(
    (total, { amount }) => total.plus(amount),
    new Decimal("0"),
  );

  return {
    totalAmount: totalAmount.toString(),
    categories: categories
      .slice()
      .sort((a, b) => b.amount.minus(a.amount).toNumber())
      .map(({ categoryId, amount }) => ({
        categoryId,
        amount: amount.toString(),
        percentage: totalAmount.isZero()
          ? "0.00"
          : amount.div(totalAmount).mul(100).toFixed(2),
      })),
  };
}

// Sums amounts of categories that share an exact title, keeping the first
// occurrence as the representative (its id/title are used for display).
function sumByTitle(
  categories: WorkingCategory[],
): Map<string, { categoryId: string; amount: Decimal }> {
  const byTitle = new Map<string, { categoryId: string; amount: Decimal }>();
  for (const { categoryId, title, amount } of categories) {
    const entry = byTitle.get(title);
    if (entry) {
      entry.amount = entry.amount.plus(amount);
    } else {
      byTitle.set(title, { categoryId, amount });
    }
  }
  return byTitle;
}

/**
 * Nets expense and income root categories that share an exact title against
 * each other: the side with the larger total keeps the difference, the smaller
 * side drops the category, and equal amounts cancel out completely. Only the
 * per-category breakdown is affected — the overall income/expense totals are
 * left untouched.
 */
export function netSameTitledCategories(
  statistics: CurrenciesStatistics,
  expenseCategories: CategoryTitleMap,
  incomeCategories: CategoryTitleMap,
): CurrenciesStatistics {
  const result: CurrenciesStatistics = {};

  for (const [currencyId, currencyStatistics] of Object.entries(statistics)) {
    const expense = toWorkingCategories(
      currencyStatistics.expenseRootCategories,
      expenseCategories,
    );
    const income = toWorkingCategories(
      currencyStatistics.incomeRootCategories,
      incomeCategories,
    );

    const expenseByTitle = sumByTitle(expense);
    const incomeByTitle = sumByTitle(income);

    const nettedTitles = new Set<string>();
    const newExpense: WorkingCategory[] = [];
    const newIncome: WorkingCategory[] = [];

    for (const [title, expenseEntry] of expenseByTitle) {
      const incomeEntry = incomeByTitle.get(title);
      if (!incomeEntry) {
        continue;
      }

      nettedTitles.add(title);

      const comparison = expenseEntry.amount.comparedTo(incomeEntry.amount);
      if (comparison > 0) {
        newExpense.push({
          categoryId: expenseEntry.categoryId,
          title,
          amount: expenseEntry.amount.minus(incomeEntry.amount),
        });
      } else if (comparison < 0) {
        newIncome.push({
          categoryId: incomeEntry.categoryId,
          title,
          amount: incomeEntry.amount.minus(expenseEntry.amount),
        });
      }
      // Equal amounts cancel out and appear on neither side.
    }

    // Keep every category whose title was not netted, preserving the original
    // per-category split.
    for (const category of expense) {
      if (!nettedTitles.has(category.title)) {
        newExpense.push(category);
      }
    }
    for (const category of income) {
      if (!nettedTitles.has(category.title)) {
        newIncome.push(category);
      }
    }

    result[currencyId] = {
      ...currencyStatistics,
      expenseRootCategories: rebuildSection(newExpense),
      incomeRootCategories: rebuildSection(newIncome),
    };
  }

  return result;
}
