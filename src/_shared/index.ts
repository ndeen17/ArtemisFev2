/**
 * @artemis/shared — single source of truth for Zod schemas and TS types
 * shared between ArtemisFev2 (frontend) and ArtemisBev2 (backend).
 *
 * Add new schemas under src/schemas/<domain>.ts and re-export them here.
 */

export * from './schemas/common.js';
export * from './schemas/auth.js';
export * from './schemas/onboarding.js';
export * from './schemas/cv.js';
export * from './schemas/cvCoach.js';
export * from './schemas/cvBuilder.js';
export * from './schemas/analysis.js';
export * from './schemas/analysisChunks.js';
export * from './schemas/profile.js';
export * from './schemas/goal.js';
export * from './schemas/application.js';
export * from './schemas/refine.js';
export * from './schemas/interview.js';
export * from './schemas/interviewBank.js';
export * from './schemas/realtime.js';
export * from './schemas/findingFeedback.js';
export * from './domain/readiness.js';
export * from './domain/goalCopy.js';
export * from './domain/roleCopy.js';
export * from './domain/careerLevel.js';
export * from './domain/actionTargets.js';
export * from './domain/cvBullets.js';
export * from './domain/cvRubric.js';
export * from './domain/verbBank.js';
export * from './domain/atsScore.js';
export * from './domain/roleKeywords.js';
export * from './domain/seniorityRubric.js';
export * from './domain/scoreBand.js';