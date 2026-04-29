import { ComingSoonPage } from '../ComingSoonPage';
import { LinkedInIcon } from '@/components/ui/icons';

/**
 * PRF-04 — LinkedIn analysis is **placeholder-only at this phase**. We render the
 * standard ComingSoonPage with the LinkedIn icon and a clear note about what will
 * fold into readiness when it ships.
 */
export default function LinkedInAnalysisPage() {
  return (
    <ComingSoonPage
      title="LinkedIn analysis"
      subtitle="Headline, About, Experience, and visibility signals"
      description="When this ships you'll see section-by-section feedback on your LinkedIn profile and a blended readiness score that combines CV + LinkedIn signals."
      icon={LinkedInIcon}
    />
  );
}
