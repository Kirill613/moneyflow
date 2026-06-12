import { Preferences } from "@capacitor/preferences";

import { CurrencyConversionAPI } from "./currency-conversion-api.interface";
import { CurrencyConversionDTO } from "./dtos";

const DEFAULT_TARGET_CODE = "BYN";

export class PreferencesCurrencyConversionAPI implements CurrencyConversionAPI {
  private async getState(): Promise<CurrencyConversionDTO> {
    const { value } = await Preferences.get({ key: "currency-conversion" });
    if (value === null) {
      const state: CurrencyConversionDTO = {
        currencyCodes: {},
        targetCode: DEFAULT_TARGET_CODE,
        rates: null,
      };
      await this.setState(state);
      return state;
    }
    return JSON.parse(value);
  }

  private async setState(state: CurrencyConversionDTO) {
    await Preferences.set({
      key: "currency-conversion",
      value: JSON.stringify(state),
    });
  }

  async getCurrencyConversion() {
    return await this.getState();
  }

  async setCurrencyConversion(conversion: CurrencyConversionDTO) {
    await this.setState(conversion);
  }
}
