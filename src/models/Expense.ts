import { Schema, model, models } from 'mongoose';

export interface IExpense {
  category:    string;
  description: string;
  amount:      number;
  expenseDate: Date;
  note:        string;
  createdAt:   Date;
}

const ExpenseSchema = new Schema<IExpense>({
  category:    { type: String, required: true },
  description: { type: String, default: '' },
  amount:      { type: Number, required: true },
  expenseDate: { type: Date, required: true },
  note:        { type: String, default: '' },
  createdAt:   { type: Date, default: Date.now },
});

export const Expense = models.Expense ?? model<IExpense>('Expense', ExpenseSchema);
