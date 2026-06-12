import { CurrencyConversionDTO } from "./dtos";

export interface CurrencyConversionAPI {
  getCurrencyConversion(): Promise<CurrencyConversionDTO>;
  setCurrencyConversion(conversion: CurrencyConversionDTO): Promise<void>;
}
