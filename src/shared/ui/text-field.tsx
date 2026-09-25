import { useId, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from './icon';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label: string;
  readonly icon?: string;
  readonly error?: string;
  readonly hint?: ReactNode;
}

export function TextField({
  label,
  icon,
  error,
  hint,
  type = 'text',
  id,
  className = '',
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const errorId = `${inputId}-error`;
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          {label}
        </label>
        {hint ? <span className="text-xs text-ink-soft italic">{hint}</span> : null}
      </div>
      <div
        className={`flex items-center gap-2 rounded-lg border bg-surface-lowest px-3 shadow-paper focus-within:border-primary-container focus-within:ring-4 focus-within:ring-primary-container/10 ${error ? 'border-error' : 'border-hairline'}`}
      >
        {icon ? <Icon name={icon} className="text-[20px] text-outline" /> : null}
        <input
          id={inputId}
          type={isPassword && isPasswordVisible ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent py-3 text-base text-ink outline-none placeholder:text-outline/70"
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            className="rounded-full p-1 text-outline hover:text-primary"
            aria-label={isPasswordVisible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            <Icon name={isPasswordVisible ? 'visibility_off' : 'visibility'} className="text-[20px]" />
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-sm text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
