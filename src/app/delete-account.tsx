import { LegalPage } from '@/screens/legal';
import { DELETE_ACCOUNT } from '@/screens/legal/content';

export default function DeleteAccountRoute() {
  return <LegalPage document={DELETE_ACCOUNT} />;
}
