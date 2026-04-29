import { GoogleGIcon, SpinnerIcon } from '@/components/ui/icons';
import { cn } from '@/lib/cn';

interface OAuthButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** "Continue with" prefix label — kept short so layout matches landing whitespace. */
  label?: string;
}

/**
 * Google OAuth pill — uses the same outline-button language as the landing's
 * "Login" pill, but full-width with a hand-rolled Google G mark on the left.
 */
export function OAuthButton({
  onClick,
  loading,
  disabled,
  label = 'Continue with Google',
}: OAuthButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-[15px] font-semibold text-[#111827]',
        'shadow-[0_0_0_2px_rgba(17,24,39,0.04),0_1px_2px_rgba(17,24,39,0.05)]',
        'transition-all duration-200 hover:shadow-[0_0_0_2px_rgba(17,24,39,0.06),0_1px_2px_rgba(17,24,39,0.07)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-green',
        'disabled:opacity-60 disabled:pointer-events-none',
      )}
    >
      {loading ? <SpinnerIcon /> : <GoogleGIcon />}
      <span>{label}</span>
    </button>
  );
}
