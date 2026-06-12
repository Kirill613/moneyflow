import { CurrencyConversionAPI } from "./currency-conversion-api.interface";
import { PreferencesCurrencyConversionAPI } from "./preferences-currency-conversion-api";

export { PreferencesCurrencyConversionAPI } from "./preferences-currency-conversion-api";
export { type CurrencyConversionDTO, type CachedRatesDTO } from "./dtos";

export const currencyConversionApi: CurrencyConversionAPI =
  new PreferencesCurrencyConversionAPI();
