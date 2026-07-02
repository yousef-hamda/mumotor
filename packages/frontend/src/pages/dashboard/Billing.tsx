import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, CreditCard, Rocket, Zap } from 'lucide-react';
import { apiError, subscriptionApi } from '../../lib/api';
import { Button, CenteredSpinner } from '../../components/ui';
import { FadeUp, Stagger } from '../../components/motion';
import { cn } from '../../lib/utils';

/** Map plan id → icon + accent color for the icon tile */
const planMeta: Record<string, { icon: ReactNode; accent: string }> = {
  FREE: {
    icon: <Zap strokeWidth={1.75} className="h-5 w-5" />,
    accent: 'bg-sand-100 text-sand-700',
  },
  PRO: {
    icon: <Rocket strokeWidth={1.75} className="h-5 w-5" />,
    accent: 'bg-sand-100 text-sand-700',
  },
  STUDIO: {
    icon: <CreditCard strokeWidth={1.75} className="h-5 w-5" />,
    accent: 'bg-sand-900 text-white',
  },
};

export default function Billing() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['subscription'], queryFn: subscriptionApi.get });
  const checkout = useMutation({
    mutationFn: (plan: 'FREE' | 'PRO' | 'STUDIO') => subscriptionApi.checkout(plan),
    onSuccess: (res) => {
      if (res.url) {
        window.location.href = res.url; // redirect to Stripe Checkout
        return;
      }
      toast.success(`Switched to ${res.plan}`);
      qc.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (e) => toast.error(apiError(e).message),
  });

  if (isLoading || !data) return <CenteredSpinner />;
  const current = data.subscription.plan;

  // Highlight a "recommended" plan only when there's more than one to compare.
  const recommended = data.plans.length > 1 ? 'PRO' : null;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <FadeUp>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-sand-900">
            Plans &amp; billing
          </h1>
          <p className="mt-1 text-sand-600">
            You're on the <span className="font-semibold text-sand-900">{current}</span> plan.
          </p>
        </div>
      </FadeUp>

      <Stagger
        className={cn('grid gap-5', data.plans.length > 1 ? 'md:grid-cols-3' : 'mx-auto max-w-md')}
        gap={0.1}
      >
        {data.plans.map((p) => {
          const active = p.id === current;
          const isRecommended = p.id === recommended;
          const meta = planMeta[p.id] ?? { icon: <Zap className="h-5 w-5" />, accent: 'bg-sand-100 text-sand-600' };

          return (
            <Stagger.Item key={p.id}>
              <div
                className={cn(
                  'relative flex h-full flex-col rounded-xl bg-white p-6 shadow-card',
                  isRecommended || active
                    ? 'border-2 border-sand-900'
                    : 'border border-sand-200'
                )}
              >
                {isRecommended && (
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 chip bg-sand-900 text-white text-[10px] uppercase tracking-widest px-3 py-1">
                    Recommended
                  </span>
                )}

                <div className="flex items-center justify-between">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-lg', meta.accent)}>
                    {meta.icon}
                  </span>
                  {active && (
                    <span className="chip bg-sand-900 text-white text-[10px] uppercase tracking-wider">
                      Current
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-xl font-semibold tracking-tight text-sand-900">{p.name}</h3>

                <p className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight tabular-nums text-sand-900">
                    {p.currency ?? '$'}
                    {p.price}
                  </span>
                  <span className="text-xs font-medium text-sand-500">/{p.period ?? 'mo'}</span>
                </p>
                {p.note && <p className="mt-1 text-sm text-sand-500">{p.note}</p>}

                <ul className="mt-5 flex-1 space-y-2.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-sand-600">
                      <Check strokeWidth={2} className="mt-0.5 h-4 w-4 shrink-0 text-sand-900" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  variant={isRecommended && !active ? 'primary' : active ? 'secondary' : 'sun'}
                  disabled={active}
                  loading={checkout.isPending && checkout.variables === p.id}
                  onClick={() => checkout.mutate(p.id)}
                  className="mt-6 w-full"
                >
                  {active ? 'Current plan' : `Switch to ${p.name}`}
                </Button>
              </div>
            </Stagger.Item>
          );
        })}
      </Stagger>

      <p className="text-center text-xs text-sand-500">
        Demo mode: plans switch without payment. Set <code className="rounded bg-sand-100 px-1 py-0.5 text-sand-600">STRIPE_SECRET_KEY</code> to enable real checkout (Israeli cards / Bit / PayBox via Stripe).
      </p>
    </div>
  );
}
