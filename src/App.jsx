import Hero from './components/Hero.jsx';
import Navbar from './components/Navbar.jsx';
import ValueProp from './components/ValueProp.jsx';
import FeatureRow from './components/FeatureRow.jsx';
import Difference from './components/Difference.jsx';
import FinalCTA from './components/FinalCTA.jsx';
import Footer from './components/Footer.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />

      {/* Continuous light-gray band: value prop + 3 feature rows */}
      <div className="bg-[#ecedec]">
        <ValueProp />

        <FeatureRow
          eyebrow="Profile Review."
          title="Get past the filter."
          description="Artemis analyzes your CV against real hiring signals like structure, clarity, and role alignment so you know exactly what to fix."
          cta={{ label: 'Get my CV score', href: '#cv' }}
          image="/assets/profile-review-photo.png"
          imageAlt="Person reviewing a printed CV with a score badge"
        />

        <FeatureRow
          eyebrow="AI Mock Interviews."
          title="Practice how you think, not just what you say"
          description="Interviewing is not about memorization. Artemis simulates real conversations, asks follow-up questions, and shows you how to improve your thinking, communication, and structure."
          cta={{ label: 'Start interview prep', href: '#prep' }}
          image="/assets/mock-interview-photo.png"
          imageAlt="Laptop with a mock interview in progress"
          reverse
        />

        <FeatureRow
          eyebrow="Mentor Matching."
          title="Get real guidance when AI is not enough."
          description="Sometimes you need someone who has been there before. Connect with mentors who can review your progress, challenge your thinking, and guide your next move."
          cta={{ label: 'Join waitlist', href: '#waitlist' }}
          image="/assets/mentor-match-photo.png"
          imageAlt="Two people in a mentoring session with a match notification"
        />
      </div>

      <Difference />
      <FinalCTA />
      <Footer />
    </div>
  );
}
