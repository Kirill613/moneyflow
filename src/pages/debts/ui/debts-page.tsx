import { Decimal } from "decimal.js";
import { DateTime } from "luxon";
import { useState } from "react";

import { Header } from "@widgets/header";

import {
  useDebtPersonCandidates,
  useDebtTransactions,
  useFillDebtPersons,
} from "@features/debts";

import {
  createCurrencyAmountString,
  useCurrenciesStore,
} from "@entities/currency";
import { DebtTransaction, PersonDebt, computeDebts } from "@entities/debt";

import { PageLayout } from "@shared/ui/layouts";
import { Link } from "@shared/ui/links";

export const DebtsPage = () => {
  const {
    currencies: { currencies },
  } = useCurrenciesStore();
  const transactions = useDebtTransactions();
  const candidates = useDebtPersonCandidates();
  const fillDebtPersons = useFillDebtPersons();
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [filling, setFilling] = useState(false);

  const debts = computeDebts(transactions);

  const onFillDebtPersons = async () => {
    setFilling(true);
    try {
      await fillDebtPersons(candidates);
    } finally {
      setFilling(false);
    }
  };

  const formatAmount = (currencyId: string, amount: string) => {
    const currency = currencies[currencyId];
    if (!currency) {
      return amount;
    }
    return createCurrencyAmountString({ currency, amount });
  };

  const totals = debts.reduce<{
    receivable: Record<string, Decimal>;
    payable: Record<string, Decimal>;
  }>(
    (result, debt) => {
      for (const balance of debt.balances) {
        const net = new Decimal(balance.net);
        if (net.gt(0)) {
          result.receivable[balance.currencyId] = (
            result.receivable[balance.currencyId] ?? new Decimal(0)
          ).plus(net);
        }
        if (net.lt(0)) {
          result.payable[balance.currencyId] = (
            result.payable[balance.currencyId] ?? new Decimal(0)
          ).plus(net.neg());
        }
      }
      return result;
    },
    { receivable: {}, payable: {} },
  );

  const formatTotals = (amounts: Record<string, Decimal>) =>
    Object.entries(amounts)
      .map(([currencyId, amount]) =>
        formatAmount(currencyId, amount.toString()),
      )
      .join(", ");

  const renderHistoryEntry = (entry: DebtTransaction) => (
    <Link
      key={`${entry.kind}-${entry.id}`}
      to={`/${entry.kind === "expense" ? "expenses" : "incomes"}/${entry.id}`}
      className="flex items-center justify-between gap-2 py-1"
    >
      <span className="text-sm text-subtext0 min-w-fit">
        {DateTime.fromMillis(entry.datetime).toFormat("dd.MM.yy")}
      </span>
      <span className="text-sm text-text flex-1 truncate">{entry.title}</span>
      <span
        className={`text-sm font-bold ${
          entry.kind === "expense" ? "text-green" : "text-red"
        }`}
      >
        {entry.kind === "expense" ? "+" : "-"}
        {formatAmount(entry.currencyId, entry.amount)}
      </span>
    </Link>
  );

  const renderPerson = (debt: PersonDebt) => {
    const expanded = expandedPerson === debt.person;
    return (
      <div key={debt.person} className="rounded bg-surface0 p-4">
        <button
          type="button"
          className="w-full flex flex-col gap-1 text-left"
          onClick={() => setExpandedPerson(expanded ? null : debt.person)}
        >
          <span className="flex items-center justify-between gap-2">
            <span className="font-bold text-text">{debt.person}</span>
            <span className="text-xs text-subtext0">
              {expanded ? "скрыть" : "история"}
            </span>
          </span>
          {debt.balances.map((balance) => {
            const net = new Decimal(balance.net);
            if (net.isZero()) {
              return (
                <span
                  key={balance.currencyId}
                  className="text-sm text-subtext0"
                >
                  рассчитались ({formatAmount(balance.currencyId, "0")})
                </span>
              );
            }
            return (
              <span
                key={balance.currencyId}
                className={`text-sm font-bold ${
                  net.gt(0) ? "text-green" : "text-red"
                }`}
              >
                {net.gt(0)
                  ? `должен мне ${formatAmount(
                      balance.currencyId,
                      net.toString(),
                    )}`
                  : `я должен ${formatAmount(
                      balance.currencyId,
                      net.neg().toString(),
                    )}`}
              </span>
            );
          })}
        </button>
        {expanded && (
          <div className="mt-2 border-t border-surface1 pt-2 flex flex-col">
            {debt.history.map(renderHistoryEntry)}
          </div>
        )}
      </div>
    );
  };

  return (
    <PageLayout className="pb-32 text-text">
      <Header title="Долги" backButton />
      <p className="text-sm text-subtext0">
        Считается автоматически: выберите в расходе или доходе категорию со
        словом «долг» и укажите человека. Расход — вы дали деньги, доход — вам
        вернули или вы взяли.
      </p>
      {candidates.length > 0 && (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="rounded bg-lavender text-crust font-bold text-center p-3 disabled:opacity-50"
            disabled={filling}
            onClick={onFillDebtPersons}
          >
            {filling
              ? "Проставляю имена…"
              : `Проставить имена из старых записей (${candidates.length})`}
          </button>
          <p className="text-xs text-subtext0">
            Найдёт старые транзакции долговых категорий, где имя читается из
            названия («Дать долг Рома» → Рома), проставит человека и учтёт их в
            балансе. Записи без имени в названии не изменятся.
          </p>
        </div>
      )}
      {Object.keys(totals.receivable).length > 0 && (
        <div className="rounded bg-surface0 p-4">
          <p className="text-sm text-subtext0">Мне должны</p>
          <p className="font-bold text-green">
            {formatTotals(totals.receivable)}
          </p>
        </div>
      )}
      {Object.keys(totals.payable).length > 0 && (
        <div className="rounded bg-surface0 p-4">
          <p className="text-sm text-subtext0">Я должен</p>
          <p className="font-bold text-red">{formatTotals(totals.payable)}</p>
        </div>
      )}
      {debts.length === 0 ? (
        <p className="text-sm text-subtext0">
          Пока пусто. Создайте расход или доход с категорией, содержащей «долг»,
          и укажите имя человека — долг появится здесь сам.
        </p>
      ) : (
        <div className="flex flex-col gap-3">{debts.map(renderPerson)}</div>
      )}
    </PageLayout>
  );
};
