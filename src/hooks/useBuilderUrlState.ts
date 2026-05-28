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
 *   &bulletIdx=<n>        — 0-based bullet index inside the targeted Experience role; scrolls + focuses the bullet textarea
 *   &field=<name>         — named input inside a non-itemised section (e.g. header `fullName`/`email`/`headline`/`location`); scrolls + focuses the input
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
  bulletIndex: number | null;
  field: string | null;
}

export interface OpenBuilderOptions {
  section?: BuilderSection;
  focus?: string;
  itemId?: string;
  bulletIndex?: number | null;
  field?: string;
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
    const bulletIdxRaw = params.get('bulletIdx');
    const parsedIdx = bulletIdxRaw !== null ? Number.parseInt(bulletIdxRaw, 10) : NaN;
    const bulletIndex = Number.isInteger(parsedIdx) && parsedIdx >= 0 ? parsedIdx : null;
    return {
      isOpen: params.get('builder') === '1',
      section,
      focus: params.get('focus'),
      itemId: params.get('itemId'),
      bulletIndex,
      field: params.get('field'),
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
          if (typeof opts.bulletIndex === 'number' && opts.bulletIndex >= 0) {
            next.set('bulletIdx', String(opts.bulletIndex));
          } else {
            next.delete('bulletIdx');
          }
          if (opts.field) next.set('field', opts.field);
          else next.delete('field');
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
        next.delete('bulletIdx');
        next.delete('field');
        return next;
      },
      { replace: false },
    );
  }, [setParams]);

  return { state, open, close };
}
