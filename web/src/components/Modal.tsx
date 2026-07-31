import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  maxWidthClassName?: string;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

// LibraryFormModal, QrCodeModal ve ConfirmDialog'un ortak kabugu (backdrop +
// Esc ile kapama + ortalanmis kart) - ikisi de kendi icerigini `children`
// olarak verir, boylece overlay/kapama mantigi tek yerde kalir.
//
// Erisilebilirlik: container'a role="dialog"/aria-modal/aria-labelledby
// ekleniyor, acilista focus modal icine tasiniyor, Tab ile focus modal
// disina cikmiyor (basit bir trap), kapanista focus modali acan elemana
// geri donuyor.
export default function Modal({ title, onClose, children, maxWidthClassName = 'max-w-lg' }: ModalProps) {
  const titleId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  // Acilista: onceki aktif elemani hatirla (kapanista geri donmek icin) ve
  // focus'u modal icindeki ilk odaklanabilir elemana tasi (yoksa container'in
  // kendisine - bu yuzden container'a tabIndex={-1} verildi).
  useEffect(() => {
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    const firstFocusable = container?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (firstFocusable ?? container)?.focus();

    return () => {
      const previouslyFocused = previouslyFocusedElementRef.current;
      // Normal kapanista (Esc/backdrop/X butonu) bu element hala DOM'dadir - ama modal,
      // sayfa navigasyonuyla (orn. tarayici geri/ileri tuşu) birlikte unmount olduysa,
      // tetikleyici element de (orn. "+ Yeni Kutuphane Ekle" butonu) AYNI ANDA DOM'dan
      // kaldiriliyor olabilir. Kopmus (detached) bir node'a focus() cagirmak sessizce
      // no-op'tur - odak document.body'de kalir, klavye kullanicisi hicbir yere
      // odaklanmamis olur. document.contains ile once bunu kontrol edip, artik DOM'da
      // degilse yeni sayfada mantikli bir yere (main icerik alani) dusuyoruz.
      if (previouslyFocused && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
        return;
      }

      const main = document.querySelector<HTMLElement>('main');
      if (main) {
        if (!main.hasAttribute('tabindex')) {
          main.setAttribute('tabindex', '-1');
        }
        main.focus();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const container = containerRef.current;
      if (!container) return;

      const focusableElements = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const isFocusInsideModal = container.contains(document.activeElement);

      // Basit focus trap: son elemandan ileri Tab -> ilke don, ilk elemandan
      // geri (Shift+Tab) -> sona don. Focus bir sekilde modal disina cikmissa
      // (beklenmedik durum) da onu ilk/son elemana geri cekiyoruz.
      if (event.shiftKey) {
        if (!isFocusInsideModal || document.activeElement === first) {
          event.preventDefault();
          last.focus();
        }
      } else {
        if (!isFocusInsideModal || document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`w-full ${maxWidthClassName} rounded-2xl bg-surface p-6 shadow-xl`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 id={titleId} className="text-lg font-bold text-ink">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1 text-ink-faint transition hover:bg-background hover:text-ink"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
