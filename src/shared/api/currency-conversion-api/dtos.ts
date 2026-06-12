export interface CachedRatesDTO {
  // ISO date (yyyy-MM-dd) the cached rates were fetched for.
  date: string;
  // ISO currency code -> amount of BYN per 1 unit of that currency.
  bynPerUnit: Record<string, string>;
}

export interface CurrencyConversionDTO {
  // App currency id -> ISO 4217 code (e.g. "USD", "BYN", "RUB").
  currencyCodes: Record<string, string>;
  // ISO code of the currency everything is converted to for display.
  targetCode: string;
  // Last successfully fetched NBRB rates, kept for offline use.
  rates: CachedRatesDTO | null;
}
