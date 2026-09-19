import { Payslip } from '@/models/Payslip';

// Payroll is reported from Payslip. Keep its linked Expense for payroll edits
// and cancellation, but never count that same payment as a manual expense.
export async function getManualExpenseFilter() {
  const payrollExpenseIds = await Payslip.distinct('expenseId', {
    status: 'paid',
    expenseId: { $ne: null },
  });

  return {
    category: { $ne: 'PurchaseOrder' },
    _id: { $nin: payrollExpenseIds },
  };
}
