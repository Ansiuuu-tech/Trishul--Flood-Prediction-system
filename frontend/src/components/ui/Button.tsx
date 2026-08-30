import { forwardRef, ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'primary-pill' | 'secondary' | 'ghost' | 'oauth';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseClasses = 'inline-flex items-center justify-center font-sans font-medium rounded-btn transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-offset-2';

    const variantClasses = {
      primary: 'bg-signal-amber text-white hover:bg-[#a84a18] focus-visible:ring-signal-amber/40',
      'primary-pill': 'bg-signal-amber text-white hover:bg-[#a84a18] focus-visible:ring-signal-amber/40 rounded-pill px-8',
      secondary: 'bg-transparent border border-ink-900/30 text-ink-900 hover:bg-ink-900/5 focus-visible:ring-ink-900/20 dark:border-mist-50/30 dark:text-mist-50 dark:hover:bg-mist-50/10',
      ghost: 'bg-transparent text-ink-900 hover:text-ink-900/70 focus-visible:ring-ink-900/20 dark:text-mist-50 dark:hover:text-mist-50/70',
      oauth: 'w-full bg-white border border-stone-200 text-ink-900 hover:bg-stone-200/50 focus-visible:ring-signal-amber/40 dark:bg-forest-800 dark:border-moss-600 dark:text-mist-50 dark:hover:bg-moss-600/50',
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-caption',
      md: 'px-6 py-3 text-body',
      lg: 'px-8 py-4 text-body',
    };

    return (
      <button
        ref={ref}
        className={clsx(baseClasses, variantClasses[variant], sizeClasses[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';