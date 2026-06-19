import { NewDocumentClient } from '@/components/admin/new-document-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'สร้างเอกสาร | Admin' };

export default function NewDocumentPage() {
  return <NewDocumentClient />;
}
