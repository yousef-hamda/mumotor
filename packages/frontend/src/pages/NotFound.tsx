import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="glass flex w-full max-w-md flex-col items-center gap-6 rounded-2xl px-8 py-12">
        <Logo size="lg" />
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-accent-600">Error 404</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-sand-900 sm:text-5xl">Page not found</h1>
          <p className="mx-auto mt-3 max-w-sm text-sand-600 leading-relaxed">
            The page you’re looking for doesn’t exist or may have moved.
          </p>
        </div>
        <Link to="/" className="btn-primary">
          Back home <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
