const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Exercise the actual report functions with an in-memory database boundary.
function setup({ payslips = [], expenses = [] } = {}) {
  function matches(row, filter) {
    return Object.entries(filter).every(([key, value]) => {
      const actual = row[key];
      if (!value || typeof value !== 'object') return actual === value;
      return Object.entries(value).every(([op, expected]) => {
        if (op === '$ne') return expected === null ? actual != null : actual !== expected;
        if (op === '$nin') return !expected.some(id => String(id) === String(actual));
        if (op === '$gte') return actual >= expected;
        if (op === '$lte') return actual <= expected;
        if (op === '$in') return expected.includes(actual);
        throw new Error(`Unsupported operator ${op}`);
      });
    });
  }
  function model(rows) {
    return {
      find: filter => ({ lean: async () => rows.filter(row => matches(row, filter)) }),
      distinct: async (key, filter) => [...new Set(rows.filter(row => matches(row, filter)).map(row => row[key]))],
    };
  }
  const mocks = {
    './mongodb': { default: async () => {} },
    '@/models/Payslip': { Payslip: model(payslips) },
    '@/models/Expense': { Expense: model(expenses) },
    '@/models/PurchaseOrder': { PurchaseOrder: model([]) },
    '@/models/FinancialDocument': { FinancialDocument: model([]) },
    '@/models/Booking': { Booking: model([]) },
  };
  function load(name) {
    const filename = path.join(__dirname, '../src/lib', `${name}.ts`);
    const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    const exports = {};
    vm.runInNewContext(code, {
      exports,
      require: id => {
        if (id === './expense-filter') return load('expense-filter');
        if (!(id in mocks)) throw new Error(`Unexpected import ${id}`);
        return mocks[id];
      },
    }, { filename });
    return exports;
  }
  return load('finance');
}

const start = new Date('2026-08-01T00:00:00Z');
const end = new Date('2026-09-30T23:59:59.999Z');
const date = new Date('2026-09-15T00:00:00Z');
const slip = { _id: 'slip', status: 'paid', netPay: 15000, employeeName: 'Employee', period: '2026-09', paidAt: date, expenseId: 'linked' };
const linked = { _id: 'linked', amount: 15000, category: 'เงินเดือน', description: 'Payroll mirror', expenseDate: date };
const manual = { _id: 'manual', amount: 500, category: 'เงินเดือน', description: 'Manual expense', expenseDate: date };

test('daily expenses show payroll once and preserve manual expenses in the same category', async () => {
  const api = setup({ payslips: [slip], expenses: [linked, manual] });
  const items = await api.getDailyExpenses(start, end);
  assert.equal(items.length, 2);
  assert.equal(items.filter(item => item.source === 'payroll').length, 1);
  assert.equal(items.find(item => item.source === 'expense').id, 'manual');
  assert.equal(items.reduce((sum, item) => sum + item.amount, 0), 15500);
});

test('finance totals, profit and transactions count the payment only once', async () => {
  const api = setup({ payslips: [slip], expenses: [linked, manual] });
  const summary = await api.getFinanceSummary(start, end);
  assert.equal(summary.totalExpense, 15500);
  assert.equal(summary.netProfit, -15500);
  assert.equal(summary.transactions.length, 2);
  assert.equal(summary.expenseByCategory.find(c => c.label === 'ค่าใช้จ่ายทั่วไป').amount, 500);
});

test('linked expense stays excluded when its date differs from the payslip date', async () => {
  const api = setup({ payslips: [{ ...slip, paidAt: new Date('2026-10-01') }], expenses: [linked] });
  assert.equal((await api.getDailyExpenses(start, end)).length, 0);
  assert.equal((await api.getFinanceSummary(start, end)).totalExpense, 0);
});

test('paid legacy slips without an expense link remain visible', async () => {
  const api = setup({ payslips: [{ ...slip, expenseId: null }], expenses: [manual] });
  assert.equal((await api.getFinanceSummary(start, end)).totalExpense, 15500);
});

test('cancelling payroll leaves only unrelated manual expenses', async () => {
  const api = setup({ payslips: [{ ...slip, status: 'pending', paidAt: null, expenseId: null }], expenses: [manual] });
  const items = await api.getDailyExpenses(start, end);
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'manual');
});

test('category options exclude payroll mirrors but retain manual categories', async () => {
  const api = setup({ payslips: [slip], expenses: [linked, { ...manual, category: 'ค่าไฟ' }] });
  assert.equal(JSON.stringify(await api.getExpenseCategories()), JSON.stringify(['ค่าไฟ']));
});
