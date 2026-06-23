import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Check } from 'lucide-react';
import { apiError, subscriptionApi } from '../../lib/api';
import { Button, CenteredSpinner } from '../../components/ui';
import { cn } from '../../lib/utils';

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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & plans</h1>
        <p className="text-zinc-500">You're on the <span className="font-semibold text-zinc-800">{current}</span> plan.</p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {data.plans.map((p) => {
          const active = p.id === current;
          return (
            <div key={p.id} className={cn('rounded-2xl border bg-white p-6', active ? 'border-zinc-900 shadow-elevated' : 'border-zinc-200')}>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">{p.name}</h3>
                {active && <span className="chip bg-zinc-900 text-white">Current</span>}
              </div>
              <p className="mt-2 text-3xl font-bold tracking-tight">
                ${p.price}<span className="text-base font-normal text-zinc-400">/mo</span>
              </p>
              <ul className="mt-5 space-y-2.5">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-zinc-600">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                variant={active ? 'secondary' : 'primary'}
                disabled={active}
                loading={checkout.isPending && checkout.variables === p.id}
                onClick={() => checkout.mutate(p.id)}
                className="mt-6 w-full"
              >
                {active ? 'Current plan' : `Switch to ${p.name}`}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs text-zinc-400">
        Demo mode: plans switch without payment. Set <code>STRIPE_SECRET_KEY</code> to enable real checkout (Israeli cards / Bit / PayBox via Stripe).
      </p>
    </div>
  );
}
