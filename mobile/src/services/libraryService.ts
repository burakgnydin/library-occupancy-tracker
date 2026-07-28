import apiClient from './apiClient';
import type {
  CheckInOutResult,
  CheckInRequest,
  CheckOutRequest,
  Library,
  LibraryQueryParams,
  MyCheckInStatus,
  PagedResult,
} from '../types/library';

export async function getLibraries(params: LibraryQueryParams): Promise<PagedResult<Library>> {
  const { data } = await apiClient.get<PagedResult<Library>>('/libraries', { params });
  return data;
}

export async function getLibraryById(libraryId: string): Promise<Library> {
  const { data } = await apiClient.get<Library>(`/libraries/${libraryId}`);
  return data;
}

// qrToken, QrScannerScreen'in kamerayla okuyup taşıdığı ham QR değeri - beklenen
// değerle karşılaştırma artık burada değil, backend'de yapılıyor (bkz.
// OccupancyService.CheckInAsync/CheckOutAsync); yanlış kod gönderilirse backend
// ValidationException (400) döner.
export async function checkIn(libraryId: string, qrToken: string): Promise<CheckInOutResult> {
  const payload: CheckInRequest = { qrToken };
  const { data } = await apiClient.post<CheckInOutResult>(`/libraries/${libraryId}/checkin`, payload);
  return data;
}

export async function checkOut(libraryId: string, qrToken: string): Promise<CheckInOutResult> {
  const payload: CheckOutRequest = { qrToken };
  const { data } = await apiClient.post<CheckInOutResult>(`/libraries/${libraryId}/checkout`, payload);
  return data;
}

// Sadece giris yapmis kullanicilar icin anlamli (backend [Authorize]) - cagiran
// taraf (LibraryDetailScreen) isAuthenticated degilse bu fonksiyonu hic cagirmamali.
export async function getMyCheckInStatus(): Promise<MyCheckInStatus> {
  const { data } = await apiClient.get<MyCheckInStatus>('/libraries/checkin-status');
  return data;
}
