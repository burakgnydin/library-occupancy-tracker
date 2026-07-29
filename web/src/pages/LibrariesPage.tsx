import { useCallback, useEffect, useState } from 'react';

import ConfirmDialog from '../components/ConfirmDialog';
import DashboardLayout from '../components/DashboardLayout';
import LibraryFormModal from '../components/LibraryFormModal';
import QrCodeModal from '../components/QrCodeModal';
import { deleteLibrary, getLibraries } from '../services/libraryService';
import { getApiErrorMessage } from '../utils/apiError';
import type { Library, OccupancyStatus } from '../types/library';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const OCCUPANCY_STYLES: Record<OccupancyStatus, { label: string; className: string }> = {
  Low: { label: 'Az yoğun', className: 'border-success bg-success-light text-success' },
  Medium: { label: 'Orta yoğun', className: 'border-warning bg-warning-light text-warning' },
  High: { label: 'Çok yoğun', className: 'border-danger bg-danger-light text-danger' },
};

type FormModalState = { mode: 'create' } | { mode: 'edit'; library: Library } | null;

export default function LibrariesPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [debouncedFilters, setDebouncedFilters] = useState({ search: '', city: '', district: '' });

  const [items, setItems] = useState<Library[]>([]);
  const [pageNumber, setPageNumber] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [qrModalLibrary, setQrModalLibrary] = useState<Library | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Library | null>(null);

  // Arama/sehir/ilce kutularina yazarken her tusla istek atmamak icin
  // debounce - LibraryListScreen'deki (mobil) ayni desen.
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters({ search: search.trim(), city: city.trim(), district: district.trim() });
      setPageNumber(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeoutId);
  }, [search, city, district]);

  const fetchLibraries = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getLibraries({
        search: debouncedFilters.search || undefined,
        city: debouncedFilters.city || undefined,
        district: debouncedFilters.district || undefined,
        pageNumber,
        pageSize: PAGE_SIZE,
      });
      setItems(result.items);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Kütüphaneler yüklenemedi.'));
    } finally {
      setIsLoading(false);
    }
  }, [debouncedFilters, pageNumber]);

  useEffect(() => {
    fetchLibraries();
  }, [fetchLibraries]);

  const handleFormSuccess = () => {
    setFormModal(null);
    fetchLibraries();
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    // Diyalogu hemen kapatiyoruz (cift tiklamayi/asilı kalmis bir onay
    // ekranini onlemek icin) - silme basarisiz olursa hata window.alert ile
    // ayrica gosteriliyor.
    setDeleteTarget(null);

    try {
      await deleteLibrary(target.id);
      // Sayfadaki tek kayit silindiyse ve ilk sayfa degilse, bir onceki
      // sayfaya don - aksi halde bos bir sayfada kalinir.
      if (items.length === 1 && pageNumber > 1) {
        setPageNumber((prev) => prev - 1);
      } else {
        fetchLibraries();
      }
    } catch (err) {
      window.alert(getApiErrorMessage(err, 'Silme işlemi başarısız oldu.'));
    }
  };

  const paginationControls = (
    <div className="flex items-center justify-between px-1 py-3">
      <p className="text-sm text-ink-muted">
        Toplam <span className="font-semibold text-ink">{totalCount}</span> kütüphane
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={pageNumber <= 1}
          onClick={() => setPageNumber((prev) => prev - 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          Önceki
        </button>
        <span className="text-sm font-medium text-ink">
          Sayfa {pageNumber} / {totalPages}
        </span>
        <button
          type="button"
          disabled={pageNumber >= totalPages}
          onClick={() => setPageNumber((prev) => prev + 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sonraki
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout title="Kütüphaneler">
      <div className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-5">
          <div className="flex flex-wrap gap-3">
            <input
              placeholder="İsim ara..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-48 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
            />
            <input
              placeholder="Şehir"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              className="w-36 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
            />
            <input
              placeholder="İlçe"
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              className="w-36 rounded-xl border border-border bg-surface px-3.5 py-2 text-sm text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light"
            />
          </div>

          <button
            type="button"
            onClick={() => setFormModal({ mode: 'create' })}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark"
          >
            + Yeni Kütüphane Ekle
          </button>
        </div>

        <div className="px-5">{paginationControls}</div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3">Ad</th>
                <th className="px-5 py-3">Adres</th>
                <th className="px-5 py-3">Şehir / İlçe</th>
                <th className="px-5 py-3">Kapasite</th>
                <th className="px-5 py-3">Doluluk</th>
                <th className="px-5 py-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-muted">
                    Yükleniyor...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <p className="mb-3 text-sm font-medium text-danger">{error}</p>
                    <button
                      type="button"
                      onClick={fetchLibraries}
                      className="rounded-lg border border-border px-3.5 py-1.5 text-sm font-medium text-ink-muted hover:bg-background"
                    >
                      Tekrar Dene
                    </button>
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-ink-muted">
                    Kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                items.map((library) => {
                  const status = OCCUPANCY_STYLES[library.occupancyStatus];
                  return (
                    <tr key={library.id} className="border-b border-border last:border-b-0 hover:bg-background">
                      <td className="px-5 py-3.5 font-medium text-ink">{library.name}</td>
                      <td className="px-5 py-3.5 text-ink-muted">{library.address}</td>
                      <td className="px-5 py-3.5 text-ink-muted">
                        {library.district} / {library.city}
                      </td>
                      <td className="px-5 py-3.5 text-ink-muted">{library.capacity}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}>
                          %{library.occupancyPercentage} · {status.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setQrModalLibrary(library)}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-background"
                          >
                            QR Kodu
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormModal({ mode: 'edit', library })}
                            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-ink-muted transition hover:bg-background"
                          >
                            Düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(library)}
                            className="rounded-lg border border-danger/30 px-3 py-1.5 text-xs font-medium text-danger transition hover:bg-danger-light"
                          >
                            Sil
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5">{paginationControls}</div>
      </div>

      {formModal ? (
        <LibraryFormModal
          library={formModal.mode === 'edit' ? formModal.library : null}
          onClose={() => setFormModal(null)}
          onSuccess={handleFormSuccess}
        />
      ) : null}

      {qrModalLibrary ? <QrCodeModal library={qrModalLibrary} onClose={() => setQrModalLibrary(null)} /> : null}

      {deleteTarget ? (
        <ConfirmDialog
          title="Kütüphaneyi Sil"
          message={`"${deleteTarget.name}" kütüphanesini silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`}
          confirmText="Sil"
          isDangerous
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      ) : null}
    </DashboardLayout>
  );
}
