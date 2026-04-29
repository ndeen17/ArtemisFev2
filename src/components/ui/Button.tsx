import {
  type ButtonHTMLAttributes,
  type AnchorHTMLAttributes,
  type ReactNode,
  forwardRef,
} from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'outline' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

type CommonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
};

type AsButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: undefined;
  };

type AsAnchorProps = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
  };

export type ButtonProps = AsButtonProps | AsAnchorProps;

const base =
  'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-green disabled:opacity-50 disabled:pointer-events-none';

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-brand-green text-[#111827] ring-[2px] ring-[#dcfce7] shadow-sm hover:shadow-md hover:brightness-105 active:brightness-95',
  outline:
    'bg-white text-[#111827] shadow-[0_0_0_2px_rgba(17,24,39,0.04),0_1px_2px_rgba(17,24,39,0.05)] hover:shadow-[0_0_0_2px_rgba(17,24,39,0.06),0_1px_2px_rgba(17,24,39,0.07)]',
  ghost: 'text-[#111827] hover:bg-gray-100',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-6 py-2.5 text-[15px]',
  md: 'px-8 py-3 text-[15px]',
  lg: 'px-10 py-4 text-[17px]',
};

/**
 * Polymorphic Button — renders an <a> when `href` is provided, otherwise a <button>.
 * Used across landing and (eventually) authenticated app surfaces.
 */
export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  function Button({ children, variant = 'primary', size = 'sm', className, ...props }, ref) {
    const classes = cn(base, variantClasses[variant], sizeClasses[size], className);

    if ('href' in props && props.href !== undefined) {
      return (
        <a ref={ref as React.Ref<HTMLAnchorElement>} className={classes} {...props}>
          {children}
        </a>
      );
    }

    return (
      <button
        ref={ref as React.Ref<HTMLButtonElement>}
        className={classes}
        type={(props as AsButtonProps).type ?? 'button'}
        {...(props as AsButtonProps)}
      >
        {children}
      </button>
    );
  },
);
