import DashboardLayout from '../components/DashboardLayout';
import { useAuthStore } from '../store/authStore';
import { ROLE_LABELS } from '../types/auth';

// Yer tutucu ana sayfa - kutuphane/kullanici yonetimi ekranlari sonraki
// adimlarda DashboardLayout'u yeniden kullanarak buraya eklenecek.
export default function DashboardPage() {
  const role = useAuthStore((state) => state.role);

  return (
    <DashboardLayout title="Ana Sayfa">
      <div className="rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h2 className="text-xl font-bold text-ink">Hoş geldiniz{role ? `, ${ROLE_LABELS[role] ?? role}` : ''}</h2>
        <p className="mt-2 text-sm text-ink-muted">
          Kütüphane ve kullanıcı yönetimi ekranları yakında sol menüden erişilebilir olacak.
        </p>
      </div>
    </DashboardLayout>
  );
}
