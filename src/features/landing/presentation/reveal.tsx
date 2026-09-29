import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

interface RevealProps {
  readonly children: ReactNode;
  readonly as?: ElementType;
  /** Position in a group; staggers the entrance by 60ms per step. */
  readonly index?: number;
  /** `image` reveals with a clip-path wipe instead of a rise. */
  readonly variant?: 'rise' | 'image';
  readonly className?: string;
}

/**
 * Plays an entrance once, when the element first scrolls into view. Without IntersectionObserver, or when the
 * visitor prefers reduced motion, the content is simply shown.
 */
export function Reveal({
  children,
  as: Tag = 'div',
  index = 0,
  variant = 'rise',
  className = '',
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(
    () => typeof IntersectionObserver === 'undefined' || prefersReducedMotion(),
  );

  useEffect(() => {
    const element = ref.current;
    if (isVisible || !element) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [isVisible]);

  return (
    <Tag
      ref={ref}
      data-visible={isVisible ? '' : undefined}
      style={{ '--reveal-index': index } as CSSProperties}
      className={`${variant === 'image' ? 'reveal-image' : 'reveal'} ${className}`}
    >
      {children}
    </Tag>
  );
}
