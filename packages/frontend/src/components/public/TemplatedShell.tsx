import {
  forwardRef,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type InputHTMLAttributes,
  type ReactNode,
  type TextareaHTMLAttributes,
} from 'react';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTemplateFonts } from '../../templates/shared';
import { resolveBookTheme, type Dir } from '../../lib/templateTheme';
import { bookLocale, bookT } from '../../lib/bookingStrings';
import './book-shell.css';

/**
 * Full-screen shell for student-facing pages (enroll / book / account) that adopts
 * the teacher's chosen template design via normalized `--book-*` tokens. Renders a
 * themed nav (brand → back to the site), centered content, and a Mumotor footer.
 */
export function TemplatedShell({
  slug,
  theme,
  dir = 'ltr',
  locale,
  schoolName,
  logoSrc,
  publicSlug,
  width = 'narrow',
  children,
}: {
  slug: string | undefined | null;
  theme?: Record<string, string> | null;
  dir?: Dir;
  locale?: string | null;
  schoolName?: string;
  logoSrc?: string | null;
  publicSlug?: string;
  width?: 'narrow' | 'wide';
  children: ReactNode;
}) {
  const { vars, isDark, fontHref } = resolveBookTheme(slug, theme);
  useTemplateFonts([fontHref]);
  const L = bookLocale(locale);

  const home = publicSlug ? `/p/${publicSlug}` : '/';

  return (
    <div className="book-shell" dir={dir} data-theme={isDark ? 'dark' : 'light'} style={vars as CSSProperties}>
      <div className="book-shell-glow" aria-hidden="true" />
      <header className="book-nav">
        <div className="book-nav-inner">
          <Link to={home} className="book-brand" aria-label={schoolName || bookT(L, 'shellHome')}>
            {logoSrc ? (
              <img src={logoSrc} alt="" className="book-brand-logo" />
            ) : (
              <span className="book-brand-mark" aria-hidden="true">
                {(schoolName || 'M').charAt(0).toUpperCase()}
              </span>
            )}
            <span className="book-brand-name">{schoolName || bookT(L, 'shellBrandFallback')}</span>
          </Link>
        </div>
      </header>

      <main className={cn('book-main', width === 'wide' ? 'book-main-wide' : 'book-main-narrow')}>
        {children}
      </main>

      <footer className="book-footer">
        {bookT(L, 'poweredBy')}{' '}
        <Link to="/" className="book-footer-link">
          Mumotor
        </Link>
      </footer>
    </div>
  );
}

// ── Themed primitives (paint from --book-* only; no app sand-* tokens) ────────

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface BookButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  loading?: boolean;
}
export const BookButton = forwardRef<HTMLButtonElement, BookButtonProps>(
  ({ variant = 'primary', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn('book-btn', `book-btn-${variant}`, className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="book-spin" />}
      {children}
    </button>
  )
);
BookButton.displayName = 'BookButton';

export function BookCard({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('book-card', className)}>{children}</div>;
}

export function BookField({
  label,
  children,
  hint,
}: {
  label?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="book-field">
      {label && <span className="book-field-label">{label}</span>}
      {children}
      {hint && <span className="book-field-hint">{hint}</span>}
    </label>
  );
}

export const BookInput = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn('book-input', className)} {...props} />
);
BookInput.displayName = 'BookInput';

export const BookTextarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn('book-input book-textarea', className)} {...props} />
);
BookTextarea.displayName = 'BookTextarea';

export function BookSpinner({ label }: { label?: string }) {
  return (
    <div className="book-spinner">
      <Loader2 className="book-spin" />
      {label && <span>{label}</span>}
    </div>
  );
}
