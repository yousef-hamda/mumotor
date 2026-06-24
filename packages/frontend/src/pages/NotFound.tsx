import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 overflow-hidden bg-sand-50 px-4 text-center">
      <div className="pointer-events-none absolute -top-20 h-96 w-96 rounded-full sun-glow animate-sun-pulse blur-2xl opacity-40" />
      <Logo size="lg" />
      <div className="relative">
        <h1 className="font-display text-8xl font-semibold tracking-tightest text-sand-950">404</h1>
        <p className="mt-4 text-sand-500 tracking-wide">This road doesn't lead anywhere.</p>
      </div>
      <Link to="/" className="btn-sun shine">
        Back home <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
