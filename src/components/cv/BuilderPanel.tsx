import { useEffect, useMemo, useRef, useState } from 'react';
import type { StructuredCv, ActionPlanItem } from '@artemis/shared';
import { CvEditor } from '@/components/cv/CvEditor';
import { Button } from '@/components/ui/Button';
import { SpinnerIcon, SparklesIcon } from '@/components/ui/icons';
import {
  useMyCv,
  usePatchCv,
  useReparseCv,
} from '@/hooks/useOnboarding';
import { useActionPlan } from '@/hooks/useProfile';
import {
  useApplication,
  usePatchTargetedCv,
  useReparseTargetedCv,
} from '@/hooks/useApplications';
import { extractApiError } from '@/hooks/useAuth';
import { emptyStructuredCv, isStructuredCvSparse } from '@/lib/structuredCv';
import type { BuilderSection } from '@/hooks/useBuilderUrlState';

/**
 * Reusable inline-editing surface for both:
 *   - profile mode  → operates on the canonical CV (`/cv/:cvId`)
 *   - targeted mode → operates on `Application.targetedCv`
 *
 * Lifts hydration / auto-reparse / save logic that previously lived on
 * `Profile/CvEditPage` and `Applications/TargetedCvEditPage`. The host page
 * controls visibility via `SplitPaneShell` and passes `focus` + `coachOpen`
 * through the URL.
 */
export interface BuilderPanelProps {
  mode: 'profile' | 'targeted';
  /** Targeted mode only. The application id whose targetedCv we're editing. */
  applicationId?: string;
  /** Optional initial section. Wins over `focus` if both are present. */
  section?: BuilderSection | null;
  /** Action-plan item id; resolves to its section + coach seed. Profile mode only. */
  focus?: string | null;
  /** When true, opens the AI coach drawer prefilled with the focus seed. */
  coachOpen?: boolean;
  /** Called after a successful save. Hosts use this to optionally close. */
  onSaved?: () => void;
}

export function BuilderPanel(props: BuilderPanelProps) {
  if (props.mode === 'profile') return <ProfileBuilder {...props} />;
  return <TargetedBuilder {...props} />;
}

function ProfileBuilder({ section, focus, coachOpen, onSaved }: BuilderPanelProps) {
  const cvQuery = useMyCv();
  const patch = usePatchCv();
  const reparse = useReparseCv();
  const actionPlan = useActionPlan();

  const [draft, setDraft] = useState<StructuredCv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reparsedRef = useRef(false);
  // Snapshot of the server state we last hydrated from. We compare against
  // the current draft to detect "user has unsaved local edits"; when the
  // server state changes (e.g. Fix button just applied a rewrite), we
  // refresh the draft only if the user hasn't started editing yet —
  // otherwise we'd clobber their typing.
  const hydratedSnapshotRef = useRef<string | null>(null);

  // Auto-reparse once if structured is sparse.
  useEffect(() => {
    if (reparsedRef.current) return;
    const cv = cvQuery.data;
    if (!cv) return;
    if (!isStructuredCvSparse(cv.structured ?? null)) return;
    reparsedRef.current = true;
    reparse.mutate(cv.id, {
      onSuccess: (next) => {
        const struct = next.structured ?? emptyStructuredCv();
        setDraft(struct);
        hydratedSnapshotRef.current = JSON.stringify(struct);
        setError(null);
      },
      onError: (err) => setError(extractApiError(err).message),
    });
  }, [cvQuery.data, reparse]);

  // Hydrate / re-hydrate from server. Initial hydration always runs; later
  // server updates (e.g. one-click Fix) only refresh the draft if the user
  // has no unsaved edits in flight.
  useEffect(() => {
    const cv = cvQuery.data;
    if (!cv) return;
    const next = cv.structured ?? emptyStructuredCv();
    const nextSerialized = JSON.stringify(next);
    if (draft === null) {
      setDraft(next);
      hydratedSnapshotRef.current = nextSerialized;
      return;
    }
    if (nextSerialized === hydratedSnapshotRef.current) return; // server unchanged
    const draftSerialized = JSON.stringify(draft);
    if (draftSerialized === hydratedSnapshotRef.current) {
      // Local draft matches what we last hydrated → safe to refresh.
      setDraft(next);
      hydratedSnapshotRef.current = nextSerialized;
    }
    // else: keep the user's edits. They'll save (which sends their version)
    // or close the builder. The stale snapshot is acceptable here.
  }, [cvQuery.data, draft]);

  const focusedAction = useMemo<ActionPlanItem | null>(() => {
    if (!focus) return null;
    return actionPlan.data?.items.find((i) => i.id === focus) ?? null;
  }, [focus, actionPlan.data]);

  // If the user navigates here with a stale ?focus that doesn't match any
  // action, surface a soft toast so they aren't silently dropped to the
  // header section without explanation.
  const staleFocus = focus && actionPlan.data && !focusedAction ? focus : null;

  const initialSection = (section ?? focusedAction?.section ?? undefined) as
    | BuilderSection
    | undefined;

  const seedCoachMessage = coachOpen && focusedAction
    ? `Help me address this from my action plan: "${focusedAction.title}". Detail: ${focusedAction.detail}`
    : undefined;

  async function save() {
    setError(null);
    if (!cvQuery.data || !draft) return;
    try {
      await patch.mutateAsync({ cvId: cvQuery.data.id, structured: draft });
      onSaved?.();
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  if (cvQuery.isLoading || draft === null) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <SpinnerIcon /> Loading your CV…
      </div>
    );
  }
  if (!cvQuery.data) {
    return (
      <p className="text-[14px] text-gray-600">
        You don&apos;t have a CV yet. Upload one from your profile to start editing.
      </p>
    );
  }

  const isReparsing = reparse.isPending;

  return (
    <div className="space-y-4">
      {staleFocus ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[12.5px] text-amber-800">
          The action you opened is no longer in your plan — opening the editor without focus.
        </div>
      ) : null}
      {isReparsing ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-3 py-1.5 text-[12.5px] font-semibold text-[#065f46]">
          <SpinnerIcon className="animate-spin w-4 h-4" />
          Auto-filling from your upload…
        </div>
      ) : null}
      <CvEditor
        value={draft}
        onChange={setDraft}
        cvId={cvQuery.data.id}
        initialSection={initialSection}
        seedCoachMessage={seedCoachMessage}
        onSaveSection={async (_section, next) => {
          await patch.mutateAsync({ cvId: cvQuery.data!.id, structured: next });
        }}
      />
      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <Button onClick={save} disabled={patch.isPending}>
          {patch.isPending ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerIcon /> Saving…
            </span>
          ) : (
            'Save & close'
          )}
        </Button>
      </div>
    </div>
  );
}

function TargetedBuilder({ applicationId, section, onSaved }: BuilderPanelProps) {
  const id = applicationId ?? '';
  const appQuery = useApplication(id);
  const patch = usePatchTargetedCv(id);
  const reparse = useReparseTargetedCv(id);

  const [draft, setDraft] = useState<StructuredCv | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reparsedRef = useRef(false);
  const hydratedSnapshotRef = useRef<string | null>(null);

  const targeted = appQuery.data?.targetedCv ?? null;

  useEffect(() => {
    if (reparsedRef.current) return;
    if (!targeted) return;
    if (!isStructuredCvSparse(targeted.structured ?? null)) return;
    reparsedRef.current = true;
    reparse.mutate(undefined, {
      onSuccess: (next) => {
        const struct = next.targetedCv?.structured ?? emptyStructuredCv();
        setDraft(struct);
        hydratedSnapshotRef.current = JSON.stringify(struct);
        setError(null);
      },
      onError: (err) => setError(extractApiError(err).message),
    });
  }, [targeted, reparse]);

  useEffect(() => {
    if (!targeted) return;
    const next = targeted.structured ?? emptyStructuredCv();
    const nextSerialized = JSON.stringify(next);
    if (draft === null) {
      setDraft(next);
      hydratedSnapshotRef.current = nextSerialized;
      return;
    }
    if (nextSerialized === hydratedSnapshotRef.current) return;
    const draftSerialized = JSON.stringify(draft);
    if (draftSerialized === hydratedSnapshotRef.current) {
      setDraft(next);
      hydratedSnapshotRef.current = nextSerialized;
    }
  }, [targeted, draft]);

  async function save() {
    setError(null);
    if (!draft) return;
    try {
      await patch.mutateAsync({ structured: draft });
      onSaved?.();
    } catch (err) {
      setError(extractApiError(err).message);
    }
  }

  if (appQuery.isLoading || draft === null) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <SpinnerIcon /> Loading targeted CV…
      </div>
    );
  }
  if (!targeted) {
    return (
      <p className="text-[14px] text-gray-600">
        No targeted CV yet — tailor one first from the review panel.
      </p>
    );
  }

  const isReparsing = reparse.isPending;
  const initialSection = (section ?? undefined) as BuilderSection | undefined;

  return (
    <div className="space-y-4">
      {isReparsing ? (
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-green/10 px-3 py-1.5 text-[12.5px] font-semibold text-[#065f46]">
          <SpinnerIcon className="animate-spin w-4 h-4" />
          Auto-filling from the tailored text…
        </div>
      ) : null}
      <CvEditor value={draft} onChange={setDraft} initialSection={initialSection} />
      {error ? <div className="text-[13px] text-red-600">{error}</div> : null}
      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-gray-100 pt-3">
        <Button onClick={save} disabled={patch.isPending}>
          {patch.isPending ? (
            <span className="inline-flex items-center gap-2">
              <SpinnerIcon /> Saving…
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <SparklesIcon className="w-4 h-4" />
              Save & close
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
