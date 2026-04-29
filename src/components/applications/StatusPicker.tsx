import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from '@artemis/shared';
import { cn } from '@/lib/cn';

interface StatusPickerProps {
  value: ApplicationStatus;
  onChange: (next: ApplicationStatus) => void;
  disabled?: boolean;
}

export function StatusPicker({ value, onChange, disabled }: StatusPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {APPLICATION_STATUSES.map((s) => {
        const active = s === value;
        return (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s)}
            className={cn(
              'rounded-full px-3 py-1.5 text-[12px] font-semibold border transition',
              active
                ? 'bg-[#111827] text-white border-[#111827]'
                : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
          >
            {STATUS_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
