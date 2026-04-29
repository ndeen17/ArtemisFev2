import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { NewApplicationForm } from '@/components/applications/NewApplicationForm';

export default function NewApplicationPage() {
  return (
    <AppShell title="New application" subtitle="Save a role to start tailoring">
      <Link
        to="/applications"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to applications
      </Link>
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <NewApplicationForm />
      </div>
    </AppShell>
  );
}
