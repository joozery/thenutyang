import { getContactSettings } from '@/lib/contact-settings';
import { StickyContact } from './sticky-contact';

export async function StickyContactServer() {
  const s = await getContactSettings() as {
    lineId?: string; lineLabel?: string;
    phoneMain?: string; phoneMainLabel?: string;
    phoneSale?: string; phoneSaleLabel?: string;
  } | null;

  return (
    <StickyContact
      lineId={s?.lineId ?? '@thenuttire'}
      lineLabel={s?.lineLabel ?? '@TIRESBID'}
      phoneMain={s?.phoneMain ?? '090-958-7416'}
      phoneMainLabel={s?.phoneMainLabel ?? 'คุณนัท'}
      phoneSale={s?.phoneSale ?? '090-986-8762'}
      phoneSaleLabel={s?.phoneSaleLabel ?? 'ฝ่ายขาย'}
    />
  );
}
