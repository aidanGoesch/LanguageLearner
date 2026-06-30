import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  hideNav?: boolean;
}

export function Layout({ children, title, hideNav }: LayoutProps) {
  const location = useLocation();
  const isStudy = location.pathname.startsWith('/study');

  return (
    <div className={`layout ${hideNav ? 'layout--full' : ''}`}>
      {!hideNav && (
        <header className="layout__header">
          {title ? (
            <h1 className="layout__title">{title}</h1>
          ) : (
            <Link to="/" className="layout__brand">
              Flashcards
            </Link>
          )}
        </header>
      )}
      <main className={`layout__main ${isStudy ? 'layout__main--study' : ''}`}>{children}</main>
      {!hideNav && (
        <nav className="layout__nav">
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>
            Home
          </Link>
          <Link to="/study" className={location.pathname.startsWith('/study') ? 'active' : ''}>
            Study
          </Link>
          <Link to="/stacks" className={location.pathname.startsWith('/stacks') ? 'active' : ''}>
            Stacks
          </Link>
          <Link to="/stats" className={location.pathname === '/stats' ? 'active' : ''}>
            Stats
          </Link>
          <Link to="/settings" className={location.pathname === '/settings' ? 'active' : ''}>
            Settings
          </Link>
        </nav>
      )}
    </div>
  );
}
