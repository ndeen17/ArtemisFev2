import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  RefineProposalTurn,
  RefineQuestionTurn,
  RefineRequest,
  RefineUserAnswer,
  StructuredCv,
} from '@artemis/shared';
import { Button } from '@/components/ui/Button';
import {
  CheckIcon,
  CloseIcon,
  SparklesIcon,
  SpinnerIcon,
} from '@/components/ui/icons';
import { useNextRefineTurn } from '@/hooks/useRefineTargetedCv';
import { useRefineChatStore } from '@/store/refineChatStore';
import { extractApiError } from '@/hooks/useAuth';

/**
 * Right-side drawer that drives the multi-turn refinement chatbot.
 *
 * The conversation alternates AI question turns (rendered as radio/checkbox
 * cards) with proposal turns (rendered with an Apply button). The user can
 * also free-text at any time — we treat that as a user answer with no
 * selected option ids. Apply is local-only: it pipes the proposed
 * StructuredCv into the editor's `onApply` callback. The user still has to
 * hit the page's Save button to persist.
 *
 * History is persisted per-application in `refineChatStore` so closing or
 * reloading does not lose context.
 */
export function RefineChatDrawer({
  applicationId,
  currentStructured,
  onApply,
  onClose,
}: {
  applicationId: string;
  currentStructured: StructuredCv;
  onApply(updated: StructuredCv): void;
  onClose(): void;
}) {
  const refineMutation = useNextRefineTurn(applicationId);
  const thread = useRefineChatStore((s) => s.threads[applicationId] ?? { history: [], bootstrapped: false });
  const appendEntry = useRefineChatStore((s) => s.appendEntry);
  const markBootstrapped = useRefineChatStore((s) => s.markBootstrapped);
  const clearThread = useRefineChatStore((s) => s.clear);

  const history = thread.history;
  const lastEntry = history[history.length - 1];
  const lastAssistantTurn =
    lastEntry?.role === 'assistant' ? lastEntry.turn : null;

  // Use a live ref to the latest currentStructured so async callbacks always
  // see the user's freshest hand-edits when sending the next refine request.
  const cvRef = useRef(currentStructured);
  useEffect(() => {
    cvRef.current = currentStructured;
  }, [currentStructured]);

  const [error, setError] = useState<string | null>(null);
  const [freeText, setFreeText] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [appliedTurnIds, setAppliedTurnIds] = useState<Set<number>>(new Set());

  // Auto-scroll to the bottom whenever the thread grows or a request resolves.
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [history.length, refineMutation.isPending]);

  // Reset the per-question selection state every time a new question lands.
  const lastQuestionFingerprint = useMemo(() => {
    if (!lastAssistantTurn || lastAssistantTurn.kind !== 'question') return null;
    return `${history.length}:${lastAssistantTurn.prompt}`;
  }, [lastAssistantTurn, history.length]);
  useEffect(() => {
    setPicked([]);
    setFreeText('');
  }, [lastQuestionFingerprint]);

  async function requestNextTurn(userInput?: RefineUserAnswer) {
    setError(null);
    const body: RefineRequest = {
      history,
      userInput,
      currentStructured: cvRef.current,
    };
    try {
      const turn = await refineMutation.mutateAsync(body);
      appendEntry(applicationId, { role: 'assistant', turn });
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  // Bootstrap: on first open with an empty thread, ask the AI to kick off.
  useEffect(() => {
    if (thread.bootstrapped) return;
    if (history.length > 0) {
      markBootstrapped(applicationId);
      return;
    }
    if (refineMutation.isPending) return;
    markBootstrapped(applicationId);
    void requestNextTurn(undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thread.bootstrapped]);

  function submitAnswer() {
    if (!lastAssistantTurn || lastAssistantTurn.kind !== 'question') return;
    const text = freeText.trim();
    if (picked.length === 0 && text.length === 0) {
      setError('Pick an option or type a note.');
      return;
    }
    const answer: RefineUserAnswer = {
      selectedIds: picked,
      ...(text.length > 0 ? { freeText: text } : {}),
    };
    appendEntry(applicationId, { role: 'user', answer });
    setPicked([]);
    setFreeText('');
    void requestNextTurn(answer);
  }

  function sendFreeTextOnly() {
    const text = freeText.trim();
    if (text.length === 0) return;
    const answer: RefineUserAnswer = { selectedIds: [], freeText: text };
    appendEntry(applicationId, { role: 'user', answer });
    setFreeText('');
    void requestNextTurn(answer);
  }

  function applyProposal(turnIndex: number, turn: RefineProposalTurn) {
    onApply(turn.updatedStructured);
    setAppliedTurnIds((s) => {
      const next = new Set(s);
      next.add(turnIndex);
      return next;
    });
    // Synthesise a user reply so the model knows the proposal landed, then
    // ask for the next turn (typically a "anything else?" question).
    const answer: RefineUserAnswer = {
      selectedIds: [],
      freeText: '[applied proposal]',
    };
    appendEntry(applicationId, { role: 'user', answer });
    void requestNextTurn(answer);
  }

  function reset() {
    clearThread(applicationId);
    setPicked([]);
    setFreeText('');
    setError(null);
    setAppliedTurnIds(new Set());
    // Re-bootstrap on the next render via the useEffect above.
  }

  const waitingForUser =
    lastAssistantTurn?.kind === 'question' && !refineMutation.isPending;
  const isDone = lastAssistantTurn?.kind === 'done';

  return (
    <div role="dialog" aria-label="Refine with AI" className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div className="relative ml-auto h-full w-full max-w-[640px] bg-white shadow-2xl flex flex-col">
        <header className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-100">
          <div className="flex items-start gap-3">
            <SparklesIcon className="w-5 h-5 mt-0.5 text-brand-green" />
            <div>
              <div className="text-[12px] font-semibold tracking-[0.14em] uppercase text-brand-green">
                Refine with AI
              </div>
              <h2 className="mt-1 text-[16px] font-semibold text-[#111827]">
                Dial in your targeted CV
              </h2>
              <p className="mt-1 text-[12.5px] text-gray-500">
                Pick options or type below. Apply changes locally, then Save on the page when you're happy.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-gray-500 hover:bg-gray-100"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </header>

        <div ref={scrollerRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50">
          {history.length === 0 && refineMutation.isPending ? (
            <ThinkingCard />
          ) : null}

          {history.map((entry, i) => {
            if (entry.role === 'user') {
              return <UserBubble key={i} answer={entry.answer} />;
            }
            const turn = entry.turn;
            if (turn.kind === 'question') {
              const isLatest = i === history.length - 1;
              return (
                <QuestionCard
                  key={i}
                  turn={turn}
                  active={isLatest && !refineMutation.isPending}
                  picked={isLatest ? picked : []}
                  onTogglePick={(id) => {
                    if (turn.selection === 'single') {
                      setPicked([id]);
                    } else {
                      setPicked((prev) =>
                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                      );
                    }
                  }}
                />
              );
            }
            if (turn.kind === 'proposal') {
              return (
                <ProposalCard
                  key={i}
                  turn={turn}
                  applied={appliedTurnIds.has(i)}
                  disabled={refineMutation.isPending}
                  onApply={() => applyProposal(i, turn)}
                />
              );
            }
            return <DoneCard key={i} message={turn.message} />;
          })}

          {refineMutation.isPending && history.length > 0 ? <ThinkingCard /> : null}
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12.5px] text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <footer className="border-t border-gray-100 bg-white px-5 py-4 space-y-3">
          {lastAssistantTurn?.kind === 'question' && lastAssistantTurn.allowFreeText ? (
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Add a note (optional)…"
              disabled={refineMutation.isPending}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 text-[13px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-[#dcfce7] disabled:bg-gray-50"
            />
          ) : null}

          {!waitingForUser && !isDone ? (
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              maxLength={2000}
              rows={2}
              placeholder="Tell the assistant what to tweak…"
              disabled={refineMutation.isPending}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-white p-3 text-[13px] text-[#111827] placeholder:text-gray-400 focus:outline-none focus:border-brand-green focus:ring-2 focus:ring-[#dcfce7] disabled:bg-gray-50"
            />
          ) : null}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={refineMutation.isPending || history.length === 0}
              className="text-[12px] font-medium text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              Reset conversation
            </button>
            <div className="flex items-center gap-2">
              {waitingForUser ? (
                <Button
                  onClick={submitAnswer}
                  disabled={refineMutation.isPending}
                >
                  Submit
                </Button>
              ) : !isDone ? (
                <Button
                  onClick={sendFreeTextOnly}
                  disabled={refineMutation.isPending || freeText.trim().length === 0}
                >
                  Send
                </Button>
              ) : (
                <Button onClick={reset}>Start over</Button>
              )}
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

function ThinkingCard() {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-brand-green/20 bg-[#ecfdf5] px-4 py-3 text-[12.5px] text-[#065f46]">
      <SpinnerIcon className="animate-spin w-4 h-4" />
      Thinking… usually 5–15 seconds.
    </div>
  );
}

function UserBubble({ answer }: { answer: RefineUserAnswer }) {
  const picks = answer.selectedIds.length
    ? answer.selectedIds.join(', ')
    : null;
  if (!picks && !answer.freeText) return null;
  if (answer.freeText === '[applied proposal]') {
    return (
      <div className="ml-auto max-w-[80%] rounded-2xl bg-brand-green/10 px-3 py-2 text-[12.5px] font-semibold text-[#065f46]">
        ✓ Applied
      </div>
    );
  }
  return (
    <div className="ml-auto max-w-[80%] rounded-2xl bg-[#111827] px-3 py-2 text-[13px] text-white">
      {picks ? <div className="text-[12px] opacity-80">Picked: {picks}</div> : null}
      {answer.freeText ? <div className="mt-0.5">{answer.freeText}</div> : null}
    </div>
  );
}

function QuestionCard({
  turn,
  active,
  picked,
  onTogglePick,
}: {
  turn: RefineQuestionTurn;
  active: boolean;
  picked: string[];
  onTogglePick(id: string): void;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="text-[14px] font-semibold text-[#111827]">{turn.prompt}</div>
      {turn.helper ? (
        <div className="mt-1 text-[12.5px] text-gray-500">{turn.helper}</div>
      ) : null}
      <div className="mt-3 space-y-2">
        {turn.options.map((opt) => {
          const isPicked = picked.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => active && onTogglePick(opt.id)}
              disabled={!active}
              className={`w-full text-left rounded-xl border px-3 py-2 transition ${
                isPicked
                  ? 'border-brand-green bg-[#ecfdf5]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              } ${active ? '' : 'opacity-70 cursor-not-allowed'}`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 inline-flex h-4 w-4 flex-none items-center justify-center border ${
                    turn.selection === 'single' ? 'rounded-full' : 'rounded'
                  } ${isPicked ? 'border-brand-green bg-brand-green text-white' : 'border-gray-300 bg-white'}`}
                >
                  {isPicked ? <CheckIcon className="w-3 h-3" /> : null}
                </span>
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-[#111827]">{opt.label}</div>
                  {opt.description ? (
                    <div className="mt-0.5 text-[12px] text-gray-500">{opt.description}</div>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-2 text-[11px] uppercase tracking-wider text-gray-400">
        {turn.selection === 'single' ? 'Pick one' : 'Pick any that apply'}
      </div>
    </div>
  );
}

function ProposalCard({
  turn,
  applied,
  disabled,
  onApply,
}: {
  turn: RefineProposalTurn;
  applied: boolean;
  disabled: boolean;
  onApply(): void;
}) {
  return (
    <div className="rounded-2xl border border-brand-green/30 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-4 h-4 text-brand-green" />
        <div className="text-[12px] font-semibold uppercase tracking-wider text-brand-green">
          Proposed changes
        </div>
      </div>
      <div className="mt-2 text-[13px] text-[#111827]">{turn.summary}</div>
      <ul className="mt-3 space-y-1.5">
        {turn.changes.map((c, i) => (
          <li key={i} className="flex items-start gap-2 text-[12.5px] text-gray-700">
            <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-brand-green" />
            <div>
              <span className="font-semibold capitalize">{c.section}:</span> {c.description}
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-end">
        {applied ? (
          <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[#065f46]">
            <CheckIcon className="w-4 h-4" /> Applied
          </span>
        ) : (
          <Button onClick={onApply} disabled={disabled}>
            Apply changes
          </Button>
        )}
      </div>
    </div>
  );
}

function DoneCard({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 text-[13px] text-[#111827]">
      <div className="text-[12px] font-semibold uppercase tracking-wider text-gray-500">
        All done
      </div>
      <div className="mt-1">{message}</div>
    </div>
  );
}
