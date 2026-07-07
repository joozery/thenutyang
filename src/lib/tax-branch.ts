// สำนักงานใหญ่/สาขา ของผู้เสียภาษี — เก็บใน DB เป็น string เดียว: '' | 'สำนักงานใหญ่' | 'สาขาที่ 00001'

export type TaxBranchType = 'none' | 'head' | 'branch';

export function composeTaxBranch(type: TaxBranchType, code: string): string {
  if (type === 'head') return 'สำนักงานใหญ่';
  if (type === 'branch') return code.trim() ? `สาขาที่ ${code.trim()}` : '';
  return '';
}

export function parseTaxBranch(value?: string): { type: TaxBranchType; code: string } {
  const v = (value ?? '').trim();
  if (!v) return { type: 'none', code: '' };
  if (v === 'สำนักงานใหญ่') return { type: 'head', code: '' };
  return { type: 'branch', code: v.replace(/^สาขาที่\s*/, '') };
}
