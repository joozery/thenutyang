'use server';

import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/mongodb';
import { Expense } from '@/models/Expense';

type ActionResult = { ok?: boolean; error?: string };

export async function createExpense(input: {
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  note: string;
}): Promise<ActionResult> {
  try {
    if (!input.category.trim()) return { error: 'กรุณาเลือกหมวดรายจ่าย' };
    if (!Number.isFinite(input.amount) || input.amount <= 0) return { error: 'จำนวนเงินไม่ถูกต้อง' };
    if (!input.expenseDate) return { error: 'กรุณาเลือกวันที่' };

    await connectDB();
    await Expense.create({
      category:    input.category.trim(),
      description: input.description.trim(),
      amount:      input.amount,
      expenseDate: new Date(input.expenseDate),
      note:        input.note.trim(),
    });

    revalidatePath('/admin/finance');
    return { ok: true };
  } catch (err) {
    console.error('[createExpense]', err);
    return { error: 'บันทึกรายจ่ายไม่สำเร็จ' };
  }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  try {
    await connectDB();
    await Expense.findByIdAndDelete(id);
    revalidatePath('/admin/finance');
    return { ok: true };
  } catch (err) {
    console.error('[deleteExpense]', err);
    return { error: 'ลบรายจ่ายไม่สำเร็จ' };
  }
}
