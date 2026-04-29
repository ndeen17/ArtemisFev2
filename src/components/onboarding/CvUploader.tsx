import { useRef, useState, type DragEvent } from 'react';
import { ALLOWED_CV_MIME, MAX_CV_BYTES } from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import { FileIcon, SpinnerIcon, UploadIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

interface Props {
  onUpload(file: File): Promise<void> | void;
  pending?: boolean;
  errorMessage?: string | null;
}

const ACCEPT = ALLOWED_CV_MIME.join(',');

function validate(file: File): string | null {
  if (!ALLOWED_CV_MIME.includes(file.type as (typeof ALLOWED_CV_MIME)[number])) {
    return 'Only PDF or plain-text CVs are accepted.';
  }
  if (file.size > MAX_CV_BYTES) {
    return 'File exceeds the 5MB limit.';
  }
  return null;
}

/**
 * Drag-and-drop CV uploader. The frame, copy, and pill button match the
 * landing's visual grammar — cream interior, soft border, brand-green accent
 * on hover/drag.
 */
export function CvUploader({ onUpload, pending, errorMessage }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [staged, setStaged] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function pick() {
    inputRef.current?.click();
  }

  function stage(file: File) {
    const err = validate(file);
    if (err) {
      setLocalError(err);
      setStaged(null);
      return;
    }
    setLocalError(null);
    setStaged(file);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) stage(file);
  }

  async function confirm() {
    if (!staged) return;
    await onUpload(staged);
  }

  const error = errorMessage ?? localError;

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'rounded-2xl border-2 border-dashed p-8 text-center transition-colors',
          dragOver
            ? 'border-brand-green bg-[#f0fdf4]'
            : 'border-gray-200 bg-[#fafafa] hover:border-gray-300',
        )}
      >
        <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-green ring-4 ring-[#dcfce7]">
          <UploadIcon />
        </div>
        <p className="mt-4 text-[16px] font-semibold text-[#111827]">Drag your CV here</p>
        <p className="mt-1 text-[13px] text-gray-500">PDF or plain text, up to 5MB</p>
        <div className="mt-5">
          <Button variant="outline" size="sm" onClick={pick} type="button">
            Choose file
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) stage(file);
            e.target.value = '';
          }}
        />
      </div>

      {staged ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#ecfdf5] text-brand-green shrink-0">
              <FileIcon />
            </span>
            <div className="min-w-0">
              <div className="text-[14px] font-semibold text-[#111827] truncate">{staged.name}</div>
              <div className="text-[12px] text-gray-500">{(staged.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>
          <Button onClick={confirm} disabled={pending} type="button">
            {pending ? (
              <span className="inline-flex items-center gap-2">
                <SpinnerIcon /> Uploading…
              </span>
            ) : (
              'Use this CV'
            )}
          </Button>
        </div>
      ) : null}

      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}
    </div>
  );
}
