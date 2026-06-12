// Client for the National Bank of the Republic of Belarus exchange-rates API.
// Docs: https://www.nbrb.by/apihelp/exrates

const BASE_URL = "https://api.nbrb.by";

export interface NbrbRate {
  Cur_ID: number;
  Cur_Abbreviation: string;
  Cur_Scale: number;
  Cur_Name: string;
  Cur_OfficialRate: number;
}

/**
 * Fetches the official daily exchange rates of the Belarusian ruble against
 * foreign currencies for today. Each rate is given as `Cur_OfficialRate` BYN
 * per `Cur_Scale` units of the foreign currency.
 */
export async function fetchDailyRates(): Promise<NbrbRate[]> {
  const response = await fetch(`${BASE_URL}/exrates/rates?periodicity=0`);
  if (!response.ok) {
    throw new Error(`NBRB API responded with status ${response.status}`);
  }
  return (await response.json()) as NbrbRate[];
}
