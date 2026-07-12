import { Navbar, ValueProp, FeatureRow, Difference, Footer } from '@/components/landing';
import { AutoApplyHero } from '@/components/autoapply/AutoApplyHero';
import { AutoApplyFinalCTA } from '@/components/autoapply/AutoApplyFinalCTA';
import { MarketingLayout } from '@/components/layout/MarketingLayout';

/** Public marketing page for the AutoApply product surface (route: `/autoapply`). */
export default function AutoApplyPage() {
  return (
    <MarketingLayout>
      <Navbar />
      <AutoApplyHero />

      {/* Continuous light-gray band: value prop + auto-apply feature row */}
      <div className="bg-[#ecedec]">
        <ValueProp />

        <div id="autoapply">
          <FeatureRow
            eyebrow="Auto-Apply."
            title="We fill it out. You show up."
            description="Artemis finds roles that match your profile and submits tailored applications on your behalf, so your time goes into interviewing, not paperwork."
            cta={{ label: 'Start auto-applying', href: '/signup' }}
            image="/assets/ai.png"
            imageAlt="Application form being filled out automatically on a tablet"
          />
        </div>
      </div>

      <Difference />
      <AutoApplyFinalCTA />
      <Footer />
    </MarketingLayout>
  );
}
