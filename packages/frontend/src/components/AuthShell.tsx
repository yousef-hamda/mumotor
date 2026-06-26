import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

/** Two-pane auth layout: frosted navy brand pane on the left, glass form card on the right. */
export function AuthShell({ children, points }: { children: ReactNode; points: string[] }) {
  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <aside className="glass-dark relative hidden w-[44%] max-w-xl flex-col justify-between p-12 lg:flex">
        <div>
          <Link to="/" aria-label="Mumotor home">
            <Logo size="md" invert />
          </Link>
        </div>

        <div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
            The website and booking platform built for driving instructors.
          </h2>
          <ul className="mt-8 space-y-4">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sun-500/15 text-sun-300">
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </span>
                <span className="text-[15px] leading-relaxed text-sand-300">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-sand-400">© {new Date().getFullYear()} Mumotor</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-5">
          <Link to="/" className="lg:hidden" aria-label="Mumotor home">
            <Logo size="sm" />
          </Link>
          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="glass w-full max-w-md rounded-2xl p-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
