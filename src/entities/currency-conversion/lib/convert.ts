import { Decimal } from "decimal.js";

import { NbrbRate } from "@shared/api/nbrb-api";

// Maps an ISO currency code to the amount of BYN per 1 unit of that currency.
export type BynPerUnit = Record<string, string>;

/**
 * Converts the raw NBRB rates into a "BYN per 1 unit" map. NBRB publishes
 * `Cur_OfficialRate` BYN for `Cur_Scale` units, so the per-unit rate is
 * `Cur_OfficialRate / Cur_Scale`. BYN itself is added as 1.
 */
export function buildBynPerUnit(rates: NbrbRate[]): BynPerUnit {
  const bynPerUnit: BynPerUnit = { BYN: "1" };
  for (const rate of rates) {
    if (rate.Cur_Scale > 0) {
      bynPerUnit[rate.Cur_Abbreviation] = new Decimal(rate.Cur_OfficialRate)
        .div(rate.Cur_Scale)
        .toString();
    }
  }
  return bynPerUnit;
}

/**
 * Converts `amount` from one ISO currency to another using a "BYN per unit"
 * map. Returns null when a required rate is missing.
 */
export function convertAmount(
  amount: string,
  fromCode: string,
  toCode: string,
  bynPerUnit: BynPerUnit,
): Decimal | null {
  if (fromCode === toCode) {
    return new Decimal(amount);
  }

  const fromRate = bynPerUnit[fromCode];
  const toRate = bynPerUnit[toCode];
  if (fromRate === undefined || toRate === undefined) {
    return null;
  }

  // amount -> BYN -> target currency
  return new Decimal(amount).mul(fromRate).div(toRate);
}
