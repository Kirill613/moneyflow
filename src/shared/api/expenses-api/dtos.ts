export type ExpenseID = string;

export interface CreateExpenseDTO {
  title: string;
  accountId: string;
  categoryId: string;
  amount: string;
  datetime: number;
  debtPerson?: string;
}

export type UpdateExpenseDTO = CreateExpenseDTO;

export interface ExpenseDTO extends CreateExpenseDTO {
  id: ExpenseID;
  createdAt: number;
}

export type ExpensesDTO = Record<ExpenseID, ExpenseDTO>;
