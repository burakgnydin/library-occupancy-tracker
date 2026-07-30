import { useEffect, useState } from 'react';

// LibrariesPage'in 3 arama alani (isim/sehir/ilce) ve StaffPage'in arama alaninda
// tekrarlanan "her tusla istek atmamak icin debounce" deseninin genellestirilmis hali
// (mobile/src/screens/LibraryListScreen.tsx'teki ayni mantik) - value her degistiginde
// bir zamanlayici baslatir, delayMs boyunca yeni bir degisiklik gelmezse debounced degeri
// gunceller.
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(timeoutId);
  }, [value, delayMs]);

  return debouncedValue;
}
