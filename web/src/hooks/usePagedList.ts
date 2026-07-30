import { useCallback, useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '../utils/apiError';
import type { PagedResult } from '../types/library';

interface UsePagedListResult<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  totalPages: number;
  totalCount: number;
  refetch: () => void;
}

// LibrariesPage/StaffPage'in fetchLibraries/fetchUsers'inda tekrarlanan
// "setIsLoading(true) -> await -> setData/setTotalPages/setTotalCount -> catch -> finally
// setIsLoading(false)" iskeletinin genellestirilmis hali. params her render'da yeni bir
// obje literali olarak gecilebilir (caller kendi useMemo/useCallback'iyle sabitlemek
// zorunda degil) - JSON.stringify(params) yeniden-cekme tetigi olarak kullanilir, boylece
// sadece params'in GERCEK icerigi degistiginde yeni bir istek atilir, referans degisikligi
// tek basina tetiklemez.
export function usePagedList<T, P>(
  fetchFn: (params: P) => Promise<PagedResult<T>>,
  params: P,
  errorFallback: string,
): UsePagedListResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // fetchFn/params'in EN GUNCEL halini ref'te tutuyoruz ki asagidaki refetch'in
  // bagimlilik dizisi sadece params'in serilestirilmis icerigine (paramsKey) bagli
  // kalsin - refetch'in kendisi kararli bir referans olarak disariya donuyor (caller
  // bir mutasyon sonrasi elle cagirabilir, tipki eski fetchLibraries()/fetchUsers()
  // gibi), ama her zaman en guncel params'i kullanir.
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;
  const paramsRef = useRef(params);
  paramsRef.current = params;

  const paramsKey = JSON.stringify(params);

  const refetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    fetchFnRef
      .current(paramsRef.current)
      .then((result) => {
        setData(result.items);
        setTotalPages(result.totalPages);
        setTotalCount(result.totalCount);
      })
      .catch((err: unknown) => {
        setError(getApiErrorMessage(err, errorFallback));
      })
      .finally(() => {
        setIsLoading(false);
      });
    // paramsKey, params'in kendisi yerine bilerek kullaniliyor - bkz. yukaridaki not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, errorFallback]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, isLoading, error, totalPages, totalCount, refetch };
}
