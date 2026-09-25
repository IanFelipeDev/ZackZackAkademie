interface IconProps {
  /** Material Symbols ligature name, e.g. "schedule". */
  readonly name: string;
  readonly className?: string;
  readonly filled?: boolean;
}

/** Decorative icon; always hidden from assistive tech, so pair it with visible or sr-only text. */
export function Icon({ name, className = '', filled = false }: IconProps) {
  return (
    <span
      aria-hidden="true"
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}
