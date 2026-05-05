import type { Role } from '../schemas/onboarding.js';

/**
 * Human-readable labels for every Role enum value. Used wherever we surface
 * the user's career choice in copy (home hero, profile chip, settings, etc.).
 *
 * Single source of truth so a rename in one place updates everywhere — and so
 * roles that exist in the enum but aren't pickable in the onboarding cards
 * (e.g. legacy `marketing`, `sales`, `operations`, `other`) still render
 * sensibly when set via API or imported state.
 */
export const ROLE_LABELS: Record<Role, string> = {
  software_engineer: 'Software Engineer',
  product_manager: 'Product Manager',
  designer: 'Digital Designer',
  data_analyst: 'Data Analyst',
  marketing: 'Marketing',
  sales: 'Sales',
  operations: 'Operations',
  other: 'Other',
};

export function roleLabel(role: Role | null | undefined): string | null {
  if (!role) return null;
  return ROLE_LABELS[role] ?? null;
}
