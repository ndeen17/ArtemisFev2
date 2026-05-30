/**
 * `cvFeatures/` — Layer-1 deterministic feature extractors.
 *
 * Pure functions only; no I/O, no Express, no Mongoose. Composable inputs to
 * the LLM analyse prompt's CV STRUCTURE block and to `cvRubric.ts`.
 *
 * NOTE: the frontend only mirrors the subset of cvFeatures it actually uses
 * (`gradedActionVerbBank`, consumed by `cvRubric.ts`). The remaining
 * extractors (bulletFeatures, bulletStarComponents, tenureCalc, structuralSpine)
 * live in the backend `_shared` only — the FE consumes their *outputs* (e.g.
 * `AnalysisResult.structuralScore`) via the schema, never their code.
 */

export * from './gradedActionVerbBank.js';
