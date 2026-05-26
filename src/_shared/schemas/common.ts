import { z } from 'zod';

/** Standard API error envelope returned by the backend. */
export const ApiErrorSchema = z.object({
  error: z.string(),
  message: z.string().optional(),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;

/** Generic success envelope wrapping a payload. */
export const ApiOkSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    data,
  });

/** Reusable primitives. */
export const EmailSchema = z.string().trim().toLowerCase().email('Invalid email');
export const NonEmptyString = z.string().trim().min(1, 'Required');
export const ObjectIdString = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

/**
 * Allowlist of email providers permitted for new sign-ups.
 * Curated to common consumer providers + a few popular privacy/business hosts.
 * NOTE: Intentionally NOT applied to sign-in / password-reset / resend-verification
 * so that any pre-existing accounts on other domains keep working.
 */
export const ALLOWED_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  // Google
  'gmail.com',
  'googlemail.com',
  // Yahoo
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'yahoo.fr',
  'yahoo.de',
  'yahoo.es',
  'yahoo.it',
  'yahoo.ca',
  'yahoo.com.br',
  'yahoo.com.mx',
  'ymail.com',
  'rocketmail.com',
  // Microsoft
  'outlook.com',
  'hotmail.com',
  'hotmail.co.uk',
  'hotmail.fr',
  'live.com',
  'msn.com',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // AOL
  'aol.com',
  // Proton
  'protonmail.com',
  'proton.me',
  'pm.me',
  // Other popular consumer / privacy providers
  'gmx.com',
  'gmx.de',
  'gmx.us',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'yandex.ru',
  'fastmail.com',
  'fastmail.fm',
  'hey.com',
  'tutanota.com',
  'tuta.io',
  'tutamail.com',
]);

/** Email schema used for NEW sign-ups: must be a valid email AND from an allowlisted provider. */
export const AllowedEmailSchema = EmailSchema.refine(
  (value) => {
    const [local, domain] = value.split('@');
    if (!domain || !ALLOWED_EMAIL_DOMAINS.has(domain)) return false;
    // Block `+` aliases on signup: one Gmail/etc. inbox can produce unlimited
    // `+suffix` variants that all deliver to the same place, which is a cheap
    // way to register many accounts from a single mailbox. Real users almost
    // never use a `+` alias for an account they intend to log into long-term.
    if (local.includes('+')) return false;
    return true;
  },
  {
    message:
      'Please sign up with a common email provider (Gmail, Yahoo, Outlook, iCloud, etc.) and no "+" alias.',
  },
);
