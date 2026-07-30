import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary-light">
        <span className="text-2xl font-bold text-primary">404</span>
      </div>
      <h1 className="text-xl font-bold text-ink">Sayfa Bulunamadı</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-muted">
        Aradığınız sayfa taşınmış, kaldırılmış ya da hiç var olmamış olabilir.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark"
      >
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
