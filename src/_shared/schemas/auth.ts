import { z } from 'zod';
import { EmailSchema } from './common.js';
import { OnboardingStepSchema } from './onboarding.js';

/** Password policy: 8+ chars, at least one letter and one number. */
export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

export const SignUpSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
});
export type SignUpInput = z.infer<typeof SignUpSchema>;

export const SignInSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password required'),
});
export type SignInInput = z.infer<typeof SignInSchema>;

export const GoogleAuthSchema = z.object({
  idToken: z.string().min(1, 'idToken required'),
});
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;

/** Auth response payload (without sensitive fields). */
export const AuthUserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  onboardingComplete: z.boolean(),
  onboardingStep: OnboardingStepSchema,
});
export type AuthUser = z.infer<typeof AuthUserSchema>;

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
  accessToken: z.string(),
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'token required'),
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ResendVerificationSchema = z.object({
  email: EmailSchema,
});
export type ResendVerificationInput = z.infer<typeof ResendVerificationSchema>;
