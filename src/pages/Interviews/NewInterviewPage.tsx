import { Link } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { ArrowLeftIcon } from '@/components/ui/icons';
import { NewInterviewForm } from '@/components/interviews/NewInterviewForm';

export default function NewInterviewPage() {
  return (
    <AppShell title="New interview" subtitle="Pick a focus and we'll generate a brief">
      <Link
        to="/interviews"
        className="inline-flex items-center gap-1 text-[13px] font-semibold text-gray-600 hover:text-[#15803d]"
      >
        <ArrowLeftIcon className="w-4 h-4" /> Back to interviews
      </Link>
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <NewInterviewForm />
      </div>
    </AppShell>
  );
}
