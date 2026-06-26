import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

/** Two-pane auth layout: solid black brand pane on the left, clean white form on the right. */
export function AuthShell({ children, points }: { children: ReactNode; points: string[] }) {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between bg-black p-14 lg:flex">
        <div>
          <Link to="/" aria-label="Mumotor home">
            <Logo size="md" invert />
          </Link>
        </div>

        <div>
          <h2 className="text-4xl font-semibold leading-tight tracking-tight text-white">
            The website and booking platform built for driving instructors.
          </h2>
          <ul className="mt-10 space-y-5">
            {points.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-sand-400" strokeWidth={1.75} />
                <span className="text-[15px] leading-relaxed text-sand-400">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-sand-500">© {new Date().getFullYear()} Mumotor</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col bg-white">
        <div className="flex items-center justify-between p-5">
          <Link to="/" className="lg:hidden" aria-label="Mumotor home">
            <Logo size="sm" />
          </Link>
          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
