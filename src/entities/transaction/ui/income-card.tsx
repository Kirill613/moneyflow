import { Link } from "@shared/ui/links";

import { createIncomeAmountString } from "../lib";
import { IncomeID } from "../model/models";

import { TransactionCard } from "./transaction-card";

interface IncomeCardIncome {
  id: IncomeID;
  title: string;
  formattedAmount: string;
  categoryTitle: string;
  accountTitle: string;
  time: string;
}

interface IncomeCardProps {
  income: IncomeCardIncome;
  // the transaction does not count towards statistics: muted colors
  excluded?: boolean;
}

export const IncomeCard = ({ income, excluded }: IncomeCardProps) => {
  const formattedAmount = createIncomeAmountString(income.formattedAmount);
  return (
    <Link to={`/incomes/${income.id}`}>
      <TransactionCard
        title={income.title}
        formattedAmount={formattedAmount}
        time={income.time}
        firstProperty={{ title: "Category", value: income.categoryTitle }}
        secondProperty={{ title: "Account", value: income.accountTitle }}
        className={excluded ? "border-overlay0" : "border-green"}
        amountClassName={excluded ? "text-overlay1" : "text-green"}
      />
    </Link>
  );
};
