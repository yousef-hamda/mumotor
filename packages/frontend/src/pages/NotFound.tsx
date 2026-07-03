import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-7 bg-white px-6 text-center">
      <Link to="/" aria-label="Mumotor home"><Logo size="lg" /></Link>
      <div>
        <p className="text-sm font-medium text-sand-500">Error 404</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-sand-900 sm:text-5xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-sm text-lg text-sand-600 leading-relaxed">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
      </div>
      <Link to="/" className="btn-primary">
        Back home <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}
