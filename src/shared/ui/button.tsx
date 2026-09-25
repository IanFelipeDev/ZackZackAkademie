import type { ButtonHTMLAttributes } from 'react';
import { Icon } from './icon';

type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly icon?: string;
  readonly isLoading?: boolean;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-container text-white shadow-lift hover:bg-primary disabled:bg-primary-container/60 disabled:shadow-none',
  secondary: 'border border-primary-container text-primary-container hover:bg-surface-high',
  soft: 'bg-surface-low text-ink-soft hover:bg-surface-container hover:text-primary',
  ghost: 'text-primary-container hover:bg-surface-low',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1',
  md: 'px-4 py-2.5 text-sm gap-1.5',
  lg: 'px-7 py-3 text-sm gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={`inline-flex items-center justify-center rounded-full font-semibold tracking-wide transition-colors disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {isLoading ? <Icon name="progress_activity" className="animate-spin text-[18px]" /> : null}
      {!isLoading && icon ? <Icon name={icon} className="text-[18px]" /> : null}
      {children}
    </button>
  );
}
