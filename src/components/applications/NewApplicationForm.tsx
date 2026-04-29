import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateApplicationSchema, type CreateApplicationInput } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { useCreateApplication } from '@/hooks/useApplications';

interface NewApplicationFormProps {
  onCancel?: () => void;
}

export function NewApplicationForm({ onCancel }: NewApplicationFormProps) {
  const navigate = useNavigate();
  const create = useCreateApplication();
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [jdText, setJdText] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const parsed = CreateApplicationSchema.safeParse({
      jobTitle: jobTitle.trim(),
      company: company.trim(),
      jdText: jdText.trim(),
    } satisfies CreateApplicationInput);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Please review the fields.');
      return;
    }
    try {
      const app = await create.mutateAsync(parsed.data);
      navigate(`/applications/${app.id}`);
    } catch {
      setError('Could not save application. Try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-[12px] font-semibold text-gray-600">Job title</span>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            required
            className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-[14px]"
            placeholder="Senior Software Engineer"
          />
        </label>
        <label className="block">
          <span className="text-[12px] font-semibold text-gray-600">Company</span>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            required
            className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-2.5 text-[14px]"
            placeholder="Acme"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-[12px] font-semibold text-gray-600">Job description</span>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          required
          rows={10}
          className="mt-1 w-full rounded-2xl border border-gray-200 px-4 py-3 text-[14px] leading-relaxed"
          placeholder="Paste the full job description here…"
        />
        <span className="mt-1 block text-[11px] text-gray-400">
          {jdText.trim().length} chars · min 20
        </span>
      </label>
      {error && <p className="text-[13px] text-rose-600">{error}</p>}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={create.isPending}>
          {create.isPending ? 'Saving…' : 'Save application'}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
