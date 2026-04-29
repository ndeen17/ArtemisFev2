import { useEffect, useState } from 'react';
import type { CoverLetter, DraftCoverLetterInput } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { SparklesIcon } from '@/components/ui/icons';

interface CoverLetterEditorProps {
  letter: CoverLetter | null;
  onSave: (text: string) => Promise<void>;
  onDraft: (input: DraftCoverLetterInput) => Promise<void>;
  isSaving: boolean;
  isDrafting: boolean;
}

export function CoverLetterEditor({
  letter,
  onSave,
  onDraft,
  isSaving,
  isDrafting,
}: CoverLetterEditorProps) {
  const [text, setText] = useState(letter?.text ?? '');
  const [tone, setTone] = useState<DraftCoverLetterInput['tone']>('confident');

  // When a fresh draft arrives from the server, replace the local buffer.
  useEffect(() => {
    if (letter?.text) setText(letter.text);
  }, [letter?.text]);

  const dirty = text.trim().length > 0 && text !== (letter?.text ?? '');
  const tooShort = text.trim().length < 50;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
              Cover letter
            </div>
            <h2 className="mt-1 text-[20px] font-semibold text-[#111827]">Draft and edit</h2>
            {letter?.hook && (
              <p className="mt-1 text-[13px] text-gray-500 italic">&ldquo;{letter.hook}&rdquo;</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as DraftCoverLetterInput['tone'])}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px]"
              aria-label="Tone"
            >
              <option value="confident">Confident</option>
              <option value="warm">Warm</option>
              <option value="concise">Concise</option>
            </select>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDraft({ tone })}
              disabled={isDrafting}
            >
              <SparklesIcon className="w-4 h-4" />
              {letter ? 'Re-draft with AI' : 'Draft with AI'}
            </Button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={20}
          className="mt-5 w-full rounded-2xl border border-gray-200 bg-white p-4 text-[14px] leading-relaxed font-sans text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          placeholder={
            letter ? '' : 'Click "Draft with AI" to generate a cover letter from the JD.'
          }
        />

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[12px] text-gray-400">
            {text.trim().length} chars {tooShort && '· min 50'}
          </p>
          <Button
            type="button"
            onClick={() => onSave(text)}
            disabled={!dirty || tooShort || isSaving || !letter}
          >
            {isSaving ? 'Saving…' : 'Save edits'}
          </Button>
        </div>
      </div>
    </div>
  );
}
