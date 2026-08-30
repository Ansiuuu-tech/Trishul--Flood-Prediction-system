import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'dark';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', hover = false, children, ...props }, ref) => {
    const baseClasses = 'rounded-card p-6 transition-shadow duration-200';
    const variantClasses = {
      default: 'bg-white border border-stone-200 dark:bg-forest-800 dark:border-moss-600',
      dark: 'bg-forest-800 border border-moss-600',
    };
    const hoverClasses = hover ? 'hover:shadow-lg dark:hover:shadow-[0_0_40px_-10px_rgba(63,107,73,0.3)]' : '';

    return (
      <div
        ref={ref}
        className={clsx(baseClasses, variantClasses[variant], hoverClasses, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';