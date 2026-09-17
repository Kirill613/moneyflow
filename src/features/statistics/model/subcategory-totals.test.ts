import { describe, expect, it } from "vitest";

import {
  getCurrencyCategoryBreakdown,
  getSubcategoryTotals,
} from "./subcategory-totals";

const categories = {
  car: { id: "car", parentId: null },
  kx1: { id: "kx1", parentId: "car" },
  x70: { id: "x70", parentId: "car" },
  "x70-tires": { id: "x70-tires", parentId: "x70" },
  home: { id: "home", parentId: null },
};

const accounts = {
  card: { currencyId: "byn" },
  dollars: { currencyId: "usd" },
};

const transaction = (
  categoryId: string,
  amount: string,
  accountId = "card",
) => ({
  categoryId,
  accountId,
  amount,
});

describe("getSubcategoryTotals", () => {
  it("credits each direct child with its subtree and the parent with direct spend", () => {
    const totals = getSubcategoryTotals(
      "car",
      categories,
      [
        transaction("kx1", "100"),
        transaction("kx1", "50"),
        transaction("x70", "10"),
        transaction("x70-tires", "5"),
        transaction("car", "7"),
        transaction("home", "999"),
      ],
      accounts,
    );
    expect(totals.direct).toEqual({ byn: "7" });
    expect(totals.children).toEqual({
      kx1: { byn: "150" },
      x70: { byn: "15" },
    });
  });

  it("keeps currencies separate", () => {
    const totals = getSubcategoryTotals(
      "car",
      categories,
      [transaction("kx1", "10"), transaction("kx1", "3", "dollars")],
      accounts,
    );
    expect(totals.children.kx1).toEqual({ byn: "10", usd: "3" });
  });

  it("ignores transactions with unknown accounts and outside the subtree", () => {
    const totals = getSubcategoryTotals(
      "car",
      categories,
      [transaction("kx1", "10", "ghost"), transaction("home", "10")],
      accounts,
    );
    expect(totals.direct).toEqual({});
    expect(totals.children).toEqual({});
  });

  it("sums decimals precisely", () => {
    const totals = getSubcategoryTotals(
      "car",
      categories,
      [transaction("kx1", "0.1"), transaction("kx1", "0.2")],
      accounts,
    );
    expect(totals.children.kx1).toEqual({ byn: "0.3" });
  });

  it("survives a parent cycle without hanging", () => {
    const looped = {
      a: { id: "a", parentId: "b" },
      b: { id: "b", parentId: "a" },
    };
    const totals = getSubcategoryTotals(
      "car",
      looped,
      [transaction("a", "5")],
      accounts,
    );
    expect(totals.direct).toEqual({});
    expect(totals.children).toEqual({});
  });
});

describe("getCurrencyCategoryBreakdown", () => {
  const titled = {
    car: { id: "car", parentId: null, title: "Машина" },
    kx1: { id: "kx1", parentId: "car", title: "kx1" },
    x70: { id: "x70", parentId: "car", title: "X70" },
    home: { id: "home", parentId: null, title: "Дом" },
  };

  it("returns children sorted by amount with a trailing direct row", () => {
    const breakdown = getCurrencyCategoryBreakdown(
      "car",
      titled,
      [
        transaction("kx1", "50"),
        transaction("x70", "470"),
        transaction("car", "200"),
      ],
      accounts,
      "byn",
      "Без подкатегории",
    );
    expect(breakdown).toEqual([
      { id: "x70", title: "X70", amount: "470" },
      { id: "kx1", title: "kx1", amount: "50" },
      { id: null, title: "Без подкатегории", amount: "200" },
    ]);
  });

  it("returns [] when there is nothing to break down", () => {
    expect(
      getCurrencyCategoryBreakdown(
        "home",
        titled,
        [transaction("home", "10")],
        accounts,
        "byn",
        "Без подкатегории",
      ),
    ).toEqual([]);
  });

  it("filters to the requested currency", () => {
    const breakdown = getCurrencyCategoryBreakdown(
      "car",
      titled,
      [transaction("kx1", "10"), transaction("x70", "3", "dollars")],
      accounts,
      "usd",
      "Без подкатегории",
    );
    expect(breakdown).toEqual([{ id: "x70", title: "X70", amount: "3" }]);
  });
});
