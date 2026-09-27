import { Icon } from './icon';

/** Faint watermark icons in the page corners (quill, compass, books, hourglass) from the Stitch mockups. */
export function PageDecorations() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden opacity-[0.12]"
    >
      {/* Top pair only from sm up (on phones they sit behind the header); wrappers because the icon font's
          CSS sets display. */}
      <span className="absolute top-24 left-4 hidden rotate-12 sm:block">
        <Icon name="edit_note" className="!text-[96px] text-primary" />
      </span>
      <span className="absolute top-28 right-6 hidden sm:block">
        <Icon name="explore" className="!text-[104px] text-tertiary" />
      </span>
      <Icon name="collections_bookmark" className="absolute bottom-4 left-6 !text-[110px] text-primary" />
      <Icon name="hourglass_top" className="absolute right-8 bottom-4 !text-[110px] text-secondary" />
    </div>
  );
}
