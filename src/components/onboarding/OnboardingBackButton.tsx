import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ArrowLeftIcon } from '@/components/ui/icons';

interface Props {
  /** Where the button navigates. Use '-1' to invoke `navigate(-1)`. */
  to: string;
  /** Override label. Defaults to "Back". */
  label?: string;
  disabled?: boolean;
  /** Optional click hook (runs before navigation). */
  onClick?: () => void;
}

/**
 * Shared back button used in the footer of every onboarding step. Renders
 * with the same Button outline styling + size as the page's primary
 * Continue button so the two sit aligned on a single row.
 */
export function OnboardingBackButton({ to, label = 'Back', disabled, onClick }: Props) {
  const navigate = useNavigate();
  return (
    <Button
      variant="outline"
      size="md"
      type="button"
      disabled={disabled}
      onClick={() => {
        onClick?.();
        if (to === '-1') navigate(-1);
        else navigate(to);
      }}
    >
      <span className="inline-flex items-center gap-2">
        <ArrowLeftIcon /> {label}
      </span>
    </Button>
  );
}
