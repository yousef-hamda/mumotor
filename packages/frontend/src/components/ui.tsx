import {
  forwardRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { Loader2, X } from 'lucide-react';
import { cn } from '../lib/utils';
import type { EnrollmentStatus } from '../lib/types';

// ---------------------------------------------------------------------------
// Button
// ---------------------------------------------------------------------------
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'sun';
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}
const variantClass: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
  sun: 'btn-sun',
};
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', loading, className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(variantClass[variant], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------
interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}
export function Field({ label, error, hint, children }: FieldProps) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-sand-500">{hint}</p>}
      {error && <p className="mt-1 text-xs font-medium text-ember-600">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => <input ref={ref} className={cn('input', className)} {...props} />
);
Input.displayName = 'Input';

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn('input cursor-pointer', className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => <textarea ref={ref} className={cn('input', className)} {...props} />
);
Textarea.displayName = 'Textarea';

// ---------------------------------------------------------------------------
// Spinner / Loading
// ---------------------------------------------------------------------------
export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-sun-500', className)} />;
}

export function CenteredSpinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-sand-500">
      <Spinner className="h-8 w-8" />
      {label && <p className="text-sm">{label}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------
export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('card p-6', className)}>{children}</div>;
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------
const statusStyles: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  PUBLISHED: 'bg-emerald-100 text-emerald-700',
  INACTIVE: 'bg-sand-200 text-sand-600',
  DRAFT: 'bg-sand-200 text-sand-700',
  COMPLETED: 'bg-sun-100 text-sun-800',
  SUSPENDED: 'bg-ember-100 text-ember-700',
  PENDING: 'bg-sun-100 text-sun-800',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-ember-100 text-ember-700',
};
export function StatusBadge({ status }: { status: EnrollmentStatus | string }) {
  return <span className={cn('chip', statusStyles[status] ?? 'bg-sand-200 text-sand-600')}>{status}</span>;
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-sand-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md animate-fade-in rounded-3xl border border-sand-200 bg-white p-6 shadow-elevated">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="text-lg font-bold tracking-tight text-sand-950">{title}</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-sand-400 transition-colors hover:bg-sand-100 hover:text-sand-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-6 flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton', className)} />;
}

export function CardSkeleton() {
  return (
    <div className="card space-y-3 p-6">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-24 w-full" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
export function EmptyState({ icon, title, description }: { icon?: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      {icon && <div className="mb-2 text-sand-300">{icon}</div>}
      <p className="font-semibold text-sand-800">{title}</p>
      {description && <p className="max-w-sm text-sm text-sand-500">{description}</p>}
    </div>
  );
}
