import { useState } from 'react';

import Modal from './Modal';
import { getQrCodeUrl } from '../services/libraryService';
import type { Library } from '../types/library';

interface QrCodeModalProps {
  library: Library;
  onClose: () => void;
}

export default function QrCodeModal({ library, onClose }: QrCodeModalProps) {
  const qrCodeUrl = getQrCodeUrl(library.id);
  const [isDownloading, setIsDownloading] = useState(false);

  // <a download> baska bir origin'deki (5200 vs 5173) kaynaklarda tarayici
  // tarafindan yok sayilir - CORS/same-origin kisitlamasi yuzunden tarayici
  // "indirme" yerine "yeni sekmede ac/navigate et" davranisina duser. Bunun
  // yerine PNG'yi fetch ile blob olarak cekip, ondan bir object URL uretip
  // programatik olarak tikliyoruz - boylece gercek dosya indirmesi tetiklenir.
  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${library.name}-qr-kod.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.alert('QR kodu indirilemedi. Lütfen tekrar deneyin.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal title="QR Kodu" onClose={onClose} maxWidthClassName="max-w-sm">
      <div className="flex flex-col items-center gap-4">
        <p className="text-center text-sm text-ink-muted">{library.name}</p>

        <div className="rounded-2xl border border-border bg-white p-4">
          <img src={qrCodeUrl} alt={`${library.name} QR kodu`} width={240} height={240} />
        </div>

        <div className="flex w-full gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isDownloading}
            className="flex-1 rounded-xl border border-border px-4 py-2.5 text-center text-sm font-medium text-ink-muted transition hover:bg-background disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isDownloading ? 'İndiriliyor...' : 'İndir'}
          </button>
          <button
            type="button"
            onClick={() => window.open(qrCodeUrl, '_blank', 'noopener,noreferrer')}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-primary/25 transition hover:bg-primary-dark"
          >
            Yazdır
          </button>
        </div>
      </div>
    </Modal>
  );
}
