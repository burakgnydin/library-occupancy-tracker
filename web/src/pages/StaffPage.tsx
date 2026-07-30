import { useRef, useState } from 'react';
import type { FormEvent } from 'react';

import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import DashboardLayout from '../components/DashboardLayout';
import FormInput from '../components/FormInput';
import Pagination from '../components/Pagination';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePagedList } from '../hooks/usePagedList';
import { createStaff, deleteUser, getUsers, updateUserRole } from '../services/userService';
import { useAuthStore } from '../store/authStore';
import { getApiErrorMessage } from '../utils/apiError';
import type { UserRole } from '../types/auth';
import { ROLE_LABELS } from '../types/auth';
import type { StaffRole, User, UserQueryParams } from '../types/user';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const ROLE_BADGE_COLOR: Record<UserRole, 'accent' | 'primary' | 'neutral'> = {
  SuperAdmin: 'accent',
  Admin: 'primary',
  User: 'neutral',
};

const emptyForm = {
  fullName: '',
  email: '',
  password: '',
  role: 'Admin' as StaffRole,
};

export default function StaffPage() {
  const currentUserId = useAuthStore((state) => state.userId);

  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');

  const [pageNumber, setPageNumber] = useState(1);

  // Debounce edilen arama alani icin, filtre gercekten degistiginde ilk sayfaya
  // render SIRASINDA donuyoruz (bkz. LibrariesPage'deki ayni desen/yorum) - rol
  // filtresi debounce edilmedigi icin kendi onChange'inde zaten senkron sifirlaniyor.
  const prevDebouncedSearchRef = useRef(debouncedSearch);
  if (prevDebouncedSearchRef.current !== debouncedSearch) {
    prevDebouncedSearchRef.current = debouncedSearch;
    if (pageNumber !== 1) {
      setPageNumber(1);
    }
  }

  const params: UserQueryParams = {
    search: debouncedSearch.trim() || undefined,
    role: roleFilter || undefined,
    pageNumber,
    pageSize: PAGE_SIZE,
  };

  const {
    data: items,
    isLoading: isLoadingList,
    error: listError,
    totalPages,
    totalCount,
    refetch: fetchUsers,
  } = usePagedList(getUsers, params, 'Kullanıcılar yüklenemedi.');

  // Hangi satirin islemi (rol degistirme/silme) su an surdugunu tutar - ayni
  // anda sadece o satirin dropdown'u/butonu devre disi kalir, tum tabloyu
  // kilitlemeye gerek yok.
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);

  const handleRoleChange = async (user: User, newRole: UserRole) => {
    if (newRole === user.role) return;
    setProcessingUserId(user.id);
    try {
      await updateUserRole(user.id, newRole);
      fetchUsers();
    } catch (err) {
      // Normalde UI zaten kendi hesabina bu islemi hic sunmuyor (dropdown
      // devre disi) - ama backend'in kendi 403 korumasi (UpdateRoleAsync)
      // baska bir sebeple (orn. arka planda rol degismisse) tetiklenirse
      // yine de kullaniciya gorunur olsun diye.
      window.alert(getApiErrorMessage(err, 'Rol güncellenemedi.'));
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteTarget) return;
    const user = deleteTarget;
    setDeleteTarget(null);

    setProcessingUserId(user.id);
    try {
      await deleteUser(user.id);
      if (items.length === 1 && pageNumber > 1) {
        setPageNumber((prev) => prev - 1);
      } else {
        fetchUsers();
      }
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'Kullanıcı silinemedi.'));
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);

    try {
      const created = await createStaff(form);
      setSuccessMessage(`${created.fullName} kullanıcısı başarıyla oluşturuldu, rolü: ${ROLE_LABELS[form.role]}.`);
      setForm({ ...emptyForm, role: form.role });
      fetchUsers();
    } catch (err) {
      setFormError(getApiErrorMessage(err, 'Kullanıcı oluşturulamadı. Lütfen tekrar deneyin.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light';

  return (
    <DashboardLayout title="Kullanıcılar">
      <div className="max-w-xl rounded-2xl border border-border bg-surface p-8 shadow-sm">
        <h2 className="text-lg font-bold text-ink">Yeni Yönetici / Kullanıcı Oluştur</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Buradan oluşturulan hesaplar doğrudan giriş yapabilir hale gelir.
        </p>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <FormInput
            label="Ad Soyad"
            required
            maxLength={200}
            value={form.fullName}
            onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
          />

          <FormInput
            label="E-posta"
            type="email"
            required
            maxLength={256}
            autoComplete="off"
            value={form.email}
            onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
          />

          <FormInput
            label="Şifre"
            type="password"
            required
            minLength={6}
            maxLength={72}
            autoComplete="new-password"
            value={form.password}
            onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
          />

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Rol
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value as StaffRole }))}
              className={inputClassName}
            >
              <option value="Admin">{ROLE_LABELS.Admin}</option>
              <option value="User">{ROLE_LABELS.User}</option>
            </select>
          </label>

          {formError ? (
            <div className="rounded-xl border border-danger bg-danger-light px-3.5 py-2.5 text-sm font-medium text-danger">
              {formError}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-xl border border-success bg-success-light px-3.5 py-2.5 text-sm font-medium text-success">
              {successMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Oluşturuluyor...' : 'Oluştur'}
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <h2 className="text-base font-bold text-ink">Tüm Kullanıcılar</h2>
          <div className="flex flex-wrap gap-3">
            <input
              placeholder="İsim veya e-posta ara..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-56 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
            />
            <select
              value={roleFilter}
              onChange={(event) => {
                setRoleFilter(event.target.value as UserRole | '');
                setPageNumber(1);
              }}
              className="rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
            >
              <option value="">Tüm Roller</option>
              <option value="SuperAdmin">{ROLE_LABELS.SuperAdmin}</option>
              <option value="Admin">{ROLE_LABELS.Admin}</option>
              <option value="User">{ROLE_LABELS.User}</option>
            </select>
          </div>
        </div>

        <Pagination currentPage={pageNumber} totalPages={totalPages} totalCount={totalCount} onPageChange={setPageNumber} itemLabel="kullanıcı" />

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3">Ad Soyad</th>
                <th className="px-5 py-3">E-posta</th>
                <th className="px-5 py-3">Rol</th>
                <th className="px-5 py-3">Oluşturulma Tarihi</th>
                <th className="px-5 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingList ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink-muted">
                    Yükleniyor...
                  </td>
                </tr>
              ) : listError ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center">
                    <p className="mb-3 text-sm font-medium text-danger">{listError}</p>
                    <button
                      type="button"
                      onClick={fetchUsers}
                      className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-ink-muted hover:bg-background"
                    >
                      Tekrar Dene
                    </button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-ink-muted">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                items.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isProcessing = processingUserId === user.id;
                  return (
                    <tr key={user.id} className="border-b border-border last:border-b-0 hover:bg-background">
                      <td className="px-5 py-3.5 font-medium text-ink">{user.fullName}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{user.email}</td>
                      <td className="px-5 py-3.5">
                        <Badge label={ROLE_LABELS[user.role]} color={ROLE_BADGE_COLOR[user.role]} />
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">
                        {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {isSelf ? (
                            <span className="text-xs text-ink-faint">Bu sizin hesabınız</span>
                          ) : (
                            <>
                              <select
                                value={user.role}
                                disabled={isProcessing}
                                onChange={(event) => handleRoleChange(user, event.target.value as UserRole)}
                                className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                <option value="SuperAdmin">{ROLE_LABELS.SuperAdmin}</option>
                                <option value="Admin">{ROLE_LABELS.Admin}</option>
                                <option value="User">{ROLE_LABELS.User}</option>
                              </select>
                              <button
                                type="button"
                                disabled={isProcessing}
                                onClick={() => setDeleteTarget(user)}
                                className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-light disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Sil
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 max-w-xl text-xs text-ink-faint">
        Not: Bu liste sadece SuperAdmin'e görünür (backend'de{' '}
        <code className="rounded bg-background px-1 py-0.5">GET /api/users</code> endpoint'i SuperAdminOnly
        politikasıyla korunuyor).
      </p>

      {deleteTarget ? (
        <ConfirmDialog
          title="Kullanıcıyı Sil"
          message={`"${deleteTarget.fullName}" kullanıcısını silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          isDangerous
          onConfirm={handleConfirmDeleteUser}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </DashboardLayout>
  );
}
