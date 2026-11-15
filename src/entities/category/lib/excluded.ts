interface CategoryForExclusion {
  id: string;
  parentId: string | null;
  excludedFromStatistics?: boolean;
}

// The topmost category on the path from categoryId to its root that is marked
// excludedFromStatistics, or null when the whole path is included. The topmost
// one wins so everything under a hidden category is grouped under it.
export const getTopExcludedCategory = <T extends CategoryForExclusion>(
  categories: Record<string, T>,
  categoryId: string,
): T | null => {
  let excluded: T | null = null;
  let current: T | undefined = categories[categoryId];
  const visited = new Set<string>();
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    if (current.excludedFromStatistics) {
      excluded = current;
    }
    current =
      current.parentId === null ? undefined : categories[current.parentId];
  }
  return excluded;
};
