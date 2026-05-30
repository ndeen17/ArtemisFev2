/**
 * Per-level seniority rubric + role × level guidance. Promoted from
 * the v2 prompt module so v3 prompts (and any future surface) can import
 * without reaching into `utils/prompts.ts`.
 *
 * Verbs lists are exhaustive enough to anchor the LLM but not so long
 * they dilute the signal. FORBIDDEN SUGGESTIONS keep the model from
 * proposing scope-inflating rewrites that would set the candidate up to
 * be caught misrepresenting themselves at interview.
 */

import type { ExperienceLevel, Role } from '../index.js';

export const SENIORITY_RUBRIC: Record<ExperienceLevel, string> = {
  student:
    'EXPECTED VERBS: contributed to, supported, built, learned, collaborated on, prototyped, researched.\nEXPECTED METRICS: course outcomes (grade/GPA, distinction), hackathon placements, project user counts, repo stars, dissertation scope.\nTYPICAL GAPS TO FLAG: missing relevant coursework, no internships or work placements, no portfolio/GitHub link, weak summary positioning them for their first role.\nFORBIDDEN SUGGESTIONS: "add a leadership bullet", "quantify team size you led", "show P&L ownership", "demonstrate executive presence", "highlight strategic direction", "add a mentorship example" (unless they peer-mentored, in which case frame as "supported" not "led").',
  entry:
    'EXPECTED VERBS: built, shipped, contributed, improved, collaborated, supported, automated, debugged, implemented.\nEXPECTED METRICS: PR/ticket counts, individual feature impact (latency, conversion, errors), time-to-merge, on-call incidents resolved, test coverage delta.\nTYPICAL GAPS TO FLAG: missing internship/first-job outcomes, no quantified individual impact, generic skill list, no evidence of testing/debugging rigour, weak summary.\nFORBIDDEN SUGGESTIONS: "led a team", "owned a roadmap", "managed a budget", "directed strategy", "mentored multiple juniors", "set technical direction", "hired engineers". Use "supported" or "contributed to" for any collaborative wins, never "led".',
  mid:
    'EXPECTED VERBS: led (one initiative), owned, drove, mentored 1-2, shipped end-to-end, partnered with, coordinated, designed, refactored.\nEXPECTED METRICS: feature-level business impact, cross-team coordination wins, reliability/on-call improvements, mentee outcomes, design-doc throughput.\nTYPICAL GAPS TO FLAG: bullets describe execution but not ownership, no cross-team or mentorship signal, missing quantified business outcomes, generic seniority claim without evidence.\nFORBIDDEN SUGGESTIONS: "set company direction", "led the org", "hired and grew a team", "owned the P&L" — those are senior/lead claims.',
  senior:
    'EXPECTED VERBS: led, drove, owned, architected, mentored teams, set technical direction, hired, partnered with leadership.\nEXPECTED METRICS: org-level impact, $/ARR ownership, hiring/promotion impact, multi-team coordination, platform-level reliability, design-review throughput.\nTYPICAL GAPS TO FLAG: under-represented scope (bullets read mid-level despite the title), missing mentorship/hiring signal, no clear architecture or technical-direction example, weak business outcomes.\nFORBIDDEN SUGGESTIONS: none specific — senior verbs are the natural ceiling for IC framing. If a candidate already shows lead-level scope, the suggestion should be to surface that more clearly, not to add more.',
  lead:
    'EXPECTED VERBS: set strategy, hired and grew, led leads, drove org outcomes, built the team, partnered with executives, defined the bet.\nEXPECTED METRICS: headcount grown, multi-team or org-wide scope, P&L or revenue ownership, strategic outcomes, retention/promotion rates.\nTYPICAL GAPS TO FLAG: missing strategic narrative, no org-level outcomes, bullets still read individual-contributor, no team-growth or hiring evidence.\nFORBIDDEN SUGGESTIONS: none — lead verbs are the ceiling. If the CV reads junior despite the level claim, flag that as a gap, not by suggesting new lead claims.',
};

export const ROLE_LEVEL_GUIDANCE: Record<Role, Record<ExperienceLevel, string>> = {
  software_engineer: {
    student:
      'Strong student SWEs show 1-2 substantive projects (hackathon, open source, coursework) with concrete tech stack, user or performance metrics, and clear individual contributions — not team leadership.',
    entry:
      'Strong entry SWEs show 1-2 shipped features with measurable user or performance impact, clear ownership of a sub-system, and evidence of debugging and testing rigour — not roadmap or team leadership.',
    mid:
      'Strong mid SWEs show end-to-end ownership of a feature area, cross-team collaboration, mentorship of 1-2 juniors, and quantified business or reliability impact.',
    senior:
      'Strong senior SWEs show technical leadership (architecture decisions, RFCs, hiring panels), multi-team or platform impact, team mentorship, and direct contribution to org-level outcomes.',
    lead:
      'Strong lead SWEs show strategic technical direction, team or org growth (hiring, headcount, structure), and demonstrable business outcomes tied to engineering bets.',
  },
  product_manager: {
    student:
      'Strong student PMs show user research, prototype iteration, and clear problem framing on coursework or club projects — not roadmap ownership.',
    entry:
      'Strong entry PMs show feature-level user research, A/B test outcomes, and cross-functional collaboration on one product area — not full roadmap ownership.',
    mid:
      'Strong mid PMs show end-to-end ownership of a product area, a defined and shipped roadmap, prioritisation across squads, and work tied to revenue or retention metrics.',
    senior:
      'Strong senior PMs show multi-product or platform ownership, strategic prioritisation, hiring and mentoring, and direct revenue or retention outcomes.',
    lead:
      'Strong lead PMs show portfolio-level strategy, org-structure decisions, executive stakeholder management, and P&L-level outcomes.',
  },
  designer: {
    student:
      'Strong student designers show 2-3 portfolio projects with process artefacts (research, wireframes, iteration) — not "led design system" claims.',
    entry:
      'Strong entry designers show shipped flows on one product, design-system contributions, usability testing rounds, and pre/post metrics — not team leadership.',
    mid:
      'Strong mid designers show end-to-end ownership of a product area, mentorship of juniors, design-system stewardship, and quantified user or business impact.',
    senior:
      'Strong senior designers show multi-product or platform-wide visual language ownership, cross-team leadership, hiring, and strategic design direction.',
    lead:
      'Strong lead designers show org-level design vision, team growth, executive partnership, and brand- or product-suite-wide outcomes.',
  },
  data_analyst: {
    student:
      'Strong student analysts show 1-2 end-to-end projects (Kaggle, coursework, internship) with a clear question, dataset, method, and finding — not "led analytics team".',
    entry:
      'Strong entry analysts show recurring dashboards, ad-hoc analyses tied to product decisions, and quantified accuracy or efficiency improvements — not strategic leadership.',
    mid:
      'Strong mid analysts show experiment design ownership, cross-team partnerships, mentorship of 1-2 juniors, and business decisions driven by their analysis.',
    senior:
      'Strong senior analysts show analytics-platform decisions, multi-team partnerships, hiring, and direct revenue or retention impact from experiments and models.',
    lead:
      'Strong lead analysts show data strategy across the org, team growth, executive partnership, and measurable business outcomes from analytics bets.',
  },
};

/**
 * Whole-word regex used by post-validation guard rails to detect leadership
 * framings the LLM might suggest even when the candidate's stated level is
 * too junior to claim them. Centralised here so the prompt-side FORBIDDEN
 * SUGGESTIONS list and the server-side filter stay in lockstep.
 */
export const JUNIOR_FORBIDDEN_VERBS_REGEX =
  /\b(led|leading|owned|owning|managed|managing|spearhead\w*|directed|directing|oversaw|overseeing)\b/i;
