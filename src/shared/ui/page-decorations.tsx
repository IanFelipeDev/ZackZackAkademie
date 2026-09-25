import { Icon } from './icon';

/** Faint watermark icons in the page corners (quill, compass, books, hourglass) from the Stitch mockups. */
export function PageDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-[0.12]"
    >
      <Icon name="edit_note" className="absolute top-24 left-4 rotate-12 !text-[96px] text-primary" />
      <Icon name="explore" className="absolute top-28 right-6 !text-[104px] text-tertiary" />
      <Icon name="collections_bookmark" className="absolute bottom-4 left-6 !text-[110px] text-primary" />
      <Icon name="hourglass_top" className="absolute right-8 bottom-4 !text-[110px] text-secondary" />
    </div>
  );
}
