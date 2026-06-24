import type { ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check, CreditCard, Sparkles, Zap } from 'lucide-react';
import { apiError, subscriptionApi } from '../../lib/api';
import { Button, CenteredSpinner } from '../../components/ui';
import { FadeUp, Stagger } from '../../components/motion';
import { cn } from '../../lib/utils';

/** Map plan id → icon + accent color for the icon tile */
const planMeta: Record<string, { icon: ReactNode; accent: string }> = {
  FREE: {
    icon: <Zap className="h-5 w-5" />,
    accent: 'bg-sand-100 text-sand-600',
  },
  PRO: {
    icon: <Sparkles className="h-5 w-5" />,
    accent: 'bg-sun-100 text-sun-700',
  },
  STUDIO: {
    icon: <CreditCard className="h-5 w-5" />,
    accent: 'bg-sand-900 text-sand-100',
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

  // PRO is the recommended (middle) plan
  const recommended = 'PRO';

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <FadeUp>
        <div>
          <p className="section-eyebrow">
            <CreditCard className="h-3.5 w-3.5 text-sun-500" /> Billing
          </p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tightest text-sand-950">
            Plans &amp; billing
          </h1>
          <p className="mt-1 text-sand-500">
            You're on the <span className="font-semibold text-sand-800">{current}</span> plan.
          </p>
        </div>
      </FadeUp>

      <Stagger className="grid gap-5 md:grid-cols-3" gap={0.1}>
        {data.plans.map((p) => {
          const active = p.id === current;
          const isRecommended = p.id === recommended;
          const meta = planMeta[p.id] ?? { icon: <Zap className="h-5 w-5" />, accent: 'bg-sand-100 text-sand-600' };

          return (
            <Stagger.Item key={p.id}>
              {/* Recommended plan gets a gradient ring via an outer wrapper */}
              <div
                className={cn(
                  'relative rounded-3xl transition-all duration-300',
                  isRecommended
                    ? 'p-px bg-gradient-to-b from-sun-300 to-sun-500/50 shadow-[0_0_32px_-8px_rgba(251,199,74,0.25)]'
                    : 'border border-sand-200/80'
                )}
              >
                {isRecommended && (
                  <span className="absolute -top-3 start-1/2 -translate-x-1/2 chip border border-sun-300/60 bg-white text-sun-700 shadow-sm text-[10px] uppercase tracking-widest px-3 py-1">
                    Recommended
                  </span>
                )}

                <div
                  className={cn(
                    'relative flex h-full flex-col rounded-3xl bg-white p-6',
                    active && !isRecommended && 'border-2 border-sand-900',
                    isRecommended && 'rounded-[calc(1.5rem-1px)]'
                  )}
                >
                  {/* Decorative glow for recommended */}
                  {isRecommended && (
                    <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full sun-glow opacity-50 blur-2xl" />
                  )}

                  <div className="flex items-center justify-between">
                    <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl', meta.accent)}>
                      {meta.icon}
                    </span>
                    {active && (
                      <span className="chip bg-sand-900 text-white text-[10px] uppercase tracking-wider">
                        Current
                      </span>
                    )}
                  </div>

                  <h3 className="mt-4 font-display text-xl font-semibold tracking-tight text-sand-950">{p.name}</h3>

                  <p className="mt-2 flex items-baseline gap-1">
                    <span className="font-display text-4xl font-semibold tracking-tightest text-sand-950">
                      ${p.price}
                    </span>
                    <span className="text-xs font-medium text-sand-400">/mo</span>
                  </p>

                  <ul className="mt-5 flex-1 space-y-2.5">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-sand-600">
                        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <Check className="h-2.5 w-2.5 text-emerald-700" />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={isRecommended && !active ? 'sun' : active ? 'secondary' : 'primary'}
                    disabled={active}
                    loading={checkout.isPending && checkout.variables === p.id}
                    onClick={() => checkout.mutate(p.id)}
                    className="mt-6 w-full"
                  >
                    {active ? 'Current plan' : `Switch to ${p.name}`}
                  </Button>
                </div>
              </div>
            </Stagger.Item>
          );
        })}
      </Stagger>

      <p className="text-center text-xs text-sand-400">
        Demo mode: plans switch without payment. Set <code className="rounded bg-sand-100 px-1 py-0.5 text-sand-600">STRIPE_SECRET_KEY</code> to enable real checkout (Israeli cards / Bit / PayBox via Stripe).
      </p>
    </div>
  );
}
