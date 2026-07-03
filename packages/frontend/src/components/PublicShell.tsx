import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { LogoMark } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

/** Lightweight centered layout for public student pages (enroll / book). */
export function PublicShell({
  schoolName,
  slug,
  children,
  width = 'narrow',
}: {
  schoolName?: string;
  slug?: string;
  children: ReactNode;
  width?: 'narrow' | 'wide';
}) {
  const Brand = (
    <span className="flex items-center gap-2.5">
      <LogoMark size="sm" />
      <span className="font-semibold tracking-tight text-sand-900">{schoolName || 'Driving School'}</span>
    </span>
  );
  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <header className="sticky top-0 z-40 border-b glass">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          <Link to={slug ? `/p/${slug}` : '/'} className="transition-opacity hover:opacity-80">
            {Brand}
          </Link>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-5 py-10">
        <div className={width === 'narrow' ? 'w-full max-w-md' : 'w-full max-w-3xl'}>{children}</div>
      </main>

      <footer className="border-t border-sand-200 py-6 text-center text-xs tracking-wide text-sand-500">
        Powered by{' '}
        <Link to="/" className="font-semibold text-sand-700 transition-colors hover:text-sun-600">
          Mumotor
        </Link>
      </footer>
    </div>
  );
}
