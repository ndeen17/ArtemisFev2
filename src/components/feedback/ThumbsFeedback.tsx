import { useState } from 'react';
import type { FindingFeedbackSurface, FindingFeedbackVote } from '@artemis/shared';
import { ThumbsUpIcon, ThumbsDownIcon } from '@/components/ui/icons';
import { useSubmitFeedback } from '@/hooks/useFeedback';

interface ThumbsFeedbackProps {
  surface: FindingFeedbackSurface;
  /** Parent artefact id (e.g. interview session id, analysis id). */
  surfaceId: string;
  /** Stable id of the finding within the artefact (e.g. criterion key). */
  findingId: string;
  className?: string;
  /** Short hint shown alongside the icons; defaults to "Was this useful?". */
  label?: string;
}

/**
 * Phase 0 — single-row thumbs widget for any AI-generated finding.
 *
 * Behaviour:
 * - Optimistic: the active icon flips immediately on click.
 * - One-way per click: switching from up → down also POSTs (the BE records
 *   the flip as a fresh row, which is useful raw signal).
 * - On network error the icon reverts and the next click can retry.
 * - No undo: once a vote is registered locally, clicking the same icon
 *   again is a no-op. This keeps the displayed state consistent with what
 *   we've already sent and avoids generating empty "vote retracted" rows.
 */
export function ThumbsFeedback({
  surface,
  surfaceId,
  findingId,
  className,
  label = 'Was this useful?',
}: ThumbsFeedbackProps) {
  const [vote, setVote] = useState<FindingFeedbackVote | null>(null);
  const submit = useSubmitFeedback();

  function castVote(next: FindingFeedbackVote) {
    if (vote === next) return;
    const previous = vote;
    setVote(next);
    submit.mutate(
      { surface, surfaceId, findingId, vote: next },
      {
        onError() {
          setVote(previous);
        },
      },
    );
  }

  const baseBtn =
    'inline-flex items-center justify-center w-7 h-7 rounded-full border transition disabled:opacity-50 disabled:cursor-not-allowed';
  const idleBtn = 'border-gray-200 text-gray-400 hover:text-gray-700 hover:border-gray-300';
  const upActiveBtn = 'border-[#15803d] bg-[#dcfce7] text-[#15803d]';
  const downActiveBtn = 'border-rose-200 bg-rose-50 text-rose-600';

  const hasVoted = vote !== null;

  return (
    <div className={`flex items-center gap-2 ${className ?? ''}`}>
      <span className="text-[11px] text-gray-500">
        {hasVoted ? 'Thanks for the signal.' : label}
      </span>
      <button
        type="button"
        aria-label="Mark as useful"
        aria-pressed={vote === 'up'}
        disabled={submit.isPending && vote !== 'up'}
        onClick={() => castVote('up')}
        className={`${baseBtn} ${vote === 'up' ? upActiveBtn : idleBtn}`}
      >
        <ThumbsUpIcon />
      </button>
      <button
        type="button"
        aria-label="Mark as not useful"
        aria-pressed={vote === 'down'}
        disabled={submit.isPending && vote !== 'down'}
        onClick={() => castVote('down')}
        className={`${baseBtn} ${vote === 'down' ? downActiveBtn : idleBtn}`}
      >
        <ThumbsDownIcon />
      </button>
    </div>
  );
}
