import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { QuestionnaireAnswers } from '@artemis/shared';

/**
 * Client-side scratchpad for the merged onboarding CV builder.
 *
 * The builder is a two-step wizard: the user fills in basics on
 * /onboarding/cv/basics, then optionally pastes a JD on /onboarding/cv/jd.
 * We stash the answers here (with localStorage persistence) so:
 *   1. Going Back from the JD step preserves what the user typed.
 *   2. A page refresh between the two steps doesn't lose work.
 *   3. We don't need an extra BE round-trip just to hold a draft.
 *
 * Cleared once the CV has been generated (on success in the JD step).
 */
interface CvBuilderDraftState {
  answers: QuestionnaireAnswers | null;
  setAnswers(answers: QuestionnaireAnswers): void;
  clear(): void;
}

export const useCvBuilderDraftStore = create<CvBuilderDraftState>()(
  persist(
    (set) => ({
      answers: null,
      setAnswers(answers) {
        set({ answers });
      },
      clear() {
        set({ answers: null });
      },
    }),
    {
      name: 'artemis.cvBuilderDraft',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
