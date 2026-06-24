import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import { Logo } from './Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { FadeUp } from './motion';

/** Two-pane premium auth layout: warm brand story on the left, form on the right. */
export function AuthShell({ children, points }: { children: ReactNode; points: string[] }) {
  return (
    <div className="flex min-h-screen bg-sand-50">
      {/* Brand panel */}
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-dusk p-12 lg:flex">
        <div className="pointer-events-none absolute -right-20 -top-16 h-80 w-80 rounded-full sun-glow animate-sun-pulse blur-2xl" />
        <div className="pointer-events-none absolute inset-0 bg-grain opacity-[0.12]" />
        <div className="relative">
          <Link to="/">
            <Logo size="md" invert />
          </Link>
        </div>

        <div className="relative">
          <FadeUp>
            <h2 className="font-display text-4xl font-semibold leading-tight tracking-tightest text-white">
              Run your driving school <span className="text-sunrise-anim">from sunrise.</span>
            </h2>
          </FadeUp>
          <ul className="mt-8 space-y-4">
            {points.map((p, i) => (
              <FadeUp key={p} delay={0.1 + i * 0.08}>
                <li className="flex items-center gap-3.5 text-sand-100">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-sun-400/60 text-sun-400">
                    <Check className="h-3 w-3" strokeWidth={2.5} />
                  </span>
                  <span className="text-[15px] text-sand-200">{p}</span>
                </li>
              </FadeUp>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <img src="/img/instructor.jpg" alt="A driving instructor" className="h-11 w-11 rounded-full object-cover ring-1 ring-white/20" />
          <div>
            <div className="flex gap-0.5 text-sun-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-current" />
              ))}
            </div>
            <p className="mt-1 text-[13px] leading-snug text-sand-300">&ldquo;Set up before my morning coffee.&rdquo;</p>
          </div>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-5">
          <Link to="/" className="lg:hidden">
            <Logo size="sm" />
          </Link>
          <div className="ms-auto">
            <LanguageSwitcher />
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 pb-12">
          <div className="w-full max-w-md">{children}</div>
        </div>
      </main>
    </div>
  );
}
