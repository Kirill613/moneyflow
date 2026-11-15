import { Link } from "@shared/ui/links";

import { createExpenseAmountString } from "../lib";
import { ExpenseID } from "../model/models";

import { TransactionCard } from "./transaction-card";

interface ExpenseCardExpense {
  id: ExpenseID;
  title: string;
  formattedAmount: string;
  categoryTitle: string;
  accountTitle: string;
  time: string;
}

interface ExpenseCardProps {
  expense: ExpenseCardExpense;
  // the transaction does not count towards statistics: muted colors
  excluded?: boolean;
}

export const ExpenseCard = ({ expense, excluded }: ExpenseCardProps) => {
  const formattedAmount = createExpenseAmountString(expense.formattedAmount);
  return (
    <Link to={`/expenses/${expense.id}`}>
      <TransactionCard
        title={expense.title}
        formattedAmount={formattedAmount}
        time={expense.time}
        firstProperty={{ title: "Category", value: expense.categoryTitle }}
        secondProperty={{ title: "Account", value: expense.accountTitle }}
        className={excluded ? "border-overlay0" : "border-red"}
        amountClassName={excluded ? "text-overlay1" : "text-red"}
      />
    </Link>
  );
};
