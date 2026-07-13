import { getLegalPage } from '@/app/actions/legal';
import { LegalSettingsClient } from '@/components/admin/legal-settings-client';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'นโยบายและเงื่อนไข | Admin' };

export default async function LegalSettingsPage() {
  const [privacy, terms] = await Promise.all([
    getLegalPage('privacy'),
    getLegalPage('terms'),
  ]);

  return <LegalSettingsClient privacy={privacy} terms={terms} />;
}
