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
