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
      <span className="font-display font-semibold tracking-tight text-sand-950">{schoolName || 'Driving School'}</span>
    </span>
  );
  return (
    <div className="flex min-h-screen flex-col bg-sand-50">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-sunrise-soft opacity-40 blur-2xl" />
      <header className="border-b border-sand-200/70 bg-sand-50/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          {slug ? (
            <Link to={`/p/${slug}`} className="transition-opacity hover:opacity-80">
              {Brand}
            </Link>
          ) : (
            Brand
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-5 py-10">
        <div className={width === 'narrow' ? 'w-full max-w-md' : 'w-full max-w-3xl'}>{children}</div>
      </main>

      <footer className="border-t border-sand-200/60 py-6 text-center text-xs text-sand-400 tracking-wide">
        Powered by{' '}
        <Link to="/" className="font-semibold text-sand-600 transition-colors hover:text-sand-900">
          Mumotor
        </Link>
      </footer>
    </div>
  );
}
