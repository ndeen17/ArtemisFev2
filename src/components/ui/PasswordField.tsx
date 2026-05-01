import { forwardRef, useState, type ReactNode } from 'react';
import { Input, type InputProps } from './Input';
import { Label } from './Label';
import { FormError } from './FormError';
import { EyeIcon, EyeOffIcon } from './icons';

export interface PasswordFieldProps extends Omit<InputProps, 'type'> {
  label: string;
  id: string;
  error?: string;
  /** Optional helper or trailing element below the input. */
  hint?: ReactNode;
}

/**
 * PasswordField — labelled password input with a built-in show/hide toggle.
 *
 * Mirrors the FormField API so it can be used as a drop-in replacement wherever
 * a password is collected. Toggling only swaps the `type` attribute so the
 * caret position is preserved (no re-mount).
 */
export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  function PasswordField({ label, id, error, hint, className, ...inputProps }, ref) {
    const [visible, setVisible] = useState(false);
    return (
      <div>
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={visible ? 'text' : 'password'}
            invalid={Boolean(error)}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? `${id}-error` : undefined}
            className={`pr-12 ${className ?? ''}`}
            {...inputProps}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            aria-pressed={visible}
            tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {error ? (
          <FormError>
            <span id={`${id}-error`}>{error}</span>
          </FormError>
        ) : hint ? (
          <div className="mt-1.5 text-[13px] text-gray-500">{hint}</div>
        ) : null}
      </div>
    );
  },
);
