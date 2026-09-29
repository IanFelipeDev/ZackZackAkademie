import { Link, NavLink } from 'react-router';
import { Icon } from './icon';

export interface NavItem {
  readonly to: string;
  readonly label: string;
  /** Material Symbol shown above the label in the phone bottom bar. */
  readonly icon?: string;
}

interface AppHeaderProps {
  readonly navItems: readonly NavItem[];
  /** Where the logo leads: the signed-in user's own home, not the public landing page. */
  readonly homeTo: string;
  readonly userName: string;
  readonly onSignOut: () => void;
}

// Below md each link is a bottom-bar tab (icon over label); from md up it is a pill in the header.
function navLinkClass({ isActive }: { isActive: boolean }): string {
  const base =
    'flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-[11px] leading-tight transition-colors md:flex-row md:whitespace-nowrap md:rounded-full md:px-3 md:py-1.5 md:text-sm';
  return isActive
    ? `${base} font-semibold text-primary md:bg-surface-high`
    : `${base} text-ink-soft md:text-ink hover:text-primary md:hover:bg-surface-low`;
}

export function AppHeader({ navItems, homeTo, userName, onSignOut }: AppHeaderProps) {
  return (
    // No backdrop-filter on the header itself: it would become the containing block of the fixed bottom nav.
    <header className="sticky top-0 z-20 border-b border-hairline/60">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-surface/90 backdrop-blur" />
      <div className="mx-auto flex max-w-6xl items-center gap-x-6 px-4 py-2.5 sm:px-6 sm:py-3">
        <Link
          to={homeTo}
          aria-label="Zack Zack Akademie"
          className="flex min-w-0 shrink-0 items-center gap-2.5"
        >
          <img src="/brand/logo-192.png" alt="" className="h-8 w-8 rounded-full sm:h-10 sm:w-10" />
          {/* Between md and lg the header nav needs the room, so only the logo stays. */}
          <span className="flex flex-col leading-tight whitespace-nowrap md:hidden lg:flex">
            <span className="font-serif text-lg font-semibold text-primary sm:text-xl">
              Zack Zack Akademie
            </span>
            <span className="rubric hidden !text-[9px] text-ink-soft sm:inline">
              Goethe-Zertifikat B2 · Schreiben & Sprechen
            </span>
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="fixed inset-x-0 bottom-0 z-20 grid auto-cols-fr grid-flow-col border-t border-hairline/60 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:static md:flex md:flex-1 md:justify-center md:gap-1 md:border-0 md:bg-transparent md:pb-0 md:backdrop-blur-none"
        >
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end className={navLinkClass}>
              {item.icon ? (
                // Wrapper carries md:hidden: the icon font's own CSS sets display and would override it.
                <span className="md:hidden">
                  <Icon name={item.icon} className="text-[22px]" />
                </span>
              ) : null}
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-surface-low py-1 pr-3 pl-1 text-sm whitespace-nowrap sm:flex md:hidden lg:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-container text-white">
              <Icon name="person" className="text-[16px]" />
            </span>
            {userName}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm text-ink-soft hover:bg-surface-low hover:text-primary"
          >
            <Icon name="logout" className="text-[18px]" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
