import { forwardRef, type ReactNode } from 'react';
import { Input, type InputProps } from './Input';
import { Label } from './Label';
import { FormError } from './FormError';

export interface FormFieldProps extends InputProps {
  label: string;
  id: string;
  error?: string;
  /** Optional helper or trailing element below the input (e.g. "Forgot password?" link). */
  hint?: ReactNode;
}

/**
 * FormField — a labelled input + inline error. Always pass the form library's
 * `register(...)` props through so RHF wires correctly.
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, id, error, hint, ...inputProps },
  ref,
) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        ref={ref}
        invalid={Boolean(error)}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {error ? (
        <FormError>
          <span id={`${id}-error`}>{error}</span>
        </FormError>
      ) : hint ? (
        <div className="mt-1.5 text-[13px] text-gray-500">{hint}</div>
      ) : null}
    </div>
  );
});
