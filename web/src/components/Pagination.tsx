interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  // Varsayilan "kayit" jenerik - LibrariesPage/StaffPage kendi ismini (kutuphane/kullanici)
  // gecerek orijinal metni korur, bu prop olmadan da bileşen tek basina anlamli kalir.
  itemLabel?: string;
}

// LibrariesPage ve StaffPage'de neredeyse birebir tekrarlanan "Toplam X kayit" +
// Onceki/Sayfa Y-Z/Sonraki blogu.
export default function Pagination({ currentPage, totalPages, totalCount, onPageChange, itemLabel = 'kayıt' }: PaginationProps) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <p className="text-sm text-ink-muted">
        Toplam <span className="font-semibold text-ink">{totalCount}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          Önceki
        </button>
        <span className="text-sm font-medium text-ink">
          Sayfa {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink-muted transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sonraki
        </button>
      </div>
    </div>
  );
}
