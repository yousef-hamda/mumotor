import { Link } from 'react-router-dom';
import { Logo } from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-zinc-50 px-4 text-center">
      <Logo size="lg" />
      <div>
        <h1 className="text-5xl font-bold tracking-tight text-zinc-900">404</h1>
        <p className="mt-2 text-zinc-500">This road doesn't lead anywhere.</p>
      </div>
      <Link to="/" className="btn-primary">
        Back home
      </Link>
    </div>
  );
}
