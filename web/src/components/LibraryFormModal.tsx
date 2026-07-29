import { useState } from 'react';
import type { FormEvent } from 'react';

import Modal from './Modal';
import { createLibrary, updateLibrary } from '../services/libraryService';
import { getApiErrorMessage } from '../utils/apiError';
import type { Library, LibraryFormRequest } from '../types/library';

interface LibraryFormModalProps {
  library: Library | null; // null = yeni kayit, dolu = duzenleme
  onClose: () => void;
  onSuccess: (library: Library) => void;
}

const emptyForm: LibraryFormRequest = {
  name: '',
  address: '',
  city: '',
  district: '',
  capacity: 1,
};

export default function LibraryFormModal({ library, onClose, onSuccess }: LibraryFormModalProps) {
  const isEditMode = library !== null;

  const [form, setForm] = useState<LibraryFormRequest>(
    library
      ? {
          name: library.name,
          address: library.address,
          city: library.city,
          district: library.district,
          capacity: library.capacity,
        }
      : emptyForm,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = isEditMode ? await updateLibrary(library.id, form) : await createLibrary(form);
      onSuccess(result);
    } catch (err) {
      // Backend'in donduru hatalar (400 - eksik/gecersiz alan, 409 - ayni
      // isim+adres cakismasi) hep ayni { message } govdesinde geliyor -
      // dogrudan forma yansitiliyor.
      setError(getApiErrorMessage(err, 'İşlem başarısız oldu. Lütfen tekrar deneyin.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClassName =
    'rounded-xl border border-border bg-surface px-3.5 py-2.5 text-base text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-light';

  return (
    <Modal title={isEditMode ? 'Kütüphaneyi Düzenle' : 'Yeni Kütüphane Ekle'} onClose={onClose}>
      <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Kütüphane Adı
          <input
            required
            maxLength={200}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            className={inputClassName}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Adres
          <input
            required
            maxLength={300}
            value={form.address}
            onChange={(event) => setForm((prev) => ({ ...prev, address: event.target.value }))}
            className={inputClassName}
          />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            Şehir
            <input
              required
              maxLength={100}
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
              className={inputClassName}
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
            İlçe
            <input
              required
              maxLength={100}
              value={form.district}
              onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))}
              className={inputClassName}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Kapasite
          <input
            type="number"
            required
            min={1}
            value={form.capacity}
            onChange={(event) => setForm((prev) => ({ ...prev, capacity: Number(event.target.value) }))}
            className={inputClassName}
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-danger bg-danger-light px-3.5 py-2.5 text-sm font-medium text-danger">
            {error}
          </div>
        ) : null}

        <div className="mt-2 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-background"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Kaydediliyor...' : isEditMode ? 'Kaydet' : 'Ekle'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
