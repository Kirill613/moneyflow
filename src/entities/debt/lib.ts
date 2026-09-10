import { Decimal } from "decimal.js";

export const isDebtCategoryTitle = (title: string) => /долг/i.test(title);

const NON_PERSON_WORDS = new Set([
  "долг",
  "долги",
  "долга",
  "дать",
  "дал",
  "дала",
  "дали",
  "взять",
  "взял",
  "взяла",
  "взяли",
  "вернул",
  "вернула",
  "вернули",
  "вернуть",
  "возврат",
  "отдал",
  "отдала",
  "отдали",
  "отдать",
  "занял",
  "заняла",
  "мне",
  "я",
  "в",
  "за",
  "и",
]);

export const normalizeDebtPerson = (person: string) => {
  const trimmed = person.trim().replace(/\s+/g, " ");
  return trimmed === "" ? "" : trimmed[0].toUpperCase() + trimmed.slice(1);
};

export const extractDebtPersonsFromTitles = (titles: string[]) => {
  const persons = new Map<string, string>();
  for (const title of titles) {
    for (const word of title.trim().split(/\s+/)) {
      if (!/^[а-яёa-z-]{2,}$/i.test(word)) continue;
      if (NON_PERSON_WORDS.has(word.toLowerCase())) continue;
      const person = normalizeDebtPerson(word);
      if (!persons.has(person.toLowerCase())) {
        persons.set(person.toLowerCase(), person);
      }
    }
  }
  return [...persons.values()];
};

export interface DebtTransaction {
  id: string;
  kind: "expense" | "income";
  title: string;
  amount: string;
  debtPerson: string;
  datetime: number;
  currencyId: string;
}

export interface PersonDebtBalance {
  currencyId: string;
  net: string;
}

export interface PersonDebt {
  person: string;
  lastDatetime: number;
  balances: PersonDebtBalance[];
  history: DebtTransaction[];
}

export const computeDebts = (transactions: DebtTransaction[]): PersonDebt[] => {
  const byPerson = new Map<
    string,
    {
      person: string;
      lastDatetime: number;
      nets: Map<string, Decimal>;
      history: DebtTransaction[];
    }
  >();

  for (const transaction of transactions) {
    const person = normalizeDebtPerson(transaction.debtPerson);
    if (person === "") continue;
    const key = person.toLowerCase();
    let entry = byPerson.get(key);
    if (!entry) {
      entry = { person, lastDatetime: 0, nets: new Map(), history: [] };
      byPerson.set(key, entry);
    }
    const net = entry.nets.get(transaction.currencyId) ?? new Decimal(0);
    entry.nets.set(
      transaction.currencyId,
      transaction.kind === "expense"
        ? net.plus(transaction.amount)
        : net.minus(transaction.amount),
    );
    entry.history.push(transaction);
    entry.lastDatetime = Math.max(entry.lastDatetime, transaction.datetime);
  }

  return [...byPerson.values()]
    .map((entry) => ({
      person: entry.person,
      lastDatetime: entry.lastDatetime,
      balances: [...entry.nets.entries()].map(([currencyId, net]) => ({
        currencyId,
        net: net.toString(),
      })),
      history: entry.history.sort((a, b) => b.datetime - a.datetime),
    }))
    .sort((a, b) => b.lastDatetime - a.lastDatetime);
};
