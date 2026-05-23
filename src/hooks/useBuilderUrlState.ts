import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Single source of truth for inline-builder state.
 *
 * URL params:
 *   ?builder=1            — builder pane open
 *   &section=<id>         — initial editor section (header|summary|experience|education|skills)
 *   &focus=<actionId>     — action plan item being addressed; resolved to its section
 *   &itemId=<cvItemId>    — specific Experience/Education item id to scroll to & flash inside the section
 *   &coach=1              — open the AI coach drawer on mount, prefilled with the action seed
 *
 * Old hash anchors (#summary etc) are not honoured — replace with `section=` for clarity
 * and back/forward parity.
 */
export type BuilderSection =
  | 'header'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills';

export interface BuilderState {
  isOpen: boolean;
  section: BuilderSection | null;
  focus: string | null;
  itemId: string | null;
  coachOpen: boolean;
}

export interface OpenBuilderOptions {
  section?: BuilderSection;
  focus?: string;
  itemId?: string;
  coach?: boolean;
}

const VALID_SECTIONS: ReadonlySet<string> = new Set([
  'header',
  'summary',
  'experience',
  'education',
  'skills',
]);

export function useBuilderUrlState() {
  const [params, setParams] = useSearchParams();

  const state = useMemo<BuilderState>(() => {
    const sectionRaw = params.get('section');
    const section = sectionRaw && VALID_SECTIONS.has(sectionRaw) ? (sectionRaw as BuilderSection) : null;
    return {
      isOpen: params.get('builder') === '1',
      section,
      focus: params.get('focus'),
      itemId: params.get('itemId'),
      coachOpen: params.get('coach') === '1',
    };
  }, [params]);

  const open = useCallback(
    (opts: OpenBuilderOptions = {}) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('builder', '1');
          if (opts.section) next.set('section', opts.section);
          else next.delete('section');
          if (opts.focus) next.set('focus', opts.focus);
          else next.delete('focus');
          if (opts.itemId) next.set('itemId', opts.itemId);
          else next.delete('itemId');
          if (opts.coach) next.set('coach', '1');
          else next.delete('coach');
          return next;
        },
        { replace: false },
      );
    },
    [setParams],
  );

  const close = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('builder');
        next.delete('section');
        next.delete('focus');
        next.delete('itemId');
        next.delete('coach');
        return next;
      },
      { replace: false },
    );
  }, [setParams]);

  return { state, open, close };
}
