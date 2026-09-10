import { Decimal } from "decimal.js";
import { DateTime } from "luxon";
import { FormEvent, useEffect, useState } from "react";
import { v4 as uuid } from "uuid";

import { Header } from "@widgets/header";

import { useCurrenciesStore } from "@entities/currency";
import { Debt, getDebtRemaining, useDebtsStore } from "@entities/debt";

import { Button } from "@shared/ui/buttons";
import { Input } from "@shared/ui/inputs";
import { PageLayout } from "@shared/ui/layouts";
import { Link } from "@shared/ui/links";
import { Modal } from "@shared/ui/modals";

const today = () => DateTime.local().toFormat("yyyy-MM-dd");
const money = (amount: string, debt: Debt) =>
  `${new Decimal(amount).toFixed(debt.currency.precision)} ${
    debt.currency.symbol
  }`;

export const DebtsPage = () => {
  const { debts, loaded, fetchDebts, saveDebt, deleteDebt } = useDebtsStore();
  const {
    currencies: { currencies, order },
  } = useCurrenciesStore();
  const [direction, setDirection] = useState<Debt["direction"]>("receivable");
  const [closed, setClosed] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Debt | null>(null);
  const [repaying, setRepaying] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(today);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDebts().catch(() =>
      setError("Не удалось загрузить долги. Попробуйте открыть вкладку снова."),
    );
  }, [fetchDebts]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err) {
      setError(
        err instanceof Error && !err.message.startsWith("[")
          ? err.message
          : "Не удалось сохранить. Проверьте сумму и повторите.",
      );
    } finally {
      setBusy(false);
    }
  };

  const onSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const currency =
      editing?.currency ?? currencies[String(data.get("currency"))];
    if (!currency) return;
    const debt: Debt = {
      id: editing?.id ?? uuid(),
      person: String(data.get("person")).trim(),
      direction: String(data.get("direction")) as Debt["direction"],
      amount: String(data.get("amount")).replace(",", "."),
      currency: {
        id: currency.id,
        symbol: currency.symbol,
        precision: currency.precision,
      },
      dueDate: String(data.get("dueDate")),
      note: String(data.get("note")),
      createdAt: editing?.createdAt ?? Date.now(),
      payments: editing?.payments ?? [],
    };
    void run(async () => {
      await saveDebt(debt);
      setEditing(null);
      setCreating(false);
      setDirection(debt.direction);
    });
  };

  const visible = debts
    .filter(
      (debt) =>
        debt.direction === direction &&
        new Decimal(getDebtRemaining(debt)).isZero() === closed,
    )
    .sort((a, b) => b.createdAt - a.createdAt);
  const totals = debts
    .filter((debt) => debt.direction === direction)
    .reduce<
      Record<string, { symbol: string; amount: Decimal; precision: number }>
    >((result, debt) => {
      const total = result[debt.currency.id] ?? {
        symbol: debt.currency.symbol,
        amount: new Decimal(0),
        precision: debt.currency.precision,
      };
      total.amount = total.amount.plus(getDebtRemaining(debt));
      result[debt.currency.id] = total;
      return result;
    }, {});

  return (
    <PageLayout className="pb-32 text-text">
      <Header title="Долги" backButton />
      <p className="text-sm text-subtext0">
        Записывайте долги и возвраты. Записи здесь не меняют балансы счетов.
      </p>
      <div
        className="grid grid-cols-2 gap-2"
        role="group"
        aria-label="Направление долга"
      >
        <Button
          size="sm"
          variant={direction === "receivable" ? "solid" : "outlined"}
          onClick={() => setDirection("receivable")}
        >
          Мне должны
        </Button>
        <Button
          size="sm"
          variant={direction === "payable" ? "solid" : "outlined"}
          onClick={() => setDirection("payable")}
        >
          Я должен
        </Button>
      </div>
      <div className="rounded bg-surface0 p-4">
        <p className="text-sm text-subtext0">Осталось вернуть</p>
        {Object.values(totals)
          .filter((total) => !total.amount.isZero())
          .map((total, index) => (
            <p key={index} className="text-lg font-bold">
              {total.amount.toFixed(total.precision)} {total.symbol}
            </p>
          ))}
        {!Object.values(totals).some((total) => !total.amount.isZero()) && (
          <p>Нет непогашенных долгов</p>
        )}
      </div>
      <Button
        disabled={!loaded || busy || creating || !!editing}
        onClick={() => {
          setCreating(true);
          setError("");
        }}
      >
        Добавить долг
      </Button>
      {error && (
        <p role="alert" className="text-red">
          {error}
        </p>
      )}
      {(creating || editing) && (
        <form
          key={editing?.id ?? "new"}
          onSubmit={onSave}
          className="flex flex-col gap-4 rounded border border-overlay0 p-4"
        >
          <h2 className="text-h2">
            {editing ? "Изменить долг" : "Новый долг"}
          </h2>
          <Input
            id="debt-person"
            label="Кто"
            name="person"
            placeholder="Имя человека"
            required
            defaultValue={editing?.person}
          />
          <label className="flex flex-col gap-2 text-sm">
            Направление
            <select
              name="direction"
              defaultValue={editing?.direction ?? direction}
              className="rounded bg-surface0 p-3"
            >
              <option value="receivable">Мне должны</option>
              <option value="payable">Я должен</option>
            </select>
          </label>
          <Input
            id="debt-amount"
            label="Сумма долга"
            name="amount"
            inputMode="decimal"
            required
            pattern="[0-9]+([.,][0-9]+)?"
            defaultValue={editing?.amount}
          />
          {editing ? (
            <p>Валюта: {editing.currency.symbol}</p>
          ) : order.length ? (
            <label className="flex flex-col gap-2 text-sm">
              Валюта
              <select
                name="currency"
                required
                className="rounded bg-surface0 p-3"
              >
                {order.map((id) => (
                  <option key={id} value={id}>
                    {currencies[id].symbol}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <Link to="/currencies/create" className="text-lavender underline">
              Сначала добавьте валюту
            </Link>
          )}
          <Input
            id="debt-due"
            label="Вернуть до (необязательно)"
            name="dueDate"
            type="date"
            defaultValue={editing?.dueDate}
          />
          <Input
            id="debt-note"
            label="Заметка"
            name="note"
            defaultValue={editing?.note}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              size="sm"
              disabled={busy || (!editing && !order.length)}
            >
              Сохранить
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outlined"
              disabled={busy}
              onClick={() => {
                setCreating(false);
                setEditing(null);
                setError("");
              }}
            >
              Отмена
            </Button>
          </div>
        </form>
      )}
      <div className="flex gap-2" role="group" aria-label="Статус долга">
        <Button
          size="sm"
          variant={!closed ? "solid" : "outlined"}
          onClick={() => setClosed(false)}
        >
          Активные
        </Button>
        <Button
          size="sm"
          variant={closed ? "solid" : "outlined"}
          onClick={() => setClosed(true)}
        >
          Погашенные
        </Button>
      </div>
      {loaded && !visible.length && (
        <p className="py-6 text-center text-subtext0">
          {closed ? "Погашенных долгов пока нет" : "Активных долгов пока нет"}
        </p>
      )}
      {visible.map((debt) => {
        const remaining = getDebtRemaining(debt);
        return (
          <article
            key={debt.id}
            className="flex flex-col gap-3 rounded bg-surface0 p-4"
          >
            <h2 className="text-h2 break-words">{debt.person}</h2>
            <p className="text-lg font-bold">{money(remaining, debt)}</p>
            <p className="text-sm text-subtext0">
              Из {money(debt.amount, debt)}
            </p>
            {debt.dueDate && (
              <p
                className={
                  debt.dueDate < today() && !closed
                    ? "text-red"
                    : "text-subtext0"
                }
              >
                {debt.dueDate < today() && !closed ? "Просрочен · " : "Срок: "}
                {DateTime.fromISO(debt.dueDate).toFormat("dd.MM.yyyy")}
              </p>
            )}
            {debt.note && <p className="break-words text-sm">{debt.note}</p>}
            <div className="flex flex-wrap gap-2">
              {!closed && (
                <Button
                  size="sm"
                  disabled={busy || creating || !!editing}
                  onClick={() => {
                    setRepaying(debt);
                    setPaymentAmount(remaining);
                    setPaymentDate(today());
                    setError("");
                  }}
                >
                  Вернуть
                </Button>
              )}
              <Button
                size="sm"
                variant="outlined"
                disabled={busy || creating || !!editing}
                onClick={() => {
                  setEditing(debt);
                  setError("");
                  window.scrollTo(0, 0);
                }}
              >
                Изменить
              </Button>
              <Button
                size="sm"
                variant="outlinedRed"
                disabled={busy}
                onClick={() => setDeleting(debt)}
              >
                Удалить
              </Button>
            </div>
            {!!debt.payments.length && (
              <details>
                <summary className="text-sm text-subtext0">
                  История возвратов ({debt.payments.length})
                </summary>
                {debt.payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex flex-wrap justify-between items-center gap-2 py-2 text-sm"
                  >
                    <span>
                      {DateTime.fromISO(payment.date).toFormat("dd.MM.yyyy")} ·{" "}
                      {money(payment.amount, debt)}
                    </span>
                    <Button
                      size="sm"
                      variant="outlined"
                      disabled={busy || !!editing}
                      onClick={() =>
                        void run(() =>
                          saveDebt({
                            ...debt,
                            payments: debt.payments.filter(
                              (item) => item.id !== payment.id,
                            ),
                          }),
                        )
                      }
                    >
                      Отменить возврат
                    </Button>
                  </div>
                ))}
              </details>
            )}
          </article>
        );
      })}
      <Modal
        isOpen={!!repaying}
        onClose={() => {
          if (!busy) setRepaying(null);
        }}
        title="Возврат долга"
        description={
          repaying
            ? `${repaying.person} · осталось ${money(
                getDebtRemaining(repaying),
                repaying,
              )}`
            : ""
        }
        actions={
          <form
            className="flex flex-col gap-3 w-full"
            onSubmit={(event) => {
              event.preventDefault();
              if (!repaying) return;
              void run(async () => {
                const amount = paymentAmount.replace(",", ".");
                if (
                  !new Decimal(amount).gt(0) ||
                  new Decimal(amount).gt(getDebtRemaining(repaying))
                )
                  throw new Error(
                    "Сумма возврата должна быть больше нуля и не больше остатка.",
                  );
                await saveDebt({
                  ...repaying,
                  payments: [
                    ...repaying.payments,
                    { id: uuid(), amount, date: paymentDate },
                  ],
                });
                setRepaying(null);
              });
            }}
          >
            <Input
              id="repay-amount"
              label="Сумма возврата"
              inputMode="decimal"
              required
              pattern="[0-9]+([.,][0-9]+)?"
              value={paymentAmount}
              onChange={(event) => setPaymentAmount(event.target.value)}
            />
            <Input
              id="repay-date"
              label="Дата возврата"
              type="date"
              required
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
            />
            {error && (
              <p role="alert" className="text-red text-sm">
                {error}
              </p>
            )}
            <Button size="sm" type="submit" disabled={busy}>
              Сохранить возврат
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outlined"
              disabled={busy}
              onClick={() => setRepaying(null)}
            >
              Отмена
            </Button>
          </form>
        }
      />
      <Modal
        isOpen={!!deleting}
        onClose={() => {
          if (!busy) setDeleting(null);
        }}
        title="Удалить долг?"
        description={`Запись «${
          deleting?.person ?? ""
        }» и история её возвратов будут удалены.`}
        actions={
          <div className="flex gap-3">
            <Button
              size="sm"
              variant="outlinedRed"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  if (deleting) await deleteDebt(deleting.id);
                  setDeleting(null);
                })
              }
            >
              Удалить
            </Button>
            <Button size="sm" disabled={busy} onClick={() => setDeleting(null)}>
              Отмена
            </Button>
          </div>
        }
      />
    </PageLayout>
  );
};
