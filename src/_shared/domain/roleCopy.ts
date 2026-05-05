import type { Role } from '../schemas/onboarding.js';

/**
 * Human-readable labels for every Role enum value. Used wherever we surface
 * the user's career choice in copy (home hero, profile chip, settings, etc.).
 */
export const ROLE_LABELS: Record<Role, string> = {
  software_engineer: 'Software Engineer',
  product_manager: 'Product Manager',
  designer: 'Digital Designer',
  data_analyst: 'Data Analyst',
};

export function roleLabel(role: Role | null | undefined): string | null {
  if (!role) return null;
  return ROLE_LABELS[role] ?? null;
}
