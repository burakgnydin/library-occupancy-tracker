import { useRef, useState } from 'react';

import Badge from '../components/Badge';
import ConfirmDialog from '../components/ConfirmDialog';
import DashboardLayout from '../components/DashboardLayout';
import LibraryFormModal from '../components/LibraryFormModal';
import Pagination from '../components/Pagination';
import QrCodeModal from '../components/QrCodeModal';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { usePagedList } from '../hooks/usePagedList';
import { deleteLibrary, getLibraries } from '../services/libraryService';
import { getApiErrorMessage } from '../utils/apiError';
import type { Library, LibraryQueryParams, OccupancyStatus } from '../types/library';

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const OCCUPANCY_STYLES: Record<OccupancyStatus, { label: string; color: 'success' | 'warning' | 'danger' }> = {
  Low: { label: 'Az yoğun', color: 'success' },
  Medium: { label: 'Orta yoğun', color: 'warning' },
  High: { label: 'Çok yoğun', color: 'danger' },
};

type FormModalState = { mode: 'create' } | { mode: 'edit'; library: Library } | null;

export default function LibrariesPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const debouncedCity = useDebouncedValue(city, SEARCH_DEBOUNCE_MS);
  const debouncedDistrict = useDebouncedValue(district, SEARCH_DEBOUNCE_MS);

  const [pageNumber, setPageNumber] = useState(1);

  const [formModal, setFormModal] = useState<FormModalState>(null);
  const [qrModalLibrary, setQrModalLibrary] = useState<Library | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Library | null>(null);

  // Debounce edilmis filtreler degistiginde ilk sayfaya donmek gerekir (aksi halde
  // artik var olmayan bir sayfada kalinabilir) - bunu render SIRASINDA (bir useEffect
  // icinde degil) yapiyoruz ki asagidaki usePagedList, sayfa numarasi 1'e donmeden
  // ONCE eski sayfa + yeni filtrelerle bosa bir istek atmasin (React'in "render
  // sirasinda state ayarlama" deseni - bkz. React dokumantasyonu "Adjusting state
  // when a prop changes"). Sadece rol filtresi gibi debounce edilmeyen alanlar icin
  // (StaffPage'deki gibi) bu senkron olarak zaten dogrudan onChange'te yapilabilir;
  // debounce edilen alanlar icin bu render-zamani duzeltmesi gerekiyor.
  const filterKey = `${debouncedSearch}|${debouncedCity}|${debouncedDistrict}`;
  const prevFilterKeyRef = useRef(filterKey);
  if (prevFilterKeyRef.current !== filterKey) {
    prevFilterKeyRef.current = filterKey;
    if (pageNumber !== 1) {
      setPageNumber(1);
    }
  }

  const params: LibraryQueryParams = {
    search: debouncedSearch.trim() || undefined,
    city: debouncedCity.trim() || undefined,
    district: debouncedDistrict.trim() || undefined,
    pageNumber,
    pageSize: PAGE_SIZE,
  };

  const {
    data: items,
    isLoading,
    error,
    totalPages,
    totalCount,
    refetch: fetchLibraries,
  } = usePagedList(getLibraries, params, 'Kütüphaneler yüklenemedi.');

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
    <Pagination currentPage={pageNumber} totalPages={totalPages} totalCount={totalCount} onPageChange={setPageNumber} itemLabel="kütüphane" />
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

        {paginationControls}

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
                        <Badge label={`%${library.occupancyPercentage} · ${status.label}`} color={status.color} />
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

        {paginationControls}
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
