import Modal from './Modal';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  // Silme gibi geri donduruemez islemlerde onay butonunu kirmizi (danger)
  // yapar - varsayilan false, normal (primary renkli) bir onaydir.
  isDangerous?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// Mevcut Modal kabugunu temel alir (backdrop + Esc ile kapama + X butonu) -
// kod tekrarini onlemek icin sadece icerigi (mesaj + iki buton) ekliyor.
// window.confirm() yerine LibrariesPage/StaffPage'deki silme aksiyonlarinda
// kullaniliyor.
export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  isDangerous = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal title={title} onClose={onCancel} maxWidthClassName="max-w-sm">
      <p className="text-sm text-ink-muted">{message}</p>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-ink-muted transition hover:bg-background"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
            isDangerous
              ? 'bg-danger shadow-danger/25 hover:bg-danger/90'
              : 'bg-primary shadow-primary/25 hover:bg-primary-dark'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
