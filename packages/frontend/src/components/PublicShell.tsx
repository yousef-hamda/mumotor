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
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
          {slug ? (
            <Link to={`/p/${slug}`} className="flex items-center gap-2.5">
              <LogoMark size="sm" />
              <span className="font-bold tracking-tight text-zinc-900">{schoolName || 'Driving School'}</span>
            </Link>
          ) : (
            <span className="flex items-center gap-2.5">
              <LogoMark size="sm" />
              <span className="font-bold tracking-tight text-zinc-900">{schoolName || 'Driving School'}</span>
            </span>
          )}
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center px-5 py-10">
        <div className={width === 'narrow' ? 'w-full max-w-md' : 'w-full max-w-3xl'}>{children}</div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-5 text-center text-xs text-zinc-400">
        Powered by <span className="font-semibold text-zinc-600">DriveSawa</span>
      </footer>
    </div>
  );
}
