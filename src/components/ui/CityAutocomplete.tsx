import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Input } from './Input';
import { CITIES, formatCityLabel, searchCities, type CityEntry } from '@/data/cities';
import { cn } from '@/lib/cn';

export interface CityAutocompleteProps {
  /** Current value as stored in the CV (a free-text "City, Country" string). */
  value: string;
  /** Called with the new free-text value on every keystroke or selection. */
  onChange: (next: string) => void;
  placeholder?: string;
  id?: string;
  invalid?: boolean;
  'aria-required'?: boolean;
}

/**
 * CityAutocomplete — accessible combobox for the location field.
 *
 * - Suggestions appear after the user types ≥2 characters.
 * - Keyboard: ArrowUp/Down, Enter to select, Escape to close.
 * - Selecting a suggestion populates the field with `"City, Country"`.
 * - Free-text is always allowed; nothing locks the field to a list value.
 *
 * The dataset is bundled (no network call), so it works offline and adds
 * no runtime dependency. If a city is not in the list, the user can still
 * type freely and the value persists as plain text.
 */
export function CityAutocomplete({
  value,
  onChange,
  placeholder,
  id,
  invalid,
  'aria-required': ariaRequired,
}: CityAutocompleteProps) {
  const inputId = useId();
  const listboxId = `${inputId}-listbox`;
  const reactId = id ?? inputId;

  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  // Tracks whether the input has focus — we only show the menu while focused
  // so blurring (e.g. clicking Save) closes the listbox cleanly.
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  // Recompute matches whenever the field value changes.
  const matches = useMemo<CityEntry[]>(() => {
    return searchCities(value, 8);
  }, [value]);

  // Reset highlight whenever the candidate list changes.
  useEffect(() => {
    setHighlight(0);
  }, [matches.length]);

  // Close on outside click.
  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  function selectMatch(entry: CityEntry) {
    onChange(formatCityLabel(entry));
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      if (matches.length > 0) {
        e.preventDefault();
        setOpen(true);
        setHighlight((h) => Math.min(matches.length - 1, h + 1));
      }
    } else if (e.key === 'ArrowUp') {
      if (matches.length > 0) {
        e.preventDefault();
        setOpen(true);
        setHighlight((h) => Math.max(0, h - 1));
      }
    } else if (e.key === 'Enter') {
      if (open && matches[highlight]) {
        e.preventDefault();
        selectMatch(matches[highlight]);
      }
    } else if (e.key === 'Escape') {
      if (open) {
        e.preventDefault();
        setOpen(false);
      }
    }
  }

  const showMenu = open && matches.length > 0;
  const activeId = showMenu ? `${listboxId}-opt-${highlight}` : undefined;

  return (
    <div ref={wrapperRef} className="relative">
      <Input
        id={reactId}
        role="combobox"
        type="text"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={showMenu}
        aria-controls={listboxId}
        aria-activedescendant={activeId}
        aria-required={ariaRequired}
        invalid={invalid}
        placeholder={placeholder ?? 'Start typing your city…'}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onKeyDown={onKeyDown}
      />
      {showMenu ? (
        <ul
          id={listboxId}
          role="listbox"
          className={cn(
            'absolute z-30 mt-1 w-full max-h-64 overflow-auto rounded-2xl border border-gray-200 bg-white py-1 shadow-lg',
          )}
        >
          {matches.map((entry, i) => {
            const isActive = i === highlight;
            return (
              <li
                id={`${listboxId}-opt-${i}`}
                key={`${entry.city}-${entry.countryCode}-${i}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => {
                  // mousedown so the click registers before the input blurs.
                  e.preventDefault();
                  selectMatch(entry);
                }}
                onMouseEnter={() => setHighlight(i)}
                className={cn(
                  'cursor-pointer px-4 py-2 text-[13.5px] text-gray-700',
                  isActive ? 'bg-brand-green/10 text-[#065f46]' : 'hover:bg-gray-50',
                )}
              >
                <span className="font-medium">{entry.city}</span>
                <span className="text-gray-500">, {entry.country}</span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

// Re-export so callers don't have to know the data file path.
export { CITIES };
