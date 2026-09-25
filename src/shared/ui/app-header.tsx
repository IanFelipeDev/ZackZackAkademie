import { Link, NavLink } from 'react-router';
import { Icon } from './icon';

export interface NavItem {
  readonly to: string;
  readonly label: string;
}

interface AppHeaderProps {
  readonly navItems: readonly NavItem[];
  readonly userName: string;
  readonly onSignOut: () => void;
}

function navLinkClass({ isActive }: { isActive: boolean }): string {
  const base = 'whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors';
  return isActive
    ? `${base} bg-surface-high font-semibold text-primary`
    : `${base} text-ink hover:bg-surface-low hover:text-primary`;
}

export function AppHeader({ navItems, userName, onSignOut }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-hairline/60 bg-surface/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/brand/logo-192.png" alt="" className="h-10 w-10 rounded-full" />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-xl font-semibold text-primary">Zack Zack Akademie</span>
            <span className="rubric !text-[9px] text-ink-soft">Goethe-Zertifikat B2 · Schreiben</span>
          </span>
        </Link>

        <nav
          aria-label="Navegação principal"
          className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:w-auto md:flex-1 md:justify-center"
        >
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end className={navLinkClass}>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-2 rounded-full bg-surface-low py-1 pr-3 pl-1 text-sm sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary-container text-white">
              <Icon name="person" className="text-[16px]" />
            </span>
            {userName}
          </span>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-ink-soft hover:bg-surface-low hover:text-primary"
          >
            <Icon name="logout" className="text-[18px]" />
            Sair
          </button>
        </div>
      </div>
    </header>
  );
}
