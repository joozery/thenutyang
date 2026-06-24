import { Schema, model, models } from 'mongoose';

export interface IIncome {
  category: string;
  description: string;
  amount: number;
  incomeDate: Date;
  note?: string;
  createdAt: Date;
}

const IncomeSchema = new Schema<IIncome>({
  category: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  incomeDate: { type: Date, required: true },
  note: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export const Income = models.Income ?? model<IIncome>('Income', IncomeSchema);
