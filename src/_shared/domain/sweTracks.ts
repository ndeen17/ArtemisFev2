/**
 * `sweTracks` — Phase 1 SWE sub-track ontology.
 *
 * Plan reference: deep on SWE sub-tracks first (FE / BE / ML / Infra-DevOps /
 * Data). Per track we capture:
 *   - `coreSkillUris`     — 15–25 ESCO skill URIs that anchor the track.
 *                            Placeholders today (Phase 1a stub), resolvable
 *                            to live ESCO records once `skillCanonicalise`
 *                            is backed by the corpus (Phase 1b).
 *   - `expectedTooling`   — per-level toolchain expected on a CV in the track.
 *                            Used by `analyseCv` to flag missing tooling for
 *                            the candidate's experience level.
 *   - `signatureDeliverables` — per-level work-product signals the LLM should
 *                                look for ("shipped X", "owned Y") instead
 *                                of treating every bullet equally.
 *   - `bannedJuniorVerbs` — verbs that read as inflated for entry / student
 *                            level in this track (e.g. an entry FE candidate
 *                            "architected the design system" is suspicious).
 *                            Used alongside the global banned-verb guard.
 *   - `interviewArchetypes` — per InterviewType the question archetypes that
 *                              should anchor session planning (Phase 4).
 *
 * No I/O, no Express, no Mongoose — pure hand-built data. Updates here are
 * reviewed in PRs like any other domain constant.
 */

import type { InterviewType } from '../schemas/interview.js';

export const SWE_TRACKS = [
  'frontend',
  'backend',
  'ml',
  'infra_devops',
  'data',
  'general',
] as const;
export type SweTrack = (typeof SWE_TRACKS)[number];

export type SweLevel = 'student' | 'entry' | 'mid' | 'senior' | 'lead';

export interface SweTrackProfile {
  /** Short human label used in copy + prompts. */
  label: string;
  /** Long form for prompt grounding. */
  description: string;
  /** ESCO skill URIs — Phase 1a placeholders (esco:skill/<canonical-slug>);
   *  Phase 1b will rewrite to live `http://data.europa.eu/esco/skill/...` URIs
   *  during ingest. Order is significance-ranked. */
  coreSkillUris: string[];
  expectedTooling: Record<SweLevel, string[]>;
  signatureDeliverables: Record<SweLevel, string[]>;
  bannedJuniorVerbs: string[];
  /** Per InterviewType, the question archetypes that anchor session planning. */
  interviewArchetypes: Partial<Record<InterviewType, string[]>>;
}

/** Phase 1a placeholder ESCO URI helper. Single point of change for Phase 1b. */
function escoSkill(slug: string): string {
  return `esco:skill/${slug}`;
}

export const SWE_TRACK_PROFILES: Record<SweTrack, SweTrackProfile> = {
  frontend: {
    label: 'Frontend engineer',
    description:
      'Builds user-facing web or mobile interfaces. Strong on component architecture, ' +
      'state management, accessibility, performance, and the browser/runtime platform.',
    coreSkillUris: [
      'http://data.europa.eu/esco/skill/3cd569a2-4f88-4c1e-9995-8dce8c5e51a7',
      'http://data.europa.eu/esco/skill/867137fb-ff1b-4ca3-99f3-cb6969aa2c68',
      'http://data.europa.eu/esco/skill/0af062de-eb43-41e9-9b96-249e2cd22d26',
      'http://data.europa.eu/esco/skill/c2999f0c-eb37-4cdf-b9b0-82107b628794',
      'http://data.europa.eu/esco/skill/9b9de2a4-d8af-4a7b-933a-a8334ae60067',
      'http://data.europa.eu/esco/skill/2450c3b3-e78e-435b-b84d-e05d984e71dc',
      'http://data.europa.eu/esco/skill/2b7a79e5-84d8-4880-be66-3d9bb05bea17',
      'http://data.europa.eu/esco/skill/3e23db60-0c3d-498a-a6ac-ffbed0ecb033',
      escoSkill('web-performance'),
      'http://data.europa.eu/esco/skill/6ad40ca3-dc34-4442-b23f-0b1b28936f56',
      'http://data.europa.eu/esco/skill/69bbd53f-fbb0-4476-b4b2-ef7844464e28',
      'http://data.europa.eu/esco/skill/7961413f-61d0-4722-9cd9-20a050a29899',
      'http://data.europa.eu/esco/skill/9d2e926f-53d9-41f5-98f3-19dfaa687f3f',
      'http://data.europa.eu/esco/skill/1019423b-3368-4f83-b24f-19e5fa23e816',
      'http://data.europa.eu/esco/skill/6e4f75b4-c60f-4623-a9ba-760c8245753b',
    ],
    expectedTooling: {
      student: ['HTML', 'CSS', 'JavaScript', 'Git'],
      entry: ['React', 'TypeScript', 'Jest', 'Webpack or Vite', 'Git', 'npm'],
      mid: ['React', 'TypeScript', 'Next.js', 'Storybook', 'Cypress or Playwright', 'CI/CD'],
      senior: [
        'React',
        'TypeScript',
        'Next.js',
        'Design systems',
        'Performance profiling',
        'A11y auditing',
        'GraphQL or tRPC',
      ],
      lead: [
        'Architecture decision records',
        'Cross-team design-system ownership',
        'Web vitals + RUM',
        'Migration leadership',
      ],
    },
    signatureDeliverables: {
      student: ['Coursework project', 'Personal portfolio site'],
      entry: ['Shipped feature in a production app', 'Component tests with coverage'],
      mid: [
        'Owned a feature area end-to-end',
        'Shipped accessibility improvements with measurable lift',
        'Drove a perf win (LCP / INP) with numbers',
      ],
      senior: [
        'Led a framework or rendering migration',
        'Owned a design system used across squads',
        'Set frontend tech direction for a product area',
      ],
      lead: [
        'Set frontend architecture across multiple product areas',
        'Hired and grew a frontend team',
        'Drove cross-org performance or a11y standards',
      ],
    },
    bannedJuniorVerbs: ['architected', 'spearheaded', 'pioneered', 'governed'],
    interviewArchetypes: {
      technical_role: [
        'component-design',
        'state-management-tradeoffs',
        'browser-rendering',
        'accessibility-edge-cases',
        'performance-debugging',
      ],
      system_design: ['design-a-design-system', 'design-a-data-table-at-scale', 'realtime-ui-sync'],
      behavioral: ['cross-functional-design-collab', 'shipping-under-deadline'],
      jd_targeted: ['stack-match', 'framework-experience-depth'],
    },
  },

  backend: {
    label: 'Backend engineer',
    description:
      'Designs and operates server-side systems: APIs, services, data storage, async pipelines. ' +
      'Strong on system design, persistence, consistency, and operational concerns.',
    coreSkillUris: [
      'http://data.europa.eu/esco/skill/b0096dc5-2e2d-4bc1-8172-05bf486c3968',
      'http://data.europa.eu/esco/skill/6e4f75b4-c60f-4623-a9ba-760c8245753b',
      'http://data.europa.eu/esco/skill/7369f779-4b71-4aab-8836-48b69c676eec',
      'http://data.europa.eu/esco/skill/598de5b0-5b58-4ea7-8058-a4bc4d18c742',
      'http://data.europa.eu/esco/skill/76ef6ed3-1658-4a1a-9593-204d799c6d0c',
      'http://data.europa.eu/esco/skill/897b393f-e7e0-4248-a40d-d77119694e83',
      escoSkill('caching'),
      escoSkill('message-queues'),
      'http://data.europa.eu/esco/skill/33efa504-2f26-424d-b662-cee77e6e9c93',
      'http://data.europa.eu/esco/skill/5da73370-f6b9-417d-a94c-09bf01f84aa2',
      'http://data.europa.eu/esco/skill/8efa6a7a-6556-4cb8-908d-59d3b5c58d2f',
      'http://data.europa.eu/esco/skill/7961413f-61d0-4722-9cd9-20a050a29899',
      escoSkill('idempotency'),
      'http://data.europa.eu/esco/skill/25b291b5-8245-4d9d-b391-86a8a31d7109',
      'http://data.europa.eu/esco/skill/f7e2eb04-3e50-4561-bce1-7e51a1fec308',
    ],
    expectedTooling: {
      student: ['Python or JavaScript', 'SQL basics', 'Git'],
      entry: ['Node.js or Python or Java', 'Postgres', 'REST', 'Git', 'Docker basics'],
      mid: ['Postgres', 'Redis', 'Docker', 'CI/CD', 'OpenAPI', 'Pino or equivalent logging'],
      senior: [
        'Service architecture',
        'Database migrations at scale',
        'Tracing (OpenTelemetry)',
        'Queue / pub-sub (Kafka, SQS, etc.)',
        'On-call leadership',
      ],
      lead: [
        'Multi-service platform ownership',
        'Cross-team API standards',
        'Capacity planning',
        'Incident command',
      ],
    },
    signatureDeliverables: {
      student: ['Coursework project with a database', 'Toy REST API'],
      entry: ['Shipped a CRUD service in production', 'Wrote unit + integration tests'],
      mid: [
        'Owned a service end-to-end (design + ship + on-call)',
        'Shipped a non-trivial migration with zero downtime',
        'Drove a measurable latency or cost win',
      ],
      senior: [
        'Led a multi-service refactor (e.g. monolith split)',
        'Designed a system from scratch with explicit tradeoffs',
        'Owned reliability for a critical path',
      ],
      lead: [
        'Set backend architecture across teams',
        'Hired and grew a backend team',
        'Drove cross-team SLO / on-call standards',
      ],
    },
    bannedJuniorVerbs: ['architected', 'spearheaded', 'pioneered', 'governed'],
    interviewArchetypes: {
      technical_role: [
        'api-design',
        'idempotency',
        'database-tradeoffs',
        'concurrency-edge-cases',
        'caching-strategy',
      ],
      system_design: [
        'design-a-rate-limiter',
        'design-a-payments-service',
        'design-a-notifications-service',
        'design-a-url-shortener',
      ],
      behavioral: ['on-call-incident', 'cross-service-migration'],
      jd_targeted: ['stack-match', 'scale-experience-depth'],
    },
  },

  ml: {
    label: 'Machine-learning engineer',
    description:
      'Trains and ships ML / DL models in production. Strong on data pipelines, training ' +
      'infra, evaluation, and the productionisation gap between notebooks and services.',
    coreSkillUris: [
      'http://data.europa.eu/esco/skill/ccd0a1d9-afda-43d9-b901-96344886e14d',
      'http://data.europa.eu/esco/skill/3a2d5b45-56e4-4f5a-a55a-4a4a65afdc43',
      'http://data.europa.eu/esco/skill/ecc4552a-92c5-4222-b18d-faf5ac841080',
      escoSkill('data-pipelines'),
      escoSkill('feature-engineering'),
      escoSkill('model-evaluation'),
      escoSkill('model-serving'),
      escoSkill('mlops'),
      escoSkill('experiment-tracking'),
      'http://data.europa.eu/esco/skill/7ee4c2ea-b349-4bd2-81a3-ec31475d4833',
      'http://data.europa.eu/esco/skill/5608d5a0-6d5e-43b7-be37-616501729bb4',
      escoSkill('tensorflow'),
      'http://data.europa.eu/esco/skill/5b26f08b-88bc-45f0-b901-530d7786466b',
      'http://data.europa.eu/esco/skill/97bd1c21-66b2-4b7e-ad0f-e3cda590e378',
      escoSkill('gpu-training'),
    ],
    expectedTooling: {
      student: ['Python', 'NumPy', 'pandas', 'scikit-learn', 'Jupyter'],
      entry: ['Python', 'PyTorch or TensorFlow', 'pandas', 'Git', 'scikit-learn'],
      mid: [
        'PyTorch or TensorFlow',
        'Experiment tracking (W&B, MLflow)',
        'Docker',
        'Cloud GPU (SageMaker, Vertex, etc.)',
        'Feature store basics',
      ],
      senior: [
        'Production model serving',
        'A/B testing of model variants',
        'Data versioning (DVC, LakeFS)',
        'Training pipeline orchestration',
      ],
      lead: [
        'ML platform ownership',
        'Eval harness ownership',
        'Cross-team modelling standards',
      ],
    },
    signatureDeliverables: {
      student: ['Coursework model on a public dataset', 'Kaggle entry or similar'],
      entry: ['Shipped a model in production', 'Built a simple training pipeline'],
      mid: [
        'Owned a model end-to-end (data + train + ship + monitor)',
        'Drove a measurable metric lift via modelling',
        'Built or maintained a feature pipeline',
      ],
      senior: [
        'Led a multi-model launch',
        'Owned model evaluation framework for a team',
        'Drove a production-quality regression detection process',
      ],
      lead: [
        'Set ML platform direction',
        'Hired and grew an ML team',
        'Owned cross-team modelling + eval standards',
      ],
    },
    bannedJuniorVerbs: ['architected', 'spearheaded', 'pioneered', 'governed'],
    interviewArchetypes: {
      technical_role: [
        'feature-engineering',
        'model-evaluation',
        'overfitting-debug',
        'data-leakage',
        'production-vs-notebook',
      ],
      system_design: [
        'design-an-ml-platform',
        'design-a-recommendation-service',
        'design-a-feature-store',
      ],
      behavioral: ['research-vs-shipping-tradeoff', 'cross-functional-with-product'],
      jd_targeted: ['stack-match', 'domain-experience-depth'],
    },
  },

  infra_devops: {
    label: 'Infrastructure / DevOps engineer',
    description:
      'Owns the platform that other engineers ship on: compute, networking, deploys, CI/CD, ' +
      'observability, reliability. Strong on cloud, automation, and operational practice.',
    coreSkillUris: [
      'http://data.europa.eu/esco/skill/bd14968e-e409-45af-b362-3495ed7b10e0',
      'http://data.europa.eu/esco/skill/d0c6d77e-cb25-4770-bf77-2073fc5f7523',
      escoSkill('containerisation'),
      escoSkill('kubernetes'),
      escoSkill('ci-cd'),
      'http://data.europa.eu/esco/skill/8efa6a7a-6556-4cb8-908d-59d3b5c58d2f',
      escoSkill('site-reliability-engineering'),
      'http://data.europa.eu/esco/skill/f9a6f35b-01a7-40c9-8b61-b6ee46f97272',
      'http://data.europa.eu/esco/skill/02058de6-4b98-449f-8a45-8588b0eb2446',
      'http://data.europa.eu/esco/skill/6f1edc19-191f-4ba5-a048-ee69aff05bab',
      'http://data.europa.eu/esco/skill/5ef0c719-5bcb-49f8-b8eb-824388225333',
      'http://data.europa.eu/esco/skill/7d35602d-bc94-4975-aa7c-f4e8e05ce8e0',
      'http://data.europa.eu/esco/skill/fc2f1d4f-a46f-471e-a618-cbd4d0496a53',
      escoSkill('incident-response'),
      'http://data.europa.eu/esco/skill/9d2e926f-53d9-41f5-98f3-19dfaa687f3f',
    ],
    expectedTooling: {
      student: ['Linux basics', 'Bash', 'Git'],
      entry: ['Docker', 'GitHub Actions or equivalent CI', 'AWS / GCP basics', 'Terraform basics'],
      mid: ['Kubernetes', 'Terraform', 'Prometheus / Grafana', 'OpenTelemetry', 'Helm'],
      senior: [
        'Multi-cluster Kubernetes',
        'IaC at scale',
        'SLO ownership',
        'Cost reporting',
        'On-call rotation leadership',
      ],
      lead: [
        'Platform architecture',
        'Cross-org incident command',
        'Cost + reliability governance',
        'Hiring + growing platform team',
      ],
    },
    signatureDeliverables: {
      student: ['Personal homelab project', 'Coursework Linux project'],
      entry: ['Built or maintained a CI pipeline', 'Shipped an IaC change to production'],
      mid: [
        'Owned a platform area end-to-end',
        'Drove a measurable reliability or cost win',
        'Led an incident as IC',
      ],
      senior: [
        'Led a multi-service migration (cluster, region, vendor)',
        'Owned SLOs for a critical path',
        'Drove a major incident as commander',
      ],
      lead: [
        'Set platform direction across teams',
        'Owned cross-team reliability + cost governance',
        'Built and grew a platform team',
      ],
    },
    bannedJuniorVerbs: ['architected', 'spearheaded', 'pioneered', 'governed'],
    interviewArchetypes: {
      technical_role: [
        'kubernetes-debug',
        'ci-pipeline-design',
        'iac-tradeoffs',
        'observability-deep-dive',
        'cost-vs-reliability',
      ],
      system_design: [
        'design-a-deploy-pipeline',
        'design-a-multi-region-platform',
        'design-an-observability-stack',
      ],
      behavioral: ['incident-leadership', 'on-call-rotation-improvement'],
      jd_targeted: ['stack-match', 'scale-experience-depth'],
    },
  },

  data: {
    label: 'Data engineer',
    description:
      'Builds and operates data platforms: ingestion, transformation, warehousing, and the ' +
      'tooling analysts and ML teams consume. Strong on SQL, modelling, and pipeline reliability.',
    coreSkillUris: [
      'http://data.europa.eu/esco/skill/598de5b0-5b58-4ea7-8058-a4bc4d18c742',
      'http://data.europa.eu/esco/skill/fecf8a0d-62c4-4e71-9b03-0f4fc2ad7bf5',
      'http://data.europa.eu/esco/skill/9d0d89be-bffa-4393-b6f6-8d05bea49051',
      'http://data.europa.eu/esco/skill/3ec2e4d6-7000-4905-bf1a-c5b1679416de',
      escoSkill('data-pipelines'),
      escoSkill('streaming-data'),
      escoSkill('batch-processing'),
      'http://data.europa.eu/esco/skill/713fb616-118e-40bc-9366-4a69879a49d5',
      'http://data.europa.eu/esco/skill/ccd0a1d9-afda-43d9-b901-96344886e14d',
      'http://data.europa.eu/esco/skill/ffddfc7c-a9dd-449f-9e96-882dc447c8b6',
      escoSkill('apache-spark'),
      'http://data.europa.eu/esco/skill/9ff9db9d-d14b-426e-83f3-e7449af6c79f',
      escoSkill('airflow'),
      'http://data.europa.eu/esco/skill/bd14968e-e409-45af-b362-3495ed7b10e0',
      'http://data.europa.eu/esco/skill/9cf681c7-89ec-470c-b651-7fe03786f586',
    ],
    expectedTooling: {
      student: ['SQL', 'Python', 'pandas', 'Git'],
      entry: ['SQL', 'Python', 'dbt or Airflow basics', 'Warehouse (Snowflake / BigQuery / Redshift)'],
      mid: ['dbt', 'Airflow or Dagster', 'Spark', 'Data quality testing', 'CI/CD for data'],
      senior: [
        'Streaming (Kafka, Flink)',
        'Lakehouse architecture',
        'Data contracts',
        'Cost optimisation on warehouse',
      ],
      lead: [
        'Multi-team data platform ownership',
        'Cross-team data modelling standards',
        'Governance + privacy controls',
      ],
    },
    signatureDeliverables: {
      student: ['Coursework data project', 'Personal SQL portfolio'],
      entry: ['Built and operated a pipeline in production', 'Owned a small set of dbt models'],
      mid: [
        'Owned a domain warehouse / mart end-to-end',
        'Drove a measurable cost or latency win on the warehouse',
        'Built or led a data-quality initiative',
      ],
      senior: [
        'Led a lakehouse or streaming rollout',
        'Owned data contracts for a critical path',
        'Drove a multi-team modelling standard',
      ],
      lead: [
        'Set data platform direction',
        'Hired and grew a data engineering team',
        'Owned cross-org governance and privacy',
      ],
    },
    bannedJuniorVerbs: ['architected', 'spearheaded', 'pioneered', 'governed'],
    interviewArchetypes: {
      technical_role: [
        'sql-optimisation',
        'data-modelling-tradeoffs',
        'streaming-vs-batch',
        'data-quality-strategy',
        'warehouse-cost-debug',
      ],
      system_design: [
        'design-a-lakehouse',
        'design-an-ingestion-pipeline',
        'design-a-data-contract-system',
      ],
      behavioral: ['cross-functional-with-analytics', 'data-incident-leadership'],
      jd_targeted: ['stack-match', 'domain-experience-depth'],
    },
  },

  general: {
    label: 'Software engineer (general)',
    description:
      'Fallback profile used when sub-track inference confidence is low. Captures the ' +
      'union of expectations that hold across SWE tracks at a given level.',
    coreSkillUris: [
      escoSkill('software-engineering'),
      'http://data.europa.eu/esco/skill/54924a2c-daca-40d3-9716-4b38ceb04f38',
      'http://data.europa.eu/esco/skill/21d2f96d-35f7-4e3f-9745-c533d2dd6e97',
      'http://data.europa.eu/esco/skill/9d1b08b3-ba1e-41f6-a466-1ac1e62eb5f0',
      'http://data.europa.eu/esco/skill/85f46538-ae70-498a-bfbc-b8ddafe96c7d',
      'http://data.europa.eu/esco/skill/9d2e926f-53d9-41f5-98f3-19dfaa687f3f',
      'http://data.europa.eu/esco/skill/2522a6ce-3202-4ac8-9f5b-b9cb5a3a83a1',
      'http://data.europa.eu/esco/skill/38716afc-a93b-44ab-96cc-2ecf67edcf32',
      'http://data.europa.eu/esco/skill/2636b3d3-843e-46a9-8b4c-a9d6ca3f5a2d',
      'http://data.europa.eu/esco/skill/0a9acb6b-1139-4be9-b431-3a80a959f2f4',
    ],
    expectedTooling: {
      student: ['Any mainstream language', 'Git'],
      entry: ['Any mainstream language', 'Git', 'Unit testing framework', 'CI basics'],
      mid: ['Production language fluency', 'Test pyramid awareness', 'CI/CD', 'Code review practice'],
      senior: ['Multiple languages or stacks', 'Design + review fluency', 'Mentorship track record'],
      lead: ['Cross-team technical direction', 'Hiring + growing a team'],
    },
    signatureDeliverables: {
      student: ['Coursework or personal project'],
      entry: ['Shipped feature in production', 'Wrote tests'],
      mid: ['Owned a feature area', 'Drove a measurable improvement'],
      senior: ['Led a non-trivial project', 'Mentored engineers'],
      lead: ['Set technical direction', 'Grew a team'],
    },
    bannedJuniorVerbs: ['architected', 'spearheaded', 'pioneered', 'governed'],
    interviewArchetypes: {
      technical_role: ['fundamentals', 'debugging', 'tradeoffs'],
      system_design: ['design-a-simple-service'],
      behavioral: ['collaboration', 'growth', 'ownership'],
    },
  },
};

/**
 * Infer the most-likely SWE sub-track from a set of canonicalised skill URIs.
 *
 * Plan rule: take the overlap with `coreSkillUris` per track; pick the
 * highest; if confidence (overlap / track-size) is below
 * `MIN_TRACK_CONFIDENCE`, fall back to `'general'`.
 *
 * Pure function, deterministic, easy to unit-test. Input expects already-
 * canonicalised skill URIs (output of `skillCanonicalise`); during Phase 1a
 * those are all `null` so this will always return `'general'` until Phase 1b.
 */
export const MIN_TRACK_CONFIDENCE = 0.2;

export interface InferredSweTrack {
  track: SweTrack;
  confidence: number;
  /** Per-track overlap scores, useful for debugging + future LLM prompting. */
  scores: Record<SweTrack, number>;
}

export function inferSweTrack(skillUris: readonly string[]): InferredSweTrack {
  const skillSet = new Set(skillUris.filter((s) => typeof s === 'string' && s.length > 0));
  const scores = {} as Record<SweTrack, number>;
  for (const track of SWE_TRACKS) {
    if (track === 'general') {
      scores[track] = 0;
      continue;
    }
    const profile = SWE_TRACK_PROFILES[track];
    const core = profile.coreSkillUris;
    if (core.length === 0) {
      scores[track] = 0;
      continue;
    }
    let hits = 0;
    for (const uri of core) {
      if (skillSet.has(uri)) hits += 1;
    }
    scores[track] = hits / core.length;
  }

  // Pick the highest-scoring real track.
  let best: SweTrack = 'general';
  let bestScore = 0;
  for (const track of SWE_TRACKS) {
    if (track === 'general') continue;
    if (scores[track] > bestScore) {
      best = track;
      bestScore = scores[track];
    }
  }
  if (bestScore < MIN_TRACK_CONFIDENCE) {
    return { track: 'general', confidence: bestScore, scores };
  }
  return { track: best, confidence: bestScore, scores };
}

/**
 * Phase 1a bridge — infer a SWE sub-track from RAW skill strings, without
 * needing the ESCO corpus / canonicalise resolver. Tooling lists are the
 * cheapest proxy for track membership we already maintain by hand.
 *
 * Algorithm: lowercase every input skill, and for each track count how many
 * unique tooling entries (across all levels) appear as a substring of any
 * input skill (or vice-versa). Score = matched / unique-track-tooling-count.
 *
 * Used by `analyseCvPrompt` until Phase 1b wires URI-based inference. Once
 * `skillCanonicalise` returns real URIs, callers should switch to
 * `inferSweTrack` and delete the bridge call site.
 */
export function inferSweTrackFromText(rawSkills: readonly string[]): InferredSweTrack {
  const candidates = rawSkills
    .map((s) => (typeof s === 'string' ? s.trim().toLowerCase() : ''))
    .filter((s) => s.length > 0);
  const scores = {} as Record<SweTrack, number>;
  for (const track of SWE_TRACKS) {
    if (track === 'general') {
      scores[track] = 0;
      continue;
    }
    const profile = SWE_TRACK_PROFILES[track];
    const tooling = new Set<string>();
    for (const level of ['student', 'entry', 'mid', 'senior', 'lead'] as const) {
      for (const t of profile.expectedTooling[level]) {
        tooling.add(t.toLowerCase());
      }
    }
    if (tooling.size === 0) {
      scores[track] = 0;
      continue;
    }
    let hits = 0;
    for (const tool of tooling) {
      const matched = candidates.some(
        (c) => c === tool || c.includes(tool) || tool.includes(c),
      );
      if (matched) hits += 1;
    }
    scores[track] = hits / tooling.size;
  }
  let best: SweTrack = 'general';
  let bestScore = 0;
  for (const track of SWE_TRACKS) {
    if (track === 'general') continue;
    if (scores[track] > bestScore) {
      best = track;
      bestScore = scores[track];
    }
  }
  if (bestScore < MIN_TRACK_CONFIDENCE) {
    return { track: 'general', confidence: bestScore, scores };
  }
  return { track: best, confidence: bestScore, scores };
}

/**
 * Phase 1b.3 — hybrid inference. Combines inferSweTrack (ESCO URI overlap,
 * precise but limited by the 22 unresolved sweTracks placeholders) with
 * `inferSweTrackFromText` (tooling-substring bridge, recovers modern stack
 * tooling ESCO doesn't carry — Snowflake, Kubernetes, PyTorch, etc.).
 *
 * Per track, the final score is `max(uriScore, textScore)` so either signal
 * can carry the decision: a CV listing `Snowflake, dbt, Airflow` (zero ESCO
 * hits) still resolves to `data` via the text bridge, while a CV listing
 * canonical knowledge concepts resolves via URIs even when free-text tooling
 * phrasing differs from our hand-curated list.
 *
 * Returns `general` only when *both* signals fall below MIN_TRACK_CONFIDENCE.
 */
export function inferSweTrackHybrid(
  skillUris: readonly string[],
  rawSkills: readonly string[],
): InferredSweTrack {
  const fromUris = inferSweTrack(skillUris);
  const fromText = inferSweTrackFromText(rawSkills);
  const scores = {} as Record<SweTrack, number>;
  for (const track of SWE_TRACKS) {
    scores[track] = Math.max(fromUris.scores[track] ?? 0, fromText.scores[track] ?? 0);
  }
  let best: SweTrack = 'general';
  let bestScore = 0;
  for (const track of SWE_TRACKS) {
    if (track === 'general') continue;
    if (scores[track] > bestScore) {
      best = track;
      bestScore = scores[track];
    }
  }
  if (bestScore < MIN_TRACK_CONFIDENCE) {
    return { track: 'general', confidence: bestScore, scores };
  }
  return { track: best, confidence: bestScore, scores };
}