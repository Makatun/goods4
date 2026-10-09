import { LegalPage } from '@/screens/legal';
import { TERMS } from '@/screens/legal/content';

export default function TermsRoute() {
  return <LegalPage document={TERMS} />;
}
