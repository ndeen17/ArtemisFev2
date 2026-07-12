import { Navbar, ValueProp, FeatureRow, Difference, FinalCTA, Footer } from '@/components/landing';
import { AutoApplyHero } from '@/components/autoapply/AutoApplyHero';
import { MarketingLayout } from '@/components/layout/MarketingLayout';

/** Public marketing page for the AutoApply product surface (route: `/autoapply`). */
export default function AutoApplyPage() {
  return (
    <MarketingLayout>
      <Navbar />
      <AutoApplyHero />

      {/* Continuous light-gray band: value prop + 3 feature rows */}
      <div className="bg-[#ecedec]">
        <ValueProp />

        <div id="resume">
          <FeatureRow
            eyebrow="Profile Review."
            title="Get past the filter."
            description="Artemis analyzes your CV against real hiring signals like structure, clarity, and role alignment so you know exactly what to fix."
            cta={{ label: 'Get my CV score', href: '/signup' }}
            image="/assets/profile-review-photo.png"
            imageAlt="Person reviewing a printed CV with a score badge"
          />
        </div>

        <div id="interviews">
          <FeatureRow
            eyebrow="AI Mock Interviews."
            title="Practice how you think, not just what you say"
            description="Interviewing is not about memorization. Artemis simulates real conversations, asks follow-up questions, and shows you how to improve your thinking, communication, and structure."
            cta={{ label: 'Start interview prep', href: '/signup' }}
            image="/assets/mock-interview-photo.png"
            imageAlt="Laptop with a mock interview in progress"
            reverse
          />
        </div>

        <div id="mentors">
          <FeatureRow
            eyebrow="Mentor Matching."
            title="Get real guidance when AI is not enough."
            description="Sometimes you need someone who has been there before. Connect with mentors who can review your progress, challenge your thinking, and guide your next move."
            cta={{ label: 'Join waitlist', href: '/signup' }}
            image="/assets/mentor-match-photo.png"
            imageAlt="Two people in a mentoring session with a match notification"
          />
        </div>
      </div>

      <Difference />
      <FinalCTA />
      <Footer />
    </MarketingLayout>
  );
}
