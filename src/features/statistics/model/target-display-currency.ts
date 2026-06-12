import { DateTime } from "luxon";

import { Currency, CurrencySymbolPosition } from "@entities/currency";
import { TARGET_CURRENCIES } from "@entities/currency-conversion";

import { ColorPickerColor } from "@shared/ui/color-pickers";

/**
 * Builds a `Currency`-shaped object so the target ISO currency can be rendered
 * by the existing statistics components, which expect a full `Currency`.
 */
export function targetDisplayCurrency(code: string): Currency {
  const meta =
    TARGET_CURRENCIES.find((target) => target.code === code) ??
    TARGET_CURRENCIES[0];
  return {
    id: meta.code,
    symbol: meta.symbol,
    symbolPosition:
      meta.symbolPosition === "left"
        ? CurrencySymbolPosition.left
        : CurrencySymbolPosition.right,
    hasSpaceBetweenAmountAndSymbol: meta.hasSpaceBetweenAmountAndSymbol,
    precision: meta.precision,
    color: ColorPickerColor.blue,
    createdAt: DateTime.now(),
  };
}
