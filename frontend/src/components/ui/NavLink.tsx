import { AnchorHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface NavLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  active?: boolean;
  variant?: 'default' | 'dark';
  to?: string;
}

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, active, variant = 'default', to, children, ...props }, ref) => {
    const baseClasses = 'font-sans text-caption font-medium transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:h-[1px] after:w-0 after:bg-signal-amber after:transition-width after:duration-200';
    const variantClasses = {
      default: 'text-ink-900/70 hover:text-ink-900 dark:text-mist-50/70 dark:hover:text-mist-50',
      dark: 'text-mist-50/70 hover:text-mist-50',
    };
    const activeClasses = active ? 'text-ink-900 after:w-full dark:text-mist-50' : 'hover:after:w-full';

    return (
      <a
        ref={ref}
        href={to}
        className={clsx(baseClasses, variantClasses[variant], activeClasses, className)}
        {...props}
      >
        {children}
      </a>
    );
  }
);

NavLink.displayName = 'NavLink';