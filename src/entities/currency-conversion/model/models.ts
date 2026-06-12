// ISO 4217 codes the user can assign to their currencies. These are codes the
// NBRB publishes an official rate for (plus BYN itself).
export const SUPPORTED_CURRENCY_CODES = [
  "BYN",
  "USD",
  "EUR",
  "RUB",
  "UAH",
  "PLN",
  "GBP",
  "CNY",
  "KZT",
  "TRY",
  "CHF",
  "JPY",
  "CZK",
  "SEK",
  "NOK",
  "DKK",
  "CAD",
  "AUD",
  "GEL",
  "AMD",
  "AZN",
  "MDL",
  "BGN",
  "RON",
  "RSD",
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

// Sentinel value meaning a currency has not been assigned an ISO code yet.
export const UNSET_CURRENCY_CODE = "";

export interface TargetCurrencyMeta {
  code: CurrencyCode;
  label: string;
  symbol: string;
  symbolPosition: "left" | "right";
  hasSpaceBetweenAmountAndSymbol: boolean;
  precision: number;
}

// Currencies the combined statistics can be displayed in.
export const TARGET_CURRENCIES: TargetCurrencyMeta[] = [
  {
    code: "BYN",
    label: "BYN",
    symbol: "Br",
    symbolPosition: "right",
    hasSpaceBetweenAmountAndSymbol: true,
    precision: 2,
  },
  {
    code: "USD",
    label: "USD",
    symbol: "$",
    symbolPosition: "left",
    hasSpaceBetweenAmountAndSymbol: false,
    precision: 2,
  },
  {
    code: "EUR",
    label: "EUR",
    symbol: "€",
    symbolPosition: "left",
    hasSpaceBetweenAmountAndSymbol: false,
    precision: 2,
  },
  {
    code: "RUB",
    label: "RUB",
    symbol: "₽",
    symbolPosition: "right",
    hasSpaceBetweenAmountAndSymbol: true,
    precision: 2,
  },
];
