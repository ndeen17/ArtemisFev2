/**
 * Phase 4 — Role-specific keyword ontology.
 *
 * Hand-curated priors for each `Role` enum value. Used in two places:
 *   1. CV Review: when there's no JD context, evaluate the CV against the
 *      keywords typically expected for the user's chosen role.
 *   2. JD analysis backfill: when the JD is sparse (hardRequirements < 5),
 *      merge in role priors so downstream tailoring still has a target.
 *
 * Curated by hand rather than scraped — quality over breadth. Treat as a
 * living asset; updates here should be reviewed in PRs.
 *
 * Keep three buckets per role:
 *   - core    : 20–30 high-value domain keywords (what the work *is*)
 *   - tooling : common tools / tech / platforms expected in postings
 *   - soft    : soft skills employers explicitly ask for
 */

import type { Role } from '../schemas/onboarding.js';

export interface RoleKeywords {
  core: string[];
  tooling: string[];
  soft: string[];
}

export const ROLE_KEYWORDS: Record<Role, RoleKeywords> = {
  software_engineer: {
    core: [
      'software engineering',
      'system design',
      'API design',
      'REST',
      'GraphQL',
      'microservices',
      'distributed systems',
      'data structures',
      'algorithms',
      'code review',
      'unit testing',
      'integration testing',
      'CI/CD',
      'observability',
      'performance optimization',
      'refactoring',
      'pair programming',
      'agile',
      'scrum',
      'version control',
      'database design',
      'caching',
      'authentication',
      'authorization',
      'security',
    ],
    tooling: [
      'TypeScript',
      'JavaScript',
      'Python',
      'Java',
      'Go',
      'Node.js',
      'React',
      'PostgreSQL',
      'Redis',
      'Docker',
      'Kubernetes',
      'AWS',
      'GCP',
      'Git',
      'GitHub Actions',
      'Jest',
    ],
    soft: [
      'collaboration',
      'mentoring',
      'communication',
      'ownership',
      'problem solving',
      'cross-functional',
    ],
  },
  product_manager: {
    core: [
      'product strategy',
      'roadmap',
      'discovery',
      'user research',
      'customer interviews',
      'requirements',
      'product requirements document',
      'prioritisation',
      'OKRs',
      'KPIs',
      'metrics',
      'A/B testing',
      'experimentation',
      'go-to-market',
      'product marketing',
      'stakeholder management',
      'backlog',
      'user stories',
      'roadmapping',
      'competitive analysis',
      'pricing',
      'positioning',
      'product analytics',
      'launch',
      'lifecycle management',
    ],
    tooling: [
      'Jira',
      'Confluence',
      'Figma',
      'Amplitude',
      'Mixpanel',
      'Looker',
      'SQL',
      'Notion',
      'Productboard',
    ],
    soft: [
      'leadership',
      'storytelling',
      'communication',
      'cross-functional',
      'influence without authority',
      'commercial acumen',
    ],
  },
  designer: {
    core: [
      'user experience',
      'user interface',
      'interaction design',
      'visual design',
      'design systems',
      'prototyping',
      'wireframing',
      'user research',
      'usability testing',
      'accessibility',
      'WCAG',
      'information architecture',
      'design thinking',
      'user journeys',
      'personas',
      'heuristic evaluation',
      'responsive design',
      'mobile-first',
      'design tokens',
      'typography',
      'colour theory',
      'micro-interactions',
      'motion design',
      'design critique',
    ],
    tooling: [
      'Figma',
      'Sketch',
      'Adobe XD',
      'Photoshop',
      'Illustrator',
      'After Effects',
      'Framer',
      'Miro',
      'Notion',
    ],
    soft: [
      'collaboration',
      'communication',
      'storytelling',
      'critique',
      'attention to detail',
      'empathy',
    ],
  },
  data_analyst: {
    core: [
      'data analysis',
      'data modelling',
      'data visualisation',
      'dashboards',
      'reporting',
      'KPIs',
      'metrics',
      'ETL',
      'data cleaning',
      'data quality',
      'statistical analysis',
      'A/B testing',
      'cohort analysis',
      'regression',
      'forecasting',
      'segmentation',
      'experiment design',
      'stakeholder management',
      'storytelling with data',
      'business intelligence',
      'data warehousing',
      'ad-hoc analysis',
      'anomaly detection',
      'attribution',
    ],
    tooling: [
      'SQL',
      'Python',
      'pandas',
      'R',
      'Excel',
      'Tableau',
      'Power BI',
      'Looker',
      'dbt',
      'BigQuery',
      'Snowflake',
      'Redshift',
      'Google Analytics',
    ],
    soft: [
      'communication',
      'curiosity',
      'attention to detail',
      'cross-functional',
      'storytelling',
      'critical thinking',
    ],
  },
};

/** Flat list of all keywords for a role (core + tooling + soft), de-duplicated. */
export function allKeywordsForRole(role: Role): string[] {
  const r = ROLE_KEYWORDS[role];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of [...r.core, ...r.tooling, ...r.soft]) {
    const lc = k.toLowerCase();
    if (seen.has(lc)) continue;
    seen.add(lc);
    out.push(k);
  }
  return out;
}

/** Look up role priors with safe fallback to `other`. */
export function rolePriors(role: Role | null | undefined): RoleKeywords {
  if (!role) return ROLE_KEYWORDS.software_engineer;
  return ROLE_KEYWORDS[role] ?? ROLE_KEYWORDS.software_engineer;
}
